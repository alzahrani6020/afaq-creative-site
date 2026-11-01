'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { publicWhatsAppHref } from '@/lib/whatsapp-public';
import { trackEvent } from '@/lib/analytics';
import { siteServices } from '@/lib/site-services';

interface ContactFormProps {
  initialService?: string;
}

export function ContactForm({ initialService = '' }: ContactFormProps) {
  const serviceNames = siteServices.map((service) => service.title);
  const normalizedInitialService = serviceNames.includes(initialService) ? initialService : '';

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    service: normalizedInitialService,
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackEvent('whatsapp_lead', { service: form.service || undefined });
    const text = `مرحباً، أنا ${form.name}\nالجوال: ${form.phone}\nالبريد: ${form.email}\nالخدمة: ${form.service}\nالرسالة: ${form.message}`;
    window.open(publicWhatsAppHref(text), '_blank');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section id="contact" className="py-24 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-afaq-gold/10 rounded-full blur-[150px]" />
      <div className="max-w-7xl mx-auto px-6 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-afaq-blue/10 text-afaq-blue font-bold text-sm tracking-wider border border-afaq-blue/20 mb-4">
            تواصل معنا
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white">
            ابدأ مشروعك <span className="text-afaq-gold">الآن</span>
          </h2>
          <p className="mt-4 text-white/40 max-w-xl mx-auto">
            احجز استشارة مجانية عبر الواتساب أو املأ النموذج وسنتواصل معك خلال 24 ساعة
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-10">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-6">
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-afaq-gold/10 flex items-center justify-center">
                  <Phone size={18} className="text-afaq-gold" />
                </div>
                <div>
                  <div className="text-white/40 text-xs">الجوال</div>
                  <div className="text-white font-semibold">+966 56 756 6616</div>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-afaq-gold/10 flex items-center justify-center">
                  <Mail size={18} className="text-afaq-gold" />
                </div>
                <div>
                  <div className="text-white/40 text-xs">البريد</div>
                  <div className="text-white font-semibold">info@bonds-global.com</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-afaq-gold/10 flex items-center justify-center">
                  <MapPin size={18} className="text-afaq-gold" />
                </div>
                <div>
                  <div className="text-white/40 text-xs">العناوين</div>
                  <div className="text-white font-semibold text-sm">جدة، السعودية | ٦ أكتوبر، مصر</div>
                </div>
              </div>
            </div>

            <a href={publicWhatsAppHref()} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-gradient-to-r from-afaq-blue to-afaq-teal text-white font-bold hover:shadow-lg hover:shadow-afaq-blue/30 transition-all">
              <MessageCircle size={20} />
              تواصل عبر الواتساب
            </a>
          </motion.div>

          <motion.form initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} onSubmit={handleSubmit}
            className="p-8 rounded-3xl bg-white/[0.03] border border-white/[0.06] space-y-4">
            <input required type="text" placeholder="الاسم الكامل" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-afaq-gold/50" />
            <div className="grid grid-cols-2 gap-4">
              <input required type="tel" placeholder="رقم الجوال" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-afaq-gold/50" />
              <input type="email" placeholder="البريد الإلكتروني" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-afaq-gold/50" />
            </div>
            <label className="sr-only" htmlFor="service-select">اختر الخدمة</label>
            <select id="service-select" required value={form.service} onChange={e => setForm({...form, service: e.target.value})}
              className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-afaq-gold/50 appearance-none">
              <option value="" className="bg-afaq-bg">اختر الخدمة</option>
              {serviceNames.map((serviceName) => (
                <option key={serviceName} value={serviceName} className="bg-afaq-bg">{serviceName}</option>
              ))}
              <option value="أخرى" className="bg-afaq-bg">أخرى</option>
            </select>
            <textarea rows={4} placeholder="تفاصيل المشروع..." value={form.message} onChange={e => setForm({...form, message: e.target.value})}
              className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-afaq-gold/50 resize-none" />
            <button type="submit" className="w-full py-4 rounded-xl bg-gradient-to-r from-afaq-gold to-afaq-gold2 text-afaq-bg font-bold hover:shadow-lg hover:shadow-afaq-gold/30 transition-all flex items-center justify-center gap-2">
              <Send size={18} />
              {submitted ? 'تم الإرسال!' : 'أرسل عبر الواتساب'}
            </button>
          </motion.form>
        </div>
      </div>
    </section>
  );
}
