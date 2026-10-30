'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, CheckCircle2, Clock3, Loader2, UserCheck, Users, UserX } from 'lucide-react';
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
  last30: number;
  conversionRate: number;
};

type DashboardData = {
  summary: Summary;
  byCountry: Array<{ country: string; count: number }>;
  generatedAt: string;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/admin/dashboard')
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

  if (!data && !error) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-afaq-teal animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl p-4">
        {error}
      </div>
    );
  }

  const s = data!.summary;
  const cards = [
    { label: 'إجمالي الطلبات', value: s.total, icon: Users },
    { label: 'طلبات جديدة', value: s.new, icon: AlertCircle },
    { label: 'قيد المراجعة', value: s.under_review, icon: Clock3 },
    { label: 'مؤهل', value: s.qualified, icon: UserCheck },
    { label: 'تم التواصل', value: s.contacted, icon: CheckCircle2 },
    { label: 'مقبول', value: s.accepted, icon: CheckCircle2 },
    { label: 'مرفوض', value: s.rejected, icon: UserX },
    { label: 'معدل القبول', value: `${s.conversionRate}%`, icon: UserCheck },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">لوحة القيادة</h1>
          <p className="text-white/50 text-sm mt-1">مؤشرات تشغيلية مباشرة من قاعدة بيانات طلبات المواهب.</p>
        </div>
        <Link href="/admin/talents" className="inline-flex items-center gap-2 text-afaq-teal hover:text-white text-sm">
          فتح طلبات المواهب
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">الحركة الأخيرة</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-lg bg-white/5 p-4">
              <p className="text-white/50 text-sm">طلبات آخر 7 أيام</p>
              <p className="text-3xl font-bold text-white mt-2">{s.last7}</p>
            </div>
            <div className="rounded-lg bg-white/5 p-4">
              <p className="text-white/50 text-sm">طلبات آخر 30 يومًا</p>
              <p className="text-3xl font-bold text-white mt-2">{s.last30}</p>
            </div>
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
                <span className="text-white font-semibold">{row.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-white font-semibold">تحليلات الموقع</h2>
            <p className="text-white/50 text-sm mt-1">GA4 يعمل على الموقع العام، لكن قراءة المؤشرات داخل الإدارة تتطلب Google Analytics Data API بصلاحية قراءة فقط.</p>
          </div>
          <Link href="/admin/analytics" className="text-afaq-teal hover:text-white text-sm">فتح حالة التكامل</Link>
        </div>
      </div>
    </div>
  );
}
