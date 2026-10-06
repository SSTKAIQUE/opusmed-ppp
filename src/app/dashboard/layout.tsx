import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import Sidebar from '@/components/dashboard/Sidebar';
import type { Profile } from '@/types';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/auth/login');

  const { count: pendentes } = await supabase
    .from('solicitacoes_ppp')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pendente');

  return (
    <div className="flex h-screen overflow-hidden bg-paper bg-[radial-gradient(900px_300px_at_80%_-80px,rgba(34,211,238,0.08),transparent)]">
      <Sidebar profile={profile as Profile} pendentes={pendentes ?? 0} />
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  );
}
