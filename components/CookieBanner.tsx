'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';
import { grantAnalyticsConsent } from '@/lib/analytics';

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('afaq-cookies');
    if (!accepted) setShow(true);
  }, []);

  const accept = () => {
    localStorage.setItem('afaq-cookies', 'true');
    grantAnalyticsConsent();
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4"
        >
          <div className="max-w-3xl mx-auto bg-afaq-bg/95 backdrop-blur-xl border border-afaq-gold/20 rounded-2xl p-4 shadow-2xl flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl bg-afaq-gold/10 flex items-center justify-center flex-shrink-0">
                <Cookie size={20} className="text-afaq-gold" />
              </div>
              <p className="text-white/60 text-xs leading-relaxed">
                نستخدم ملفات تعريف الارتباط لتحسين تجربتك. بالاستمرار في تصفح الموقع، فإنك توافق على
                <a href="/privacy" className="text-afaq-gold hover:underline mx-1">سياسة الخصوصية</a>.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={accept} className="px-4 py-2 rounded-lg bg-afaq-gold text-afaq-bg font-bold text-xs hover:shadow-lg transition-all">
                أوافق
              </button>
              <button onClick={accept} className="p-2 rounded-lg border border-white/10 text-white/40 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
