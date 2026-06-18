'use client';

import { useState } from 'react';
import {
  ShieldCheck, Building2, User, Clock, AlertCircle,
  FileText, Plus, Trash2, Loader2, CheckCircle2, Upload
} from 'lucide-react';
import { cn, formatCNPJ, formatCPF, formatCEP } from '@/lib/utils';
import type { Empresa, HistoricoAtividade, AgenteNocivo } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  empresa: Empresa;
  token: string;
}

const HISTORICO_VAZIO = (): HistoricoAtividade => ({
  id: uuidv4(), periodo_inicio: '', periodo_fim: '', empresa_nome: '',
  cnpj_empresa: '', funcao: '', setor: '', cbo: '', exposicao_agentes: false, descricao_atividades: '',
});

const AGENTE_VAZIO = (): AgenteNocivo => ({
  id: uuidv4(), tipo: 'fisico', codigo_esocial: '', descricao: '',
  metodologia_avaliacao: '', valor_encontrado: '', limite_tolerancia: '',
  tecnica_utilizacao: '', epc_eficaz: false, epi_eficaz: false,
  epi_descricao: '', epi_ca: '', periodo_exposicao_inicio: '', periodo_exposicao_fim: '',
});

// Steps
const STEPS = [
  { id: 1, label: 'Empresa',     icon: Building2 },
  { id: 2, label: 'Trabalhador', icon: User },
  { id: 3, label: 'Histórico',   icon: Clock },
  { id: 4, label: 'Agentes',     icon: AlertCircle },
  { id: 5, label: 'Responsáveis',icon: User },
  { id: 6, label: 'Documentos',  icon: FileText },
];

