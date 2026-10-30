import { redirect } from 'next/navigation';

// The admin panel is unified around the talents dashboard: /admin always
// lands there. Other admin sections stay reachable via the header.
export default function AdminIndexPage() {
  redirect('/admin/talents');
}
