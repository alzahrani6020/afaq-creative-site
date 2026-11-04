import crypto from 'crypto';

export const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

const V2_PREFIX = 'v2';

function getVerificationSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET is missing or too short.');
  }
  return secret;
}

function hmacHex(value: string): string {
  return crypto.createHmac('sha256', getVerificationSecret()).update(value).digest('hex');
}

function timingSafeHexEqual(actualHex: string, expectedHex: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(actualHex) || !/^[a-f0-9]{64}$/i.test(expectedHex)) return false;
  const actual = Buffer.from(actualHex, 'hex');
  const expected = Buffer.from(expectedHex, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export function createEmailVerificationCredential() {
  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  const linkSecret = crypto.randomBytes(32).toString('hex');
  const linkDigest = hmacHex(`email-verification-link:${V2_PREFIX}:${linkSecret}`);
  const codeDigest = hmacHex(`email-verification-code:${V2_PREFIX}:${linkDigest}:${code}`);

  return {
    code,
    token: `${V2_PREFIX}.${linkSecret}`,
    storedToken: `${V2_PREFIX}.${linkDigest}.${codeDigest}`,
    expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
  };
}

export function getEmailVerificationLookup(token: string):
  | { legacyToken: string }
  | { tokenPrefix: string }
  | null {
  if (/^\d{6}\.[a-f0-9]{64}$/i.test(token)) {
    return { legacyToken: token };
  }

  const match = token.match(/^v2\.([a-f0-9]{64})$/);
  if (!match) return null;

  const linkDigest = hmacHex(`email-verification-link:${V2_PREFIX}:${match[1]}`);
  return { tokenPrefix: `${V2_PREFIX}.${linkDigest}.` };
}

export function getVerificationCode(token: string): string | null {
  const match = token.match(/^(\d{6})\.[a-f0-9]{64}$/i);
  return match ? match[1] : null;
}

export function isVerificationCodeMatch(token: string, code: string): boolean {
  if (!/^\d{6}$/.test(code)) return false;

  const legacyCode = getVerificationCode(token);
  if (legacyCode) {
    const actual = Buffer.from(code);
    const expected = Buffer.from(legacyCode);
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  }

  const match = token.match(/^v2\.([a-f0-9]{64})\.([a-f0-9]{64})$/);
  if (!match) return false;

  const expectedDigest = hmacHex(
    `email-verification-code:${V2_PREFIX}:${match[1]}:${code}`
  );
  return timingSafeHexEqual(match[2], expectedDigest);
}
