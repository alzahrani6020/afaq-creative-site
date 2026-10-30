'use client';

import { useEffect, useState } from 'react';
import { Activity, Database, GitCommit, Loader2, ShieldCheck } from 'lucide-react';

interface HealthData {
  generatedAt: string;
  environment: string;
  deployment: {
    commitSha: string | null;
    commitRef: string | null;
  };
  database: {
    status: string;
    checkedAt: string;
  };
  integrations: {
    ga4Collection: boolean;
    ga4Reporting: boolean;
    searchConsoleReporting: boolean;
  };
}

function StatusBadge({ ok, yes = 'Healthy', no = 'Not configured' }: { ok: boolean; yes?: string; no?: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${
      ok
        ? 'border-green-500/20 bg-green-500/10 text-green-300'
        : 'border-yellow-500/20 bg-yellow-500/10 text-yellow-300'
    }`}>
      {ok ? yes : no}
    </span>
  );
}

export default function AdminOperationsPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/operations/health', { cache: 'no-store' })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || 'تعذر الفحص');
        setData(json);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'تعذر الفحص'));
  }, []);

  if (!data && !error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-afaq-teal" />
      </div>
    );
  }

  if (error) {
    return <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">{error}</div>;
  }

  if (!data) return null;

  const dbOk = data.database.status === 'healthy';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">الحالة التشغيلية</h1>
        <p className="mt-1 text-sm text-white/50">
          فحص مباشر للطبقات الأساسية. القيمة غير المهيأة لا تُعرض كنجاح.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">قاعدة البيانات</h2>
              <p className="mt-2 text-sm text-white/50">PostgreSQL connectivity</p>
            </div>
            <Database className="h-5 w-5 text-afaq-teal" />
          </div>
          <div className="mt-4">
            <StatusBadge ok={dbOk} no="Unavailable" />
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">بيئة التشغيل</h2>
              <p className="mt-2 text-sm text-white/50">{data.environment}</p>
            </div>
            <Activity className="h-5 w-5 text-afaq-teal" />
          </div>
          <div className="mt-4 text-xs text-white/40" dir="ltr">
            {data.generatedAt}
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">الإصدار المنشور</h2>
              <p className="mt-2 text-sm text-white/50">{data.deployment.commitRef || 'UNKNOWN'}</p>
            </div>
            <GitCommit className="h-5 w-5 text-afaq-teal" />
          </div>
          <div className="mt-4 font-mono text-xs text-white/40">
            {data.deployment.commitSha?.slice(0, 12) || 'UNKNOWN'}
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">التكاملات</h2>
              <p className="mt-2 text-sm text-white/50">قراءة فقط حيث أمكن</p>
            </div>
            <ShieldCheck className="h-5 w-5 text-afaq-teal" />
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-white/60">GA4 Collection</span>
              <StatusBadge ok={data.integrations.ga4Collection} yes="Configured" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-white/60">GA4 Reporting API</span>
              <StatusBadge ok={data.integrations.ga4Reporting} yes="Configured" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-white/60">Search Console API</span>
              <StatusBadge ok={data.integrations.searchConsoleReporting} yes="Configured" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
