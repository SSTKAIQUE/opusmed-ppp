'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Building2, User, Calendar, Paperclip,
  ChevronDown, Loader2, Download, AlertCircle
} from 'lucide-react';
import { cn, formatDateTime, formatDate, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils';
import type { SolicitacaoPPP, Profile, HistoricoAtividade, AgenteNocivo } from '@/types';

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

  const d = solicitacao.dados_ppp;

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
          <Field label="Razão Social"   value={d?.empresa_razao_social} />
          <Field label="CNPJ"           value={d?.empresa_cnpj} />
          <Field label="CNAE"           value={d?.empresa_cnae} />
          <Field label="Grau de Risco"  value={d?.empresa_grau_risco} />
          <Field label="Endereço"       value={d?.empresa_endereco} />
          <Field label="CEP"            value={d?.empresa_cep} />
          <Field label="Cidade/UF"      value={d && `${d.empresa_cidade} / ${d.empresa_uf}`} />
        </Section>

        {/* Identificação do Trabalhador */}
        <Section title="Identificação do Trabalhador" icon={User}>
          <Field label="Nome"           value={d?.trabalhador_nome} />
          <Field label="CPF"            value={d?.trabalhador_cpf} />
          <Field label="NIS/PIS/PASEP"  value={d?.trabalhador_nis_pis_pasep} />
          <Field label="Data Nasc."     value={d?.trabalhador_data_nascimento} />
          <Field label="Sexo"           value={d?.trabalhador_sexo} />
          <Field label="Nome da Mãe"    value={d?.trabalhador_nome_mae} />
          <Field label="CBO"            value={d?.trabalhador_cbo} />
          <Field label="Função"         value={d?.trabalhador_funcao} />
          <Field label="Setor"          value={d?.trabalhador_setor} />
        </Section>
      </div>

      {/* Histórico de Atividades */}
      {d?.historico_atividades?.length > 0 && (
        <Section title="Histórico de Atividades Profissionais" icon={Calendar}>
          <div className="space-y-3">
            {d.historico_atividades.map((h: HistoricoAtividade, i: number) => (
              <div key={i} className="rounded-lg border border-slate-100 p-3 bg-slate-50">
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Período"  value={`${formatDate(h.periodo_inicio)} – ${h.periodo_fim ? formatDate(h.periodo_fim) : 'Atual'}`} />
                  <Field label="Empresa"  value={h.empresa_nome} />
                  <Field label="CNPJ"     value={h.cnpj_empresa} />
                  <Field label="Função"   value={h.funcao} />
                  <Field label="Setor"    value={h.setor} />
                  <Field label="CBO"      value={h.cbo} />
                  <div className="col-span-3">
                    <Field label="Atividades" value={h.descricao_atividades} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Agentes Nocivos */}
      {d?.agentes_nocivos?.length > 0 && (
        <Section title="Exposição a Agentes Nocivos" icon={AlertCircle}>
          <div className="space-y-3">
            {d.agentes_nocivos.map((a: AgenteNocivo, i: number) => (
              <div key={i} className="rounded-lg border border-slate-100 p-3 bg-slate-50 grid grid-cols-3 gap-2">
                <Field label="Tipo"         value={String(a.tipo)} />
                <Field label="Cód. eSocial" value={String(a.codigo_esocial)} />
                <Field label="Descrição"    value={String(a.descricao)} />
                <Field label="Valor"        value={String(a.valor_encontrado)} />
                <Field label="Limite"       value={String(a.limite_tolerancia)} />
                <Field label="EPI"          value={String(a.epi_descricao)} />
                <Field label="CA"           value={String(a.epi_ca)} />
                <Field label="EPC eficaz"   value={a.epc_eficaz ? 'Sim' : 'Não'} />
                <Field label="EPI eficaz"   value={a.epi_eficaz ? 'Sim' : 'Não'} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Responsáveis */}
      <div className="grid grid-cols-2 gap-6">
        <Section title="Resp. Registros Ambientais" icon={User}>
          <Field label="Nome"   value={d?.resp_nome} />
          <Field label="CPF"    value={d?.resp_cpf} />
          <Field label="Cargo"  value={d?.resp_cargo} />
          <Field label="CREA/CRM" value={d?.resp_crea_crm} />
          <Field label="Data"   value={d?.resp_data_elaboracao} />
        </Section>
        <Section title="Resp. Monitorações Biológicas" icon={User}>
          <Field label="Nome"   value={d?.resp_bio_nome} />
          <Field label="CPF"    value={d?.resp_bio_cpf} />
          <Field label="CRM"    value={d?.resp_bio_crm} />
          <Field label="Data"   value={d?.resp_bio_data} />
        </Section>
      </div>

      {/* Representante Legal */}
      <Section title="Representante Legal" icon={User}>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Nome"  value={d?.rep_legal_nome} />
          <Field label="CPF"   value={d?.rep_legal_cpf} />
          <Field label="Cargo" value={d?.rep_legal_cargo} />
        </div>
      </Section>

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

// ─── Sub-componentes internos ─────────────────────────────────────────────────
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
