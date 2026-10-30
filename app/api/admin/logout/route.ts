export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { destroyAdminSession } from '@/lib/auth';
import { requireAdmin, UnauthorizedError } from '@/lib/admin-auth';
import { revokeTrustedDevice } from '@/lib/trusted-device';
import {
  TRUSTED_DEVICE_COOKIE_NAME,
  expiredDeviceCookieOptions,
  parseDeviceCookie,
} from '@/lib/trusted-device-core';

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);

    // Identify and revoke the current trusted device (if any) before the
    // session is destroyed so the device cookie can no longer re-issue it.
    const rawCookie = req.cookies.get(TRUSTED_DEVICE_COOKIE_NAME)?.value;
    const device = parseDeviceCookie(rawCookie);
    if (device) {
      await revokeTrustedDevice(admin.id!, device.deviceId).catch((err) => {
        console.error('Failed to revoke trusted device on logout:', err);
      });
    }

    await destroyAdminSession();

    const res = NextResponse.json({ success: true, message: 'تم تسجيل الخروج بنجاح.' });
    res.cookies.set(
      TRUSTED_DEVICE_COOKIE_NAME,
      '',
      expiredDeviceCookieOptions(process.env.NODE_ENV === 'production')
    );
    return res;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('Admin logout error:', message);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء تسجيل الخروج.' },
      { status: 500 }
    );
  }
}
