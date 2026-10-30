import type { NextRequest } from 'next/server';
import type { AdminSession } from './session-config';

// ---------------------------------------------------------------------------
// Development-only local admin auth.
//
// Enables passwordless login to the admin panel on localhost ONLY, gated by
// three independent conditions that must all hold:
//   1. NODE_ENV === 'development'
//   2. AIC_LOCAL_ADMIN_ENABLED === 'true' (explicit opt-in, local env file)
//   3. the request Host is localhost / 127.0.0.1 / [::1]
//
// In production, preview, or any non-localhost host every function here
// returns false and this module is dead code. No production credential,
// database row, or OAuth setting is touched. The session minted through
// /api/admin/dev-login is a real iron-session cookie and flows through the
// same requireAdmin() path as normal logins — there is no middleware bypass.
// ---------------------------------------------------------------------------

export const LOCAL_DEV_ADMIN_ID = 'local-dev-admin';

const ALLOWED_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

export function isLocalDevAuthEnabled(req: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'development') return false;
  if (process.env.AIC_LOCAL_ADMIN_ENABLED !== 'true') return false;
  const host = (req.headers.get('host') || '').toLowerCase().split(':')[0];
  return ALLOWED_HOSTS.has(host);
}

// A session only counts as local-dev if it carries the marker AND the fixed
// local id — a forged cookie cannot satisfy this without the session secret,
// and a production-issued session never has these fields.
export function isLocalDevSession(session: AdminSession): boolean {
  return session.id === LOCAL_DEV_ADMIN_ID && session.localDev === true;
}

export function localDevAdminSession(): AdminSession {
  return {
    id: LOCAL_DEV_ADMIN_ID,
    email: 'local-dev@afaq.local',
    name: 'Local Dev Admin',
    role: 'super_admin',
    isLoggedIn: true,
    localDev: true,
  };
}
