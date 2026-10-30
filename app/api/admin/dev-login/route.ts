export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { setAdminSession } from '@/lib/auth';
import { isLocalDevAuthEnabled, localDevAdminSession } from '@/lib/local-dev-admin';

// Development-only passwordless login for local AIC work. Active exclusively
// when NODE_ENV=development + AIC_LOCAL_ADMIN_ENABLED=true + localhost host.
// See lib/local-dev-admin.ts. Never usable in production or on a real domain.

export async function GET(req: NextRequest) {
  return NextResponse.json({ enabled: isLocalDevAuthEnabled(req) });
}

export async function POST(req: NextRequest) {
  if (!isLocalDevAuthEnabled(req)) {
    return NextResponse.json(
      { success: false, message: 'وضع الدخول المحلي غير مفعّل.' },
      { status: 403 }
    );
  }

  const sessionData = localDevAdminSession();
  await setAdminSession(sessionData);

  const { localDev: _localDev, ...admin } = sessionData;
  return NextResponse.json({ success: true, admin });
}
