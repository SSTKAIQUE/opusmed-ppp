import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import Sidebar from '@/components/dashboard/Sidebar';
import type { Profile } from '@/types';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!profile) redirect('/auth/login');

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar profile={profile as Profile} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