export default function PPPFormClient({ empresa, token }: Props) {
  const [step, setStep]     = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado]   = useState(false);
  const [erroEnvio, setErroEnvio] = useState('');

  // ── Form state ──
  const [form, setForm] = useState({
    // Empresa
    empresa_razao_social: empresa.razao_social,
    empresa_cnpj:         empresa.cnpj,
    empresa_cnae: '', empresa_grau_risco: '',
    empresa_endereco: '', empresa_cep: '', empresa_cidade: '', empresa_uf: '',

    // Trabalhador
    trabalhador_nome: '', trabalhador_cpf: '', trabalhador_nis_pis_pasep: '',
    trabalhador_data_nascimento: '', trabalhador_sexo: '', trabalhador_nome_mae: '',
    trabalhador_cbo: '', trabalhador_funcao: '', trabalhador_setor: '',

    // CAT
    cat_existencia_cat: false, cat_numero: '', cat_data: '', cat_descricao: '',

    // Resp. Ambiental
    resp_nome: '', resp_cpf: '', resp_cargo: '', resp_crea_crm: '', resp_data_elaboracao: '',

    // Resp. Biológico
    resp_bio_nome: '', resp_bio_cpf: '', resp_bio_crm: '', resp_bio_data: '',

    // Rep. Legal
    rep_legal_nome: '', rep_legal_cpf: '', rep_legal_cargo: '',

    // Observações
    observacoes: '',
  });

  const [historico, setHistorico] = useState<HistoricoAtividade[]>([HISTORICO_VAZIO()]);
  const [agentes, setAgentes]     = useState<AgenteNocivo[]>([]);
  const [arquivos, setArquivos]   = useState<{ tipo: string; arquivo: File }[]>([]);

  function setF(field: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function setMasked(field: string, value: string, mask: (v: string) => string) {
    setF(field, mask(value));
  }

  // ── Histórico helpers ──
  function updateHistorico(idx: number, field: string, value: string | boolean) {
    setHistorico(prev => prev.map((h, i) => i === idx ? { ...h, [field]: value } : h));
  }
  function addHistorico()    { setHistorico(prev => [...prev, HISTORICO_VAZIO()]); }
  function removeHistorico(idx: number) { setHistorico(prev => prev.filter((_, i) => i !== idx)); }

  // ── Agentes helpers ──
  function updateAgente(idx: number, field: string, value: string | boolean) {
    setAgentes(prev => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  }
  function addAgente()    { setAgentes(prev => [...prev, AGENTE_VAZIO()]); }
  function removeAgente(idx: number) { setAgentes(prev => prev.filter((_, i) => i !== idx)); }

  // ── Arquivo helpers ──
  function addArquivo(tipo: string, file: File) {
    setArquivos(prev => [...prev, { tipo, arquivo: file }]);
  }
  function removeArquivo(idx: number) { setArquivos(prev => prev.filter((_, i) => i !== idx)); }

  // ── Submit ──
  async function handleSubmit() {
    setEnviando(true);
    setErroEnvio('');

    const fd = new FormData();
    fd.append('token', token);
    fd.append('dados_ppp', JSON.stringify({
      ...form,
      historico_atividades: historico,
      agentes_nocivos: agentes,
    }));
    arquivos.forEach(a => {
      fd.append('arquivos', a.arquivo);
      fd.append('tipos', a.tipo);
    });

    try {
      const res = await fetch('/api/ppp', { method: 'POST', body: fd });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao enviar formulário.');
      }
      setEnviado(true);
    } catch (err: unknown) {
      setErroEnvio(err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) return <Sucesso empresa={empresa} />;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-navy mb-3">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Perfil Profissiográfico Previdenciário</h1>
          <p className="text-slate-500 mt-1">
            <strong>{empresa.razao_social}</strong> · CNPJ {empresa.cnpj}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Opusmed Segurança do Trabalho</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-1 flex-wrap">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <button
                onClick={() => setStep(s.id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  step === s.id
                    ? 'bg-navy text-white'
                    : step > s.id
                    ? 'bg-green-100 text-green-700'
                    : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
                )}
              >
                {step > s.id ? <CheckCircle2 className="w-3 h-3" /> : <s.icon className="w-3 h-3" />}
                {s.label}
              </button>
              {i < STEPS.length - 1 && <div className="w-4 h-px bg-slate-200 mx-1" />}
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="card p-6 space-y-6">

          {/* ── Step 1: Empresa ── */}
          {step === 1 && (
            <StepSection title="1. Identificação da Empresa">
              <Row>
                <Field label="Razão Social *">
                  <input className="input-base" value={form.empresa_razao_social}
                    onChange={e => setF('empresa_razao_social', e.target.value)} />
                </Field>
                <Field label="CNPJ *" half>
                  <input className="input-base" value={form.empresa_cnpj}
                    onChange={e => setMasked('empresa_cnpj', e.target.value, formatCNPJ)} />
                </Field>
              </Row>
              <Row>
                <Field label="CNAE" half>
                  <input className="input-base" placeholder="ex: 3811-4/00" value={form.empresa_cnae}
                    onChange={e => setF('empresa_cnae', e.target.value)} />
                </Field>
                <Field label="Grau de Risco" half>
                  <select className="input-base" value={form.empresa_grau_risco}
                    onChange={e => setF('empresa_grau_risco', e.target.value)}>
                    <option value="">Selecionar</option>
                    {['1','2','3','4'].map(g => <option key={g} value={g}>GR {g}</option>)}
                  </select>
                </Field>
              </Row>
              <Row>
                <Field label="Endereço">
                  <input className="input-base" placeholder="Rua, número, bairro" value={form.empresa_endereco}
                    onChange={e => setF('empresa_endereco', e.target.value)} />
                </Field>
              </Row>
              <Row>
                <Field label="CEP" half>
                  <input className="input-base" placeholder="00000-000" value={form.empresa_cep}
                    onChange={e => setMasked('empresa_cep', e.target.value, formatCEP)} />
                </Field>
                <Field label="Cidade">
                  <input className="input-base" value={form.empresa_cidade}
                    onChange={e => setF('empresa_cidade', e.target.value)} />
                </Field>
                <Field label="UF" style={{ maxWidth: '80px' }}>
                  <input className="input-base" maxLength={2} placeholder="MG" value={form.empresa_uf}
                    onChange={e => setF('empresa_uf', e.target.value.toUpperCase())} />
                </Field>
              </Row>
            </StepSection>
          )}

          {/* ── Step 2: Trabalhador ── */}
          {step === 2 && (
            <StepSection title="2. Identificação do Trabalhador">
              <Row>
                <Field label="Nome Completo *">
                  <input className="input-base" value={form.trabalhador_nome}
                    onChange={e => setF('trabalhador_nome', e.target.value)} />
                </Field>
              </Row>
              <Row>
                <Field label="CPF *" half>
                  <input className="input-base" value={form.trabalhador_cpf}
                    onChange={e => setMasked('trabalhador_cpf', e.target.value, formatCPF)} />
                </Field>
                <Field label="NIS / PIS / PASEP *" half>
                  <input className="input-base" value={form.trabalhador_nis_pis_pasep}
                    onChange={e => setF('trabalhador_nis_pis_pasep', e.target.value)} />
                </Field>
              </Row>
              <Row>
                <Field label="Data de Nascimento *" half>
                  <input type="date" className="input-base" value={form.trabalhador_data_nascimento}
                    onChange={e => setF('trabalhador_data_nascimento', e.target.value)} />
                </Field>
                <Field label="Sexo *" half>
                  <select className="input-base" value={form.trabalhador_sexo}
                    onChange={e => setF('trabalhador_sexo', e.target.value)}>
                    <option value="">Selecionar</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </Field>
              </Row>
              <Row>
                <Field label="Nome da Mãe *">
                  <input className="input-base" value={form.trabalhador_nome_mae}
                    onChange={e => setF('trabalhador_nome_mae', e.target.value)} />
                </Field>
              </Row>
              <Row>
                <Field label="CBO (Código Brasileiro de Ocupações) *" half>
                  <input className="input-base" placeholder="ex: 3516-05" value={form.trabalhador_cbo}
                    onChange={e => setF('trabalhador_cbo', e.target.value)} />
                </Field>
                <Field label="Função / Cargo *" half>
                  <input className="input-base" value={form.trabalhador_funcao}
                    onChange={e => setF('trabalhador_funcao', e.target.value)} />
                </Field>
              </Row>
              <Row>
                <Field label="Setor de Trabalho *">
                  <input className="input-base" value={form.trabalhador_setor}
                    onChange={e => setF('trabalhador_setor', e.target.value)} />
                </Field>
              </Row>

              {/* CAT */}
              <div className="border-t border-slate-100 pt-5 mt-2">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Comunicação de Acidente do Trabalho (CAT)</h3>
                <label className="flex items-center gap-2 text-sm text-slate-700 mb-3 cursor-pointer">
                  <input type="checkbox" checked={form.cat_existencia_cat}
                    onChange={e => setF('cat_existencia_cat', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-navy" />
                  Houve emissão de CAT para este trabalhador?
                </label>
                {form.cat_existencia_cat && (
                  <Row>
                    <Field label="Número da CAT" half>
                      <input className="input-base" value={form.cat_numero}
                        onChange={e => setF('cat_numero', e.target.value)} />
                    </Field>
                    <Field label="Data da CAT" half>
                      <input type="date" className="input-base" value={form.cat_data}
                        onChange={e => setF('cat_data', e.target.value)} />
                    </Field>
                    <Field label="Descrição resumida">
                      <textarea rows={2} className="input-base resize-none" value={form.cat_descricao}
                        onChange={e => setF('cat_descricao', e.target.value)} />
                    </Field>
                  </Row>
                )}
              </div>
            </StepSection>
          )}

          {/* ── Step 3: Histórico ── */}
          {step === 3 && (
            <StepSection title="3. Histórico de Atividades Profissionais">
              <p className="text-xs text-slate-500 -mt-2 mb-4">
                Informe todas as atividades profissionais do trabalhador. Inclua o emprego atual.
              </p>
              {historico.map((h, idx) => (
                <div key={h.id} className="rounded-xl border border-slate-200 p-4 space-y-3 mb-4 relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Vínculo {idx + 1}
                    </span>
                    {historico.length > 1 && (
                      <button onClick={() => removeHistorico(idx)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <Row>
                    <Field label="Início" half>
                      <input type="date" className="input-base" value={h.periodo_inicio}
                        onChange={e => updateHistorico(idx, 'periodo_inicio', e.target.value)} />
                    </Field>
                    <Field label="Fim (deixar em branco se atual)" half>
                      <input type="date" className="input-base" value={h.periodo_fim}
                        onChange={e => updateHistorico(idx, 'periodo_fim', e.target.value)} />
                    </Field>
                  </Row>
                  <Row>
                    <Field label="Nome da Empresa">
                      <input className="input-base" value={h.empresa_nome}
                        onChange={e => updateHistorico(idx, 'empresa_nome', e.target.value)} />
                    </Field>
                    <Field label="CNPJ da Empresa" half>
                      <input className="input-base" value={h.cnpj_empresa}
                        onChange={e => updateHistorico(idx, 'cnpj_empresa', formatCNPJ(e.target.value))} />
                    </Field>
                  </Row>
                  <Row>
                    <Field label="Função">
                      <input className="input-base" value={h.funcao}
                        onChange={e => updateHistorico(idx, 'funcao', e.target.value)} />
                    </Field>
                    <Field label="Setor" half>
                      <input className="input-base" value={h.setor}
                        onChange={e => updateHistorico(idx, 'setor', e.target.value)} />
                    </Field>
                    <Field label="CBO" half>
                      <input className="input-base" value={h.cbo}
                        onChange={e => updateHistorico(idx, 'cbo', e.target.value)} />
                    </Field>
                  </Row>
                  <Field label="Descrição das Atividades">
                    <textarea rows={3} className="input-base resize-none" value={h.descricao_atividades}
                      onChange={e => updateHistorico(idx, 'descricao_atividades', e.target.value)} />
                  </Field>
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={h.exposicao_agentes}
                      onChange={e => updateHistorico(idx, 'exposicao_agentes', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300" />
                    Houve exposição a agentes nocivos neste vínculo?
                  </label>
                </div>
              ))}
              <button onClick={addHistorico} className="btn-secondary w-full">
                <Plus className="w-4 h-4" /> Adicionar vínculo
              </button>
            </StepSection>
          )}

          {/* ── Step 4: Agentes Nocivos ── */}
          {step === 4 && (
            <StepSection title="4. Exposição a Agentes Nocivos">
              <p className="text-xs text-slate-500 -mt-2 mb-4">
                Informe todos os agentes nocivos a que o trabalhador está/esteve exposto (físicos, químicos, biológicos, ergonômicos).
              </p>
              {agentes.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl mb-4">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Nenhum agente nocivo cadastrado</p>
                  <p className="text-slate-400 text-xs mt-0.5">Clique no botão abaixo se houver exposição</p>
                </div>
              )}
              {agentes.map((a, idx) => (
                <div key={a.id} className="rounded-xl border border-slate-200 p-4 space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Agente {idx + 1}
                    </span>
                    <button onClick={() => removeAgente(idx)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <Row>
                    <Field label="Tipo" half>
                      <select className="input-base" value={a.tipo}
                        onChange={e => updateAgente(idx, 'tipo', e.target.value)}>
                        <option value="fisico">Físico</option>
                        <option value="quimico">Químico</option>
                        <option value="biologico">Biológico</option>
                        <option value="ergonomico">Ergonômico</option>
                      </select>
                    </Field>
                    <Field label="Código eSocial" half>
                      <input className="input-base" placeholder="ex: 01.01.001" value={a.codigo_esocial}
                        onChange={e => updateAgente(idx, 'codigo_esocial', e.target.value)} />
                    </Field>
                  </Row>
                  <Field label="Descrição do Agente">
                    <input className="input-base" value={a.descricao}
                      onChange={e => updateAgente(idx, 'descricao', e.target.value)} />
                  </Field>
                  <Row>
                    <Field label="Metodologia de Avaliação">
                      <input className="input-base" value={a.metodologia_avaliacao}
                        onChange={e => updateAgente(idx, 'metodologia_avaliacao', e.target.value)} />
                    </Field>
                  </Row>
                  <Row>
                    <Field label="Valor Encontrado" half>
                      <input className="input-base" value={a.valor_encontrado}
                        onChange={e => updateAgente(idx, 'valor_encontrado', e.target.value)} />
                    </Field>
                    <Field label="Limite de Tolerância" half>
                      <input className="input-base" value={a.limite_tolerancia}
                        onChange={e => updateAgente(idx, 'limite_tolerancia', e.target.value)} />
                    </Field>
                  </Row>
                  <Field label="Técnica de Utilização do EPI">
                    <input className="input-base" value={a.tecnica_utilizacao}
                      onChange={e => updateAgente(idx, 'tecnica_utilizacao', e.target.value)} />
                  </Field>
                  <Row>
                    <Field label="EPI Utilizado">
                      <input className="input-base" value={a.epi_descricao}
                        onChange={e => updateAgente(idx, 'epi_descricao', e.target.value)} />
                    </Field>
                    <Field label="Nº CA" half>
                      <input className="input-base" value={a.epi_ca}
                        onChange={e => updateAgente(idx, 'epi_ca', e.target.value)} />
                    </Field>
                  </Row>
                  <Row>
                    <Field label="Exposição — Início" half>
                      <input type="date" className="input-base" value={a.periodo_exposicao_inicio}
                        onChange={e => updateAgente(idx, 'periodo_exposicao_inicio', e.target.value)} />
                    </Field>
                    <Field label="Exposição — Fim" half>
                      <input type="date" className="input-base" value={a.periodo_exposicao_fim}
                        onChange={e => updateAgente(idx, 'periodo_exposicao_fim', e.target.value)} />
                    </Field>
                  </Row>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={a.epc_eficaz}
                        onChange={e => updateAgente(idx, 'epc_eficaz', e.target.checked)}
                        className="w-4 h-4 rounded" />
                      EPC eficaz
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={a.epi_eficaz}
                        onChange={e => updateAgente(idx, 'epi_eficaz', e.target.checked)}
                        className="w-4 h-4 rounded" />
                      EPI eficaz
                    </label>
                  </div>
                </div>
              ))}
              <button onClick={addAgente} className="btn-secondary w-full">
                <Plus className="w-4 h-4" /> Adicionar agente nocivo
              </button>
            </StepSection>
          )}

          {/* ── Step 5: Responsáveis ── */}
          {step === 5 && (
            <StepSection title="5. Responsáveis e Representante Legal">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Responsável pelos Registros Ambientais</h3>
              <Row>
                <Field label="Nome"><input className="input-base" value={form.resp_nome} onChange={e => setF('resp_nome', e.target.value)} /></Field>
                <Field label="CPF" half><input className="input-base" value={form.resp_cpf} onChange={e => setMasked('resp_cpf', e.target.value, formatCPF)} /></Field>
              </Row>
              <Row>
                <Field label="Cargo"><input className="input-base" value={form.resp_cargo} onChange={e => setF('resp_cargo', e.target.value)} /></Field>
                <Field label="CREA/CRM" half><input className="input-base" value={form.resp_crea_crm} onChange={e => setF('resp_crea_crm', e.target.value)} /></Field>
                <Field label="Data de Elaboração" half><input type="date" className="input-base" value={form.resp_data_elaboracao} onChange={e => setF('resp_data_elaboracao', e.target.value)} /></Field>
              </Row>

              <div className="border-t border-slate-100 pt-5 mt-2">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Responsável pelas Monitorações Biológicas</h3>
                <Row>
                  <Field label="Nome"><input className="input-base" value={form.resp_bio_nome} onChange={e => setF('resp_bio_nome', e.target.value)} /></Field>
                  <Field label="CPF" half><input className="input-base" value={form.resp_bio_cpf} onChange={e => setMasked('resp_bio_cpf', e.target.value, formatCPF)} /></Field>
                </Row>
                <Row>
                  <Field label="CRM" half><input className="input-base" value={form.resp_bio_crm} onChange={e => setF('resp_bio_crm', e.target.value)} /></Field>
                  <Field label="Data" half><input type="date" className="input-base" value={form.resp_bio_data} onChange={e => setF('resp_bio_data', e.target.value)} /></Field>
                </Row>
              </div>

              <div className="border-t border-slate-100 pt-5 mt-2">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Representante Legal da Empresa</h3>
                <Row>
                  <Field label="Nome"><input className="input-base" value={form.rep_legal_nome} onChange={e => setF('rep_legal_nome', e.target.value)} /></Field>
                  <Field label="CPF" half><input className="input-base" value={form.rep_legal_cpf} onChange={e => setMasked('rep_legal_cpf', e.target.value, formatCPF)} /></Field>
                  <Field label="Cargo" half><input className="input-base" value={form.rep_legal_cargo} onChange={e => setF('rep_legal_cargo', e.target.value)} /></Field>
                </Row>
              </div>

              <div className="border-t border-slate-100 pt-5 mt-2">
                <Field label="Observações Gerais (opcional)">
                  <textarea rows={4} className="input-base resize-none" value={form.observacoes}
                    onChange={e => setF('observacoes', e.target.value)}
                    placeholder="Informações adicionais relevantes para o PPP..." />
                </Field>
              </div>
            </StepSection>
          )}

          {/* ── Step 6: Documentos ── */}
          {step === 6 && (
            <StepSection title="6. Documentos Complementares">
              <p className="text-xs text-slate-500 -mt-2 mb-5">
                Anexe os documentos abaixo. Formatos aceitos: PDF, Word (.docx), imagens (JPG/PNG). Máx. 50 MB por arquivo.
              </p>

              {(['pgr', 'ltcat', 'ficha_epi'] as const).map(tipo => {
                const labels: Record<string, string> = {
                  pgr: 'PGR — Programa de Gerenciamento de Riscos',
                  ltcat: 'LTCAT — Laudo Técnico das Condições Ambientais do Trabalho',
                  ficha_epi: 'Ficha de EPI (Entrega de Equipamentos de Proteção Individual)',
                };
                const arquivosTipo = arquivos.filter(a => a.tipo === tipo);
                return (
                  <div key={tipo} className="rounded-xl border border-slate-200 p-4 mb-4">
                    <p className="text-sm font-semibold text-slate-800 mb-3">{labels[tipo]}</p>
                    {arquivosTipo.map((a, i) => {
                      const globalIdx = arquivos.findIndex((x, xi) => x.tipo === tipo && arquivos.filter((_, j) => j < xi && arquivos[j].tipo === tipo).length === i);
                      return (
                        <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 mb-2">
                          <span className="text-sm text-slate-700 truncate">{a.arquivo.name}</span>
                          <button onClick={() => removeArquivo(globalIdx)} className="text-red-400 hover:text-red-600 ml-3 flex-shrink-0">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                    <label className="flex items-center gap-2 cursor-pointer w-fit">
                      <span className="btn-secondary py-2 px-3 text-xs">
                        <Upload className="w-3 h-3" /> Anexar arquivo
                      </span>
                      <input type="file" className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                        onChange={e => { if (e.target.files?.[0]) addArquivo(tipo, e.target.files[0]); e.target.value = ''; }}
                      />
                    </label>
                  </div>
                );
              })}

              {erroEnvio && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {erroEnvio}
                </div>
              )}
            </StepSection>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            className="btn-secondary"
          >
            ← Anterior
          </button>

          {step < STEPS.length ? (
            <button onClick={() => setStep(s => Math.min(STEPS.length, s + 1))} className="btn-primary">
              Próximo →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={enviando} className="btn-primary px-8">
              {enviando
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                : <><CheckCircle2 className="w-4 h-4" /> Enviar PPP</>
              }
            </button>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 pb-8">
          Opusmed Segurança do Trabalho · seguranca@opus.med.br
        </p>
      </div>
    </div>
  );
}

// ─── Layout helpers ───────────────────────────────────────────────────────────
function StepSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-bold text-slate-900 mb-5 pb-3 border-b border-slate-100">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-3 flex-wrap">{children}</div>;
}

function Field({
  label, children, half, style
}: { label: string; children: React.ReactNode; half?: boolean; style?: React.CSSProperties }) {
  return (
    <div className={cn('flex-1', half && 'min-w-36')} style={style}>
      <label className="label-base">{label}</label>
      {children}
    </div>
  );
}

function Sucesso({ empresa }: { empresa: Empresa }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="card p-10 max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">PPP enviado com sucesso!</h1>
        <p className="text-slate-600 text-sm leading-relaxed">
          O formulário de <strong>{empresa.razao_social}</strong> foi recebido pela equipe da Opusmed.
          Em breve entraremos em contato pelo e-mail <strong>{empresa.email_contato}</strong>.
        </p>
        <p className="text-xs text-slate-400 mt-6">Opusmed Segurança do Trabalho · seguranca@opus.med.br</p>
      </div>
    </div>
  );
}
