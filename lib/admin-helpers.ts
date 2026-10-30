export const statusLabels: Record<string, string> = {
  new: 'جديد',
  under_review: 'تحت المراجعة',
  qualified: 'مؤهل',
  need_information: 'بحاجة لمعلومات',
  contacted: 'تم التواصل',
  accepted: 'مقبول',
  rejected: 'مرفوض',
};

export const statusOptions = Object.entries(statusLabels).map(([value, label]) => ({ value, label }));

export function safeJsonParse<T = any>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

export const categoryOptions = [
  { value: 'موهبة', label: 'موهبة' },
  { value: 'إبداع وابتكار', label: 'إبداع وابتكار' },
  { value: 'حرفي', label: 'حرفي' },
  { value: 'مهني ومتخصص', label: 'مهني ومتخصص' },
  { value: 'طاقة شابة / موهبة واعدة', label: 'طاقة شابة / موهبة واعدة' },
];

export const sortOptions = [
  { value: 'createdAt_desc', label: 'الأحدث أولاً' },
  { value: 'createdAt_asc', label: 'الأقدم أولاً' },
  { value: 'full_name_asc', label: 'الاسم أبجدياً' },
  { value: 'applicationNumber_asc', label: 'رقم الطلب' },
  { value: 'status_asc', label: 'الحالة' },
];
