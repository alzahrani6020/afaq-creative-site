'use client';

import { Globe } from 'lucide-react';
import { useI18n } from './I18nProvider';

export function LanguageToggle() {
  const { lang, setLang } = useI18n();

  const toggle = () => {
    setLang(lang === 'ar' ? 'en' : 'ar');
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-white/60 hover:text-afaq-gold hover:border-afaq-gold/30 transition-all text-sm"
      aria-label="تبديل اللغة"
    >
      <Globe size={14} />
      {lang === 'ar' ? 'EN' : 'عربي'}
    </button>
  );
}
