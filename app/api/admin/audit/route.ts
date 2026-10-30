export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, UnauthorizedError } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const requested = Number(searchParams.get('limit') || '50');
    const limit = Math.min(100, Math.max(1, Number.isFinite(requested) ? requested : 50));

    const logs = await prisma.adminActivity.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        adminUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      generatedAt: new Date().toISOString(),
      logs,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, message: 'تعذر تحميل سجل التدقيق.' },
      { status: 500 }
    );
  }
}
