'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  Loader2,
  Save,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Tag,
  Activity,
  CheckCircle,
  ExternalLink,
  Star,
  Copy,
  MessageCircle,
  Trash2,
  Pencil,
  X,
} from 'lucide-react';
import { getSector, getProfession } from '@/lib/catalog/sectors';
import { countries, getRegion } from '@/lib/catalog/locations';
import { serviceAreas } from '@/lib/catalog/serviceAreas';
import { workPlaces } from '@/lib/catalog/workPlaces';

const statusLabels: Record<string, string> = {
  new: 'جديد',
  under_review: 'قيد المراجعة',
  qualified: 'مؤهل',
  need_information: 'يحتاج بيانات',
  contacted: 'تم التواصل',
  accepted: 'مقبول',
  rejected: 'مرفوض',
};

interface SkillProfile {
  id: string;
  profileType: string;
  sector: string;
  profession: string;
  specializations: string;
  services: string;
  skillLevel?: string;
  yearsExperience?: string;
  description?: string;
  isPrimary: boolean;
  isCustomProfession: boolean;
  customProfessionName?: string | null;
  customProfessionLocalName?: string | null;
  customProfessionDescription?: string | null;
  customProfessionClosestSector?: string | null;
}

interface Talent {
  id: string;
  applicationNumber: string;
  category: string;
  fields: string;
  specialized: string;
  personal: string;
  phone?: string;
  email?: string;
  country?: string;
  region?: string;
  city?: string;
  district?: string;
  serviceArea?: string;
  workPlace?: string;
  sanaieePlatformConsent: boolean;
  sanaieeProfileStatus: string;
  sanaieeConsentAt?: string;
  emailVerified: boolean;
  emailVerifiedAt?: string;
  emailStatus: string;
  emailSentAt?: string;
  emailFailedAt?: string;
  emailError?: string;
  emailMessageId?: string;
  adminNotified: boolean;
  attachments: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  activities: ActivityItem[];
  skillProfiles: SkillProfile[];
}

interface ActivityItem {
  id: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
  adminUser?: { name?: string; email?: string } | null;
}

const linkFields = [
  { key: 'portfolio_url', label: 'Portfolio' },
  { key: 'behance_url', label: 'Behance' },
  { key: 'instagram_url', label: 'Instagram' },
  { key: 'github_url', label: 'GitHub' },
  { key: 'website_url', label: 'موقع شخصي' },
];

