import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, AdminSession } from './lib/session-config';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const session = await getIronSession<AdminSession>(req, res, sessionOptions);

  // One shell only: logged-in users never see the login card again.
  if (pathname === '/admin/login' && session.isLoggedIn) {
    return NextResponse.redirect(new URL('/admin/talents', req.url));
  }

  if (pathname !== '/admin/login' && !session.isLoggedIn) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*'],
};
