import crypto from 'crypto';

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const V2_PREFIX = 'v2';

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET is missing or too short.');
  }
  return secret;
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

function timingSafeEqualText(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

function parseAttachments(raw: string | null | undefined): Record<string, any> {
  try {
    const value = JSON.parse(raw || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

export function getApplicantUploadAccessId(attachmentsRaw: string | null | undefined): string | null {
  const attachments = parseAttachments(attachmentsRaw);
  const access = attachments._uploadAccess;
  const id = access && typeof access === 'object' ? access.id : null;
  return typeof id === 'string' && /^[A-Za-z0-9_-]{22,64}$/.test(id) ? id : null;
}

export function rotateApplicantUploadAccess(attachmentsRaw: string | null | undefined): {
  attachments: string;
  accessId: string;
} {
  const attachments = parseAttachments(attachmentsRaw);
  const accessId = crypto.randomBytes(18).toString('base64url');
  const previous = attachments._uploadAccess && typeof attachments._uploadAccess === 'object'
    ? attachments._uploadAccess
    : {};

  attachments._uploadAccess = {
    ...previous,
    id: accessId,
    issuedAt: new Date().toISOString(),
  };

  return {
    attachments: JSON.stringify(attachments),
    accessId,
  };
}

export function createApplicantUploadToken(
  applicationId: string,
  applicationNumber: string,
  accessId: string
): string {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = `upload.${V2_PREFIX}.${applicationId}.${applicationNumber}.${accessId}.${expiresAt}`;
  return `${V2_PREFIX}.${expiresAt}.${accessId}.${sign(payload)}`;
}

export function verifyApplicantUploadToken(
  token: string,
  applicationId: string,
  applicationNumber: string,
  currentAccessId: string | null
): boolean {
  const parts = token.split('.');

  if (parts.length === 4 && parts[0] === V2_PREFIX) {
    const [, expiresRaw, accessId, signature] = parts;
    const expiresAt = Number(expiresRaw);
    if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
    if (!currentAccessId || accessId !== currentAccessId) return false;

    const payload = `upload.${V2_PREFIX}.${applicationId}.${applicationNumber}.${accessId}.${expiresAt}`;
    return timingSafeEqualText(signature, sign(payload));
  }

  // Legacy links remain valid only until a v2 access id is first issued.
  if (currentAccessId) return false;

  const [expiresRaw, signature] = parts;
  if (!expiresRaw || !signature || parts.length !== 2) return false;

  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  const payload = `${applicationId}.${applicationNumber}.${expiresAt}`;
  return timingSafeEqualText(signature, sign(payload));
}

export function createApplicantUploadSessionToken(
  applicationId: string,
  applicationNumber: string,
  accessId: string | null
): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;

  if (!accessId) {
    const payload = `session.${applicationId}.${applicationNumber}.${expiresAt}`;
    return `${expiresAt}.${sign(payload)}`;
  }

  const payload = `session.${V2_PREFIX}.${applicationId}.${applicationNumber}.${accessId}.${expiresAt}`;
  return `${V2_PREFIX}.${expiresAt}.${accessId}.${sign(payload)}`;
}

export function verifyApplicantUploadSessionToken(
  token: string,
  applicationId: string,
  applicationNumber: string,
  currentAccessId: string | null
): boolean {
  const parts = token.split('.');

  if (parts.length === 4 && parts[0] === V2_PREFIX) {
    const [, expiresRaw, accessId, signature] = parts;
    const expiresAt = Number(expiresRaw);
    if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
    if (!currentAccessId || accessId !== currentAccessId) return false;

    const payload = `session.${V2_PREFIX}.${applicationId}.${applicationNumber}.${accessId}.${expiresAt}`;
    return timingSafeEqualText(signature, sign(payload));
  }

  // Legacy sessions remain valid only while the application has no v2 access id.
  if (currentAccessId) return false;

  const [expiresRaw, signature] = parts;
  if (!expiresRaw || !signature || parts.length !== 2) return false;

  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  const payload = `session.${applicationId}.${applicationNumber}.${expiresAt}`;
  return timingSafeEqualText(signature, sign(payload));
}

export const APPLICANT_UPLOAD_SESSION_TTL_SECONDS = Math.floor(SESSION_TTL_MS / 1000);
