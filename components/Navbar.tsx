'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, Clock, Calendar, Star } from 'lucide-react';
import { LanguageToggle } from './LanguageToggle';
import { useI18n } from './I18nProvider';

const linkKeys = [
  { href: '#home', key: 'home' as const },
  { href: '#services', key: 'services' as const },
  { href: '#talents', key: 'talents' as const, highlight: true },
  { href: '#clients', key: 'clients' as const },
  { href: '#licenses', key: 'licenses' as const },
  { href: '#contact', key: 'contact' as const },
];

function useDateTime() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

function formatArabicDate(date: Date) {
  return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
}

function formatArabicTime(date: Date) {
  return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const now = useDateTime();
  const { t } = useI18n();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled ? 'bg-afaq-bg/90 backdrop-blur-xl border-b border-afaq-gold/20' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
        <a href="#" className="flex items-center gap-4">
          <img src="/assets/afaq-logo-v4.png" alt="AFAQ Logo" className="h-16 w-16 rounded-2xl object-cover border border-afaq-gold/30 shadow-lg shadow-afaq-gold/10" />
          <div className="flex flex-col">
            <span className="text-xl font-extrabold bg-gradient-to-r from-afaq-gold via-afaq-gold2 to-afaq-teal bg-clip-text text-transparent leading-tight">
              أفاق إبداعية
            </span>
            <span className="text-[10px] text-white/30 tracking-wider">{t.hero.subtitle}</span>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-[10px] text-white/30">
                <Calendar size={9} className="text-afaq-gold" />
                {now ? formatArabicDate(now) : '—'}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-white/30">
                <Clock size={9} className="text-afaq-teal" />
                {now ? formatArabicTime(now) : '—'}
              </span>
            </div>
          </div>
        </a>

        <div className="hidden md:flex items-center gap-6">
          {linkKeys.map((l) => (
            <a key={l.href} href={l.href} className={`font-semibold transition-colors relative group text-sm flex items-center gap-1 ${
              l.highlight 
                ? 'text-afaq-gold hover:text-afaq-gold2' 
                : 'text-white/60 hover:text-afaq-gold'
            }`}>
              {l.highlight && <Star size={12} className="text-afaq-gold" fill="currentColor" />}
              {t.nav[l.key]}
              {l.highlight && (
                <span className="px-1.5 py-0.5 rounded-md bg-afaq-gold/20 text-afaq-gold text-[9px] font-bold">{t.labels.new}</span>
              )}
              <span className={`absolute -bottom-1 right-0 w-0 h-0.5 bg-afaq-gold group-hover:w-full transition-all duration-300 ${l.highlight ? 'bg-afaq-gold' : ''}`} />
            </a>
          ))}
          <a href="#contact" className="px-5 py-2 rounded-full bg-gradient-to-r from-afaq-blue to-afaq-teal text-white font-bold text-sm hover:shadow-lg hover:shadow-afaq-blue/30 transition-all">
            {t.nav.cta}
          </a>
          <LanguageToggle />
        </div>

        <button className="md:hidden text-white" onClick={() => setOpen(!open)} aria-label={open ? t.nav.menuClose : t.nav.menuOpen}>
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {open && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="md:hidden bg-afaq-bg/95 backdrop-blur-xl border-t border-afaq-gold/20">
          <div className="px-6 py-4 flex flex-col gap-3">
            {linkKeys.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className={`py-2 font-semibold flex items-center gap-2 ${l.highlight ? 'text-afaq-gold' : 'text-white/80 hover:text-afaq-gold'}`}>
                {l.highlight && <Star size={14} className="text-afaq-gold" fill="currentColor" />}
                {t.nav[l.key]}
                {l.highlight && <span className="px-1.5 py-0.5 rounded-md bg-afaq-gold/20 text-afaq-gold text-[9px] font-bold">{t.labels.new}</span>}
              </a>
            ))}
            <a href="#contact" onClick={() => setOpen(false)} className="mt-2 px-6 py-3 rounded-full bg-gradient-to-r from-afaq-blue to-afaq-teal text-white font-bold text-center">{t.nav.cta}</a>
            <div className="pt-2 border-t border-white/10">
              <LanguageToggle />
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
}
