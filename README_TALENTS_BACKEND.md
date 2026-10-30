# نظام تسجيل المواهب والطاقات — Backend

## نظرة عامة

تم تطوير قسم `#talents` ليصبح نظام تسجيل متكامل يحفظ البيانات في قاعدة بيانات SQLite ويوفر API آمن لاستقبال التسجيلات.

## التقنيات المستخدمة

- Next.js 14 (App Router + Pages Router API)
- Prisma 7 مع SQLite (عبر `@prisma/adapter-better-sqlite3`)
- Zod للتحقق من البيانات
- Multer لرفع الملفات

## ملفات مهمة

- `prisma/schema.prisma` — مخطط قاعدة البيانات
- `prisma.config.ts` — إعدادات Prisma
- `lib/prisma.ts` — عميل Prisma
- `pages/api/talents/register.ts` — API التسجيل
- `components/TalentHub.tsx` — واجهة الـ Wizard
- `app/globals.css` — تنسيقات الـ Wizard
- `.env` — متغيرات البيئة

## متغيرات البيئة (.env)

```env
DATABASE_URL="file:./dev.db"
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE=10485760
WHATSAPP_NUMBER=966567566616
NEXT_PUBLIC_WHATSAPP_NUMBER=966567566616
```

## التشغيل المحلي

```bash
# 1. تثبيت الاعتماديات
npm install

# 2. إنشاء/تحديث قاعدة البيانات
npx prisma migrate dev

# 3. توليد عميل Prisma
npx prisma generate

# 4. تشغيل خادم التطوير
npm run dev
```

## البناء للإنتاج

```bash
npm run build
npm run start
```

> ملاحظة: تم إزالة `output: 'export'` من `next.config.mjs` لأن الـ API Routes تتطلب خادم Node.js.

## API Endpoint

### `POST /api/talents/register`

**المدخلات (multipart/form-data):**

| الحقل | النوع | الوصف |
|---|---|---|
| `category` | text | التصنيف الرئيسي |
| `fields` | text | المجالات المختارة (مفصولة بفاصلة) |
| `specialized` | text | JSON للبيانات المتخصصة |
| `personal` | text | JSON للبيانات الشخصية |
| `profile_photo` | file | صورة شخصية |
| `work_photos` | files | صور الأعمال |
| `work_video` | file | فيديو للأعمال |
| `cv` | file | السيرة الذاتية |

**الاستجابة الناجحة:**

```json
{
  "success": true,
  "applicationNumber": "AFQ-2026-000001",
  "message": "تم تسجيل بياناتك بنجاح"
}
```

## حالات الطلب (status)

- `new`
- `under_review`
- `qualified`
- `need_information`
- `contacted`
- `accepted`
- `rejected`

## البحث والتصفية المستقبلية

يمكن إنشاء لوحة تحكم تستعلم عن:

- `applicationNumber`
- `phone`
- `email`
- `category`
- `fields`
- `status`
- `createdAt`

## الأمان المطبق

- التحقق من البيانات في الخادم باستخدام Zod
- فحص رقم الجوال والبريد لمنع التكرار
- rate limiting (5 طلبات/دقيقة لكل IP)
- تقييد أنواع وأحجام الملفات
- عدم إرجاع أخطاء قاعدة البيانات للواجهة
- تخزين الملفات في `public/uploads/` مع أسماء عشوائية
