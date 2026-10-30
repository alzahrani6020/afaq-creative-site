'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import { blogPosts } from '@/lib/blog';

const posts = blogPosts;


export function Blog() {
  return (
    <section id="blog" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-afaq-blue/10 text-afaq-blue font-bold text-sm tracking-wider border border-afaq-blue/20 mb-4">
            المدونة
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white">
            آخر <span className="text-afaq-gold">المقالات</span>
          </h2>
          <p className="mt-4 text-white/40 max-w-xl mx-auto">
            نصائح، رؤى، وأخبار من عالم الإبداع والتقنية
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {posts.map((post, i) => (
            <Link key={i} href={`/blog/${post.slug}`}>
            <motion.article initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="group p-6 rounded-3xl bg-white/[0.03] border border-white/[0.06] hover:border-afaq-gold/20 transition-all cursor-pointer block h-full">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-afaq-gold/10 text-afaq-gold text-xs font-bold">{post.tag}</span>
                <span className="flex items-center gap-1 text-white/30 text-xs">
                  <Calendar size={12} /> {post.date}
                </span>
                <span className="flex items-center gap-1 text-white/30 text-xs">
                  <Clock size={12} /> {post.readTime}
                </span>
              </div>
              <h3 className="text-white font-bold text-lg mb-3 group-hover:text-afaq-gold transition-colors">{post.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed mb-4">{post.excerpt}</p>
              <span className="inline-flex items-center gap-1 text-afaq-gold text-sm font-semibold group-hover:gap-2 transition-all">
                اقرأ المزيد <ArrowLeft size={16} />
              </span>
            </motion.article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
