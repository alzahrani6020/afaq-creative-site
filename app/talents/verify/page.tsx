'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Loader2, ShieldCheck } from 'lucide-react';

export default function VerifyApplicantEmailPage() {
  const router = useRouter();
  const [applicationNumber, setApplicationNumber] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/talents/verify-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationNumber, email, code }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'تعذر التحقق من البريد.');
      setMessage('تم تأكيد البريد الإلكتروني بنجاح.');
      if (json.uploadUrl) {
        window.location.assign(json.uploadUrl);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر التحقق من البريد.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-afaq-bg flex items-center justify-center px-6 py-12" dir="rtl">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="w-8 h-8 text-afaq-gold" />
          <div>
            <h1 className="text-2xl font-bold text-white">تأكيد البريد الإلكتروني</h1>
            <p className="text-white/50 text-sm mt-1">استخدم الرمز المكوّن من 6 أرقام الموجود في رسالة آفاق.</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-white/70 text-sm mb-2">رقم الطلب</label>
            <input
              value={applicationNumber}
              onChange={(e) => setApplicationNumber(e.target.value)}
              dir="ltr"
              autoComplete="off"
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-afaq-teal"
              placeholder="AFQ-2026-..."
            />
          </div>
          <div>
            <label className="block text-white/70 text-sm mb-2">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-afaq-teal"
            />
          </div>
          <div>
            <label className="block text-white/70 text-sm mb-2">رمز التحقق</label>
            <input
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              dir="ltr"
              autoComplete="one-time-code"
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-2xl tracking-[0.4em] text-white outline-none focus:border-afaq-teal"
              placeholder="000000"
            />
          </div>

          {message && (
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/80">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-afaq-gold py-3 font-bold text-black disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            {loading ? 'جارٍ التحقق...' : 'تأكيد البريد والمتابعة'}
          </button>
        </form>
      </div>
    </main>
  );
}
