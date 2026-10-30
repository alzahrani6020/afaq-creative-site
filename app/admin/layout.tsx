import { getAdminSession } from '@/lib/session';
import { AdminHeader } from '@/components/AdminHeader';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  const loggedIn = Boolean(session.isLoggedIn);

  // Single admin shell: header only after login.
  // Login page is a standalone card (no second chrome bar).
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
