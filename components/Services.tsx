'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Palette, Globe, Megaphone,
  Clapperboard, MonitorSmartphone, Database, PartyPopper,
  Camera, Lightbulb, BrainCircuit, Smartphone, GraduationCap,
  MessageSquare, BarChart3, Wifi, ArrowLeft
} from 'lucide-react';
import { siteServices } from '@/lib/site-services';

const serviceIcons = {
  'visual-production': Clapperboard,
  'professional-photography': Camera,
  'visual-identity': Palette,
  'digital-content': MonitorSmartphone,
  'web-design-development': Globe,
  'mobile-app-development': Smartphone,
  'software-solutions': Database,
  'artificial-intelligence': BrainCircuit,
  'telecom-networks': Wifi,
  'events-talents': PartyPopper,
  'training-development': GraduationCap,
  'consulting-entrepreneurship': Lightbulb,
  'licensed-media-content': MessageSquare,
  'data-analysis-research': BarChart3,
  'paid-advertising': Megaphone,
} as const;

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
          {siteServices.map((service, i) => {
            const Icon = serviceIcons[service.slug as keyof typeof serviceIcons];

            return (
              <motion.div
                key={service.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/services/${service.slug}`}
                  className="group relative p-8 rounded-3xl bg-white/[0.03] border border-white/[0.06] hover:border-afaq-gold/30 hover:bg-white/[0.06] transition-all duration-500 flex flex-col h-full"
                  aria-label={`فتح مساحة عمل ${service.title}`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-afaq-blue to-afaq-teal flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    {Icon && <Icon size={26} className="text-white" />}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{service.title}</h3>
                  <p className="text-white/40 leading-relaxed text-sm mb-4 flex-1">{service.description}</p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {service.tags.map((tag) => (
                      <span key={tag} className="px-3 py-1 rounded-full bg-white/5 text-white/50 text-xs border border-white/10">{tag}</span>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-2 text-afaq-gold text-sm font-bold">
                    افتح مساحة العمل
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
