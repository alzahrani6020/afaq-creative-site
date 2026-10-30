'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send } from 'lucide-react';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // Send via WhatsApp
    const text = `طلب اشتراك في النشرة البريدية:%0A${email}`;
    window.open(`https://wa.me/966567566616?text=${text}`, '_blank');
    setSubmitted(true);
    setEmail('');
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="p-6 rounded-2xl bg-gradient-to-br from-afaq-blue/10 to-afaq-gold/10 border border-afaq-gold/20"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-afaq-gold/10 flex items-center justify-center">
          <Mail size={18} className="text-afaq-gold" />
        </div>
        <div>
          <h4 className="text-white font-bold text-sm">النشرة البريدية</h4>
          <p className="text-white/30 text-xs">احصل على آخر أخبارنا وعروضنا</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          required
          placeholder="بريدك الإلكتروني"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-afaq-gold/50"
        />
        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-afaq-gold text-afaq-bg font-bold text-sm hover:shadow-lg transition-all flex items-center gap-1"
        >
          <Send size={14} />
          {submitted ? 'تم!' : 'اشتراك'}
        </button>
      </form>
    </motion.div>
  );
}
