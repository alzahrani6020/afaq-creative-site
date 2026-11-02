'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { upload } from '@vercel/blob/client';
import { UploadCloud, CheckCircle, AlertCircle, Loader2, Trash2 } from 'lucide-react';

type CurrentFile = {
  field: string;
  index?: number;
  name: string;
  size: number;
  uploadedAt?: string | null;
};

type ChecklistItem = {
  key: string;
  label: string;
  complete: boolean;
};

type CurrentState = {
  profile_photo: CurrentFile | null;
  cv: CurrentFile | null;
  work_video: CurrentFile | null;
  work_photos: CurrentFile[];
  documents: CurrentFile[];
  checklist: {
    status: 'complete' | 'incomplete';
    submitted?: boolean;
    submittedAt?: string | null;
    required: ChecklistItem[];
    recommended: ChecklistItem[];
  };
};

const limits: Record<string, number> = {
  profile_photo: 10 * 1024 * 1024,
  work_photos: 15 * 1024 * 1024,
  work_video: 250 * 1024 * 1024,
  cv: 25 * 1024 * 1024,
  documents: 25 * 1024 * 1024,
};

function ApplicantUploadPageContent() {
  const search = useSearchParams();
  const applicationNumber = search.get('application') || '';
  const token = search.get('token') || '';
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [name, setName] = useState('');
  const [current, setCurrent] = useState<CurrentState | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [submittingProfile, setSubmittingProfile] = useState(false);

  const query = useMemo(
    () => new URLSearchParams({ applicationNumber }).toString(),
    [applicationNumber]
  );

  const refresh = async () => {
    const res = await fetch(`/api/talents/upload-documents?${query}`, { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'تعذر قراءة الملف.');
    setCurrent(json.current || null);
    setName(json.name || '');
    setValid(true);
  };

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      if (!applicationNumber) {
        throw new Error('رابط الاستكمال غير مكتمل.');
      }

      if (token) {
        const exchange = await fetch('/api/talents/upload-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicationNumber, token }),
        });
        const exchangeJson = await exchange.json();
        if (!exchange.ok || !exchangeJson.success) {
          throw new Error(exchangeJson.message || 'تعذر فتح جلسة الاستكمال.');
        }

        const cleanUrl = `/talents/upload?application=${encodeURIComponent(applicationNumber)}`;
        window.history.replaceState({}, '', cleanUrl);
      }

      await refresh();
    };

    initialize()
      .catch((error) => {
        if (cancelled) return;
        setValid(false);
        setMessage(error instanceof Error ? error.message : 'تعذر التحقق من الرابط.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applicationNumber, token, query]);

  const uploadOne = async (field: string, file: File) => {
    const maxBytes = limits[field] || 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new Error(
        `${file.name}: الحجم أكبر من الحد المسموح (${Math.round(maxBytes / 1024 / 1024)} MB).`
      );
    }

    const pathname = `talents/${applicationNumber}/${field}/${file.name}`;
    await upload(pathname, file, {
      access: 'public',
      handleUploadUrl: '/api/talents/upload-documents',
      multipart: file.size > 5 * 1024 * 1024,
      clientPayload: JSON.stringify({
        applicationNumber,
        field,
        originalName: file.name,
        size: file.size,
      }),
      onUploadProgress: ({ percentage }) => {
        setProgress((prev) => ({ ...prev, [`${field}:${file.name}`]: Math.round(percentage) }));
      },
    });
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    setProgress({});

    const data = new FormData(event.currentTarget);
    const queue: Array<{ field: string; file: File }> = [];

    for (const field of ['cv', 'documents', 'profile_photo', 'work_photos', 'work_video']) {
      const values = data.getAll(field);
      for (const value of values) {
        if (value instanceof File && value.size > 0) queue.push({ field, file: value });
      }
    }

    if (queue.length === 0) {
      setMessage('اختر ملفًا واحدًا على الأقل قبل الحفظ.');
      setSubmitting(false);
      return;
    }

    try {
      for (const item of queue) {
        await uploadOne(item.field, item.file);
      }
      await refresh();
      event.currentTarget.reset();
      setMessage('تم رفع المرفقات وحفظها بنجاح.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'حدث خطأ أثناء الرفع.');
      try {
        await refresh();
      } catch {}
    } finally {
      setSubmitting(false);
    }
  };

  const removeFile = async (field: string, index?: number) => {
    if (!confirm('هل تريد حذف هذا الملف؟')) return;
    setMessage('');

    const params = new URLSearchParams({
      applicationNumber,
      field,
    });
    if (typeof index === 'number') params.set('index', String(index));

    try {
      const res = await fetch(`/api/talents/upload-documents?${params.toString()}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'تعذر حذف الملف.');
      setCurrent(json.current || null);
      setMessage('تم حذف الملف.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر حذف الملف.');
    }
  };

  const submitProfile = async () => {
    if (!current?.checklist || current.checklist.status !== 'complete') {
      setMessage('استكمل المتطلبات الأساسية قبل إرسال الملف للمراجعة.');
      return;
    }
    setSubmittingProfile(true);
    setMessage('');
    try {
      const res = await fetch(`/api/talents/upload-documents?${query}`, { method: 'PATCH' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'تعذر إرسال الملف للمراجعة.');
      setCurrent(json.current || current);
      setMessage(json.message || 'تم إرسال الملف للمراجعة.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر إرسال الملف للمراجعة.');
    } finally {
      setSubmittingProfile(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-afaq-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-afaq-gold" />
      </main>
    );
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

  const fileRows: Array<{ label: string; file: CurrentFile | null; field: string }> = [
    { label: 'السيرة الذاتية', file: current?.cv || null, field: 'cv' },
    { label: 'الصورة الشخصية', file: current?.profile_photo || null, field: 'profile_photo' },
    { label: 'فيديو الأعمال', file: current?.work_video || null, field: 'work_video' },
  ];

  return (
    <main className="min-h-screen bg-afaq-bg px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <UploadCloud className="w-8 h-8 text-afaq-gold" />
            <div>
              <h1 className="text-2xl font-bold text-white">استكمال الملف ورفع المرفقات</h1>
              <p className="text-white/50 text-sm mt-1">
                {name ? `مرحبًا ${name} — ` : ''}رقم الطلب: <span dir="ltr">{applicationNumber}</span>
              </p>
            </div>
          </div>

          {current?.checklist && (
            <div className="mb-6 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-white font-semibold">اكتمال الملف</h2>
                <span className={current.checklist.status === 'complete' ? 'text-green-400 text-sm' : 'text-amber-300 text-sm'}>
                  {current.checklist.status === 'complete' ? 'مكتمل' : 'غير مكتمل'}
                </span>
              </div>
              <div className="space-y-2">
                {current.checklist.required.map((item) => (
                  <div key={item.key} className="flex items-center gap-2 text-sm">
                    <CheckCircle className={`w-4 h-4 ${item.complete ? 'text-green-400' : 'text-white/20'}`} />
                    <span className={item.complete ? 'text-white/80' : 'text-white/50'}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3 mb-6">
            {fileRows.map(({ label, file, field }) =>
              file ? (
                <ExistingFile
                  key={field}
                  label={label}
                  file={file}
                  onDelete={() => removeFile(field)}
                />
              ) : null
            )}
            {current?.documents?.map((file, index) => (
              <ExistingFile
                key={`document-${index}`}
                label="وثيقة"
                file={file}
                onDelete={() => removeFile('documents', index)}
              />
            ))}
            {current?.work_photos?.map((file, index) => (
              <ExistingFile
                key={`photo-${index}`}
                label="صورة أعمال"
                file={file}
                onDelete={() => removeFile('work_photos', index)}
              />
            ))}
          </div>

          {current?.checklist?.submitted ? (
            <div className="mb-6 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-green-200 text-sm">
              تم إرسال الملف للمراجعة، وتم تجميد التعديلات. إذا طلبت الإدارة بيانات إضافية فسيتم إعادة فتح الملف.
            </div>
          ) : null}

          <form onSubmit={submit} className="space-y-5">
            <FileField name="cv" label="السيرة الذاتية" accept=".pdf,.doc,.docx" />
            <FileField
              name="documents"
              label="المؤهلات والشهادات والوثائق"
              accept=".pdf,.doc,.docx,image/jpeg,image/png,image/webp"
              multiple
            />
            <FileField name="profile_photo" label="الصورة الشخصية" accept="image/jpeg,image/png,image/webp" />
            <FileField name="work_photos" label="صور الأعمال" accept="image/jpeg,image/png,image/webp" multiple />
            <FileField
              name="work_video"
              label="فيديو الأعمال"
              accept="video/mp4,video/webm,video/quicktime,.mov"
            />

            <div className="text-white/40 text-xs leading-relaxed space-y-1">
              <p>السيرة والوثائق: حتى 25 MB للملف. الصور: حتى 10–15 MB. الفيديو: حتى 250 MB.</p>
              <p>الفيديو يدعم MP4 وWebM وMOV. الملفات الكبيرة تُرفع مباشرة إلى التخزين على أجزاء مع إعادة محاولة تلقائية.</p>
            </div>

            {Object.entries(progress).length > 0 && (
              <div className="space-y-2">
                {Object.entries(progress).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs text-white/50 mb-1">
                      <span className="truncate">{key.split(':').slice(1).join(':')}</span>
                      <span>{value}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-afaq-gold transition-all" style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {message && (
              <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                {message.includes('بنجاح') || message.includes('تم حذف') ? (
                  <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-300 shrink-0" />
                )}
                <span>{message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || Boolean(current?.checklist?.submitted)}
              className="w-full rounded-xl bg-afaq-gold text-black font-bold py-3 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
              {submitting ? 'جارٍ رفع الملفات...' : 'حفظ المرفقات'}
            </button>
          </form>

          <button
            type="button"
            onClick={submitProfile}
            disabled={
              submittingProfile ||
              current?.checklist?.status !== 'complete' ||
              Boolean(current?.checklist?.submitted)
            }
            className="mt-4 w-full rounded-xl border border-afaq-teal/40 bg-afaq-teal/10 py-3 font-bold text-afaq-teal disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {submittingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            {current?.checklist?.submitted ? 'تم إرسال الملف للمراجعة' : 'إرسال الملف النهائي للمراجعة'}
          </button>
        </div>
      </div>
    </main>
  );
}

function ExistingFile({
  label,
  file,
  onDelete,
}: {
  label: string;
  file: CurrentFile;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="min-w-0">
        <p className="text-white/50 text-xs">{label}</p>
        <p className="text-white text-sm truncate">{file.name}</p>
        {file.size > 0 && (
          <p className="text-white/30 text-xs mt-1">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
        )}
      </div>
      <button
        type="button"
        onClick={onDelete}
        className="shrink-0 rounded-lg border border-red-500/20 p-2 text-red-400 hover:bg-red-500/10"
        aria-label={`حذف ${label}`}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function FileField({
  name,
  label,
  accept,
  multiple = false,
}: {
  name: string;
  label: string;
  accept: string;
  multiple?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-white/70 text-sm mb-2">{label}</span>
      <input
        type="file"
        name={name}
        accept={accept}
        multiple={multiple}
        className="block w-full text-sm text-white/60 file:ml-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-white hover:file:bg-white/15"
      />
    </label>
  );
}

export default function ApplicantUploadPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-afaq-bg flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-afaq-gold" />
        </main>
      }
    >
      <ApplicantUploadPageContent />
    </Suspense>
  );
}
