export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, UnauthorizedError } from '@/lib/admin-auth';
import { revokeTrustedDevice } from '@/lib/trusted-device';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(req);
    const revoked = await revokeTrustedDevice(admin.id!, params.id);

    if (!revoked) {
      return NextResponse.json(
        { success: false, message: 'الجهاز غير موجود أو تم إلغاؤه مسبقاً.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'تم إلغاء الجهاز بنجاح.' });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('Admin device revoke error:', message);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء إلغاء الجهاز.' },
      { status: 500 }
    );
  }
}
