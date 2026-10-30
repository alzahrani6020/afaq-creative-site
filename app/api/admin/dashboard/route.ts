export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, UnauthorizedError } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

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
      last30,
      byCountry,
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
      prisma.talentApplication.count({ where: { createdAt: { gte: since30 } } }),
      prisma.talentApplication.groupBy({
        by: ['country'],
        _count: { _all: true },
        orderBy: { _count: { country: 'desc' } },
        take: 8,
      }),
    ]);

    const conversionRate = total > 0 ? Number(((accepted / total) * 100).toFixed(1)) : 0;

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
        last30,
        conversionRate,
      },
      byCountry: byCountry.map((row) => ({
        country: row.country || 'UNKNOWN',
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
