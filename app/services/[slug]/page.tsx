import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { ContactForm } from '@/components/ContactForm';
import { Footer } from '@/components/Footer';
import { FloatingWhatsApp } from '@/components/FloatingWhatsApp';
import { getSiteService, siteServices } from '@/lib/site-services';

interface ServiceWorkspacePageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return siteServices.map((service) => ({ slug: service.slug }));
}

export function generateMetadata({ params }: ServiceWorkspacePageProps): Metadata {
  const service = getSiteService(params.slug);

  if (!service) {
    return {
      title: 'الخدمة غير موجودة | آفاق إبداعية',
    };
  }

  return {
    title: `${service.title} | آفاق إبداعية`,
    description: service.description,
    alternates: {
      canonical: `/services/${service.slug}`,
    },
  };
}

export default function ServiceWorkspacePage({ params }: ServiceWorkspacePageProps) {
  const service = getSiteService(params.slug);

  if (!service) notFound();

  return (
    <main className="bg-afaq-bg min-h-screen">
      <Navbar />

      <section className="relative pt-36 pb-16 overflow-hidden">
        <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-afaq-blue/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-0 left-0 w-[360px] h-[360px] bg-afaq-gold/10 rounded-full blur-[120px]" />

        <div className="max-w-5xl mx-auto px-6 relative">
          <Link
            href="/#services"
            className="inline-flex items-center gap-2 text-white/50 hover:text-afaq-gold transition-colors text-sm mb-8"
          >
            <ArrowRight size={16} />
            العودة إلى جميع الخدمات
          </Link>

          <div className="rounded-3xl bg-white/[0.03] border border-white/[0.08] p-8 md:p-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-afaq-gold/10 text-afaq-gold font-bold text-sm border border-afaq-gold/20 mb-5">
              مساحة عمل الخدمة
            </span>

            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight">
              {service.title}
            </h1>

            <p className="mt-6 text-white/50 text-lg leading-relaxed max-w-3xl">
              {service.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {service.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm"
                >
                  <CheckCircle2 size={15} className="text-afaq-gold" />
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-10 rounded-2xl bg-afaq-blue/10 border border-afaq-blue/20 p-5">
              <p className="text-white/70 leading-relaxed">
                هذه الصفحة هي مساحة العمل المخصصة لهذه الخدمة. نموذج الطلب أدناه مهيأ تلقائيًا باسم الخدمة حتى لا ينتقل الطلب إلى خدمة أو مساحة عمل أخرى.
              </p>
            </div>
          </div>
        </div>
      </section>

      <ContactForm initialService={service.title} />
      <Footer />
      <FloatingWhatsApp />
    </main>
  );
}
