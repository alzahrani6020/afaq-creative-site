'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'شركة إنتاج سينمائي',
    role: 'شريك إنتاج',
    text: 'تعاملنا مع أفاق إبداعية في إنتاج فيلم ترويجي وكانت النتيجة مذهلة. احترافية في المواعيد وجودة عالية في التنفيذ.',
    stars: 5,
  },
  {
    name: 'مركز تجاري',
    role: 'عميل فعاليات',
    text: 'نظموا لنا حفل تدشين بمستوى عالمي. التنسيق مع الفنانين والفريق كان سلساً، والحضور كان راضياً جداً.',
    stars: 5,
  },
  {
    name: 'قناة تلفزيونية',
    role: 'شريك إعلامي',
    text: 'الترخيص الإعلامي من GCAM يعطينا ثقة كبيرة في التعامل. جودة المحتوى المرئي تتناسب مع معايير القنوات الفضائية.',
    stars: 5,
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-afaq-gold/10 text-afaq-gold font-bold text-sm tracking-wider border border-afaq-gold/20 mb-4">
            آراء العملاء
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white">
            ثقتهم <span className="text-afaq-gold">فخر لنا</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="p-8 rounded-3xl bg-white/[0.03] border border-white/[0.06] hover:border-afaq-gold/20 transition-all relative">
              <Quote size={32} className="text-afaq-gold/20 absolute top-6 left-6" />
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} size={16} className="text-afaq-gold fill-afaq-gold" />
                ))}
              </div>
              <p className="text-white/60 text-sm leading-relaxed mb-6">{t.text}</p>
              <div className="border-t border-white/[0.06] pt-4">
                <div className="text-white font-semibold text-sm">{t.name}</div>
                <div className="text-white/30 text-xs">{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
