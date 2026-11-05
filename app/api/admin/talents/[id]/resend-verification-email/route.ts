import { NextRequest, NextResponse } from 'next/server';
import { createEmailVerificationCredential } from '@/lib/applicant-email-verification';
import { UnauthorizedError, requireAdmin } from '@/lib/admin-auth';
import { buildApplicationReceivedEmail, buildBaseUrl, sendTransactionalEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  try {
    return JSON.parse(value || '') as T;
  } catch {
    return fallback;
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(req);
    const application = await prisma.talentApplication.findUnique({
      where: { id: params.id },
    });

    if (!application) {
      return NextResponse.json({ success: false, message: 'الطلب غير موجود.' }, { status: 404 });
    }
    if (!application.email) {
      return NextResponse.json({ success: false, message: 'لا يوجد بريد إلكتروني مسجل لهذا الطلب.' }, { status: 400 });
    }
    if (application.emailVerified) {
      return NextResponse.json({ success: false, message: 'البريد الإلكتروني مؤكد بالفعل.' }, { status: 409 });
    }

    const cooldownSince = new Date(Date.now() - 60_000);
    const recentAttempt = await prisma.talentApplicationActivity.findFirst({
      where: {
        applicationId: application.id,
        action: 'طلب إداري لإعادة إرسال تأكيد البريد',
        createdAt: { gte: cooldownSince },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (recentAttempt) {
      return NextResponse.json(
        { success: false, message: 'تم طلب إعادة الإرسال مؤخرًا. انتظر دقيقة ثم حاول مرة أخرى.' },
        { status: 429 }
      );
    }

    const credential = createEmailVerificationCredential();

    await prisma.$transaction([
      prisma.emailVerificationToken.updateMany({
        where: { applicationId: application.id, used: false },
        data: { used: true },
      }),
      prisma.emailVerificationToken.create({
        data: {
          token: credential.storedToken,
          applicationId: application.id,
          expiresAt: credential.expiresAt,
        },
      }),
      prisma.talentApplication.update({
        where: { id: application.id },
        data: {
          emailStatus: 'pending',
          emailError: null,
        },
      }),
      prisma.talentApplicationActivity.create({
        data: {
          applicationId: application.id,
          adminUserId: admin.id,
          action: 'طلب إداري لإعادة إرسال تأكيد البريد',
        },
      }),
    ]);

    const personal = parseJson<Record<string, any>>(application.personal, {});
    const verifyUrl = `${buildBaseUrl()}/api/talents/verify-email?token=${credential.token}`;
    const { subject, html, text } = buildApplicationReceivedEmail({
      name: personal.full_name || 'متقدم',
      applicationNumber: application.applicationNumber,
      verifyUrl,
      verificationCode: credential.code,
    });

    const result = await sendTransactionalEmail({
      to: application.email,
      subject,
      html,
      text,
    });

    const now = new Date();
    await prisma.$transaction([
      prisma.talentApplication.update({
        where: { id: application.id },
        data: {
          emailStatus: result.success ? 'sent' : 'failed',
          emailSentAt: result.success ? now : null,
          emailFailedAt: result.success ? null : now,
          emailError: result.success ? null : (result.error || 'تعذر إرسال رسالة تأكيد البريد.'),
          emailMessageId: result.success ? (result.messageId || null) : null,
        },
      }),
      prisma.talentApplicationActivity.create({
        data: {
          applicationId: application.id,
          adminUserId: admin.id,
          action: result.success ? 'تمت إعادة إرسال تأكيد البريد' : 'فشل إعادة إرسال تأكيد البريد',
          newValue: JSON.stringify({
            messageId: result.messageId || null,
            response: result.response || null,
            error: result.error || null,
          }),
        },
      }),
    ]);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'تعذر إرسال رسالة تأكيد البريد. تم تسجيل الفشل ويمكن إعادة المحاولة بعد دقيقة.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم إرسال رسالة تأكيد البريد إلى المتقدم.',
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('Admin resend verification email error:', message);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء إعادة إرسال تأكيد البريد.' },
      { status: 500 }
    );
  }
}
