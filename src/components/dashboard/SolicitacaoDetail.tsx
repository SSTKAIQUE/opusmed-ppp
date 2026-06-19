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
    <
