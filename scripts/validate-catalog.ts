import { sectors } from '../lib/catalog/sectors';
import { professions } from '../lib/catalog/professions';
import { specializations } from '../lib/catalog/specializations';
import { services } from '../lib/catalog/services';
import { professionAliases, searchProfessions } from '../lib/catalog';

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

const specIds = new Set(specializations.map((s) => s.id));
const svcIds = new Set(services.map((s) => s.id));
const sectorIds = new Set(sectors.map((s) => s.id));

let errors = 0;

// Duplicate IDs
[
  { name: 'sector', items: sectors.map((s) => s.id) },
  { name: 'profession', items: professions.map((p) => p.id) },
  { name: 'specialization', items: specializations.map((s) => s.id) },
  { name: 'service', items: services.map((s) => s.id) },
].forEach(({ name, items }) => {
  const seen = new Set<string>();
  items.forEach((id) => {
    if (seen.has(id)) {
      console.log(`DUPLICATE ${name} ID:`, id);
      errors++;
    }
    seen.add(id);
  });
});

// Duplicate Arabic names (real duplication)
const profNameCounts = new Map<string, string[]>();
professions.forEach((p) => {
  const key = normalizeLookup(p.nameAr);
  const list = profNameCounts.get(key) || [];
  list.push(p.id);
  profNameCounts.set(key, list);
});
profNameCounts.forEach((ids, name) => {
  if (ids.length > 1) {
    console.log(`DUPLICATE profession nameAr "${name}":`, ids.join(', '));
    errors++;
  }
});

// References
professions.forEach((p) => {
  if (!sectorIds.has(p.sectorId)) {
    console.log('BAD sectorId', p.id, p.sectorId);
    errors++;
  }
  p.specializationIds.forEach((sid) => {
    if (!specIds.has(sid)) {
      console.log('BAD spec', p.id, sid);
      errors++;
    }
  });
  p.serviceIds.forEach((sid) => {
    if (!svcIds.has(sid)) {
      console.log('BAD service', p.id, sid);
      errors++;
    }
  });
});

// Alias conflicts (same alias pointing to different profession IDs)
const aliasMap = new Map<string, string[]>();
Object.entries(professionAliases).forEach(([alias, professionId]) => {
  if (professionId === 'CUSTOM') return;
  const list = aliasMap.get(alias) || [];
  list.push(professionId);
  aliasMap.set(alias, list);
});
aliasMap.forEach((ids, alias) => {
  if (new Set(ids).size > 1) {
    console.log('CONFLICTING alias', alias, ids.join(', '));
    errors++;
  }
});

// Alias targets must exist
Object.entries(professionAliases).forEach(([alias, professionId]) => {
  if (professionId === 'CUSTOM') return;
  if (!professions.some((p) => p.id === professionId)) {
    console.log('ALIAS target missing', alias, professionId);
    errors++;
  }
});

console.log(errors === 0 ? 'OK: all references valid' : `${errors} errors`);

console.log('\nSearch samples:');
[
  'مصعد',
  'سلم كهربائي',
  'ممر متحرك',
  'Fire Alarm',
  'بصمة',
  'قفل ذكي',
  'ناطور',
  'حارس أمن',
  'سايس إبل',
  'مضمر',
  'صائغ',
  'ساعاتي',
  'مفاتيح سيارات',
  'صيدلي',
  'فني أشعة',
  'ميتال',
  'شتر',
  'طاقة شمسية',
  'GPS',
  'معقب',
  'تطريز',
  'أحواض سمك',
  'طيور',
  'أعلاف',
  'ممرض منزلي',
  'مرشد سياحي',
  'تأجير سيارات',
  'عقار',
  'لوجستيات',
  'أفراح',
  'حكواتي',
  'مسحراتي',
  'جزار',
  'مربية أطفال',
  'حارس منزل',
].forEach((q) => {
  const results = searchProfessions(q, 3);
  console.log(
    q,
    '=>',
    results.length
      ? results.map((r) => `${r.nameAr} (${r.matchedOn})`).join(' | ')
      : 'لا نتائج'
  );
});
