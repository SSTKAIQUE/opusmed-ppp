'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Link2, Copy, Check, Mail, Search, Loader2, X, Building2, Calendar } from 'lucide-react';
import { cn, formatCNPJ, generatePPPLink, formatDate } from '@/lib/utils';
import Avatar from '@/components/ui/Avatar';
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

export default function EmpresasClient({ empresas: inicial }: Props) {
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

  useEffect(() => setEmpresas(inicial), [inicial]);

  // Esc fecha o modal
  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') fecharModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal]);

  const filtradas = empresas.filter(e =>
    !busca ||
    e.razao_social.toLowerCase().includes(busca.toLowerCase()) ||
    e.cnpj.includes(busca)
  );

  function fecharModal() {
    setModal(false);
    setForm(FORM_INICIAL);
    setErros({});
  }

  function validar(): boolean {
    const e: Partial<FormData> = {};
    if (!form.razao_social.trim()) e.razao_social = 'Obrigatório';
    if (form.cnpj.replace(/\D/g, '').length !== 14) e.cnpj = 'CNPJ inválido';
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
    fecharModal();
    router.refresh();
  }

  async function copiarLink(token: string) {
    await navigator.clipboard.writeText(generatePPPLink(token));
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
    else { const d = await res.json().catch(() => ({})); alert(d.error || 'Erro ao enviar e-mail.'); }
  }

  function inputChange(field: keyof FormData, value: string) {
    const v = field === 'cnpj' ? formatCNPJ(value) : value;
    setForm(prev => ({ ...prev, [field]: v }));
    if (erros[field]) setErros(prev => ({ ...prev, [field]: undefined }));
  }

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-8 sm:py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Empresas</h1>
          <p className="mt-0.5 text-sm text-slate-500">Clientes cadastrados e links do formulário de PPP.</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Nova empresa
        </button>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3.5 sm:max-w-md">
        <div className="rounded-xl border border-[#d6e8f0] bg-gradient-to-b from-white to-[#f4fafd] p-4 shadow-sm">
          <p className="font-mono text-[28px] font-semibold leading-none text-ink">{empresas.length}</p>
          <p className="mt-1 text-[12.5px] text-slate-500">Empresas cadastradas</p>
        </div>
        <div className="rounded-xl border border-[#d6e8f0] bg-gradient-to-b from-white to-[#f4fafd] p-4 shadow-sm">
          <p className="font-mono text-[28px] font-semibold leading-none text-ink">{empresas.filter(e => e.token_link).length}</p>
          <p className="mt-1 text-[12.5px] text-slate-500">Links ativos</p>
        </div>
      </div>

      <label className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-400 shadow-sm focus-within:border-cyan-600 focus-within:ring-2 focus-within:ring-cyan-400/25">
        <Search className="h-4 w-4 flex-none" />
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome ou CNPJ…"
          aria-label="Buscar empresas"
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate-400"
        />
      </label>

      {filtradas.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Building2 className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Nenhuma empresa encontrada</p>
          <p className="mt-1 text-sm text-slate-400">
            {empresas.length === 0 ? 'Cadastre a primeira empresa para gerar o link do formulário.' : 'Tente outro termo de busca.'}
          </p>
          {empresas.length === 0 && (
            <button onClick={() => setModal(true)} className="btn-primary mt-4"><Plus className="h-4 w-4" /> Cadastrar empresa</button>
          )}
        </div>
      ) : (
        <div className="grid gap-3.5 md:grid-cols-2">
          {filtradas.map(e => (
            <article key={e.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-[18px] shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3">
                <Avatar nome={e.razao_social} size="lg" className="rounded-[11px]" />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-semibold text-ink">{e.razao_social}</h2>
                  <p className="font-mono text-xs text-slate-400">{e.cnpj}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-status-greenBg px-2.5 py-1 text-xs font-semibold text-status-green">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" /> Link ativo
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-[13px]">
                <div className="min-w-0">
                  <dt className="text-xs text-slate-400">Contato</dt>
                  <dd className="truncate text-slate-700">{e.nome_contato}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs text-slate-400">E-mail</dt>
                  <dd className="truncate text-slate-700">{e.email_contato}</dd>
                </div>
                <div className="col-span-2 flex items-center gap-1.5 text-xs text-slate-400">
                  <Calendar className="h-3.5 w-3.5" /> Cadastrada em {formatDate(e.created_at)}
                </div>
              </dl>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => copiarLink(e.token_link)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-semibold transition-colors',
                    copiados[e.token_link]
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  )}
                >
                  {copiados[e.token_link] ? <><Check className="h-3.5 w-3.5" /> Copiado</> : <><Copy className="h-3.5 w-3.5" /> Copiar link</>}
                </button>
                <button
                  onClick={() => enviarLinkEmail(e)}
                  disabled={enviandoEmail === e.id}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-semibold transition-colors disabled:opacity-60',
                    linkEnviado === e.id
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  )}
                >
                  {enviandoEmail === e.id
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando</>
                    : linkEnviado === e.id
                      ? <><Check className="h-3.5 w-3.5" /> Enviado</>
                      : <><Mail className="h-3.5 w-3.5" /> Enviar por e-mail</>}
                </button>
                <a
                  href={generatePPPLink(e.token_link)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Link2 className="h-3.5 w-3.5" /> Abrir
                </a>
              </div>
            </article>
          ))}
        </div>
      )}

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#07182c]/60 p-4 backdrop-blur-sm"
          onClick={fecharModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal"
            onClick={ev => ev.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between bg-gradient-to-br from-[#07182c] to-[#0b2545] px-6 py-5">
              <div>
                <h2 id="titulo-modal" className="text-[15px] font-semibold text-white">Cadastrar empresa</h2>
                <p className="mt-0.5 text-xs text-[#7f9bb8]">Preencha os dados do cliente</p>
              </div>
              <button
                onClick={fecharModal}
                aria-label="Fechar"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/70 transition hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              {([
                { field: 'razao_social',  label: 'Razão social',      type: 'text',  placeholder: 'Nome Empresarial Ltda' },
                { field: 'cnpj',          label: 'CNPJ',              type: 'text',  placeholder: '00.000.000/0000-00' },
                { field: 'email_contato', label: 'E-mail de contato', type: 'email', placeholder: 'rh@empresa.com.br' },
                { field: 'nome_contato',  label: 'Nome do contato',   type: 'text',  placeholder: 'João da Silva' },
              ] as const).map(({ field, label, type, placeholder }, i) => (
                <div key={field}>
                  <label htmlFor={`f-${field}`} className="mb-1.5 block text-[13px] font-semibold text-slate-700">{label}</label>
                  <input
                    id={`f-${field}`}
                    autoFocus={i === 0}
                    type={type}
                    value={form[field]}
                    onChange={ev => inputChange(field, ev.target.value)}
                    placeholder={placeholder}
                    aria-invalid={!!erros[field]}
                    className={cn(
                      'w-full rounded-[10px] border px-3.5 py-2.5 text-sm text-ink outline-none transition',
                      erros[field]
                        ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-100'
                        : 'border-slate-200 bg-paper focus:border-cyan-600 focus:bg-white focus:ring-2 focus:ring-cyan-400/25'
                    )}
                  />
                  {erros[field] && <p role="alert" className="mt-1 text-xs text-red-600">{erros[field]}</p>}
                </div>
              ))}
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button onClick={fecharModal} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={criarEmpresa} disabled={salvando} className="btn-primary flex-1">
                {salvando ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando…</> : 'Cadastrar empresa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
