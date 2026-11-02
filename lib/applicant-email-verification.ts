import crypto from 'crypto';

export const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

export function createEmailVerificationCredential() {
  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  const secret = crypto.randomBytes(32).toString('hex');
  return {
    code,
    token: `${code}.${secret}`,
    expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
  };
}

export function getVerificationCode(token: string): string | null {
  const match = token.match(/^(\d{6})\.[a-f0-9]{64}$/i);
  return match ? match[1] : null;
}

export function isVerificationCodeMatch(token: string, code: string): boolean {
  const storedCode = getVerificationCode(token);
  if (!storedCode || !/^\d{6}$/.test(code)) return false;

  const actual = Buffer.from(code);
  const expected = Buffer.from(storedCode);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
