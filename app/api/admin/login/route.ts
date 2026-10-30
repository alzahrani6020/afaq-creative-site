export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAdminCredentials, setAdminSession } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/admin-auth';
import { issueTrustedDevice } from '@/lib/trusted-device';
import {
  TRUSTED_DEVICE_COOKIE_NAME,
  deviceCookieOptions,
  formatDeviceCookie,
} from '@/lib/trusted-device-core';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  if (!checkRateLimit(`admin-login:${ip}`, 5, 60_000)) {
    return NextResponse.json(
      { success: false, message: 'تم تجاوز عدد المحاولات المسموح بها. حاول لاحقاً.' },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { email, password, rememberMe } = loginSchema.parse(body);

    const sessionData = await verifyAdminCredentials(email, password);
    if (!sessionData) {
      return NextResponse.json(
        { success: false, message: 'بيانات الدخول غير صحيحة.' },
        { status: 401 }
      );
    }

    await setAdminSession(sessionData);

    const res = NextResponse.json({
      success: true,
      admin: { id: sessionData.id, email: sessionData.email, name: sessionData.name, role: sessionData.role },
    });

    if (rememberMe) {
      const device = await issueTrustedDevice(sessionData.id!, {
        userAgent: req.headers.get('user-agent'),
        ip,
      });
      res.cookies.set(
        TRUSTED_DEVICE_COOKIE_NAME,
        formatDeviceCookie(device.deviceId, device.token),
        deviceCookieOptions(process.env.NODE_ENV === 'production')
      );
    }

    return res;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'البيانات المُرسلة غير صحيحة: ' + error.issues.map((e) => e.message).join(', ') },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('Admin login error:', message);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء تسجيل الدخول.' },
      { status: 500 }
    );
  }
}
