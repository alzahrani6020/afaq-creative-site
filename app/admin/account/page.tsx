'use client';

import { useState } from 'react';
import { Loader2, Lock, CheckCircle } from 'lucide-react';

export default function AdminAccountPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('كلمتا المرور الجديدتين غير متطابقتين.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('يجب أن تكون كلمة المرور الجديدة 8 أحرف على الأقل.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/account/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const json = await res.json();

      if (res.ok && json.success) {
        setMessage(json.message);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(json.message || 'تعذر تغيير كلمة المرور.');
      }
    } catch (err) {
      setError('حدث خطأ أثناء الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">حسابي</h1>
      <p className="text-white/50 text-sm mb-8">تغيير كلمة مرور الدخول إلى لوحة الإدارة</p>

      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-afaq-teal/20 flex items-center justify-center">
            <Lock className="w-5 h-5 text-afaq-teal" />
          </div>
          <h2 className="text-lg font-bold text-white">تغيير كلمة المرور</h2>
        </div>

        {message && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-300 rounded-lg px-4 py-3 mb-6 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-lg px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-white/80 mb-2">كلمة المرور الحالية</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-white/30 focus:outline-none focus:border-afaq-teal"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm text-white/80 mb-2">كلمة المرور الجديدة</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-white/30 focus:outline-none focus:border-afaq-teal"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm text-white/80 mb-2">تأكيد كلمة المرور الجديدة</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-white/30 focus:outline-none focus:border-afaq-teal"
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-afaq-teal hover:bg-afaq-blue2 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تغيير كلمة المرور'}
          </button>
        </form>
      </div>
    </div>
  );
}
