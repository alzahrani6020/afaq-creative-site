'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  Download,
  Globe2,
  Loader2,
  MonitorSmartphone,
  Printer,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';

type RangeKey = '7d' | '30d' | '90d';
type Row = Record<string, string | number>;
type Comparison = { current: number; previous: number; changePercent: number | null };

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
  range: RangeKey;
  rangeLabel: string;
  period: { startDate: string; endDate: string };
  metrics: Record<string, number>;
  previousMetrics: Record<string, number>;
  comparisons: Record<string, Comparison>;
  trend: Row[];
  acquisition: Row[];
  locations: Row[];
  devices: Row[];
  pages: Row[];
  visitors: Row[];
  peakHours: Row[];
  funnel: Row[];
  executiveSummary: string[];
  health: {
    dataApi: string;
    propertyIdConfigured: boolean;
    serviceAccountConfigured: boolean;
  };
  generatedAt: string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 0 }).format(value || 0);
}

function formatPercent(value: number) {
  return new Intl.NumberFormat('ar-SA', { style: 'percent', maximumFractionDigits: 1 }).format(value || 0);
}

function formatDuration(seconds: number) {
  const rounded = Math.max(0, Math.round(seconds || 0));
  const minutes = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return `${minutes}:${String(rest).padStart(2, '0')} دقيقة`;
}

function formatChange(value: number | null) {
  if (value === null) return 'جديد';
  const sign = value > 0 ? '+' : '';
  return `${sign}${new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 1 }).format(value)}%`;
}

function shortDate(value: string | number) {
  const raw = String(value || '');
  if (raw.length !== 8) return raw;
  return `${raw.slice(6, 8)}/${raw.slice(4, 6)}`;
}

