import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { blogPosts, getPostBySlug } from '@/lib/blog';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { FloatingWhatsApp } from '@/components/FloatingWhatsApp';
import { CookieBanner } from '@/components/CookieBanner';
import { Calendar, Clock, ArrowRight, Tag } from 'lucide-react';

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getPostBySlug(params.slug);
  if (!post) return { title: 'مقالة غير موجودة' };
  return {
    title: `${post.title} | أفاق إبداعية`,
    description: post.excerpt,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `/blog/${post.slug}`,
      type: 'article',
      images: [{ url: '/assets/og-image.jpg', width: 1200, height: 630, alt: post.title }],
    },
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  if (!post) return notFound();

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    inLanguage: 'ar',
    datePublished: post.dateISO,
    author: {
      '@type': 'Organization',
      name: 'أفاق إبداعية',
      url: 'https://afaq-global.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'أفاق إبداعية',
      logo: {
        '@type': 'ImageObject',
        url: 'https://afaq-global.com/assets/afaq-logo-v4.png',
      },
    },
    mainEntityOfPage: `https://afaq-global.com/blog/${post.slug}`,
  };

  return (
    <main className="bg-afaq-bg min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <Navbar />
      <article className="pt-32 pb-24 max-w-3xl mx-auto px-6">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-afaq-gold text-sm font-semibold mb-8 hover:gap-2 transition-all"
        >
          <ArrowRight size={16} /> العودة للمدونة
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <span className="px-3 py-1 rounded-full bg-afaq-gold/10 text-afaq-gold text-xs font-bold flex items-center gap-1">
            <Tag size={12} /> {post.tag}
          </span>
          <span className="flex items-center gap-1 text-white/30 text-xs">
            <Calendar size={12} /> {post.date}
          </span>
          <span className="flex items-center gap-1 text-white/30 text-xs">
            <Clock size={12} /> {post.readTime}
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-8 leading-tight">
          {post.title}
        </h1>

        <div
          className="prose prose-invert prose-lg max-w-none text-white/70 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
      <Footer />
      <FloatingWhatsApp />
      <CookieBanner />
    </main>
  );
}
