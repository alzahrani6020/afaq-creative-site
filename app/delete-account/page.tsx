'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, AlertTriangle, CheckCircle, Send } from 'lucide-react';

export default function DeleteAccountPage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', reason: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `طلب حذف بيانات / حساب%0Aالاسم: ${form.name}%0الجوال: ${form.phone}%0Aالبريد: ${form.email}%0Aالسبب: ${form.reason}`;
    window.open(`https://wa.me/966567566616?text=${text}`, '_blank');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <main className="bg-afaq-bg min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 font-bold text-sm border border-red-500/20 mb-4">
            <Trash2 size={14} className="inline-block ml-1" />
            حذف البيانات
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white">
            طلب <span className="text-red-400">حذف البيانات</span>
          </h1>
          <p className="mt-4 text-white/40">
            يمكنك طلب حذف بياناتك الشخصية من أنظمتنا في أي وقت
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl bg-yellow-500/5 border border-yellow-500/20 mb-8"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-white font-bold text-sm mb-1">تنبيه مهم</h3>
              <p className="text-white/40 text-sm">
                حذف البيانات يشمل: معلومات الاتصال، سجل الطلبات، والملفات المرتبطة بحسابك.
                قد يستغرق المعالجة حتى ٣٠ يوماً عمل وفقاً للأنظمة السعودية والمصرية.
              </p>
            </div>
          </div>
        </motion.div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 rounded-3xl bg-green-500/5 border border-green-500/20 text-center"
          >
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">تم إرسال طلبك</h2>
            <p className="text-white/40">سنتواصل معك خلال ٢٤-٤٨ ساعة لتأكيد الحذف</p>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="grid md:grid-cols-2 gap-4">
              <input
                required
                type="text"
                placeholder="الاسم الكامل"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-afaq-gold/50"
              />
              <input
                required
                type="tel"
                placeholder="رقم الجوال"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-afaq-gold/50"
              />
            </div>
            <input
              type="email"
              placeholder="البريد الإلكتروني (إن وجد)"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-afaq-gold/50"
            />
            <textarea
              rows={4}
              placeholder="سبب الحذف (اختياري)..."
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-afaq-gold/50 resize-none"
            />
            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold hover:shadow-lg hover:shadow-red-500/30 transition-all flex items-center justify-center gap-2"
            >
              <Send size={18} />
              إرسال طلب الحذف عبر الواتساب
            </button>
          </motion.form>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center text-white/20 text-sm"
        >
          إذا واجهت أي صعوبة، تواصل مباشرة عبر الواتساب: +966 56 756 6616
        </motion.p>
      </div>
    </main>
  );
}
