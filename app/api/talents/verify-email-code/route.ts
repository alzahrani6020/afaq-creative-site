import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isVerificationCodeMatch } from '@/lib/applicant-email-verification';
import { createApplicantUploadToken, rotateApplicantUploadAccess } from '@/lib/applicant-upload-token';
import { buildBaseUrl } from '@/lib/email';

export const dynamic = 'force-dynamic';

function response(body: any, status = 200) {
  const res = NextResponse.json(body, { status });
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('Referrer-Policy', 'no-referrer');
  return res;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const applicationNumber = typeof body.applicationNumber === 'string' ? body.applicationNumber.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const code = typeof body.code === 'string' ? body.code.trim() : '';

    if (!applicationNumber || !email || !/^\d{6}$/.test(code)) {
      return response({ success: false, message: 'رقم الطلب والبريد ورمز التحقق المكوّن من 6 أرقام مطلوبة.' }, 400);
    }

    const application = await prisma.talentApplication.findUnique({ where: { applicationNumber } });
    if (!application || !application.email || application.email.toLowerCase() !== email) {
      return response({ success: false, message: 'تعذر التحقق من البيانات.' }, 400);
    }

    if (application.emailVerified) {
      return response(
        {
          success: false,
          alreadyVerified: true,
          message: 'البريد الإلكتروني مؤكد بالفعل. استخدم خيار إعادة إرسال رابط الاستكمال إلى بريدك الإلكتروني.',
        },
        409
      );
    }

    const recentFailures = await prisma.talentApplicationActivity.count({
      where: {
        applicationId: application.id,
        action: 'فشل رمز تحقق البريد',
        createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
      },
    });
    if (recentFailures >= 5) {
      return response({ success: false, message: 'تم تجاوز عدد محاولات التحقق. حاول لاحقًا.' }, 429);
    }

    const tokens = await prisma.emailVerificationToken.findMany({
      where: {
        applicationId: application.id,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const matched = tokens.find((item) => isVerificationCodeMatch(item.token, code));
    if (!matched) {
      await prisma.talentApplicationActivity.create({
        data: { applicationId: application.id, action: 'فشل رمز تحقق البريد' },
      });
      return response({ success: false, message: 'رمز التحقق غير صحيح أو منتهي الصلاحية.' }, 400);
    }

    const rotated = rotateApplicantUploadAccess(application.attachments);

    await prisma.$transaction([
      prisma.emailVerificationToken.update({
        where: { id: matched.id },
        data: { used: true },
      }),
      prisma.emailVerificationToken.updateMany({
        where: { applicationId: application.id, used: false },
        data: { used: true },
      }),
      prisma.talentApplication.update({
        where: { id: application.id },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
          emailStatus: 'verified',
          attachments: rotated.attachments,
        },
      }),
      prisma.talentApplicationActivity.create({
        data: { applicationId: application.id, action: 'تم تأكيد البريد عبر رمز التحقق' },
      }),
    ]);

    const uploadToken = createApplicantUploadToken(
      application.id,
      application.applicationNumber,
      rotated.accessId
    );
    return response({
      success: true,
      uploadUrl: `${buildBaseUrl()}/talents/upload?application=${encodeURIComponent(application.applicationNumber)}&token=${encodeURIComponent(uploadToken)}`,
    });
  } catch (error) {
    console.error('Verify email code error:', error instanceof Error ? error.message : String(error));
    return response({ success: false, message: 'حدث خطأ أثناء التحقق من البريد.' }, 500);
  }
}
