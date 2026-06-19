'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Filter, ClipboardList, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { cn, formatDateTime, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils';
import type { SolicitacaoPPP, EstatisticasPainel, Profile } from '@/types';

interface Props {
  solicitacoes: SolicitacaoPPP[];
  membros: Partial<Profile>[];
  stats: EstatisticasPainel;
}

const STATUS_OPTIONS = ['todos', 'pendente', 'em_andamento', 'concluido', 'cancelado'] as const;
const POR_PAGINA = 20;

export default function SolicitacoesClient({ solicitacoes, membros, stats }: Props) {
  const [busca, setBusca]               = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroResp, setFiltroResp]     = useState('todos');
  const [pagina, setPagina]             = useState(1);

  const filtradas = useMemo(() => {
    setPagina(1);
    return solicitacoes.filter(s => {
      const termo = busca.toLowerCase();
      const ppp = s.dados_ppp as Record<string, string>;
      const nomeWorker = ppp?.trab_nome?.toLowerCase() || ppp?.trabalhador_nome?.toLowerCase() || '';
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

  const statCards = [
    { label: 'Total',        value: stats.total,        icon: TrendingUp,    color: 'text-slate-600',  bg: 'bg-slate-100'  },
    { label: 'Pendentes',    value: stats.pendentes,    icon: Clock,         color: 'text-yellow-700', bg: 'bg-yellow-100' },
    { label: 'Em andamento', value: stats.em_andamento, icon: ClipboardList, color: 'text-blue-700',   bg: 'bg-blue-100'   },
    { label: 'Concluídos',   value: stats.concluidos,   icon: CheckCircle,   color: 'text-green-700',  bg: 'bg-green-100'  },
    { label: 'Cancelados',   value: stats.cancelados,   icon: XCircle,       color: 'text-red-700',    bg: 'bg-red-100'    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Solicitações de PPP</h1>
        <p className="text-sm text-slate-500 mt-1">Gerencie todas as solicitações recebidas das empresas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="card p-4">
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3', card.bg)}>
              <card.icon className={cn('w-5 h-5', card.color)} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por empresa, CNPJ ou trabalhador..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="input-base pl-9"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className="input-base pl-9 pr-8 appearance-none cursor-pointer">
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <select value={filtroResp} onChange={e => setFiltroResp(e.target.value)} className="input-base appearance-none cursor-pointer">
            <option value="todos">Todos os responsáveis</option>
            {membros.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </div>
      </div>

      {/* Lista */}
      <div className="card overflow-hidden">
        {paginadas.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Nenhuma solicitação encontrada</p>
            <p className="text-slate-400 text-sm mt-1">Tente ajustar os filtros</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Empresa','Trabalhador','Status','Responsável','Recebido em',''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginadas.map(s => {
                const ppp2 = s.dados_ppp as Record<string, string>;
                const nomeWorker = ppp2?.trab_nome || ppp2?.trabalhador_nome;
                return (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-900 leading-none">{s.empresa?.razao_social || '—'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{s.empresa?.cnpj || ''}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">
                      {nomeWorker || <span className="text-slate-300">Não informado</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', STATUS_COLORS[s.status])}>
                        {STATUS_LABELS[s.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {s.responsavel?.nome || <span className="text-slate-300">Não atribuído</span>}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">{formatDateTime(s.created_at)}</td>
                    <td className="px-5 py-3.5">
                      <Link href={`/dashboard/solicitacoes/${s.id}`} className="text-navy font-medium text-xs hover:underline">Ver →</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{filtradas.length} de {solicitacoes.length} solicitações</span>
        {totalPaginas > 1 && (
          <div className="flex items-center gap-2">
            <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1} className="btn-secondary py-1 px-3 text-xs disabled:opacity-40">← Anterior</button>
            <span className="text-slate-500">Página {pagina} de {totalPaginas}</span>
            <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas} className="btn-secondary py-1 px-3 text-xs disabled:opacity-40">Próxima →</button>
          </div>
        )}
      </div>
    </div>
  );
}
