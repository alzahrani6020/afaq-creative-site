# لوحة إدارة منظومة المواهب والطاقات

وثيقة تقنية لوحة الإدارة الداخلية لإدارة طلبات الانضمام إلى منظومة المواهب والطاقات في مشروع **أفاق إبداعية**.

---

## محتويات الوثيقة

1. [الملفات الجديدة والمحدثة](#الملفات-الجديدة-والمحدثة)
2. [المتطلبات والتهيئة](#المتطلبات-والتهيئة)
3. [إنشاء أول مشرف](#إنشاء-أول-مشرف)
4. [الجلسة والأمان](#الجلسة-والأمان)
5. [صفحات الإدارة](#صفحات-الإدارة)
6. [نقاط API الإدارية](#نقاط-api-الإدارية)
7. [Middleware](#middleware)
8. [تغيير كلمة المرور](#تغيير-كلمة-المرور)
9. [سجل حسابات الأدمن](#سجل-حسابات-الأدمن)
10. [النسخ الاحتياطي](#النسخ-الاحتياطي)
11. [استراتيجية التخزين](#استراتيجية-التخزين)
12. [خطة Migration إلى PostgreSQL](#خطة-migration-إلى-postgresql)
13. [توحيد API مستقبلي](#توحيد-api-مستقبلي)
14. [Security Checklist](#security-checklist)
15. [Production Checklist](#production-checklist)
16. [Pre-Sanaiee Snapshot](#pre-sanaiee-snapshot)
17. [ملاحظات التشغيل](#ملاحظات-التشغيل)
18. [اختبار سريع](#اختبار-سريع)

---

## الملفات الجديدة والمحدثة

### ملفات جديدة

| الملف | الوصف |
|-------|-------|
| `app/admin/layout.tsx` | تخطيط لوحة الإدارة (Header + children) |
| `app/admin/login/page.tsx` | صفحة تسجيل الدخول |
| `app/admin/talents/page.tsx` | قائمة الطلبات + فلاتر + تصدير |
| `app/admin/talents/[id]/page.tsx` | تفاصيل الطلب + تغيير الحالة + سجل النشاط |
| `app/admin/account/page.tsx` | تغيير كلمة مرور الأدمن |
| `app/api/admin/login/route.ts` | تسجيل الدخول |
| `app/api/admin/logout/route.ts` | تسجيل الخروج |
| `app/api/admin/me/route.ts` | بيانات المشرف الحالي |
| `app/api/admin/account/password/route.ts` | تغيير كلمة المرور |
| `app/api/admin/talents/route.ts` | قائمة الطلبات (بحث/تصفية/ترقيم) |
| `app/api/admin/talents/[id]/route.ts` | تفاصيل + تحديث الطلب |
| `app/api/admin/talents/[id]/activity/route.ts` | سجل النشاط + إضافة نشاط |
| `app/api/admin/talents/export/route.ts` | تصدير CSV |
| `lib/session.ts` | إعدادات `iron-session` |
| `lib/auth.ts` | التحقق من بيانات الدخول + إدارة الجلسة + تغيير كلمة المرور |
| `lib/admin-auth.ts` | Helper مركزي للتحقق من الأدمن واستخراج IP |
| `lib/rate-limit.ts` | حماية تسجيل الدخول من محاولات متكررة |
| `lib/admin-helpers.ts` | دوال مساعدة مشتركة |
| `lib/storage/` | طبقة abstraction للتخزين (Local → R2/S3 مستقبلًا) |
| `scripts/create-admin.ts` | سكربت CLI تفاعلي لإنشاء مستخدم إداري |
| `scripts/delete-admin.ts` | حذف مستخدم إداري |
| `scripts/backup-db.ts` | نسخ احتياطي لقاعدة SQLite |
| `middleware.ts` | حماية مسارات `/admin/*` |

### ملفات مُحدثة

| الملف | التحديث |
|-------|---------|
| `prisma/schema.prisma` | إضافة `AdminUser` و `TalentApplicationActivity` و `AdminActivity` |
| `pages/api/talents/register.ts` | استخدام `lib/storage/` + فحص extension/MIME + حماية أفضل |
| `next.config.mjs` | `externals` لـ `better-sqlite3` ومحوّل Prisma |
| `package.json` | إضافة `tsx` + سكربتات `seed:admin` و `db:backup` |
| `.gitignore` | إضافة `backups/` |
| `.env.example` | قالب المتغيرات البيئية |

---

## المتطلبات والتهيئة

تأكد من وجود المتغيرات التالية في ملف `.env`:

```env
DATABASE_URL="file:./dev.db"
ADMIN_SESSION_SECRET="your-secret-min-32-characters-long"
```

> 🔑 يجب أن يكون `ADMIN_SESSION_SECRET` **32 حرفًا على الأقل**. إذا كان مفقودًا أو قصيرًا، يفشل التشغيل برسالة واضحة ولا يتم استخدام fallback ضعيف.

ثم شغّل migration إذا لم تكن مطبقة:

```bash
npx prisma migrate dev
```

---

## إنشاء أول مشرف

استخدم السكربت التفاعلي المخصص:

```bash
npx tsx scripts/create-admin.ts
```

أو عبر npm script:

```bash
npm run seed:admin
```

السكربت يطلب:

- الاسم الكامل
- البريد الإلكتروني
- كلمة المرور (وتأكيدها)

لا يتم طباعة كلمة المرور أو الـ Password Hash. لا يوجد بيانات اعتماد ثابتة داخل الكود.

---

## الجلسة والأمان

- تستخدم اللوحة `iron-session` لتوليد كوكي `httpOnly`/`secure` (في production) مع `sameSite: strict`.
- اسم الكوكي: `afaq_admin_session`.
- مدة الصلاحية: **7 أيام**.
- كلمة المرور تُخزّن باستخدام `bcryptjs` مع salt rounds = 12.
- محاولات تسجيل الدخول مُقيّدة بـ **5 محاولات/دقيقة** لكل IP.
- جميع Admin APIs تتحقق من الجلسة بنفسها عبر `lib/admin-auth.ts` وتُعيد `401` إذا لم يكن المستخدم مسجّلًا أو غير نشط.
- Middleware يحمي الصفحات فقط؛ APIs لا تعتمد عليه.
- رسالة الخطأ واحدة للبريد أو كلمة المرور الخاطئة: **"بيانات الدخول غير صحيحة."**

---

## صفحات الإدارة

| المسار | الوصف |
|--------|-------|
| `/admin/login` | صفحة تسجيل الدخول |
| `/admin/talents` | جدول الطلبات مع بحث/فلترة/ترقيم |
| `/admin/talents/{id}` | صفحة تفاصيل الطلب |
| `/admin/account` | تغيير كلمة مرور الأدمن |

### قائمة الطلبات

- بحث حسب: رقم الطلب، الجوال، البريد.
- فلترة حسب الحالة.
- تصدير النتائج الحالية إلى CSV.

### صفحة التفاصيل

- عرض البيانات الشخصية والتخصصات والمرفقات.
- تغيير حالة الطلب (مع validation على الحالات المسموحة).
- إضافة ملاحظات إدارية (بحد أقصى 5000 حرف).
- سجل النشاطات مع اسم المشرف والتاريخ.
- إمكانية إضافة نشاط يدوي.

---

## نقاط API الإدارية

### مصادقة

| الطريقة | النقطة | الوصف |
|---------|--------|-------|
| `POST` | `/api/admin/login` | تسجيل الدخول |
| `POST` | `/api/admin/logout` | تسجيل الخروج |
| `GET`  | `/api/admin/me` | بيانات الجلسة الحالية |

### الحساب

| الطريقة | النقطة | الوصف |
|---------|--------|-------|
| `PATCH` | `/api/admin/account/password` | تغيير كلمة المرور |

### الطلبات

| الطريقة | النقطة | الوصف |
|---------|--------|-------|
| `GET` | `/api/admin/talents` | قائمة الطلبات |
| `GET` | `/api/admin/talents/{id}` | تفاصيل طلب |
| `PATCH` | `/api/admin/talents/{id}` | تحديث الحالة/الملاحظات |
| `GET` | `/api/admin/talents/{id}/activity` | سجل النشاط |
| `POST` | `/api/admin/talents/{id}/activity` | إضافة نشاط |
| `GET` | `/api/admin/talents/export` | تصدير CSV |

### بارامترات قائمة الطلبات

```
/api/admin/talents?page=1&search=966&status=new&sortBy=createdAt&order=desc
```

- `page`: رقم الصفحة (افتراضي 1).
- `search`: بحث نصي.
- `status`: إحدى حالات `ApplicationStatus`.
- `sortBy`: `createdAt` | `updatedAt` | `status` | `applicationNumber`.
- `order`: `asc` | `desc`.

---

## Middleware

ملف `middleware.ts` يحمي جميع مسارات `/admin/*` ويُعيد توجيه غير المسجلين إلى `/admin/login`.

```ts
export const config = {
  matcher: ['/admin/:path*'],
};
```

---

## تغيير كلمة المرور

1. افتح `/admin/account`.
2. أدخل كلمة المرور الحالية والجديدة وتأكيدها.
3. API يتحقق من صحة البيانات ثم يُعيد توليد الجلسة بعد التغيير.
4. يتم تسجيل النشاط في `AdminActivity` بدون تخزين كلمة المرور.

---

## سجل حسابات الأدمن

نموذج `AdminActivity` يسجّل أحداث الحساب الإداري مثل:

- تغيير كلمة المرور.
- مستقبلًا: تسجيل الدخول، تعطيل/تفعيل الحساب، إلخ.

يحتوي على:

- `adminUserId`
- `action`
- `metadata` (JSON string)
- `createdAt`

---

## النسخ الاحتياطي

نسخ احتياطي لقاعدة SQLite:

```bash
npm run db:backup
```

ينتج:

```text
backups/talents-YYYY-MM-DD-HH-MM-SS.db
```

لا يتم الكتابة فوق النسخ السابقة. مجلد `backups/` مستثنى من Git.

---

## استراتيجية التخزين

- المرفقات الحالية تُخزّن محليًا في `public/uploads/`.
- تم إنشاء `lib/storage/` كطبقة abstraction:
  - `types.ts`: واجهة موحدة.
  - `local.ts`: مزود التخزين المحلي.
  - `index.ts`: `getStorage()` لاختيار المزود.
- لاحقًا يمكن إضافة مزود R2/S3 دون تغيير:
  - `TalentHub`
  - `pages/api/talents/register.ts`
  - لوحة الإدارة

---

## خطة Migration إلى PostgreSQL

SQLite يبقى مستخدمًا في التطوير الحالي. قبل النقل إلى PostgreSQL:

1. إنشاء قاعدة PostgreSQL (محلية أو سحابية).
2. تحديث `DATABASE_URL` و `datasource db.provider = "postgresql"`.
3. تشغيل `npx prisma migrate dev` لإنشاء الجداول.
4. نقل البيانات من SQLite إلى PostgreSQL باستخدام `pgloader` أو سكربت ETL مخصص.
5. اختبار جميع API Routes.
6. اختبار لوحة الإدارة.
7. التأكد من صحة المرفقات والروابط.

**لا تنفذ هذه الخطة الآن إلا بعد استقرار صنايعي.**

---

## توحيد API مستقبلي

النظام الحالي يستخدم:

- `pages/api/talents/register.ts` للتسجيل العام.
- `app/api/admin/*` للإدارة.

هذا مقبول حاليًا. لاحقًا يمكن توحيدهم جميعًا داخل `app/api/` بعد اكتمال تكامل صنايعي.

---

## Security Checklist

- [ ] لا توجد كلمات مرور أو أسرار ثابتة في الكود.
- [ ] `.env` مستثنى من Git.
- [ ] `ADMIN_SESSION_SECRET` قوي بطول ≥ 32 حرفًا.
- [ ] جميع Admin APIs تتحقق من الجلسة بنفسها.
- [ ] Rate limit مفعّل على تسجيل الدخول.
- [ ] CSV Export محمي من Formula Injection.
- [ ] أرقام الجوال تُصدّر كنصوص.
- [ ] رفع الملفات يتحقق من MIME وextension.
- [ ] الملفات التنفيذية والخطرة مرفوضة.
- [ ] لا يتم عرض مسارات filesystem.
- [ ] Admin Notes لا تستخدم `dangerouslySetInnerHTML`.
- [ ] روابط المستخدمين تُفتح بـ `rel="noopener noreferrer"`.

---

## Production Checklist

- [ ] تغيير/تعطيل حسابات الاختبار.
- [ ] إنشاء Admin إنتاجي عبر `npm run seed:admin`.
- [ ] `ADMIN_SESSION_SECRET` قوي وفريد.
- [ ] `.env` غير موجود في Git.
- [ ] جميع Admin APIs محمية.
- [ ] Rate limit يعمل.
- [ ] CSV محمي.
- [ ] Upload validation يعمل.
- [ ] Backup موجود (`npm run db:backup`).
- [ ] `npm run build` ناجح.
- [ ] Storage الإنتاج محدد (R2/S3 عند الحاجة).
- [ ] PostgreSQL محدد قبل التوسع الكبير.

---

## Pre-Sanaiee Snapshot

قبل البدء في تكامل صنايعي، أنشئ snapshot واضح:

```bash
npm run db:backup
```

وأنشئ Git tag (إذا رغبت):

```bash
git tag pre-sanaiee-integration
git push origin pre-sanaiee-integration
```

لا يتم تنفيذ `git push` تلقائيًا ضمن هذا المشروع.

---

## ملاحظات التشغيل

- جميع نقاط API الإدارية مُعلّمة بـ `export const dynamic = 'force-dynamic';` لتجنب محاولة Next.js توليدها بشكل ساكن.
- تم إضافة `better-sqlite3` و `@prisma/adapter-better-sqlite3` إلى `externals` في `next.config.mjs` لتجنب مشاكل الـ native bindings في وضع التطوير.
- لا تُخزّن أسرار أو كلمات مرور في Git؛ تُدار عبر `.env`.
- لا يتم تسجيل كلمات المرور أو الـ Password Hash في Logs.

---

## اختبار سريع

```bash
# 1. نسخ احتياطي
npm run db:backup

# 2. إنشاء أدمن
npm run seed:admin

# 3. تشغيل الخادم
npm run dev

# 4. تسجيل الدخول
curl -X POST http://localhost:3008/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@afaq-global.com","password":"Pass1234"}' \
  -c cookies.txt

# 5. جلب الطلبات
curl http://localhost:3008/api/admin/talents -b cookies.txt

# 6. تسجيل الخروج
curl -X POST http://localhost:3008/api/admin/logout -b cookies.txt -c cookies.txt
```
