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

export interface CountryOption {
  value: string;
  label: string;
  dialCode?: string;
  flag?: string;
  regions: RegionOption[];
}

export interface RegionOption {
  value: string;
  label: string;
  cities: CityOption[];
}

export interface CityOption {
  value: string;
  label: string;
}
