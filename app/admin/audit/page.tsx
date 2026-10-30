'use client';

import { useEffect, useState } from 'react';
import { FileClock, Loader2 } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  metadata: string | null;
  createdAt: string;
  adminUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/audit?limit=50', { cache: 'no-store' })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || 'تعذر التحميل');
        setLogs(json.logs);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'تعذر التحميل'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-afaq-teal" />
      </div>
    );
  }

  if (error) {
    return <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">سجل التدقيق</h1>
        <p className="mt-1 text-sm text-white/50">آخر 50 نشاطًا إداريًا مسجلًا في قاعدة البيانات.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
        {logs.length === 0 ? (
          <div className="p-10 text-center text-white/40">لا توجد أنشطة مسجلة.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {logs.map((log) => (
              <div key={log.id} className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <FileClock className="mt-0.5 h-4 w-4 text-afaq-teal" />
                  <div>
                    <div className="font-medium text-white">{log.action}</div>
                    <div className="mt-1 text-xs text-white/40">
                      {log.adminUser.name} · {log.adminUser.email} · {log.adminUser.role}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-white/40" dir="ltr">
                  {new Date(log.createdAt).toLocaleString('ar-SA')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
