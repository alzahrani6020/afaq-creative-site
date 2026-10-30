import type { Metadata } from 'next';
import './globals.css';
import { I18nWrapper } from './I18nWrapper';
import { Analytics } from '@/components/Analytics';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'أفاق إبداعية | Afaq Creative',
  alternateName: 'Afaq Creative',
  url: 'https://afaq-global.com',
  logo: 'https://afaq-global.com/assets/afaq-logo-v4.png',
  sameAs: [
    'https://instagram.com/afaqcreative',
    'https://linkedin.com/company/afaqcreative',
    'https://www.tiktok.com/@afaq.global',
    'https://www.facebook.com/profile.php?id=61578007479426',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+966-56-756-6616',
    contactType: 'customer service',
    availableLanguage: ['Arabic', 'English'],
  },
  address: [
    {
      '@type': 'PostalAddress',
      addressLocality: 'جدة',
      addressRegion: 'منطقة مكة المكرمة',
      addressCountry: 'SA',
      streetAddress: 'عبدالرحمن الخزاعي، حي المروة',
    },
    {
      '@type': 'PostalAddress',
      addressLocality: '٦ أكتوبر',
      addressRegion: 'الجيزة',
      addressCountry: 'EG',
      streetAddress: '٤ ش الياسمين',
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL('https://afaq-global.com'),
  title: 'أفاق إبداعية | Afaq Creative — خدمات إبداعية وإعلامية مرخصة',
  description: 'أفاق إبداعية — وكالة إبداعية متكاملة مرخصة في مصر والسعودية. نقدم خدمات الإنتاج المرئي، التصوير، الهوية البصرية، التسويق الرقمي، البرمجة، والذكاء الاصطناعي. سجل تجاري: 98066 (مصر) — 4030498014 (السعودية).',
  keywords: ['أفاق إبداعية', 'Afaq Creative', 'إنتاج مرئي', 'تصوير', 'هوية بصرية', 'تسويق رقمي', 'برمجة', 'ذكاء اصطناعي', 'ترخيص إعلامي', 'هيئة الترفيه'],
  authors: [{ name: 'أفاق إبداعية' }],
  openGraph: {
    title: 'أفاق إبداعية | Afaq Creative',
    description: 'وكالة إبداعية متكاملة مرخصة في مصر والسعودية — إنتاج مرئي، تصوير، برمجة، ذكاء اصطناعي',
    url: 'https://afaq-global.com',
    siteName: 'أفاق إبداعية',
    locale: 'ar_SA',
    type: 'website',
    images: [{ url: '/assets/og-image.jpg', width: 1200, height: 630, alt: 'أفاق إبداعية | Afaq Creative' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'أفاق إبداعية | Afaq Creative',
    description: 'وكالة إبداعية متكاملة مرخصة في مصر والسعودية',
    images: ['/assets/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
  // لا يوجد canonical موحّد هنا: كل صفحة تُعلن canonical خاصاً بها (انظر app/blog/[slug]/page.tsx).
  // كان canonical الثابت يشير للرئيسية فيكل الصفحات، فيُستبعد كل شيء غيرها من الفهرسة.
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/assets/afaq-logo-v4.png', type: 'image/png' },
    ],
    apple: '/assets/afaq-logo-v4.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="apple-touch-icon" href="/assets/afaq-logo-v4.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <I18nWrapper>{children}</I18nWrapper>
        <Analytics />
      </body>
    </html>
  );
}
