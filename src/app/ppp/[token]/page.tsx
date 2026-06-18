'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ChevronRight, ChevronLeft, Plus, Trash2, Loader2, CheckCircle2 } from 'lucide-react';

interface LotacaoRow { dt_ini: string; dt_fim: string; cnpj: string; setor: string; cargo: string; funcao: string; cbo: string; cod_cat: string; }
interface ProfRow    { dt_ini: string; dt_fim: string; atividades: string; }
interface AmbRow     { dt_ini: string; dt_fim: string; tipo: string; fator: string; valor: string; tecnica: string; epc: string; epi: string; ca: string; neutr_risco: string; efic_epi: string; desc_epi: string; }
interface RespRow    { dt_ini: string; dt_fim: string; cpf: string; crea: string; nome: string; }

interface FormState {
  empresa_razao_social: string; empresa_cnpj: string; empresa_cnae: string;
  trab_nome: string; trab_cpf: string; trab_nis: string; trab_nascimento: string;
  trab_sexo: string; trab_mae: string; trab_cbo: string; trab_funcao: string; trab_setor: string;
  trab_admissao: string; trab_demissao: string; trab_cargo: string;
  lotacao: LotacaoRow[];
  prof: ProfRow[];
  amb: AmbRow[];
  resp: RespRow[];
  emissao_data: string; rep_cpf: string; rep_nome: string; observacoes: string;
}

const INICIAL: FormState = {
  empresa_razao_social: '', empresa_cnpj: '', empresa_cnae: '',
  trab_nome: '', trab_cpf: '', trab_nis: '', trab_nascimento: '',
  trab_sexo: '', trab_mae: '', trab_cbo: '', trab_funcao: '', trab_setor: '',
  trab_admissao: '', trab_demissao: '', trab_cargo: '',
  lotacao: [{ dt_ini: '', dt_fim: '', cnpj: '', setor: '', cargo: '', funcao: '', cbo: '', cod_cat: '' }],
  prof:    [{ dt_ini: '', dt_fim: '', atividades: '' }],
  amb:     [{ dt_ini: '', dt_fim: '', tipo: 'F – Físico', fator: '', valor: '', tecnica: '', epc: 'S', epi: 'S', ca: '', neutr_risco: 'S', efic_epi: 'S', desc_epi: '' }],
  resp:    [{ dt_ini: '', dt_fim: '', cpf: '', crea: '', nome: '' }],
  emissao_data: '', rep_cpf: '', rep_nome: '', observacoes: '',
};

const STEPS = ['Dados Adm.', 'Lotação', 'Profissiografia', 'Reg. Ambientais', 'Responsáveis', 'Emissão'];

