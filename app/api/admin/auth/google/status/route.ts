export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { isGoogleOAuthConfigured } from '@/lib/google-oauth';

export async function GET() {
  return NextResponse.json({ configured: isGoogleOAuthConfigured() });
}
