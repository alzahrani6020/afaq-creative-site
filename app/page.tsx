import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { About } from '@/components/About';
import { Services } from '@/components/Services';
import { Clients } from '@/components/Clients';
import { Licenses } from '@/components/Licenses';
import { Team } from '@/components/Team';
import { Testimonials } from '@/components/Testimonials';
import { Portfolio } from '@/components/Portfolio';
import { Blog } from '@/components/Blog';
import { TalentHub } from '@/components/TalentHub';
import { TalentSuccessStories } from '@/components/TalentSuccessStories';
import { FAQ } from '@/components/FAQ';
import { ContactForm } from '@/components/ContactForm';
import { Footer } from '@/components/Footer';
import { FloatingWhatsApp } from '@/components/FloatingWhatsApp';
import { CookieBanner } from '@/components/CookieBanner';
import { ScrollProgress } from '@/components/ScrollProgress';
import { GoogleMap } from '@/components/GoogleMap';
import { faqs } from '@/lib/faqs';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

const localBusinessLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'أفاق إبداعية | Afaq Creative',
  url: 'https://afaq-global.com',
  logo: 'https://afaq-global.com/assets/afaq-logo-v4.png',
  telephone: '+966-56-756-6616',
  email: 'info@bonds-global.com',
  address: [
    {
      '@type': 'PostalAddress',
      streetAddress: 'عبدالرحمن الخزاعي، حي المروة',
      addressLocality: 'جدة',
      addressRegion: 'منطقة مكة المكرمة',
      addressCountry: 'SA',
    },
    {
      '@type': 'PostalAddress',
      streetAddress: '٤ ش الياسمين',
      addressLocality: '٦ أكتوبر',
      addressRegion: 'الجيزة',
      addressCountry: 'EG',
    },
  ],
  sameAs: [
    'https://instagram.com/afaqcreative',
    'https://linkedin.com/company/afaqcreative',
    'https://www.tiktok.com/@afaq.global',
    'https://www.facebook.com/profile.php?id=61578007479426',
  ],
};

const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

export default function Home() {
  return (
    <main className="bg-afaq-bg min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <ScrollProgress />
      <Navbar />
      <Hero />
      <About />
      <Services />
      <TalentHub />
      <Clients />
      <Licenses />
      <Team />
      <Testimonials />
      <Portfolio />
      <Blog />
      <FAQ />
      <GoogleMap />
      <ContactForm />
      <TalentSuccessStories />
      <Footer />
      <FloatingWhatsApp />
      <CookieBanner />
    </main>
  );
}
