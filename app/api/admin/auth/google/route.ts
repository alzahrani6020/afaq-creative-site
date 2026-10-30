export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
  buildGoogleAuthUrl,
  generateOAuthState,
  getGoogleCallbackPath,
  getGoogleOAuthConfig,
} from '@/lib/google-oauth';

export async function GET(req: NextRequest) {
  const config = getGoogleOAuthConfig();
  if (!config) {
    return NextResponse.json(
      { success: false, code: 'google_missing', message: 'تسجيل الدخول عبر Google غير مفعّل بعد.' },
      { status: 501 }
    );
  }

  const origin = new URL(req.url).origin;
  const state = generateOAuthState();
  const authUrl = buildGoogleAuthUrl({
    clientId: config.clientId,
    redirectUri: `${origin}${getGoogleCallbackPath()}`,
    state,
  });

  return NextResponse.redirect(authUrl);
}
