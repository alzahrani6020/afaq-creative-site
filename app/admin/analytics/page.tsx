import { Activity, BarChart3, Database, ShieldCheck } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const gaConfigured = Boolean(process.env.NEXT_PUBLIC_GA_ID);
  const reportingConfigured = Boolean(
    process.env.GA4_PROPERTY_ID &&
    process.env.GA4_CLIENT_EMAIL &&
    process.env.GA4_PRIVATE_KEY
  );

  const items = [
    {
      title: 'جمع بيانات GA4',
      status: gaConfigured ? 'متصل' : 'غير مهيأ',
      detail: gaConfigured
        ? 'معرّف القياس موجود في بيئة النشر العامة للموقع.'
        : 'NEXT_PUBLIC_GA_ID غير موجود.',
      icon: Activity,
      healthy: gaConfigured,
    },
    {
      title: 'تقارير GA4 داخل الإدارة',
      status: reportingConfigured ? 'جاهز للتوصيل' : 'ينتظر صلاحية قراءة',
      detail: reportingConfigured
        ? 'بيانات اعتماد القراءة موجودة ويمكن تشغيل Data API.'
        : 'يلزم GA4 Property ID + Service Account بصلاحية Viewer. لا يتم عرض أو تخزين مفاتيح هنا.',
      icon: BarChart3,
      healthy: reportingConfigured,
    },
    {
      title: 'حركة المشرفين',
      status: 'مستبعدة',
      detail: 'المسارات /admin/* لا ترسل page_view إلى GA4 حتى لا تلوّث بيانات العملاء.',
      icon: ShieldCheck,
      healthy: true,
    },
    {
      title: 'مصدر البيانات التشغيلية',
      status: 'قاعدة المواهب',
      detail: 'عدادات Dashboard الحالية تُقرأ مباشرة من PostgreSQL وليست أرقامًا تقديرية.',
      icon: Database,
      healthy: true,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">التحليلات والتكاملات</h1>
        <p className="text-white/50 text-sm mt-1">
          حالة مصادر البيانات. لا تُعرض أرقام غير موثوقة عندما يكون مصدرها غير متصل.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {items.map(({ title, status, detail, icon: Icon, healthy }) => (
          <div key={title} className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-white">{title}</h2>
                <p className="text-sm text-white/50 mt-2 leading-6">{detail}</p>
              </div>
              <Icon className="w-5 h-5 text-afaq-teal shrink-0" />
            </div>
            <div className="mt-4">
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${
                healthy
                  ? 'border-green-500/20 bg-green-500/10 text-green-300'
                  : 'border-yellow-500/20 bg-yellow-500/10 text-yellow-300'
              }`}>
                {status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {!reportingConfigured && (
        <div className="rounded-xl border border-afaq-gold/20 bg-afaq-gold/5 p-5">
          <h2 className="font-semibold text-afaq-gold">ما الذي يمنع أرقام GA4 داخل اللوحة؟</h2>
          <p className="text-sm text-white/60 mt-2 leading-6">
            جمع البيانات يعمل، لكن قراءة التقارير من الخادم تحتاج حساب خدمة Google بصلاحية Viewer فقط.
            لن يتم طلب صلاحية تعديل Analytics، ولن يوضع المفتاح في الواجهة الأمامية.
          </p>
        </div>
      )}
    </div>
  );
}