export default function AdminTalentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [talent, setTalent] = useState<Talent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [newActivity, setNewActivity] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchTalent = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/talents/${id}`);
      const json = await res.json();

      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }

      if (res.ok && json.success) {
        setTalent(json.talent);
        setStatus(json.talent.status);
        setAdminNotes(json.talent.adminNotes || '');
        setEditForm({
          personal: parseJson(json.talent.personal),
          location: {
            country: json.talent.country || '',
            region: json.talent.region || '',
            city: json.talent.city || '',
            district: json.talent.district || '',
            serviceArea: parseJsonArray(json.talent.serviceArea),
            workPlace: parseJsonArray(json.talent.workPlace),
          },
          links: parseJson(json.talent.attachments),
        });
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
    fetchTalent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/talents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes }),
      });
      const json = await res.json();

      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }

      if (res.ok && json.success) {
        await fetchTalent();
      } else {
        setError(json.message || 'تعذر حفظ التغييرات.');
      }
    } catch (err) {
      setError('حدث خطأ أثناء حفظ التغييرات.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddActivity = async () => {
    if (!newActivity.trim()) return;
    try {
      const res = await fetch(`/api/admin/talents/${id}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: newActivity.trim() }),
      });
      if (res.ok) {
        setNewActivity('');
        await fetchTalent();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyNumber = () => {
    if (!talent) return;
    navigator.clipboard.writeText(talent.applicationNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const normalizePhoneForLink = (phone: string) => {
    return phone.replace(/[^0-9+]/g, '').replace(/^\+?/, '');
  };

  const handleSaveEdit = async () => {
    if (!talent) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/talents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personal: editForm.personal,
          location: editForm.location,
          links: editForm.links,
        }),
      });
      const json = await res.json();
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (res.ok && json.success) {
        setIsEditing(false);
        await fetchTalent();
      } else {
        setError(json.message || 'تعذر حفظ التعديلات.');
      }
    } catch (err) {
      setError('حدث خطأ أثناء حفظ التعديلات.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!talent || deleteConfirmText !== talent.applicationNumber) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/talents/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (res.ok && json.success) {
        router.push('/admin/talents');
      } else {
        setError(json.message || 'تعذر حذف الطلب.');
      }
    } catch (err) {
      setError('حدث خطأ أثناء حذف الطلب.');
    } finally {
      setSaving(false);
    }
  };

  const parseJson = (str: string | undefined | null) => {
    try {
      return JSON.parse(str || '{}');
    } catch {
      return {};
    }
  };

  const parseJsonArray = (str: string | undefined | null) => {
    try {
      const parsed = JSON.parse(str || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-afaq-teal animate-spin" />
      </div>
    );
  }

  if (!talent) {
    return (
      <div className="text-center py-20 text-white/50">
        {error || 'الطلب غير موجود.'}
      </div>
    );
  }

  const personal = parseJson(talent.personal);
  const attachments = parseJson(talent.attachments);
  const serviceAreaList = parseJsonArray(talent.serviceArea);
  const workPlaceList = parseJsonArray(talent.workPlace);

  const countryLabel = countries.find((c) => c.value === talent.country)?.label || talent.country || '—';
  const regionObj = countries.find((c) => c.value === talent.country)?.regions.find((r) => r.value === talent.region);
  const cityLabel = regionObj?.cities.find((c) => c.value === talent.city)?.label || talent.city || '—';

  const phoneNumber = talent.phone || personal.phone || '';
  const emailAddress = talent.email || personal.email || '';
  const phoneDigits = phoneNumber ? normalizePhoneForLink(phoneNumber) : '';
  const whatsappMessage = `مرحبًا، نتواصل معك من أفاق بخصوص طلبك رقم ${talent.applicationNumber}.`;

  const toggleArray = (arr: string[], value: string) =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/talents"
          className="inline-flex items-center gap-1 text-white/60 hover:text-white text-sm"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للقائمة
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-xl font-bold text-white">طلب {talent.applicationNumber}</h1>
                <p className="text-white/50 text-sm mt-1">
                  تقدم بتاريخ {new Date(talent.createdAt).toLocaleDateString('ar-SA')}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm border bg-white/10 text-white/80 border-white/10">
                  {statusLabels[talent.status] || talent.status}
                </span>
                {talent.emailVerified ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-green-500/10 text-green-400 border border-green-500/20">
                    <CheckCircle className="w-3 h-3" /> البريد مؤكد
                  </span>
                ) : talent.emailStatus === 'sent' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    البريد مرسل (غير مؤكد)
                  </span>
                ) : talent.emailStatus === 'failed' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-red-500/10 text-red-400 border border-red-500/20" title={talent.emailError || ''}>
                    فشل إرسال البريد
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-white/5 text-white/50 border border-white/10">
                    البريد في الانتظار
                  </span>
                )}
                {talent.adminNotified && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-afaq-gold/10 text-afaq-gold border border-afaq-gold/20">
                    تم إشعار الإدارة
                  </span>
                )}
                {talent.sanaieePlatformConsent && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-afaq-gold/10 text-afaq-gold border border-afaq-gold/20">
                    مهتم بصنايعي
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={handleCopyNumber}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 text-sm"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'تم النسخ' : 'نسخ رقم الطلب'}
              </button>
              <button
                onClick={() => setIsEditing((v) => !v)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-afaq-gold/10 border border-afaq-gold/20 text-afaq-gold hover:bg-afaq-gold/20 text-sm"
              >
                {isEditing ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                {isEditing ? 'إلغاء التعديل' : 'تعديل البيانات'}
              </button>
            </div>

            {!isEditing ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoItem icon={<User className="w-4 h-4" />} label="الاسم" value={personal.full_name || '—'} />
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-afaq-teal shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white/50 text-xs">الجوال</p>
                      <p className="text-white text-sm font-medium truncate ltr-text" dir="ltr">
                        {phoneNumber || '—'}
                      </p>
                      {phoneNumber && (
                        <div className="flex items-center gap-2 mt-2">
                          <a
                            href={`tel:${phoneNumber}`}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/5 text-white/70 hover:bg-white/10 text-xs"
                          >
                            <Phone className="w-3 h-3" /> اتصال
                          </a>
                          <a
                            href={`https://wa.me/${phoneDigits}?text=${encodeURIComponent(whatsappMessage)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 text-xs"
                          >
                            <MessageCircle className="w-3 h-3" /> واتساب
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-afaq-teal shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white/50 text-xs">البريد الإلكتروني</p>
                      <p className="text-white text-sm font-medium truncate ltr-text" dir="ltr">
                        {emailAddress || '—'}
                      </p>
                      {emailAddress && (
                        <div className="flex items-center gap-2 mt-2">
                          <a
                            href={`mailto:${emailAddress}?subject=${encodeURIComponent(`طلبك في أفاق – ${talent.applicationNumber}`)}&body=${encodeURIComponent(`مرحبًا،\n\nنتواصل معك من أفاق بخصوص طلبك رقم ${talent.applicationNumber}.\n\nتحياتنا،\nفريق أفاق`)}`}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/5 text-white/70 hover:bg-white/10 text-xs"
                          >
                            <Mail className="w-3 h-3" /> بريد
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  <InfoItem icon={<MapPin className="w-4 h-4" />} label="الموقع" value={[countryLabel, regionObj?.label, cityLabel, talent.district].filter(Boolean).join(' - ') || '—'} />
                  <InfoItem icon={<Calendar className="w-4 h-4" />} label="تاريخ التقديم" value={new Date(talent.createdAt).toLocaleString('ar-SA')} />
                </div>

                {serviceAreaList.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-white/70 mb-2">نطاق الخدمة</h3>
                    <div className="flex flex-wrap gap-2">
                      {serviceAreaList.map((area: string) => (
                        <span key={area} className="bg-white/5 border border-white/10 text-white/80 px-3 py-1 rounded-lg text-sm">
                          {serviceAreas.find((a) => a.value === area)?.label || area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {workPlaceList.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-white/70 mb-2">مقر العمل</h3>
                    <div className="flex flex-wrap gap-2">
                      {workPlaceList.map((place: string) => (
                        <span key={place} className="bg-white/5 border border-white/10 text-white/80 px-3 py-1 rounded-lg text-sm">
                          {workPlaces.find((p) => p.value === place)?.label || place}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <h3 className="text-white font-bold mb-2">تعديل البيانات</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-xs mb-1">الاسم</label>
                    <input
                      type="text"
                      value={editForm.personal?.full_name || ''}
                      onChange={(e) => setEditForm({ ...editForm, personal: { ...editForm.personal, full_name: e.target.value } })}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-afaq-teal"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-xs mb-1">الجوال</label>
                    <input
                      type="text"
                      value={editForm.personal?.phone || ''}
                      onChange={(e) => setEditForm({ ...editForm, personal: { ...editForm.personal, phone: e.target.value } })}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-afaq-teal ltr-text"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-xs mb-1">البريد الإلكتروني</label>
                    <input
                      type="email"
                      value={editForm.personal?.email || ''}
                      onChange={(e) => setEditForm({ ...editForm, personal: { ...editForm.personal, email: e.target.value } })}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-afaq-teal ltr-text"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-xs mb-1">الدولة</label>
                    <select
                      value={editForm.location?.country || ''}
                      onChange={(e) => setEditForm({ ...editForm, location: { ...editForm.location, country: e.target.value, region: '', city: '' } })}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-afaq-teal appearance-none"
                    >
                      <option value="" className="bg-afaq-bg">اختر الدولة</option>
                      {countries.map((c) => (
                        <option key={c.value} value={c.value} className="bg-afaq-bg">{c.flag || ''} {c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/60 text-xs mb-1">المنطقة / المحافظة</label>
                    <select
                      value={editForm.location?.region || ''}
                      onChange={(e) => setEditForm({ ...editForm, location: { ...editForm.location, region: e.target.value, city: '' } })}
                      disabled={!editForm.location?.country}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-afaq-teal appearance-none disabled:opacity-40"
                    >
                      <option value="" className="bg-afaq-bg">اختر المنطقة</option>
                      {countries.find((c) => c.value === editForm.location?.country)?.regions.map((r) => (
                        <option key={r.value} value={r.value} className="bg-afaq-bg">{r.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/60 text-xs mb-1">المدينة</label>
                    <select
                      value={editForm.location?.city || ''}
                      onChange={(e) => setEditForm({ ...editForm, location: { ...editForm.location, city: e.target.value } })}
                      disabled={!editForm.location?.region}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-afaq-teal appearance-none disabled:opacity-40"
                    >
                      <option value="" className="bg-afaq-bg">اختر المدينة</option>
                      {getRegion(editForm.location?.country || '', editForm.location?.region || '')?.cities.map((c) => (
                        <option key={c.value} value={c.value} className="bg-afaq-bg">{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-white/60 text-xs mb-1">الحي</label>
                    <input
                      type="text"
                      value={editForm.location?.district || ''}
                      onChange={(e) => setEditForm({ ...editForm, location: { ...editForm.location, district: e.target.value } })}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-afaq-teal"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/60 text-xs mb-2">نطاق الخدمة</label>
                  <div className="flex flex-wrap gap-2">
                    {serviceAreas.map((area) => (
                      <label key={area.value} className={`chip ${editForm.location?.serviceArea?.includes(area.value) ? 'active' : ''}`}>
                        <input
                          type="checkbox"
                          checked={editForm.location?.serviceArea?.includes(area.value) || false}
                          onChange={() => setEditForm({ ...editForm, location: { ...editForm.location, serviceArea: toggleArray(editForm.location?.serviceArea || [], area.value) } })}
                          className="hidden"
                        />
                        <span>{area.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-white/60 text-xs mb-2">مقر العمل</label>
                  <div className="flex flex-wrap gap-2">
                    {workPlaces.map((place) => (
                      <label key={place.value} className={`chip ${editForm.location?.workPlace?.includes(place.value) ? 'active' : ''}`}>
                        <input
                          type="checkbox"
                          checked={editForm.location?.workPlace?.includes(place.value) || false}
                          onChange={() => setEditForm({ ...editForm, location: { ...editForm.location, workPlace: toggleArray(editForm.location?.workPlace || [], place.value) } })}
                          className="hidden"
                        />
                        <span>{place.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 space-y-3">
                  <p className="text-white/70 text-sm">روابط سابقة الأعمال</p>
                  {linkFields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-white/60 text-xs mb-1">{field.label}</label>
                      <input
                        type="text"
                        value={editForm.links?.[field.key] || ''}
                        onChange={(e) => setEditForm({ ...editForm, links: { ...editForm.links, [field.key]: e.target.value } })}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-afaq-teal ltr-text"
                        dir="ltr"
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="w-full bg-afaq-teal hover:bg-afaq-blue2 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4" />}
                  حفظ التعديلات
                </button>
              </div>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-afaq-teal" />
              المهن والمجالات
            </h2>

            {talent.skillProfiles.length === 0 ? (
              <div className="text-white/50 text-sm">لا توجد ملفات مهن مسجلة.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {talent.skillProfiles.map((profile) => {
                  const specializations = parseJsonArray(profile.specializations);
                  const services = parseJsonArray(profile.services);
                  const professionLabel = profile.isCustomProfession
                    ? profile.customProfessionName || 'مهنة أخرى'
                    : getProfession(profile.profession)?.nameAr || profile.profession;

                  return (
                    <div key={profile.id} className={`p-4 rounded-xl border ${profile.isPrimary ? 'border-afaq-gold bg-afaq-gold/10' : 'border-white/10 bg-white/5'}`}>
                      <div className="flex items-center gap-2 mb-3">
                        {profile.isPrimary && <Star className="w-4 h-4 text-afaq-gold" />}
                        <h3 className="font-bold text-white">{professionLabel}</h3>
                        <span className="text-white/50 text-xs mr-auto">{profile.profileType}</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        {profile.isCustomProfession ? (
                          <>
                            {profile.customProfessionLocalName && <p className="text-white/70">المسمى المحلي: {profile.customProfessionLocalName}</p>}
                            {profile.customProfessionDescription && <p className="text-white/70">{profile.customProfessionDescription}</p>}
                            {profile.customProfessionClosestSector && (
                              <p className="text-white/70">أقرب مجال: {getSector(profile.customProfessionClosestSector)?.labelAr || profile.customProfessionClosestSector}</p>
                            )}
                          </>
                        ) : (
                          <p className="text-white/70">المجال: {getSector(profile.sector)?.labelAr || profile.sector}</p>
                        )}
                        {profile.skillLevel && <p className="text-white/70">المستوى: {profile.skillLevel}</p>}
                        {profile.yearsExperience && <p className="text-white/70">الخبرة: {profile.yearsExperience}</p>}
                        {specializations.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {specializations.map((s: string) => (
                              <span key={s} className="bg-white/5 text-white/70 px-2 py-0.5 rounded text-xs">{s}</span>
                            ))}
                          </div>
                        )}
                        {services.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {services.map((s: string) => (
                              <span key={s} className="bg-white/5 text-white/70 px-2 py-0.5 rounded text-xs">{s}</span>
                            ))}
                          </div>
                        )}
                        {profile.description && <p className="text-white/60 mt-2">{profile.description}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-afaq-teal" />
              السيرة الذاتية وسابقة الأعمال
            </h2>

            {Object.keys(attachments).length === 0 ? (
              <p className="text-white/50 text-sm">لا توجد مرفقات أو روابط مسجلة.</p>
            ) : (
              <div className="space-y-4">
                {attachments.profile_photo && (
                  <AttachmentLink label="صورة شخصية" url={attachments.profile_photo} />
                )}
                {attachments.work_photos && Array.isArray(attachments.work_photos) && attachments.work_photos.length > 0 && (
                  <div>
                    <p className="text-white/60 text-xs mb-2">صور الأعمال</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {attachments.work_photos.map((url: string, idx: number) => (
                        <AttachmentLink key={idx} label={`صورة #${idx + 1}`} url={url} />
                      ))}
                    </div>
                  </div>
                )}
                {attachments.work_video && (
                  <AttachmentLink label="فيديو الأعمال" url={attachments.work_video} />
                )}
                {attachments.cv && (
                  <AttachmentLink label="السيرة الذاتية (CV)" url={attachments.cv} />
                )}

                {linkFields.some((f) => attachments[f.key]) && (
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-white/60 text-xs mb-2">روابط سابقة الأعمال</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {linkFields.map((field) =>
                        attachments[field.key] ? (
                          <AttachmentLink key={field.key} label={field.label} url={attachments[field.key]} />
                        ) : null
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-96 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">تحديث الحالة</h2>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-lg px-4 py-3 mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">حالة الطلب</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-afaq-teal"
                >
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <option key={key} value={key} className="bg-afaq-bg">{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">الملاحظات الإدارية</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white placeholder-white/30 focus:outline-none focus:border-afaq-teal resize-none"
                  placeholder="أضف ملاحظاتك هنا..."
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-afaq-teal hover:bg-afaq-blue2 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4" />}
                حفظ التغييرات
              </button>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">إدارة الطلب</h2>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> حذف الطلب
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-white/70 text-sm">
                  اكتب رقم الطلب <span className="text-white font-bold" dir="ltr">{talent.applicationNumber}</span> للتأكيد
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500/50 ltr-text"
                  dir="ltr"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={saving || deleteConfirmText !== talent.applicationNumber}
                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 rounded-lg text-sm font-semibold disabled:opacity-40"
                  >
                    تأكيد الحذف
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg text-sm"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className={`bg-white/5 border rounded-xl p-6 ${talent.sanaieePlatformConsent ? 'border-afaq-gold/30 bg-afaq-gold/5' : 'border-white/10'}`}>
            <h2 className="text-lg font-bold text-white mb-2">منظومة صنايعي</h2>
            <p className="text-white/70 text-sm">
              {talent.sanaieePlatformConsent ? 'المتقدم وافق على الانضمام إلى صنايعي.' : 'لم يتم اختيار الانضمام إلى صنايعي.'}
            </p>
            {talent.sanaieeConsentAt && (
              <p className="text-white/50 text-xs mt-2">
                تاريخ الموافقة: {new Date(talent.sanaieeConsentAt).toLocaleString('ar-SA')}
              </p>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-afaq-teal" />
              سجل النشاطات
            </h2>

            <div className="space-y-3 mb-6">
              <textarea
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-white placeholder-white/30 focus:outline-none focus:border-afaq-teal resize-none text-sm"
                placeholder="إضافة نشاط أو ملاحظة..."
              />
              <button
                onClick={handleAddActivity}
                className="w-full bg-white/10 hover:bg-white/20 text-white text-sm py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                إضافة
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {talent.activities.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-4">لا توجد نشاطات مسجلة.</p>
              ) : (
                talent.activities.map((activity) => (
                  <div key={activity.id} className="border-r-2 border-afaq-teal/30 pr-3">
                    <p className="text-white/90 text-sm">{activity.action}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-white/40 text-xs">{activity.adminUser?.name || '—'}</span>
                      <span className="text-white/30 text-xs">•</span>
                      <span className="text-white/40 text-xs">{new Date(activity.createdAt).toLocaleString('ar-SA')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
  dir,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  dir?: 'ltr';
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-afaq-teal shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-white/50 text-xs">{label}</p>
        <p className={`text-white text-sm font-medium truncate ${dir === 'ltr' ? 'ltr-text' : ''}`} dir={dir}>
          {value}
        </p>
      </div>
    </div>
  );
}

function AttachmentLink({ label, url }: { label: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors"
    >
      <span className="text-white/80 text-sm">{label}</span>
      <ExternalLink className="w-4 h-4 text-afaq-teal" />
    </a>
  );
}
