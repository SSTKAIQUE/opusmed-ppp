'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Building2, User, Calendar, Paperclip,
  ChevronDown, Loader2, AlertCircle, FileText, Download, Check
} from 'lucide-react';
import { cn, formatDateTime, STATUS_LABELS } from '@/lib/utils';
import StatusPill from '@/components/ui/StatusPill';
import type { SolicitacaoPPP, Profile } from '@/types';

interface Props {
  solicitacao: SolicitacaoPPP;
  membros: Partial<Profile>[];
  currentProfile: Profile;
}

type StatusType = 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';
const STATUS_OPTIONS: StatusType[] = ['pendente', 'em_andamento', 'concluido', 'cancelado'];

const TIPO_ARQUIVO_LABELS: Record<string, string> = {
  pgr: 'PGR', ltcat: 'LTCAT', ficha_epi: 'Ficha de EPI', outro: 'Outro',
};

function baixarPPP(solicitacao: SolicitacaoPPP) {
  window.location.href = `/api/ppp/${solicitacao.id}/docx`;
}

const ETAPAS = ['Recebido', 'Em análise', 'Concluído'];

function etapaAtual(status: StatusType): number {
  if (status === 'pendente') return 0;
  if (status === 'em_andamento') return 1;
  return 3; // concluído: todas feitas
}

