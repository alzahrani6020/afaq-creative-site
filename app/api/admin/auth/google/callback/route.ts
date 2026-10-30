export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, AdminSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getClientIp } from '@/lib/admin-auth';
import { issueTrustedDevice } from '@/lib/trusted-device';
import {
  TRUSTED_DEVICE_COOKIE_NAME,
  deviceCookieOptions,
  formatDeviceCookie,
} from '@/lib/trusted-device-core';
import {
  processGoogleCallback,
} from '@/lib/google-oauth';

export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const googleError = url.searchParams.get('error');

  const result = await processGoogleCallback({
    code,
    state,
    googleError,
    origin,
    findAdminByEmail: (email) => prisma.adminUser.findUnique({ where: { email } }),
  });

  // Server-side diagnostic: exact outcome of every Google callback attempt.
  console.log('[google-callback]', result.ok ? 'OK' : `FAIL:${result.error}`, {
    googleError,
    hasCode: Boolean(code),
    ip: getClientIp(req),
  });

  // Durable diagnostic (branch code only — never tokens/cookies/email). Lets
  // us read the exact failure branch from the DB since Vercel runtime logs
  // are not retrievable for this project.
  prisma.oAuthLoginAttempt
    .create({
      data: {
        outcome: result.ok ? 'ok' : result.error,
        detail: googleError,
        hasCode: Boolean(code),
      },
    })
    .catch((err) => console.error('[google-callback] audit write failed:', err.message));

  const target = result.ok
    ? '/admin/talents'
    : `/admin/login?error=${result.error}`;
  const res = NextResponse.redirect(new URL(target, req.url));

  if (!result.ok) {
    return res;
  }

  const admin = result.admin;
  const session = await getIronSession<AdminSession>(req, res, sessionOptions);
  Object.assign(session, {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    isLoggedIn: true,
  });
  await session.save();

  // Google logins are always trusted for 1 year (approved decision).
  try {
    const device = await issueTrustedDevice(admin.id, {
      userAgent: req.headers.get('user-agent'),
      ip: getClientIp(req),
    });
    res.cookies.set(
      TRUSTED_DEVICE_COOKIE_NAME,
      formatDeviceCookie(device.deviceId, device.token),
      deviceCookieOptions(process.env.NODE_ENV === 'production')
    );
    await prisma.adminActivity.create({
      data: {
        adminUserId: admin.id,
        action: 'تسجيل دخول عبر Google',
        metadata: JSON.stringify({ email: admin.email, deviceName: device.deviceName }),
      },
    });
  } catch (deviceErr) {
    console.error('[google-callback] trusted device skipped:', deviceErr instanceof Error ? deviceErr.message : deviceErr);
    await prisma.adminActivity.create({
      data: {
        adminUserId: admin.id,
        action: 'تسجيل دخول عبر Google',
        metadata: JSON.stringify({ email: admin.email, trustedDevice: false }),
      },
    }).catch(() => {});
  }

  return res;
}
