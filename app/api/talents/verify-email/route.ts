import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildVerificationSuccessHtml, buildVerificationErrorHtml, buildBaseUrl } from '@/lib/email';
import { createApplicantUploadToken, rotateApplicantUploadAccess } from '@/lib/applicant-upload-token';
import { getEmailVerificationLookup } from '@/lib/applicant-email-verification';

export const dynamic = 'force-dynamic';

function htmlResponse(html: string, status = 200) {
  const res = new NextResponse(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('Referrer-Policy', 'no-referrer');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  return res;
}

function buildVerificationConfirmHtml(token: string): string {
  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>تأكيد البريد الإلكتروني</title>
      <style>
        body { font-family: Arial, Tahoma, sans-serif; background: #0f172a; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 40px; max-width: 480px; text-align: center; }
        h1 { color: #f59e0b; font-size: 24px; margin-bottom: 16px; }
        p { color: rgba(255,255,255,0.7); line-height: 1.7; }
        button { margin-top: 16px; padding: 12px 24px; background: #14b8a6; color: #fff; border: 0; border-radius: 8px; font-weight: bold; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>تأكيد البريد الإلكتروني</h1>
        <p>اضغط الزر أدناه لإكمال تأكيد بريدك الإلكتروني. فتح الرابط وحده لا يغيّر حالة طلبك.</p>
        <form method="post" action="/api/talents/verify-email">
          <input type="hidden" name="token" value="${token}" />
          <button type="submit">تأكيد البريد والمتابعة</button>
        </form>
      </div>
    </body>
    </html>
  `;
}

async function findVerificationRecord(token: string) {
  const lookup = getEmailVerificationLookup(token);
  if (!lookup) return null;

  return 'legacyToken' in lookup
    ? prisma.emailVerificationToken.findUnique({
        where: { token: lookup.legacyToken },
        include: { application: true },
      })
    : prisma.emailVerificationToken.findFirst({
        where: { token: { startsWith: lookup.tokenPrefix } },
        include: { application: true },
        orderBy: { createdAt: 'desc' },
      });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token')?.trim() || '';

    if (!token) {
      return htmlResponse(buildVerificationErrorHtml('الرابط غير صالح أو انتهت صلاحيته.'), 400);
    }

    const record = await findVerificationRecord(token);
    if (!record || record.used || record.expiresAt < new Date()) {
      return htmlResponse(buildVerificationErrorHtml('الرابط غير صالح أو انتهت صلاحيته.'), 400);
    }

    return htmlResponse(buildVerificationConfirmHtml(token), 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Email verification preview error:', message);
    return htmlResponse(buildVerificationErrorHtml('حدث خطأ أثناء التحقق من الرابط.'), 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let token = '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      token = typeof body?.token === 'string' ? body.token.trim() : '';
    } else {
      const form = await req.formData();
      const value = form.get('token');
      token = typeof value === 'string' ? value.trim() : '';
    }

    if (!token) {
      return htmlResponse(buildVerificationErrorHtml('الرابط غير صالح أو انتهت صلاحيته.'), 400);
    }

    const record = await findVerificationRecord(token);
    if (!record || record.used || record.expiresAt < new Date()) {
      return htmlResponse(buildVerificationErrorHtml('الرابط غير صالح أو انتهت صلاحيته.'), 400);
    }

    const rotated = rotateApplicantUploadAccess(record.application.attachments);

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
          attachments: rotated.attachments,
        },
      }),
      prisma.talentApplicationActivity.create({
        data: {
          applicationId: record.applicationId,
          action: 'تم تأكيد البريد عبر رابط التحقق',
        },
      }),
    ]);

    const uploadToken = createApplicantUploadToken(
      record.application.id,
      record.application.applicationNumber,
      rotated.accessId
    );
    const uploadUrl = `${buildBaseUrl()}/talents/upload?application=${encodeURIComponent(record.application.applicationNumber)}&token=${encodeURIComponent(uploadToken)}`;

    return htmlResponse(
      buildVerificationSuccessHtml(record.application.applicationNumber, uploadUrl),
      200
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Email verification error:', message);
    return htmlResponse(buildVerificationErrorHtml('حدث خطأ أثناء التحقق من البريد.'), 500);
  }
}
