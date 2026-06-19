'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Building2, User, Calendar, Paperclip,
  ChevronDown, Loader2, Download, AlertCircle, FileText, Printer
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
  pgr: 'PGR', ltcat: 'LTCAT', ficha_epi: 'Ficha de EPI', outro: 'Outro',
};

function gerarPDF(solicitacao: SolicitacaoPPP) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = solicitacao.dados_ppp as any;
  const empresa = solicitacao.empresa;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>PPP – ${d?.trab_nome || 'Trabalhador'} – ${empresa?.razao_social || ''}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; background: white; }
  .header { background: #1F4E79; color: white; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; }
  .header h1 { font-size: 15px; font-weight: bold; }
  .header p { font-size: 10px; opacity: 0.75; margin-top: 2px; }
  .header-right { text-align: right; font-size: 10px; opacity: 0.8; }
  .section { margin: 12px 16px 0; }
  .section-title { background: #1F4E79; color: white; padding: 5px 10px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; border-radius: 4px 4px 0 0; }
  .section-body { border: 1px solid #cdd8e8; border-top: none; padding: 10px; border-radius: 0 0 4px 4px; background: #fafcff; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .field label { font-size: 9px; font-weight: bold; color: #2a4a6a; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 2px; }
  .field span { font-size: 11px; color: #1a1a1a; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  th { background: #D6E4F0; border: 1px solid #c0d4e8; padding: 4px 6px; text-align: left; font-size: 9px; font-weight: bold; color: #1F4E79; text-transform: uppercase; white-space: nowrap; }
  td { border: 1px solid #dde8f4; padding: 4px 6px; font-size: 10px; }
  .footer { margin: 16px 16px 24px; padding: 10px; border: 1px solid #dde8f4; border-radius: 4px; background: #f4f8fd; }
  .footer p { font-size: 10px; color: #3a5a7a; line-height: 1.5; }
  .footer strong { color: #1F4E79; }
  .assinatura { margin: 24px 16px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
  .assinatura-linha { border-top: 1px solid #333; padding-top: 6px; text-align: center; font-size: 10px; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .header { -webkit-print-color-adjust: exact; }
    .section-title { -webkit-print-color-adjust: exact; }
    th { -webkit-print-color-adjust: exact; }
  }
</style>
</head>
<body>

<div class="header">
  <div>
    <h1>🛡️ OPUSMED SST — Perfil Profissiográfico Previdenciário (PPP)</h1>
    <p>Documento gerado pelo sistema Opusmed · ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'})}</p>
  </div>
  <div class="header-right">
    <p>ID: ${solicitacao.id.slice(0,8).toUpperCase()}</p>
    <p>Status: ${STATUS_LABELS[solicitacao.status]}</p>
  </div>
</div>

<!-- Dados da Empresa -->
<div class="section">
  <div class="section-title">1. Identificação da Empresa</div>
  <div class="section-body">
    <div class="grid-2">
      <div class="field"><label>Razão Social</label><span>${d?.empresa_razao_social || empresa?.razao_social || '—'}</span></div>
      <div class="field"><label>CNPJ</label><span>${d?.empresa_cnpj || empresa?.cnpj || '—'}</span></div>
      <div class="field"><label>CNAE</label><span>${d?.empresa_cnae || '—'}</span></div>
    </div>
  </div>
</div>

<!-- Dados do Trabalhador -->
<div class="section">
  <div class="section-title">2. Identificação do Trabalhador</div>
  <div class="section-body">
    <div class="grid">
      <div class="field"><label>Nome</label><span>${d?.trab_nome || '—'}</span></div>
      <div class="field"><label>CPF</label><span>${d?.trab_cpf || '—'}</span></div>
      <div class="field"><label>NIS/PIS/PASEP</label><span>${d?.trab_nis || '—'}</span></div>
      <div class="field"><label>Data de Nascimento</label><span>${d?.trab_nascimento || '—'}</span></div>
      <div class="field"><label>Sexo</label><span>${d?.trab_sexo || '—'}</span></div>
      <div class="field"><label>Nome da Mãe</label><span>${d?.trab_mae || '—'}</span></div>
      <div class="field"><label>CBO</label><span>${d?.trab_cbo || '—'}</span></div>
      <div class="field"><label>Cargo</label><span>${d?.trab_cargo || '—'}</span></div>
      <div class="field"><label>Função</label><span>${d?.trab_funcao || '—'}</span></div>
      <div class="field"><label>Setor</label><span>${d?.trab_setor || '—'}</span></div>
      <div class="field"><label>Admissão</label><span>${d?.trab_admissao || '—'}</span></div>
      <div class="field"><label>Demissão</label><span>${d?.trab_demissao || 'Ativo'}</span></div>
    </div>
  </div>
</div>

<!-- Lotação -->
${d?.lotacao?.length > 0 ? `
<div class="section">
  <div class="section-title">3. Histórico de Lotação</div>
  <div class="section-body">
    <table>
      <thead><tr><th>Início</th><th>Fim</th><th>CNPJ</th><th>Setor</th><th>Cargo</th><th>Função</th><th>CBO</th><th>Cód. CAT</th></tr></thead>
      <tbody>${d.lotacao.map((r: Record<string,string>) => `
        <tr><td>${r.dt_ini||'—'}</td><td>${r.dt_fim||'—'}</td><td>${r.cnpj||'—'}</td><td>${r.setor||'—'}</td><td>${r.cargo||'—'}</td><td>${r.funcao||'—'}</td><td>${r.cbo||'—'}</td><td>${r.cod_cat||'—'}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>
</div>` : ''}

<!-- Profissiografia -->
${d?.prof?.length > 0 ? `
<div class="section">
  <div class="section-title">4. Descrição das Atividades</div>
  <div class="section-body">
    <table>
      <thead><tr><th>Início</th><th>Fim</th><th>Descrição das Atividades</th></tr></thead>
      <tbody>${d.prof.map((r: Record<string,string>) => `
        <tr><td>${r.dt_ini||'—'}</td><td>${r.dt_fim||'—'}</td><td>${r.atividades||'—'}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>
</div>` : ''}

<!-- Registros Ambientais -->
${d?.amb?.length > 0 ? `
<div class="section">
  <div class="section-title">5. Exposição a Fatores de Risco</div>
  <div class="section-body">
    <table>
      <thead><tr><th>Início</th><th>Fim</th><th>Tipo</th><th>Fator</th><th>Intensidade</th><th>Técnica</th><th>EPC</th><th>EPI</th><th>C.A.</th><th>Med. Proteção</th></tr></thead>
      <tbody>${d.amb.map((r: Record<string,string>) => `
        <tr><td>${r.dt_ini||'—'}</td><td>${r.dt_fim||'—'}</td><td>${r.tipo||'—'}</td><td>${r.fator||'—'}</td><td>${r.intensidade||r.valor||'—'}</td><td>${r.tecnica||'—'}</td><td>${r.epc||'—'}</td><td>${r.epi||'—'}</td><td>${r.ca||'—'}</td><td>${r.med_protecao||r.neutr_risco||'—'}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>
</div>` : ''}

<!-- Responsáveis -->
${d?.resp?.length > 0 ? `
<div class="section">
  <div class="section-title">6. Responsáveis pelos Registros</div>
  <div class="section-body">
    <table>
      <thead><tr><th>Início</th><th>Fim</th><th>CPF</th><th>CREA/CRM</th><th>Nome</th></tr></thead>
      <tbody>${d.resp.map((r: Record<string,string>) => `
        <tr><td>${r.dt_ini||'—'}</td><td>${r.dt_fim||'—'}</td><td>${r.cpf||'—'}</td><td>${r.crea||'—'}</td><td>${r.nome||'—'}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>
</div>` : ''}

<!-- Representante Legal -->
${(d?.rep_nome || d?.rep_cpf) ? `
<div class="section">
  <div class="section-title">7. Representante Legal</div>
  <div class="section-body">
    <div class="grid">
      <div class="field"><label>Nome</label><span>${d?.rep_nome||'—'}</span></div>
      <div class="field"><label>CPF</label><span>${d?.rep_cpf||'—'}</span></div>
    </div>
  </div>
</div>` : ''}

${d?.observacoes ? `
<div class="section">
  <div class="section-title">Observações</div>
  <div class="section-body"><p style="font-size:11px;line-height:1.6">${d.observacoes}</p></div>
</div>` : ''}

<!-- Declaração -->
<div class="footer" style="margin-top:16px">
  <p><strong>Declaração:</strong> Declaramos, para todos os fins de direito, que as informações prestadas neste documento são verídicas e foram transcritas fielmente dos registros administrativos, das demonstrações ambientais e dos programas médicos de responsabilidade da empresa.</p>
</div>

<!-- Assinaturas -->
<div class="assinatura">
  <div class="assinatura-linha">
    <p>${d?.rep_nome || '________________________________'}</p>
    <p>Representante Legal</p>
    <p>CPF: ${d?.rep_cpf || '___.___.___-__'}</p>
  </div>
  <div class="assinatura-linha">
    <p>Responsável Técnico Opusmed</p>
    <p>Técnico em Segurança do Trabalho</p>
    <p>MTE: 45.170/MG</p>
  </div>
</div>

<script>window.onload = () => window.print();</script>
</body>
</html>`;

  const janela = window.open('', '_blank', 'width=900,height=700');
  if (janela) {
    janela.document.write(html);
    janela.document.close();
  }
}

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
    if (!res.ok) { setErro('Erro ao salvar. Tente novamente.'); }
    else { setSucesso('Alterações salvas com sucesso.'); router.refresh(); }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/solicitacoes" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">ID: {solicitacao.id.slice(0,8).toUpperCase()}</span>
          <button
            onClick={() => gerarPDF(solicitacao)}
            className="flex items-center gap-1.5 bg-[#1F4E79] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#163a5f] transition"
          >
            <Printer className="w-3.5 h-3.5" /> Gerar PDF
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{solicitacao.empresa?.razao_social}</h1>
            <p className="text-sm text-slate-500 mt-0.5">CNPJ: {solicitacao.empresa?.cnpj}</p>
            <p className="text-sm text-slate-500">Recebido em {formatDateTime(solicitacao.created_at)}</p>
          </div>
          <div className="flex flex-col gap-3 min-w-64">
            <div>
              <label className="label-base">Status</label>
              <div className="relative">
                <select value={status} onChange={e => setStatus(e.target.value as StatusType)} className={cn('input-base appearance-none pr-8', STATUS_COLORS[status])}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-current pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="label-base">Responsável</label>
              <select value={responsavel} onChange={e => setResponsavel(e.target.value)} className="input-base appearance-none">
                <option value="">— Não atribuído —</option>
                {membros.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
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

      {/* Empresa */}
      <div className="grid grid-cols-2 gap-6">
        <Section title="Identificação da Empresa" icon={Building2}>
          <Field label="Razão Social" value={d?.empresa_razao_social || solicitacao.empresa?.razao_social} />
          <Field label="CNPJ"         value={d?.empresa_cnpj || solicitacao.empresa?.cnpj} />
          <Field label="CNAE"         value={d?.empresa_cnae} />
        </Section>
        <Section title="Identificação do Trabalhador" icon={User}>
          <Field label="Nome"          value={d?.trab_nome} />
          <Field label="CPF"           value={d?.trab_cpf} />
          <Field label="NIS/PIS/PASEP" value={d?.trab_nis} />
          <Field label="Nascimento"    value={d?.trab_nascimento} />
          <Field label="Sexo"          value={d?.trab_sexo} />
          <Field label="CBO"           value={d?.trab_cbo} />
          <Field label="Cargo"         value={d?.trab_cargo} />
          <Field label="Função"        value={d?.trab_funcao} />
          <Field label="Setor"         value={d?.trab_setor} />
          <Field label="Admissão"      value={d?.trab_admissao} />
          <Field label="Demissão"      value={d?.trab_demissao || 'Ativo'} />
        </Section>
      </div>

      {/* Lotação */}
      {d?.lotacao?.length > 0 && (
        <Section title="Histórico de Lotação" icon={Calendar}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead><tr className="bg-slate-50">{['Início','Fim','CNPJ','Setor','Cargo','Função','CBO','Cód. CAT'].map(h => <th key={h} className="border border-slate-200 px-2 py-2 text-left font-semibold text-slate-500 uppercase text-[10px] tracking-wide whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody>{d.lotacao.map((r: Record<string,string>, i: number) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="border border-slate-200 px-2 py-1.5">{r.dt_ini||'—'}</td>
                  <td className="border border-slate-200 px-2 py-1.5">{r.dt_fim||'—'}</td>
                  <td className="border border-slate-200 px-2 py-1.5">{r.cnpj||'—'}</td>
                  <td className="border border-slate-200 px-2 py-1.5">{r.setor||'—'}</td>
                  <td className="border border-slate-200 px-2 py-1.5">{r.cargo||'—'}</td>
                  <td className="border border-slate-200 px-2 py-1.5">{r.funcao||'—'}</td>
                  <td className="border border-slate-200 px-2 py-1.5">{r.cbo||'—'}</td>
                  <td className="border border-slate-200 px-2 py-1.5">{r.cod_cat||'—'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Profissiografia */}
      {d?.prof?.length > 0 && (
        <Section title="Descrição das Atividades" icon={Calendar}>
          <div className="space-y-3">
            {d.prof.map((r: Record<string,string>, i: number) => (
              <div key={i} className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">{r.dt_ini||'—'} até {r.dt_fim||'—'}</p>
                <p className="text-sm text-slate-800 whitespace-pre-wrap">{r.atividades||'—'}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Registros Ambientais */}
      {d?.amb?.length > 0 && (
        <Section title="Exposição a Fatores de Risco" icon={AlertCircle}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead><tr className="bg-slate-50">{['Início','Fim','Tipo','Fator','Intensidade','Técnica','EPC','EPI','C.A.','Med. Proteção'].map(h => <th key={h} className="border border-slate-200 px-2 py-2 text-left font-semibold text-slate-500 uppercase text-[10px] tracking-wide whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody>{d.amb.map((r: Record<string,string>, i: number) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="border border-slate-200 px-2 py-1.5">{r.dt_ini||'—'}</td>
                  <td className="border border-slate-200 px-2 py-1.5">{r.dt_fim||'—'}</td>
                  <td className="border border-slate-200 px-2 py-1.5">{r.tipo||'—'}</td>
                  <td className="border border-slate-200 px-2 py-1.5">{r.fator||'—'}</td>
                  <td className="border border-slate-200 px-2 py-1.5">{r.intensidade||r.valor||'—'}</td>
                  <td className="border border-slate-200 px-2 py-1.5">{r.tecnica||'—'}</td>
                  <td className="border border-slate-200 px-2 py-1.5 text-center">{r.epc||'—'}</td>
                  <td className="border border-slate-200 px-2 py-1.5 text-center">{r.epi||'—'}</td>
                  <td className="border border-slate-200 px-2 py-1.5">{r.ca||'—'}</td>
                  <td className="border border-slate-200 px-2 py-1.5 text-center">{r.med_protecao||r.neutr_risco||'—'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Responsáveis */}
      {d?.resp?.length > 0 && (
        <Section title="Responsáveis pelos Registros" icon={User}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead><tr className="bg-slate-50">{['Início','Fim','CPF','CREA/CRM','Nome'].map(h => <th key={h} className="border border-slate-200 px-2 py-2 text-left font-semibold text-slate-500 uppercase text-[10px] tracking-wide">{h}</th>)}</tr></thead>
              <tbody>{d.resp.map((r: Record<string,string>, i: number) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="border border-slate-200 px-2 py-1.5">{r.dt_ini||'—'}</td>
                  <td className="border border-slate-200 px-2 py-1.5">{r.dt_fim||'—'}</td>
                  <td className="border border-slate-200 px-2 py-1.5">{r.cpf||'—'}</td>
                  <td className="border border-slate-200 px-2 py-1.5">{r.crea||'—'}</td>
                  <td className="border border-slate-200 px-2 py-1.5">{r.nome||'—'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Representante Legal */}
      {(d?.rep_nome || d?.rep_cpf) && (
        <Section title="Representante Legal" icon={User}>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Nome" value={d?.rep_nome} />
            <Field label="CPF"  value={d?.rep_cpf} />
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
                  <FileText className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{a.nome_original}</p>
                    <p className="text-xs text-slate-500">{TIPO_ARQUIVO_LABELS[a.tipo]} · {formatDateTime(a.uploaded_at)}</p>
                  </div>
                </div>
                <a
                  href={`/api/ppp/arquivo/${a.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 bg-[#1F4E79] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#163a5f] transition"
                >
                  <Download className="w-3 h-3" /> Baixar
                </a>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
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
