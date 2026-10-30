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
  IQ: '964',
  SY: '963',
  PS: '970',
  YE: '967',
  MA: '212',
  DZ: '213',
  TN: '216',
  LY: '218',
  SD: '249',
  SO: '252',
  DJ: '253',
  KM: '269',
  MR: '222',
};

export const countries: CountryOption[] = [
  {
    value: 'SA', label: 'السعودية', labelEn: 'Saudi Arabia', iso3: 'SAU', dialCode: '966', flag: '🇸🇦',
    currency: 'SAR', timezones: ['Asia/Riyadh'], regionGroup: 'gcc', aliases: ['KSA', 'Saudi', 'السعودية'], status: 'active',
    regions: [
      { value: 'makkah', label: 'منطقة مكة المكرمة', cities: [{ value: 'jeddah', label: 'جدة' }, { value: 'makkah', label: 'مكة المكرمة' }, { value: 'taif', label: 'الطائف' }] },
      { value: 'riyadh', label: 'منطقة الرياض', cities: [{ value: 'riyadh', label: 'الرياض' }, { value: 'kharj', label: 'الخرج' }] },
      { value: 'eastern', label: 'المنطقة الشرقية', cities: [{ value: 'dammam', label: 'الدمام' }, { value: 'khobar', label: 'الخبر' }, { value: 'dhahran', label: 'الظهران' }] },
      { value: 'asir', label: 'منطقة عسير', cities: [{ value: 'abha', label: 'أبها' }, { value: 'khamis', label: 'خميس مشيط' }] },
    ],
  },
  {
    value: 'EG', label: 'مصر', labelEn: 'Egypt', iso3: 'EGY', dialCode: '20', flag: '🇪🇬',
    currency: 'EGP', timezones: ['Africa/Cairo'], regionGroup: 'nile', aliases: ['Egypt', 'مصر'], status: 'active',
    regions: [
      { value: 'cairo', label: 'القاهرة', cities: [{ value: 'cairo', label: 'القاهرة' }, { value: 'new-cairo', label: 'القاهرة الجديدة' }, { value: 'nasr-city', label: 'مدينة نصر' }] },
      { value: 'giza', label: 'الجيزة', cities: [{ value: 'october', label: '6 أكتوبر' }, { value: 'sheikh-zayed', label: 'الشيخ زايد' }, { value: 'haram', label: 'الهرم' }] },
      { value: 'alexandria', label: 'الإسكندرية', cities: [{ value: 'alexandria', label: 'الإسكندرية' }] },
      { value: 'delta', label: 'الدلتا', cities: [{ value: 'mansoura', label: 'المنصورة' }, { value: 'tanta', label: 'طنطا' }, { value: 'zagazig', label: 'الزقازيق' }] },
    ],
  },
  {
    value: 'AE', label: 'الإمارات العربية المتحدة', labelEn: 'United Arab Emirates', iso3: 'ARE', dialCode: '971', flag: '🇦🇪',
    currency: 'AED', timezones: ['Asia/Dubai'], regionGroup: 'gcc', aliases: ['UAE', 'الإمارات'], status: 'active',
    regions: [
      { value: 'dubai', label: 'دبي', cities: [{ value: 'dubai', label: 'دبي' }] },
      { value: 'abu-dhabi', label: 'أبوظبي', cities: [{ value: 'abu-dhabi', label: 'أبوظبي' }, { value: 'al-ain', label: 'العين' }] },
      { value: 'sharjah', label: 'الشارقة', cities: [{ value: 'sharjah', label: 'الشارقة' }] },
      { value: 'ajman', label: 'عجمان', cities: [{ value: 'ajman', label: 'عجمان' }] },
    ],
  },
  {
    value: 'KW', label: 'الكويت', labelEn: 'Kuwait', iso3: 'KWT', dialCode: '965', flag: '🇰🇼',
    currency: 'KWD', timezones: ['Asia/Kuwait'], regionGroup: 'gcc', status: 'active',
    regions: [
      { value: 'capital', label: 'محافظة العاصمة', cities: [{ value: 'kuwait-city', label: 'مدينة الكويت' }] },
      { value: 'hawalli', label: 'محافظة حولي', cities: [{ value: 'hawalli', label: 'حولي' }] },
      { value: 'ahmadi', label: 'محافظة الأحمدي', cities: [{ value: 'al-ahmadi', label: 'الأحمدي' }] },
    ],
  },
  {
    value: 'BH', label: 'البحرين', labelEn: 'Bahrain', iso3: 'BHR', dialCode: '973', flag: '🇧🇭',
    currency: 'BHD', timezones: ['Asia/Bahrain'], regionGroup: 'gcc', status: 'active',
    regions: [
      { value: 'capital', label: 'محافظة العاصمة', cities: [{ value: 'manama', label: 'المنامة' }] },
      { value: 'muharraq', label: 'محافظة المحرق', cities: [{ value: 'muharraq', label: 'المحرق' }] },
      { value: 'northern', label: 'المحافظة الشمالية', cities: [{ value: 'riffa', label: 'الرفاع' }] },
    ],
  },
  {
    value: 'QA', label: 'قطر', labelEn: 'Qatar', iso3: 'QAT', dialCode: '974', flag: '🇶🇦',
    currency: 'QAR', timezones: ['Asia/Qatar'], regionGroup: 'gcc', status: 'active',
    regions: [
      { value: 'doha', label: 'الدوحة', cities: [{ value: 'doha', label: 'الدوحة' }] },
      { value: 'rayyan', label: 'الريان', cities: [{ value: 'al-rayyan', label: 'الريان' }] },
      { value: 'wakrah', label: 'الوكرة', cities: [{ value: 'al-wakrah', label: 'الوكرة' }] },
    ],
  },
  {
    value: 'OM', label: 'عُمان', labelEn: 'Oman', iso3: 'OMN', dialCode: '968', flag: '🇴🇲',
    currency: 'OMR', timezones: ['Asia/Muscat'], regionGroup: 'gcc', status: 'active',
    regions: [
      { value: 'muscat', label: 'محافظة مسقط', cities: [{ value: 'muscat', label: 'مسقط' }] },
      { value: 'dhofar', label: 'محافظة ظفار', cities: [{ value: 'salalah', label: 'صلالة' }] },
      { value: 'north-batinah', label: 'محافظة شمال الباطنة', cities: [{ value: 'sohar', label: 'صحار' }] },
    ],
  },
  {
    value: 'JO', label: 'الأردن', labelEn: 'Jordan', iso3: 'JOR', dialCode: '962', flag: '🇯🇴',
    currency: 'JOD', timezones: ['Asia/Amman'], regionGroup: 'levant', status: 'active',
    regions: [
      { value: 'amman', label: 'عمّان', cities: [{ value: 'amman', label: 'عمّان' }, { value: 'jubeiha', label: 'الجبيهة' }] },
      { value: 'zarqa', label: 'الزرقاء', cities: [{ value: 'zarqa', label: 'الزرقاء' }] },
      { value: 'irbid', label: 'إربد', cities: [{ value: 'irbid', label: 'إربد' }] },
    ],
  },
  {
    value: 'LB', label: 'لبنان', labelEn: 'Lebanon', iso3: 'LBN', dialCode: '961', flag: '🇱🇧',
    currency: 'LBP', timezones: ['Asia/Beirut'], regionGroup: 'levant', status: 'active',
    regions: [
      { value: 'beirut', label: 'بيروت', cities: [{ value: 'beirut', label: 'بيروت' }] },
      { value: 'mount-lebanon', label: 'جبل لبنان', cities: [{ value: 'jounieh', label: 'جونيه' }, { value: 'baabda', label: 'بعبدا' }] },
      { value: 'north', label: 'الشمال', cities: [{ value: 'tripoli', label: 'طرابلس' }] },
    ],
  },
  {
    value: 'IQ', label: 'العراق', labelEn: 'Iraq', iso3: 'IRQ', dialCode: '964', flag: '🇮🇶',
    currency: 'IQD', timezones: ['Asia/Baghdad'], regionGroup: 'levant', status: 'active',
    regions: [
      { value: 'baghdad', label: 'بغداد', cities: [{ value: 'baghdad', label: 'بغداد' }] },
      { value: 'basra', label: 'البصرة', cities: [{ value: 'basra', label: 'البصرة' }] },
      { value: 'nineveh', label: 'نينوى', cities: [{ value: 'mosul', label: 'الموصل' }] },
      { value: 'erbil', label: 'أربيل', cities: [{ value: 'erbil', label: 'أربيل' }] },
    ],
  },
  {
    value: 'SY', label: 'سوريا', labelEn: 'Syria', iso3: 'SYR', dialCode: '963', flag: '🇸🇾',
    currency: 'SYP', timezones: ['Asia/Damascus'], regionGroup: 'levant', status: 'active',
    regions: [
      { value: 'damascus', label: 'دمشق', cities: [{ value: 'damascus', label: 'دمشق' }] },
      { value: 'aleppo', label: 'حلب', cities: [{ value: 'aleppo', label: 'حلب' }] },
      { value: 'homs', label: 'حمص', cities: [{ value: 'homs', label: 'حمص' }] },
      { value: 'latakia', label: 'اللاذقية', cities: [{ value: 'latakia', label: 'اللاذقية' }] },
    ],
  },
  {
    value: 'PS', label: 'فلسطين', labelEn: 'Palestine', iso3: 'PSE', dialCode: '970', flag: '🇵🇸',
    currency: 'ILS', timezones: ['Asia/Hebron', 'Asia/Gaza'], regionGroup: 'levant', status: 'active',
    regions: [
      { value: 'west-bank', label: 'الضفة الغربية', cities: [{ value: 'ramallah', label: 'رام الله' }, { value: 'nablus', label: 'نابلس' }, { value: 'hebron', label: 'الخليل' }] },
      { value: 'gaza', label: 'قطاع غزة', cities: [{ value: 'gaza-city', label: 'غزة' }, { value: 'khan-yunis', label: 'خان يونس' }] },
    ],
  },
  {
    value: 'YE', label: 'اليمن', labelEn: 'Yemen', iso3: 'YEM', dialCode: '967', flag: '🇾🇪',
    currency: 'YER', timezones: ['Asia/Aden'], regionGroup: 'levant', status: 'active',
    regions: [
      { value: 'sanaa', label: 'أمانة العاصمة', cities: [{ value: 'sanaa', label: 'صنعاء' }] },
      { value: 'aden', label: 'عدن', cities: [{ value: 'aden', label: 'عدن' }] },
      { value: 'taiz', label: 'تعز', cities: [{ value: 'taiz', label: 'تعز' }] },
      { value: 'hadramout', label: 'حضرموت', cities: [{ value: 'mukalla', label: 'المكلا' }] },
    ],
  },
  {
    value: 'MA', label: 'المغرب', labelEn: 'Morocco', iso3: 'MAR', dialCode: '212', flag: '🇲🇦',
    currency: 'MAD', timezones: ['Africa/Casablanca'], regionGroup: 'north-africa', status: 'active',
    regions: [
      { value: 'casablanca-settat', label: 'الدار البيضاء - سطات', cities: [{ value: 'casablanca', label: 'الدار البيضاء' }] },
      { value: 'rabat-sale-kenitra', label: 'الرباط - سلا - القنيطرة', cities: [{ value: 'rabat', label: 'الرباط' }, { value: 'sale', label: 'سلا' }] },
      { value: 'marrakech-safi', label: 'مراكش - آسفي', cities: [{ value: 'marrakech', label: 'مراكش' }] },
      { value: 'fes-meknes', label: 'فاس - مكناس', cities: [{ value: 'fes', label: 'فاس' }, { value: 'meknes', label: 'مكناس' }] },
    ],
  },
  {
    value: 'DZ', label: 'الجزائر', labelEn: 'Algeria', iso3: 'DZA', dialCode: '213', flag: '🇩🇿',
    currency: 'DZD', timezones: ['Africa/Algiers'], regionGroup: 'north-africa', status: 'active',
    regions: [
      { value: 'algiers', label: 'الجزائر', cities: [{ value: 'algiers', label: 'الجزائر العاصمة' }] },
      { value: 'oran', label: 'وهران', cities: [{ value: 'oran', label: 'وهران' }] },
      { value: 'constantine', label: 'قسنطينة', cities: [{ value: 'constantine', label: 'قسنطينة' }] },
      { value: 'annaba', label: 'عنابة', cities: [{ value: 'annaba', label: 'عنابة' }] },
    ],
  },
  {
    value: 'TN', label: 'تونس', labelEn: 'Tunisia', iso3: 'TUN', dialCode: '216', flag: '🇹🇳',
    currency: 'TND', timezones: ['Africa/Tunis'], regionGroup: 'north-africa', status: 'active',
    regions: [
      { value: 'tunis', label: 'تونس', cities: [{ value: 'tunis', label: 'تونس' }] },
      { value: 'sousse', label: 'سوسة', cities: [{ value: 'sousse', label: 'سوسة' }] },
      { value: 'sfax', label: 'صفاقس', cities: [{ value: 'sfax', label: 'صفاقس' }] },
    ],
  },
  {
    value: 'LY', label: 'ليبيا', labelEn: 'Libya', iso3: 'LBY', dialCode: '218', flag: '🇱🇾',
    currency: 'LYD', timezones: ['Africa/Tripoli'], regionGroup: 'north-africa', status: 'active',
    regions: [
      { value: 'tripoli', label: 'طرابلس', cities: [{ value: 'tripoli', label: 'طرابلس' }] },
      { value: 'benghazi', label: 'بنغازي', cities: [{ value: 'benghazi', label: 'بنغازي' }] },
      { value: 'misrata', label: 'مصراتة', cities: [{ value: 'misrata', label: 'مصراتة' }] },
    ],
  },
  {
    value: 'SD', label: 'السودان', labelEn: 'Sudan', iso3: 'SDN', dialCode: '249', flag: '🇸🇩',
    currency: 'SDG', timezones: ['Africa/Khartoum'], regionGroup: 'nile', status: 'active',
    regions: [
      { value: 'khartoum', label: 'الخرطوم', cities: [{ value: 'khartoum', label: 'الخرطوم' }, { value: 'omdurman', label: 'أم درمان' }] },
      { value: 'red-sea', label: 'البحر الأحمر', cities: [{ value: 'port-sudan', label: 'بورتسودان' }] },
      { value: 'gezira', label: 'الجزيرة', cities: [{ value: 'wad-madani', label: 'ود مدني' }] },
    ],
  },
  {
    value: 'SO', label: 'الصومال', labelEn: 'Somalia', iso3: 'SOM', dialCode: '252', flag: '🇸🇴',
    currency: 'SOS', timezones: ['Africa/Mogadishu'], regionGroup: 'horn-africa', status: 'active',
    regions: [
      { value: 'banaadir', label: 'بنادر', cities: [{ value: 'mogadishu', label: 'مقديشو' }] },
      { value: 'awdal', label: 'أودال', cities: [{ value: 'borama', label: 'بوراما' }] },
      { value: 'bari', label: 'باري', cities: [{ value: 'bosaso', label: 'بوصاصو' }] },
    ],
  },
  {
    value: 'DJ', label: 'جيبوتي', labelEn: 'Djibouti', iso3: 'DJI', dialCode: '253', flag: '🇩🇯',
    currency: 'DJF', timezones: ['Africa/Djibouti'], regionGroup: 'horn-africa', status: 'active',
    regions: [
      { value: 'djibouti', label: 'جيبوتي', cities: [{ value: 'djibouti-city', label: 'مدينة جيبوتي' }] },
      { value: 'ali-sabieh', label: 'علي صبيح', cities: [{ value: 'ali-sabieh', label: 'علي صبيح' }] },
    ],
  },
  {
    value: 'KM', label: 'جزر القمر', labelEn: 'Comoros', iso3: 'COM', dialCode: '269', flag: '🇰🇲',
    currency: 'KMF', timezones: ['Indian/Comoro'], regionGroup: 'horn-africa', status: 'active',
    regions: [
      { value: 'grande-comore', label: 'القمر الكبرى', cities: [{ value: 'moroni', label: 'موروني' }] },
      { value: 'anjouan', label: 'أنجوان', cities: [{ value: 'mutsamudu', label: 'موتسامودو' }] },
    ],
  },
  {
    value: 'MR', label: 'موريتانيا', labelEn: 'Mauritania', iso3: 'MRT', dialCode: '222', flag: '🇲🇷',
    currency: 'MRU', timezones: ['Africa/Nouakchott'], regionGroup: 'north-africa', status: 'active',
    regions: [
      { value: 'nouakchott', label: 'نواكشوط', cities: [{ value: 'nouakchott', label: 'نواكشوط' }] },
      { value: 'dakhlet-nouadhibou', label: 'داخلت نواذيبو', cities: [{ value: 'nouadhibou', label: 'نواذيبو' }] },
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

export function getCountryByAlias(input: string): CountryOption | undefined {
  const normalized = input.trim().toLowerCase();
  return countries.find((country) =>
    country.value.toLowerCase() === normalized ||
    country.label.toLowerCase() === normalized ||
    country.labelEn?.toLowerCase() === normalized ||
    country.aliases?.some((alias) => alias.toLowerCase() === normalized)
  );
}
