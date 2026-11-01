import type { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getStorage, extractStorageKey, isStorageUrl } from '@/lib/storage';
import { countryDialCodes } from '@/lib/catalog/locations';
import {
  sendTransactionalEmail,
  buildApplicationReceivedEmail,
  buildAdminNotificationEmail,
  buildBaseUrl,
} from '@/lib/email';
import {
  buildTalentAdminWhatsAppText,
  sendWhatsAppNotify,
} from '@/lib/whatsapp-notify';

export const config = {
  api: {
    bodyParser: false,
  },
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

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)\.]/g, '').replace(/^\+/, '');
}

function toE164(phone: string, dialCode: string): string {
  let digits = normalizePhone(phone);
  if (digits.startsWith(dialCode)) {
    digits = digits.slice(dialCode.length);
  } else if (digits.startsWith('0')) {
    digits = digits.replace(/^0+/, '');
  }
  return `+${dialCode}${digits}`;
}

function getExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

function fileFilter(req: any, file: any, cb: any) {
  const ext = getExtension(file.originalname);
  const allowedExts = allowedFiles[file.mimetype] || [];

  if (blockedExtensions.has(ext)) {
    return cb(new Error(`نوع الملف غير مسموح به: ${ext}`));
  }

  if (!allowedExts.includes(ext)) {
    return cb(new Error(`نوع الملف غير مسموح به: ${ext || file.mimetype}`));
  }

  if (file.mimetype !== 'application/octet-stream' && !allowedFiles[file.mimetype]) {
    return cb(new Error(`نوع الملف غير مسموح به: ${file.mimetype}`));
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
    'video/mp4': (buf) => {
      if (buf.length < 12) return false;
      return buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70;
    },
    'video/webm': (buf) => buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3,
    'application/msword': (buf) => buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': (buf) =>
      buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04,
  };

  const checker = signatures[mimetype];
  if (!checker) return false;
  return checker(buffer);
}

async function storeUpload(file: MulterFile): Promise<string> {
  if (!validateFileContent(file.buffer, file.mimetype)) {
    throw new Error(`محتوى الملف لا يطابق النوع المعلن: ${file.mimetype}`);
  }
  const storage = getStorage();
  const stored = await storage.saveFile({
    buffer: file.buffer,
    originalName: file.originalname,
    mimeType: file.mimetype,
    field: file.fieldname,
  });
  return stored.url;
}

async function cleanupUploadedFiles(urls: string[]) {
  const storage = getStorage();
  for (const url of urls) {
    const key = extractStorageKey(url);
    if (key) {
      try {
        await storage.deleteFile(key);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('Cleanup uploaded file failed:', { url, error: message });
      }
    }
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxSize, files: 13 },
  fileFilter,
});

const fields = [
  { name: 'profile_photo', maxCount: 1 },
  { name: 'work_photos', maxCount: 10 },
  { name: 'work_video', maxCount: 1 },
  { name: 'cv', maxCount: 1 },
];

const uploadMiddleware = upload.fields(fields);

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

