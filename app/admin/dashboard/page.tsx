'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Activity, ArrowUpLeft, CheckCircle2, Clock3, Loader2, Users } from 'lucide-react';
import { countries } from '@/lib/catalog/locations';

const statusLabels: Record<string, string> = {
  new: 'جديد',
  under_review: 'قيد المراجعة',
  qualified: 'مؤهل',
  need_information: 'يحتاج بيانات',
  contacted: 'تم التواصل',
  accepted: 'مقبول',
  rejected: 'مرفوض',
};

interface DashboardData {
  generatedAt: string;
  totals: {
    total: number;
    today: number;
    last7Days: number;
    last30Days: number;
    conversionRate: number;
  };
  byStatus: Record<string, number>;
  topCountries: { country: string | null; count: number }[];
  recent: {
    id: string;
    applicationNumber: string;
    status: string;
    country: string | null;
    createdAt: string;
  }[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/dashboard', { cache: 'no-store' })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || 'تعذر تحميل البيانات');
        setData(json);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'تعذر تحميل البيانات'));
  }, []);

  const countryMap = useMemo(
    () => Object.fromEntries(countries.map((country) => [country.value, country.label])),
    []
  );

  if (!data && !error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-afaq-teal" />
      </div>
    );
  }

  if (error) {
    return <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">{error}</div>;
  }

  if (!data) return null;

  const cards = [
    { label: 'إجمالي الطلبات', value: data.totals.total, icon: Users },
    { label: 'طلبات اليوم', value: data.totals.today, icon: Activity },
    { label: 'آخر 7 أيام', value: data.totals.last7Days, icon: Clock3 },
    { label: 'مؤهل + مقبول', value: `${data.totals.conversionRate}%`, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">لوحة القيادة</h1>
          <p className="text-sm text-white/50 mt-1">مؤشرات تشغيلية مباشرة من قاعدة بيانات المواهب</p>
        </div>
        <div className="text-xs text-white/40" dir="ltr">
          Updated {new Date(data.generatedAt).toLocaleString('ar-SA')}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/50">{label}</span>
              <Icon className="w-5 h-5 text-afaq-teal" />
            </div>
            <div className="text-3xl font-bold text-white mt-3">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white">حالات الطلبات</h2>
            <Link href="/admin/talents" className="text-sm text-afaq-teal hover:text-afaq-blue2">
              عرض الكل
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(statusLabels).map(([key, label]) => (
              <Link
                key={key}
                href={`/admin/talents?status=${key}`}
                className="rounded-lg border border-white/10 bg-black/10 p-3 hover:border-afaq-teal/30 transition-colors"
              >
                <div className="text-xs text-white/50">{label}</div>
                <div className="text-xl font-semibold text-white mt-1">{data.byStatus[key] || 0}</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-bold text-white mb-4">أعلى الدول تسجيلًا</h2>
          {data.topCountries.length === 0 ? (
            <p className="text-white/40 text-sm">لا توجد بيانات جغرافية بعد.</p>
          ) : (
            <div className="space-y-3">
              {data.topCountries.map((row) => (
                <div key={row.country || 'unknown'} className="flex items-center justify-between">
                  <span className="text-white/70">{row.country ? countryMap[row.country] || row.country : 'غير محدد'}</span>
                  <span className="font-semibold text-white">{row.count}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="font-bold text-white">أحدث الطلبات</h2>
          <span className="text-sm text-white/40">آخر 30 يومًا: {data.totals.last30Days}</span>
        </div>
        <div className="divide-y divide-white/5">
          {data.recent.map((item) => (
            <Link
              key={item.id}
              href={`/admin/talents/${item.id}`}
              className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-white/5 transition-colors"
            >
              <div>
                <div className="font-medium text-white">{item.applicationNumber}</div>
                <div className="text-xs text-white/40 mt-1">
                  {item.country ? countryMap[item.country] || item.country : 'دولة غير محددة'} · {new Date(item.createdAt).toLocaleDateString('ar-SA')}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-white/60">{statusLabels[item.status] || item.status}</span>
                <ArrowUpLeft className="w-4 h-4 text-afaq-teal" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
