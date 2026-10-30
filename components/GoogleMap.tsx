'use client';

import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { useState } from 'react';

const locations = [
  {
    city: 'جدة',
    country: 'السعودية',
    address: 'عبدالرحمن الخزاعي، حي المروة',
    embed: 'https://www.google.com/maps?q=21.614895,39.212244&z=16&output=embed',
  },
  {
    city: '٦ أكتوبر',
    country: 'مصر',
    address: '٤ ش الياسمين، الجيزة',
    embed: 'https://www.google.com/maps?q=4+الياسمين+6+اكتوبر+الجيزة&z=16&output=embed',
  },
];

export function GoogleMap() {
  const [active, setActive] = useState(0);

  return (
    <section id="map" className="py-24 relative">
      <div className="max-w-6xl mx-auto px-6 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-afaq-teal/10 text-afaq-teal font-bold text-sm tracking-wider border border-afaq-teal/20 mb-4">
            مواقعنا
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white">
            نحن <span className="text-afaq-gold">قريبون منك</span>
          </h2>
        </motion.div>

        <div className="flex justify-center gap-3 mb-8">
          {locations.map((loc, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                active === i
                  ? 'bg-afaq-gold text-afaq-bg'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:border-afaq-gold/30'
              }`}>
              <MapPin size={14} className="inline-block ml-1" />
              {loc.city} — {loc.country}
            </button>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={active}
          className="rounded-3xl overflow-hidden border border-white/[0.06] shadow-2xl">
          <iframe
            title={`خريطة ${locations[active].city}`}
            src={locations[active].embed}
            width="100%"
            height="400"
            style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full"
          />
        </motion.div>

        <div className="mt-4 text-center">
          <p className="text-white/40 text-sm">{locations[active].address}</p>
        </div>
      </div>
    </section>
  );
}
