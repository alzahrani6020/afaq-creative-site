'use client';

import { motion } from 'framer-motion';
import {
  Palette, Video, Share2, Globe, Megaphone,
  Clapperboard, MonitorSmartphone, Database, PartyPopper,
  Camera, Lightbulb, BrainCircuit, Smartphone, GraduationCap, 
  MessageSquare, BarChart3, Wifi
} from 'lucide-react';

const services = [
  { icon: Clapperboard, title: 'إنتاج مرئي وسينمائي', desc: 'أفلام إعلانية، فيديوهات ترويجية، موشن جرافيك، مونتاج احترافي، VFX وColor Grading', tags: ['تصوير', 'مونتاج', 'موشن جرافيك'] },
  { icon: Camera, title: 'التصوير الاحترافي', desc: 'تصوير منتجات، بورتريه، فعاليات، عقارات، وتأجير استديوهات مجهزة بالكامل', tags: ['استديوهات', 'تأجير معدات', 'تصوير جوي'] },
  { icon: Palette, title: 'هوية بصرية', desc: 'تصميم شعارات، هويات تجارية متكاملة، دليل استخدام، وتصميمات مطبوعة', tags: ['لوجو', 'هوية', 'براندينج'] },
  { icon: MonitorSmartphone, title: 'محتوى رقمي', desc: 'إدارة حسابات التواصل، إنتاج المحتوى الإلكتروني، بودكاست وريلز', tags: ['سوشال ميديا', 'بودكاست', 'محتوى يومي'] },
  { icon: Globe, title: 'تصميم وتطوير مواقع', desc: 'مواقع تعريفية، متاجر إلكترونية، تطبيقات ويب، UI/UX', tags: ['ويب', 'تطبيقات', 'UI/UX'] },
  { icon: Smartphone, title: 'تطوير تطبيقات الموبايل', desc: 'تطبيقات iOS وAndroid، تطبيقات إدارة، تطبيقات ذكية', tags: ['iOS', 'Android', 'Flutter'] },
  { icon: Database, title: 'حلول تقنية وبرمجية', desc: 'تطوير البرامج، قواعد البيانات، أنظمة ERP/CRM، رقمنة', tags: ['برمجة', 'رقمنة', 'أنظمة إدارة'] },
  { icon: BrainCircuit, title: 'الذكاء الاصطناعي', desc: 'حلول AI مخصصة، chatbots، معالجة اللغة الطبيعية، تحليل البيانات', tags: ['AI', 'Chatbots', 'NLP'] },
  { icon: Wifi, title: 'شبكات الاتصالات', desc: 'تصميم وإدارة شبكات نقل الصوت والصورة والبيانات، خدمات الإنترنت', tags: ['شبكات', 'نقل البيانات'] },
  { icon: PartyPopper, title: 'إدارة فعاليات ومواهب', desc: 'تنظيم مؤتمرات، حفلات تدشين، مهرجانات، كاستينج واكتشاف مواهب', tags: ['مؤتمرات', 'كاستينج', 'تنظيم'] },
  { icon: GraduationCap, title: 'تدريب وتأهيل', desc: 'مراكز تدريب مهارات الموارد البشرية، دورات تقنية، تصوير ومونتاج', tags: ['دورات', 'تأهيل', 'مهارات'] },
  { icon: Lightbulb, title: 'استشارات وريادة أعمال', desc: 'حاضنات أعمال تكنولوجية، دراسات متخصصة في IT، استشارات تقنية', tags: ['حاضنات', 'دراسات', 'استشارات'] },
  { icon: MessageSquare, title: 'إنتاج محتوى إعلامي مرخص', desc: 'إنتاج المحتوى الإعلامي المرئي والمسموع المرخص من GCAM', tags: ['GCAM', 'إعلام', 'إذاعي'] },
  { icon: BarChart3, title: 'تحليل بيانات وبحث علمي', desc: 'مشروعات البحث والتطوير العلمي، تحليل البيانات، مراكز استشارات', tags: ['R&D', 'تحليل', 'بحث'] },
  { icon: Megaphone, title: 'حملات إعلانية ممولة', desc: 'إدارة حملات جوجل، ميتا، سناب، تيك توك — مع تحليل أداء', tags: ['Google', 'Meta', 'TikTok'] },
];

export function Services() {
  return (
    <section id="services" className="py-24 relative">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-afaq-blue/10 rounded-full blur-[120px]" />
      <div className="max-w-7xl mx-auto px-6 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-afaq-gold/10 text-afaq-gold font-bold text-sm tracking-wider border border-afaq-gold/20 mb-4">
            خدماتنا
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white">حلول إبداعية وتقنية شاملة</h2>
          <p className="mt-4 text-white/40 max-w-2xl mx-auto">
            ١٥ خدمة مرخصة — من الإعلام والترفيه إلى التقنية والذكاء الاصطناعي
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <motion.div key={s.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="group relative p-8 rounded-3xl bg-white/[0.03] border border-white/[0.06] hover:border-afaq-gold/30 hover:bg-white/[0.06] transition-all duration-500 flex flex-col">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-afaq-blue to-afaq-teal flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <s.icon size={26} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{s.title}</h3>
              <p className="text-white/40 leading-relaxed text-sm mb-4 flex-1">{s.desc}</p>
              <div className="flex flex-wrap gap-2">
                {s.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-white/5 text-white/50 text-xs border border-white/10">{tag}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
