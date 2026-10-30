import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { FloatingWhatsApp } from '@/components/FloatingWhatsApp';
import { CookieBanner } from '@/components/CookieBanner';
import { blogPosts } from '@/lib/blog';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'المدونة | أفاق إبداعية',
  description: 'نصائح ورؤى في الإنتاج المرئي، التراخيص الإعلامية، والتسويق الرقمي — من فريق أفاق إبداعية.',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: 'المدونة | أفاق إبداعية',
    description: 'نصائح ورؤى في الإنتاج المرئي، التراخيص الإعلامية، والتسويق الرقمي',
    url: '/blog',
    type: 'website',
  },
};

export default function BlogIndexPage() {
  return (
    <main className="bg-afaq-bg min-h-screen">
      <Navbar />
      <section className="pt-32 pb-24 max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-afaq-blue/10 text-afaq-blue font-bold text-sm tracking-wider border border-afaq-blue/20 mb-4">
            المدونة
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white">
            آخر <span className="text-afaq-gold">المقالات</span>
          </h1>
          <p className="mt-4 text-white/40 max-w-xl mx-auto">
            نصائح، رؤى، وأخبار من عالم الإبداع والتقنية
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group block h-full">
              <article className="p-6 rounded-3xl bg-white/[0.03] border border-white/[0.06] hover:border-afaq-gold/20 transition-all h-full">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full bg-afaq-gold/10 text-afaq-gold text-xs font-bold">
                    {post.tag}
                  </span>
                  <span className="flex items-center gap-1 text-white/30 text-xs">
                    <Calendar size={12} /> {post.date}
                  </span>
                  <span className="flex items-center gap-1 text-white/30 text-xs">
                    <Clock size={12} /> {post.readTime}
                  </span>
                </div>
                <h2 className="text-white font-bold text-lg mb-3 group-hover:text-afaq-gold transition-colors">
                  {post.title}
                </h2>
                <p className="text-white/40 text-sm leading-relaxed mb-4">{post.excerpt}</p>
                <span className="inline-flex items-center gap-1 text-afaq-gold text-sm font-semibold group-hover:gap-2 transition-all">
                  اقرأ المزيد <ArrowLeft size={16} />
                </span>
              </article>
            </Link>
          ))}
        </div>
      </section>
      <Footer />
      <FloatingWhatsApp />
      <CookieBanner />
    </main>
  );
}
