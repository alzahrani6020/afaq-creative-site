import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  APPLICANT_UPLOAD_SESSION_TTL_SECONDS,
  createApplicantUploadSessionToken,
  getApplicantUploadAccessId,
  verifyApplicantUploadToken,
} from '@/lib/applicant-upload-token';

export const dynamic = 'force-dynamic';

const COOKIE_NAME = 'afaq_applicant_upload_session';

function withSecurityHeaders(res: NextResponse) {
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('Referrer-Policy', 'no-referrer');
  return res;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const applicationNumber =
      typeof body.applicationNumber === 'string' ? body.applicationNumber.trim() : '';
    const token = typeof body.token === 'string' ? body.token.trim() : '';

    if (!applicationNumber || !token) {
      return withSecurityHeaders(
        NextResponse.json({ success: false, message: 'رابط الاستكمال غير مكتمل.' }, { status: 400 })
      );
    }

    const application = await prisma.talentApplication.findUnique({
      where: { applicationNumber },
    });

    if (
      !application ||
      !application.emailVerified ||
      !verifyApplicantUploadToken(
        token,
        application.id,
        application.applicationNumber,
        getApplicantUploadAccessId(application.attachments)
      )
    ) {
      return withSecurityHeaders(
        NextResponse.json(
          { success: false, message: 'رابط الاستكمال غير صالح أو منتهي الصلاحية.' },
          { status: 401 }
        )
      );
    }

    const sessionToken = createApplicantUploadSessionToken(
      application.id,
      application.applicationNumber,
      getApplicantUploadAccessId(application.attachments)
    );

    const res = NextResponse.json({
      success: true,
      applicationNumber: application.applicationNumber,
    });

    res.cookies.set({
      name: COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: APPLICANT_UPLOAD_SESSION_TTL_SECONDS,
    });

    await prisma.talentApplicationActivity.create({
      data: {
        applicationId: application.id,
        action: 'فتح المتقدم جلسة استكمال آمنة',
      },
    });

    return withSecurityHeaders(res);
  } catch (error) {
    console.error(
      'Applicant upload session exchange error:',
      error instanceof Error ? error.message : String(error)
    );
    return withSecurityHeaders(
      NextResponse.json(
        { success: false, message: 'تعذر فتح جلسة الاستكمال.' },
        { status: 500 }
      )
    );
  }
}
