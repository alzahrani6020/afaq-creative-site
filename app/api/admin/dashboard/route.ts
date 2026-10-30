export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, UnauthorizedError } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

const STATUSES = [
  'new',
  'under_review',
  'qualified',
  'need_information',
  'contacted',
  'accepted',
  'rejected',
] as const;

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      total,
      today,
      last7Days,
      last30Days,
      groupedStatus,
      groupedCountry,
      recent,
    ] = await Promise.all([
      prisma.talentApplication.count(),
      prisma.talentApplication.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.talentApplication.count({ where: { createdAt: { gte: d7 } } }),
      prisma.talentApplication.count({ where: { createdAt: { gte: d30 } } }),
      prisma.talentApplication.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.talentApplication.groupBy({
        by: ['country'],
        where: { country: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { country: 'desc' } },
        take: 8,
      }),
      prisma.talentApplication.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          applicationNumber: true,
          status: true,
          country: true,
          createdAt: true,
        },
      }),
    ]);

    const byStatus = Object.fromEntries(STATUSES.map((status) => [status, 0])) as Record<string, number>;
    for (const row of groupedStatus) byStatus[row.status] = row._count._all;

    const accepted = byStatus.accepted || 0;
    const qualified = byStatus.qualified || 0;
    const conversionRate = total > 0 ? Number((((accepted + qualified) / total) * 100).toFixed(1)) : 0;

    return NextResponse.json({
      success: true,
      generatedAt: now.toISOString(),
      totals: {
        total,
        today,
        last7Days,
        last30Days,
        conversionRate,
      },
      byStatus,
      topCountries: groupedCountry.map((row) => ({
        country: row.country,
        count: row._count._all,
      })),
      recent,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }

    console.error('Admin dashboard error:', error);
    return NextResponse.json(
      { success: false, message: 'تعذر تحميل مؤشرات لوحة الإدارة.' },
      { status: 500 }
    );
  }
}
