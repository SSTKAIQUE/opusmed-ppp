'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Building2, User, Calendar, Paperclip,
  ChevronDown, Loader2, AlertCircle, FileText, Printer, Download, Check
} from 'lucide-react';
import { cn, formatDateTime, STATUS_LABELS, deepEscape } from '@/lib/utils';
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

function gerarPDF(solicitacao: SolicitacaoPPP) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = deepEscape(solicitacao.dados_ppp) as any;
  const empresa = deepEscape(solicitacao.empresa);

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
        <button onClick={() => gerarPDF(solicitacao)} className="btn-primary">
          <Printer className="h-4 w-4" /> Gerar PDF
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
