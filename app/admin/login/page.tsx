'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, Mail, Terminal } from 'lucide-react';

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  google_missing: 'تسجيل الدخول عبر Google غير مفعّل بعد.',
  google_access_denied: 'تم إلغاء العملية أو رفض الإذن من Google.',
  google_state_mismatch: 'انتهت صلاحية رابط الدخول. اضغط زر Google مرة أخرى.',
  google_token_exchange_failed: 'فشل التحقق مع Google — راجع Client Secret في إعدادات Google Cloud.',
  google_userinfo_failed: 'تعذر جلب بيانات الحساب من Google.',
  google_unverified_email: 'بريد Google هذا غير موثّق.',
  google_unauthorized: 'هذا الحساب غير مصرّح له بدخول اللوحة. استخدم حساب المشرف المعتمد في نافذة Google.',
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [oauthError, setOauthError] = useState('');
  const [localDevEnabled, setLocalDevEnabled] = useState(false);

  // Probe the development-only local login endpoint; the button only appears
  // when the server reports the mode is active (localhost + explicit flag).
  useEffect(() => {
    fetch('/api/admin/dev-login')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setLocalDevEnabled(!!j?.enabled))
      .catch(() => setLocalDevEnabled(false));
  }, []);

  // Surface Google OAuth failures redirected back as ?error=... query params.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('error');
    if (code) {
      setOauthError(OAUTH_ERROR_MESSAGES[code] || 'تعذر تسجيل الدخول عبر Google.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();

      if (res.ok && json.success) {
        router.push('/admin/talents');
      } else {
        setError(json.message || 'بيانات الدخول غير صحيحة.');
      }
    } catch (err) {
      setError('حدث خطأ أثناء الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocalDevLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/dev-login', { method: 'POST' });
      const json = await res.json();

      if (res.ok && json.success) {
        router.push('/admin/talents');
      } else {
        setError(json.message || 'تعذر الدخول المحلي.');
      }
    } catch (err) {
      setError('حدث خطأ أثناء الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">لوحة إدارة أفاق</h1>
          <p className="text-white/60 mt-2">تسجيل دخول المشرفين</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-white/80 mb-2">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pr-10 pl-4 text-white placeholder-white/30 focus:outline-none focus:border-afaq-teal"
                placeholder="admin@example.com"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/80 mb-2">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pr-10 pl-12 text-white placeholder-white/30 focus:outline-none focus:border-afaq-teal"
                placeholder="••••••••"
                dir="ltr"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 text-xs"
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? 'إخفاء' : 'إظهار'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {oauthError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-lg px-4 py-3 text-sm">
              {oauthError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-afaq-teal hover:bg-afaq-blue2 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تسجيل الدخول'}
          </button>
        </form>

        {localDevEnabled && (
          <div className="mt-3">
            <button
              type="button"
              onClick={handleLocalDevLogin}
              disabled={loading}
              className="w-full bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-300 font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Terminal className="w-5 h-5" />
              دخول محلي (تطوير)
            </button>
            <p className="text-white/30 text-xs mt-2 text-center">
              بيئة التطوير المحلية فقط — لا يظهر هذا الزر في الإنتاج
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
