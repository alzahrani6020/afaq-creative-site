'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Camera, Film, Palette } from 'lucide-react';

const stories = [
  {
    icon: Camera,
    name: 'محمد',
    role: 'مصور رئيسي',
    journey: 'من مصور مبتدئ إلى قيادة فريق التصوير في أفاق إبداعية',
    detail: 'انضم محمد قبل 3 سنوات كمتدرب تصوير. اليوم يقود فريقاً من 5 مصورين ويُشرف على تصوير الفعاليات الكبرى.',
  },
  {
    icon: Film,
    name: 'سارة',
    role: 'ممثلة إعلانية',
    journey: 'من ممثلة هواية إلى بطلة إعلانات تلفزيونية',
    detail: 'قدمت سارة موهبتها عبر نموذج "اكتشف موهبتك". شاركت في 12 إعلاناً تلفزيونياً وتمثيلية قصيرة حاصلة على جوائز.',
  },
  {
    icon: Palette,
    name: 'عبدالله',
    role: 'مدير فني',
    journey: 'من مصمم هواية إلى مدير الفريق الإبداعي',
    detail: 'بدأ عبدالله بتصميم بوستات بسيطة. الآن يُدير الهوية البصرية لـ 20+ عميلاً ويُدرب مصممين جدد.',
  },
];

export function TalentSuccessStories() {
  return (
    <section id="success-stories" className="py-24 relative">
      <div className="max-w-6xl mx-auto px-6 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-afaq-gold/10 text-afaq-gold font-bold text-sm tracking-wider border border-afaq-gold/20 mb-4">
            <TrendingUp size={14} className="inline-block ml-1" />
            قصص نجاح
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white">
            من موهبة إلى <span className="text-afaq-gold">مهنة</span>
          </h2>
          <p className="mt-4 text-white/40 max-w-xl mx-auto">
            هؤلاء لم يكونوا محترفين من البداية. بدأوا بخطوة واحدة: تقدموا لنا.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {stories.map((story, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="p-6 rounded-3xl bg-white/[0.03] border border-white/[0.06] hover:border-afaq-gold/20 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-afaq-gold/10 flex items-center justify-center mb-4">
                <story.icon size={24} className="text-afaq-gold" />
              </div>
              <h3 className="text-white font-bold text-lg">{story.name}</h3>
              <p className="text-afaq-gold text-sm font-semibold mt-1">{story.role}</p>
              <p className="text-white/60 text-sm mt-3 leading-relaxed">{story.journey}</p>
              <p className="text-white/30 text-xs mt-3 leading-relaxed">{story.detail}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
