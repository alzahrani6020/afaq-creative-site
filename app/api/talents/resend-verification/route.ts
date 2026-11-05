import { NextRequest, NextResponse } from 'next/server';
import { createEmailVerificationCredential } from '@/lib/applicant-email-verification';
import { prisma } from '@/lib/prisma';
import { sendTransactionalEmail, buildApplicationReceivedEmail, buildBaseUrl } from '@/lib/email';
import { getClientIp } from '@/lib/admin-auth';
import { createApplicantUploadToken, rotateApplicantUploadAccess } from '@/lib/applicant-upload-token';
import { checkPersistentRateLimit } from '@/lib/security-rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateAllowed = await checkPersistentRateLimit({
      scope: 'talent-resend',
      identifier: ip,
      windowMs: 60_000,
      max: 3,
    });
    if (!rateAllowed) {
      return NextResponse.json(
        { success: false, message: 'تم تجاوز عدد المحاولات المسموح بها. حاول لاحقاً.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: 'البريد الإلكتروني غير صحيح.' },
        { status: 400 }
      );
    }

    // Generic response to avoid email/account enumeration.
    const genericResponse = NextResponse.json(
      { success: true, message: 'إذا كان الطلب موجودًا، فسيتم إرسال رسالة الاستكمال إلى البريد الإلكتروني.' },
      { status: 200 }
    );

    const application = await prisma.talentApplication.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });

    if (!application) {
      return genericResponse;
    }

    const recentResends = await prisma.talentApplicationActivity.count({
      where: {
        applicationId: application.id,
        action: 'طلب إعادة إرسال تحقق/استكمال',
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
      },
    });
    if (recentResends > 0) {
      return genericResponse;
    }

    await prisma.talentApplicationActivity.create({
      data: {
        applicationId: application.id,
        action: 'طلب إعادة إرسال تحقق/استكمال',
      },
    });

    let token: string | undefined;
    let verificationCode: string | undefined;
    let rotatedUploadAccess: ReturnType<typeof rotateApplicantUploadAccess> | undefined;
    if (!application.emailVerified) {
      // Invalidate any existing unused tokens for this application.
      await prisma.emailVerificationToken.updateMany({
        where: { applicationId: application.id, used: false },
        data: { used: true },
      });

      const credential = createEmailVerificationCredential();
      token = credential.token;
      verificationCode = credential.code;
      await prisma.emailVerificationToken.create({
        data: {
          token: credential.storedToken,
          applicationId: application.id,
          expiresAt: credential.expiresAt,
        },
      });
    }

    let emailStatus: 'pending' | 'sent' | 'failed' = 'pending';
    let emailError: string | null = null;
    let emailMessageId: string | null = null;

    try {
      const personal = JSON.parse(application.personal || '{}');
      const verifyUrl = token ? `${buildBaseUrl()}/api/talents/verify-email?token=${token}` : undefined;
      if (application.emailVerified) {
        rotatedUploadAccess = rotateApplicantUploadAccess(application.attachments);
        await prisma.talentApplication.update({
          where: { id: application.id },
          data: { attachments: rotatedUploadAccess.attachments },
        });
      }
      const uploadToken = rotatedUploadAccess
        ? createApplicantUploadToken(
            application.id,
            application.applicationNumber,
            rotatedUploadAccess.accessId
          )
        : undefined;
      const uploadUrl = uploadToken
        ? `${buildBaseUrl()}/talents/upload?application=${encodeURIComponent(application.applicationNumber)}&token=${encodeURIComponent(uploadToken)}`
        : undefined;
      const { subject, html, text } = buildApplicationReceivedEmail({
        name: personal.full_name || 'متقدم',
        applicationNumber: application.applicationNumber,
        verifyUrl,
        verificationCode,
        uploadUrl,
      });
      const result = await sendTransactionalEmail({ to: application.email, subject, html, text });
      if (result.success) {
        emailStatus = 'sent';
        emailMessageId = result.messageId || null;
      } else {
        emailStatus = 'failed';
        emailError = result.error || 'Unknown error';
      }
    } catch (emailErr) {
      const msg = emailErr instanceof Error ? emailErr.message : String(emailErr);
      emailStatus = 'failed';
      emailError = msg;
    }

    try {
      await prisma.talentApplication.update({
        where: { id: application.id },
        data: {
          emailStatus,
          emailSentAt: emailStatus === 'sent' ? new Date() : null,
          emailFailedAt: emailStatus === 'failed' ? new Date() : null,
          emailError,
          emailMessageId,
        },
      });
    } catch (updateErr) {
      const msg = updateErr instanceof Error ? updateErr.message : String(updateErr);
      console.error('Failed to update email status on resend', {
        applicationNumber: application.applicationNumber,
        error: msg,
      });
    }

    if (emailStatus === 'failed') {
      console.error('Resend verification delivery failed', {
        applicationNumber: application.applicationNumber,
        error: emailError || 'Unknown error',
      });
    }

    return genericResponse;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Resend verification error:', message);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء معالجة الطلب.' },
      { status: 500 }
    );
  }
}