function maxOf(rows: Row[], key: string) {
  return Math.max(1, ...rows.map((row) => Number(row[key] || 0)));
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<StatusData | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [range, setRange] = useState<RangeKey>('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [countryView, setCountryView] = useState('ALL');

  const load = useCallback(async (nextRange: RangeKey) => {
    setLoading(true);
    setError('');
    try {
      const statusRes = await fetch('/api/admin/analytics/status', { cache: 'no-store' });
      const statusBody = await statusRes.json();
      if (statusRes.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!statusRes.ok || !statusBody.success) throw new Error(statusBody.message || 'تعذر تحميل حالة التحليلات');
      setStatus(statusBody as StatusData);

      if (!statusBody.dataApi.configured) {
        setSummary(null);
        return;
      }

      const summaryRes = await fetch(`/api/admin/analytics/summary?range=${nextRange}`, { cache: 'no-store' });
      const summaryBody = await summaryRes.json();
      if (summaryRes.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!summaryRes.ok || !summaryBody.success) throw new Error(summaryBody.message || 'تعذر تحميل بيانات GA4');
      setSummary(summaryBody as SummaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل التحليلات');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load(range);
  }, [load, range]);

  const cards = useMemo(() => {
    if (!summary) return [];
    const m = summary.metrics;
    const c = summary.comparisons;
    return [
      ['المستخدمون النشطون', formatNumber(m.activeUsers), c.activeUsers],
      ['الجلسات', formatNumber(m.sessions), c.sessions],
      ['مشاهدات الصفحات', formatNumber(m.screenPageViews), c.screenPageViews],
      ['الجلسات المتفاعلة', formatNumber(m.engagedSessions), c.engagedSessions],
      ['نسبة التفاعل', formatPercent(m.engagementRate), c.engagementRate],
      ['متوسط مدة الجلسة', formatDuration(m.averageSessionDuration), c.averageSessionDuration],
      ['الأحداث', formatNumber(m.eventCount), c.eventCount],
      ['الأحداث الرئيسية', formatNumber(m.keyEvents), c.keyEvents],
    ] as Array<[string, string, Comparison | undefined]>;
  }, [summary]);

  const alerts = useMemo(() => {
    if (!summary) return [];
    const result: Array<{ level: 'warning' | 'info'; text: string }> = [];
    const sessions = summary.comparisons.sessions?.changePercent;
    const users = summary.comparisons.activeUsers?.changePercent;
    const keyEvents = summary.metrics.keyEvents || 0;
    if (sessions !== null && sessions !== undefined && sessions <= -25) {
      result.push({ level: 'warning', text: `انخفاض الجلسات ${Math.abs(sessions)}% مقارنة بالفترة السابقة.` });
    }
    if (users !== null && users !== undefined && users <= -25) {
      result.push({ level: 'warning', text: `انخفاض المستخدمين النشطين ${Math.abs(users)}% مقارنة بالفترة السابقة.` });
    }
    if ((summary.metrics.sessions || 0) > 0 && keyEvents === 0) {
      result.push({ level: 'info', text: 'توجد زيارات، لكن لا توجد أحداث رئيسية مسجلة في الفترة الحالية.' });
    }
    if (!summary.funnel.length) {
      result.push({ level: 'info', text: 'بيانات Funnel ستبدأ بالظهور بعد استخدام نموذج المواهب على الإصدار الحالي.' });
    }
    return result.slice(0, 4);
  }, [summary]);

  const countries = useMemo(() => {
    if (!summary) return [];
    return Array.from(new Set(summary.locations.map((row) => String(row.country || '')).filter(Boolean))).sort();
  }, [summary]);

  const visibleLocations = useMemo(() => {
    if (!summary) return [];
    if (countryView === 'ALL') return summary.locations;
    return summary.locations.filter((row) => String(row.country || '') === countryView);
  }, [summary, countryView]);

  const exportCsv = () => {
    if (!summary) return;
    const lines = [
      ['القسم', 'البند', 'القيمة 1', 'القيمة 2', 'القيمة 3'],
      ...Object.entries(summary.metrics).map(([key, value]) => ['KPI', key, String(value), '', '']),
      ...summary.acquisition.map((row) => ['مصادر الزيارات', String(row.sessionSourceMedium || ''), String(row.sessions || 0), String(row.activeUsers || 0), String(row.engagementRate || 0)]),
      ...summary.locations.map((row) => ['الجغرافيا', String(row.country || ''), String(row.city || ''), String(row.sessions || 0), String(row.activeUsers || 0)]),
      ...summary.pages.map((row) => ['الصفحات', String(row.pageTitle || ''), String(row.pagePath || ''), String(row.screenPageViews || 0), String(row.activeUsers || 0)]),
    ];
    const csv = '\uFEFF' + lines.map((row) => row.map((cell) => {
      const safe = String(cell ?? '').replace(/"/g, '""');
      return `"${safe}"`;
    }).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `afaq-analytics-${summary.range}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  if (!status && loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-afaq-teal animate-spin" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">ذكاء الأداء والتحليلات</h1>
          <p className="text-white/50 text-sm mt-1">لوحة قرار تجمع مؤشرات GA4 والاتجاهات والاكتساب والجغرافيا والأجهزة والمحتوى.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['7d', '30d', '90d'] as RangeKey[]).map((item) => (
            <button
              key={item}
              onClick={() => setRange(item)}
              className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                range === item
                  ? 'bg-afaq-teal/15 text-afaq-teal border-afaq-teal/30'
                  : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
              }`}
            >
              {item === '7d' ? '7 أيام' : item === '30d' ? '30 يومًا' : '90 يومًا'}
            </button>
          ))}
          <button
            onClick={() => load(range)}
            className="px-3 py-2 rounded-lg text-sm bg-white/5 text-white/70 border border-white/10 hover:text-white inline-flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
          <button
            onClick={exportCsv}
            disabled={!summary}
            className="px-3 py-2 rounded-lg text-sm bg-white/5 text-white/70 border border-white/10 hover:text-white inline-flex items-center gap-2 disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-2 rounded-lg text-sm bg-white/5 text-white/70 border border-white/10 hover:text-white inline-flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            طباعة
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl p-4">
          {error}
        </div>
      )}

      {summary && (
        <>
          <section className="bg-gradient-to-br from-afaq-teal/10 to-white/5 border border-afaq-teal/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-afaq-teal" />
              <h2 className="text-white font-semibold">الملخص التنفيذي — {summary.rangeLabel}</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {summary.executiveSummary.length ? summary.executiveSummary.map((item) => (
                <div key={item} className="bg-black/10 rounded-lg p-3 text-white/80 text-sm">{item}</div>
              )) : (
                <p className="text-white/50 text-sm">لا توجد بيانات كافية لبناء ملخص مقارن بعد.</p>
              )}
            </div>
          </section>

          {alerts.length > 0 && (
            <section className="grid md:grid-cols-2 gap-3">
              {alerts.map((alert) => (
                <div
                  key={alert.text}
                  className={`rounded-xl border p-4 text-sm ${
                    alert.level === 'warning'
                      ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-100'
                      : 'bg-blue-500/10 border-blue-500/20 text-blue-100'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{alert.text}</span>
                  </div>
                </div>
              ))}
            </section>
          )}

          <section>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-white font-semibold">المؤشرات الرئيسية</h2>
              <span className="text-white/40 text-xs">المقارنة مع الفترة السابقة المماثلة</span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {cards.map(([label, value, comparison]) => {
                const change = comparison?.changePercent ?? null;
                const positive = change !== null && change > 0;
                const negative = change !== null && change < 0;
                return (
                  <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-white/50 text-xs">{label}</p>
                    <p className="text-white text-2xl font-bold mt-2">{value}</p>
                    <div className={`flex items-center gap-1 mt-2 text-xs ${
                      positive ? 'text-green-300' : negative ? 'text-red-300' : 'text-white/40'
                    }`}>
                      {positive ? <TrendingUp className="w-3.5 h-3.5" /> : negative ? <TrendingDown className="w-3.5 h-3.5" /> : null}
                      <span>{formatChange(change)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between gap-3 mb-5">
              <h2 className="text-white font-semibold">الاتجاه اليومي</h2>
              <span className="text-white/40 text-xs">الجلسات حسب اليوم</span>
            </div>
            {summary.trend.length ? (
              <div className="flex items-end gap-1 h-44 overflow-x-auto pb-6">
                {summary.trend.map((row) => {
                  const max = maxOf(summary.trend, 'sessions');
                  const height = Math.max(4, (Number(row.sessions || 0) / max) * 130);
                  return (
                    <div key={String(row.date)} className="min-w-8 flex-1 h-full flex flex-col justify-end items-center gap-1">
                      <span className="text-white/40 text-[10px]">{formatNumber(Number(row.sessions || 0))}</span>
                      <div className="w-full max-w-8 rounded-t bg-afaq-teal/70" style={{ height }} />
                      <span className="text-white/30 text-[9px] whitespace-nowrap">{shortDate(row.date)}</span>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-white/40 text-sm">لا توجد بيانات اتجاه كافية.</p>}
          </section>

          <div className="grid xl:grid-cols-2 gap-6">
            <section className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h2 className="text-white font-semibold mb-4">مصادر الزيارات</h2>
              <div className="space-y-3">
                {summary.acquisition.length ? summary.acquisition.map((row) => (
                  <div key={String(row.sessionSourceMedium)} className="flex items-center justify-between gap-4 border-b border-white/5 pb-3 last:border-0">
                    <div className="min-w-0">
                      <p className="text-white/80 text-sm truncate" dir="ltr">{String(row.sessionSourceMedium || '(direct)')}</p>
                      <p className="text-white/40 text-xs">{formatPercent(Number(row.engagementRate || 0))} تفاعل</p>
                    </div>
                    <div className="text-left">
                      <p className="text-white font-semibold">{formatNumber(Number(row.sessions || 0))}</p>
                      <p className="text-white/40 text-xs">جلسة</p>
                    </div>
                  </div>
                )) : <p className="text-white/40 text-sm">لا توجد بيانات مصادر بعد.</p>}
              </div>
            </section>

            <section className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Globe2 className="w-5 h-5 text-afaq-teal" />
                  <h2 className="text-white font-semibold">الدول والمدن</h2>
                </div>
                <select
                  value={countryView}
                  onChange={(event) => setCountryView(event.target.value)}
                  className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white/70 text-xs"
                >
                  <option value="ALL">كل الدول</option>
                  {countries.map((country) => <option key={country} value={country}>{country}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                {visibleLocations.length ? visibleLocations.slice(0, 10).map((row, index) => (
                  <div key={`${row.country}-${row.city}-${index}`} className="grid grid-cols-[1fr_auto] gap-3 border-b border-white/5 pb-3 last:border-0">
                    <div>
                      <p className="text-white/80 text-sm">{String(row.country || 'غير محدد')} — {String(row.city || 'غير محدد')}</p>
                      <p className="text-white/40 text-xs">{formatPercent(Number(row.engagementRate || 0))} تفاعل</p>
                    </div>
                    <span className="text-white font-semibold">{formatNumber(Number(row.sessions || 0))}</span>
                  </div>
                )) : <p className="text-white/40 text-sm">لا توجد بيانات جغرافية مطابقة.</p>}
              </div>
            </section>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <section className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <MonitorSmartphone className="w-5 h-5 text-afaq-gold" />
                <h2 className="text-white font-semibold">الأجهزة</h2>
              </div>
              <div className="space-y-3">
                {summary.devices.map((row) => (
                  <div key={String(row.deviceCategory)} className="flex items-center justify-between gap-3">
                    <span className="text-white/70 text-sm">{String(row.deviceCategory)}</span>
                    <span className="text-white font-semibold">{formatNumber(Number(row.sessions || 0))}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-afaq-teal" />
                <h2 className="text-white font-semibold">جدد مقابل عائدين</h2>
              </div>
              <div className="space-y-3">
                {summary.visitors.length ? summary.visitors.map((row) => (
                  <div key={String(row.newVsReturning)} className="flex items-center justify-between gap-3">
                    <span className="text-white/70 text-sm">{String(row.newVsReturning) === 'new' ? 'جدد' : String(row.newVsReturning) === 'returning' ? 'عائدون' : String(row.newVsReturning)}</span>
                    <span className="text-white font-semibold">{formatNumber(Number(row.activeUsers || 0))}</span>
                  </div>
                )) : <p className="text-white/40 text-sm">لا توجد بيانات كافية.</p>}
              </div>
            </section>

            <section className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock3 className="w-5 h-5 text-afaq-blue2" />
                <h2 className="text-white font-semibold">ساعات الذروة</h2>
              </div>
              <div className="space-y-3">
                {summary.peakHours.slice(0, 5).map((row) => (
                  <div key={String(row.hour)} className="flex items-center justify-between gap-3">
                    <span className="text-white/70 text-sm">{String(row.hour).padStart(2, '0')}:00</span>
                    <span className="text-white font-semibold">{formatNumber(Number(row.sessions || 0))} جلسة</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-white font-semibold">مسار تحويل طلبات المواهب</h2>
              <span className="text-white/40 text-xs">يبدأ القياس من هذا الإصدار؛ البيانات التاريخية السابقة لن تُعاد بناؤها</span>
            </div>
            {summary.funnel.length ? (
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  ['talent_form_start', 'بدأ النموذج'],
                  ['talent_form_step', 'تقدم داخل النموذج'],
                  ['talent_application_submit', 'إرسال ناجح'],
                ].map(([eventName, label]) => {
                  const row = summary.funnel.find((item) => String(item.eventName) === eventName);
                  return (
                    <div key={eventName} className="bg-black/10 rounded-xl p-4">
                      <p className="text-white/50 text-xs">{label}</p>
                      <p className="text-white text-2xl font-bold mt-2">{formatNumber(Number(row?.eventCount || 0))}</p>
                      <p className="text-white/40 text-xs mt-2">{formatNumber(Number(row?.activeUsers || 0))} مستخدم</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-white/40 text-sm">لم تُسجل أحداث Funnel بعد. سيبدأ ظهورها بعد أول استخدام للنموذج عقب نشر هذا الإصدار.</p>
            )}
          </section>

          <section className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">أكثر الصفحات مشاهدة</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="text-white/40 border-b border-white/10">
                    <th className="text-right py-3">الصفحة</th>
                    <th className="text-right py-3">المسار</th>
                    <th className="text-right py-3">المشاهدات</th>
                    <th className="text-right py-3">المستخدمون</th>
                    <th className="text-right py-3">التفاعل</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.pages.map((row, index) => (
                    <tr key={`${row.pagePath}-${index}`} className="border-b border-white/5">
                      <td className="text-white/80 py-3">{String(row.pageTitle || 'بدون عنوان')}</td>
                      <td className="text-white/40 py-3" dir="ltr">{String(row.pagePath || '')}</td>
                      <td className="text-white py-3">{formatNumber(Number(row.screenPageViews || 0))}</td>
                      <td className="text-white py-3">{formatNumber(Number(row.activeUsers || 0))}</td>
                      <td className="text-white py-3">{formatPercent(Number(row.engagementRate || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <Activity className="w-5 h-5 text-green-400 mb-2" />
              <p className="text-white/50 text-xs">Google Analytics Data API</p>
              <p className="text-white font-semibold mt-1">متصل فعليًا</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <ShieldCheck className="w-5 h-5 text-afaq-blue2 mb-2" />
              <p className="text-white/50 text-xs">خصوصية الإدارة</p>
              <p className="text-white font-semibold mt-1">زيارات /admin مستبعدة</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <Database className="w-5 h-5 text-afaq-gold mb-2" />
              <p className="text-white/50 text-xs">حداثة البيانات</p>
              <p className="text-white font-semibold mt-1">محدّثة عند الطلب</p>
              <p className="text-white/40 text-xs mt-1" dir="ltr">{new Date(summary.generatedAt).toLocaleString('ar-SA')}</p>
            </div>
          </section>
        </>
      )}

      {!loading && status && !status.dataApi.configured && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-300" />
            <h2 className="text-yellow-200 font-semibold">إعداد GA4 غير مكتمل</h2>
          </div>
          <p className="text-yellow-100/70 text-sm mt-2">يلزم Property ID وحساب خدمة بصلاحية Viewer قبل عرض التقارير.</p>
        </div>
      )}

      {loading && summary && (
        <div className="fixed bottom-5 left-5 bg-black/80 border border-white/10 rounded-lg px-3 py-2 text-white/70 text-xs inline-flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> تحديث البيانات
        </div>
      )}
    </div>
  );
}
