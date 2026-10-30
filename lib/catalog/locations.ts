import { CountryOption } from './types';

export const countryDialCodes: Record<string, string> = {
  SA: '966',
  EG: '20',
  AE: '971',
  KW: '965',
  BH: '973',
  QA: '974',
  OM: '968',
  JO: '962',
  LB: '961',
};

export const countries: CountryOption[] = [
  {
    value: 'SA',
    label: 'السعودية',
    dialCode: '966',
    flag: '🇸🇦',
    regions: [
      {
        value: 'makkah',
        label: 'منطقة مكة المكرمة',
        cities: [
          { value: 'jeddah', label: 'جدة' },
          { value: 'makkah', label: 'مكة المكرمة' },
          { value: 'taif', label: 'الطائف' },
        ],
      },
      {
        value: 'riyadh',
        label: 'منطقة الرياض',
        cities: [
          { value: 'riyadh', label: 'الرياض' },
          { value: 'kharj', label: 'الخرج' },
        ],
      },
      {
        value: 'eastern',
        label: 'المنطقة الشرقية',
        cities: [
          { value: 'dammam', label: 'الدمام' },
          { value: 'khobar', label: 'الخبر' },
          { value: 'dhahran', label: 'الظهران' },
        ],
      },
      {
        value: 'asir',
        label: 'منطقة عسير',
        cities: [
          { value: 'abha', label: 'أبها' },
          { value: 'khamis', label: 'خميس مشيط' },
        ],
      },
    ],
  },
  {
    value: 'EG',
    label: 'مصر',
    dialCode: '20',
    flag: '🇪🇬',
    regions: [
      {
        value: 'cairo',
        label: 'القاهرة',
        cities: [
          { value: 'cairo', label: 'القاهرة' },
          { value: 'new-cairo', label: 'القاهرة الجديدة' },
          { value: 'nasr-city', label: 'مدينة نصر' },
        ],
      },
      {
        value: 'giza',
        label: 'الجيزة',
        cities: [
          { value: 'october', label: '6 أكتوبر' },
          { value: 'sheikh-zayed', label: 'الشيخ زايد' },
          { value: 'haram', label: 'الهرم' },
        ],
      },
      {
        value: 'alexandria',
        label: 'الإسكندرية',
        cities: [{ value: 'alexandria', label: 'الإسكندرية' }],
      },
      {
        value: 'delta',
        label: 'الدلتا',
        cities: [
          { value: 'mansoura', label: 'المنصورة' },
          { value: 'tanta', label: 'طنطا' },
          { value: 'zagazig', label: 'الزقازيق' },
        ],
      },
    ],
  },
  {
    value: 'AE',
    label: 'الإمارات العربية المتحدة',
    dialCode: '971',
    flag: '🇦🇪',
    regions: [
      {
        value: 'dubai',
        label: 'دبي',
        cities: [{ value: 'dubai', label: 'دبي' }],
      },
      {
        value: 'abu-dhabi',
        label: 'أبوظبي',
        cities: [{ value: 'abu-dhabi', label: 'أبوظبي' }],
      },
      {
        value: 'sharjah',
        label: 'الشارقة',
        cities: [{ value: 'sharjah', label: 'الشارقة' }],
      },
      {
        value: 'ajman',
        label: 'عجمان',
        cities: [{ value: 'ajman', label: 'عجمان' }],
      },
    ],
  },
  {
    value: 'KW',
    label: 'الكويت',
    dialCode: '965',
    flag: '🇰🇼',
    regions: [
      {
        value: 'kuwait-city',
        label: 'محافظة العاصمة',
        cities: [{ value: 'kuwait-city', label: 'مدينة الكويت' }],
      },
      {
        value: 'hawalli',
        label: 'محافظة حولي',
        cities: [{ value: 'hawalli', label: 'حولي' }],
      },
      {
        value: 'al-ahmadi',
        label: 'محافظة الأحمدي',
        cities: [{ value: 'al-ahmadi', label: 'الأحمدي' }],
      },
    ],
  },
  {
    value: 'BH',
    label: 'البحرين',
    dialCode: '973',
    flag: '🇧🇭',
    regions: [
      {
        value: 'capital',
        label: 'محافظة العاصمة',
        cities: [{ value: 'manama', label: 'المنامة' }],
      },
      {
        value: 'muharraq',
        label: 'محافظة المحرق',
        cities: [{ value: 'muharraq', label: 'المحرق' }],
      },
      {
        value: 'northern',
        label: 'المحافظة الشمالية',
        cities: [{ value: 'riffa', label: 'الرفاع' }],
      },
    ],
  },
  {
    value: 'QA',
    label: 'قطر',
    dialCode: '974',
    flag: '🇶🇦',
    regions: [
      {
        value: 'doha',
        label: 'الدوحة',
        cities: [{ value: 'doha', label: 'الدوحة' }],
      },
      {
        value: 'al-rayyan',
        label: 'الريان',
        cities: [{ value: 'al-rayyan', label: 'الريان' }],
      },
      {
        value: 'al-wakrah',
        label: 'الوكرة',
        cities: [{ value: 'al-wakrah', label: 'الوكرة' }],
      },
    ],
  },
  {
    value: 'OM',
    label: 'عمان',
    dialCode: '968',
    flag: '🇴🇲',
    regions: [
      {
        value: 'muscat',
        label: 'محافظة مسقط',
        cities: [{ value: 'muscat', label: 'مسقط' }],
      },
      {
        value: 'dhofar',
        label: 'محافظة ظفار',
        cities: [{ value: 'salalah', label: 'صلالة' }],
      },
      {
        value: 'al-batinah',
        label: 'محافظة شمال الباطنة',
        cities: [{ value: 'sohar', label: 'صحار' }],
      },
    ],
  },
  {
    value: 'JO',
    label: 'الأردن',
    dialCode: '962',
    flag: '🇯🇴',
    regions: [
      {
        value: 'amman',
        label: 'عمان',
        cities: [
          { value: 'amman', label: 'عمان' },
          { value: 'jubeiha', label: 'الجبيهة' },
        ],
      },
      {
        value: 'zarqa',
        label: 'الزرقاء',
        cities: [{ value: 'zarqa', label: 'الزرقاء' }],
      },
      {
        value: 'irbid',
        label: 'إربد',
        cities: [{ value: 'irbid', label: 'إربد' }],
      },
    ],
  },
  {
    value: 'LB',
    label: 'لبنان',
    dialCode: '961',
    flag: '🇱🇧',
    regions: [
      {
        value: 'beirut',
        label: 'بيروت',
        cities: [{ value: 'beirut', label: 'بيروت' }],
      },
      {
        value: 'mount-lebanon',
        label: 'جبل لبنان',
        cities: [{ value: 'jounieh', label: 'جونيه' }],
      },
      {
        value: 'north',
        label: ' الشمال',
        cities: [{ value: 'tripoli', label: 'طرابلس' }],
      },
    ],
  },
];

export function getCountry(value: string): CountryOption | undefined {
  return countries.find((c) => c.value === value);
}

export function getRegion(countryValue: string, regionValue: string) {
  const country = getCountry(countryValue);
  if (!country) return undefined;
  return country.regions.find((r) => r.value === regionValue);
}

export function getCity(countryValue: string, regionValue: string, cityValue: string) {
  const region = getRegion(countryValue, regionValue);
  if (!region) return undefined;
  return region.cities.find((c) => c.value === cityValue);
}
