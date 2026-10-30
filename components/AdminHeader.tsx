'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, LayoutDashboard, LogOut, Settings, User, Users } from 'lucide-react';

interface AdminHeaderProps {
  admin?: {
    name?: string;
    email?: string;
  } | null;
}

export function AdminHeader({ admin }: AdminHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const navClass = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')
      ? 'text-afaq-teal font-medium'
      : 'text-white/70 hover:text-white';

  return (
    <header className="bg-afaq-bg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-5">
          <Link
            href="/admin/dashboard"
            className="text-white font-bold text-lg hover:text-afaq-teal transition-colors"
          >
            أفاق إدارية
          </Link>

          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <Link href="/admin/dashboard" className={`inline-flex items-center gap-1.5 ${navClass('/admin/dashboard')}`}>
              <LayoutDashboard className="w-4 h-4" />
              الرئيسية
            </Link>
            <Link href="/admin/talents" className={`inline-flex items-center gap-1.5 ${navClass('/admin/talents')}`}>
              <Users className="w-4 h-4" />
              المواهب
            </Link>
            <Link href="/admin/analytics" className={`inline-flex items-center gap-1.5 ${navClass('/admin/analytics')}`}>
              <BarChart3 className="w-4 h-4" />
              التحليلات
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/account"
            title="إعدادات الحساب"
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-afaq-teal hover:border-afaq-teal/30 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </Link>
          <div className="w-8 h-8 rounded-lg bg-afaq-teal/20 flex items-center justify-center">
            <User className="w-5 h-5 text-afaq-teal" />
          </div>
          <div className="hidden md:block">
            <p className="text-white font-semibold text-sm">{admin?.name || 'المشرف'}</p>
            <p className="text-white/50 text-xs">{admin?.email || ''}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </div>
    </header>
  );
}
