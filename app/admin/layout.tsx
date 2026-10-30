import type { Metadata } from 'next';
import { getAdminSession } from '@/lib/session';
import { AdminHeader } from '@/components/AdminHeader';

export const metadata: Metadata = {
  title: 'لوحة إدارة أفاق',
  description: 'لوحة الإدارة الداخلية لأفاق إبداعية',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  const loggedIn = Boolean(session.isLoggedIn);

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-afaq-bg flex flex-col">
        <main className="flex-1 flex flex-col">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-afaq-bg flex flex-col">
      <AdminHeader
        admin={{
          name: session.name || undefined,
          email: session.email || undefined,
        }}
      />
      <main className="flex-1 flex flex-col px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
