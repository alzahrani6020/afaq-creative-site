'use client';

import { Instagram, Linkedin, Mail, Phone, MapPin, FileCheck, Building2, Shield, Award, Lock, Trash2 } from 'lucide-react';

function FacebookIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function TikTokIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.88-2.89 2.89 2.89 0 0 1 2.88-2.89c.2 0 .39.02.57.06V9.66a6.37 6.37 0 0 0-.57-.03A6.34 6.34 0 0 0 3.14 16a6.34 6.34 0 0 0 6.35 6.34c3.5 0 6.34-2.84 6.34-6.34V8.56a8.15 8.15 0 0 0 4.76 1.54V6.81a4.88 4.88 0 0 1-1-.12z"/>
    </svg>
  );
}
import Link from 'next/link';
import { Newsletter } from './Newsletter';
import { useI18n } from './I18nProvider';

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="relative pt-24 pb-8 border-t border-white/[0.06]">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-afaq-blue/10 rounded-full blur-[120px]" />

      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src="/assets/afaq-logo-v4.png" alt="AFAQ Logo" className="h-14 w-14 rounded-xl object-cover border border-afaq-gold/20" />
              <h3 className="text-3xl font-extrabold bg-gradient-to-r from-afaq-gold via-afaq-gold2 to-afaq-teal bg-clip-text text-transparent">
                أفاق إبداعية
              </h3>
            </div>
            <p className="text-white/40 leading-relaxed max-w-md mb-6">
              {t.footer.brandDesc}
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white/40 text-sm">
                <FileCheck size={15} className="text-afaq-gold" />
                <span>سجل تجاري مصري رقم <span className="text-afaq-gold font-semibold">٩٨٠٦٦</span></span>
              </div>
              <div className="flex items-center gap-2 text-white/40 text-sm">
                <Building2 size={15} className="text-afaq-gold" />
                <span>سجل تجاري سعودي رقم <span className="text-afaq-gold font-semibold">٤٠٣٠٤٩٨٠١٤</span></span>
              </div>
              <div className="flex items-center gap-2 text-white/40 text-sm">
                <Shield size={15} className="text-afaq-gold" />
                <span>ترخيص إعلامي GCAM <span className="text-afaq-gold font-semibold">١٥٠٧٧١</span></span>
              </div>
              <div className="flex items-center gap-2 text-white/40 text-sm">
                <Award size={15} className="text-afaq-gold" />
                <span>ترخيص ترفيه GEA <span className="text-afaq-gold font-semibold">٢٣٠٢٠٨٠١٠٦</span></span>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-4">{t.footer.contact}</h4>
            <div className="space-y-3">
              <a href="mailto:info@bonds-global.com" className="flex items-center gap-2 text-white/40 hover:text-afaq-gold transition-colors text-sm">
                <Mail size={16} /> info@bonds-global.com
              </a>
              <a href="tel:+966567566616" className="flex items-center gap-2 text-white/40 hover:text-afaq-gold transition-colors text-sm">
                <Phone size={16} /> +966 56 756 6616
              </a>
              <span className="flex items-start gap-2 text-white/40 text-sm">
                <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                السعودية: عبدالرحمن الخزاعي، حي المروة، جدة
              </span>
              <span className="flex items-start gap-2 text-white/40 text-sm">
                <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                مصر: ٤ ش الياسمين، ٦ أكتوبر، الجيزة
              </span>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <Newsletter />
          </div>

          {/* Social */}
          <div>
            <h4 className="text-white font-bold mb-4">{t.footer.follow}</h4>
            <div className="flex gap-3">
              <a href="https://instagram.com/afaqcreative" target="_blank" rel="noopener noreferrer" aria-label="إنستقرام" title="إنستقرام" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-afaq-gold/20 hover:border-afaq-gold/30 transition-all">
                <Instagram size={18} className="text-white/60 hover:text-afaq-gold" />
              </a>
              <a href="https://linkedin.com/company/afaqcreative" target="_blank" rel="noopener noreferrer" aria-label="لينكدإن" title="لينكدإن" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-afaq-gold/20 hover:border-afaq-gold/30 transition-all">
                <Linkedin size={18} className="text-white/60 hover:text-afaq-gold" />
              </a>
              <a href="https://www.tiktok.com/@afaq.global" target="_blank" rel="noopener noreferrer" aria-label="تيك توك" title="تيك توك" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-afaq-gold/20 hover:border-afaq-gold/30 transition-all">
                <TikTokIcon size={18} className="text-white/60 hover:text-afaq-gold" />
              </a>
              <a href="https://www.facebook.com/profile.php?id=61578007479426" target="_blank" rel="noopener noreferrer" aria-label="فيسبوك" title="فيسبوك" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-afaq-gold/20 hover:border-afaq-gold/30 transition-all">
                <FacebookIcon size={18} className="text-white/60 hover:text-afaq-gold" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <p className="text-white/30">
            {t.footer.copyright}
          </p>
          <div className="flex items-center gap-4 text-white/20 text-xs">
            <Link href="/privacy" className="hover:text-afaq-gold transition-colors flex items-center gap-1">
              <Lock size={12} /> {t.footer.privacy}
            </Link>
            <span className="text-white/10">|</span>
            <Link href="/terms" className="hover:text-afaq-gold transition-colors flex items-center gap-1">
              <FileCheck size={12} /> الشروط والأحكام
            </Link>
            <span className="text-white/10">|</span>
            <Link href="/delete-account" className="hover:text-afaq-gold transition-colors flex items-center gap-1">
              <Trash2 size={12} /> {t.footer.deleteData}
            </Link>
            <span className="text-white/10">|</span>
            <span>{t.footer.licensed}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
