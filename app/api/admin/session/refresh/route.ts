export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, AdminSession } from '@/lib/session';
import { resolveTrustedDevice } from '@/lib/trusted-device';
import { TRUSTED_DEVICE_COOKIE_NAME } from '@/lib/trusted-device-core';

function sanitizeNext(next: string | null): string {
  // Open-redirect guard: only allow admin paths.
  if (next && next.startsWith('/admin') && !next.startsWith('//')) return next;
  return '/admin/talents';
}

// Re-issues an expired iron session when the trusted-device cookie is still
// valid, then redirects back to the originally requested admin page.
export async function GET(req: NextRequest) {
  const next = sanitizeNext(req.nextUrl.searchParams.get('next'));

  try {
    const rawCookie = req.cookies.get(TRUSTED_DEVICE_COOKIE_NAME)?.value;
    const admin = rawCookie
      ? await resolveTrustedDevice(rawCookie, {
          userAgent: req.headers.get('user-agent'),
          ip: req.ip,
        })
      : null;

    if (!admin) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    const res = NextResponse.redirect(new URL(next, req.url));
    const session = await getIronSession<AdminSession>(req, res, sessionOptions);
    Object.assign(session, {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      isLoggedIn: true,
    });
    await session.save();
    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Admin session refresh error:', message);
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }
}
