'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createBrowserClient();

  const [email, setEmail]       = useState('');
  const [senha, setSenha]       = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando]     = useState(false);
  const [erro, setErro]         = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

    if (error) {
      setErro('E-mail ou senha incorretos. Verifique suas credenciais.');
      setCarregando(false);
      return;
    }

    router.push('/dashboard/solicitacoes');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      {/* Painel institucional */}
      <div className="hidden lg:flex w-[44%] bg-navy-dark relative overflow-hidden flex-col justify-between p-12">
        <div
          className="absolute inset-0 opacity-[0.4] pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(115deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 64px)',
          }}
        />
        <div className="relative z-10 w-14 h-14 rounded-full border-[1.5px] border-brass-soft flex items-center justify-center text-brass-soft font-serif font-semibold text-xl">
          OS
        </div>
        <div className="relative z-10">
          <h1 className="font-serif text-white text-[34px] font-semibold leading-tight mb-2.5">
            Opusmed<br />Segurança do Trabalho
          </h1>
          <p className="text-navy-light/80 text-sm leading-relaxed max-w-sm">
            Plataforma de gestão de Perfil Profissiográfico Previdenciário — emissão,
            acompanhamento e conformidade centralizados.
          </p>
        </div>
        <div className="relative z-10 border-t border-white/10 pt-4.5">
          <p className="text-[11.5px] text-[#5C7A91]">
            <b className="text-[#AABBC7] font-medium">Opusmed Medicina e Segurança do Trabalho</b>
            {' '}· CNPJ 27.389.598/0001-09
          </p>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex-1 flex items-center justify-center bg-white p-4">
        <div className="w-full max-w-sm">
          <h2 className="font-serif text-[22px] font-semibold text-ink mb-1.5">Acessar o painel</h2>
          <p className="text-sm text-slate-500 mb-7">Entre com suas credenciais corporativas.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seguranca@opus.med.br"
                className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-3.5 py-3 text-[13.5px] text-ink placeholder:text-slate-400 focus:outline-none focus:border-navy focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label htmlFor="senha" className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-3.5 py-3 pr-10 text-[13.5px] text-ink placeholder:text-slate-400 focus:outline-none focus:border-navy focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(v => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {erro && (
              <div className="rounded-md bg-status-redBg border border-status-red/20 px-4 py-3 text-sm text-status-red">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full rounded-md bg-navy text-white py-3 text-[13.5px] font-semibold tracking-wide hover:bg-navy-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {carregando ? (<><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</>) : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-[11px] text-slate-400 mt-7">
            Opusmed Segurança do Trabalho · MTE 45.170/MG
          </p>
        </div>
      </div>
    </div>
  );
}
