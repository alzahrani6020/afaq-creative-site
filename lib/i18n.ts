export type Lang = 'ar' | 'en';

export const translations = {
  ar: {
    nav: {
      home: 'الرئيسية',
      services: 'خدماتنا',
      talents: 'تبنّي المواهب والخبرات',
      clients: 'عملاؤنا',
      licenses: 'تراخيصنا',
      contact: 'تواصل',
      cta: 'احجز استشارة',
      menuOpen: 'فتح القائمة',
      menuClose: 'إغلاق القائمة',
    },
    footer: {
      brandDesc:
        'وكالة إبداعية متكاملة نقدم حلولاً بصرية وتقنية وإعلامية. مسجلة رسمياً في مصر والسعودية برخص إعلامية وترفيهية.',
      contact: 'تواصل معنا',
      follow: 'تابعنا',
      newsletter: 'النشرة البريدية',
      privacy: 'سياسة الخصوصية',
      deleteData: 'حذف البيانات',
      licensed: 'مرخصة من GCAM و GEA',
      copyright: '© ٢٠١٧ — ٢٠٢٥ أفاق إبداعية. جميع الحقوق محفوظة.',
    },
    hero: {
      subtitle: 'CREATIVE HORIZONS FOR VISUAL ARTS',
    },
    labels: {
      new: 'جديد',
    },
  },
  en: {
    nav: {
      home: 'Home',
      services: 'Services',
      talents: 'Adopt Talents & Expertise',
      clients: 'Clients',
      licenses: 'Licenses',
      contact: 'Contact',
      cta: 'Book a Consultation',
      menuOpen: 'Open Menu',
      menuClose: 'Close Menu',
    },
    footer: {
      brandDesc:
        'A full-service creative agency offering visual, technical, and media solutions. Officially registered in Egypt and Saudi Arabia with media and entertainment licenses.',
      contact: 'Contact Us',
      follow: 'Follow Us',
      newsletter: 'Newsletter',
      privacy: 'Privacy Policy',
      deleteData: 'Delete Data',
      licensed: 'Licensed by GCAM & GEA',
      copyright: '© 2017 — 2025 Afaq Creative. All rights reserved.',
    },
    hero: {
      subtitle: 'CREATIVE HORIZONS FOR VISUAL ARTS',
    },
    labels: {
      new: 'NEW',
    },
  },
} as const;

export type TranslationSet = typeof translations.ar;

export function getTranslation(lang: Lang): TranslationSet {
  return translations[lang] as TranslationSet;
}
