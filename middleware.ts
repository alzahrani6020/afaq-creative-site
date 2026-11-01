import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, AdminSession } from './lib/session-config';

const TRUSTED_DEVICE_COOKIE_NAME = 'afaq_admin_device';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');

  const session = await getIronSession<AdminSession>(req, res, sessionOptions);

  const hasUsableSession = Boolean(session.isLoggedIn && session.id);

  if (pathname === '/admin/login' && hasUsableSession) {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url));
  }

  if (pathname !== '/admin/login' && !hasUsableSession) {
    const trustedDevice = req.cookies.get(TRUSTED_DEVICE_COOKIE_NAME)?.value;
    if (trustedDevice) {
      const refreshUrl = new URL('/api/admin/session/refresh', req.url);
      refreshUrl.searchParams.set('next', pathname + req.nextUrl.search);
      return NextResponse.redirect(refreshUrl);
    }
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*'],
};
