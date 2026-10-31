'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, CheckCircle2, Database, Loader2, ShieldCheck, XCircle } from 'lucide-react';

type StatusData = {
  collection: { configured: boolean; measurementId: string | null };
  dataApi: {
    configured: boolean;
    propertyConfigured: boolean;
    serviceAccountConfigured: boolean;
    status: string;
  };
  generatedAt: string;
};

type SummaryData = {
  period: { startDate: string; endDate: string };
  metrics: {
    activeUsers: number;
    sessions: number;
    screenPageViews: number;
    engagedSessions: number;
    engagementRate: number;
    averageSessionDuration: number;
    eventCount: number;
    keyEvents: number;
  };
  generatedAt: string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number) {
  return new Intl.NumberFormat('ar-SA', { style: 'percent', maximumFractionDigits: 1 }).format(value);
}

function formatDuration(seconds: number) {
  const rounded = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return `${minutes}د ${rest}ث`;
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<StatusData | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [error, setError] = useState('');
  const [summaryError, setSummaryError] = useState('');

  useEffect(() => {
    fetch('/api/admin/analytics/status')
      .then(async (res) => {
        const json = await res.json();
        if (res.status === 401) {
          router.push('/admin/login');
          return null;
        }
        if (!res.ok || !json.success) throw new Error(json.message || 'تعذر تحميل حالة التحليلات');
        return json as StatusData;
      })
      .then(async (json) => {
        if (!json) return;
        setData(json);

        if (!json.dataApi.configured) return;

        const res = await fetch('/api/admin/analytics/summary');
        const body = await res.json();

        if (res.status === 401) {
          router.push('/admin/login');
          return;
        }
        if (!res.ok || !body.success) {
          setSummaryError(body.message || 'تعذر تحميل بيانات GA4');
          return;
        }
        setSummary(body as SummaryData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'تعذر تحميل حالة التحليلات'));
  }, [router]);

  if (!data && !error) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-afaq-teal animate-spin" /></div>;
  }

  if (error) {
    return <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl p-4">{error}</div>;
  }

  const ready = data!.dataApi.configured;

  const cards = summary ? [
    ['المستخدمون النشطون', formatNumber(summary.metrics.activeUsers)],
    ['الجلسات', formatNumber(summary.metrics.sessions)],
    ['مشاهدات الصفحات', formatNumber(summary.metrics.screenPageViews)],
    ['الجلسات المتفاعلة', formatNumber(summary.metrics.engagedSessions)],
    ['نسبة التفاعل', formatPercent(summary.metrics.engagementRate)],
    ['متوسط مدة الجلسة', formatDuration(summary.metrics.averageSessionDuration)],
    ['الأحداث', formatNumber(summary.metrics.eventCount)],
    ['الأحداث الرئيسية', formatNumber(summary.metrics.keyEvents)],
  ] : [];

  return (
    <div className="max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">التحليلات</h1>
        <p className="text-white/50 text-sm mt-1">حالة جمع البيانات وقراءة Google Analytics داخل لوحة الإدارة.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <Activity className="w-6 h-6 text-afaq-teal mb-3" />
          <p className="text-white/50 text-sm">جمع GA4 من الموقع العام</p>
          <div className="flex items-center gap-2 mt-3">
            {data!.collection.configured ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
            <span className="text-white font-semibold">{data!.collection.configured ? 'مفعّل' : 'غير مهيأ'}</span>
          </div>
          {data!.collection.measurementId && (
            <p className="text-white/40 text-xs mt-2" dir="ltr">{data!.collection.measurementId}</p>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <Database className="w-6 h-6 text-afaq-gold mb-3" />
          <p className="text-white/50 text-sm">Google Analytics Data API</p>
          <div className="flex items-center gap-2 mt-3">
            {ready ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <XCircle className="w-5 h-5 text-yellow-400" />}
            <span className="text-white font-semibold">{ready ? 'جاهز للقراءة' : 'غير مكتمل الإعداد'}</span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <ShieldCheck className="w-6 h-6 text-afaq-blue2 mb-3" />
          <p className="text-white/50 text-sm">خصوصية الإدارة</p>
          <p className="text-white font-semibold mt-3">زيارات /admin مستبعدة من GA4</p>
          <p className="text-white/40 text-xs mt-2">حتى لا تختلط حركة المشرفين بحركة العملاء.</p>
        </div>
      </div>

      {ready && !summary && !summaryError && (
        <div className="flex items-center gap-2 text-white/60 py-6">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>جارٍ قراءة بيانات GA4...</span>
        </div>
      )}

      {summaryError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl p-4 mb-6">
          {summaryError}
        </div>
      )}

      {summary && (
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4 mb-3">
            <h2 className="text-white font-semibold">ملخص آخر 30 يومًا</h2>
            <span className="text-white/40 text-xs">بيانات مباشرة من GA4</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {cards.map(([label, value]) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-white/50 text-xs">{label}</p>
                <p className="text-white text-2xl font-bold mt-2">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!ready && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-5">
          <h2 className="text-yellow-200 font-semibold">الجزء المتبقي لعرض عدادات GA4 داخل اللوحة</h2>
          <p className="text-yellow-100/70 text-sm mt-2">
            يلزم GA4 Property ID وحساب خدمة Google بصلاحية Viewer فقط. لا تُعرض أي أرقام GA4 هنا قبل اكتمال هذين الشرطين.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mt-4 text-sm">
            <div className="bg-black/10 rounded-lg p-3">
              <span className="text-white/50">Property ID:</span>
              <span className="text-white mr-2">{data!.dataApi.propertyConfigured ? 'موجود' : 'غير موجود'}</span>
            </div>
            <div className="bg-black/10 rounded-lg p-3">
              <span className="text-white/50">Service Account:</span>
              <span className="text-white mr-2">{data!.dataApi.serviceAccountConfigured ? 'موجود' : 'غير موجود'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
