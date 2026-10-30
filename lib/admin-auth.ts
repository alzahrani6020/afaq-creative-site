import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import { AdminSession, getAdminSession } from './session';
import { isLocalDevAuthEnabled, isLocalDevSession, localDevAdminSession } from './local-dev-admin';

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (req.ip) return req.ip;
  return 'unknown';
}

export async function getCurrentAdmin(req: NextRequest): Promise<AdminSession | null> {
  const session = await getAdminSession(req);
  if (!session.isLoggedIn || !session.id) return null;

  // Development-only local admin: a session minted by /api/admin/dev-login is
  // honoured only when local dev auth is explicitly enabled AND the request
  // targets localhost. Otherwise (incl. any production/preview host) this
  // branch fails closed and the database remains the source of truth.
  if (isLocalDevSession(session)) {
    if (!isLocalDevAuthEnabled(req)) return null;
    return localDevAdminSession();
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.id, isActive: true },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!admin) return null;

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    isLoggedIn: true,
  };
}

export async function requireAdmin(req: NextRequest): Promise<AdminSession> {
  const admin = await getCurrentAdmin(req);
  if (!admin) {
    throw new UnauthorizedError();
  }
  return admin;
}

export function isAuthorizedRole(role: string, allowedRoles: string[]): boolean {
  if (allowedRoles.includes(role)) return true;
  if (role === 'super_admin') return true;
  return false;
}
