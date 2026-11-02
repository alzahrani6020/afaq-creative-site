'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Database, FileWarning, Loader2, ShieldCheck } from 'lucide-react';

type Report = {
  generatedAt: string;
  mode: 'report_only';
  deletionEnabled: boolean;
  retention: {
    policyConfigured: boolean;
    legalHoldCount: number;
    envKeys: Record<string, string>;
    statusSummary: Record<string, {
      count: number;
      oldestAgeDays: number;
      policyDays: number | null;
      candidates: number;
    }>;
    candidateCount: number;
    candidates: Array<{
      id: string;
      applicationNumber: string;
      status: string;
      ageDays: number;
      policyDays: number;
      attachmentCount: number;
    }>;
  };
  orphanBlobs: {
    prefix: string;
    tokenConfigured: boolean;
    scanned: number;
    scannedBytes: number;
    referencedCount: number;
    orphanCount: number;
    truncated: boolean;
    candidates: Array<{
      pathname: string;
      size: number;
      uploadedAt: string;
      url: string;
      ageDays: number;
    }>;
  };
};

const statusLabels: Record<string, string> = {
  new: 'جديد',
  under_review: 'قيد المراجعة',
  qualified: 'مؤهل',
  need_information: 'يحتاج بيانات',
  contacted: 'تم التواصل',
  accepted: 'مقبول',
  rejected: 'مرفوض',
};

function mb(bytes: number) {
  return (bytes / 1024 / 1024).toFixed(1);
}

export default function DataLifecyclePage() {
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/data-lifecycle', { cache: 'no-store' })
      .then(async (res) => {
        const body = await res.json();
        if (res.status === 401) {
          router.push('/admin/login');
          return null;
        }
        if (!res.ok || !body.success) throw new Error(body.message || 'تعذر تحميل التقرير');
        return body as Report;
      })
      .then((body) => {
        if (body) setReport(body);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'تعذر تحميل التقرير'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-afaq-teal animate-spin" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Database className="w-6 h-6 text-afaq-teal" />
          <h1 className="text-2xl font-bold text-white">دورة حياة البيانات</h1>
        </div>
        <p className="text-white/50 text-sm mt-1">
          تقرير قراءة فقط للاحتفاظ بالمرفقات والملفات غير المرتبطة. لا توجد أي عملية حذف تلقائي في هذه المرحلة.
        </p>
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 flex gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-300 mt-0.5" />
        <div>
          <p className="text-amber-200 font-semibold">وضع التقرير فقط</p>
          <p className="text-amber-200/70 text-sm mt-1">
            الحذف غير مفعّل. مدد الاحتفاظ لا تُفترض تلقائيًا؛ يجب ضبطها صراحةً قبل ظهور أي طلب كمرشح.
          </p>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl p-4">{error}</div>}

      {report && (
        <>
          <section className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-bold text-white">سياسات الاحتفاظ</h2>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-white/50 text-sm">حجز قانوني: {report.retention.legalHoldCount}</span>
                <span className={report.retention.policyConfigured ? 'text-green-400 text-sm' : 'text-amber-300 text-sm'}>
                  {report.retention.policyConfigured ? 'يوجد إعداد مفعّل' : 'لا توجد مدد مفعّلة'}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="text-white/40 border-b border-white/10">
                    <th className="text-right px-3 py-3">الحالة</th>
                    <th className="text-right px-3 py-3">عدد الطلبات</th>
                    <th className="text-right px-3 py-3">أقدم عمر</th>
                    <th className="text-right px-3 py-3">مدة الاحتفاظ</th>
                    <th className="text-right px-3 py-3">المرشحون</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(report.retention.statusSummary).map(([status, item]) => (
                    <tr key={status} className="border-b border-white/5 last:border-0">
                      <td className="px-3 py-3 text-white">{statusLabels[status] || status}</td>
                      <td className="px-3 py-3 text-white/70">{item.count}</td>
                      <td className="px-3 py-3 text-white/70">{item.oldestAgeDays} يوم</td>
                      <td className="px-3 py-3 text-white/70">
                        {item.policyDays === null ? 'غير محددة' : `${item.policyDays} يوم`}
                      </td>
                      <td className="px-3 py-3 text-white/70">{item.candidates}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <p className="text-white/50 text-sm">Blobs المفحوصة</p>
              <p className="text-2xl font-bold text-white mt-2">{report.orphanBlobs.scanned}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <p className="text-white/50 text-sm">الحجم المفحوص</p>
              <p className="text-2xl font-bold text-white mt-2">{mb(report.orphanBlobs.scannedBytes)} MB</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <p className="text-white/50 text-sm">Orphan Blobs المحتملة</p>
              <p className="text-2xl font-bold text-white mt-2">{report.orphanBlobs.orphanCount}</p>
            </div>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileWarning className="w-5 h-5 text-afaq-gold" />
                <h2 className="text-lg font-bold text-white">Orphan Blob Report</h2>
              </div>
              <span className="text-white/40 text-xs" dir="ltr">prefix: {report.orphanBlobs.prefix}</span>
            </div>

            {!report.orphanBlobs.tokenConfigured ? (
              <div className="p-5 text-amber-300 text-sm">
                لا يمكن فحص Blob لأن BLOB_READ_WRITE_TOKEN غير متاح في هذه البيئة.
              </div>
            ) : report.orphanBlobs.orphanCount === 0 ? (
              <div className="p-8 text-center text-white/50">لا توجد ملفات يتيمة ضمن النطاق المفحوص.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-sm">
                  <thead>
                    <tr className="text-white/40 border-b border-white/10">
                      <th className="text-right px-4 py-3">المسار</th>
                      <th className="text-right px-4 py-3">الحجم</th>
                      <th className="text-right px-4 py-3">العمر</th>
                      <th className="text-right px-4 py-3">تاريخ الرفع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.orphanBlobs.candidates.map((item) => (
                      <tr key={item.pathname} className="border-b border-white/5 last:border-0">
                        <td className="px-4 py-3 text-white/80 max-w-[460px] truncate" dir="ltr">{item.pathname}</td>
                        <td className="px-4 py-3 text-white/60">{mb(item.size)} MB</td>
                        <td className="px-4 py-3 text-white/60">{item.ageDays} يوم</td>
                        <td className="px-4 py-3 text-white/60" dir="ltr">{new Date(item.uploadedAt).toLocaleString('ar-SA')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {report.orphanBlobs.truncated && (
              <div className="p-4 border-t border-white/10 flex items-center gap-2 text-amber-300 text-sm">
                <AlertTriangle className="w-4 h-4" />
                تم إيقاف الجرد عند 5000 ملف لحماية زمن التنفيذ. التقرير جزئي.
              </div>
            )}
          </section>

          <p className="text-white/30 text-xs" dir="ltr">
            Last refresh: {new Date(report.generatedAt).toLocaleString('ar-SA')}
          </p>
        </>
      )}
    </div>
  );
}