export default function SolicitacaoDetail({ solicitacao, membros }: Props) {
  const router = useRouter();
  const [status, setStatus]           = useState<StatusType>(solicitacao.status as StatusType);
  const [responsavel, setResponsavel] = useState(solicitacao.responsavel_id ?? '');
  const [salvando, setSalvando]       = useState(false);
  const [erro, setErro]               = useState('');
  const [sucesso, setSucesso]         = useState('');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = solicitacao.dados_ppp as any;
  const nomeTrabalhador = d?.trab_nome || d?.trabalhador_nome || 'Trabalhador não informado';
  const alterado = status !== solicitacao.status || responsavel !== (solicitacao.responsavel_id ?? '');
  const etapa = etapaAtual(solicitacao.status as StatusType);

  async function salvarAlteracoes() {
    setSalvando(true);
    setErro('');
    setSucesso('');
    const res = await fetch(`/api/ppp/${solicitacao.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, responsavel_id: responsavel || null }),
    });
    setSalvando(false);
    if (!res.ok) { setErro('Erro ao salvar. Tente novamente.'); }
    else { setSucesso('Alterações salvas.'); router.refresh(); }
  }

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-8 sm:py-8">
      {/* Navegação */}
      <nav aria-label="Caminho" className="mb-3.5 flex items-center gap-2 text-[13px] text-slate-400">
        <Link href="/dashboard/solicitacoes" className="inline-flex items-center gap-1 text-slate-500 hover:text-cyan-700">
          <ArrowLeft className="h-3.5 w-3.5" /> Solicitações
        </Link>
        <span>/</span>
        <span className="truncate font-mono text-xs">{solicitacao.id.slice(0, 8).toUpperCase()}</span>
      </nav>

      {/* Cabeçalho */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-ink">{nomeTrabalhador}</h1>
            <StatusPill status={solicitacao.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {solicitacao.empresa?.razao_social} · recebido em {formatDateTime(solicitacao.created_at)}
          </p>
        </div>
        <button onClick={() => baixarPPP(solicitacao)} className="btn-primary">
          <Download className="h-4 w-4" /> Baixar PPP (Word)
        </button>
      </div>

      {/* Progresso */}
      {solicitacao.status !== 'cancelado' ? (
        <ol className="mb-6 flex" aria-label="Progresso da solicitação">
          {ETAPAS.map((nome, i) => {
            const feita = i < etapa;
            const atual = i === etapa;
            return (
              <li key={nome} className="relative flex flex-1 flex-col gap-2 text-[12.5px]">
                {i < ETAPAS.length - 1 && (
                  <span className={cn('absolute left-7 right-1 top-[13px] h-0.5', feita ? 'bg-status-green' : 'bg-slate-200')} />
                )}
                <span
                  className={cn(
                    'relative z-10 flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 bg-white text-xs font-semibold',
                    feita && 'border-status-green bg-status-green text-white',
                    atual && 'border-cyan-600 text-cyan-700 shadow-[0_0_0_4px_rgba(34,211,238,0.18)]',
                    !feita && !atual && 'border-slate-200 text-slate-400'
                  )}
                >
                  {feita ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                </span>
                <span className={cn(atual ? 'font-semibold text-ink' : 'text-slate-400')}>{nome}</span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mb-6 rounded-[10px] border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          Esta solicitação foi cancelada.
        </p>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_340px]">
        {/* Coluna principal */}
        <div className="space-y-5">
          <Section title="Identificação do trabalhador" icon={User}>
            <div className="grid grid-cols-2 gap-x-5 sm:grid-cols-3">
              <div className="col-span-2 sm:col-span-3"><Field label="Nome" value={d?.trab_nome} /></div>
              <Field label="CPF"                value={d?.trab_cpf} mono />
              <Field label="NIS/PIS/PASEP"      value={d?.trab_nis} mono />
              <Field label="Nascimento"         value={d?.trab_nascimento} />
              <Field label="Sexo"               value={d?.trab_sexo} />
              <Field label="BR/PDH"             value={d?.trab_br_pdh || 'Não'} />
              <Field label="Matrícula eSocial"  value={d?.trab_matricula_esocial} mono />
              <Field label="Cargo"              value={d?.trab_cargo} />
              <Field label="Função"             value={d?.trab_funcao} />
              <Field label="CBO"                value={d?.trab_cbo} mono />
              <Field label="Setor"              value={d?.trab_setor} />
              <Field label="Admissão"           value={d?.trab_admissao} />
              <Field label="Demissão"           value={d?.trab_demissao || 'Ativo'} />
              <Field label="Regime de revezamento" value={d?.trab_regime_revezamento} />
            </div>
          </Section>

          <Section title="Identificação da empresa" icon={Building2}>
            <div className="grid grid-cols-2 gap-x-5 sm:grid-cols-3">
              <div className="col-span-2"><Field label="Razão social" value={d?.empresa_razao_social || solicitacao.empresa?.razao_social} /></div>
              <Field label="CNPJ" value={d?.empresa_cnpj || solicitacao.empresa?.cnpj} mono />
              <Field label="CNAE" value={d?.empresa_cnae} mono />
            </div>
          </Section>

          {(d?.cat_data || d?.cat_numero) && (
            <Section title="Comunicação de Acidente de Trabalho (CAT)" icon={AlertCircle}>
              <div className="grid grid-cols-2 gap-x-5">
                <Field label="Data do registro" value={d?.cat_data ? d.cat_data.split('-').reverse().join('/') : undefined} />
                <Field label="Número da CAT" value={d?.cat_numero} mono />
              </div>
            </Section>
          )}

          {d?.lotacao?.length > 0 && (
            <Section title="Histórico de lotação" icon={Calendar}>
              <Tabela
                cabecalho={['Início', 'Fim', 'CNPJ', 'Setor', 'Cargo', 'Função', 'CBO', 'Cód. CAT']}
                linhas={d.lotacao.map((r: Record<string, string>) => [r.dt_ini, r.dt_fim, r.cnpj, r.setor, r.cargo, r.funcao, r.cbo, r.cod_cat])}
              />
            </Section>
          )}

          {d?.prof?.length > 0 && (
            <Section title="Descrição das atividades" icon={Calendar}>
              <div className="space-y-3">
                {d.prof.map((r: Record<string, string>, i: number) => (
                  <div key={i} className="rounded-[10px] bg-paper p-3.5">
                    <p className="mb-1 font-mono text-xs text-slate-400">{r.dt_ini || '—'} até {r.dt_fim || '—'}</p>
                    <p className="whitespace-pre-wrap text-sm text-slate-800">{r.atividades || '—'}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {d?.amb?.length > 0 && (
            <Section title="Exposição a fatores de risco" icon={AlertCircle}>
              <Tabela
                cabecalho={['Início', 'Fim', 'Tipo', 'Fator', 'Intensidade', 'Técnica', 'EPC', 'EPI', 'C.A.', 'Req. NR-06/09']}
                linhas={d.amb.map((r: Record<string, string>) => [r.dt_ini, r.dt_fim, r.tipo, r.fator, r.intensidade || r.valor, r.tecnica, r.epc, r.epi, r.ca, r.med_protecao || r.neutr_risco])}
              />
            </Section>
          )}

          {d?.resp?.length > 0 && (
            <Section title="Responsáveis pelos registros" icon={User}>
              <Tabela
                cabecalho={['Início', 'Fim', 'CPF', 'CREA/CRM', 'Nome']}
                linhas={d.resp.map((r: Record<string, string>) => [r.dt_ini, r.dt_fim, r.cpf, r.crea, r.nome])}
              />
            </Section>
          )}

          {(d?.rep_nome || d?.rep_cpf) && (
            <Section title="Representante legal" icon={User}>
              <div className="grid grid-cols-2 gap-x-5">
                <Field label="Nome" value={d?.rep_nome} />
                <Field label="CPF" value={d?.rep_cpf} mono />
              </div>
            </Section>
          )}

          {d?.observacoes && (
            <Section title="Observações" icon={AlertCircle}>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{d.observacoes}</p>
            </Section>
          )}
        </div>

        {/* Coluna lateral */}
        <aside className="space-y-5 lg:sticky lg:top-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">Gerenciar</h2>

            <label htmlFor="status" className="mb-1.5 block text-xs font-semibold text-slate-500">Status</label>
            <div className="relative">
              <select
                id="status"
                value={status}
                onChange={e => setStatus(e.target.value as StatusType)}
                className="input-base appearance-none pr-8"
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            <label htmlFor="responsavel" className="mb-1.5 mt-4 block text-xs font-semibold text-slate-500">Responsável</label>
            <div className="relative">
              <select
                id="responsavel"
                value={responsavel}
                onChange={e => setResponsavel(e.target.value)}
                className="input-base appearance-none pr-8"
              >
                <option value="">Não atribuído</option>
                {membros.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            {erro    && <p role="alert" className="mt-3 flex items-center gap-1 text-xs text-red-600"><AlertCircle className="h-3.5 w-3.5" />{erro}</p>}
            {sucesso && <p role="status" className="mt-3 flex items-center gap-1 text-xs text-status-green"><Check className="h-3.5 w-3.5" />{sucesso}</p>}

            <button onClick={salvarAlteracoes} disabled={salvando || !alterado} className="btn-primary mt-4 w-full">
              {salvando ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando…</> : 'Salvar alterações'}
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Documentos anexados {solicitacao.arquivos?.length > 0 && <span className="text-slate-300">({solicitacao.arquivos.length})</span>}
            </h2>
            {solicitacao.arquivos?.length > 0 ? (
              <ul className="space-y-2">
                {solicitacao.arquivos.map(a => (
                  <li key={a.id} className="flex items-center gap-3 rounded-[10px] border border-slate-200 p-2.5">
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[9px] bg-status-blueBg text-status-blue">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold text-ink" title={a.nome_original}>{a.nome_original}</p>
                      <p className="text-xs text-slate-400">{TIPO_ARQUIVO_LABELS[a.tipo]} · {formatDateTime(a.uploaded_at)}</p>
                    </div>
                    <a
                      href={`/api/ppp/arquivo/${a.id}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Baixar ${a.nome_original}`}
                      className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-cyan-700"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="flex items-center gap-2 text-sm text-slate-400"><Paperclip className="h-4 w-4" /> Nenhum arquivo enviado.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-sm font-semibold text-ink">
        <Icon className="h-4 w-4 text-cyan-700" strokeWidth={1.8} />
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, value, mono }: { label: string; value: string | undefined | null; mono?: boolean }) {
  return (
    <div className="mb-3.5">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className={cn('mt-0.5 text-sm text-slate-800', mono && 'font-mono text-[13px]')}>
        {value || <span className="text-slate-300">—</span>}
      </p>
    </div>
  );
}

function Tabela({ cabecalho, linhas }: { cabecalho: string[]; linhas: (string | undefined)[][] }) {
  return (
    <div className="overflow-x-auto rounded-[10px] border border-slate-200">
      <table className="w-full min-w-[560px] border-collapse text-[13px]">
        <thead>
          <tr className="bg-paper">
            {cabecalho.map(h => (
              <th key={h} scope="col" className="whitespace-nowrap border-b border-slate-200 px-3 py-2.5 text-left font-mono text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => (
            <tr key={i} className="border-b border-slate-100 last:border-b-0 hover:bg-cyan-50/50">
              {l.map((c, j) => <td key={j} className="px-3 py-2 text-slate-700">{c || '—'}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
