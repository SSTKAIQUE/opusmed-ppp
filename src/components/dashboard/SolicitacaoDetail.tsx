'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Building2, User, Calendar, Paperclip,
  ChevronDown, Loader2, AlertCircle, FileText, Printer, Download
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
  body { font-family: "Arial", sans-serif; font-size: 10px; color: #000; background: white; line-height: 1.15; padding: 10px; }
  
  .document-title {
    text-align: center;
    font-size: 11px;
    font-weight: bold;
    border: 1px solid #000;
    padding: 6px;
    margin-bottom: 8px;
    background: #f2f2f2;
    text-transform: uppercase;
  }

  .section-header {
    background: #e6e6e6;
    font-weight: bold;
    font-size: 10px;
    padding: 4px 6px;
    border: 1px solid #000;
    margin-top: 8px;
    text-transform: uppercase;
  }

  /* Form Grid Layout */
  .row {
    display: flex;
    border-left: 1px solid #000;
    border-right: 1px solid #000;
    border-bottom: 1px solid #000;
  }
  .cell {
    padding: 4px;
    border-right: 1px solid #000;
    flex: 1;
  }
  .cell:last-child {
    border-right: none;
  }

  .label {
    font-size: 8px;
    font-weight: bold;
    color: #444;
    text-transform: uppercase;
    display: block;
    margin-bottom: 1px;
  }
  .value {
    font-size: 9.5px;
    color: #000;
    min-height: 11px;
  }

  /* Tables */
  table.ppp-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: -1px;
  }
  table.ppp-table th {
    background: #f2f2f2;
    border: 1px solid #000;
    padding: 3px 4px;
    text-align: left;
    font-size: 8px;
    font-weight: bold;
    color: #000;
    text-transform: uppercase;
  }
  table.ppp-table td {
    border: 1px solid #000;
    padding: 3px 4px;
    font-size: 9px;
    vertical-align: top;
  }

  .declaration-box {
    border: 1px solid #000;
    padding: 6px;
    margin-top: 10px;
    font-size: 9px;
    text-align: justify;
    line-height: 1.3;
  }

  .signatures-area {
    margin-top: 15px;
    display: flex;
    justify-content: space-between;
    gap: 40px;
    page-break-inside: avoid;
  }
  .sig-block {
    flex: 1;
    text-align: center;
    font-size: 9px;
  }
  .sig-line {
    border-top: 1px solid #000;
    margin-top: 25px;
    padding-top: 4px;
  }

  @media print {
    body { padding: 0; }
    .no-print { display: none; }
  }
