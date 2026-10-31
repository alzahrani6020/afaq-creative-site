'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  UserX,
} from 'lucide-react';
import { getCountry } from '@/lib/catalog/locations';

type Summary = {
  total: number;
  new: number;
  under_review: number;
  qualified: number;
  need_information: number;
  contacted: number;
  accepted: number;
  rejected: number;
  last7: number;
  previous7: number;
  last30: number;
  previous30: number;
  last7ChangePercent: number | null;
  last30ChangePercent: number | null;
  acceptanceRate: number;
  decisionAcceptanceRate: number;
  decisionRate: number;
  backlog: number;
  backlogRate: number;
  stale7: number;
  stale30: number;
  oldestOpenAgeDays: number;
};

type DashboardData = {
  summary: Summary;
  byCountry: Array<{ country: string; count: number }>;
  byCategory: Array<{ category: string; count: number }>;
  generatedAt: string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 0 }).format(value || 0);
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 1 }).format(value || 0)}%`;
}

function changeLabel(value: number | null) {
  if (value === null) return 'جديد';
  const sign = value > 0 ? '+' : '';
  return `${sign}${new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 1 }).format(value)}%`;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/admin/dashboard', { cache: 'no-store' })
      .then(async (res) => {
        const json = await res.json();
        if (res.status === 401) {
          router.push('/admin/login');
          return null;
        }
        if (!res.ok || !json.success) throw new Error(json.message || 'تعذر تحميل البيانات');
        return json as DashboardData;
      })
      .then((json) => {
        if (active && json) setData(json);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'تعذر تحميل البيانات');
      });
    return () => {
      active = false;
    };
  }, [router]);

  const insights = useMemo(() => {
    if (!data) return [];
    const s = data.summary;
    const result: string[] = [];
    if (s.backlog) result.push(`يوجد ${formatNumber(s.backlog)} طلبًا مفتوحًا يمثل ${formatPercent(s.backlogRate)} من إجمالي الطلبات.`);
    if (s.stale7) result.push(`${formatNumber(s.stale7)} طلبًا مفتوحًا تجاوز عمره 7 أيام.`);
    if (s.stale30) result.push(`${formatNumber(s.stale30)} طلبًا مفتوحًا تجاوز عمره 30 يومًا ويحتاج أولوية مراجعة.`);
    if (s.need_information) result.push(`${formatNumber(s.need_information)} طلبًا متوقفًا على استكمال معلومات.`);
    if (!result.length) result.push('لا توجد مؤشرات تشغيلية متأخرة ظاهرة حاليًا.');
    return result.slice(0, 4);
  }, [data]);

  if (!data && !error) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-afaq-teal animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl p-4">{error}</div>;
  }

  const s = data!.summary;
  const cards = [
    { label: 'إجمالي الطلبات', value: formatNumber(s.total), icon: Users },
    { label: 'طلبات جديدة', value: formatNumber(s.new), icon: AlertCircle },
    { label: 'قيد المراجعة', value: formatNumber(s.under_review), icon: Clock3 },
    { label: 'مؤهل', value: formatNumber(s.qualified), icon: UserCheck },
    { label: 'يحتاج معلومات', value: formatNumber(s.need_information), icon: AlertCircle },
    { label: 'تم التواصل', value: formatNumber(s.contacted), icon: CheckCircle2 },
    { label: 'مقبول', value: formatNumber(s.accepted), icon: CheckCircle2 },
    { label: 'مرفوض', value: formatNumber(s.rejected), icon: UserX },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">لوحة القيادة التنفيذية</h1>
          <p className="text-white/50 text-sm mt-1">مؤشرات تشغيلية مباشرة من قاعدة بيانات طلبات المواهب، مع backlog والتقادم ومعدلات القرار.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/analytics" className="text-afaq-teal hover:text-white text-sm">فتح التحليلات</Link>
          <Link href="/admin/talents" className="inline-flex items-center gap-2 text-afaq-teal hover:text-white text-sm">
            فتح طلبات المواهب
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <section className="bg-gradient-to-br from-afaq-teal/10 to-white/5 border border-afaq-teal/20 rounded-2xl p-5">
        <h2 className="text-white font-semibold mb-4">ملخص تشغيلي</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {insights.map((item) => (
            <div key={item} className="bg-black/10 rounded-lg p-3 text-white/80 text-sm">{item}</div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-white/50 text-xs">{label}</p>
                <p className="text-2xl font-bold text-white mt-2">{value}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-afaq-teal/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-afaq-teal" />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-white/50 text-xs">Backlog المفتوح</p>
          <p className="text-2xl font-bold text-white mt-2">{formatNumber(s.backlog)}</p>
          <p className="text-white/40 text-xs mt-2">{formatPercent(s.backlogRate)} من الإجمالي</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-white/50 text-xs">متأخر أكثر من 7 أيام</p>
          <p className="text-2xl font-bold text-white mt-2">{formatNumber(s.stale7)}</p>
          <p className="text-white/40 text-xs mt-2">طلبات مفتوحة حسب تاريخ التقديم</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-white/50 text-xs">متأخر أكثر من 30 يومًا</p>
          <p className="text-2xl font-bold text-white mt-2">{formatNumber(s.stale30)}</p>
          <p className="text-white/40 text-xs mt-2">تحتاج أولوية مراجعة</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-white/50 text-xs">عمر أقدم طلب مفتوح</p>
          <p className="text-2xl font-bold text-white mt-2">{formatNumber(s.oldestOpenAgeDays)}</p>
          <p className="text-white/40 text-xs mt-2">يوم</p>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <p className="text-white/50 text-xs">معدل القبول من جميع الطلبات</p>
          <p className="text-3xl font-bold text-white mt-2">{formatPercent(s.acceptanceRate)}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <p className="text-white/50 text-xs">معدل القبول بين الطلبات المحسومة</p>
          <p className="text-3xl font-bold text-white mt-2">{formatPercent(s.decisionAcceptanceRate)}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <p className="text-white/50 text-xs">نسبة الطلبات المحسومة</p>
          <p className="text-3xl font-bold text-white mt-2">{formatPercent(s.decisionRate)}</p>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">الحركة والمقارنة</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              ['آخر 7 أيام', s.last7, s.last7ChangePercent],
              ['آخر 30 يومًا', s.last30, s.last30ChangePercent],
            ].map(([label, value, change]) => {
              const numericChange = change as number | null;
              return (
                <div key={String(label)} className="rounded-lg bg-white/5 p-4">
                  <p className="text-white/50 text-sm">{label}</p>
                  <p className="text-3xl font-bold text-white mt-2">{formatNumber(Number(value))}</p>
                  <div className={`flex items-center gap-1 mt-2 text-xs ${
                    numericChange !== null && numericChange > 0
                      ? 'text-green-300'
                      : numericChange !== null && numericChange < 0
                      ? 'text-red-300'
                      : 'text-white/40'
                  }`}>
                    {numericChange !== null && numericChange > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : null}
                    {numericChange !== null && numericChange < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : null}
                    <span>{changeLabel(numericChange)} مقابل الفترة السابقة</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">أعلى الدول</h2>
          <div className="space-y-3">
            {data!.byCountry.length === 0 ? (
              <p className="text-white/40 text-sm">لا توجد بيانات بعد.</p>
            ) : data!.byCountry.map((row) => (
              <div key={row.country} className="flex items-center justify-between gap-3">
                <span className="text-white/70 text-sm">
                  {getCountry(row.country)?.label || (row.country === 'UNKNOWN' ? 'غير محدد' : row.country)}
                </span>
                <span className="text-white font-semibold">{formatNumber(row.count)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">أعلى فئات الطلبات</h2>
          <div className="space-y-3">
            {data!.byCategory.length === 0 ? (
              <p className="text-white/40 text-sm">لا توجد بيانات بعد.</p>
            ) : data!.byCategory.map((row) => (
              <div key={row.category} className="flex items-center justify-between gap-3">
                <span className="text-white/70 text-sm">{row.category}</span>
                <span className="text-white font-semibold">{formatNumber(row.count)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="text-white font-semibold">تحليلات الموقع</h2>
          <p className="text-white/50 text-sm mt-2">Google Analytics Data API متصل ويعرض المؤشرات والاتجاهات ومصادر الزيارات والدول والأجهزة والصفحات داخل الإدارة.</p>
          <Link href="/admin/analytics" className="inline-flex items-center gap-2 text-afaq-teal hover:text-white text-sm mt-4">
            فتح لوحة ذكاء الأداء
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <p className="text-white/30 text-xs" dir="ltr">
        Last refresh: {new Date(data!.generatedAt).toLocaleString('ar-SA')}
      </p>
    </div>
  );
}
