export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, UnauthorizedError } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const [adminActivities, talentActivities] = await Promise.all([
      prisma.adminActivity.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { adminUser: { select: { name: true, email: true } } },
      }),
      prisma.talentApplicationActivity.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          adminUser: { select: { name: true, email: true } },
          application: { select: { applicationNumber: true } },
        },
      }),
    ]);

    const events = [
      ...adminActivities.map((item) => ({
        id: `admin-${item.id}`,
        type: 'admin',
        action: item.action,
        subject: null,
        metadata: item.metadata,
        admin: item.adminUser,
        createdAt: item.createdAt.toISOString(),
      })),
      ...talentActivities.map((item) => ({
        id: `talent-${item.id}`,
        type: 'talent',
        action: item.action,
        subject: item.application.applicationNumber,
        metadata: JSON.stringify({ oldValue: item.oldValue, newValue: item.newValue }),
        admin: item.adminUser,
        createdAt: item.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 150);

    return NextResponse.json({
      success: true,
      events,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }
    console.error('Admin audit error:', error);
    return NextResponse.json({ success: false, message: 'تعذر تحميل سجل التدقيق.' }, { status: 500 });
  }
}
