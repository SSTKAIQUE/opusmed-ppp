'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Building2, Link2, Copy, Check, Mail, Search, Loader2, X } from 'lucide-react';
import { cn, formatCNPJ, generatePPPLink, formatDateTime } from '@/lib/utils';
import type { Empresa } from '@/types';

interface Props {
  empresas: Empresa[];
  isAdmin: boolean;
}

interface FormData {
  razao_social: string;
  cnpj: string;
  email_contato: string;
  nome_contato: string;
}

const FORM_INICIAL: FormData = { razao_social: '', cnpj: '', email_contato: '', nome_contato: '' };

export default function EmpresasClient({ empresas: inicial, isAdmin }: Props) {
  const router    = useRouter();
  const [empresas, setEmpresas] = useState(inicial);
  const [busca, setBusca]       = useState('');
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState<FormData>(FORM_INICIAL);
  const [erros, setErros]       = useState<Partial<FormData>>({});
  const [salvando, setSalvando] = useState(false);
  const [copiados, setCopiados] = useState<Record<string, boolean>>({});
  const [enviandoEmail, setEnviandoEmail] = useState<string | null>(null);
  const [linkEnviado, setLinkEnviado]     = useState<string | null>(null);

  const filtradas = empresas.filter(e =>
    !busca ||
    e.razao_social.toLowerCase().includes(busca.toLowerCase()) ||
    e.cnpj.includes(busca)
  );

  function validar(): boolean {
    const e: Partial<FormData> = {};
    if (!form.razao_social.trim()) e.razao_social = 'Obrigatório';
    if (!form.cnpj.replace(/\D/g,'') || form.cnpj.replace(/\D/g,'').length !== 14) e.cnpj = 'CNPJ inválido';
    if (!form.email_contato.includes('@')) e.email_contato = 'E-mail inválido';
    if (!form.nome_contato.trim()) e.nome_contato = 'Obrigatório';
    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function criarEmpresa() {
    if (!validar()) return;
    setSalvando(true);
    const res = await fetch('/api/empresas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSalvando(false);
    if (!res.ok) { const data = await res.json(); alert(data.error || 'Erro ao criar empresa.'); return; }
    const { empresa } = await res.json();
    setEmpresas(prev => [empresa, ...prev].sort((a, b) => a.razao_social.localeCompare(b.razao_social)));
    setModal(false);
    setForm(FORM_INICIAL);
    router.refresh();
  }

  async function copiarLink(token: string) {
    const link = generatePPPLink(token);
    await navigator.clipboard.writeText(link);
    setCopiados(prev => ({ ...prev, [token]: true }));
    setTimeout(() => setCopiados(prev => ({ ...prev, [token]: false })), 2000);
  }

  async function enviarLinkEmail(empresa: Empresa) {
    setEnviandoEmail(empresa.id);
    const res = await fetch('/api/empresas/enviar-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresa_id: empresa.id }),
    });
    setEnviandoEmail(null);
    if (res.ok) { setLinkEnviado(empresa.id); setTimeout(() => setLinkEnviado(null), 3000); }
    else { alert('Erro ao enviar e-mail.'); }
  }

  function inputChange(field: keyof FormData, value: string) {
    const v = field === 'cnpj' ? formatCNPJ(value) : value;
    setForm(prev => ({ ...prev, [field]: v }));
    if (erros[field]) setErros(prev => ({ ...prev, [field]: undefined }));
  }

  const initials = (nome: string) => nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="min-h-full bg-slate-50">

      {/* TOPBAR */}
      <div className="bg-white border-b border-slate-200 px-8 h-14 flex items-center gap-4 sticky top-0 z-10">
        <div>
          <span className="text-[15px] font-bold text-slate-900">Empresas</span>
          <span className="text-xs text-slate-400 ml-2">/ Clientes Cadastrados</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-56">
          <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome ou CNPJ..."
            className="bg-transparent text-sm text-slate-700 outline-none w-full placeholder:text-slate-400"
          />
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-[#1B3D6F] to-[#2A5298] text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
        >
          <Plus className="w-4 h-4" /> Nova Empresa
        </button>
      </div>

      <div className="px-8 py-6 space-y-5">

        {/* STAT CARDS */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#1B3D6F] to-[#3B82F6]" />
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-800 text-slate-900">{empresas.length}</div>
            <div className="text-sm font-600 text-slate-600 mt-1">Empresas Cadastradas</div>
            <div className="text-xs text-slate-400 mt-0.5">clientes ativos</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400" />
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="text-3xl font-800 text-slate-900">{empresas.filter(e => e.token_link).length}</div>
            <div className="text-sm font-600 text-slate-600 mt-1">Links Ativos</div>
            <div className="text-xs text-slate-400 mt-0.5">formulários gerados</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-400" />
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <Mail className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-800 text-slate-900">{filtradas.length}</div>
            <div className="text-sm font-600 text-slate-600 mt-1">Resultados</div>
            <div className="text-xs text-slate-400 mt-0.5">{busca ? 'na busca atual' : 'total'}</div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-700 text-slate-900">Lista de Empresas</p>
              <p className="text-xs text-slate-400 mt-0.5">{filtradas.length} empresa{filtradas.length !== 1 ? 's' : ''} encontrada{filtradas.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {filtradas.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🏭</div>
              <p className="text-slate-600 font-600 text-sm">Nenhuma empresa encontrada</p>
              <p className="text-slate-400 text-xs mt-1">
                {empresas.length === 0 ? 'Cadastre a primeira empresa usando o botão acima.' : 'Tente outro termo de busca.'}
              </p>
              {empresas.length === 0 && (
                <button onClick={() => setModal(true)} className="inline-flex items-center gap-2 mt-4 bg-[#1B3D6F] text-white text-xs font-600 px-4 py-2 rounded-lg hover:bg-[#0F2647] transition">
                  <Plus className="w-3.5 h-3.5" /> Cadastrar Empresa
                </button>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-[11px] font-700 text-slate-400 uppercase tracking-wider">Empresa</th>
                  <th className="text-left px-6 py-3 text-[11px] font-700 text-slate-400 uppercase tracking-wider">Contato</th>
                  <th className="text-left px-6 py-3 text-[11px] font-700 text-slate-400 uppercase tracking-wider">Cadastro</th>
                  <th className="text-left px-6 py-3 text-[11px] font-700 text-slate-400 uppercase tracking-wider">Link PPP</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((e, idx) => (
                  <tr key={e.id} className={cn('border-b border-slate-50 hover:bg-blue-50/30 transition-colors', idx % 2 === 1 ? 'bg-slate-50/30' : '')}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1B3D6F] to-[#2A5298] flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                          {initials(e.razao_social)}
                        </div>
                        <div>
                          <p className="text-sm font-600 text-slate-900">{e.razao_social}</p>
                          <p className="text-xs font-mono text-slate-400 mt-0.5">{e.cnpj}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700 font-500">{e.nome_contato}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{e.email_contato}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{formatDateTime(e.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copiarLink(e.token_link)}
                          className={cn(
                            'flex items-center gap-1.5 text-xs font-600 px-3 py-1.5 rounded-lg border transition-all',
                            copiados[e.token_link]
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                          )}
                        >
                          {copiados[e.token_link] ? <><Check className="w-3 h-3" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}
                        </button>
                        <button
                          onClick={() => enviarLinkEmail(e)}
                          disabled={enviandoEmail === e.id}
                          className={cn(
                            'flex items-center gap-1.5 text-xs font-600 px-3 py-1.5 rounded-lg border transition-all',
                            linkEnviado === e.id
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          )}
                        >
                          {enviandoEmail === e.id
                            ? <><Loader2 className="w-3 h-3 animate-spin" /> Enviando</>
                            : linkEnviado === e.id
                              ? <><Check className="w-3 h-3" /> Enviado</>
                              : <><Mail className="w-3 h-3" /> Enviar</>
                          }
                        </button>
                        <a
                          href={generatePPPLink(e.token_link)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-[#1B3D6F] transition-all"
                          title="Abrir formulário"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(15,38,71,0.5)',backdropFilter:'blur(4px)'}}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-[#1B3D6F] to-[#2A5298] px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-[15px]">Cadastrar Empresa</p>
                <p className="text-white/60 text-xs mt-0.5">Preencha os dados do cliente</p>
              </div>
              <button onClick={() => { setModal(false); setForm(FORM_INICIAL); setErros({}); }} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {([
                { field: 'razao_social', label: 'Razão Social', type: 'text', placeholder: 'Nome Empresarial Ltda' },
                { field: 'cnpj',         label: 'CNPJ',         type: 'text', placeholder: '00.000.000/0000-00' },
                { field: 'email_contato',label: 'E-mail de Contato', type: 'email', placeholder: 'rh@empresa.com.br' },
                { field: 'nome_contato', label: 'Nome do Contato', type: 'text', placeholder: 'João da Silva' },
              ] as const).map(({ field, label, type, placeholder }) => (
                <div key={field}>
                  <label className="block text-xs font-700 text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={form[field]}
                    onChange={e => inputChange(field, e.target.value)}
                    placeholder={placeholder}
                    className={cn(
                      'w-full border rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none transition',
                      erros[field]
                        ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-100'
                        : 'border-slate-200 bg-slate-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white'
                    )}
                  />
                  {erros[field] && <p className="text-xs text-red-500 mt-1">{erros[field]}</p>}
                </div>
              ))}
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => { setModal(false); setForm(FORM_INICIAL); setErros({}); }}
                className="flex-1 border border-slate-200 text-slate-600 font-600 text-sm py-2.5 rounded-xl hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={criarEmpresa}
                disabled={salvando}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#1B3D6F] to-[#2A5298] text-white font-600 text-sm py-2.5 rounded-xl hover:shadow-md transition disabled:opacity-60"
              >
                {salvando ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : 'Cadastrar Empresa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
