import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, UnauthorizedError, isAuthorizedRole } from '@/lib/admin-auth';
import { getStoredFileFetchHeaders, isStorageUrl } from '@/lib/storage';

export const dynamic = 'force-dynamic';

const allowedFields = new Set(['profile_photo', 'work_photos', 'work_video', 'cv', 'documents']);

function parseAttachments(raw: string | null | undefined): Record<string, any> {
  try {
    const value = JSON.parse(raw || '{}');
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

function resolveStoredUrl(attachments: Record<string, any>, field: string, indexRaw: string | null) {
  if (!allowedFields.has(field)) return null;
  const value = attachments[field];

  if (Array.isArray(value)) {
    const index = Number(indexRaw);
    if (!Number.isInteger(index) || index < 0 || index >= value.length) return null;
    return typeof value[index] === 'string' ? value[index] : null;
  }

  return typeof value === 'string' ? value : null;
}

function originalName(attachments: Record<string, any>, field: string, indexRaw: string | null) {
  const meta = attachments._meta && typeof attachments._meta === 'object' ? attachments._meta : {};
  const item = meta[field];

  if (Array.isArray(item)) {
    const index = Number(indexRaw);
    const name = Number.isInteger(index) ? item[index]?.originalName : null;
    return typeof name === 'string' && name ? name : field;
  }

  return typeof item?.originalName === 'string' && item.originalName ? item.originalName : field;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(req);
    const configuredRoles = (process.env.ADMIN_ATTACHMENT_ROLES || 'admin,super_admin')
      .split(',')
      .map((role) => role.trim())
      .filter(Boolean);
    if (!isAuthorizedRole(admin.role, configuredRoles)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const field = req.nextUrl.searchParams.get('field') || '';
    const indexRaw = req.nextUrl.searchParams.get('index');

    const application = await prisma.talentApplication.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        applicationNumber: true,
        attachments: true,
      },
    });

    if (!application) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const attachments = parseAttachments(application.attachments);
    const url = resolveStoredUrl(attachments, field, indexRaw);

    if (!url || !isStorageUrl(url)) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const upstream = await fetch(url, {
      headers: getStoredFileFetchHeaders(url),
      redirect: 'error',
      cache: 'no-store',
    });

    if (!upstream.ok || !upstream.body) {
      return new NextResponse('Unable to read attachment', { status: 502 });
    }

    const name = originalName(attachments, field, indexRaw).replace(/[\r\n"]/g, '_').slice(0, 180);
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const disposition = field === 'profile_photo' || field === 'work_photos' || field === 'work_video'
      ? 'inline'
      : 'attachment';

    await prisma.talentApplicationActivity.create({
      data: {
        applicationId: application.id,
        adminUserId: admin.id,
        action: 'وصول إداري إلى مرفق',
        newValue: JSON.stringify({
          field,
          index: indexRaw ?? null,
          fileName: name,
        }),
      },
    });

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `${disposition}; filename*=UTF-8''${encodeURIComponent(name)}`);
    headers.set('Cache-Control', 'no-store, private');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'no-referrer');

    return new NextResponse(upstream.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    console.error('Admin attachment access error:', error instanceof Error ? error.message : String(error));
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
