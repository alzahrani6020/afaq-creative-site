export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, UnauthorizedError } from '@/lib/admin-auth';
import { changeAdminPassword, destroyAdminSession, setAdminSession } from '@/lib/auth';

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
  confirmPassword: z.string().min(1),
});

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = passwordSchema.parse(body);

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'كلمتا المرور الجديدتين غير متطابقتين.' },
        { status: 400 }
      );
    }

    const result = await changeAdminPassword(admin.id!, currentPassword, newPassword);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    // Regenerate session after password change for security.
    await destroyAdminSession();
    await setAdminSession({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      isLoggedIn: true,
    });

    return NextResponse.json({ success: true, message: result.message });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'البيانات المُرسلة غير صحيحة: يجب أن تكون كلمة المرور الجديدة 8 أحرف على الأقل.' },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('Admin password change error:', message);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء تغيير كلمة المرور.' },
      { status: 500 }
    );
  }
}
