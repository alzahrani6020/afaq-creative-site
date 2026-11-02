import crypto from 'crypto';

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

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

export function createApplicantUploadToken(applicationId: string, applicationNumber: string): string {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = `${applicationId}.${applicationNumber}.${expiresAt}`;
  return `${expiresAt}.${sign(payload)}`;
}

export function verifyApplicantUploadToken(
  token: string,
  applicationId: string,
  applicationNumber: string
): boolean {
  const [expiresRaw, signature] = token.split('.');
  if (!expiresRaw || !signature) return false;

  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  const payload = `${applicationId}.${applicationNumber}.${expiresAt}`;
  const expected = sign(payload);

  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return false;

  return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}
