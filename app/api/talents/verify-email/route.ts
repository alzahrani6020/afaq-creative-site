import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildVerificationSuccessHtml, buildVerificationErrorHtml } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return new NextResponse(buildVerificationErrorHtml('الرابط غير صالح أو انتهت صلاحيته.'), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
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
      prisma.emailVerificationToken.update({
        where: { id: record.id },
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

    return new NextResponse(buildVerificationSuccessHtml(record.application.applicationNumber), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Email verification error:', message);
    return new NextResponse(buildVerificationErrorHtml('حدث خطأ أثناء التحقق من البريد.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
