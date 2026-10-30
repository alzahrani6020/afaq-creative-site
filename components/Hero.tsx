'use client';

import { motion } from 'framer-motion';
import { ArrowDown, Sparkles, Shield, Award, FileCheck, Star } from 'lucide-react';
import { ParticlesBackground } from './Particles';

const badges = [
  { icon: FileCheck, label: 'سجل تجاري', sub: 'مصر 98066 / السعودية 4030498014' },
  { icon: Shield, label: 'ترخيص إعلامي', sub: 'GCAM 150771' },
  { icon: Award, label: 'ترخيص ترفيه', sub: 'GEA 2302080106' },
];

function scrollToTalents() {
  if (typeof window === 'undefined') return;
  const el = document.getElementById('talents');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    window.location.href = '/#talents';
  }
}

export function Hero() {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <ParticlesBackground />
      
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-afaq-blue/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-afaq-teal/20 rounded-full blur-[100px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-afaq-gold/10 rounded-full blur-[150px]" />

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-afaq-gold/30 text-afaq-gold text-sm font-bold mb-8"
        >
          <Sparkles size={16} />
          نصنع الإبداع منذ 2017
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl lg:text-8xl font-extrabold leading-[1.05]"
        >
          <span className="bg-gradient-to-r from-afaq-gold via-afaq-gold2 to-afaq-teal bg-clip-text text-transparent">
            نُبدع
          </span>
          <br />
          <span className="text-white">لنُبهر</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-6 text-lg md:text-xl text-white/50 max-w-2xl mx-auto"
        >
          تصميم هويات بصرية، فيديوهات إعلانية، إدارة سوشال ميديا، وحلول رقمية مبتكرة
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="mt-10 flex flex-wrap justify-center gap-4"
        >
          <a href="#services" className="px-8 py-4 rounded-full bg-gradient-to-r from-afaq-blue to-afaq-teal text-white font-bold text-lg hover:shadow-xl hover:shadow-afaq-blue/30 transition-all hover:scale-105">
            استكشف خدماتنا
          </a>
          <button
            onClick={scrollToTalents}
            className="px-8 py-4 rounded-full bg-gradient-to-r from-afaq-gold to-afaq-gold2 text-afaq-bg font-bold text-lg hover:shadow-xl hover:shadow-afaq-gold/30 transition-all hover:scale-105 flex items-center gap-2 animate-pulse"
          >
            <Star size={20} fill="currentColor" />
            اكتشف موهبتك
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.9 }}
          className="mt-12 flex flex-wrap justify-center gap-3"
        >
          {badges.map((badge) => (
            <div key={badge.label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] hover:border-afaq-gold/30 transition-colors">
              <badge.icon size={14} className="text-afaq-gold" />
              <div className="text-right">
                <div className="text-white/60 text-xs font-bold">{badge.label}</div>
                <div className="text-white/30 text-[10px]">{badge.sub}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="absolute bottom-10 left-1/2 -translate-x-1/2">
        <a href="#services" className="animate-bounce text-white/30 hover:text-afaq-gold transition-colors">
          <ArrowDown size={28} />
        </a>
      </motion.div>

    </section>
  );
}
