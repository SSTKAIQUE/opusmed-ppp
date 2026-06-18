import { createServerClient } from '@/lib/supabase-server';
import EmpresasClient from '@/components/dashboard/EmpresasClient';
import type { Empresa } from '@/types';

export const metadata = { title: 'Empresas' };

export default async function EmpresasPage() {
  const supabase = await createServerClient();

  const { data: empresas } = await supabase
    .from('empresas')
    .select('*')
    .order('razao_social');

  const { data: sessionData } = await supabase.auth.getSession();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', sessionData.session!.user.id)
    .single();

  return (
    <EmpresasClient
      empresas={(empresas ?? []) as Empresa[]}
      isAdmin={profile?.role === 'admin'}
    />
  );
}
