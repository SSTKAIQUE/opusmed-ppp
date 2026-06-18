import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import SolicitacaoDetail from '@/components/dashboard/SolicitacaoDetail';
import type { SolicitacaoPPP, Profile } from '@/types';

export const metadata = { title: 'Detalhe da Solicitação' };

export default async function SolicitacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data } = await supabase
    .from('solicitacoes_ppp')
    .select(`*, empresa:empresas(*), responsavel:profiles(id, nome, email, role), arquivos:arquivos_ppp(*)`)
    .eq('id', id)
    .single();

  if (!data) notFound();

  const { data: membros } = await supabase
    .from('profiles')
    .select('id, nome, email, role')
    .order('nome');

  const { data: sessionData } = await supabase.auth.getSession();
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', sessionData.session!.user.id)
    .single();

  return (
    <SolicitacaoDetail
      solicitacao={data as SolicitacaoPPP}
      membros={membros ?? []}
      currentProfile={profile as Profile}
    />
  );
}
