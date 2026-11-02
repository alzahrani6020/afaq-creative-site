import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildVerificationSuccessHtml, buildVerificationErrorHtml, buildBaseUrl } from '@/lib/email';
import { createApplicantUploadToken } from '@/lib/applicant-upload-token';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      const invalid = new NextResponse(buildVerificationErrorHtml('الرابط غير صالح أو انتهت صلاحيته.'), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
      invalid.headers.set('Cache-Control', 'no-store');
      invalid.headers.set('Referrer-Policy', 'no-referrer');
      return invalid;
    }

    const record = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { application: true },
    });

    if (!record || record.used || record.expiresAt < new Date()) {
      return new NextResponse(buildVerificationErrorHtml('الرابط غير صالح أو انتهت صلاحيته.'), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    await prisma.$transaction([
      prisma.emailVerificationToken.updateMany({
        where: { applicationId: record.applicationId, used: false },
        data: { used: true },
      }),
      prisma.talentApplication.update({
        where: { id: record.applicationId },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
          emailStatus: 'verified',
        },
      }),
    ]);

    const uploadToken = createApplicantUploadToken(record.application.id, record.application.applicationNumber);
    const uploadUrl = `${buildBaseUrl()}/talents/upload?application=${encodeURIComponent(record.application.applicationNumber)}&token=${encodeURIComponent(uploadToken)}`;
    const success = new NextResponse(buildVerificationSuccessHtml(record.application.applicationNumber, uploadUrl), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
    success.headers.set('Cache-Control', 'no-store');
    success.headers.set('Referrer-Policy', 'no-referrer');
    return success;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Email verification error:', message);
    return new NextResponse(buildVerificationErrorHtml('حدث خطأ أثناء التحقق من البريد.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
