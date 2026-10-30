'use client';

import { motion } from 'framer-motion';
import { FileCheck, Building2, Shield, Award, Download } from 'lucide-react';

const licenses = [
  {
    icon: FileCheck,
    title: 'سجل تجاري — مصر',
    number: '98066',
    issuer: 'وزارة التموين والتجارة الداخلية',
    type: 'ذات مسئولية محدودة',
    year: '2017',
    desc: 'شركة أفاق إبداعية مسجلة رسمياً في جمهورية مصر العربية',
  },
  {
    icon: Building2,
    title: 'سجل تجاري — السعودية',
    number: '4030498014',
    issuer: 'وزارة التجارة',
    type: 'مؤسسة فردية',
    year: '—',
    desc: 'مؤسسة أفاق إبداعية للفنون البصرية مسجلة في المملكة العربية السعودية',
  },
  {
    icon: Shield,
    title: 'ترخيص إعلامي',
    number: '150771',
    issuer: 'الهيئة العامة للإعلام المرئي والمسموع (GCAM)',
    type: 'إنتاج محتوى مرئي ومسموع',
    year: '1445 هـ',
    desc: 'مرخص لإنتاج المحتوى الإعلامي المرئي والمسموع داخل المملكة العربية السعودية',
  },
  {
    icon: Award,
    title: 'ترخيص ترفيه',
    number: '2302080106',
    issuer: 'هيئة الترفيه السعودية (GEA)',
    type: 'إدارة مواهب وتنظيم فعاليات',
    year: '2023',
    desc: 'مرخص لإدارة المواهب الفنية وتنظيم الفعاليات والترفيه',
  },
];

export function Licenses() {
  return (
    <section id="licenses" className="py-24 relative">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-afaq-gold/5 rounded-full blur-[120px]" />
      <div className="max-w-7xl mx-auto px-6 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-afaq-gold/10 text-afaq-gold font-bold text-sm tracking-wider border border-afaq-gold/20 mb-4">
            مرخصون رسمياً
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white">
            تراخيص واعتمادات <span className="text-afaq-gold">رسمية</span>
          </h2>
          <p className="mt-4 text-white/40 max-w-2xl mx-auto">
            جميع خدماتنا مُمارَسة بموجب تراخيص رسمية من الجهات الحكومية المختصة في مصر والسعودية
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {licenses.map((lic, i) => (
            <motion.div key={lic.number} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="group p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-afaq-gold/20 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-afaq-gold/10 flex items-center justify-center">
                    <lic.icon size={22} className="text-afaq-gold" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">{lic.title}</h3>
                    <p className="text-afaq-gold font-mono text-sm font-semibold">{lic.number}</p>
                  </div>
                </div>
                <span className="text-white/20 text-xs font-mono">{lic.year}</span>
              </div>
              <p className="text-white/30 text-xs leading-relaxed mb-3">{lic.issuer}</p>
              <p className="text-white/20 text-xs">{lic.type}</p>
              <p className="text-white/40 text-xs mt-3 leading-relaxed">{lic.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-10 p-6 rounded-2xl bg-afaq-blue/5 border border-afaq-blue/20 text-center">
          <p className="text-white/50 text-sm">
            <span className="text-afaq-gold font-bold">ملاحظة:</span> يمكن طلب صور رقمية للتراخيص عبر الواتساب لغرض التحقق — 
            نحافظ على وثائقنا الأصلية آمنة ولا ننشرها علناً إلا بموجب طلب رسمي.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