function runMiddleware(req: MulterRequest, res: NextApiResponse, fn: Function) {
  return new Promise<void>((resolve, reject) => {
    fn(req, res, (err: any) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

const personalSchema = z.object({
  full_name: z.string().min(1, 'الاسم الكامل مطلوب'),
  phone: z.string().min(1, 'رقم الجوال مطلوب'),
  email: z.string().refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
    message: 'البريد الإلكتروني غير صحيح',
  }).optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  social_link: z.string().refine((v) => {
    if (!v) return true;
    try {
      new URL(v.startsWith('http://') || v.startsWith('https://') ? v : `https://${v}`);
      return true;
    } catch {
      return false;
    }
  }, {
    message: 'رابط التواصل غير صحيح',
  }).optional().or(z.literal('')),
  privacy: z.literal(true),
});

const skillProfileSchema = z.object({
  id: z.string().optional(),
  profileType: z.string().min(1),
  sector: z.string().min(1),
  profession: z.string().default(''),
  specializations: z.array(z.string()).default([]),
  services: z.array(z.string()).default([]),
  skillLevel: z.string().min(1),
  yearsExperience: z.string().min(1),
  description: z.string().max(500).default(''),
  isPrimary: z.boolean().default(false),
  isCustomProfession: z.boolean().default(false),
  customProfessionName: z.string().default(''),
  customProfessionLocalName: z.string().default(''),
  customProfessionDescription: z.string().default(''),
  customProfessionClosestSector: z.string().default(''),
}).refine((data) => {
  if (data.isCustomProfession) {
    return data.customProfessionName.trim().length > 0;
  }
  return data.profession.trim().length > 0;
}, {
  message: 'اسم المهنة مطلوب',
  path: ['customProfessionName'],
});

const locationSchema = z.object({
  country: z.string().min(1),
  region: z.string().min(1),
  city: z.string().min(1),
  district: z.string().default(''),
  serviceArea: z.array(z.string()).min(1),
  workPlace: z.array(z.string()).min(1),
});

const registerSchema = z.object({
  category: z.string().min(1, 'التصنيف مطلوب'),
  fields: z.string().optional().or(z.literal('')),
  specialized: z.string().min(1, 'البيانات المتخصصة مطلوبة'),
  personal: z.string().min(1, 'البيانات الشخصية مطلوبة'),
  skillProfiles: z.string().optional(),
  location: z.string().optional(),
  sanaieeConsent: z.string().optional(),
});

async function generateApplicationNumber(): Promise<string> {
  const now = new Date();
  const year = now.getUTCFullYear();
  const yearStart = Date.UTC(year, 0, 1);
  const millisIntoYear = now.getTime() - yearStart;

  // Use a time-based monotonic component plus cryptographic entropy so
  // deleted applications never cause old numbers to be reused.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const entropy = crypto.randomInt(0, 1_000_000);
    const candidate = `AFQ-${year}-${String(millisIntoYear).padStart(11, '0')}${String(entropy).padStart(6, '0')}`;
    const exists = await prisma.talentApplication.findUnique({
      where: { applicationNumber: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }

  throw new Error('Unable to allocate a unique application number.');
}

// Simple in-memory rate limiter (per IP)
const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;

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

export default async function handler(req: MulterRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'الطريقة غير مسموحة' });
  }

  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ success: false, message: 'تم تجاوز عدد المحاولات المسموح بها. حاول لاحقاً.' });
  }

  try {
    await runMiddleware(req, res, uploadMiddleware);

    const body = req.body;

    const corruptedTextFields = Object.entries(body)
      .filter(([, value]) => typeof value === 'string' && value.includes('\uFFFD'))
      .map(([key]) => key);

    if (corruptedTextFields.length > 0) {
      console.warn('Talent registration rejected: corrupted Unicode replacement character detected', {
        fields: corruptedTextFields,
      });
      return res.status(400).json({
        success: false,
        code: 'CORRUPTED_TEXT_INPUT',
        message: 'توجد أحرف غير صالحة في بعض البيانات النصية. يرجى إعادة كتابة الحقل المتأثر ثم المحاولة مرة أخرى.',
      });
    }

    const parsed = registerSchema.parse(body);
    const personal = personalSchema.parse(JSON.parse(parsed.personal));

    // Normalize phone to E.164 based on country
    const dialCode = countryDialCodes[personal.country || ''];
    const phone = dialCode ? toE164(personal.phone, dialCode) : personal.phone.trim();
    const email = personal.email?.trim().toLowerCase() || null;

    const whereConditions: any[] = [{ phone }];
    if (email) whereConditions.push({ email });

    const existing = await prisma.talentApplication.findFirst({
      where: { OR: whereConditions },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'يوجد تسجيل سابق مرتبط بنفس رقم الجوال أو البريد الإلكتروني.',
      });
    }

    const applicationNumber = await generateApplicationNumber();

    const files = req.files;
    const attachments: Record<string, string | string[]> = {};
    const uploadedFileUrls: string[] = [];

    try {
      if (files?.profile_photo?.[0]) {
        attachments.profile_photo = await storeUpload(files.profile_photo[0]);
        uploadedFileUrls.push(attachments.profile_photo as string);
      }

      if (files?.work_photos?.length) {
        const urls: string[] = [];
        for (const file of files.work_photos) {
          const url = await storeUpload(file);
          urls.push(url);
          uploadedFileUrls.push(url);
        }
        attachments.work_photos = urls;
      }

      if (files?.work_video?.[0]) {
        attachments.work_video = await storeUpload(files.work_video[0]);
        uploadedFileUrls.push(attachments.work_video as string);
      }

      if (files?.cv?.[0]) {
        attachments.cv = await storeUpload(files.cv[0]);
        uploadedFileUrls.push(attachments.cv as string);
      }
    } catch (uploadErr) {
      // Upload failed: remove anything already uploaded and report failure.
      await cleanupUploadedFiles(uploadedFileUrls);
      const message = uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
      console.error('Talent registration upload error:', message);
      return res.status(500).json({ success: false, message: 'تعذر حفظ المرفقات: ' + message });
    }

    const linkFields = ['portfolio_url', 'behance_url', 'instagram_url', 'github_url', 'website_url'];
    for (const field of linkFields) {
      const value = body[field]?.trim();
      if (value) attachments[field] = value;
    }

    let skillProfilesData: z.infer<typeof skillProfileSchema>[] = [];
    if (parsed.skillProfiles) {
      const parsedProfiles = JSON.parse(parsed.skillProfiles);
      skillProfilesData = z.array(skillProfileSchema).parse(parsedProfiles);
    }

    let locationData: z.infer<typeof locationSchema> | undefined;
    if (parsed.location) {
      locationData = locationSchema.parse(JSON.parse(parsed.location));
    }

    const sanaieeConsent = parsed.sanaieeConsent === 'true';
    let verificationToken: string | undefined;

    let application: Awaited<ReturnType<typeof prisma.talentApplication.create>>;
    try {
      application = await prisma.$transaction(async (tx) => {
        const app = await tx.talentApplication.create({
          data: {
            applicationNumber,
            category: parsed.category,
            fields: parsed.fields || '',
            specialized: parsed.specialized,
            personal: parsed.personal,
            phone,
            email,
            attachments: JSON.stringify(attachments),
            status: 'new',
            country: locationData?.country,
            region: locationData?.region,
            city: locationData?.city,
            district: locationData?.district,
            serviceArea: locationData ? JSON.stringify(locationData.serviceArea) : null,
            workPlace: locationData ? JSON.stringify(locationData.workPlace) : null,
            sanaieePlatformConsent: sanaieeConsent,
            sanaieeConsentAt: sanaieeConsent ? new Date() : null,
            sanaieeProfileStatus: sanaieeConsent ? 'interested' : 'not_interested',
          },
        });

        if (skillProfilesData.length > 0) {
          await tx.applicantSkillProfile.createMany({
            data: skillProfilesData.map((p) => ({
              applicationId: app.id,
              profileType: p.profileType,
              sector: p.sector,
              profession: p.profession,
              specializations: JSON.stringify(p.specializations),
              services: JSON.stringify(p.services),
              skillLevel: p.skillLevel,
              yearsExperience: p.yearsExperience,
              description: p.description,
              isPrimary: p.isPrimary,
              isCustomProfession: p.isCustomProfession,
              customProfessionName: p.customProfessionName,
              customProfessionLocalName: p.customProfessionLocalName,
              customProfessionDescription: p.customProfessionDescription,
              customProfessionClosestSector: p.customProfessionClosestSector,
            })),
          });
        }

        if (email) {
          verificationToken = crypto.randomBytes(32).toString('hex');
          await tx.emailVerificationToken.create({
            data: {
              token: verificationToken,
              applicationId: app.id,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          });
        }

        return app;
      });
    } catch (dbErr) {
      // DB transaction failed after files were uploaded: clean them up.
      await cleanupUploadedFiles(uploadedFileUrls);
      throw dbErr;
    }

    // Send transactional email after the application is saved.
    // Email failure must not delete the application or change the success response.
    let emailStatus: 'pending' | 'sent' | 'failed' = 'pending';
    let emailError: string | null = null;
    let emailMessageId: string | null = null;

    if (email && verificationToken) {
      try {
        const verifyUrl = `${buildBaseUrl()}/api/talents/verify-email?token=${verificationToken}`;
        const { subject, html, text } = buildApplicationReceivedEmail({
          name: personal.full_name,
          applicationNumber: application.applicationNumber,
          verifyUrl,
        });
        const result = await sendTransactionalEmail({ to: email, subject, html, text });
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
        console.error('Failed to update email status', {
          applicationNumber: application.applicationNumber,
          error: msg,
        });
      }
    }

    // Send admin notification independently. Failure must not affect registration.
    try {
      const primaryProfile = skillProfilesData.find((p) => p.isPrimary) || skillProfilesData[0];
      const professionLabel = primaryProfile
        ? (primaryProfile.isCustomProfession
            ? primaryProfile.customProfessionName
            : primaryProfile.profession)
        : 'غير محدد';
      const adminUrl = `${buildBaseUrl()}/admin/talents/${application.id}`;
      const { subject, html, text } = buildAdminNotificationEmail({
        applicationNumber: application.applicationNumber,
        name: personal.full_name,
        profession: professionLabel || 'غير محدد',
        country: application.country || undefined,
        city: application.city || undefined,
        adminUrl,
      });
      const adminResult = await sendTransactionalEmail({
        to: process.env.EMAIL_FROM || 'info@bonds-global.com',
        subject,
        html,
        text,
      });

      const waText = buildTalentAdminWhatsAppText({
        applicationNumber: application.applicationNumber,
        name: personal.full_name,
        profession: professionLabel || 'غير محدد',
        country: application.country || undefined,
        city: application.city || undefined,
        adminUrl,
      });
      const waResult = await sendWhatsAppNotify(waText);

      if (adminResult.success || waResult.success) {
        await prisma.talentApplication.update({
          where: { id: application.id },
          data: { adminNotified: true },
        });
      }
      if (!adminResult.success) {
        console.error('Failed to send admin email notification', {
          applicationNumber: application.applicationNumber,
          error: adminResult.error,
        });
      }
      if (!waResult.success) {
        console.error('Failed to send admin WhatsApp notification', {
          applicationNumber: application.applicationNumber,
          error: waResult.error,
        });
      }
    } catch (adminErr) {
      const msg = adminErr instanceof Error ? adminErr.message : String(adminErr);
      console.error('Admin notification error', {
        applicationNumber: application.applicationNumber,
        error: msg,
      });
    }

    const userMessage =
      emailStatus === 'sent'
        ? 'تم تسجيل بياناتك بنجاح. تم إرسال رسالة تأكيد إلى بريدك الإلكتروني.'
        : emailStatus === 'failed'
          ? 'تم تسجيل طلبك بنجاح، لكن تعذر إرسال رسالة التأكيد. يمكنك إعادة إرسالها.'
          : 'تم تسجيل بياناتك بنجاح.';

    return res.status(201).json({
      success: true,
      applicationNumber: application.applicationNumber,
      message: userMessage,
      emailStatus,
    });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Talent registration error:', message);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'البيانات المُرسلة غير صحيحة: ' + error.issues.map((e: any) => e.message).join(', '),
      });
    }

    if (message.includes('نوع الملف') || message.includes('محتوى الملف') || message.includes('File too large')) {
      return res.status(400).json({ success: false, message });
    }

    return res.status(500).json({
      success: false,
      message: 'تعذر حفظ البيانات',
    });
  }
}
