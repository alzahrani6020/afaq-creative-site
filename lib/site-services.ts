export interface SiteService {
  slug: string;
  title: string;
  description: string;
  tags: string[];
}

export const siteServices: SiteService[] = [
  {
    slug: 'visual-production',
    title: 'إنتاج مرئي وسينمائي',
    description: 'أفلام إعلانية، فيديوهات ترويجية، موشن جرافيك، مونتاج احترافي، VFX وColor Grading',
    tags: ['تصوير', 'مونتاج', 'موشن جرافيك'],
  },
  {
    slug: 'professional-photography',
    title: 'التصوير الاحترافي',
    description: 'تصوير منتجات، بورتريه، فعاليات، عقارات، وتأجير استديوهات مجهزة بالكامل',
    tags: ['استديوهات', 'تأجير معدات', 'تصوير جوي'],
  },
  {
    slug: 'visual-identity',
    title: 'هوية بصرية',
    description: 'تصميم شعارات، هويات تجارية متكاملة، دليل استخدام، وتصميمات مطبوعة',
    tags: ['لوجو', 'هوية', 'براندينج'],
  },
  {
    slug: 'digital-content',
    title: 'محتوى رقمي',
    description: 'إدارة حسابات التواصل، إنتاج المحتوى الإلكتروني، بودكاست وريلز',
    tags: ['سوشال ميديا', 'بودكاست', 'محتوى يومي'],
  },
  {
    slug: 'web-design-development',
    title: 'تصميم وتطوير مواقع',
    description: 'مواقع تعريفية، متاجر إلكترونية، تطبيقات ويب، UI/UX',
    tags: ['ويب', 'تطبيقات', 'UI/UX'],
  },
  {
    slug: 'mobile-app-development',
    title: 'تطوير تطبيقات الموبايل',
    description: 'تطبيقات iOS وAndroid، تطبيقات إدارة، تطبيقات ذكية',
    tags: ['iOS', 'Android', 'Flutter'],
  },
  {
    slug: 'software-solutions',
    title: 'حلول تقنية وبرمجية',
    description: 'تطوير البرامج، قواعد البيانات، أنظمة ERP/CRM، رقمنة',
    tags: ['برمجة', 'رقمنة', 'أنظمة إدارة'],
  },
  {
    slug: 'artificial-intelligence',
    title: 'الذكاء الاصطناعي',
    description: 'حلول AI مخصصة، chatbots، معالجة اللغة الطبيعية، تحليل البيانات',
    tags: ['AI', 'Chatbots', 'NLP'],
  },
  {
    slug: 'telecom-networks',
    title: 'شبكات الاتصالات',
    description: 'تصميم وإدارة شبكات نقل الصوت والصورة والبيانات، خدمات الإنترنت',
    tags: ['شبكات', 'نقل البيانات'],
  },
  {
    slug: 'events-talents',
    title: 'إدارة فعاليات ومواهب',
    description: 'تنظيم مؤتمرات، حفلات تدشين، مهرجانات، كاستينج واكتشاف مواهب',
    tags: ['مؤتمرات', 'كاستينج', 'تنظيم'],
  },
  {
    slug: 'training-development',
    title: 'تدريب وتأهيل',
    description: 'مراكز تدريب مهارات الموارد البشرية، دورات تقنية، تصوير ومونتاج',
    tags: ['دورات', 'تأهيل', 'مهارات'],
  },
  {
    slug: 'consulting-entrepreneurship',
    title: 'استشارات وريادة أعمال',
    description: 'حاضنات أعمال تكنولوجية، دراسات متخصصة في IT، استشارات تقنية',
    tags: ['حاضنات', 'دراسات', 'استشارات'],
  },
  {
    slug: 'licensed-media-content',
    title: 'إنتاج محتوى إعلامي مرخص',
    description: 'إنتاج المحتوى الإعلامي المرئي والمسموع المرخص من GCAM',
    tags: ['GCAM', 'إعلام', 'إذاعي'],
  },
  {
    slug: 'data-analysis-research',
    title: 'تحليل بيانات وبحث علمي',
    description: 'مشروعات البحث والتطوير العلمي، تحليل البيانات، مراكز استشارات',
    tags: ['R&D', 'تحليل', 'بحث'],
  },
  {
    slug: 'paid-advertising',
    title: 'حملات إعلانية ممولة',
    description: 'إدارة حملات جوجل، ميتا، سناب، تيك توك — مع تحليل أداء',
    tags: ['Google', 'Meta', 'TikTok'],
  },
];

export function getSiteService(slug: string): SiteService | undefined {
  return siteServices.find((service) => service.slug === slug);
}
