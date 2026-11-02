'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { UploadCloud, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

function ApplicantUploadPageContent() {
  const search = useSearchParams();
  const applicationNumber = search.get('application') || '';
  const token = search.get('token') || '';
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [name, setName] = useState('');
  const [current, setCurrent] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const query = useMemo(() => new URLSearchParams({ applicationNumber, token }).toString(), [applicationNumber, token]);

  useEffect(() => {
    if (!applicationNumber || !token) {
      setLoading(false);
      return;
    }
    fetch(`/api/talents/upload-documents?${query}`)
      .then(async (res) => ({ ok: res.ok, json: await res.json() }))
      .then(({ ok, json }) => {
        setValid(ok && json.success);
        setName(json.name || '');
        setCurrent(json.current || null);
        if (!ok) setMessage(json.message || 'الرابط غير صالح أو منتهي الصلاحية.');
      })
      .catch(() => setMessage('تعذر التحقق من الرابط.'))
      .finally(() => setLoading(false));
  }, [applicationNumber, token, query]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    const data = new FormData(event.currentTarget);
    data.append('applicationNumber', applicationNumber);
    data.append('token', token);
    try {
      const res = await fetch('/api/talents/upload-documents', { method: 'POST', body: data });
      const json = await res.json();
      setMessage(json.message || (res.ok ? 'تم الحفظ.' : 'تعذر الحفظ.'));
      if (res.ok) {
        const verify = await fetch(`/api/talents/upload-documents?${query}`);
        const verifyJson = await verify.json();
        if (verify.ok) setCurrent(verifyJson.current);
        event.currentTarget.reset();
      }
    } catch {
      setMessage('حدث خطأ أثناء الرفع. حاول مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <main className="min-h-screen bg-afaq-bg flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-afaq-gold" /></main>;
  }

  if (!valid) {
    return (
      <main className="min-h-screen bg-afaq-bg flex items-center justify-center px-6">
        <div className="max-w-lg w-full bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-3">تعذر فتح رابط الاستكمال</h1>
          <p className="text-white/60">{message || 'الرابط غير صالح أو منتهي الصلاحية.'}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-afaq-bg px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <UploadCloud className="w-8 h-8 text-afaq-gold" />
            <div>
              <h1 className="text-2xl font-bold text-white">استكمال الملف ورفع المرفقات</h1>
              <p className="text-white/50 text-sm mt-1">{name ? `مرحبًا ${name} — ` : ''}رقم الطلب: <span dir="ltr">{applicationNumber}</span></p>
            </div>
          </div>

          {current && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
              {[
                ['السيرة', current.cv ? 'مرفوعة' : 'غير مرفوعة'],
                ['الصورة', current.profile_photo ? 'مرفوعة' : 'غير مرفوعة'],
                ['الفيديو', current.work_video ? 'مرفوع' : 'غير مرفوع'],
                ['صور الأعمال', String(current.work_photos || 0)],
                ['الوثائق', String(current.documents || 0)],
              ].map(([label, value]) => (
                <div key={label} className="bg-black/20 border border-white/10 rounded-xl p-3">
                  <div className="text-white/40 text-xs">{label}</div>
                  <div className="text-white text-sm mt-1">{value}</div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={submit} className="space-y-5">
            <FileField name="cv" label="السيرة الذاتية" accept=".pdf,.doc,.docx" />
            <FileField name="documents" label="المؤهلات والشهادات والوثائق" accept=".pdf,.doc,.docx,image/jpeg,image/png,image/webp" multiple />
            <FileField name="profile_photo" label="الصورة الشخصية" accept="image/jpeg,image/png,image/webp" />
            <FileField name="work_photos" label="صور الأعمال" accept="image/jpeg,image/png,image/webp" multiple />
            <FileField name="work_video" label="فيديو الأعمال" accept="video/mp4,video/webm,video/quicktime,.mov" />

            <p className="text-white/40 text-xs leading-relaxed">الحد الأقصى لكل ملف 10 ميجابايت. الصيغ المسموحة تُفحص فعليًا قبل الحفظ.</p>

            {message && (
              <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                {message.includes('بنجاح') ? <CheckCircle className="w-5 h-5 text-green-400 shrink-0" /> : <AlertCircle className="w-5 h-5 text-amber-300 shrink-0" />}
                <span>{message}</span>
              </div>
            )}

            <button type="submit" disabled={submitting} className="w-full rounded-xl bg-afaq-gold text-black font-bold py-3 disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
              حفظ المرفقات
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function FileField({ name, label, accept, multiple = false }: { name: string; label: string; accept: string; multiple?: boolean }) {
  return (
    <label className="block">
      <span className="block text-white/70 text-sm mb-2">{label}</span>
      <input type="file" name={name} accept={accept} multiple={multiple} className="block w-full text-sm text-white/60 file:ml-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-white hover:file:bg-white/15" />
    </label>
  );
}


export default function ApplicantUploadPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-afaq-bg flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-afaq-gold" /></main>}>
      <ApplicantUploadPageContent />
    </Suspense>
  );
}