export default function FormularioPPP() {
  const { token } = useParams<{ token: string }>();
  const [step, setStep]       = useState(0);
  const [form, setForm]       = useState<FormState>(INICIAL);
  const [empresa, setEmpresa] = useState<{ razao_social: string; cnpj: string } | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando]     = useState(false);
  const [enviado, setEnviado]       = useState(false);
  const [erro, setErro]             = useState('');

  useEffect(() => {
    async function validar() {
      const res = await fetch(`/api/ppp/validar?token=${token}`);
      if (!res.ok) { setErro('Link inválido ou expirado.'); setCarregando(false); return; }
      const data = await res.json();
      setEmpresa(data.empresa);
      setForm(prev => ({ ...prev, empresa_razao_social: data.empresa.razao_social, empresa_cnpj: data.empresa.cnpj }));
      setCarregando(false);
    }
    validar();
  }, [token]);

  const set = (field: keyof FormState, val: string) => setForm(prev => ({ ...prev, [field]: val }));

  function addRow<T>(field: keyof FormState, empty: T) {
    setForm(prev => ({ ...prev, [field]: [...(prev[field] as T[]), empty] }));
  }
  function delRow<T>(field: keyof FormState, idx: number) {
    setForm(prev => ({ ...prev, [field]: (prev[field] as T[]).filter((_, i) => i !== idx) }));
  }
  function setRow<T>(field: keyof FormState, idx: number, key: keyof T, val: string) {
    setForm(prev => {
      const arr = [...(prev[field] as T[])];
      arr[idx] = { ...arr[idx], [key]: val };
      return { ...prev, [field]: arr };
    });
  }

  async function enviar() {
    setEnviando(true);
    const fd = new FormData();
    fd.append('token', token);
    fd.append('dados_ppp', JSON.stringify(form));
    const res = await fetch('/api/ppp', { method: 'POST', body: fd });
    setEnviando(false);
    if (res.ok) { setEnviado(true); }
    else { const d = await res.json(); alert(d.error || 'Erro ao enviar. Tente novamente.'); }
  }

  if (carregando) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-[#1F4E79]" /></div>;
  if (erro) return <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6"><div className="text-center max-w-sm"><div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><span className="text-2xl">⚠️</span></div><h2 className="text-lg font-bold text-slate-800 mb-2">Link inválido</h2><p className="text-sm text-slate-500">{erro}</p></div></div>;
  if (enviado) return <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6"><div className="text-center max-w-sm"><CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" /><h2 className="text-xl font-bold text-slate-800 mb-2">Dados enviados com sucesso!</h2><p className="text-sm text-slate-500">A equipe Opusmed receberá uma notificação e entrará em contato em breve.</p></div></div>;

  const inputCls = "w-full border border-[#cddae8] rounded-md px-3 py-2 text-sm bg-[#fafcff] focus:outline-none focus:border-[#1F4E79] focus:ring-2 focus:ring-[#1F4E79]/10";
  const labelCls = "block text-[11px] font-bold text-[#2a4a6a] uppercase tracking-wide mb-1";
  const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1">
      <label className={labelCls}>{label}{required && <em className="not-italic text-red-600 ml-1">*</em>}</label>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#eef2f7] pb-24" style={{fontFamily:"'Segoe UI',Arial,sans-serif"}}>
      <header className="bg-[#1F4E79] text-white flex items-center gap-4 px-7 h-16 shadow-md">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-black text-[#1F4E79] text-sm flex-shrink-0">OP</div>
        <div><p className="font-bold text-base leading-tight">Opusmed – Perfil Profissiográfico Previdenciário (PPP)</p><p className="text-[11px] opacity-70">Preencha todas as seções obrigatórias</p></div>
      </header>

      <div className="bg-[#174272] px-7 py-2.5 flex gap-1.5 items-center overflow-x-auto">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <button onClick={() => setStep(i)} className={`flex items-center gap-1.5 text-[11px] px-2 py-1 rounded whitespace-nowrap transition-all ${i === step ? 'bg-white/12 text-white' : i < step ? 'text-[#7dd3a8]' : 'text-white/50'}`}>
              <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${i === step ? 'bg-white text-[#1F4E79] border-white' : i < step ? 'bg-[#7dd3a8] text-white border-[#7dd3a8]' : 'border-current'}`}>{i < step ? '✓' : i + 1}</span>
              <span className="hidden sm:inline">{s}</span>
            </button>
            {i < STEPS.length - 1 && <div className="w-5 h-px bg-white/20 flex-shrink-0" />}
          </div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 mb-5 shadow-sm text-xs text-slate-500">
          <span>🔗 Empresa: <strong className="text-[#1F4E79]">{empresa?.razao_social}</strong></span>
          <span className="bg-[#1F4E79] text-white px-3 py-1 rounded-full text-[11px] font-bold">{token.slice(0,12).toUpperCase()}</span>
        </div>

        {step === 0 && (
          <div className="space-y-5">
            <Card title="📋 Dados Administrativos" badge="Campos 1–3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-3"><Field label="Nome Empresarial" required><input className={inputCls} value={form.empresa_razao_social} onChange={e => set('empresa_razao_social', e.target.value)} placeholder="Razão social conforme CNPJ" /></Field></div>
                <Field label="CNPJ / CEI / CAEPF / CNO" required><input className={inputCls} value={form.empresa_cnpj} onChange={e => set('empresa_cnpj', e.target.value)} placeholder="00.000.000/0001-00" /></Field>
                <Field label="CNAE" required><input className={inputCls} value={form.empresa_cnae} onChange={e => set('empresa_cnae', e.target.value)} placeholder="Ex: 2869-1/00" /></Field>
              </div>
            </Card>
            <Card title="👤 Dados do Trabalhador" badge="Campos 4–11">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-3"><Field label="Nome do Trabalhador" required><input className={inputCls} value={form.trab_nome} onChange={e => set('trab_nome', e.target.value)} placeholder="Nome completo" /></Field></div>
                <Field label="CPF" required><input className={inputCls} value={form.trab_cpf} onChange={e => set('trab_cpf', e.target.value)} placeholder="000.000.000-00" /></Field>
                <Field label="NIS/PIS/PASEP" required><input className={inputCls} value={form.trab_nis} onChange={e => set('trab_nis', e.target.value)} placeholder="000.00000.00-0" /></Field>
                <Field label="Data de Nascimento" required><input type="date" className={inputCls} value={form.trab_nascimento} onChange={e => set('trab_nascimento', e.target.value)} /></Field>
                <Field label="Sexo" required><select className={inputCls} value={form.trab_sexo} onChange={e => set('trab_sexo', e.target.value)}><option value="">Selecione</option><option>Masculino</option><option>Feminino</option></select></Field>
                <Field label="Nome da Mãe"><input className={inputCls} value={form.trab_mae} onChange={e => set('trab_mae', e.target.value)} placeholder="Nome completo da mãe" /></Field>
                <Field label="CBO" required><input className={inputCls} value={form.trab_cbo} onChange={e => set('trab_cbo', e.target.value)} placeholder="Ex: 7231-10" /></Field>
                <Field label="Cargo" required><input className={inputCls} value={form.trab_cargo} onChange={e => set('trab_cargo', e.target.value)} placeholder="Ex: Técnico de Solda" /></Field>
                <Field label="Função" required><input className={inputCls} value={form.trab_funcao} onChange={e => set('trab_funcao', e.target.value)} placeholder="Ex: Soldador" /></Field>
                <Field label="Setor" required><input className={inputCls} value={form.trab_setor} onChange={e => set('trab_setor', e.target.value)} placeholder="Ex: Produção" /></Field>
                <Field label="Admissão" required><input type="date" className={inputCls} value={form.trab_admissao} onChange={e => set('trab_admissao', e.target.value)} /></Field>
                <Field label="Demissão"><input type="date" className={inputCls} value={form.trab_demissao} onChange={e => set('trab_demissao', e.target.value)} /></Field>
              </div>
            </Card>
          </div>
        )}

        {step === 1 && (
          <Card title="🏢 Histórico de Lotação" badge="Campo 12">
            <p className="text-[11px] text-amber-700 bg-amber-50 border-l-4 border-amber-400 rounded px-3 py-2 mb-4">Registre todos os períodos de lotação do trabalhador.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead><tr className="bg-[#D6E4F0]">{['Início','Fim','CNPJ','Setor','Cargo','Função','CBO','Cód. CAT',''].map(h => <th key={h} className="border border-[#c0d4e8] px-2 py-1.5 text-left text-[10px] font-bold text-[#1F4E79] uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody>
                  {form.lotacao.map((r, i) => (
                    <tr key={i} className="hover:bg-blue-50/40">
                      {(['dt_ini','dt_fim'] as const).map(k => <td key={k} className="border border-[#dde8f4] p-0"><input type="date" className="border-none bg-transparent px-2 py-1.5 text-xs w-full outline-none focus:bg-blue-50" value={r[k]} onChange={e => setRow<LotacaoRow>('lotacao', i, k, e.target.value)} /></td>)}
                      {(['cnpj','setor','cargo','funcao','cbo','cod_cat'] as const).map(k => <td key={k} className="border border-[#dde8f4] p-0"><input className="border-none bg-transparent px-2 py-1.5 text-xs w-full outline-none focus:bg-blue-50 min-w-[80px]" value={r[k]} onChange={e => setRow<LotacaoRow>('lotacao', i, k, e.target.value)} /></td>)}
                      <td className="border border-[#dde8f4] text-center"><button onClick={() => delRow('lotacao', i)} className="text-red-500 hover:text-red-700 px-2"><Trash2 className="w-3.5 h-3.5" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => addRow<LotacaoRow>('lotacao', { dt_ini:'',dt_fim:'',cnpj:'',setor:'',cargo:'',funcao:'',cbo:'',cod_cat:'' })} className="mt-3 flex items-center gap-1.5 text-[#1F4E79] border border-dashed border-[#1F4E79] px-3 py-1.5 rounded text-xs font-semibold hover:bg-blue-50 transition"><Plus className="w-3.5 h-3.5" /> Adicionar período</button>
          </Card>
        )}

        {step === 2 && (
          <Card title="📝 Descrição das Atividades" badge="Campo 13">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead><tr className="bg-[#D6E4F0]">{['Início','Fim','Descrição das Atividades',''].map(h => <th key={h} className="border border-[#c0d4e8] px-2 py-1.5 text-left text-[10px] font-bold text-[#1F4E79] uppercase tracking-wide">{h}</th>)}</tr></thead>
                <tbody>
                  {form.prof.map((r, i) => (
                    <tr key={i} className="hover:bg-blue-50/40">
                      {(['dt_ini','dt_fim'] as const).map(k => <td key={k} className="border border-[#dde8f4] p-0"><input type="date" className="border-none bg-transparent px-2 py-1.5 text-xs w-full outline-none focus:bg-blue-50" value={r[k]} onChange={e => setRow<ProfRow>('prof', i, k, e.target.value)} /></td>)}
                      <td className="border border-[#dde8f4] p-0 min-w-[300px]"><textarea className="border-none bg-transparent px-2 py-1.5 text-xs w-full outline-none focus:bg-blue-50 resize-y min-h-[60px]" value={r.atividades} onChange={e => setRow<ProfRow>('prof', i, 'atividades', e.target.value)} placeholder="Descreva as atividades..." /></td>
                      <td className="border border-[#dde8f4] text-center"><button onClick={() => delRow('prof', i)} className="text-red-500 hover:text-red-700 px-2"><Trash2 className="w-3.5 h-3.5" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => addRow<ProfRow>('prof', { dt_ini:'',dt_fim:'',atividades:'' })} className="mt-3 flex items-center gap-1.5 text-[#1F4E79] border border-dashed border-[#1F4E79] px-3 py-1.5 rounded text-xs font-semibold hover:bg-blue-50 transition"><Plus className="w-3.5 h-3.5" /> Adicionar período</button>
          </Card>
        )}

        {step === 3 && (
          <Card title="⚗️ Registros Ambientais" badge="Campos 14–15">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead><tr className="bg-[#D6E4F0]">{['Início','Fim','Tipo','Fator','Valor','Técnica','EPC','EPI','Nº C.A.','Neutrl.','Efic. EPI','Desc. EPI',''].map(h => <th key={h} className="border border-[#c0d4e8] px-2 py-1.5 text-left text-[10px] font-bold text-[#1F4E79] uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody>
                  {form.amb.map((r, i) => (
                    <tr key={i} className="hover:bg-blue-50/40">
                      {(['dt_ini','dt_fim'] as const).map(k => <td key={k} className="border border-[#dde8f4] p-0"><input type="date" className="border-none bg-transparent px-2 py-1.5 text-xs w-full outline-none focus:bg-blue-50 min-w-[110px]" value={r[k]} onChange={e => setRow<AmbRow>('amb', i, k, e.target.value)} /></td>)}
                      <td className="border border-[#dde8f4] p-0"><select className="border-none bg-transparent px-2 py-1.5 text-xs w-full outline-none focus:bg-blue-50 min-w-[100px]" value={r.tipo} onChange={e => setRow<AmbRow>('amb', i, 'tipo', e.target.value)}>{['F – Físico','Q – Químico','B – Biológico'].map(o => <option key={o}>{o}</option>)}</select></td>
                      {(['fator','valor','tecnica'] as const).map(k => <td key={k} className="border border-[#dde8f4] p-0"><input className="border-none bg-transparent px-2 py-1.5 text-xs w-full outline-none focus:bg-blue-50 min-w-[80px]" value={r[k]} onChange={e => setRow<AmbRow>('amb', i, k, e.target.value)} /></td>)}
                      {(['epc','epi','neutr_risco','efic_epi'] as const).map(k => <td key={k} className="border border-[#dde8f4] p-0"><select className="border-none bg-transparent px-2 py-1.5 text-xs w-full outline-none focus:bg-blue-50" value={r[k]} onChange={e => setRow<AmbRow>('amb', i, k, e.target.value)}>{['S','N','NA'].map(o => <option key={o}>{o}</option>)}</select></td>)}
                      <td className="border border-[#dde8f4] p-0"><input className="border-none bg-transparent px-2 py-1.5 text-xs w-full outline-none focus:bg-blue-50 min-w-[80px]" value={r.ca} onChange={e => setRow<AmbRow>('amb', i, 'ca', e.target.value)} placeholder="Nº C.A." /></td>
                      <td className="border border-[#dde8f4] p-0"><input className="border-none bg-transparent px-2 py-1.5 text-xs w-full outline-none focus:bg-blue-50 min-w-[100px]" value={r.desc_epi} onChange={e => setRow<AmbRow>('amb', i, 'desc_epi', e.target.value)} placeholder="Descrição EPI" /></td>
                      <td className="border border-[#dde8f4] text-center"><button onClick={() => delRow('amb', i)} className="text-red-500 hover:text-red-700 px-2"><Trash2 className="w-3.5 h-3.5" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => addRow<AmbRow>('amb', { dt_ini:'',dt_fim:'',tipo:'F – Físico',fator:'',valor:'',tecnica:'',epc:'S',epi:'S',ca:'',neutr_risco:'S',efic_epi:'S',desc_epi:'' })} className="mt-3 flex items-center gap-1.5 text-[#1F4E79] border border-dashed border-[#1F4E79] px-3 py-1.5 rounded text-xs font-semibold hover:bg-blue-50 transition"><Plus className="w-3.5 h-3.5" /> Adicionar agente</button>
          </Card>
        )}

        {step === 4 && (
          <Card title="👷 Responsáveis pelos Registros" badge="Campo 16">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead><tr className="bg-[#D6E4F0]">{['Início','Fim','CPF','CREA/CRM','Nome',''].map(h => <th key={h} className="border border-[#c0d4e8] px-2 py-1.5 text-left text-[10px] font-bold text-[#1F4E79] uppercase tracking-wide">{h}</th>)}</tr></thead>
                <tbody>
                  {form.resp.map((r, i) => (
                    <tr key={i} className="hover:bg-blue-50/40">
                      {(['dt_ini','dt_fim'] as const).map(k => <td key={k} className="border border-[#dde8f4] p-0"><input type="date" className="border-none bg-transparent px-2 py-1.5 text-xs w-full outline-none focus:bg-blue-50 min-w-[110px]" value={r[k]} onChange={e => setRow<RespRow>('resp', i, k, e.target.value)} /></td>)}
                      {(['cpf','crea','nome'] as const).map(k => <td key={k} className="border border-[#dde8f4] p-0"><input className="border-none bg-transparent px-2 py-1.5 text-xs w-full outline-none focus:bg-blue-50 min-w-[100px]" value={r[k]} onChange={e => setRow<RespRow>('resp', i, k, e.target.value)} /></td>)}
                      <td className="border border-[#dde8f4] text-center"><button onClick={() => delRow('resp', i)} className="text-red-500 hover:text-red-700 px-2"><Trash2 className="w-3.5 h-3.5" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => addRow<RespRow>('resp', { dt_ini:'',dt_fim:'',cpf:'',crea:'',nome:'' })} className="mt-3 flex items-center gap-1.5 text-[#1F4E79] border border-dashed border-[#1F4E79] px-3 py-1.5 rounded text-xs font-semibold hover:bg-blue-50 transition"><Plus className="w-3.5 h-3.5" /> Adicionar responsável</button>
          </Card>
        )}

        {step === 5 && (
          <Card title="✍️ Emissão e Representante Legal" badge="Campos 17–18">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <Field label="Data de Emissão" required><input type="date" className={inputCls} value={form.emissao_data} onChange={e => set('emissao_data', e.target.value)} /></Field>
              <Field label="CPF do Representante Legal" required><input className={inputCls} value={form.rep_cpf} onChange={e => set('rep_cpf', e.target.value)} placeholder="000.000.000-00" /></Field>
              <Field label="Nome do Representante Legal" required><input className={inputCls} value={form.rep_nome} onChange={e => set('rep_nome', e.target.value)} placeholder="Nome completo" /></Field>
            </div>
            <div className="mb-5"><Field label="Observações"><textarea className={`${inputCls} min-h-[80px] resize-y`} value={form.observacoes} onChange={e => set('observacoes', e.target.value)} placeholder="Informações complementares..." /></Field></div>
            <div className="bg-[#f4f8fd] border border-[#cddae8] rounded-lg px-4 py-3 text-xs text-[#3a5a7a] leading-relaxed mb-5">
              <strong className="block text-[#1F4E79] font-bold mb-1">Declaração</strong>
              Declaramos, para todos os fins de direito, que as informações prestadas neste documento são verídicas e foram transcritas fielmente dos registros administrativos, das demonstrações ambientais e dos programas médicos de responsabilidade da empresa.
            </div>
            <div className="bg-[#f0faf4] border-2 border-[#2e8b57] rounded-lg px-5 py-4">
              <p className="text-sm font-bold text-[#1a5c35] mb-3">✅ Tudo preenchido? Envie para a Opusmed revisar.</p>
              <button onClick={enviar} disabled={enviando} className="flex items-center gap-2 bg-[#2e7d32] text-white font-bold px-6 py-2.5 rounded-lg text-sm hover:bg-[#1b5e20] transition disabled:opacity-60">
                {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : '📤'}
                {enviando ? 'Enviando...' : 'Enviar para a Opusmed'}
              </button>
              <p className="text-xs text-slate-500 mt-2">Após o envio, nossa equipe revisará os dados e entrará em contato.</p>
            </div>
          </Card>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-7 py-3 flex justify-between items-center shadow-lg z-50">
        <p className="text-xs text-slate-400">Campos com <strong className="text-red-600">*</strong> são obrigatórios</p>
        <div className="flex gap-2.5">
          {step > 0 && <button onClick={() => { setStep(s => s - 1); window.scrollTo({top:0,behavior:'smooth'}); }} className="flex items-center gap-1.5 bg-slate-100 text-slate-700 font-bold px-4 py-2 rounded-lg text-sm hover:bg-slate-200 transition"><ChevronLeft className="w-4 h-4" /> Anterior</button>}
          {step < STEPS.length - 1 && <button onClick={() => { setStep(s => s + 1); window.scrollTo({top:0,behavior:'smooth'}); }} className="flex items-center gap-1.5 bg-[#1F4E79] text-white font-bold px-4 py-2 rounded-lg text-sm hover:bg-[#163a5f] transition">Próximo <ChevronRight className="w-4 h-4" /></button>}
        </div>
      </div>
    </div>
  );
}

function Card({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-5">
      <div className="bg-[#1F4E79] text-white px-5 py-3 flex items-center gap-2.5 text-sm font-bold">
        {title}
        {badge && <span className="bg-white/10 rounded px-2 py-0.5 text-[11px] font-semibold">{badge}</span>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
