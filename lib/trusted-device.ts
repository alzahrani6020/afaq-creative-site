import type { AdminUser, PrismaClient } from '@prisma/client';
import {
  TRUSTED_DEVICE_MAX_AGE_SECONDS,
  TrustedDeviceRecord,
  formatDeviceCookie,
  generateDeviceToken,
  hashDeviceToken,
  isTrustedDeviceValid,
  parseDeviceCookie,
  parseDeviceName,
  shouldUpdateLastUsed,
} from './trusted-device-core';

// Minimal DB surface so tests can inject a fake without touching prisma.
export type TrustedDeviceDb = Pick<PrismaClient, 'trustedDevice' | 'adminUser' | 'adminActivity'>;

export interface TrustedDeviceRequestInfo {
  userAgent?: string | null;
  ip?: string | null;
}

interface DeviceOptions {
  db?: TrustedDeviceDb;
  now?: () => Date;
}

async function getDb(db?: TrustedDeviceDb): Promise<TrustedDeviceDb> {
  if (db) return db;
  // Lazy import: keeps this module loadable in tests without DATABASE_URL.
  const { prisma } = await import('./prisma');
  return prisma;
}

export async function issueTrustedDevice(
  adminUserId: string,
  info: TrustedDeviceRequestInfo,
  opts: DeviceOptions = {}
): Promise<{ deviceId: string; token: string; deviceName: string }> {
  const db = await getDb(opts.db);
  const now = (opts.now ?? (() => new Date()))();

  const token = generateDeviceToken();
  const deviceName = parseDeviceName(info.userAgent);
  const expiresAt = new Date(now.getTime() + TRUSTED_DEVICE_MAX_AGE_SECONDS * 1000);

  const device = await db.trustedDevice.create({
    data: {
      adminUserId,
      deviceName,
      tokenHash: hashDeviceToken(token),
      ip: info.ip ?? null,
      userAgent: info.userAgent ?? null,
      createdAt: now,
      lastUsedAt: now,
      expiresAt,
    },
  });

  await db.adminActivity.create({
    data: {
      adminUserId,
      action: 'إضافة جهاز موثوق',
      metadata: JSON.stringify({ deviceId: device.id, deviceName }),
    },
  });

  return { deviceId: device.id, token, deviceName };
}

export async function resolveTrustedDevice(
  rawCookie: string | null | undefined,
  info: TrustedDeviceRequestInfo,
  opts: DeviceOptions = {}
): Promise<AdminUser | null> {
  const parsed = parseDeviceCookie(rawCookie);
  if (!parsed) return null;

  const db = await getDb(opts.db);
  const now = (opts.now ?? (() => new Date()))();

  const device = (await db.trustedDevice.findUnique({
    where: { id: parsed.deviceId },
  })) as TrustedDeviceRecord | null;
  if (!device) return null;

  const tokenHash = hashDeviceToken(parsed.token);
  // Constant-shape compare: both values are sha256 base64url digests.
  if (tokenHash.length !== device.tokenHash.length || tokenHash !== device.tokenHash) {
    return null;
  }

  if (!isTrustedDeviceValid(device, now)) return null;

  if (shouldUpdateLastUsed(device.lastUsedAt, now)) {
    await db.trustedDevice.update({
      where: { id: device.id },
      data: { lastUsedAt: now },
    });
  }

  const admin = await db.adminUser.findUnique({ where: { id: device.adminUserId } });
  if (!admin || !admin.isActive) return null;

  return admin;
}

export async function revokeTrustedDevice(
  adminUserId: string,
  deviceId: string,
  opts: DeviceOptions = {}
): Promise<boolean> {
  const db = await getDb(opts.db);
  const now = (opts.now ?? (() => new Date()))();

  const device = await db.trustedDevice.findFirst({
    where: { id: deviceId, adminUserId },
  });
  if (!device || device.revokedAt) return false;

  await db.trustedDevice.update({
    where: { id: deviceId },
    data: { revokedAt: now },
  });

  await db.adminActivity.create({
    data: {
      adminUserId,
      action: 'إلغاء جهاز موثوق',
      metadata: JSON.stringify({ deviceId, deviceName: device.deviceName }),
    },
  });

  return true;
}

export async function revokeAllTrustedDevices(
  adminUserId: string,
  opts: DeviceOptions = {}
): Promise<number> {
  const db = await getDb(opts.db);
  const now = (opts.now ?? (() => new Date()))();

  const result = await db.trustedDevice.updateMany({
    where: { adminUserId, revokedAt: null },
    data: { revokedAt: now },
  });

  return result.count;
}

export function buildDeviceCookieValue(deviceId: string, token: string): string {
  return formatDeviceCookie(deviceId, token);
}
