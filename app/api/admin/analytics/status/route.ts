export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, UnauthorizedError } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const measurementConfigured = Boolean(process.env.NEXT_PUBLIC_GA_ID);
    const propertyConfigured = Boolean(process.env.GA4_PROPERTY_ID);
    const serviceAccountConfigured = Boolean(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
    );

    return NextResponse.json({
      success: true,
      collection: {
        configured: measurementConfigured,
        measurementId: process.env.NEXT_PUBLIC_GA_ID || null,
      },
      dataApi: {
        configured: propertyConfigured && serviceAccountConfigured,
        propertyConfigured,
        serviceAccountConfigured,
        status: propertyConfigured && serviceAccountConfigured ? 'configured' : 'not_configured',
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: 'تعذر قراءة حالة التحليلات.' }, { status: 500 });
  }
}
