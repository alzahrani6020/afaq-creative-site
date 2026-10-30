export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
type ApplicationStatus = 'new' | 'under_review' | 'qualified' | 'need_information' | 'contacted' | 'accepted' | 'rejected';
const ApplicationStatusValues = ['new', 'under_review', 'qualified', 'need_information', 'contacted', 'accepted', 'rejected'] as const;
import { requireAdmin, UnauthorizedError } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

const PAGE_SIZE = 20;
const ALLOWED_SORT = ['createdAt', 'updatedAt', 'status', 'applicationNumber'];

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status') as ApplicationStatus | null;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

    const where: any = {};
    if (status && ApplicationStatusValues.includes(status as typeof ApplicationStatusValues[number])) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { applicationNumber: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const validSortBy = ALLOWED_SORT.includes(sortBy) ? sortBy : 'createdAt';

    const [talents, total] = await Promise.all([
      prisma.talentApplication.findMany({
        where,
        orderBy: { [validSortBy]: order },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          _count: { select: { activities: true } },
          skillProfiles: {
            orderBy: { isPrimary: 'desc' },
          },
        },
      }),
      prisma.talentApplication.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      talents: talents.map((t) => ({
        ...t,
        activityCount: t._count.activities,
        _count: undefined,
      })),
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('Admin talents list error:', message);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء جلب البيانات.' },
      { status: 500 }
    );
  }
}
