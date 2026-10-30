export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, UnauthorizedError } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    let database = { status: 'healthy', checkedAt: new Date().toISOString() };
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      database = { status: 'unavailable', checkedAt: new Date().toISOString() };
    }

    const integrations = {
      ga4Collection: Boolean(process.env.NEXT_PUBLIC_GA_ID),
      ga4Reporting: Boolean(
        process.env.GA4_PROPERTY_ID &&
        process.env.GA4_CLIENT_EMAIL &&
        process.env.GA4_PRIVATE_KEY
      ),
      searchConsoleReporting: Boolean(
        process.env.GSC_CLIENT_EMAIL &&
        process.env.GSC_PRIVATE_KEY
      ),
    };

    return NextResponse.json({
      success: true,
      generatedAt: new Date().toISOString(),
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
      deployment: {
        commitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
        commitRef: process.env.VERCEL_GIT_COMMIT_REF || null,
      },
      database,
      integrations,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }

    return NextResponse.json(
      { success: false, message: 'تعذر فحص الحالة التشغيلية.' },
      { status: 500 }
    );
  }
}
