export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, UnauthorizedError } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

const createSchema = z.object({
  action: z.string().min(1).max(1000),
  oldValue: z.string().max(2000).optional(),
  newValue: z.string().max(2000).optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin(req);
    const { id } = params;

    const activities = await prisma.talentApplicationActivity.findMany({
      where: { applicationId: id },
      orderBy: { createdAt: 'desc' },
      include: { adminUser: { select: { name: true, email: true } } },
    });

    return NextResponse.json({ success: true, activities });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('Admin talent activity error:', message);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء جلب البيانات.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(req);
    const { id } = params;
    const body = await req.json();
    const { action, oldValue, newValue } = createSchema.parse(body);

    const exists = await prisma.talentApplication.count({ where: { id } });
    if (!exists) {
      return NextResponse.json({ success: false, message: 'الطلب غير موجود.' }, { status: 404 });
    }

    const activity = await prisma.talentApplicationActivity.create({
      data: {
        applicationId: id,
        adminUserId: admin.id,
        action,
        oldValue,
        newValue,
      },
    });

    return NextResponse.json({ success: true, activity });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'البيانات المُرسلة غير صحيحة.' },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('Admin talent activity create error:', message);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء إنشاء النشاط.' },
      { status: 500 }
    );
  }
}
