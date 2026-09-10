'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, FileText, Clock, RefreshCw, CheckCircle2,
  AlertTriangle, Building2, Users, Timer,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn, formatDateTime, STATUS_LABELS } from '@/lib/utils';
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

const STATUS_OPTIONS = ['todos', 'pendente', 'em_andamento', 'concluido', 'cancelado'] as const;
const POR_PAGINA = 15;

const TAG_STYLES: Record<string, string> = {
  pendente:     'border-status-amber bg-status-amberBg text-status-amber',
  em_andamento: 'border-status-blue bg-status-blueBg text-status-blue',
  concluido:    'border-status-green bg-status-greenBg text-status-green',
  cancelado:    'border-status-red bg-status-redBg text-status-red',
};

export default function SolicitacoesClient({ solicitacoes, membros, stats }: Props) {
  const [busca, setBusca]               = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroResp, setFiltroResp]     = useState('todos');
  const [pagina, setPagina]             = useState(1);

  const filtradas = useMemo(() => {
    setPagina(1);
    return solicitacoes.filter(s => {
      const termo = busca.toLowerCase();
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

  const totalPaginas = Math.ceil(filtradas.length / POR_PAGINA);
  const paginadas    = filtradas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const urgentes        = solicitacoes.filter(s => s.status === 'pendente').length;
  const empresasUnicas  = new Set(solicitacoes.map(s => s.empresa_id)).size;
  const trabalhadores   = solicitacoes.length;

  const statCards = [
    { label: 'Total',         value: stats.total,        icon: FileText,      accent: 'blue',  trend: '↑18%', trendTone: 'up',   sub: 'solicitações' },
    { label: 'Pendentes',     value: stats.pendentes,    icon: Clock,         accent: 'amber', trend: '',     trendTone: '',     sub: 'aguardando' },
    { label: 'Em Andamento',  value: stats.em_andamento, icon: RefreshCw,     accent: 'blue',  trend: '',     trendTone: '',     sub: 'com responsável' },
    { label: 'Concluídas',    value: stats.concluidos,   icon: CheckCircle2,  accent: 'green', trend: '',     trendTone: '',     sub: `taxa: ${stats.total ? Math.round(stats.concluidos/stats.total*100) : 0}%` },
    { label: 'Urgentes',      value: urgentes,           icon: AlertTriangle, accent: 'red',   trend: '',     trendTone: '',     sub: 'prazo crítico' },
    { label: 'Empresas',      value: empresasUnicas,     icon: Building2,     accent: 'blue',  trend: '',     trendTone: '',     sub: 'ativas' },
    { label: 'Trabalhadores', value: trabalhadores,      icon: Users,         accent: 'blue',  trend: '',     trendTone: '',     sub: 'envolvidos' },
    { label: 'Tempo Médio',   value: '4.2d',             icon: Timer,         accent: 'blue',  trend: '↓1d',  trendTone: 'down', sub: 'conclusão' },
  ];

  const accentBar: Record<string, string> = {
    blue: 'bg-status-blue', amber: 'bg-status-amber', green: 'bg-status-green', red: 'bg-status-red',
  };

  const statusDist = [
    { label: 'Concluído',    count: stats.concluidos,   pct: stats.total ? Math.round(stats.concluidos/stats.total*100) : 0,    color: '#1E6E4F' },
    { label: 'Em Andamento', count: stats.em_andamento, pct: stats.total ? Math.round(stats.em_andamento/stats.total*100) : 0,  color: '#2C628A' },
    { label: 'Pendente',     count: stats.pendentes,    pct: stats.total ? Math.round(stats.pendentes/stats.total*100) : 0,     color: '#9A6425' },
    { label: 'Cancelado',    count: stats.cancelados,   pct: stats.total ? Math.round(stats.cancelados/stats.total*100) : 0,   color: '#A83B2A' },
  ];

  return (
    <div className="min-h-full bg-paper">

      {/* ── TOPBAR ── */}
      <div className="bg-white border-b border-slate-200 px-[30px] h-[58px] flex items-center gap-4 sticky top-0 z-10">
        <div>
          <span className="font-serif text-base font-semibold text-ink">Solicitações de PPP</span>
          <span className="text-xs text-slate-400 ml-2">/ Painel de Gestão</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 border border-slate-200 rounded-md px-3 py-2 w-56">
          <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar empresa, trabalhador..."
            className="bg-transparent text-[12.5px] text-slate-700 outline-none w-full placeholder:text-slate-400"
          />
        </div>
        <Link
          href="/dashboard/empresas"
          className="flex items-center gap-2 bg-navy text-white text-[12.5px] font-semibold px-[17px] py-2.5 rounded-md hover:bg-navy-dark transition-colors"
        >
          + Nova Solicitação
        </Link>
      </div>

      <div className="px-[30px] py-7 space-y-[22px]">

        {/* ── LEDGER STRIP ── */}
        <div className="bg-white rounded-lg border border-slate-200 flex overflow-x-auto">
          {statCards.map((card, i) => (
            <div key={card.label} className={cn('flex-1 min-w-[130px] px-[19px] py-[17px] relative', i < statCards.length - 1 && 'border-r border-slate-200')}>
              <div className={cn('absolute left-0 top-0 bottom-0 w-[3px]', accentBar[card.accent])} />
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{card.label}</span>
                {card.trend && (
                  <span className={cn('text-[10px] font-semibold font-mono', card.trendTone === 'up' ? 'text-status-green' : 'text-status-blue')}>{card.trend}</span>
                )}
              </div>
              <div className="font-mono text-2xl font-semibold text-ink leading-none">{card.value}</div>
              <div className="text-[10.5px] text-slate-400 mt-1.5">{card.sub}</div>
            </div>
          ))}
        </div>

        {/* ── ANALYTICS ── */}
        <div className="grid grid-cols-[1.05fr_1.6fr] gap-5">

          {/* Status distribution */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <p className="font-serif text-[13.5px] font-semibold text-ink">Distribuição de Status</p>
            <p className="text-[11px] text-slate-400 mt-0.5 mb-4">{stats.total} solicitação{stats.total !== 1 ? 'ões' : ''} no total</p>

            <div className="h-[9px] rounded-sm overflow-hidden flex bg-slate-100 mb-4">
              {statusDist.filter(s => s.pct > 0).map(s => (
                <div key={s.label} style={{ width: `${s.pct}%`, background: s.color }} />
              ))}
            </div>

            <div>
              {statusDist.map((s, i) => (
                <div key={s.label} className={cn('flex items-center text-[12.5px] py-1.5', i > 0 && 'border-t border-slate-50')}>
                  <span className="w-[7px] h-[7px] rounded-sm mr-2.5 flex-shrink-0" style={{ background: s.color }} />
                  <span className="flex-1 text-slate-600">{s.label}</span>
                  <span className="font-mono font-semibold text-slate-800 mr-2.5">{s.count}</span>
                  <span className="font-mono text-slate-400 text-[11px] w-9 text-right">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center mb-4">
              <p className="font-serif text-[13.5px] font-semibold text-ink">Filtros</p>
              {(filtroStatus !== 'todos' || filtroResp !== 'todos' || busca) && (
                <button onClick={() => { setFiltroStatus('todos'); setFiltroResp('todos'); setBusca(''); }} className="ml-auto text-xs text-navy hover:underline">Limpar filtros</button>
              )}
            </div>
            <div className="grid grid-cols-[1fr_1fr_1.4fr] gap-3.5">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Status</label>
                <select
                  value={filtroStatus}
                  onChange={e => setFiltroStatus(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-2.5 py-2 text-[12.5px] text-slate-700 bg-white focus:outline-none focus:border-navy"
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Responsável</label>
                <select
                  value={filtroResp}
                  onChange={e => setFiltroResp(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-2.5 py-2 text-[12.5px] text-slate-700 bg-white focus:outline-none focus:border-navy"
                >
                  <option value="todos">Todos</option>
                  {membros.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Busca</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                    placeholder="Empresa, CNPJ, trabalhador..."
                    className="w-full border border-slate-200 rounded-md pl-9 pr-3 py-2 text-[12.5px] text-slate-700 bg-white focus:outline-none focus:border-navy"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ── TABLE ── */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-[21px] py-[17px] border-b border-slate-200 flex items-baseline justify-between">
            <p className="font-serif text-sm font-semibold text-ink">Solicitações</p>
            <p className="text-[11px] text-slate-400">{filtradas.length} resultado{filtradas.length !== 1 ? 's' : ''}</p>
          </div>

          {paginadas.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl text-slate-400">—</div>
              <p className="text-slate-600 font-semibold text-sm">Nenhuma solicitação encontrada</p>
              <p className="text-slate-400 text-xs mt-1">Tente ajustar os filtros ou cadastre uma nova empresa</p>
              <Link href="/dashboard/empresas" className="inline-flex items-center gap-2 mt-4 bg-navy text-white text-xs font-semibold px-4 py-2 rounded-md hover:bg-navy-dark transition-colors">
                + Nova Solicitação
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200">
                    <th className="text-left px-[21px] py-[11px] text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider">Empresa</th>
                    <th className="text-left px-[21px] py-[11px] text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider">Trabalhador</th>
                    <th className="text-left px-[21px] py-[11px] text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider">CPF</th>
                    <th className="text-left px-[21px] py-[11px] text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider">Responsável</th>
                    <th className="text-left px-[21px] py-[11px] text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider">Recebido</th>
                    <th className="text-left px-[21px] py-[11px] text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-[21px] py-[11px]" />
                  </tr>
                </thead>
                <tbody>
                  {paginadas.map((s) => {
                    const nomeWorker = getNomeWorker(s.dados_ppp);
                    const cpfWorker  = getCpfWorker(s.dados_ppp);
                    const initials = s.responsavel?.nome?.split(' ').map(n => n[0]).slice(0, 2).join('') || '??';
                    return (
                      <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors last:border-b-0">
                        <td className="px-[21px] py-[15px]">
                          <p className="text-[13px] font-semibold text-ink leading-tight">{s.empresa?.razao_social || '—'}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{s.empresa?.cnpj || ''}</p>
                        </td>
                        <td className="px-[21px] py-[15px]">
                          <p className="text-[13px] text-slate-800">{nomeWorker || <span className="text-slate-300 italic text-xs">Não informado</span>}</p>
                        </td>
                        <td className="px-[21px] py-[15px]">
                          <span className="text-xs font-mono text-slate-500">{cpfWorker || '—'}</span>
                        </td>
                        <td className="px-[21px] py-[15px]">
                          {s.responsavel?.nome ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-navy-mid border border-brass-soft flex items-center justify-center text-white text-[10px] font-semibold font-mono flex-shrink-0">{initials}</div>
                              <span className="text-[13px] text-slate-700">{s.responsavel.nome}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300 italic">Não atribuído</span>
                          )}
                        </td>
                        <td className="px-[21px] py-[15px] text-xs font-mono text-slate-500">{formatDateTime(s.created_at)}</td>
                        <td className="px-[21px] py-[15px]">
                          <span className={cn('inline-flex items-center text-[10.5px] font-semibold px-2.5 py-1 border-l-[2.5px]', TAG_STYLES[s.status])}>
                            {STATUS_LABELS[s.status]}
                          </span>
                        </td>
                        <td className="px-[21px] py-[15px]">
                          <Link href={`/dashboard/solicitacoes/${s.id}`} className="text-navy font-semibold text-xs hover:underline transition-colors">Ver →</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPaginas > 1 && (
            <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50/40">
              <span className="text-xs text-slate-400">{filtradas.length} de {solicitacoes.length} solicitações</span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1} className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white disabled:opacity-40 transition">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button key={p} onClick={() => setPagina(p)} className={cn('w-7 h-7 rounded-md text-xs font-semibold transition', pagina === p ? 'bg-navy text-white' : 'border border-slate-200 text-slate-600 hover:bg-white')}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas} className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white disabled:opacity-40 transition">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
