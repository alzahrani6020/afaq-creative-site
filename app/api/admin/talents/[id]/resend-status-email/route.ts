import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, UnauthorizedError } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { buildApplicationStatusEmail, buildBaseUrl, sendTransactionalEmail } from '@/lib/email';
import {
  createApplicantUploadToken,
  rotateApplicantUploadAccess,
} from '@/lib/applicant-upload-token';

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
    const current = await prisma.talentApplication.findUnique({ where: { id: params.id } });

    if (!current) {
      return NextResponse.json({ success: false, message: 'الطلب غير موجود.' }, { status: 404 });
    }
    if (!current.email) {
      return NextResponse.json({ success: false, message: 'لا يوجد بريد إلكتروني مسجل لهذا الطلب.' }, { status: 400 });
    }

    let application = current;
    let uploadUrl: string | undefined;

    if (current.status === 'need_information') {
      if (!current.emailVerified) {
        return NextResponse.json({ success: false, message: 'يجب تأكيد البريد الإلكتروني قبل إعادة إرسال رابط الاستكمال.' }, { status: 409 });
      }
      const rotated = rotateApplicantUploadAccess(current.attachments);
      application = await prisma.talentApplication.update({
        where: { id: current.id },
        data: { attachments: rotated.attachments },
      });
      uploadUrl = `${buildBaseUrl()}/talents/upload?application=${encodeURIComponent(application.applicationNumber)}&token=${encodeURIComponent(createApplicantUploadToken(application.id, application.applicationNumber, rotated.accessId))}`;
    }

    const personal = parseJson<Record<string, any>>(application.personal, {});
    const { subject, html, text } = buildApplicationStatusEmail({
      applicationNumber: application.applicationNumber,
      name: personal.full_name || null,
      status: application.status,
      uploadUrl,
    });

    const result = await sendTransactionalEmail({
      to: application.email,
      subject,
      html,
      text,
    });

    await prisma.talentApplicationActivity.create({
      data: {
        applicationId: application.id,
        adminUserId: admin.id,
        action: result.success ? 'تمت إعادة إرسال إشعار حالة الطلب' : 'فشل إعادة إرسال إشعار حالة الطلب',
        newValue: JSON.stringify({
          status: application.status,
          messageId: result.messageId || null,
          response: result.response || null,
          error: result.error || null,
        }),
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: 'تعذر إرسال إشعار الحالة. حاول مرة أخرى بعد التحقق من إعداد البريد.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, message: 'تم إرسال إشعار الحالة إلى بريد المتقدم.' });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('Resend talent status email error:', message);
    return NextResponse.json({ success: false, message: 'حدث خطأ أثناء إعادة إرسال إشعار الحالة.' }, { status: 500 });
  }
}
