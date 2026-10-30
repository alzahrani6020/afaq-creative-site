'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, User, Settings } from 'lucide-react';

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/admin/talents"
            className="text-white font-bold text-lg hover:text-afaq-teal transition-colors"
          >
            أفاق إدارية
          </Link>
          <nav className="hidden sm:flex items-center gap-4 text-sm">
            <Link href="/admin/talents" className={navClass('/admin/talents')}>
              المواهب
            </Link>
          </nav>
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
            <div>
              <p className="text-white font-semibold text-sm">{admin?.name || 'المشرف'}</p>
              <p className="text-white/50 text-xs">{admin?.email || ''}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/admin/account"
            className="sm:hidden flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors"
          >
            <Settings className="w-4 h-4" />
            الحساب
          </Link>
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
