# Runbook — Production Cutover إلى Neon (afaq-talents-production)

> **الحالة: معتمد للتخطيط — غير مُصرَّح بتنفيذه.**
> كل خطوة كتابة على Production تتطلب موافقة صريحة سابقة. هذا الملف هو المرجع الوحيد للتنفيذ عند الإذن.
> تاريخ الإعداد: 2026-09-04 — بناءً على نجاح Dry Run الكامل على فرع `reconciliation-dry-run-20260904`.

---

## 0. الملخص والافتراضات المعتمدة

- **Source of Truth المستقبلي**: Neon `afaq-talents-production` (PostgreSQL 18.6).
- **نطاق هجرة البيانات (قرار معتمد)**: Business Data فقط —
  `TalentApplication`, `ApplicantSkillProfile`, `TalentApplicationActivity`, `AdminActivity`.
  **ممنوع نقل أي `AdminUser` من SQLite** في هذه التشغيلة (قرار مؤجل لمرحلة منفصلة).
- **المرفقات**: جرد Dry Run أثبت صفر مراجع مرفقات في SQLite — لا شيء لنقله.
- **SQLite legacy**: يبقى untouched كـ Evidence ونقطة رجوع بيانات (hash مرجعي `2b5bdf04…`).
- العدد المتوقع بعد الهجرة: TalentApplication = 10 (1 قائمة + 9) | ApplicantSkillProfile = 12 (1 + 11).
- الأدوات المعتمدة (موجودة في `scripts/`، كلها ترفض أي endpoint غير المصرح به):
  `neon-candidate-readonly-verify.cjs`، `dryrun-export-sqlite.py`، `dryrun-apply-business.cjs`، `dryrun-snapshot.cjs`، `reconcile-*`.

---

## 1. Pre-Checks (يجب أن تكون كلها PASS قبل الخطوة 2)

| # | فحص | المعيار |
|---|---|---|
| P1 | موافقة صريحة من المالك على بدء Cutover | نعم |
| P2 | القاعدة الإنتاجية reachable وread-only سليمة | `neon-candidate-readonly-verify.cjs` = DONE |
| P3 | عدادات production الأساسية مسجلة | TA=1, ASP=1, AU=1, AA=5, TAA=1, EVT=2 |
| P4 | Snapshot قبلي (`before.json`) على production عبر `dryrun-snapshot.cjs` (read-only) | ملف محفوظ |
| P5 | hash SQLite الحالي يطابق المرجع `2b5bdf04…` | تطابق |
| P6 | لا deployment نشط يكتب للقاعدة خلال النافذة | تأكد من عدم وجود مستخدمين للوحة admin |
| P7 | جاهزية rollback: خطة الاستعادة مفهومة ومجربة على الفرع | G11 Dry Run = PASS سابقًا |
| P8 | نافذة زمنية للتنفيذ مع توقع توقف الخدمة الكامل (التطبيق معطل أصلًا بالـ placeholder) | محددة |

**أي فشل في Pre-Checks ⇒ STOP كامل، لا استثناءات.**

---

## 2. التسلسل التفصيلي

### الخطوة 1 — لقطة ما قبل الهجرة (Snapshot/Branch)
1. إنشاء branch من production باسم `pre-migration-YYYYMMDD-HHMM` عبر Neon API (node fetch — لا CLI يطبع credentials).
2. تسجيل branch ID في سجل التشغيلة (metadata فقط).
3. الانتظار حتى `ready`.

**Gate 1 — صلاحية اللقطة**: تشغيل `dryrun-snapshot.cjs` ضد **اللقطة** (وليس production مباشرة) — يجب أن تطابق counts الأساسية (P3) حرفيًا. عدم التطابق ⇒ STOP وانتقل لـ §4 (استعادة غير مطلوبة هنا؛ اللقطة هي الأمان).

