import crypto from 'crypto';

export const TRUSTED_DEVICE_COOKIE_NAME = 'afaq_admin_device';
export const TRUSTED_DEVICE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

export interface TrustedDeviceRecord {
  id: string;
  adminUserId: string;
  deviceName: string;
  tokenHash: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
}

const LAST_USED_TOUCH_MS = 60 * 60 * 1000; // 1 hour

export function generateDeviceToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashDeviceToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('base64url');
}

/** Cookie value shape: `<deviceId>.<token>` */
export function formatDeviceCookie(deviceId: string, token: string): string {
  return `${deviceId}.${token}`;
}

export function parseDeviceCookie(
  raw: string | null | undefined
): { deviceId: string; token: string } | null {
  if (!raw) return null;
  const dot = raw.indexOf('.');
  if (dot <= 0 || dot === raw.length - 1) return null;
  const deviceId = raw.slice(0, dot);
  const token = raw.slice(dot + 1);
  if (!deviceId || !token) return null;
  return { deviceId, token };
}

export function parseDeviceName(userAgent?: string | null): string {
  if (!userAgent) return 'جهاز غير معروف';
  const ua = userAgent.slice(0, 180);
  if (/Edg\//i.test(ua)) return 'Microsoft Edge';
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return 'Google Chrome';
  if (/Firefox\//i.test(ua)) return 'Mozilla Firefox';
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return 'Safari';
  return 'متصفح ويب';
}

export function isTrustedDeviceValid(device: TrustedDeviceRecord, now: Date = new Date()): boolean {
  if (device.revokedAt) return false;
  if (device.expiresAt.getTime() <= now.getTime()) return false;
  return true;
}

export function shouldUpdateLastUsed(lastUsedAt: Date, now: Date = new Date()): boolean {
  return now.getTime() - lastUsedAt.getTime() >= LAST_USED_TOUCH_MS;
}

export function deviceCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: 'strict' as const,
    path: '/',
    maxAge: TRUSTED_DEVICE_MAX_AGE_SECONDS,
  };
}

export function expiredDeviceCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 0,
  };
}
