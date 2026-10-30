'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Building2, FileCheck, MapPin, Calendar, User, Briefcase } from 'lucide-react';

const companyInfo = [
  { icon: Building2, label: 'الاسم التجاري', value: 'أفاق إبداعية' },
  { icon: FileCheck, label: 'رقم السجل التجاري', value: '98066' },
  { icon: Briefcase, label: 'النوع القانوني', value: 'ذات مسئولية محدودة' },
  { icon: MapPin, label: 'المركز العام', value: '٦ أكتوبر — الجيزة، مصر' },
  { icon: Calendar, label: 'تاريخ بدء النشاط', value: '١٠ أبريل ٢٠١٧' },
  { icon: User, label: 'المدير العام', value: 'الدكتور طلال بن حسن بن محمد الزهراني' },
];

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

const stats = [
  { value: 25, suffix: '+', label: 'نشاط مرخص' },
  { value: 2017, suffix: '', label: 'سنة التأسيس' },
  { value: 15, suffix: '', label: 'خدمة رئيسية' },
  { value: 2, suffix: '', label: 'فرع' },
];

export function About() {
  return (
    <section id="about" className="py-24 relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-afaq-blue/10 rounded-full blur-[150px]" />
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-afaq-gold/10 rounded-full blur-[120px]" />

      <div className="max-w-7xl mx-auto px-6 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-afaq-gold/10 text-afaq-gold font-bold text-sm tracking-wider border border-afaq-gold/20 mb-4">
            عن الشركة
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white">
            مسجلة رسمياً.. <span className="text-afaq-gold">ونُنفذ بإبداع</span>
          </h2>
          <p className="mt-4 text-white/40 max-w-2xl mx-auto">
            أفاق إبداعية شركة ذات مسئولية محدودة مسجلة في جمهورية مصر العربية برقم سجل تجاري رسمي، 
            نمارس ٢٥ نشاطاً مرخصاً داخل وخارج قانون الاستثمار.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <div className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-afaq-gold via-afaq-gold2 to-afaq-teal bg-clip-text text-transparent">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="mt-2 text-white/40 text-sm">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companyInfo.map((item, i) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="flex items-center gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-afaq-gold/20 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-afaq-gold/10 flex items-center justify-center flex-shrink-0">
                <item.icon size={22} className="text-afaq-gold" />
              </div>
              <div>
                <div className="text-white/40 text-xs mb-1">{item.label}</div>
                <div className="text-white font-semibold text-sm">{item.value}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="mt-10 p-6 rounded-2xl bg-afaq-blue/5 border border-afaq-blue/20 text-center">
          <p className="text-white/50 text-sm">
            <span className="text-afaq-gold font-bold">السجل التجاري المصري رقم ٩٨٠٦٦</span> — 
            مسجلة بوزارة التموين والتجارة الداخلية، جهاز تنمية التجارة الداخلية، مكتب استثمار ٦ أكتوبر.
            جميع خدماتنا مُمارَسة بموجب تراخيص رسمية.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