### الخطوة 2 — تطبيق trusted_devices على production
1. حقن `DATABASE_URL` الخاص بـ `neondb_owner` في الذاكرة (endpoint production، فحص endpoint إلزامي).
2. `npx prisma migrate deploy` — تطبق `20260903231152_trusted_devices` فقط (البقية مسجلة).
3. التحقق: `TrustedDevice` موجود + indexes (pkey, tokenHash_key, adminUserId_idx) + `_prisma_migrations` = 4.

**Gate 2 — سلامة الهجرة**: أي خطأ ⇒ STOP؛ production بلا تغييرات بيانات (DDL فقط حتى الآن، واللقطة تحمي).

### الخطوة 3 — هجرة Business Data (INSERT-only)
1. `python scripts/dryrun-export-sqlite.py | DRYRUN_DB_URL=<production-url> RUN_ID=cutover-1 MANIFEST_PATH=backups/cutover/manifest.jsonl node scripts/dryrun-apply-business.cjs`
2. السكربت: lookup-based idempotency، INSERT-only، يرفض أي endpoint غير production المحدد (يُحدَّث فحص الـ endpoint في السكربت قبل التشغيل — لا يُقبل فرع الاختبار).

**Gate 3 — نتيجة الهجرة**: inserted = 20 (9+11)، errors = 0. أي رقم آخر ⇒ STOP وانتقل لـ §4.

### الخطوة 4 — Validation Gates على production
| Gate | المعيار |
|---|---|
| G1 | counts: TA=10, ASP=12, AU=1, AA=5, TAA=1, EVT=2, TrustedDevice=0 |
| G2 | orphans = 0 (ASP/TAA/EVT/AA) |
| G3 | duplicate groups (applicationNumber) = 0 |
| G4 | كل `status` ضمن enum |
| G5 | مقارنة snapshot قبل/بعد: modified=0, deleted=0 |
| G6 | hash SQLite بعد = `2b5bdf04…` (المصدر لم يُمس) |

**أي Gate فاشل ⇒ STOP وانتقل لـ §4 فورًا.**

### الخطوة 5 — إثبات Idempotency على production
إعادة تشغيل الخطوة 3 (RUN_ID=cutover-2). **المعيار: inserted=0، already_exists=20، errors=0.**
إذا أدرج شيء ⇒ خطأ حارس ⇒ STOP و§4.

### الخطوة 6 — تدوير الاعتماديات (وفق خطة §6 أدناه)
### الخطوة 7 — تحديث Vercel (وفق §7 أدناه)
### الخطوة 8 — redeploy + smoke tests (§8، §9)

---

## 3. شروط الإيقاف (Stop Conditions)

تتوقف التشغيلة فورًا عند أي من:
- فشل أي Gate أو Pre-Check.
- اختلاف أي عدد عن المتوقع بمقدار ≠ الصفر.
- ظهور credential في أي log أو output.
- انقطاع الاتصال بالقاعدة أثناء معاملة كتابة (يتم فحص حالة المعاملة قبل المتابعة).
- طلب المالك للإيقاف في أي لحظة.

عند Stop: لا محاولات إصلاح ارتجالية. التقييم يكون بقرار مستقل: إما §4 (rollback) أو خطة معالجة موثقة جديدة.

## 4. شروط وآلية الرجوع (Rollback)

**متى**: فشل أي Gate بعد الخطوة 2، أو فشل smoke tests بعد الخطوة 8.
**الآلية المعتمدة** (محكومة بأن `DATABASE_URL` القديمة placeholder ولا تصلح نقطة رجوع):
1. **استعادة القاعدة**: Neon restore للفرع production من لقطة الخطوة 1 (`pre-migration-…`) عبر API — مثبتة في Dry Run (G11).
2. **التحقق بعد الاستعادة**: إعادة تشغيل فحوصات P3 + Gate 1 على production المستعادة — يجب أن تعود counts للأساس.
3. **Vercel**: لا شيء يُغيَّر إن فشلنا قبل الخطوة 7. بعد الخطوة 7 وفشل لاحق: إعادة `DATABASE_URL` إلى placeholder غير كافية (التطبيق يبقى معطلًا — وهو الوضع الراهن أصلًا، أي أن rollback يعيد "الوضع الحالي المعطل" لا خدمة عاملة). **توثيق صريح: خدمة ما قبل Cutover معطلة بطبيعتها؛ الـ rollback يستعيد القاعدة والكود ولا يستعيد خدمة كانت عاملة.**
4. إعادة deploy آخر build معروف إن لزم.

