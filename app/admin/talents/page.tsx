'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Loader2,
  ChevronRight,
  ChevronLeft,
  FileDown,
  Eye,
  Filter,
} from 'lucide-react';
import { getSector, getProfession } from '@/lib/catalog/sectors';
import { countries } from '@/lib/catalog/locations';

const statusLabels: Record<string, string> = {
  new: 'جديد',
  under_review: 'قيد المراجعة',
  qualified: 'مؤهل',
  need_information: 'يحتاج بيانات',
  contacted: 'تم التواصل',
  accepted: 'مقبول',
  rejected: 'مرفوض',
};

const statusClasses: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  under_review: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  qualified: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  need_information: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  contacted: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  accepted: 'bg-green-500/10 text-green-400 border-green-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
};

interface SkillProfile {
  id: string;
  profileType: string;
  sector: string;
  profession: string;
  isPrimary: boolean;
  isCustomProfession: boolean;
  customProfessionName: string | null;
}

interface Talent {
  id: string;
  applicationNumber: string;
  category: string;
  fields: string;
  phone?: string;
  email?: string;
  country?: string;
  region?: string;
  city?: string;
  status: string;
  sanaieeProfileStatus?: string;
  createdAt: string;
  activityCount: number;
  skillProfiles: SkillProfile[];
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function AdminTalentsPage() {
  const router = useRouter();
  const [talents, setTalents] = useState<Talent[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const fetchTalents = async () => {
    setLoading(true);
    setError('');

    const params = new URLSearchParams();
    params.set('page', String(page));
    if (search) params.set('search', search);
    if (status) params.set('status', status);

    try {
      const res = await fetch(`/api/admin/talents?${params.toString()}`);
      const json = await res.json();

      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }

      if (res.ok && json.success) {
        setTalents(json.talents);
        setPagination(json.pagination);
      } else {
        setError(json.message || 'تعذر تحميل البيانات.');
      }
    } catch (err) {
      setError('حدث خطأ أثناء الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTalents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTalents();
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    window.open(`/api/admin/talents/export?${params.toString()}`, '_blank');
  };

  const getPrimaryLabel = (talent: Talent) => {
    if (talent.skillProfiles && talent.skillProfiles.length > 0) {
      const primary = talent.skillProfiles.find((p) => p.isPrimary) || talent.skillProfiles[0];
      if (primary.isCustomProfession && primary.customProfessionName) return primary.customProfessionName;
      return getProfession(primary.profession)?.nameAr || primary.profession;
    }
    return talent.category || '—';
  };

  const getExtraCount = (talent: Talent) => {
    const profiles = talent.skillProfiles || [];
    const nonPrimary = profiles.filter((p) => !p.isPrimary).length;
    return nonPrimary;
  };

  const getCountryLabel = (value?: string) => {
    return countries.find((c) => c.value === value)?.label || value || '—';
  };

  const getCityLabel = (talent: Talent) => {
    if (!talent.country || !talent.region || !talent.city) return '—';
    const country = countries.find((c) => c.value === talent.country);
    const region = country?.regions.find((r) => r.value === talent.region);
    const city = region?.cities.find((c) => c.value === talent.city);
    return city?.label || talent.city;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">طلبات المواهب</h1>
          <p className="text-white/50 text-sm mt-1">إدارة ومراجعة طلبات الانضمام لمنظومة المواهب</p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 bg-afaq-teal/10 hover:bg-afaq-teal/20 text-afaq-teal border border-afaq-teal/20 px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <FileDown className="w-4 h-4" />
          تصدير CSV
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث برقم الطلب، الجوال، البريد..."
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pr-10 pl-4 text-white placeholder-white/30 focus:outline-none focus:border-afaq-teal"
            />
          </div>

          <div className="relative min-w-[200px]">
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full appearance-none bg-white/5 border border-white/10 rounded-lg py-2.5 pr-10 pl-4 text-white focus:outline-none focus:border-afaq-teal"
            >
              <option value="" className="bg-afaq-bg">كل الحالات</option>
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key} className="bg-afaq-bg">{label}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="bg-afaq-blue hover:bg-afaq-blue2 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            بحث
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-lg px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        {loading && talents.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-afaq-teal animate-spin" />
          </div>
        ) : talents.length === 0 ? (
          <div className="text-center py-20 text-white/50">
            لا توجد طلبات مطابقة للبحث.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-white/70">رقم الطلب</th>
                  <th className="px-4 py-3 text-sm font-medium text-white/70">المهنة الرئيسية</th>
                  <th className="px-4 py-3 text-sm font-medium text-white/70">الدولة</th>
                  <th className="px-4 py-3 text-sm font-medium text-white/70">المدينة</th>
                  <th className="px-4 py-3 text-sm font-medium text-white/70">الحالة</th>
                  <th className="px-4 py-3 text-sm font-medium text-white/70">صنايعي</th>
                  <th className="px-4 py-3 text-sm font-medium text-white/70">التاريخ</th>
                  <th className="px-4 py-3 text-sm font-medium text-white/70"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {talents.map((talent) => (
                  <tr key={talent.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{talent.applicationNumber}</td>
                    <td className="px-4 py-3 text-white/80">
                      <div>{getPrimaryLabel(talent)}</div>
                      {getExtraCount(talent) > 0 && (
                        <div className="text-afaq-teal text-xs mt-1">+{getExtraCount(talent)} مجالات</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/80">{getCountryLabel(talent.country)}</td>
                    <td className="px-4 py-3 text-white/80">{getCityLabel(talent)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${statusClasses[talent.status] || 'bg-white/10 text-white/70 border-white/10'}`}>
                        {statusLabels[talent.status] || talent.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {talent.sanaieeProfileStatus === 'interested' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-afaq-gold/10 text-afaq-gold border border-afaq-gold/20">
                          مهتم
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white/5 text-white/50 border border-white/10">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/60 text-sm">
                      {new Date(talent.createdAt).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/talents/${talent.id}`}
                        className="inline-flex items-center gap-1 text-afaq-teal hover:text-afaq-blue2 text-sm transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        عرض
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t border-white/10">
            <p className="text-white/50 text-sm">
              صفحة {pagination.page} من {pagination.totalPages} ({pagination.total} طلب)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-white/10 text-white/70 hover:bg-white/5 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="p-2 rounded-lg border border-white/10 text-white/70 hover:bg-white/5 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