</style>
</head>
<body>

  <div class="document-title">
    PERFIL PROFISSIOGRÁFICO PREVIDENCIÁRIO – PPP
  </div>

  <!-- SEÇÃO I: DADOS ADMINISTRATIVOS -->
  <div class="section-header">Seção I - Dados Administrativos</div>
  
  <div class="row">
    <div class="cell" style="flex: 2;">
      <span class="label">1. CNPJ do Domicílio Tributário/CEI/CAEPF/CNO</span>
      <div class="value">${d?.empresa_cnpj || empresa?.cnpj || '—'}</div>
    </div>
    <div class="cell" style="flex: 3;">
      <span class="label">2. Nome Empresarial</span>
      <div class="value">${d?.empresa_razao_social || empresa?.razao_social || '—'}</div>
    </div>
    <div class="cell" style="flex: 1;">
      <span class="label">3. CNAE</span>
      <div class="value">${d?.empresa_cnae || '—'}</div>
    </div>
  </div>

  <div class="row">
    <div class="cell" style="flex: 3;">
      <span class="label">4. Nome do Trabalhador</span>
      <div class="value">${d?.trab_nome || '—'}</div>
    </div>
    <div class="cell" style="flex: 1;">
      <span class="label">5. BR/PDH</span>
      <div class="value">${d?.trab_br_pdh || 'Não'}</div>
    </div>
    <div class="cell" style="flex: 2;">
      <span class="label">6. CPF</span>
      <div class="value">${d?.trab_cpf || '—'}</div>
    </div>
  </div>

  <div class="row">
    <div class="cell" style="flex: 1.5;">
      <span class="label">7. Data de Nascimento</span>
      <div class="value">${d?.trab_nascimento ? d.trab_nascimento.split('-').reverse().join('/') : '—'}</div>
    </div>
    <div class="cell" style="flex: 1;">
      <span class="label">8. Sexo (M/F)</span>
      <div class="value">${d?.trab_sexo === 'Masculino' ? 'M' : d?.trab_sexo === 'Feminino' ? 'F' : '—'}</div>
    </div>
    <div class="cell" style="flex: 2;">
      <span class="label">9. Matrícula do Trabalhador no eSocial</span>
      <div class="value">${d?.trab_matricula_esocial || '—'}</div>
    </div>
    <div class="cell" style="flex: 2;">
      <span class="label">10. PIS/PASEP (NIS)</span>
      <div class="value">${d?.trab_nis || '—'}</div>
    </div>
  </div>

  <div class="row">
    <div class="cell" style="flex: 1.5;">
      <span class="label">11. Data de Admissão</span>
      <div class="value">${d?.trab_admissao ? d.trab_admissao.split('-').reverse().join('/') : '—'}</div>
    </div>
    <div class="cell" style="flex: 3;">
      <span class="label">12. Regime de Revezamento</span>
      <div class="value">${d?.trab_regime_revezamento || '—'}</div>
    </div>
  </div>

  <!-- 13. CAT REGISTRADA -->
  <div class="section-header" style="margin-top: 4px; font-size: 9px;">13. CAT Registrada</div>
  <table class="ppp-table">
    <thead>
      <tr>
        <th style="width: 50%;">13.1 Data do Registro</th>
        <th style="width: 50%;">13.2 Número da CAT</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${d?.cat_data ? d.cat_data.split('-').reverse().join('/') : '—'}</td>
        <td>${d?.cat_numero || '—'}</td>
      </tr>
    </tbody>
  </table>

  <!-- 14. HISTÓRICO DE LOTAÇÃO -->
  <div class="section-header" style="margin-top: 4px; font-size: 9px;">14. Histórico de Lotação</div>
  <table class="ppp-table">
    <thead>
      <tr>
        <th style="width: 15%;">14.1 Período (Ini/Fim)</th>
        <th style="width: 18%;">14.2 CNPJ/CEI Estabelecimento</th>
        <th style="width: 18%;">14.3 Setor</th>
        <th style="width: 18%;">14.4 Cargo</th>
        <th style="width: 18%;">14.5 Função</th>
        <th style="width: 13%;">14.6 CBO</th>
      </tr>
    </thead>
    <tbody>
      ${d?.lotacao?.length > 0 ? d.lotacao.map((r: any) => `
        <tr>
          <td>${r.dt_ini ? r.dt_ini.split('-').reverse().join('/') : ''} a ${r.dt_fim ? r.dt_fim.split('-').reverse().join('/') : 'Atual'}</td>
          <td>${r.cnpj || '—'}</td>
          <td>${r.setor || '—'}</td>
          <td>${r.cargo || '—'}</td>
          <td>${r.funcao || '—'}</td>
          <td>${r.cbo || '—'}</td>
        </tr>
      `).join('') : '<tr><td colspan="6" style="text-align: center;">Nenhum histórico de lotação cadastrado</td></tr>'}
    </tbody>
  </table>

  <!-- 15. DESCRIÇÃO DAS ATIVIDADES -->
  <div class="section-header" style="margin-top: 4px; font-size: 9px;">15. Descrição das Atividades</div>
  <table class="ppp-table">
    <thead>
      <tr>
        <th style="width: 20%;">15.1 Período (Ini/Fim)</th>
        <th style="width: 80%;">15.2 Descrição Detalhada das Atividades</th>
      </tr>
    </thead>
    <tbody>
      ${d?.prof?.length > 0 ? d.prof.map((r: any) => `
        <tr>
          <td>${r.dt_ini ? r.dt_ini.split('-').reverse().join('/') : ''} a ${r.dt_fim ? r.dt_fim.split('-').reverse().join('/') : 'Atual'}</td>
          <td style="text-align: justify; white-space: pre-wrap;">${r.atividades || '—'}</td>
        </tr>
      `).join('') : '<tr><td colspan="2" style="text-align: center;">Nenhuma atividade cadastrada</td></tr>'}
    </tbody>
  </table>

  <!-- SEÇÃO II: REGISTROS AMBIENTAIS -->
  <div class="section-header">Seção II - Registros Ambientais</div>

  <!-- 16. EXPOSIÇÃO A FATORES DE RISCO -->
  <div class="section-header" style="margin-top: 4px; font-size: 9px;">16. Exposição a Fatores de Risco</div>
  <table class="ppp-table">
    <thead>
      <tr>
        <th style="font-size: 7.5px;">16.1 Período (Ini/Fim)</th>
        <th style="font-size: 7.5px;">16.2 Tipo</th>
        <th style="font-size: 7.5px;">16.3 Fator de Risco</th>
        <th style="font-size: 7.5px;">16.4 Int/Conc</th>
        <th style="font-size: 7.5px;">16.5 Técnica Utilizada</th>
        <th style="font-size: 7.5px;">16.6 EPC Eficaz</th>
        <th style="font-size: 7.5px;">16.7 EPI Eficaz</th>
        <th style="font-size: 7.5px;">16.8 CA EPI</th>
        <th style="font-size: 7.5px;">16.9 Atend. Req. NR-06/09</th>
      </tr>
    </thead>
    <tbody>
      ${d?.amb?.length > 0 ? d.amb.map((r: any) => `
        <tr>
          <td>${r.dt_ini ? r.dt_ini.split('-').reverse().join('/') : ''} a ${r.dt_fim ? r.dt_fim.split('-').reverse().join('/') : 'Atual'}</td>
          <td>${r.tipo?.charAt(0) || '—'}</td>
          <td>${r.fator || '—'}</td>
          <td>${r.intensidade || r.valor || 'NA'}</td>
          <td>${r.tecnica || '—'}</td>
          <td style="text-align: center;">${r.epc || '—'}</td>
          <td style="text-align: center;">${r.epi || '—'}</td>
          <td>${r.ca || '—'}</td>
          <td style="text-align: center;">${r.med_protecao || '—'}</td>
        </tr>
      `).join('') : '<tr><td colspan="9" style="text-align: center;">Não há exposição a fatores de risco cadastrados</td></tr>'}
    </tbody>
  </table>

  <!-- SEÇÃO III: RESPONSÁVEIS PELOS REGISTROS AMBIENTAIS -->
  <div class="section-header">Seção III - Responsáveis pelos Registros Ambientais</div>
  <table class="ppp-table" style="margin-top: 4px;">
    <thead>
      <tr>
        <th style="width: 25%;">17.1 Período (Ini/Fim)</th>
        <th style="width: 20%;">17.2 CPF</th>
        <th style="width: 15%;">17.3 NIT/CREA/CRM</th>
        <th style="width: 40%;">17.4 Nome do Profissional Habilitado</th>
      </tr>
    </thead>
    <tbody>
      ${d?.resp?.length > 0 ? d.resp.map((r: any) => `
        <tr>
          <td>${r.dt_ini ? r.dt_ini.split('-').reverse().join('/') : ''} a ${r.dt_fim ? r.dt_fim.split('-').reverse().join('/') : 'Atual'}</td>
          <td>${r.cpf || '—'}</td>
          <td>${r.crea || '—'}</td>
          <td>${r.nome || '—'}</td>
        </tr>
      `).join('') : '<tr><td colspan="4" style="text-align: center;">Nenhum responsável cadastrado</td></tr>'}
    </tbody>
  </table>

  <!-- SEÇÃO IV: RESPONSÁVEL PELAS INFORMAÇÕES -->
  <div class="section-header">Seção IV - Responsável pelas Informações</div>
  
  <div class="row">
    <div class="cell" style="flex: 2;">
      <span class="label">18.1 CPF</span>
      <div class="value">${d?.rep_cpf || '—'}</div>
    </div>
    <div class="cell" style="flex: 3;">
      <span class="label">18.2 Nome do Responsável Legal</span>
      <div class="value">${d?.rep_nome || '—'}</div>
    </div>
    <div class="cell" style="flex: 2;">
      <span class="label">18.3 Cargo ou Função</span>
      <div class="value">Representante Legal</div>
    </div>
  </div>

  ${d?.observacoes ? `
  <div class="section-header" style="margin-top: 4px; font-size: 9px;">Observações Complementares</div>
  <div style="border: 1px solid #000; border-top: none; padding: 6px; font-size: 9px; line-height: 1.4; text-align: justify; white-space: pre-wrap;">${d.observacoes}</div>
  ` : ''}

  <!-- Declaração -->
  <div class="declaration-box">
    <strong>Declaração:</strong> Declaramos, para todos os fins de direito, que as informações prestadas neste documento são verídicas e foram transcritas fielmente dos registros administrativos, das demonstrações ambientais e dos programas médicos de responsabilidade da empresa.
  </div>

  <!-- Área de Assinatura -->
  <div class="signatures-area">
    <div class="sig-block">
      <div class="sig-line">
        <strong>${d?.rep_nome || 'Representante Legal'}</strong><br>
        Assinatura do Representante Legal da Empresa<br>
        CPF: ${d?.rep_cpf || '—'}
      </div>
    </div>
    <div class="sig-block">
      <div class="sig-line">
        <strong>Opusmed SST</strong><br>
        Responsável Técnico Habilitado<br>
        Registro de Classe / MTE: 45.170/MG
      </div>
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
          <div className="grid grid-cols-2 gap-x-4">
            <div className="col-span-2"><Field label="Nome" value={d?.trab_nome} /></div>
            <Field label="CPF"           value={d?.trab_cpf} />
            <Field label="BR/PDH"        value={d?.trab_br_pdh || 'Não'} />
            <Field label="Matrícula eSocial" value={d?.trab_matricula_esocial} />
            <Field label="NIS/PIS/PASEP" value={d?.trab_nis} />
            <Field label="Nascimento"    value={d?.trab_nascimento} />
            <Field label="Sexo"          value={d?.trab_sexo} />
            <Field label="CBO"           value={d?.trab_cbo} />
            <Field label="Regime Revezamento" value={d?.trab_regime_revezamento} />
            <Field label="Cargo"         value={d?.trab_cargo} />
            <Field label="Função"        value={d?.trab_funcao} />
            <Field label="Setor"         value={d?.trab_setor} />
            <Field label="Admissão"      value={d?.trab_admissao} />
            <div className="col-span-2"><Field label="Demissão" value={d?.trab_demissao || 'Ativo'} /></div>
          </div>
        </Section>
      </div>

      {/* CAT (Se houver) */}
      {(d?.cat_data || d?.cat_numero) && (
        <Section title="13. Comunicação de Acidente de Trabalho (CAT)" icon={AlertCircle}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="13.1 Data do Registro" value={d?.cat_data ? d.cat_data.split('-').reverse().join('/') : undefined} />
            <Field label="13.2 Número da CAT" value={d?.cat_numero} />
          </div>
        </Section>
      )}

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
              <thead><tr className="bg-slate-50">{['Início','Fim','Tipo','Fator','Intensidade','Técnica','EPC','EPI','C.A.','Req. NR-06/09'].map(h => <th key={h} className="border border-slate-200 px-2 py-2 text-left font-semibold text-slate-500 uppercase text-[10px] tracking-wide whitespace-nowrap">{h}</th>)}</tr></thead>
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
