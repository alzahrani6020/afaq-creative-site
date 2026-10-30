'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { faqs } from '@/lib/faqs';


export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 relative">
      <div className="max-w-3xl mx-auto px-6 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-afaq-teal/10 text-afaq-teal font-bold text-sm tracking-wider border border-afaq-teal/20 mb-4">
            الأسئلة الشائعة
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white">
            كل ما تريد <span className="text-afaq-gold">معرفته</span>
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className={`w-full flex items-center justify-between gap-4 p-5 rounded-2xl text-right transition-all ${
                  openIndex === i
                    ? 'bg-afaq-blue/10 border border-afaq-blue/20'
                    : 'bg-white/[0.03] border border-white/[0.06] hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <HelpCircle size={18} className="text-afaq-gold flex-shrink-0" />
                  <span className="text-white font-semibold text-sm">{faq.q}</span>
                </div>
                <ChevronDown
                  size={18}
                  className={`text-white/40 flex-shrink-0 transition-transform ${openIndex === i ? 'rotate-180' : ''}`}
                />
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 pt-2 text-white/50 text-sm leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
