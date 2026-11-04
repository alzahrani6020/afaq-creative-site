import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, UnauthorizedError } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { createApplicantUploadToken, rotateApplicantUploadAccess } from '@/lib/applicant-upload-token';
import { buildApplicationReceivedEmail, buildBaseUrl, sendTransactionalEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(req);
    const talent = await prisma.talentApplication.findUnique({ where: { id: params.id } });

    if (!talent) {
      return NextResponse.json({ success: false, message: 'الطلب غير موجود.' }, { status: 404 });
    }
    if (!talent.email) {
      return NextResponse.json({ success: false, message: 'لا يوجد بريد إلكتروني مسجل لهذا الطلب.' }, { status: 400 });
    }
    if (!talent.emailVerified) {
      return NextResponse.json({ success: false, message: 'يجب تأكيد البريد الإلكتروني قبل إرسال رابط الاستكمال.' }, { status: 409 });
    }

    const attachments = (() => {
      try { return JSON.parse(talent.attachments || '{}'); } catch { return {}; }
    })();
    const workflow = attachments._workflow && typeof attachments._workflow === 'object'
      ? attachments._workflow
      : {};
    if (workflow.submitted === true && talent.status !== 'need_information') {
      return NextResponse.json({
        success: false,
        message: 'الملف مُرسل للمراجعة ومجمّد. غيّر الحالة إلى يحتاج بيانات لإعادة فتحه قبل إرسال رابط جديد.',
      }, { status: 409 });
    }

    const rotated = rotateApplicantUploadAccess(talent.attachments);
    const token = createApplicantUploadToken(talent.id, talent.applicationNumber, rotated.accessId);
    const uploadUrl = `${buildBaseUrl()}/talents/upload?application=${encodeURIComponent(talent.applicationNumber)}&token=${encodeURIComponent(token)}`;
    let name = 'متقدم';
    try {
      name = JSON.parse(talent.personal || '{}').full_name || name;
    } catch {}

    const { subject, html, text } = buildApplicationReceivedEmail({
      name,
      applicationNumber: talent.applicationNumber,
      uploadUrl,
    });
    const result = await sendTransactionalEmail({
      to: talent.email,
      subject: `استكمال ملفك في آفاق – ${talent.applicationNumber}`,
      html,
      text,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, message: 'تعذر إرسال رابط الاستكمال في الوقت الحالي.' }, { status: 502 });
    }

    await prisma.$transaction([
      prisma.talentApplication.update({
        where: { id: talent.id },
        data: { attachments: rotated.attachments },
      }),
      prisma.talentApplicationActivity.create({
        data: {
          applicationId: talent.id,
          adminUserId: admin.id,
          action: 'إرسال رابط استكمال جديد للمتقدم',
          newValue: JSON.stringify({ uploadAccessId: rotated.accessId }),
        },
      }),
    ]);

    return NextResponse.json({ success: true, message: 'تم إرسال رابط استكمال جديد إلى بريد المتقدم.' });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }
    console.error('Send applicant upload link error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ success: false, message: 'حدث خطأ أثناء إرسال الرابط.' }, { status: 500 });
  }
}
