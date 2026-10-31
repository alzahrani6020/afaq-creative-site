export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, UnauthorizedError } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const now = Date.now();
    const since7 = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const since14 = new Date(now - 14 * 24 * 60 * 60 * 1000);
    const since30 = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const since60 = new Date(now - 60 * 24 * 60 * 60 * 1000);

    const openStatuses = ['new', 'under_review', 'qualified', 'need_information', 'contacted'] as const;

    const [
      total,
      newCount,
      underReview,
      qualified,
      needInformation,
      contacted,
      accepted,
      rejected,
      last7,
      previous7,
      last30,
      previous30,
      backlog,
      stale7,
      stale30,
      byCountry,
      byCategory,
      oldestOpen,
    ] = await Promise.all([
      prisma.talentApplication.count(),
      prisma.talentApplication.count({ where: { status: 'new' } }),
      prisma.talentApplication.count({ where: { status: 'under_review' } }),
      prisma.talentApplication.count({ where: { status: 'qualified' } }),
      prisma.talentApplication.count({ where: { status: 'need_information' } }),
      prisma.talentApplication.count({ where: { status: 'contacted' } }),
      prisma.talentApplication.count({ where: { status: 'accepted' } }),
      prisma.talentApplication.count({ where: { status: 'rejected' } }),
      prisma.talentApplication.count({ where: { createdAt: { gte: since7 } } }),
      prisma.talentApplication.count({ where: { createdAt: { gte: since14, lt: since7 } } }),
      prisma.talentApplication.count({ where: { createdAt: { gte: since30 } } }),
      prisma.talentApplication.count({ where: { createdAt: { gte: since60, lt: since30 } } }),
      prisma.talentApplication.count({ where: { status: { in: [...openStatuses] } } }),
      prisma.talentApplication.count({
        where: {
          status: { in: [...openStatuses] },
          createdAt: { lt: since7 },
        },
      }),
      prisma.talentApplication.count({
        where: {
          status: { in: [...openStatuses] },
          createdAt: { lt: since30 },
        },
      }),
      prisma.talentApplication.groupBy({
        by: ['country'],
        _count: { _all: true },
        orderBy: { _count: { country: 'desc' } },
        take: 8,
      }),
      prisma.talentApplication.groupBy({
        by: ['category'],
        _count: { _all: true },
        orderBy: { _count: { category: 'desc' } },
        take: 8,
      }),
      prisma.talentApplication.findFirst({
        where: { status: { in: [...openStatuses] } },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
    ]);

    const acceptanceRate = total > 0 ? Number(((accepted / total) * 100).toFixed(1)) : 0;
    const decided = accepted + rejected;
    const decisionAcceptanceRate = decided > 0 ? Number(((accepted / decided) * 100).toFixed(1)) : 0;
    const decisionRate = total > 0 ? Number(((decided / total) * 100).toFixed(1)) : 0;
    const backlogRate = total > 0 ? Number(((backlog / total) * 100).toFixed(1)) : 0;
    const last7ChangePercent = previous7 > 0
      ? Number((((last7 - previous7) / previous7) * 100).toFixed(1))
      : last7 > 0 ? null : 0;
    const last30ChangePercent = previous30 > 0
      ? Number((((last30 - previous30) / previous30) * 100).toFixed(1))
      : last30 > 0 ? null : 0;
    const oldestOpenAgeDays = oldestOpen
      ? Math.max(0, Math.floor((now - oldestOpen.createdAt.getTime()) / (24 * 60 * 60 * 1000)))
      : 0;

    return NextResponse.json({
      success: true,
      summary: {
        total,
        new: newCount,
        under_review: underReview,
        qualified,
        need_information: needInformation,
        contacted,
        accepted,
        rejected,
        last7,
        previous7,
        last30,
        previous30,
        last7ChangePercent,
        last30ChangePercent,
        acceptanceRate,
        decisionAcceptanceRate,
        decisionRate,
        backlog,
        backlogRate,
        stale7,
        stale30,
        oldestOpenAgeDays,
      },
      byCountry: byCountry.map((row) => ({
        country: row.country || 'UNKNOWN',
        count: row._count._all,
      })),
      byCategory: byCategory.map((row) => ({
        category: row.category || 'غير محدد',
        count: row._count._all,
      })),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }
    console.error('Admin dashboard error:', error);
    return NextResponse.json({ success: false, message: 'تعذر تحميل مؤشرات لوحة الإدارة.' }, { status: 500 });
  }
}
