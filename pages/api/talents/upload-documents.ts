import type { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { getStorage, extractStorageKey, isStorageUrl } from '@/lib/storage';
import { verifyApplicantUploadToken } from '@/lib/applicant-upload-token';

export const config = {
  api: { bodyParser: false },
};

const allowedFiles: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

const blockedExtensions = new Set(['.exe', '.js', '.sh', '.bat', '.cmd', '.php', '.html', '.htm', '.svg']);
const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10);

interface MulterFile {
  fieldname: string;
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

interface MulterRequest extends NextApiRequest {
  files?: { [fieldname: string]: MulterFile[] };
}

function getExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

function fileFilter(req: any, file: any, cb: any) {
  const ext = getExtension(file.originalname);
  const allowedExts = allowedFiles[file.mimetype] || [];
  if (blockedExtensions.has(ext) || !allowedExts.includes(ext)) {
    return cb(new Error(`نوع الملف غير مسموح به: ${ext || file.mimetype}`));
  }
  cb(null, true);
}

function validateFileContent(buffer: Buffer, mimetype: string): boolean {
  if (buffer.length < 4) return false;
  const signatures: Record<string, (buf: Buffer) => boolean> = {
    'image/jpeg': (buf) => buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
    'image/png': (buf) => buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47,
    'image/gif': (buf) => buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38,
    'image/webp': (buf) => buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50,
    'application/pdf': (buf) => buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46,
    'video/mp4': (buf) => buf.length >= 12 && buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70,
    'video/webm': (buf) => buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3,
    'application/msword': (buf) => buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': (buf) =>
      buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04,
  };
  return signatures[mimetype]?.(buffer) ?? false;
}

async function storeUpload(file: MulterFile): Promise<string> {
  if (!validateFileContent(file.buffer, file.mimetype)) {
    throw new Error(`محتوى الملف لا يطابق النوع المعلن: ${file.mimetype}`);
  }
  const stored = await getStorage().saveFile({
    buffer: file.buffer,
    originalName: file.originalname,
    mimeType: file.mimetype,
    field: file.fieldname,
  });
  return stored.url;
}

async function cleanup(urls: string[]) {
  for (const url of urls) {
    const key = extractStorageKey(url);
    if (!key) continue;
    try { await getStorage().deleteFile(key); } catch {}
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxSize, files: 13 },
  fileFilter,
});

const uploadMiddleware = upload.fields([
  { name: 'profile_photo', maxCount: 1 },
  { name: 'work_photos', maxCount: 5 },
  { name: 'work_video', maxCount: 1 },
  { name: 'cv', maxCount: 1 },
  { name: 'documents', maxCount: 5 },
]);

function runMiddleware(req: MulterRequest, res: NextApiResponse, fn: Function) {
  return new Promise<void>((resolve, reject) => {
    fn(req, res, (err: any) => err ? reject(err) : resolve());
  });
}

function parseAttachments(raw: string): Record<string, any> {
  try {
    const value = JSON.parse(raw || '{}');
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

async function resolveApplication(applicationNumber: string, token: string) {
  if (!applicationNumber || !token) return null;
  const application = await prisma.talentApplication.findUnique({ where: { applicationNumber } });
  if (!application) return null;
  if (!verifyApplicantUploadToken(token, application.id, application.applicationNumber)) return null;
  return application;
}

export default async function handler(req: MulterRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const applicationNumber = typeof req.query.applicationNumber === 'string' ? req.query.applicationNumber : '';
    const token = typeof req.query.token === 'string' ? req.query.token : '';
    const application = await resolveApplication(applicationNumber, token);
    if (!application) return res.status(401).json({ success: false, message: 'الرابط غير صالح أو منتهي الصلاحية.' });

    const attachments = parseAttachments(application.attachments);
    return res.status(200).json({
      success: true,
      applicationNumber: application.applicationNumber,
      name: (() => { try { return JSON.parse(application.personal || '{}').full_name || ''; } catch { return ''; } })(),
      current: {
        profile_photo: Boolean(attachments.profile_photo),
        cv: Boolean(attachments.cv),
        work_video: Boolean(attachments.work_video),
        work_photos: Array.isArray(attachments.work_photos) ? attachments.work_photos.length : 0,
        documents: Array.isArray(attachments.documents) ? attachments.documents.length : 0,
      },
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'الطريقة غير مسموحة.' });
  }

  const uploadedUrls: string[] = [];
  try {
    await runMiddleware(req, res, uploadMiddleware);
    const applicationNumber = typeof req.body.applicationNumber === 'string' ? req.body.applicationNumber.trim() : '';
    const token = typeof req.body.token === 'string' ? req.body.token.trim() : '';
    const application = await resolveApplication(applicationNumber, token);
    if (!application) return res.status(401).json({ success: false, message: 'الرابط غير صالح أو منتهي الصلاحية.' });

    const files = req.files || {};
    const totalFiles = Object.values(files).reduce((sum, arr) => sum + (arr?.length || 0), 0);
    if (totalFiles === 0) {
      return res.status(400).json({ success: false, message: 'اختر ملفًا واحدًا على الأقل للرفع.' });
    }

    const attachments = parseAttachments(application.attachments);
    const oldToDelete: string[] = [];

    for (const key of ['profile_photo', 'cv', 'work_video'] as const) {
      const file = files[key]?.[0];
      if (!file) continue;
      const url = await storeUpload(file);
      uploadedUrls.push(url);
      if (typeof attachments[key] === 'string' && isStorageUrl(attachments[key])) oldToDelete.push(attachments[key]);
      attachments[key] = url;
    }

    if (files.work_photos?.length) {
      const existing = Array.isArray(attachments.work_photos) ? attachments.work_photos : [];
      const additions: string[] = [];
      for (const file of files.work_photos) {
        const url = await storeUpload(file);
        uploadedUrls.push(url);
        additions.push(url);
      }
      attachments.work_photos = [...existing, ...additions].slice(-10);
    }

    if (files.documents?.length) {
      const existing = Array.isArray(attachments.documents) ? attachments.documents : [];
      const additions: string[] = [];
      for (const file of files.documents) {
        const url = await storeUpload(file);
        uploadedUrls.push(url);
        additions.push(url);
      }
      attachments.documents = [...existing, ...additions].slice(-10);
    }

    await prisma.$transaction([
      prisma.talentApplication.update({
        where: { id: application.id },
        data: { attachments: JSON.stringify(attachments) },
      }),
      prisma.talentApplicationActivity.create({
        data: {
          applicationId: application.id,
          action: 'رفع المتقدم مستندات أو مرفقات عبر رابط الاستكمال الآمن',
          newValue: JSON.stringify({
            uploadedAt: new Date().toISOString(),
            fields: Object.keys(files).filter((key) => files[key]?.length),
          }),
        },
      }),
    ]);

    await cleanup(oldToDelete);
    return res.status(200).json({ success: true, message: 'تم حفظ المرفقات بنجاح.' });
  } catch (error) {
    await cleanup(uploadedUrls);
    const message = error instanceof Error ? error.message : String(error);
    console.error('Applicant document upload error:', message);
    if (message.includes('نوع الملف') || message.includes('محتوى الملف') || message.includes('File too large')) {
      return res.status(400).json({ success: false, message });
    }
    return res.status(500).json({ success: false, message: 'تعذر حفظ المرفقات. حاول مرة أخرى.' });
  }
}
