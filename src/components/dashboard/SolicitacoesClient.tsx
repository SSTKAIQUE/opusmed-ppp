'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, FileText, Clock, RefreshCw, CheckCircle2,
  ChevronLeft, ChevronRight, Plus, Inbox,
} from 'lucide-react';
import { cn, formatDateTime, maskCPF } from '@/lib/utils';
import StatusPill from '@/components/ui/StatusPill';
import Avatar from '@/components/ui/Avatar';
import type { SolicitacaoPPP, EstatisticasPainel, Profile } from '@/types';

interface Props {
  solicitacoes: SolicitacaoPPP[];
  membros: Partial<Profile>[];
  stats: EstatisticasPainel;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNomeWorker(dados: any): string {
  if (!dados) return '';
  return (dados.trab_nome || dados.trabalhador_nome || '') as string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCpfWorker(dados: any): string {
  if (!dados) return '';
  return (dados.trab_cpf || dados.trabalhador_cpf || '') as string;
}

const POR_PAGINA = 15;
const LIMITE_URGENTE_MS = 3 * 86_400_000;

const FILTROS = [
  { key: 'todos',        label: 'Todas' },
  { key: 'pendente',     label: 'Pendentes' },
  { key: 'em_andamento', label: 'Em andamento' },
  { key: 'concluido',    label: 'Concluídas' },
  { key: 'cancelado',    label: 'Canceladas' },
] as const;

export default function SolicitacoesClient({ solicitacoes, membros, stats }: Props) {
  const router = useRouter();
  const buscaRef = useRef<HTMLInputElement>(null);
  const [busca, setBusca]               = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroResp, setFiltroResp]     = useState('todos');
  const [pagina, setPagina]             = useState(1);

  // Atalho "/" foca a busca
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement;
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName)) {
        e.preventDefault();
        buscaRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return solicitacoes.filter(s => {
      const nomeWorker = getNomeWorker(s.dados_ppp).toLowerCase();
      const matchBusca =
        !termo ||
        s.empresa?.razao_social.toLowerCase().includes(termo) ||
        s.empresa?.cnpj.includes(termo) ||
        nomeWorker.includes(termo);
      const matchStatus = filtroStatus === 'todos' || s.status === filtroStatus;
      const matchResp   = filtroResp   === 'todos' || s.responsavel_id === filtroResp;
      return matchBusca && matchStatus && matchResp;
    });
  }, [solicitacoes, busca, filtroStatus, filtroResp]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaAtual  = Math.min(pagina, totalPaginas);
  const paginadas    = filtradas.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  const urgentes = solicitacoes.filter(
    s => s.status === 'pendente' && Date.now() - new Date(s.created_at).getTime() > LIMITE_URGENTE_MS
  ).length;

  const concluidas = solicitacoes.filter(s => s.status === 'concluido');
  const tempoMedio = concluidas.length
    ? `${(concluidas.reduce((acc, s) => acc + (new Date(s.updated_at).getTime() - new Date(s.created_at).getTime()), 0) / concluidas.length / 86_400_000).toFixed(1)}d`
    : '—';
  const taxa = stats.total ? Math.round((stats.concluidos / stats.total) * 100) : 0;

  const contagem: Record<string, number> = {
    todos: stats.total,
    pendente: stats.pendentes,
    em_andamento: stats.em_andamento,
    concluido: stats.concluidos,
    cancelado: stats.cancelados,
  };

  const kpis = [
    { label: 'Total de solicitações', value: stats.total,        icon: FileText,     tone: 'bg-status-blueBg text-status-blue' },
    { label: 'Pendentes',             value: stats.pendentes,    icon: Clock,        tone: 'bg-status-amberBg text-status-amber', hint: urgentes ? `${urgentes} urgente${urgentes > 1 ? 's' : ''}` : '' },
    { label: 'Em andamento',          value: stats.em_andamento, icon: RefreshCw,    tone: 'bg-status-blueBg text-status-blue' },
    { label: 'Concluídas',            value: stats.concluidos,   icon: CheckCircle2, tone: 'bg-status-greenBg text-status-green', hint: `${taxa}% · tempo médio ${tempoMedio}` },
  ];

  function limparFiltros() {
    setFiltroStatus('todos'); setFiltroResp('todos'); setBusca(''); setPagina(1);
  }

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-8 sm:py-8">
      {/* Cabeçalho */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Solicitações de PPP</h1>
          <p className="mt-0.5 text-sm text-slate-500">Acompanhe e processe os pedidos enviados pelas empresas.</p>
        </div>
        <Link href="/dashboard/empresas" className="btn-primary">
          <Plus className="h-4 w-4" /> Nova solicitação
        </Link>
      </div>

      {/* Indicadores */}
      <div className="mb-5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {kpis.map(k => (
          <div key={k.label} className="flex items-center gap-3.5 rounded-xl border border-[#d6e8f0] bg-gradient-to-b from-white to-[#f4fafd] p-4 shadow-sm">
            <span className={cn('flex h-10 w-10 flex-none items-center justify-center rounded-[11px]', k.tone)}>
              <k.icon className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[28px] font-semibold leading-none tracking-tight text-ink">{k.value}</p>
              <p className="mt-1 truncate text-[12.5px] text-slate-500">{k.label}</p>
              {k.hint && <p className="truncate text-[11.5px] text-slate-400">{k.hint}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Lista */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-slate-200 p-3.5">
          <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-[10px] border border-slate-200 bg-paper px-3 py-2 text-slate-400 focus-within:border-cyan-600 focus-within:ring-2 focus-within:ring-cyan-400/25">
            <Search className="h-4 w-4 flex-none" />
            <input
              ref={buscaRef}
              value={busca}
              onChange={e => { setBusca(e.target.value); setPagina(1); }}
              placeholder="Buscar empresa, CNPJ ou trabalhador…"
              aria-label="Buscar solicitações"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate-400"
            />
            <kbd className="hidden rounded-md border border-slate-200 bg-white px-1.5 text-[11px] text-slate-400 sm:block">/</kbd>
          </label>

          <select
            value={filtroResp}
            onChange={e => { setFiltroResp(e.target.value); setPagina(1); }}
            aria-label="Filtrar por responsável"
            className="rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-600"
          >
            <option value="todos">Todos os responsáveis</option>
            {membros.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </div>

        <div className="flex flex-wrap gap-1.5 border-b border-slate-200 px-3.5 py-2.5" role="tablist" aria-label="Filtrar por status">
          {FILTROS.map(f => (
            <button
              key={f.key}
              role="tab"
              aria-selected={filtroStatus === f.key}
              onClick={() => { setFiltroStatus(f.key); setPagina(1); }}
              className={cn(
                'rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors',
                filtroStatus === f.key
                  ? 'border-[#0b2545] bg-[#0b2545] text-white shadow-[0_0_0_3px_rgba(34,211,238,0.15)]'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              )}
            >
              {f.label}
              <span className="ml-1.5 font-mono text-xs opacity-60">{contagem[f.key]}</span>
            </button>
          ))}
        </div>

        {paginadas.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Inbox className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">Nenhuma solicitação encontrada</p>
            <p className="mt-1 text-sm text-slate-400">Ajuste os filtros ou envie o link do formulário para uma empresa.</p>
            {(filtroStatus !== 'todos' || filtroResp !== 'todos' || busca) && (
              <button onClick={limparFiltros} className="btn-secondary mt-4">Limpar filtros</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-200 bg-paper">
                  {['Empresa', 'Trabalhador', 'Responsável', 'Recebido em', 'Status'].map(h => (
                    <th key={h} scope="col" className="px-4 py-3 text-left font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginadas.map(s => {
                  const nomeWorker = getNomeWorker(s.dados_ppp);
                  const cpfWorker  = getCpfWorker(s.dados_ppp);
                  const href = `/dashboard/solicitacoes/${s.id}`;
                  return (
                    <tr
                      key={s.id}
                      onClick={() => router.push(href)}
                      className="cursor-pointer border-b border-slate-100 transition-colors last:border-b-0 hover:bg-cyan-50/60"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar nome={s.empresa?.razao_social || '?'} />
                          <div className="min-w-0">
                            <Link href={href} className="block max-w-[320px] truncate text-sm font-semibold text-ink hover:text-cyan-700">
                              {s.empresa?.razao_social || '—'}
                            </Link>
                            <p className="font-mono text-xs text-slate-400">{s.empresa?.cnpj || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-medium text-slate-800">
                          {nomeWorker || <span className="text-xs italic text-slate-300">Não informado</span>}
                        </p>
                        <p className="font-mono text-xs text-slate-500">{maskCPF(cpfWorker) || '—'}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        {s.responsavel?.nome ? (
                          <div className="flex items-center gap-2">
                            <Avatar nome={s.responsavel.nome} size="sm" />
                            <span className="text-sm text-slate-700">{s.responsavel.nome}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">Não atribuído</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-500">{formatDateTime(s.created_at)}</td>
                      <td className="px-4 py-3.5"><StatusPill status={s.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-[13px] text-slate-400">
          <span>
            {filtradas.length} resultado{filtradas.length !== 1 ? 's' : ''}
            {filtradas.length !== solicitacoes.length && ` de ${solicitacoes.length}`}
          </span>
          {totalPaginas > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPagina(Math.max(1, paginaAtual - 1))}
                disabled={paginaAtual === 1}
                aria-label="Página anterior"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 font-mono text-xs text-slate-500">{paginaAtual} / {totalPaginas}</span>
              <button
                onClick={() => setPagina(Math.min(totalPaginas, paginaAtual + 1))}
                disabled={paginaAtual === totalPaginas}
                aria-label="Próxima página"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
