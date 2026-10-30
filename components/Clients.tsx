'use client';

import { motion } from 'framer-motion';
import { Building2, Landmark, Store, Tv, Film, Music } from 'lucide-react';

const clients = [
  { icon: Landmark, name: 'الهيئة العامة للإعلام المرئي والمسموع', type: 'جهة حكومية' },
  { icon: Building2, name: 'هيئة الترفيه السعودية', type: 'جهة حكومية' },
  { icon: Store, name: 'مراكز تجارية', type: 'شراكات' },
  { icon: Tv, name: 'قنوات تلفزيونية', type: 'إعلام' },
  { icon: Film, name: 'شركات إنتاج سينمائي', type: 'إنتاج' },
  { icon: Music, name: 'فرق موسيقية وفنية', type: 'فنون' },
];

export function Clients() {
  return (
    <section id="clients" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-afaq-teal/10 text-afaq-teal font-bold text-sm tracking-wider border border-afaq-teal/20 mb-4">
            شركاؤنا وعملاؤنا
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white">
            نفخر بـ <span className="text-afaq-gold">ثقتهم</span>
          </h2>
          <p className="mt-4 text-white/40 max-w-xl mx-auto">
            نتعامل مع جهات حكومية وشركات ومراكز تجارية في المملكة العربية السعودية ومصر
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {clients.map((client, i) => (
            <motion.div key={client.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-afaq-gold/20 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-afaq-blue/10 flex items-center justify-center flex-shrink-0">
                <client.icon size={24} className="text-afaq-blue" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm">{client.name}</div>
                <div className="text-white/30 text-xs mt-1">{client.type}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
