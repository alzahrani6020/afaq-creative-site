'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Lang, getTranslation } from '@/lib/i18n';

type I18nContextType = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: ReturnType<typeof getTranslation>;
};

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ar');

  useEffect(() => {
    const saved = localStorage.getItem('afaq-lang') as Lang;
    if (saved && (saved === 'ar' || saved === 'en')) {
      setLangState(saved);
      document.documentElement.lang = saved;
      document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr';
    }
  }, []);

  const setLang = (next: Lang) => {
    setLangState(next);
    localStorage.setItem('afaq-lang', next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
  };

  const t = getTranslation(lang);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
