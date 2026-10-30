'use client';

import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

const items = [
  { title: 'هوية بصرية - مطعم لذيذ', category: 'هوية بصرية', color: 'from-afaq-purple to-afaq-pink', href: '#' },
  { title: 'حملة إعلانية - تقنية', category: 'سوشال ميديا', color: 'from-afaq-cyan to-afaq-purple', href: '#' },
  { title: 'موقع تعريفي - عقارات', category: 'تصميم مواقع', color: 'from-afaq-pink to-afaq-gold', href: '#' },
  { title: 'فيديو إعلاني - سياحة', category: 'فيديو', color: 'from-afaq-gold to-afaq-cyan', href: '#' },
  { title: 'تصميم جرافيك - مهرجان', category: 'جرافيك', color: 'from-afaq-purple to-afaq-cyan', href: '#' },
  { title: 'براندينغ - عيادة طبية', category: 'هوية بصرية', color: 'from-afaq-pink to-afaq-purple', href: '#' },
];

export function Portfolio() {
  return (
    <section id="portfolio" className="py-24 relative">
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-afaq-pink/10 rounded-full blur-[120px]" />
      <div className="max-w-7xl mx-auto px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-afaq-pink font-bold text-sm tracking-wider uppercase">أعمالنا</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-extrabold text-white">نماذج من إبداعنا</h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <motion.a
              key={item.title}
              href={item.href}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative aspect-[4/3] rounded-3xl overflow-hidden cursor-pointer block"
              aria-label={`عرض ${item.title}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <span className="text-white/70 text-sm font-semibold mb-2">{item.category}</span>
                <h3 className="text-2xl font-bold text-white">{item.title}</h3>
              </div>

              <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink size={18} className="text-white" />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