## 5. التحقق من الـ Snapshot
- Gate 1 (§2) هو التحقق الأول.
- بعد الاستعادة (إن حدثت): مقارنة snapshot اللقطة مع snapshot production المستعادة — يجب تطابق hashes.
- تحتفظ اللقطة بحد أدنى 7 أيام بعد التشغيلة قبل أي تنظيف (قرار المالك).

## 6. Credential Rotation (جزء من التشغيلة — بعد Gate 5)
بالترتيب الصارم:
1. إنشاء role `afaq_app` (least privilege) بكلمة مرور مولدة محليًا — لا تُطبع.
2. التحقق من اتصال `afaq_app` بالفرع الاختباري.
3. تحديث Vercel بـ connection string الخاصة بـ `afaq_app` (§7).
4. redeploy (§8) والتحقق من عمل الاتصال عبر التطبيق المنشور.
5. فقط بعد نجاح §9: إعادة تعيين كلمة مرور `neondb_owner` عبر Neon API.
6. فحص الإبطال: محاولة اتصال واحدة بالـ URL القديم — يجب أن تفشل بـ `28P01`. تُسجَّل النتيجة، ثم تُتلف القيمة القديمة.
7. تحديث سكربتات الاختبار (فرع Dry Run) بالاعتمادية الجديدة.

## 7. تحديث Vercel دون كشف القيمة
- طريقة معتمدة واحدة: REST API ‏`POST /v10/projects/{projectId}/env` من سكربت يقرأ القيمة من متغير بيئة محقن.
- ممنوع: أعلام `--value` في shell، أو طباعة body، أو حفظ القيمة في أي ملف.
- يتبع التحديث: redeploy إلزامي لالتقاط القيمة.

## 8. النشر
1. `vercel --prod` (أو عبر واجهة) بعد تحديث المتغير.
2. التأكد من build ناجب وحالة Ready.
3. عدم وجود build قديم متزامن.

## 9. Smoke Tests
1. فتح الموقع العام (الرئيسية + نموذج التقديم).
2. تقديم طلب تجريبي **جديد** والتحقق من ظهوره في قاعدة production (read-back count +1 ثم حذفه يدويًا أو تركه موسومًا كاختبار بقرار المالك).
3. تسجيل دخول admin بالحساب الحالي (KEEP) — فقط بعد تأكيد أن كلمة المرور الحالية لم تتغير (role `afaq_app` لا يغير بيانات admin).
4. فتح لوحة الطلبات والتحقق من عرض الطلبات العشرة.
5. **Google OAuth + trusted-device**: تسجيل دخول كامل عبر Google (يتطلب `GOOGLE_CLIENT_*` مضبوطة في Vercel) + التحقق من إصدار TrustedDevice cookie وتسجيل الجهاز.
6. اختبار رفض/قبول طلب (كتابة تشغيلية عادية عبر اللوحة).

## 10. التحقق بعد Cutover
- إعادة تشغيل `neon-candidate-readonly-verify.cjs` على production: 4 migrations، كل الجداول موجودة.
- G1–G6 نهائية على production.
- مراجعة `AdminActivity` للتشغيلة (سجل تدقيق داخلي).
- تأكيد hash SQLite نهائي لم يتغير.

## 11. Sign-off النهائي
التشغيلة تُغلق فقط بتوثيق: من نفذ، متى، نتائج كل Gates، رقم اللقطة، حالة التدوير، نتائج smoke tests — و**اعتماد مكتوب من المالك** على الإغلاق، عندها فقط يُعلن Cutover مكتملًا وتبدأ مرحلة "قرار حسابات Admin القديمة" كمسار منفصل.

---
*آخر تحديث: 2026-09-04 — مطابق لنتائج Dry Run الكاملة (11/11 Gates PASS).*
