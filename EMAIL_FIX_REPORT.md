# تقرير إصلاح Bug البريد التأكيدي

**تاريخ التنفيذ:** 2026-08-25
**المشروع:** afaq-creative
**Production URL:** https://afaq-global.com
**آخر Production Build:** https://afaq-creative-c4gjja2tm-dr-talal.vercel.app

---

## 1. ملخص المشكلة

- المتقدم يسجّل بنجاح ويظهر له "تم إرسال رسالة تأكيد".
- البريد التأكيدي لا يصل فعلياً للمتقدمين.
- لا يوجد إشعار إداري عند تسجيل طلب جديد.
- زر "إعادة إرسال" لا يُبلّغ المستخدم بنتيجة المحاولة الفعلية.

## 2. سبب الخلل الرئيسي

في `pages/api/talents/register.ts` كان إرسال البريد محاطاً بـ `try/catch`، وأي خطأ في الإرسال كان يُسجّل فقط في السجلات (`console.error`) دون أن يؤثر على الرد المرسل للمستخدم:

```ts
try {
  await sendTransactionalEmail({ ... });
} catch (emailErr) {
  console.error('Failed to send transactional email', ...);
}

return res.status(201).json({
  success: true,
  message: 'تم تسجيل بياناتك بنجاح. تم إرسال رسالة تأكيد...'
});
```

النتيجة: حتى لو فشل Zoho SMTP بالكامل، كان المستخدم يرى "تم الإرسال".

## 3. ما تم إصلاحه

### 3.1 تتبع حالة البريد في قاعدة البيانات

تمت إضافة حقول جديدة إلى `TalentApplication` عبر Migration `20260825222211_add_email_status`:

```prisma
model TalentApplication {
  ...
  emailStatus     String   @default("pending")
  emailSentAt     DateTime?
  emailError      String?
}
```

الحالات المدعومة:
- `pending`: لم يُحاول الإرسال بعد.
- `sent`: وصلنا تأكيد من Zoho SMTP بقبول الرسالة (`250 Message received`).
- `failed`: فشل الإرسال وتُخزّن رسالة الخطأ في `emailError`.
- `verified`: ضغط المستخدم على رابط التحقق واكتمل التأكيد.

### 3.2 تحديث API التسجيل (`pages/api/talents/register.ts`)

- إرسال البريد التأكيدي للمتقدم.
- إرسال **إشعار إداري مستقل** إلى `info@bonds-global.com` عند كل طلب جديد.
- تحديث `emailStatus` و`emailSentAt` أو `emailError` وفقاً لنتيجة SMTP الفعلية.
- في حال فشل البريد، يُعاد للواجهة رد يوضح أن الطلب سُجّل لكن البريد لم يُرسل، مع تفعيل زر "إعادة الإرسال".

### 3.3 تحديث API إعادة الإرسال (`app/api/talents/resend-verification/route.ts`)

- زر "إعادة إرسال رسالة التأكيد" يعيد المحاولة فعلياً.
- يُحدّث حالة البريد إلى `sent` أو `failed`.
- يعرض رسالة واضحة للمستخدم بنجاح أو فشل المحاولة.

### 3.4 تحديث لوحة الإدارة

- عرض `emailStatus` بدلاً من مجرد `emailVerified`.
- الألوان:
  - `pending`: رمادي
  - `sent`: أزرق
  - `failed`: أحمر
  - `verified`: أخضر
- عرض رسالة الخطأ عند `failed`.

### 3.5 تفعيل DKIM (خطوة مهمة لـ Gmail/Outlook)

DNS لـ `bonds-global.com` يحتوي على SPF صحيح لـ Zoho لكن **لا يوجد DKIM**.
بدون DKIM، Gmail وOutlook غالباً ما يرفضان الرسالة أو يضعانها في Spam/Junk.

**الإجراء المطلوب من صاحب النطاق:**
1. تسجيل الدخول إلى Zoho Mail Admin: https://mail.zoho.sa/cpanel/index.html#dashboard
2. الذهاب إلى **Mail Admin → Email Authentication → DKIM**
3. اختيار `bonds-global.com` وتفعيل DKIM.
4. نسخ قيمة `TXT record` وإضافتها في لوحة تحكم DNS.
5. انتظار 5–60 دقيقة حتى الانتشار.
6. الضغط على **Verify** في Zoho.

## 4. نتائج الاختبار

### 4.1 اختبار SMTP محلي

| SMTP Host | النتيجة |
|-----------|---------|
| `smtppro.zoho.sa` | **نجح** — 250 Authentication successful |
| `smtp.zoho.sa` | نجح |
| `smtppro.zoho.com` | نجح |

> ملاحظة: الاختبار المحلي السابق أظهر `535 Authentication Failed` على `smtppro.zoho.sa`، لكن الإعادة باستخدام App Password الصحيح نجحت. App Password مختلف عن كلمة مرور الحساب العادية ويجب استخدامه.

### 4.2 اختبار تسجيل حقيقي على Production

- **رقم الطلب:** `AFQ-2026-000003`
- **البريد المستهدف:** `info@bonds-global.com`
- **المرفقات:** CV + صورة عمل + رابط Portfolio
- **Storage:** Vercel Blob
- **نتيجة البريد التأكيدي:** ✅ `emailStatus = sent` + `emailSentAt` محدّث
- **نتيجة الإشعار الإداري:** ✅ تم الإرسال إلى `info@bonds-global.com`

### 4.3 اختبار زر إعادة الإرسال

- ✅ يعيد إنشاء token جديد.
- ✅ يعيد إرسال البريد.
- ✅ يُحدّث `emailStatus`.
- ✅ يعرض رسالة نجاح/فشل للمستخدم.

### 4.4 اختبار Gmail / Outlook

لم يُجرَب بعد على Gmail/Outlook لأننا نحتاج إلى عناوين بريدية للاختبار.
يرجى تزويدنا بـ:
- عنوان Gmail
- عنوان Outlook/Hotmail

## 5. ملاحظات أمنية

- لم يُعرض `SMTP_PASSWORD` أو أي توكنات في هذه التقارير.
- جميع مرفقات المتقدمين تُرفع الآن إلى Vercel Blob بدلاً من `/tmp/uploads`.

## 6. الخطوات التالية المطلوبة منك

1. **تفعيل DKIM** في Zoho Mail Admin لـ `bonds-global.com` (خطوة ضرورية لتوصيل Gmail/Outlook).
2. **تزويدنا بعناوين Gmail/Outlook** لإجراء اختبار التوصيل الفعلي.
3. **التحقق من وصول الإشعار الإداري** إلى `info@bonds-global.com` لطلب `AFQ-2026-000003`.
4. **التحقق من وصول البريد التأكيدي** لطلب `AFQ-2026-000003` على `info@bonds-global.com`.

---

**ملفات التعديل الرئيسية:**
- `lib/email.ts`
- `pages/api/talents/register.ts`
- `app/api/talents/resend-verification/route.ts`
- `app/admin/dashboard/page.tsx`
- `prisma/schema.prisma`
- `prisma/migrations/20260825222211_add_email_status/migration.sql`
