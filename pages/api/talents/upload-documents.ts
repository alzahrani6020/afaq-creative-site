import type { NextApiRequest, NextApiResponse } from 'next';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { prisma } from '@/lib/prisma';
import { getStorage, extractStorageKey, isStorageUrl } from '@/lib/storage';
import { verifyApplicantUploadSessionToken } from '@/lib/applicant-upload-token';

export const config = {
  api: { bodyParser: false },
};

const fieldRules: Record<string, { types: string[]; maxBytes: number; multiple: boolean; limit: number; label: string }> = {
  profile_photo: {
    types: ['image/jpeg', 'image/png', 'image/webp'],
    maxBytes: 10 * 1024 * 1024,
    multiple: false,
    limit: 1,
    label: 'الصورة الشخصية',
  },
  work_photos: {
    types: ['image/jpeg', 'image/png', 'image/webp'],
    maxBytes: 15 * 1024 * 1024,
    multiple: true,
    limit: 10,
    label: 'صور الأعمال',
  },
  work_video: {
    types: ['video/mp4', 'video/webm', 'video/quicktime'],
    maxBytes: 250 * 1024 * 1024,
    multiple: false,
    limit: 1,
    label: 'فيديو الأعمال',
  },
  cv: {
    types: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    maxBytes: 25 * 1024 * 1024,
    multiple: false,
    limit: 1,
    label: 'السيرة الذاتية',
  },
  documents: {
    types: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/webp',
    ],
    maxBytes: 25 * 1024 * 1024,
    multiple: true,
    limit: 10,
    label: 'المؤهلات والشهادات والوثائق',
  },
};

function parseAttachments(raw: string | null | undefined): Record<string, any> {
  try {
    const value = JSON.parse(raw || '{}');
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

async function readJsonBody(req: NextApiRequest): Promise<HandleUploadBody> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > 1024 * 1024) throw new Error('طلب الرفع غير صالح.');
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') as HandleUploadBody;
}

async function resolveApplication(applicationNumber: string, req: NextApiRequest) {
  if (!applicationNumber) return null;
  const sessionToken = req.cookies?.afaq_applicant_upload_session || '';
  if (!sessionToken) return null;
  const application = await prisma.talentApplication.findUnique({ where: { applicationNumber } });
  if (!application) return null;
  if (!application.emailVerified) return null;
  if (!verifyApplicantUploadSessionToken(sessionToken, application.id, application.applicationNumber)) return null;
  return application;
}

async function enforceUploadRateLimit(applicationId: string) {
  const recentUploads = await prisma.talentApplicationActivity.count({
    where: {
      applicationId,
      action: { startsWith: 'رفع المتقدم ملفًا' },
      createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
    },
  });
  if (recentUploads >= 30) {
    throw new Error('تم تجاوز عدد عمليات الرفع المسموح بها مؤقتًا. حاول لاحقًا.');
  }
}

