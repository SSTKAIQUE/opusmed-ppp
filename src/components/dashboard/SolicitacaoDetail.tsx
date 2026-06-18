'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Building2, User, Calendar, Paperclip,
  ChevronDown, Loader2, Download, AlertCircle
} from 'lucide-react';
import { cn, formatDateTime, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils';
import type { SolicitacaoPPP, Profile } from '@/types';

interface Props {
  solicitacao: SolicitacaoPPP;
  membros: Partial<Profile>[];
  currentProfile: Profile;
}

type StatusType = 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';
const STATUS_OPTIONS: StatusType[] = ['pendente', 'em_andamento', 'concluido', 'cancelado'];

const TIPO_ARQUIVO_LABELS: Record<string, string> = {
  pgr: 'PGR',
  ltcat: 'LTCAT',
  ficha_epi: 'Ficha de EPI',
  outro: 'Outro',
};

export default function SolicitacaoDetail({ solicitacao, membros, currentProfile }: Props) {
  const router = useRouter();
  const [status, setStatus]           = useState<StatusType>(solicitacao.status as StatusType);
  const [responsavel, setResponsavel] = useState(solicitacao.responsavel_id ?? '');
  const [salvando, setSalvando]       = useState(false);
  const [erro, setErro]               = useState('');
  const [sucesso, setSucesso]         = useState('');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = solicitacao.dados_ppp as any;

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
    if (!res.ok) {
      setErro('Erro ao salvar. Tente novamente.');
    } else {
      setSucesso('Alterações salvas com sucesso.');
      router.refresh();
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/solicitacoes" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
        <span className="text-xs text-slate-400">ID: {solicitacao.id}</span>
      </div>

      {/* Header */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {solicitacao.empresa?.razao_social}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">CNPJ: {solicitacao.empresa?.cnpj}</p>
            <p className="text-sm text-slate-500">
              Recebido em {formatDateTime(solicitacao.created_at)}
            </p>
          </div>

          {/* Status + Responsável + Salvar */}
          <div className="flex flex-col gap-3 min-w-64">
            <div>
              <label className="label-base">Status</label>
              <div className="relative">
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as StatusType)}
                  disabled={currentProfile.role !== 'admin' && currentProfile.role !== 'tecnico'}
                  className={cn('input-base appearance-none pr-8', STATUS_COLORS[status])}
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-current pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="label-base">Responsável</label>
              <select
                value={responsavel}
                onChange={e => setResponsavel(e.target.value)}
                className="input-base appearance-none"
              >
                <option value="">— Não atribuído —</option>
                {membros.map(m => (
                  <option key={m.id} value={m.id}>{m.nome}</option>
                ))}
              </select>
            </div>

            {erro    && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{erro}</p>}
            {sucesso && <p className="text-xs text-green-600">{sucesso}</p>}

            <button onClick={salvarAlteracoes} disabled={salvando} className="btn-primary">
              {salvando ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : 'Salvar alterações'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Identificação da Empresa */}
        <Section title="Identificação da Empresa" icon={Building2}>
          <Field label="Razão Social" value={d?.empresa_razao_social} />
          <Field label="CNPJ"         value={d?.empresa_cnpj} />
          <Field label="CNAE"         value={d?.empresa_cnae} />
        </Section>

        {/* Identificação do Trabalhador */}
        <Section title="Identificação do Trabalhador" icon={User}>
          <Field label="Nome"          value={d?.trab_nome || d?.trabalhador_nome} />
          <Field label="CPF"           value={d?.trab_cpf || d?.trabalhador_cpf} />
          <Field label="NIS/PIS/PASEP" value={d?.trab_nis || d?.trabalhador_nis_pis_pasep} />
          <Field label="Data Nasc."    value={d?.trab_nascimento || d?.trabalhador_data_nascimento} />
          <Field label="Sexo"          value={d?.trab_sexo || d?.trabalhador_sexo} />
          <Field label="Nome da Mãe"   value={d?.trab_mae || d?.trabalhador_nome_mae} />
          <Field label="CBO"           value={d?.trab_cbo || d?.trabalhador_cbo} />
          <Field label="Cargo"         value={d?.trab_cargo} />
          <Field label="Função"        value={d?.trab_funcao || d?.trabalhador_funcao} />
          <Field label="Setor"         value={d?.trab_setor || d?.trabalhador_setor} />
          <Field label="Admissão"      value={d?.trab_admissao} />
          <Field label="Demissão"      value={d?.trab_demissao} />
        </Section>
      </div>

      {/* Lotação */}
      {d?.lotacao?.length > 0 && (
        <Section title="Histórico de Lotação" icon={Calendar}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  {['Início','Fim','CNPJ','Setor','Cargo','Função','CBO','Cód. CAT'].map(h => (
                    <th key={h} className="border border-slate-200 px-2 py-2 text-left font-semibold text-slate-500 uppercase text-[10px] tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.lotacao.map((r: Record<string, string>, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="border border-slate-200 px-2 py-1.5">{r.dt_ini || '—'}</td>
                    <td className="border border-slate-200 px-2 py-1.5">{r.dt_fim || '—'}</td>
                    <td className="border border-slate-200 px-2 py-1.5">{r.cnpj || '—'}</td>
                    <td className="border border-slate-200 px-2 py-1.5">{r.setor || '—'}</td>
                    <td className="border border-slate-200 px-2 py-1.5">{r.cargo || '—'}</td>
                    <td className="border border-slate-200 px-2 py-1.5">{r.funcao || '—'}</td>
                    <td className="border border-slate-200 px-2 py-1.5">{r.cbo || '—'}</td>
                    <td className="border border-slate-200 px-2 py-1.5">{r.cod_cat || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Profissiografia */}
      {d?.prof?.length > 0 && (
        <Section title="Descrição das Atividades" icon={Calendar}>
          <div className="space-y-3">
            {d.prof.map((r: Record<string, string>, i: number) => (
              <div key={i} className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">{r.dt_ini || '—'} até {r.dt_fim || '—'}</p>
                <p className="text-sm text-slate-800 whitespace-pre-wrap">{r.atividades || '—'}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Registros Ambientais */}
      {d?.amb?.length > 0 && (
        <Section title="Registros Ambientais" icon={AlertCircle}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  {['Início','Fim','Tipo','Fator','Valor','Técnica','EPC','EPI','C.A.','Neutrl.','Efic. EPI','Desc. EPI'].map(h => (
                    <th key={h} className="border border-slate-200 px-2 py-2 text-left font-semibold text-slate-500 uppercase text-[10px] tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.amb.map((r: Record<string, string>, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="border border-slate-200 px-2 py-1.5">{r.dt_ini || '—'}</td>
                    <td className="border border-slate-200 px-2 py-1.5">{r.dt_fim || '—'}</td>
                    <td className="border border-slate-200 px-2 py-1.5">{r.tipo || '—'}</td>
                    <td className="border border-slate-200 px-2 py-1.5">{r.fator || '—'}</td>
                    <td className="border border-slate-200 px-2 py-1.5">{r.valor || '—'}</td>
                    <td className="border border-slate-200 px-2 py-1.5">{r.tecnica || '—'}</td>
                    <td className="border border-slate-200 px-2 py-1.5 text-center">{r.epc || '—'}</td>
                    <td className="border border-slate-200 px-2 py-1.5 text-center">{r.epi || '—'}</td>
                    <td className="border border-slate-200 px-2 py-1.5">{r.ca || '—'}</td>
                    <td className="border border-slate-200 px-2 py-1.5 text-center">{r.neutr_risco || '—'}</td>
                    <td className="border border-slate-200 px-2 py-1.5 text-center">{r.efic_epi || '—'}</td>
                    <td className="border border-slate-200 px-2 py-1.5">{r.desc_epi || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Responsáveis */}
      {d?.resp?.length > 0 && (
        <Section title="Responsáveis pelos Registros" icon={User}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  {['Início','Fim','CPF','CREA/CRM','Nome'].map(h => (
                    <th key={h} className="border border-slate-200 px-2 py-2 text-left font-semibold text-slate-500 uppercase text-[10px] tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.resp.map((r: Record<string, string>, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="border border-slate-200 px-2 py-1.5">{r.dt_ini || '—'}</td>
                    <td className="border border-slate-200 px-2 py-1.5">{r.dt_fim || '—'}</td>
                    <td className="border border-slate-200 px-2 py-1.5">{r.cpf || '—'}</td>
                    <td className="border border-slate-200 px-2 py-1.5">{r.crea || '—'}</td>
                    <td className="border border-slate-200 px-2 py-1.5">{r.nome || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Emissão */}
      {(d?.emissao_data || d?.rep_nome || d?.rep_cpf) && (
        <Section title="Emissão e Representante Legal" icon={User}>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Data de Emissão"    value={d?.emissao_data} />
            <Field label="CPF do Representante" value={d?.rep_cpf} />
            <Field label="Nome do Representante" value={d?.rep_nome} />
          </div>
        </Section>
      )}

      {/* Observações */}
      {d?.observacoes && (
        <Section title="Observações" icon={AlertCircle}>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{d.observacoes}</p>
        </Section>
      )}

      {/* Arquivos */}
      {solicitacao.arquivos?.length > 0 && (
        <Section title="Documentos Anexados" icon={Paperclip}>
          <div className="space-y-2">
            {solicitacao.arquivos.map(a => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Paperclip className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{a.nome_original}</p>
                    <p className="text-xs text-slate-500">{TIPO_ARQUIVO_LABELS[a.tipo]} · {formatDateTime(a.uploaded_at)}</p>
                  </div>
                </div>
                <a
                  href={`/api/ppp/arquivo/${a.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary py-1.5 px-3 text-xs"
                >
                  <Download className="w-3 h-3" />
                  Baixar
                </a>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({
  title, icon: Icon, children
}: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <Icon className="w-4 h-4 text-navy" />
        <h2 className="font-semibold text-slate-800 text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | undefined | null }) {
  return (
    <div className="mb-2">
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm text-slate-800 mt-0.5">{value || <span className="text-slate-300">—</span>}</p>
    </div>
  );
}
