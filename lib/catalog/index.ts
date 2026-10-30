import { sectors, getSector, getProfileTypesForSector, profileTypes } from './sectors';
import { professions, getProfession, getProfessionsBySector } from './professions';
import { specializations, getSpecialization } from './specializations';
import { services, getService } from './services';
import { professionAliases } from './aliases';
import {
  SectorOption,
  ProfessionOption,
  SpecializationOption,
  ServiceOption,
  ProfileType,
} from './types';

export type {
  SectorOption,
  ProfessionOption,
  SpecializationOption,
  ServiceOption,
  ProfileType,
};

export { sectors, professions, specializations, services, professionAliases, profileTypes };
export {
  getSector,
  getProfession,
  getSpecialization,
  getService,
  getProfessionsBySector,
  getProfileTypesForSector,
};

export const CUSTOM_PROFESSION_ID = 'CUSTOM';

export interface ResolvedProfession extends ProfessionOption {
  specializations: SpecializationOption[];
  services: ServiceOption[];
}

export function resolveProfession(id: string): ResolvedProfession | undefined {
  const profession = getProfession(id);
  if (!profession) return undefined;
  return {
    ...profession,
    specializations: profession.specializationIds
      .map(getSpecialization)
      .filter((s): s is SpecializationOption => !!s),
    services: profession.serviceIds
      .map(getService)
      .filter((s): s is ServiceOption => !!s),
  };
}

export function resolveProfessionsBySector(sectorId: string): ResolvedProfession[] {
  return getProfessionsBySector(sectorId)
    .map((p) => resolveProfession(p.id))
    .filter((p): p is ResolvedProfession => !!p);
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ـ/g, '')
    .replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, '');
}

export interface CatalogSearchResult {
  id: string;
  nameAr: string;
  nameEn?: string;
  sectorId: string;
  sectorLabelAr: string;
  matchedOn: 'nameAr' | 'nameEn' | 'alias' | 'specialization';
}

export function searchProfessions(query: string, limit = 10): CatalogSearchResult[] {
  const q = normalize(query);
  if (!q) return [];

  const results: CatalogSearchResult[] = [];
  const seen = new Set<string>();

  const add = (
    profession: ProfessionOption,
    matchedOn: CatalogSearchResult['matchedOn']
  ) => {
    if (seen.has(profession.id)) return;
    seen.add(profession.id);
    const sector = getSector(profession.sectorId);
    results.push({
      id: profession.id,
      nameAr: profession.nameAr,
      nameEn: profession.nameEn,
      sectorId: profession.sectorId,
      sectorLabelAr: sector?.labelAr ?? profession.sectorId,
      matchedOn,
    });
  };

  // Direct alias match (exact normalized)
  for (const [alias, professionId] of Object.entries(professionAliases)) {
    if (normalize(alias) === q) {
      const profession = getProfession(professionId);
      if (profession) add(profession, 'alias');
    }
  }

  for (const profession of professions) {
    if (normalize(profession.nameAr).includes(q)) {
      add(profession, 'nameAr');
      continue;
    }
    if (profession.nameEn && normalize(profession.nameEn).includes(q)) {
      add(profession, 'nameEn');
      continue;
    }
    if (profession.aliases.some((a) => normalize(a).includes(q))) {
      add(profession, 'alias');
      continue;
    }
    const hasSpecMatch = profession.specializationIds.some((sid) => {
      const spec = getSpecialization(sid);
      if (!spec) return false;
      return (
        normalize(spec.nameAr).includes(q) ||
        (spec.nameEn && normalize(spec.nameEn).includes(q)) ||
        (spec.aliases ?? []).some((a) => normalize(a).includes(q))
      );
    });
    if (hasSpecMatch) {
      add(profession, 'specialization');
    }
  }

  return results.slice(0, limit);
}

export function getSectorOptionsForProfileType(profileType: ProfileType): SectorOption[] {
  return sectors.filter((s) => s.profileTypes.includes(profileType));
}

export function getSectorLabel(id: string): string {
  return getSector(id)?.labelAr ?? id;
}

export function getProfessionLabel(id: string): string {
  return getProfession(id)?.nameAr ?? id;
}

export function getSpecializationsForProfession(id: string): SpecializationOption[] {
  return resolveProfession(id)?.specializations ?? [];
}

export function getServicesForProfession(id: string): ServiceOption[] {
  return resolveProfession(id)?.services ?? [];
}
