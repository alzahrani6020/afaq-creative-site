'use client';

import { motion } from 'framer-motion';
import { FileCheck, UserCheck, BriefcaseBusiness, ShieldAlert, Copyright, Link2, Scale, RefreshCw, Mail } from 'lucide-react';
import Link from 'next/link';

const sections = [
  {
    icon: FileCheck,
    title: 'قبول الشروط',
    content: 'باستخدام موقع أفاق إبداعية أو إرسال نموذج أو طلب عبره، فإنك تقر بأنك قرأت هذه الشروط وسياسة الخصوصية وفهمتهما. إذا كنت لا توافق على الشروط التي تتطلب موافقتك فلا تستخدم النموذج أو الوظيفة ذات الصلة.',
  },
  {
    icon: UserCheck,
    title: 'الأهلية وصحة المعلومات',
    content: 'تتعهد بتقديم معلومات صحيحة وحديثة ومشروعة، وألا تنتحل صفة شخص آخر أو تقدم بيانات لا تملك حق استخدامها. يجوز رفض أو تعليق أو حذف طلب يحتوي بيانات مضللة أو مخالفة أو غير قابلة للتحقق، مع مراعاة الأنظمة واجبة التطبيق.',
  },
  {
    icon: BriefcaseBusiness,
    title: 'منظومة المواهب والخبرات',
    content: 'التسجيل في منظومة المواهب والخبرات يهدف إلى إنشاء ملف مهني وتقييمه وإدارة التواصل وربطه بفرص محتملة. التسجيل لا يشكل عرض عمل أو عقد توظيف أو ضمانًا للحصول على مشروع أو عميل أو فرصة أو دخل. أي علاقة لاحقة تخضع لاتفاق مستقل يحدد النطاق والأتعاب والمسؤوليات عند الحاجة.',
  },
  {
    icon: ShieldAlert,
    title: 'الاستخدام المقبول',
    content: 'يُحظر استخدام الموقع للإضرار بالآخرين، إرسال محتوى غير مشروع أو ضار، رفع ملفات خبيثة، محاولة تجاوز الحماية أو الوصول غير المصرح به، جمع بيانات المستخدمين آليًا دون تصريح، أو استخدام الخدمة بطريقة تخالف الأنظمة أو حقوق الغير.',
  },
  {
    icon: Copyright,
    title: 'المحتوى والملكية الفكرية',
    content: 'تبقى حقوق الموقع والعلامات والتصميمات والنصوص والبرمجيات والمحتوى المملوك لأفاق أو المرخص لها محفوظة لأصحابها. يحتفظ المتقدم بحقوقه في المواد التي يرفعها، ويمنح أفاق حقًا محدودًا بالقدر اللازم لاستلامها وتخزينها ومراجعتها واستخدامها لأغراض الطلب أو الخدمة أو الربط بالفرص التي وافق عليها.',
  },
  {
    icon: Link2,
    title: 'الخدمات والروابط الخارجية',
    content: 'قد يتضمن الموقع روابط أو تكاملات مع خدمات خارجية مثل Google وWhatsApp ومزودي الاستضافة والبريد. تخضع تلك الخدمات لشروطها وسياساتها المستقلة، ولا تعني الإشارة إليها تحمل أفاق مسؤولية أعمالها خارج نطاق ما تفرضه الأنظمة على أفاق.',
  },
  {
    icon: Scale,
    title: 'المسؤولية وحدود الخدمة',
    content: 'نبذل عناية معقولة في تشغيل الموقع وحماية البيانات والمحافظة على توفر الخدمة، لكن قد تحدث انقطاعات أو أخطاء أو أعمال صيانة خارجة عن السيطرة المعقولة. لا تحد هذه الشروط أي مسؤولية لا يجوز نظامًا استبعادها أو تقييدها، ولا تمنع صاحب الحق من ممارسة حقوقه النظامية.',
  },
  {
    icon: Scale,
    title: 'الخدمات المدفوعة والعقود',
    content: 'لا تُعد المعلومات العامة أو النماذج على الموقع عرض سعر نهائيًا ما لم ينص على ذلك صراحة. الخدمات المدفوعة والمشاريع الإنتاجية والاستشارية والتنفيذية تخضع لنطاق عمل وعرض أو عقد أو فاتورة مستقلة يحدد السعر والمدة والتسليم وحقوق الاستخدام وشروط الإلغاء.',
  },
  {
    icon: RefreshCw,
    title: 'التعديل على الشروط',
    content: 'يجوز تحديث هذه الشروط عند تغير الخدمات أو المتطلبات النظامية أو التشغيلية. يظهر تاريخ آخر تحديث في هذه الصفحة. إذا كان التغيير جوهريًا على معالجة تتطلب موافقة جديدة، فسيتم طلب الموافقة بالطريقة المناسبة قبل تطبيقه على تلك المعالجة.',
  },
  {
    icon: Scale,
    title: 'الأنظمة الواجبة التطبيق',
    content: 'تُفسر هذه الشروط وتطبق وفق الأنظمة التي تحكم الخدمة أو المعاملة محل النزاع بحسب الجهة المشغلة ومكان تقديم الخدمة والاتفاق المستقل إن وجد، دون الإخلال بالاختصاصات والحقوق الإلزامية التي لا يجوز الاتفاق على خلافها.',
  },
  {
    icon: Mail,
    title: 'التواصل',
    content: 'للاستفسارات المتعلقة بالشروط أو الخدمة استخدم وسائل التواصل المنشورة في الموقع، ومنها البريد info@bonds-global.com ورقم +966 56 756 6616.',
  },
];

export default function TermsPage() {
  return (
    <main className="bg-afaq-bg min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-32">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-afaq-gold/10 text-afaq-gold font-bold text-sm border border-afaq-gold/20 mb-4">
            <FileCheck size={14} className="inline-block ml-1" />
            الشروط والأحكام
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white">
            شروط استخدام <span className="text-afaq-gold">أفاق إبداعية</span>
          </h1>
          <p className="mt-4 text-white/40">آخر تحديث: ١ نوفمبر ٢٠٢٦</p>
        </motion.div>

        <div className="space-y-8">
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.35) }}
              className="p-8 rounded-3xl bg-white/[0.03] border border-white/[0.06]"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-afaq-gold/10 flex items-center justify-center">
                  <section.icon size={20} className="text-afaq-gold" />
                </div>
                <h2 className="text-xl font-bold text-white">{section.title}</h2>
              </div>
              <p className="text-white/55 leading-relaxed">{section.content}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/privacy" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-afaq-gold hover:border-afaq-gold/30 transition-all">
            <FileCheck size={16} />
            سياسة الخصوصية
          </Link>
        </div>
      </div>
    </main>
  );
}
