import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { resolveTrustedDevice } from './trusted-device';
import { TRUSTED_DEVICE_COOKIE_NAME } from './trusted-device-core';
import { sessionOptions, AdminSession } from './session-config';

export { sessionOptions } from './session-config';
export type { AdminSession } from './session-config';

// When the iron session has expired but a valid trusted-device cookie exists,
// silently mint a fresh session for that admin. Returns null when there is no
// usable device. Never throws — a broken device lookup must not break auth.
async function tryReissueFromTrustedDevice(req: NextRequest): Promise<AdminSession | null> {
  try {
    const rawCookie = req.cookies.get(TRUSTED_DEVICE_COOKIE_NAME)?.value;
    if (!rawCookie) return null;

    const admin = await resolveTrustedDevice(rawCookie, {
      userAgent: req.headers.get('user-agent'),
      ip: req.ip,
    });
    if (!admin) return null;

    const sessionData: AdminSession = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      isLoggedIn: true,
    };

    // Persist the fresh cookie when writes are allowed (route handlers, server
    // actions). In read-only contexts the session is still returned for the
    // current request; the /api/admin/session/refresh endpoint covers renewals
    // triggered from middleware.
    try {
      const writable = await getIronSession<AdminSession>(cookies(), sessionOptions);
      Object.assign(writable, sessionData);
      await writable.save();
    } catch {
      // Read-only cookie context — skip persistence.
    }

    return sessionData;
  } catch {
    return null;
  }
}

export function getAdminSession(req?: NextRequest): Promise<IronSession<AdminSession>> {
  if (req) {
    return (async () => {
      const session = await getIronSession<AdminSession>(req, new Response(), sessionOptions);
      if (!session.isLoggedIn || !session.id) {
        const reissued = await tryReissueFromTrustedDevice(req);
        if (reissued) {
          Object.assign(session, reissued);
        }
      }
      return session;
    })();
  }
  return getIronSession<AdminSession>(cookies(), sessionOptions);
}

export async function requireAdminSession(req?: NextRequest): Promise<AdminSession> {
  const session = await getAdminSession(req);
  if (!session.isLoggedIn || !session.id) {
    throw new Error('Unauthorized');
  }
  return session;
}
