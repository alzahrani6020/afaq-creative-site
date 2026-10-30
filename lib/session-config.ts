import type { SessionOptions } from 'iron-session';

export interface AdminSession {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  isLoggedIn?: boolean;
  localDev?: boolean;
}

const secret = process.env.ADMIN_SESSION_SECRET;

if (!secret || secret.length < 32) {
  throw new Error(
    'ADMIN_SESSION_SECRET is missing or too short. It must be at least 32 characters long. Never use a weak fallback in production.'
  );
}

export const sessionOptions: SessionOptions = {
  cookieName: 'afaq_admin_session',
  password: secret,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};
