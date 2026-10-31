export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, UnauthorizedError } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const trustedDeviceCount = await prisma.trustedDevice.count();
    const oauthLoginAttemptCount = await prisma.oAuthLoginAttempt.count();

    const rlsRows = await prisma.$queryRawUnsafe<Array<{ relname: string; relrowsecurity: boolean }>>(
      `SELECT c.relname, c.relrowsecurity
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public'
         AND c.relname IN (
           'TalentApplication','AdminUser','TalentApplicationActivity','AdminActivity',
           'ApplicantSkillProfile','EmailVerificationToken','TrustedDevice','OAuthLoginAttempt'
         )
       ORDER BY c.relname`
    );

    const roleRows = await prisma.$queryRawUnsafe<Array<{ rolname: string }>>(
      `SELECT rolname FROM pg_roles
       WHERE rolname IN ('anon','authenticated')
       ORDER BY rolname`
    );

    const grantRows = await prisma.$queryRawUnsafe<Array<{ grantee: string; table_name: string; privilege_type: string }>>(
      `SELECT grantee, table_name, privilege_type
       FROM information_schema.role_table_grants
       WHERE table_schema = 'public'
         AND grantee IN ('anon','authenticated')
         AND table_name IN (
           'TalentApplication','AdminUser','TalentApplicationActivity','AdminActivity',
           'ApplicantSkillProfile','EmailVerificationToken','TrustedDevice','OAuthLoginAttempt'
         )`
    );

    return NextResponse.json({
      success: true,
      trustedDeviceTable: true,
      oauthLoginAttemptTable: true,
      trustedDeviceCount,
      oauthLoginAttemptCount,
      roles: roleRows.map((row) => row.rolname),
      rls: Object.fromEntries(rlsRows.map((row) => [row.relname, row.relrowsecurity])),
      anonAuthenticatedGrantCount: grantRows.length,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }
    return NextResponse.json(
      {
        success: false,
        code: 'DB_STATE_CHECK_FAILED',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
