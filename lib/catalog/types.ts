export type ProfileType =
  | 'حرفي'
  | 'فني'
  | 'مهني'
  | 'متخصص'
  | 'موهوب'
  | 'مبدع'
  | 'خبير / مستشار'
  | 'مقدم خدمة';

export interface SectorOption {
  id: string;
  labelAr: string;
  labelEn: string;
  aliases?: string[];
  profileTypes: ProfileType[];
}

export interface SpecializationOption {
  id: string;
  nameAr: string;
  nameEn?: string;
  aliases?: string[];
}

export interface ServiceOption {
  id: string;
  nameAr: string;
  nameEn?: string;
  aliases?: string[];
}

export interface ProfessionOption {
  id: string;
  sectorId: string;
  nameAr: string;
  nameEn?: string;
  aliases: string[];
  profileTypes: ProfileType[];
  specializationIds: string[];
  serviceIds: string[];
  /** Marks regulated/sensitive professions that typically require a license or official permit. */
  requiresLicense?: boolean;
}

export type ArabRegionGroup = 'gcc' | 'levant' | 'north-africa' | 'nile' | 'horn-africa' | 'other-arab';
export type CountryAvailability = 'active' | 'beta' | 'disabled';

export interface CountryOption {
  /** Stable ISO 3166-1 alpha-2 code used as the persisted value. */
  value: string;
  label: string;
  labelEn?: string;
  iso3?: string;
  dialCode?: string;
  flag?: string;
  currency?: string;
  timezones?: string[];
  aliases?: string[];
  regionGroup?: ArabRegionGroup;
  availability?: CountryAvailability;
  regions: RegionOption[];
}

export interface RegionOption {
  /** Stable internal slug. Existing slugs must never be renamed without a migration. */
  value: string;
  label: string;
  labelEn?: string;
  cities: CityOption[];
}

export interface CityOption {
  value: string;
  label: string;
  labelEn?: string;
}
