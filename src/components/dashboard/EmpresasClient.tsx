'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Building2, Link2, Copy, Check, Mail, Search, Loader2, X, Trash2 } from 'lucide-react';
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

const FORM_INICIAL: FormData = {
  razao_social: '',
  cnpj: '',
  email_contato: '',
  nome_contato: '',
};

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
    if (!form.cnpj.replace(/\D/g,'') || form.cnpj.replace(/\D/g,'').length !== 14)
      e.cnpj = 'CNPJ inválido';
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
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || 'Erro ao criar empresa.');
      return;
    }

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
    if (res.ok) {
      setLinkEnviado(empresa.id);
      setTimeout(() => setLinkEnviado(null), 3000);
    } else {
      alert('Erro ao enviar e-mail. Verifique a configuração do Resend.');
    }
  }

  function inputChange(field: keyof FormData, value: string) {
    const v = field === 'cnpj' ? formatCNPJ(value) : value;
    setForm(prev => ({ ...prev, [field]: v }));
    if (erros[field]) setErros(prev => ({ ...prev, [field]: undefined }));
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Empresas</h1>
          <p className="text-sm text-slate-500 mt-1">{empresas.length} empresa(s) cadastrada(s)</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Nova Empresa
        </button>
      </div>

      {/* Busca */}
      <div className="card p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou CNPJ..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="input-base pl-9"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="card overflow-hidden">
        {filtradas.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Nenhuma empresa encontrada</p>
            <p className="text-slate-400 text-sm mt-1">
              {empresas.length === 0 ? 'Cadastre a primeira empresa usando o botão acima.' : 'Tente outro termo de busca.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Empresa</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Contato</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cadastro</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Link PPP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtradas.map(e => (
                <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-900">{e.razao_social}</p>
                    <p className="text-xs text-slate-400">{e.cnpj}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-slate-700">{e.nome_contato}</p>
                    <p className="text-xs text-slate-400">{e.email_contato}</p>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">{formatDateTime(e.created_at)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {/* Copiar */}
                      <button
                        onClick={() => copiarLink(e.token_link)}
                        className="btn-secondary py-1.5 px-2.5 text-xs"
                        title="Copiar link"
                      >
                        {copiados[e.token_link]
                          ? <><Check className="w-3 h-3 text-green-600" /> Copiado</>
                          : <><Copy className="w-3 h-3" /> Copiar</>
                        }
                      </button>

                      {/* Enviar por e-mail */}
                      <button
                        onClick={() => enviarLinkEmail(e)}
                        disabled={enviandoEmail === e.id}
                        className={cn(
                          'btn-secondary py-1.5 px-2.5 text-xs',
                          linkEnviado === e.id && 'border-green-300 text-green-700'
                        )}
                        title="Enviar link por e-mail para a empresa"
                      >
                        {enviandoEmail === e.id
                          ? <><Loader2 className="w-3 h-3 animate-spin" /> Enviando</>
                          : linkEnviado === e.id
                            ? <><Check className="w-3 h-3" /> Enviado</>
                            : <><Mail className="w-3 h-3" /> Enviar</>
                        }
                      </button>

                      {/* Abrir link */}
                      <a
                        href={generatePPPLink(e.token_link)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary py-1.5 px-2.5 text-xs"
                        title="Abrir formulário"
                      >
                        <Link2 className="w-3 h-3" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal — Nova Empresa */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Cadastrar Empresa</h2>
              <button onClick={() => setModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {([
                { field: 'razao_social', label: 'Razão Social', type: 'text', placeholder: 'Nome Empresarial Ltda' },
                { field: 'cnpj',         label: 'CNPJ',         type: 'text', placeholder: '00.000.000/0000-00' },
                { field: 'email_contato',label: 'E-mail de Contato', type: 'email', placeholder: 'rh@empresa.com.br' },
                { field: 'nome_contato', label: 'Nome do Contato', type: 'text', placeholder: 'João da Silva' },
              ] as const).map(({ field, label, type, placeholder }) => (
                <div key={field}>
                  <label className="label-base">{label}</label>
                  <input
                    type={type}
                    value={form[field]}
                    onChange={e => inputChange(field, e.target.value)}
                    placeholder={placeholder}
                    className={cn('input-base', erros[field] && 'border-red-300 focus:ring-red-200')}
                  />
                  {erros[field] && <p className="field-error">{erros[field]}</p>}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => { setModal(false); setForm(FORM_INICIAL); setErros({}); }} className="btn-secondary">
                Cancelar
              </button>
              <button onClick={criarEmpresa} disabled={salvando} className="btn-primary">
                {salvando ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
