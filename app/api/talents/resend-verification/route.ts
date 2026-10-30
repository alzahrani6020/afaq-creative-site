import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendTransactionalEmail, buildApplicationReceivedEmail, buildBaseUrl } from '@/lib/email';
import { getClientIp } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 3;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimit.get(ip);
  if (!record || now > record.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX) return false;
  record.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, message: 'تم تجاوز عدد المحاولات المسموح بها. حاول لاحقاً.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const applicationNumber = typeof body.applicationNumber === 'string' ? body.applicationNumber.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!applicationNumber || !email) {
      return NextResponse.json(
        { success: false, message: 'رقم الطلب والبريد الإلكتروني مطلوبان.' },
        { status: 400 }
      );
    }

    const application = await prisma.talentApplication.findUnique({
      where: { applicationNumber },
    });

    // Generic response to avoid email enumeration.
    const genericResponse = NextResponse.json(
      { success: true, message: 'إذا كان الطلب موجودًا، سيتم إرسال رسالة التأكيد.' },
      { status: 200 }
    );

    if (!application || !application.email || application.email.toLowerCase() !== email) {
      return genericResponse;
    }

    if (application.emailVerified) {
      return NextResponse.json(
        { success: true, message: 'البريد الإلكتروني مؤكد بالفعل.' },
        { status: 200 }
      );
    }

    // Invalidate any existing unused tokens for this application.
    await prisma.emailVerificationToken.updateMany({
      where: { applicationId: application.id, used: false },
      data: { used: true },
    });

    const token = crypto.randomBytes(32).toString('hex');
    await prisma.emailVerificationToken.create({
      data: {
        token,
        applicationId: application.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    let emailStatus: 'pending' | 'sent' | 'failed' = 'pending';
    let emailError: string | null = null;
    let emailMessageId: string | null = null;

    try {
      const personal = JSON.parse(application.personal || '{}');
      const verifyUrl = `${buildBaseUrl()}/api/talents/verify-email?token=${token}`;
      const { subject, html, text } = buildApplicationReceivedEmail({
        name: personal.full_name || 'متقدم',
        applicationNumber: application.applicationNumber,
        verifyUrl,
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
      return NextResponse.json(
        { success: false, message: 'تعذر إرسال البريد في الوقت الحالي. حاول لاحقاً.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'تم إرسال رسالة التأكيد.' },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Resend verification error:', message);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء معالجة الطلب.' },
      { status: 500 }
    );
  }
}
