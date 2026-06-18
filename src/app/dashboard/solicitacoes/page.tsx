import { createServerClient } from '@/lib/supabase-server';
import SolicitacoesClient from '@/components/dashboard/SolicitacoesClient';
import type { SolicitacaoPPP, EstatisticasPainel } from '@/types';

export const metadata = { title: 'Solicitações' };

export default async function SolicitacoesPage() {
  const supabase = await createServerClient();

  const { data: solicitacoes } = await supabase
    .from('solicitacoes_ppp')
    .select(`*, empresa:empresas(*), responsavel:profiles(id, nome, email, role)`)
    .order('created_at', { ascending: false });

  const { data: membros } = await supabase
    .from('profiles')
    .select('id, nome, email, role')
    .order('nome');

  const lista = (solicitacoes ?? []) as SolicitacaoPPP[];

  const stats: EstatisticasPainel = {
    total:        lista.length,
    pendentes:    lista.filter(s => s.status === 'pendente').length,
    em_andamento: lista.filter(s => s.status === 'em_andamento').length,
    concluidos:   lista.filter(s => s.status === 'concluido').length,
    cancelados:   lista.filter(s => s.status === 'cancelado').length,
  };

  return (
    <SolicitacoesClient
      solicitacoes={lista}
      membros={membros ?? []}
      stats={stats}
    />
  );
}
