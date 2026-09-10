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
    <div className="min-h-full bg-paper">

      {/* TOPBAR */}
      <div className="bg-white border-b border-slate-200 px-[30px] h-[58px] flex items-center gap-4 sticky top-0 z-10">
        <div>
          <span className="font-serif text-base font-semibold text-ink">Empresas</span>
          <span className="text-xs text-slate-400 ml-2">/ Clientes Cadastrados</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 border border-slate-200 rounded-md px-3 py-2 w-56">
          <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome ou CNPJ..."
            className="bg-transparent text-[12.5px] text-slate-700 outline-none w-full placeholder:text-slate-400"
          />
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-navy text-white text-[12.5px] font-semibold px-[17px] py-2.5 rounded-md hover:bg-navy-dark transition-colors"
        >
          <Plus className="w-4 h-4" /> Nova Empresa
        </button>
      </div>

      <div className="px-[30px] py-7 space-y-[22px]">

        {/* LEDGER STRIP */}
        <div className="bg-white rounded-lg border border-slate-200 flex overflow-hidden">
          <div className="flex-1 px-[19px] py-[17px] border-r border-slate-200 relative">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-status-blue" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Empresas Cadastradas</span>
            <div className="font-mono text-2xl font-semibold text-ink leading-none mt-2.5">{empresas.length}</div>
            <div className="text-[10.5px] text-slate-400 mt-1.5">clientes ativos</div>
          </div>
          <div className="flex-1 px-[19px] py-[17px] border-r border-slate-200 relative">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-status-green" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Links Ativos</span>
            <div className="font-mono text-2xl font-semibold text-ink leading-none mt-2.5">{empresas.filter(e => e.token_link).length}</div>
            <div className="text-[10.5px] text-slate-400 mt-1.5">formulários gerados</div>
          </div>
          <div className="flex-1 px-[19px] py-[17px] relative">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-status-blue" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Resultados</span>
            <div className="font-mono text-2xl font-semibold text-ink leading-none mt-2.5">{filtradas.length}</div>
            <div className="text-[10.5px] text-slate-400 mt-1.5">{busca ? 'na busca atual' : 'total'}</div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-[21px] py-[17px] border-b border-slate-200 flex items-baseline justify-between">
            <p className="font-serif text-sm font-semibold text-ink">Lista de Empresas</p>
            <p className="text-[11px] text-slate-400">{filtradas.length} empresa{filtradas.length !== 1 ? 's' : ''} encontrada{filtradas.length !== 1 ? 's' : ''}</p>
          </div>

          {filtradas.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl text-slate-400">—</div>
              <p className="text-slate-600 font-semibold text-sm">Nenhuma empresa encontrada</p>
              <p className="text-slate-400 text-xs mt-1">
                {empresas.length === 0 ? 'Cadastre a primeira empresa usando o botão acima.' : 'Tente outro termo de busca.'}
              </p>
              {empresas.length === 0 && (
                <button onClick={() => setModal(true)} className="inline-flex items-center gap-2 mt-4 bg-navy text-white text-xs font-semibold px-4 py-2 rounded-md hover:bg-navy-dark transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Cadastrar Empresa
                </button>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200">
                  <th className="text-left px-[21px] py-[11px] text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider">Empresa</th>
                  <th className="text-left px-[21px] py-[11px] text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider">Contato</th>
                  <th className="text-left px-[21px] py-[11px] text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider">Cadastro</th>
                  <th className="text-left px-[21px] py-[11px] text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider">Link PPP</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((e) => (
                  <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors last:border-b-0">
                    <td className="px-[21px] py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-navy-mid border border-brass-soft flex items-center justify-center text-white text-[11px] font-semibold font-mono flex-shrink-0">
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
                          className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-navy transition-all"
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
            <div className="bg-navy-dark px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-white font-serif font-semibold text-[15px]">Cadastrar Empresa</p>
                <p className="text-white/50 text-xs mt-0.5">Preencha os dados do cliente</p>
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
                className="flex-1 flex items-center justify-center gap-2 bg-navy text-white font-600 text-sm py-2.5 rounded-xl hover:bg-navy-dark transition disabled:opacity-60"
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
