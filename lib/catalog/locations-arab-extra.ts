import { CountryOption } from './types';

export const extraArabCountries: CountryOption[] = [
  {
    value: 'IQ', label: 'العراق', labelEn: 'Iraq', iso3: 'IRQ', dialCode: '964',
    currency: 'IQD', timezones: ['Asia/Baghdad'], aliases: ['Iraq'], regionGroup: 'levant', availability: 'active',
    regions: [
      { value: 'baghdad', label: 'بغداد', cities: [{ value: 'baghdad', label: 'بغداد' }] },
      { value: 'basra', label: 'البصرة', cities: [{ value: 'basra', label: 'البصرة' }] },
      { value: 'nineveh', label: 'نينوى', cities: [{ value: 'mosul', label: 'الموصل' }] },
      { value: 'erbil', label: 'أربيل', cities: [{ value: 'erbil', label: 'أربيل' }] },
    ],
  },
  {
    value: 'SY', label: 'سوريا', labelEn: 'Syria', iso3: 'SYR', dialCode: '963',
    currency: 'SYP', timezones: ['Asia/Damascus'], aliases: ['Syria'], regionGroup: 'levant', availability: 'active',
    regions: [
      { value: 'damascus', label: 'دمشق', cities: [{ value: 'damascus', label: 'دمشق' }] },
      { value: 'aleppo', label: 'حلب', cities: [{ value: 'aleppo', label: 'حلب' }] },
      { value: 'homs', label: 'حمص', cities: [{ value: 'homs', label: 'حمص' }] },
      { value: 'latakia', label: 'اللاذقية', cities: [{ value: 'latakia', label: 'اللاذقية' }] },
    ],
  },
  {
    value: 'PS', label: 'فلسطين', labelEn: 'Palestine', iso3: 'PSE', dialCode: '970',
    currency: 'ILS', timezones: ['Asia/Hebron', 'Asia/Gaza'], aliases: ['Palestine'], regionGroup: 'levant', availability: 'active',
    regions: [
      { value: 'west-bank', label: 'الضفة الغربية', cities: [{ value: 'ramallah', label: 'رام الله' }, { value: 'nablus', label: 'نابلس' }, { value: 'hebron', label: 'الخليل' }] },
      { value: 'gaza', label: 'قطاع غزة', cities: [{ value: 'gaza-city', label: 'غزة' }, { value: 'khan-younis', label: 'خان يونس' }] },
    ],
  },
  {
    value: 'YE', label: 'اليمن', labelEn: 'Yemen', iso3: 'YEM', dialCode: '967',
    currency: 'YER', timezones: ['Asia/Aden'], aliases: ['Yemen'], regionGroup: 'other-arab', availability: 'active',
    regions: [
      { value: 'sanaa', label: 'أمانة العاصمة', cities: [{ value: 'sanaa', label: 'صنعاء' }] },
      { value: 'aden', label: 'عدن', cities: [{ value: 'aden', label: 'عدن' }] },
      { value: 'taiz', label: 'تعز', cities: [{ value: 'taiz', label: 'تعز' }] },
      { value: 'hadramout', label: 'حضرموت', cities: [{ value: 'mukalla', label: 'المكلا' }, { value: 'seiyun', label: 'سيئون' }] },
    ],
  },
  {
    value: 'MA', label: 'المغرب', labelEn: 'Morocco', iso3: 'MAR', dialCode: '212',
    currency: 'MAD', timezones: ['Africa/Casablanca'], aliases: ['Morocco', 'Maroc'], regionGroup: 'north-africa', availability: 'active',
    regions: [
      { value: 'casablanca-settat', label: 'الدار البيضاء - سطات', cities: [{ value: 'casablanca', label: 'الدار البيضاء' }, { value: 'settat', label: 'سطات' }] },
      { value: 'rabat-sale-kenitra', label: 'الرباط - سلا - القنيطرة', cities: [{ value: 'rabat', label: 'الرباط' }, { value: 'sale', label: 'سلا' }, { value: 'kenitra', label: 'القنيطرة' }] },
      { value: 'marrakech-safi', label: 'مراكش - آسفي', cities: [{ value: 'marrakech', label: 'مراكش' }, { value: 'safi', label: 'آسفي' }] },
    ],
  },
  {
    value: 'DZ', label: 'الجزائر', labelEn: 'Algeria', iso3: 'DZA', dialCode: '213',
    currency: 'DZD', timezones: ['Africa/Algiers'], aliases: ['Algeria'], regionGroup: 'north-africa', availability: 'active',
    regions: [
      { value: 'algiers', label: 'الجزائر', cities: [{ value: 'algiers', label: 'الجزائر العاصمة' }] },
      { value: 'oran', label: 'وهران', cities: [{ value: 'oran', label: 'وهران' }] },
      { value: 'constantine', label: 'قسنطينة', cities: [{ value: 'constantine', label: 'قسنطينة' }] },
    ],
  },
  {
    value: 'TN', label: 'تونس', labelEn: 'Tunisia', iso3: 'TUN', dialCode: '216',
    currency: 'TND', timezones: ['Africa/Tunis'], aliases: ['Tunisia'], regionGroup: 'north-africa', availability: 'active',
    regions: [
      { value: 'tunis', label: 'تونس', cities: [{ value: 'tunis', label: 'تونس' }] },
      { value: 'sfax', label: 'صفاقس', cities: [{ value: 'sfax', label: 'صفاقس' }] },
      { value: 'sousse', label: 'سوسة', cities: [{ value: 'sousse', label: 'سوسة' }] },
    ],
  },
  {
    value: 'LY', label: 'ليبيا', labelEn: 'Libya', iso3: 'LBY', dialCode: '218',
    currency: 'LYD', timezones: ['Africa/Tripoli'], aliases: ['Libya'], regionGroup: 'north-africa', availability: 'active',
    regions: [
      { value: 'tripoli', label: 'طرابلس', cities: [{ value: 'tripoli', label: 'طرابلس' }] },
      { value: 'benghazi', label: 'بنغازي', cities: [{ value: 'benghazi', label: 'بنغازي' }] },
      { value: 'misrata', label: 'مصراتة', cities: [{ value: 'misrata', label: 'مصراتة' }] },
    ],
  },
  {
    value: 'SD', label: 'السودان', labelEn: 'Sudan', iso3: 'SDN', dialCode: '249',
    currency: 'SDG', timezones: ['Africa/Khartoum'], aliases: ['Sudan'], regionGroup: 'nile', availability: 'active',
    regions: [
      { value: 'khartoum', label: 'الخرطوم', cities: [{ value: 'khartoum', label: 'الخرطوم' }, { value: 'omdurman', label: 'أم درمان' }] },
      { value: 'red-sea', label: 'البحر الأحمر', cities: [{ value: 'port-sudan', label: 'بورتسودان' }] },
      { value: 'gezira', label: 'الجزيرة', cities: [{ value: 'wad-madani', label: 'ود مدني' }] },
    ],
  },
  {
    value: 'SO', label: 'الصومال', labelEn: 'Somalia', iso3: 'SOM', dialCode: '252',
    currency: 'SOS', timezones: ['Africa/Mogadishu'], aliases: ['Somalia'], regionGroup: 'horn-africa', availability: 'active',
    regions: [
      { value: 'banadir', label: 'بنادر', cities: [{ value: 'mogadishu', label: 'مقديشو' }] },
      { value: 'bari', label: 'باري', cities: [{ value: 'bosaso', label: 'بوصاصو' }] },
    ],
  },
  {
    value: 'DJ', label: 'جيبوتي', labelEn: 'Djibouti', iso3: 'DJI', dialCode: '253',
    currency: 'DJF', timezones: ['Africa/Djibouti'], aliases: ['Djibouti'], regionGroup: 'horn-africa', availability: 'active',
    regions: [
      { value: 'djibouti', label: 'جيبوتي', cities: [{ value: 'djibouti-city', label: 'مدينة جيبوتي' }] },
      { value: 'ali-sabieh', label: 'علي صبيح', cities: [{ value: 'ali-sabieh', label: 'علي صبيح' }] },
    ],
  },
  {
    value: 'KM', label: 'جزر القمر', labelEn: 'Comoros', iso3: 'COM', dialCode: '269',
    currency: 'KMF', timezones: ['Indian/Comoro'], aliases: ['Comoros'], regionGroup: 'other-arab', availability: 'active',
    regions: [
      { value: 'grande-comore', label: 'القمر الكبرى', cities: [{ value: 'moroni', label: 'موروني' }] },
      { value: 'anjouan', label: 'أنجوان', cities: [{ value: 'mutsamudu', label: 'موتسامودو' }] },
    ],
  },
  {
    value: 'MR', label: 'موريتانيا', labelEn: 'Mauritania', iso3: 'MRT', dialCode: '222',
    currency: 'MRU', timezones: ['Africa/Nouakchott'], aliases: ['Mauritania'], regionGroup: 'north-africa', availability: 'active',
    regions: [
      { value: 'nouakchott', label: 'نواكشوط', cities: [{ value: 'nouakchott', label: 'نواكشوط' }] },
      { value: 'dakhlet-nouadhibou', label: 'داخلت نواذيبو', cities: [{ value: 'nouadhibou', label: 'نواذيبو' }] },
      { value: 'trarza', label: 'الترارزة', cities: [{ value: 'rosso', label: 'روصو' }] },
    ],
  },
];
