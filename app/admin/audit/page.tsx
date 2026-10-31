'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileClock, Loader2, ShieldCheck } from 'lucide-react';

type AuditEvent = {
  id: string;
  type: 'admin' | 'talent';
  action: string;
  subject: string | null;
  metadata: string | null;
  admin: { name: string; email: string } | null;
  createdAt: string;
};

export default function AdminAuditPage() {
  const router = useRouter();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [generatedAt, setGeneratedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/audit', { cache: 'no-store' })
      .then(async (res) => {
        const body = await res.json();
        if (res.status === 401) {
          router.push('/admin/login');
          return null;
        }
        if (!res.ok || !body.success) throw new Error(body.message || 'تعذر تحميل سجل التدقيق');
        return body;
      })
      .then((body) => {
        if (!body) return;
        setEvents(body.events || []);
        setGeneratedAt(body.generatedAt || '');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'تعذر تحميل سجل التدقيق'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-afaq-teal animate-spin" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-afaq-teal" />
          <h1 className="text-2xl font-bold text-white">سجل التدقيق</h1>
        </div>
        <p className="text-white/50 text-sm mt-1">سجل موحد للتغييرات على طلبات المواهب والعمليات الإدارية المسجلة.</p>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl p-4">{error}</div>}

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-sm">
            <thead>
              <tr className="text-white/40 border-b border-white/10">
                <th className="text-right px-4 py-3">الوقت</th>
                <th className="text-right px-4 py-3">النوع</th>
                <th className="text-right px-4 py-3">الإجراء</th>
                <th className="text-right px-4 py-3">المرجع</th>
                <th className="text-right px-4 py-3">المشرف</th>
              </tr>
            </thead>
            <tbody>
              {events.length ? events.map((event) => (
                <tr key={event.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 text-white/50" dir="ltr">{new Date(event.createdAt).toLocaleString('ar-SA')}</td>
                  <td className="px-4 py-3 text-white/70">{event.type === 'talent' ? 'طلب موهبة' : 'إدارة'}</td>
                  <td className="px-4 py-3 text-white">{event.action}</td>
                  <td className="px-4 py-3 text-white/70" dir="ltr">{event.subject || '—'}</td>
                  <td className="px-4 py-3">
                    <p className="text-white/80">{event.admin?.name || 'النظام'}</p>
                    <p className="text-white/30 text-xs" dir="ltr">{event.admin?.email || ''}</p>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-white/40">
                    <FileClock className="w-7 h-7 mx-auto mb-2" />
                    لا توجد أحداث مسجلة بعد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {generatedAt && <p className="text-white/30 text-xs" dir="ltr">Last refresh: {new Date(generatedAt).toLocaleString('ar-SA')}</p>}
    </div>
  );
}
