'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Mail, FileCheck, Trash2 } from 'lucide-react';
import Link from 'next/link';

const sections = [
  {
    icon: Eye,
    title: 'المعلومات التي نجمعها',
    content: `نحن نجمع المعلومات التي تقدمها لنا مباشرة عند التواصل معنا أو ملء نماذج الاستفسار، بما في ذلك: الاسم، رقم الجوال، البريد الإلكتروني، ونوع الخدمة المطلوبة. كما نجمع بيانات الاستخدام التقنية مثل عنوان IP ونوع المتصفح عبر Google Analytics (عند تفعيله).`,
  },
  {
    icon: Lock,
    title: 'كيف نستخدم معلوماتك',
    content: `نستخدم معلوماتك للرد على استفساراتك، تقديم عروض الأسعار، إدارة مشاريعك، وتحسين خدماتنا. لن نقوم ببيع أو تأجير بياناتك الشخصية لأي طرف ثالث.`,
  },
  {
    icon: Shield,
    title: 'حماية البيانات',
    content: `نتخذ إجراءات أمنية مناسبة لحماية بياناتك من الوصول غير المصرح به أو التغيير أو الإفصاح. يتم تخزين البيانات على خوادم آمنة مع تشفير SSL.`,
  },
  {
    icon: FileCheck,
    title: 'الملفات والمواد الإبداعية',
    content: `جميع المواد الإبداعية (فيديوهات، تصاميم، صور) التي ننتجها تكون ملكية للعميل بعد سداد كامل المبلغ المتفق عليه. نحتفظ بالحق في استخدام الأعمال في معرضنا التجاري إلا إذا تم الاتفاق على خلاف ذلك كتابياً.`,
  },
  {
    icon: Trash2,
    title: 'حقوقك وحذف البيانات',
    content: `لديك الحق في الوصول إلى بياناتك الشخصية، تصحيحها، أو طلب حذفها. يمكنك طلب حذف بياناتك في أي وقت عبر صفحة "حذف الحساب" أو بالتواصل المباشر معنا.`,
  },
  {
    icon: Mail,
    title: 'التواصل معنا',
    content: `لأي استفسارات متعلقة بالخصوصية، يمكنك التواصل معنا عبر البريد: privacy@bonds-global.com أو الواتساب: +966 56 756 6616`,
  },
];

export default function PrivacyPage() {
  return (
    <main className="bg-afaq-bg min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-afaq-gold/10 text-afaq-gold font-bold text-sm border border-afaq-gold/20 mb-4">
            <Shield size={14} className="inline-block ml-1" />
            سياسة الخصوصية
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white">
            خصوصيتك <span className="text-afaq-gold">تُهمنا</span>
          </h1>
          <p className="mt-4 text-white/40">
            آخر تحديث: ٢٠ مايو ٢٠٢٥
          </p>
        </motion.div>

        <div className="space-y-8">
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-3xl bg-white/[0.03] border border-white/[0.06]"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-afaq-gold/10 flex items-center justify-center">
                  <section.icon size={20} className="text-afaq-gold" />
                </div>
                <h2 className="text-xl font-bold text-white">{section.title}</h2>
              </div>
              <p className="text-white/50 leading-relaxed">{section.content}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-center"
        >
          <Link
            href="/delete-account"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-afaq-gold hover:border-afaq-gold/30 transition-all"
          >
            <Trash2 size={16} />
            طلب حذف البيانات
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
