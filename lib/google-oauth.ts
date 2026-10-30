import crypto from 'crypto';

// Google OAuth helpers. All network access goes through an injectable gateway
// so tests can run with zero real HTTP calls.

export const GOOGLE_OAUTH_STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// State is HMAC-signed (stateless) instead of cookie-based: the OAuth callback
// is a cross-site navigation where relying on a browser cookie is fragile
// (blocked/dropped cookies produced google_state_mismatch in production).
// Signed state verifies without any server storage and survives serverless
// multi-instance deployments.
function getStateSigningSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET is missing or too short. It must be at least 32 characters long.');
  }
  return secret;
}

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

export type GoogleGateway = (url: string, init?: RequestInit) => Promise<Response>;

export const defaultGateway: GoogleGateway = (url, init) => fetch(url, init);

export interface GoogleUserInfo {
  id?: string;
  email: string;
  verified_email?: boolean;
  name?: string;
  picture?: string;
}

export interface GoogleAdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
}

// Only reports fully-configured status — never leaks partial configuration.
export function isGoogleOAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function getGoogleOAuthConfig(clientId?: string, clientSecret?: string) {
  const id = clientId ?? process.env.GOOGLE_CLIENT_ID;
  const secret = clientSecret ?? process.env.GOOGLE_CLIENT_SECRET;
  if (!id || !secret) return null;
  return { clientId: id, clientSecret: secret };
}

export function generateOAuthState(nowMs: number = Date.now()): string {
  const nonce = crypto.randomBytes(16).toString('base64url');
  const expiresAtMs = nowMs + GOOGLE_OAUTH_STATE_TTL_MS;
  const payload = `${nonce}.${expiresAtMs}`;
  const sig = crypto.createHmac('sha256', getStateSigningSecret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyOAuthState(state: string | null | undefined, nowMs: number): boolean {
  if (!state) return false;
  const firstDot = state.indexOf('.');
  const lastDot = state.lastIndexOf('.');
  // nonce.expiresAt.sig — nonce/sig are base64url (no dots), expiresAt is digits.
  if (firstDot <= 0 || lastDot <= firstDot) return false;
  const payload = state.slice(0, lastDot);
  const sig = state.slice(lastDot + 1);
  const expiresAtMs = Number(payload.slice(firstDot + 1));
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= nowMs) return false;

  const expected = crypto.createHmac('sha256', getStateSigningSecret()).update(payload).digest();
  let actual: Buffer;
  try {
    actual = Buffer.from(sig, 'base64url');
  } catch {
    return false;
  }
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

export function getGoogleCallbackPath(): string {
  return '/api/admin/auth/google/callback';
}

export function buildGoogleAuthUrl(opts: { clientId: string; redirectUri: string; state: string }): string {
  const params = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: opts.state,
    prompt: 'select_account',
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleCode(
  opts: {
    code: string;
    redirectUri: string;
    clientId: string;
    clientSecret: string;
    gateway?: GoogleGateway;
  }
): Promise<{ access_token: string }> {
  const gateway = opts.gateway ?? defaultGateway;
  const body = new URLSearchParams({
    client_id: opts.clientId,
    client_secret: opts.clientSecret,
    code: opts.code,
    grant_type: 'authorization_code',
    redirect_uri: opts.redirectUri,
  });

  const res = await gateway(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${res.status}`);
  return (await res.json()) as { access_token: string };
}

export async function fetchGoogleUserInfo(accessToken: string, gateway: GoogleGateway = defaultGateway): Promise<GoogleUserInfo> {
  const res = await gateway(`${GOOGLE_USERINFO_URL}?access_token=${encodeURIComponent(accessToken)}`);
  if (!res.ok) throw new Error(`Google userinfo failed: ${res.status}`);
  return (await res.json()) as GoogleUserInfo;
}

export type GoogleCallbackError =
  | 'google_missing'
  | 'google_access_denied'
  | 'google_state_mismatch'
  | 'google_token_exchange_failed'
  | 'google_userinfo_failed'
  | 'google_unverified_email'
  | 'google_unauthorized';

export type GoogleCallbackResult =
  | { ok: true; admin: GoogleAdminUser; error?: undefined }
  | { ok: false; admin?: undefined; error: GoogleCallbackError };

// Pure orchestration of the callback: state check, code exchange, userinfo
// lookup, admin authorization. All side effects (session, cookies, audit log)
// stay in the route handler. All DB/network access is injected.
export async function processGoogleCallback(params: {
  code: string | null;
  state: string | null;
  googleError?: string | null;
  origin: string;
  gateway?: GoogleGateway;
  now?: () => Date;
  clientId?: string;
  clientSecret?: string;
  findAdminByEmail: (email: string) => Promise<GoogleAdminUser | null>;
}): Promise<GoogleCallbackResult> {
  const config = getGoogleOAuthConfig(params.clientId, params.clientSecret);
  if (!config) return { ok: false, error: 'google_missing' };

  // Google redirected back with an error (user declined, consent blocked, etc.)
  if (params.googleError) {
    return { ok: false, error: 'google_access_denied' };
  }

  const nowMs = (params.now ?? (() => new Date()))().getTime();
  if (!verifyOAuthState(params.state, nowMs)) {
    return { ok: false, error: 'google_state_mismatch' };
  }
  if (!params.code) {
    return { ok: false, error: 'google_state_mismatch' };
  }

  const redirectUri = `${params.origin}${getGoogleCallbackPath()}`;

  let accessToken: string;
  try {
    const tokens = await exchangeGoogleCode({
      code: params.code,
      redirectUri,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      gateway: params.gateway,
    });
    accessToken = tokens.access_token;
  } catch {
    return { ok: false, error: 'google_token_exchange_failed' };
  }

  let userInfo: GoogleUserInfo;
  try {
    userInfo = await fetchGoogleUserInfo(accessToken, params.gateway);
  } catch {
    return { ok: false, error: 'google_userinfo_failed' };
  }

  if (userInfo.verified_email !== true) {
    return { ok: false, error: 'google_unverified_email' };
  }

  const admin = await params.findAdminByEmail(userInfo.email.toLowerCase().trim());
  if (!admin || !admin.isActive) {
    return { ok: false, error: 'google_unauthorized' };
  }

  return { ok: true, admin };
}