async function safeDelete(urls: string[]) {
  const storage = getStorage();
  for (const url of urls) {
    if (!isStorageUrl(url)) continue;
    const key = extractStorageKey(url);
    if (!key) continue;
    try {
      await storage.deleteFile(key);
    } catch (error) {
      console.error('Applicant file cleanup failed', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

function buildChecklist(application: any, attachments: Record<string, any>) {
  const required = [
    { key: 'email', label: 'تأكيد البريد الإلكتروني', complete: Boolean(application.emailVerified) },
    { key: 'cv', label: 'السيرة الذاتية', complete: Boolean(attachments.cv) },
    {
      key: 'documents',
      label: 'وثيقة مؤهل أو شهادة واحدة على الأقل',
      complete: Array.isArray(attachments.documents) && attachments.documents.length > 0,
    },
  ];
  const recommended = [
    { key: 'profile_photo', label: 'الصورة الشخصية', complete: Boolean(attachments.profile_photo) },
    {
      key: 'work_samples',
      label: 'صور أو فيديو للأعمال',
      complete:
        (Array.isArray(attachments.work_photos) && attachments.work_photos.length > 0) ||
        Boolean(attachments.work_video),
    },
  ];
  const complete = required.every((item) => item.complete);
  const workflow = attachments._workflow && typeof attachments._workflow === 'object'
    ? attachments._workflow
    : {};
  return {
    status: complete ? 'complete' : 'incomplete',
    submitted: workflow.submitted === true,
    submittedAt: workflow.submittedAt || null,
    required,
    recommended,
  };
}

function publicCurrent(application: any, attachments: Record<string, any>) {
  const meta = attachments._meta && typeof attachments._meta === 'object' ? attachments._meta : {};
  const single = (field: string) => {
    if (!attachments[field]) return null;
    const m = meta[field] && !Array.isArray(meta[field]) ? meta[field] : {};
    return {
      field,
      name: m.originalName || fieldRules[field]?.label || 'ملف',
      size: Number(m.size || 0),
      uploadedAt: m.uploadedAt || null,
    };
  };
  const multiple = (field: string) => {
    const urls = Array.isArray(attachments[field]) ? attachments[field] : [];
    const items = Array.isArray(meta[field]) ? meta[field] : [];
    return urls.map((_url: string, index: number) => ({
      field,
      index,
      name: items[index]?.originalName || `${fieldRules[field]?.label || 'ملف'} #${index + 1}`,
      size: Number(items[index]?.size || 0),
      uploadedAt: items[index]?.uploadedAt || null,
    }));
  };

  return {
    profile_photo: single('profile_photo'),
    cv: single('cv'),
    work_video: single('work_video'),
    work_photos: multiple('work_photos'),
    documents: multiple('documents'),
    checklist: buildChecklist(application, attachments),
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const applicationNumber = typeof req.query.applicationNumber === 'string' ? req.query.applicationNumber : '';
    const application = await resolveApplication(applicationNumber, req);
    if (!application) return res.status(401).json({ success: false, message: 'الرابط غير صالح أو منتهي الصلاحية.' });

    const attachments = parseAttachments(application.attachments);
    let name = '';
    try {
      name = JSON.parse(application.personal || '{}').full_name || '';
    } catch {}

    return res.status(200).json({
      success: true,
      applicationNumber: application.applicationNumber,
      name,
      current: publicCurrent(application, attachments),
    });
  }

  if (req.method === 'PATCH') {
    const applicationNumber = typeof req.query.applicationNumber === 'string' ? req.query.applicationNumber : '';
    const application = await resolveApplication(applicationNumber, req);
    if (!application) {
      return res.status(401).json({ success: false, message: 'يجب تأكيد البريد الإلكتروني أولًا أو طلب رابط استكمال جديد.' });
    }

    const attachments = parseAttachments(application.attachments);
    const checklist = buildChecklist(application, attachments);
    if (checklist.status !== 'complete') {
      return res.status(400).json({ success: false, message: 'لا يمكن إرسال الملف للمراجعة قبل استكمال المتطلبات الأساسية.' });
    }

    const workflow = attachments._workflow && typeof attachments._workflow === 'object'
      ? attachments._workflow
      : {};

    if (workflow.submitted === true) {
      return res.status(200).json({
        success: true,
        message: 'الملف مُرسل للمراجعة بالفعل.',
        current: publicCurrent(application, attachments),
      });
    }

    const now = new Date().toISOString();
    attachments._workflow = {
      ...workflow,
      submitted: true,
      submittedAt: now,
      version: Number(workflow.version || 0) + 1,
    };

    await prisma.$transaction([
      prisma.talentApplication.update({
        where: { id: application.id },
        data: { attachments: JSON.stringify(attachments), status: 'under_review' },
      }),
      prisma.talentApplicationActivity.create({
        data: {
          applicationId: application.id,
          action: 'أرسل المتقدم الملف للمراجعة',
          newValue: JSON.stringify({ submittedAt: now, version: attachments._workflow.version }),
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'تم إرسال الملف للمراجعة وتجميد التعديلات.',
      current: publicCurrent({ ...application, status: 'under_review' }, attachments),
    });
  }

  if (req.method === 'DELETE') {
    const applicationNumber = typeof req.query.applicationNumber === 'string' ? req.query.applicationNumber : '';
    const field = typeof req.query.field === 'string' ? req.query.field : '';
    const indexRaw = typeof req.query.index === 'string' ? req.query.index : '';
    const application = await resolveApplication(applicationNumber, req);
    if (!application) return res.status(401).json({ success: false, message: 'الرابط غير صالح أو منتهي الصلاحية.' });

    const rule = fieldRules[field];
    if (!rule) return res.status(400).json({ success: false, message: 'نوع المرفق غير صالح.' });

    const attachments = parseAttachments(application.attachments);
    const workflow = attachments._workflow && typeof attachments._workflow === 'object'
      ? attachments._workflow
      : {};
    if (workflow.submitted === true) {
      return res.status(409).json({ success: false, message: 'الملف مُرسل للمراجعة ولا يمكن تعديل المرفقات إلا بعد إعادة فتحه من الإدارة.' });
    }
    const meta = attachments._meta && typeof attachments._meta === 'object' ? attachments._meta : {};
    const removed: string[] = [];

    if (rule.multiple) {
      const index = Number(indexRaw);
      const urls: string[] = Array.isArray(attachments[field]) ? [...attachments[field]] : [];
      const metaItems: any[] = Array.isArray(meta[field]) ? [...meta[field]] : [];
      if (!Number.isInteger(index) || index < 0 || index >= urls.length) {
        return res.status(400).json({ success: false, message: 'الملف المطلوب غير موجود.' });
      }
      const [url] = urls.splice(index, 1);
      metaItems.splice(index, 1);
      if (url) removed.push(url);
      attachments[field] = urls;
      meta[field] = metaItems;
    } else {
      const url = attachments[field];
      if (!url) return res.status(400).json({ success: false, message: 'الملف المطلوب غير موجود.' });
      removed.push(url);
      delete attachments[field];
      delete meta[field];
    }

    attachments._meta = meta;
    await prisma.$transaction([
      prisma.talentApplication.update({
        where: { id: application.id },
        data: { attachments: JSON.stringify(attachments) },
      }),
      prisma.talentApplicationActivity.create({
        data: {
          applicationId: application.id,
          action: `حذف المتقدم ملفًا: ${field}`,
          oldValue: JSON.stringify({ field, index: indexRaw || null }),
        },
      }),
    ]);
    await safeDelete(removed);
    return res.status(200).json({
      success: true,
      message: 'تم حذف الملف.',
      current: publicCurrent(application, attachments),
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'الطريقة غير مسموحة.' });
  }

  try {
    const body = await readJsonBody(req);
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        let payload: any = {};
        try {
          payload = JSON.parse(clientPayload || '{}');
        } catch {
          throw new Error('بيانات الرفع غير صالحة.');
        }

        const applicationNumber = String(payload.applicationNumber || '');
        const field = String(payload.field || '');
        const originalName = String(payload.originalName || '').slice(0, 240);
        const size = Number(payload.size || 0);
        const rule = fieldRules[field];

        if (!rule) throw new Error('نوع المرفق غير مسموح.');
        if (!Number.isFinite(size) || size <= 0 || size > rule.maxBytes) {
          throw new Error(`حجم الملف يتجاوز الحد المسموح (${Math.round(rule.maxBytes / 1024 / 1024)} MB).`);
        }

        const application = await resolveApplication(applicationNumber, req);
        if (!application) throw new Error('يجب تأكيد البريد الإلكتروني أولًا أو طلب رابط استكمال جديد.');
        const attachments = parseAttachments(application.attachments);
        const workflow = attachments._workflow && typeof attachments._workflow === 'object'
          ? attachments._workflow
          : {};
        if (workflow.submitted === true) {
          throw new Error('الملف مُرسل للمراجعة ولا يمكن تعديل المرفقات إلا بعد إعادة فتحه من الإدارة.');
        }
        await enforceUploadRateLimit(application.id);

        return {
          allowedContentTypes: rule.types,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            applicationId: application.id,
            applicationNumber: application.applicationNumber,
            field,
            originalName,
            size,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = JSON.parse(tokenPayload || '{}');
        const field = String(payload.field || '');
        const rule = fieldRules[field];
        if (!rule) throw new Error('Invalid field');

        const application = await prisma.talentApplication.findUnique({
          where: { id: String(payload.applicationId || '') },
        });
        if (!application || application.applicationNumber !== payload.applicationNumber) {
          throw new Error('Application not found');
        }

        const attachments = parseAttachments(application.attachments);
        const meta = attachments._meta && typeof attachments._meta === 'object' ? attachments._meta : {};
        const now = new Date().toISOString();
        const toDelete: string[] = [];
        const fileMeta = {
          originalName: String(payload.originalName || ''),
          size: Number(payload.size || 0),
          contentType: blob.contentType || '',
          pathname: blob.pathname,
          uploadedAt: now,
        };

        if (rule.multiple) {
          const urls: string[] = Array.isArray(attachments[field]) ? [...attachments[field]] : [];
          const metaItems: any[] = Array.isArray(meta[field]) ? [...meta[field]] : [];
          urls.push(blob.url);
          metaItems.push(fileMeta);
          while (urls.length > rule.limit) {
            const old = urls.shift();
            metaItems.shift();
            if (old && isStorageUrl(old)) toDelete.push(old);
          }
          attachments[field] = urls;
          meta[field] = metaItems;
        } else {
          const previous = attachments[field];
          if (typeof previous === 'string' && isStorageUrl(previous)) toDelete.push(previous);
          attachments[field] = blob.url;
          meta[field] = fileMeta;
        }

        attachments._meta = meta;

        await prisma.$transaction([
          prisma.talentApplication.update({
            where: { id: application.id },
            data: { attachments: JSON.stringify(attachments) },
          }),
          prisma.talentApplicationActivity.create({
            data: {
              applicationId: application.id,
              action: `رفع المتقدم ملفًا: ${field}`,
              newValue: JSON.stringify({
                field,
                originalName: fileMeta.originalName,
                size: fileMeta.size,
                contentType: fileMeta.contentType,
                uploadedAt: now,
              }),
            },
          }),
        ]);

        await safeDelete(toDelete);
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Applicant direct upload error:', message);
    return res.status(400).json({ success: false, message });
  }
}
