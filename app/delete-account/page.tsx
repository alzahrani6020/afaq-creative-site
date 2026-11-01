'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, AlertTriangle, CheckCircle, Send } from 'lucide-react';
import Link from 'next/link';

export default function DeleteAccountPage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', reason: '' });
  const [opened, setOpened] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = [
      'طلب ممارسة حق / حذف بيانات',
      `الاسم: ${form.name}`,
      `الجوال: ${form.phone}`,
      `البريد: ${form.email || 'غير مذكور'}`,
      `تفاصيل الطلب: ${form.reason || 'طلب حذف البيانات الشخصية'}`,
    ].join('\n');

    window.open(`https://wa.me/966567566616?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    setOpened(true);
  };

  return (
    <main className="bg-afaq-bg min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-32">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 font-bold text-sm border border-red-500/20 mb-4">
            <Trash2 size={14} className="inline-block ml-1" />
            حقوق البيانات
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white">
            طلب <span className="text-red-400">حذف أو ممارسة حق</span>
          </h1>
          <p className="mt-4 text-white/40">
            يمكنك طلب الوصول أو نسخة من بياناتك أو تصحيحها أو تحديثها أو حذفها، أو العدول عن موافقة سابقة عندما ينطبق ذلك.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-6 rounded-2xl bg-yellow-500/5 border border-yellow-500/20 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-white font-bold text-sm mb-1">قبل إرسال الطلب</h3>
              <p className="text-white/45 text-sm leading-relaxed">
                سنحتاج إلى التحقق من هويتك قبل تنفيذ الطلب. بالنسبة للطلبات الخاضعة للائحة السعودية، تتم معالجة طلبات ممارسة الحقوق دون تأخير وبحد لا يتجاوز 30 يومًا، ويمكن تمديد المدة بما لا يتجاوز 30 يومًا إضافية في الحالات المسموح بها مع إشعارك بالمبرر. قد توجد استثناءات نظامية تمنع حذف بعض السجلات فورًا.
              </p>
            </div>
          </div>
        </motion.div>

        {opened && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-5 rounded-2xl bg-green-500/5 border border-green-500/20 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle size={22} className="text-green-500 mt-0.5" />
              <div>
                <h2 className="font-bold text-white">تم فتح واتساب لإكمال الطلب</h2>
                <p className="text-white/45 text-sm mt-1">لا نعتبر الطلب مستلمًا إلا بعد إرسال الرسالة فعليًا في واتساب.</p>
              </div>
            </div>
          </motion.div>
        )}

        <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <input required type="text" placeholder="الاسم الكامل" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-afaq-gold/50" />
            <input required type="tel" placeholder="رقم الجوال" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-afaq-gold/50" />
          </div>
          <input type="email" placeholder="البريد الإلكتروني (إن وجد)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-afaq-gold/50" />
          <textarea rows={4} placeholder="اذكر طلبك: حذف، وصول، نسخة، تصحيح، تحديث، عدول عن موافقة..." value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-afaq-gold/50 resize-none" />
          <button type="submit" className="w-full py-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold hover:shadow-lg hover:shadow-red-500/30 transition-all flex items-center justify-center gap-2">
            <Send size={18} />
            فتح واتساب لإرسال الطلب
          </button>
        </motion.form>

        <div className="mt-8 text-center text-sm text-white/30 space-y-2">
          <p>يمكنك أيضًا التواصل عبر البريد: <a href="mailto:info@bonds-global.com" className="text-afaq-gold hover:underline">info@bonds-global.com</a></p>
          <p><Link href="/privacy" className="text-afaq-gold hover:underline">راجع سياسة الخصوصية</Link></p>
        </div>
      </div>
    </main>
  );
}
