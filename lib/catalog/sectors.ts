import { SectorOption, ProfileType } from './types';

export const profileTypes: ProfileType[] = [
  'حرفي',
  'فني',
  'مهني',
  'متخصص',
  'موهوب',
  'مبدع',
  'خبير / مستشار',
  'مقدم خدمة',
];

export const sectors: SectorOption[] = [
  {
    id: 'MANUAL_TRADES',
    labelAr: 'عمالة يدوية وحرف',
    labelEn: 'Manual Trades & Crafts',
    aliases: ['عمالة-يدوية'],
    profileTypes: ['حرفي', 'فني'],
  },
  {
    id: 'TECHNICAL_SERVICES',
    labelAr: 'خدمات تقنية',
    labelEn: 'Technical Services',
    aliases: ['خدمات-تقنية'],
    profileTypes: ['فني', 'متخصص'],
  },
  {
    id: 'CREATIVE_MEDIA',
    labelAr: 'إعلام وإبداع',
    labelEn: 'Creative & Media',
    aliases: ['إعلام-وإبداع'],
    profileTypes: ['مبدع', 'موهوب'],
  },
  {
    id: 'PROFESSIONAL_SERVICES',
    labelAr: 'مهن احترافية',
    labelEn: 'Professional Services',
    aliases: ['مهن-احترافية'],
    profileTypes: ['مهني', 'متخصص', 'خبير / مستشار'],
  },
  {
    id: 'CARE_GIVING',
    labelAr: 'رعاية وصحة',
    labelEn: 'Caregiving & Health',
    aliases: ['رعاية-وصحة'],
    profileTypes: ['مقدم خدمة', 'متخصص'],
  },
  {
    id: 'TOURISM_HOSPITALITY',
    labelAr: 'سياحة وضيافة',
    labelEn: 'Tourism & Hospitality',
    aliases: ['سياحة-وضيافة'],
    profileTypes: ['مقدم خدمة', 'مهني'],
  },
  {
    id: 'BEAUTY_WELLNESS',
    labelAr: 'جمال وعناية',
    labelEn: 'Beauty & Wellness',
    aliases: ['جمال-وعناية'],
    profileTypes: ['حرفي', 'مقدم خدمة'],
  },
  {
    id: 'TRADITIONAL_CRAFTS',
    labelAr: 'حرف تراثية وتقليدية',
    labelEn: 'Traditional & Heritage Crafts',
    aliases: ['حرف-تراثية'],
    profileTypes: ['حرفي', 'مبدع'],
  },
  {
    id: 'FOOD_BEVERAGE',
    labelAr: 'طعام ومشروبات',
    labelEn: 'Food & Beverage',
    aliases: ['طعام-ومشروبات'],
    profileTypes: ['حرفي', 'مقدم خدمة'],
  },
  {
    id: 'AGRICULTURE_ANIMALS',
    labelAr: 'زراعة وحيوانات',
    labelEn: 'Agriculture & Animals',
    aliases: ['زراعة-وحيوانات'],
    profileTypes: ['حرفي', 'مهني'],
  },
  {
    id: 'PERFORMING_ARTS',
    labelAr: 'فنون أدائية',
    labelEn: 'Performing Arts',
    aliases: ['فنون-أدائية'],
    profileTypes: ['موهوب', 'مبدع'],
  },
  {
    id: 'SPORTS_FITNESS',
    labelAr: 'رياضة ولياقة',
    labelEn: 'Sports & Fitness',
    aliases: ['رياضة-ولياقة'],
    profileTypes: ['موهوب', 'متخصص'],
  },
  {
    id: 'EDUCATION_TRAINING',
    labelAr: 'تعليم وتدريب',
    labelEn: 'Education & Training',
    aliases: ['تعليم-وتدريب'],
    profileTypes: ['مهني', 'متخصص', 'خبير / مستشار'],
  },
  {
    id: 'MANAGEMENT_CONSULTING',
    labelAr: 'إدارة واستشارات',
    labelEn: 'Management & Consulting',
    aliases: ['إدارة-واستشارات'],
    profileTypes: ['مهني', 'خبير / مستشار'],
  },
  {
    id: 'SECURITY_SERVICES',
    labelAr: 'خدمات أمنية',
    labelEn: 'Security Services',
    aliases: ['خدمات-أمنية'],
    profileTypes: ['مهني', 'مقدم خدمة'],
  },
  {
    id: 'DOMESTIC_SERVICES',
    labelAr: 'خدمات منزلية',
    labelEn: 'Domestic Services',
    aliases: ['خدمات-منزلية'],
    profileTypes: ['مقدم خدمة', 'مهني'],
  },
  {
    id: 'VEHICLES_TRANSPORT',
    labelAr: 'مركبات ونقل',
    labelEn: 'Vehicles & Transport',
    aliases: ['مركبات-ونقل'],
    profileTypes: ['فني', 'مهني', 'مقدم خدمة'],
  },
];

function normalizeLookup(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ـ/g, '')
    .replace(/[-_]/g, '')
    .replace(/\s+/g, '');
}

export function getSector(id: string): SectorOption | undefined {
  if (!id) return undefined;
  const byId = sectors.find((s) => s.id === id);
  if (byId) return byId;
  const q = normalizeLookup(id);
  return sectors.find((s) => {
    if (normalizeLookup(s.labelAr) === q) return true;
    if (normalizeLookup(s.labelEn) === q) return true;
    return (s.aliases ?? []).some((a) => normalizeLookup(a) === q);
  });
}

export function getProfileTypesForSector(id: string): ProfileType[] {
  return getSector(id)?.profileTypes ?? [];
}

export { getProfession } from './professions';
