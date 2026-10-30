export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
const ApplicationStatus = ['new', 'under_review', 'qualified', 'need_information', 'contacted', 'accepted', 'rejected'] as const;
import { requireAdmin, UnauthorizedError, isAuthorizedRole } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { getStorage, isStorageUrl, extractStorageKey } from '@/lib/storage';

const updateSchema = z.object({
  status: z.enum(['new', 'under_review', 'qualified', 'need_information', 'contacted', 'accepted', 'rejected']).optional(),
  adminNotes: z.string().max(5000).optional(),
  personal: z.record(z.string(), z.any()).optional(),
  location: z.record(z.string(), z.any()).optional(),
  links: z.record(z.string(), z.string().or(z.literal(''))).optional(),
});

function safeJsonParse<T = any>(str: string | null | undefined, fallback: T): T {
  try {
    return str ? JSON.parse(str) : fallback;
  } catch {
    return fallback;
  }
}

function safeJsonStringify(value: any): string {
  try {
    return JSON.stringify(value);
  } catch {
    return '{}';
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin(req);
    const { id } = params;

    const talent = await prisma.talentApplication.findUnique({
      where: { id },
      include: {
        skillProfiles: {
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: { adminUser: { select: { name: true, email: true } } },
        },
      },
    });

    if (!talent) {
      return NextResponse.json({ success: false, message: 'الطلب غير موجود.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, talent });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('Admin talent detail error:', message);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء جلب البيانات.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(req);
    const { id } = params;
    const body = await req.json();
    const parsed = updateSchema.parse(body);

    const current = await prisma.talentApplication.findUnique({
      where: { id },
    });
    if (!current) {
      return NextResponse.json({ success: false, message: 'الطلب غير موجود.' }, { status: 404 });
    }

    // Prevent any attempt to change the application number
    if (body.applicationNumber !== undefined) {
      return NextResponse.json(
        { success: false, message: 'لا يمكن تعديل رقم الطلب.' },
        { status: 400 }
      );
    }

    const data: any = {};
    const changes: string[] = [];

    // Status and admin notes
    if (parsed.status && Object.values(ApplicationStatus).includes(parsed.status)) {
      data.status = parsed.status;
      if (parsed.status !== current.status) {
        changes.push(`تغيير الحالة من ${current.status} إلى ${parsed.status}`);
      }
    }
    if (typeof parsed.adminNotes === 'string') {
      data.adminNotes = parsed.adminNotes;
      if (parsed.adminNotes !== current.adminNotes) {
        changes.push('تحديث الملاحظات الإدارية');
      }
    }

    // Personal info edits
    if (parsed.personal && typeof parsed.personal === 'object') {
      const personal = safeJsonParse<Record<string, any>>(current.personal, {});
      const allowedPersonalFields = ['full_name', 'phone', 'email', 'social_link', 'country'];

      for (const field of allowedPersonalFields) {
        if (field in parsed.personal) {
          const oldValue = personal[field];
          const newValue = parsed.personal[field];
          if (oldValue !== newValue) {
            personal[field] = newValue;
            changes.push(`تعديل ${field}`);
          }
        }
      }

      data.personal = safeJsonStringify(personal);
      if (personal.phone !== undefined && personal.phone !== current.phone) {
        data.phone = personal.phone;
      }
      if (personal.email !== undefined && personal.email !== current.email) {
        data.email = personal.email;
      }
      if (personal.country !== undefined && personal.country !== current.country) {
        data.country = personal.country;
      }
    }

    // Location edits
    if (parsed.location && typeof parsed.location === 'object') {
      const location = safeJsonParse<Record<string, any>>(current.country ? JSON.stringify({
        country: current.country,
        region: current.region,
        city: current.city,
        district: current.district,
        serviceArea: safeJsonParse<string[]>(current.serviceArea, []),
        workPlace: safeJsonParse<string[]>(current.workPlace, []),
      }) : '{}', {});

      const allowedLocationFields = ['country', 'region', 'city', 'district', 'serviceArea', 'workPlace'];
      for (const field of allowedLocationFields) {
        if (field in parsed.location) {
          const oldValue = location[field];
          const newValue = parsed.location[field];
          if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            location[field] = newValue;
            changes.push(`تعديل ${field}`);
          }
        }
      }

      data.country = location.country;
      data.region = location.region;
      data.city = location.city;
      data.district = location.district;
      data.serviceArea = safeJsonStringify(location.serviceArea);
      data.workPlace = safeJsonStringify(location.workPlace);
    }

    // Portfolio links edits
    if (parsed.links && typeof parsed.links === 'object') {
      const attachments = safeJsonParse<Record<string, any>>(current.attachments, {});
      const allowedLinkFields = ['portfolio_url', 'behance_url', 'instagram_url', 'github_url', 'website_url'];
      for (const field of allowedLinkFields) {
        if (field in parsed.links) {
          const oldValue = attachments[field];
          const newValue = parsed.links[field];
          if (oldValue !== newValue) {
            if (newValue) {
              attachments[field] = newValue;
            } else {
              delete attachments[field];
            }
            changes.push(`تعديل ${field}`);
          }
        }
      }
      data.attachments = safeJsonStringify(attachments);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: true, talent: current });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const talent = await tx.talentApplication.update({
        where: { id },
        data,
      });

      if (changes.length > 0) {
        await tx.talentApplicationActivity.create({
          data: {
            applicationId: id,
            adminUserId: admin.id,
            action: changes.join('، '),
            oldValue: JSON.stringify({
              status: current.status,
              adminNotes: current.adminNotes,
              personal: current.personal,
              country: current.country,
              region: current.region,
              city: current.city,
              district: current.district,
              serviceArea: current.serviceArea,
              workPlace: current.workPlace,
              attachments: current.attachments,
            }),
            newValue: JSON.stringify({
              status: talent.status,
              adminNotes: talent.adminNotes,
              personal: talent.personal,
              country: talent.country,
              region: talent.region,
              city: talent.city,
              district: talent.district,
              serviceArea: talent.serviceArea,
              workPlace: talent.workPlace,
              attachments: talent.attachments,
            }),
          },
        });
      }

      return talent;
    });

    return NextResponse.json({ success: true, talent: updated });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'البيانات المُرسلة غير صحيحة.' },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('Admin talent update error:', message);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء تحديث البيانات.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(req);
    const { id } = params;

    // Allow admin or super_admin; admin is the highest available role in the current setup.
    if (!isAuthorizedRole(admin.role, ['admin', 'super_admin'])) {
      return NextResponse.json({ success: false, message: 'ليس لديك صلاحية الحذف.' }, { status: 403 });
    }

    const talent = await prisma.talentApplication.findUnique({
      where: { id },
      select: { applicationNumber: true, attachments: true },
    });

    if (!talent) {
      return NextResponse.json({ success: false, message: 'الطلب غير موجود.' }, { status: 404 });
    }

    await prisma.talentApplication.delete({ where: { id } });

    // Clean up stored files after DB deletion. Failures are logged but do not
    // change the success response, since the DB record is already removed.
    try {
      const attachments = safeJsonParse<Record<string, any>>(talent.attachments, {});
      const storage = getStorage();
      const fileUrls: string[] = [];

      if (attachments.profile_photo && isStorageUrl(attachments.profile_photo)) {
        fileUrls.push(attachments.profile_photo);
      }
      if (attachments.work_video && isStorageUrl(attachments.work_video)) {
        fileUrls.push(attachments.work_video);
      }
      if (attachments.cv && isStorageUrl(attachments.cv)) {
        fileUrls.push(attachments.cv);
      }
      if (Array.isArray(attachments.work_photos)) {
        for (const url of attachments.work_photos) {
          if (isStorageUrl(url)) fileUrls.push(url);
        }
      }

      for (const url of fileUrls) {
        const key = extractStorageKey(url);
        if (key) {
          await storage.deleteFile(key);
        }
      }
    } catch (cleanupErr) {
      const message = cleanupErr instanceof Error ? cleanupErr.message : String(cleanupErr);
      console.error('Admin talent delete cleanup error:', { applicationNumber: talent.applicationNumber, error: message });
    }

    return NextResponse.json({ success: true, message: 'تم حذف الطلب بنجاح.' });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('Admin talent delete error:', message);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء حذف البيانات.' },
      { status: 500 }
    );
  }
}
