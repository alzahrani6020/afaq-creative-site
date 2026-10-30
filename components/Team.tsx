'use client';

import { motion } from 'framer-motion';
import { Award, Briefcase, GraduationCap, Globe } from 'lucide-react';

const team = [
  {
    name: 'الدكتور طلال بن حسن بن محمد الزهراني',
    role: 'المدير العام & المؤسس',
    image: '/assets/dr-talal.jpg',
    stats: [
      { icon: Briefcase, label: 'الخبرة', value: '+20 سنة' },
      { icon: Award, label: 'التراخيص', value: '4 رسمية' },
      { icon: Globe, label: 'الفروع', value: '2 دولة' },
      { icon: GraduationCap, label: 'التخصص', value: 'فنون بصرية' },
    ],
    bio: 'يقود الدكتور طلال بن حسن الزهراني مؤسسة أفاق إبداعية للفنون البصرية بخبرة تزيد عن 20 عاماً في صناعة الإبداع والإعلام. حاصل على تراخيص رسمية من الهيئة العامة للإعلام المرئي والمسموع (GCAM) وهيئة الترفيه السعودية (GEA)، ويسعى لبناء جسر إبداعي بين السعودية ومصر.',
  },
];

export function Team() {
  return (
    <section id="team" className="py-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-afaq-gold/5 rounded-full blur-[150px]" />
      <div className="max-w-5xl mx-auto px-6 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-afaq-blue/10 text-afaq-blue font-bold text-sm tracking-wider border border-afaq-blue/20 mb-4">
            الفريق القيادي
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white">
            من يقود <span className="text-afaq-gold">الإبداع</span>
          </h2>
        </motion.div>

        {team.map((member) => (
          <motion.div key={member.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center gap-10 p-8 md:p-12 rounded-3xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex-shrink-0">
              <div className="w-40 h-40 md:w-52 md:h-52 rounded-3xl overflow-hidden border-2 border-afaq-gold/30 shadow-2xl shadow-afaq-gold/10 bg-gradient-to-br from-afaq-gold/20 to-afaq-blue/20 flex items-center justify-center">
                {member.image && member.image !== '/assets/afaq-logo-v4.png' ? (
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-afaq-gold to-afaq-teal bg-clip-text text-transparent">
                    ط.ز
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 text-center md:text-right">
              <h3 className="text-2xl md:text-3xl font-extrabold text-white">{member.name}</h3>
              <p className="text-afaq-gold font-semibold mt-2">{member.role}</p>
              <p className="text-white/50 text-sm leading-relaxed mt-4">{member.bio}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                {member.stats.map((stat) => (
                  <div key={stat.label} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                    <stat.icon size={18} className="text-afaq-gold mx-auto mb-1" />
                    <div className="text-white font-bold text-sm">{stat.value}</div>
                    <div className="text-white/30 text-[10px]">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
