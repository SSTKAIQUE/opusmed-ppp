'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, FileText, Clock, RefreshCw, CheckCircle2,
  AlertTriangle, Building2, Users, Timer, Filter,
  TrendingUp, ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn, formatDateTime, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils';
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

const BADGE_STYLES: Record<string, string> = {
  pendente:     'bg-amber-50 text-amber-800 border border-amber-200',
  em_andamento: 'bg-blue-50 text-blue-800 border border-blue-200',
  concluido:    'bg-emerald-50 text-emerald-800 border border-emerald-200',
  cancelado:    'bg-red-50 text-red-800 border border-red-200',
};

const BADGE_DOT: Record<string, string> = {
  pendente: 'bg-amber-400', em_andamento: 'bg-blue-500',
  concluido: 'bg-emerald-500', cancelado: 'bg-red-500',
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

  // Stats extras calculados
  const urgentes     = solicitacoes.filter(s => s.status === 'pendente').length;
  const empresasUnicas = new Set(solicitacoes.map(s => s.empresa_id)).size;
  const trabalhadores = solicitacoes.length;

  const statCards = [
    { label: 'Total',         value: stats.total,        icon: FileText,      color: 'blue',    trend: '+18%', sub: 'solicitações' },
    { label: 'Pendentes',     value: stats.pendentes,    icon: Clock,         color: 'amber',   trend: '',     sub: 'aguardando' },
    { label: 'Em Andamento',  value: stats.em_andamento, icon: RefreshCw,     color: 'blue2',   trend: '',     sub: 'com responsável' },
    { label: 'Concluídas',    value: stats.concluidos,   icon: CheckCircle2,  color: 'green',   trend: '',     sub: `taxa: ${stats.total ? Math.round(stats.concluidos/stats.total*100) : 0}%` },
    { label: 'Urgentes',      value: urgentes,           icon: AlertTriangle, color: 'red',     trend: '',     sub: 'prazo crítico' },
    { label: 'Empresas',      value: empresasUnicas,     icon: Building2,     color: 'teal',    trend: '',     sub: 'ativas' },
    { label: 'Trabalhadores', value: trabalhadores,      icon: Users,         color: 'indigo',  trend: '',     sub: 'envolvidos' },
    { label: 'Tempo Médio',   value: '4.2d',             icon: Timer,         color: 'purple',  trend: '↓1d',  sub: 'conclusão' },
  ];

  const colorMap: Record<string, { icon: string; bar: string; badge: string }> = {
    blue:   { icon: 'bg-blue-50 text-blue-600',    bar: 'from-blue-700 to-blue-500',    badge: 'bg-blue-600' },
    amber:  { icon: 'bg-amber-50 text-amber-600',  bar: 'from-amber-500 to-yellow-400', badge: 'bg-amber-500' },
    blue2:  { icon: 'bg-sky-50 text-sky-600',      bar: 'from-sky-600 to-sky-400',      badge: 'bg-sky-500' },
    green:  { icon: 'bg-emerald-50 text-emerald-600', bar: 'from-emerald-600 to-green-400', badge: 'bg-emerald-500' },
    red:    { icon: 'bg-red-50 text-red-600',      bar: 'from-red-600 to-red-400',      badge: 'bg-red-500' },
    teal:   { icon: 'bg-teal-50 text-teal-600',    bar: 'from-teal-600 to-cyan-400',    badge: 'bg-teal-500' },
    indigo: { icon: 'bg-indigo-50 text-indigo-600', bar: 'from-indigo-600 to-indigo-400', badge: 'bg-indigo-500' },
    purple: { icon: 'bg-purple-50 text-purple-600', bar: 'from-purple-600 to-purple-400', badge: 'bg-purple-500' },
  };

  // Status distribution
  const statusDist = [
    { label: 'Concluído',    count: stats.concluidos,   pct: stats.total ? Math.round(stats.concluidos/stats.total*100) : 0,    color: '#10B981' },
    { label: 'Em Andamento', count: stats.em_andamento, pct: stats.total ? Math.round(stats.em_andamento/stats.total*100) : 0,  color: '#3B82F6' },
    { label: 'Pendente',     count: stats.pendentes,    pct: stats.total ? Math.round(stats.pendentes/stats.total*100) : 0,     color: '#F59E0B' },
    { label: 'Cancelado',    count: stats.cancelados,   pct: stats.total ? Math.round(stats.cancelados/stats.total*100) : 0,   color: '#EF4444' },
  ];

  return (
    <div className="min-h-full bg-slate-50">

      {/* ── TOPBAR ── */}
      <div className="bg-white border-b border-slate-200 px-8 h-14 flex items-center gap-4 sticky top-0 z-10">
        <div>
          <span className="text-[15px] font-bold text-slate-900">Solicitações de PPP</span>
          <span className="text-xs text-slate-400 ml-2">/ Painel de Gestão</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-56">
          <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar empresa, trabalhador..."
            className="bg-transparent text-sm text-slate-700 outline-none w-full placeholder:text-slate-400"
          />
        </div>
        <Link
          href="/dashboard/empresas"
          className="flex items-center gap-2 bg-gradient-to-r from-[#1B3D6F] to-[#2A5298] text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
        >
          ➕ Nova Solicitação
        </Link>
      </div>

      <div className="px-8 py-6 space-y-6">

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-4 xl:grid-cols-8 gap-4">
          {statCards.map((card) => {
            const c = colorMap[card.color];
            return (
              <div key={card.label} className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-all hover:-translate-y-0.5 relative overflow-hidden group">
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${c.bar}`} />
                <div className="flex items-start justify-between mb-3">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', c.icon)}>
                    <card.icon className="w-4.5 h-4.5" strokeWidth={2} />
                  </div>
                  {card.trend && (
                    <span className="text-[10px] font-700 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{card.trend}</span>
                  )}
                </div>
                <div className="text-2xl font-800 text-slate-900 leading-none mb-1">{card.value}</div>
                <div className="text-xs font-600 text-slate-600">{card.label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{card.sub}</div>
              </div>
            );
          })}
        </div>

        {/* ── ANALYTICS ── */}
        <div className="grid grid-cols-3 gap-5">

          {/* Status distribution */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-700 text-slate-900">Distribuição de Status</p>
                <p className="text-xs text-slate-400 mt-0.5">{stats.total} solicitações totais</p>
              </div>
              <TrendingUp className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-3">
              {statusDist.map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <span className="text-xs text-slate-600 flex-1">{s.label}</span>
                  <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${s.pct}%`, background: s.color }} />
                  </div>
                  <span className="text-xs font-700 text-slate-800 w-6 text-right">{s.count}</span>
                  <span className="text-[11px] text-slate-400 w-8 text-right">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Filtros avançados */}
          <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-slate-400" />
              <p className="text-sm font-700 text-slate-900">Filtros</p>
              {(filtroStatus !== 'todos' || filtroResp !== 'todos' || busca) && (
                <button onClick={() => { setFiltroStatus('todos'); setFiltroResp('todos'); setBusca(''); }} className="ml-auto text-xs text-blue-600 hover:underline">Limpar filtros</button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-600 text-slate-500 uppercase tracking-wide block mb-1.5">Status</label>
                <select
                  value={filtroStatus}
                  onChange={e => setFiltroStatus(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-600 text-slate-500 uppercase tracking-wide block mb-1.5">Responsável</label>
                <select
                  value={filtroResp}
                  onChange={e => setFiltroResp(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="todos">Todos</option>
                  {membros.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-[11px] font-600 text-slate-500 uppercase tracking-wide block mb-1.5">Busca</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                    placeholder="Empresa, CNPJ, trabalhador..."
                    className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ── TABLE ── */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-700 text-slate-900">Solicitações</p>
              <p className="text-xs text-slate-400 mt-0.5">{filtradas.length} resultado{filtradas.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {paginadas.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">📋</div>
              <p className="text-slate-600 font-600 text-sm">Nenhuma solicitação encontrada</p>
              <p className="text-slate-400 text-xs mt-1">Tente ajustar os filtros ou cadastre uma nova empresa</p>
              <Link href="/dashboard/empresas" className="inline-flex items-center gap-2 mt-4 bg-[#1B3D6F] text-white text-xs font-600 px-4 py-2 rounded-lg hover:bg-[#0F2647] transition">
                ➕ Nova Solicitação
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-5 py-3 text-[11px] font-700 text-slate-400 uppercase tracking-wider">Empresa</th>
                    <th className="text-left px-5 py-3 text-[11px] font-700 text-slate-400 uppercase tracking-wider">Trabalhador</th>
                    <th className="text-left px-5 py-3 text-[11px] font-700 text-slate-400 uppercase tracking-wider">CPF</th>
                    <th className="text-left px-5 py-3 text-[11px] font-700 text-slate-400 uppercase tracking-wider">Responsável</th>
                    <th className="text-left px-5 py-3 text-[11px] font-700 text-slate-400 uppercase tracking-wider">Recebido</th>
                    <th className="text-left px-5 py-3 text-[11px] font-700 text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {paginadas.map((s, idx) => {
                    const nomeWorker = getNomeWorker(s.dados_ppp);
                    const cpfWorker  = getCpfWorker(s.dados_ppp);
                    const initials = s.responsavel?.nome?.split(' ').map(n => n[0]).slice(0, 2).join('') || '??';
                    return (
                      <tr key={s.id} className={cn('border-b border-slate-50 hover:bg-blue-50/30 transition-colors', idx % 2 === 0 ? '' : 'bg-slate-50/30')}>
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-600 text-slate-900 leading-tight">{s.empresa?.razao_social || '—'}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{s.empresa?.cnpj || ''}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-500 text-slate-800">{nomeWorker || <span className="text-slate-300 italic text-xs">Não informado</span>}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-mono text-slate-500">{cpfWorker || '—'}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          {s.responsavel?.nome ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#1B3D6F] to-[#3B82F6] flex items-center justify-center text-white text-[10px] font-700 flex-shrink-0">{initials}</div>
                              <span className="text-sm text-slate-700">{s.responsavel.nome}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300 italic">Não atribuído</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500">{formatDateTime(s.created_at)}</td>
                        <td className="px-5 py-3.5">
                          <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-600 px-2.5 py-1 rounded-full', BADGE_STYLES[s.status])}>
                            <span className={cn('w-1.5 h-1.5 rounded-full', BADGE_DOT[s.status])} />
                            {STATUS_LABELS[s.status]}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <Link href={`/dashboard/solicitacoes/${s.id}`} className="text-[#1B3D6F] font-600 text-xs hover:text-blue-600 hover:underline transition-colors">Ver →</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs text-slate-400">{filtradas.length} de {solicitacoes.length} solicitações</span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white disabled:opacity-40 transition">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button key={p} onClick={() => setPagina(p)} className={cn('w-7 h-7 rounded-lg text-xs font-600 transition', pagina === p ? 'bg-[#1B3D6F] text-white' : 'border border-slate-200 text-slate-600 hover:bg-white')}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white disabled:opacity-40 transition">
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
