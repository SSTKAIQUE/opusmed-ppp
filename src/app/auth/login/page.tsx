'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { Eye, EyeOff, Loader2, Mail, Lock, ShieldCheck, LayoutList } from 'lucide-react';

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

    let error: { message: string; status?: number } | null = null;
    try {
      ({ error } = await supabase.auth.signInWithPassword({ email, password: senha }));
    } catch (err) {
      error = { message: err instanceof Error ? err.message : 'fetch failed' };
    }

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('invalid login credentials')) {
        setErro('E-mail ou senha incorretos. Verifique suas credenciais.');
      } else if (msg.includes('email not confirmed')) {
        setErro('E-mail ainda não confirmado. Confirme pelo link enviado ao seu e-mail.');
      } else if (msg.includes('fetch') || msg.includes('network') || (error.status ?? 0) >= 500 || error.status === 0) {
        setErro('Não foi possível conectar ao servidor de autenticação. Tente novamente em alguns minutos.');
      } else {
        setErro(`Falha ao entrar: ${error.message}`);
      }
      console.error('[login]', error);
      setCarregando(false);
      return;
    }

    router.push('/dashboard/solicitacoes');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      {/* Painel institucional */}
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-[#061426] p-12 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_460px_at_12%_0,rgba(34,211,238,0.2),transparent),radial-gradient(500px_300px_at_90%_100%,rgba(14,143,176,0.27),transparent),linear-gradient(160deg,#061426,#0b2545_65%,#082033)]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at 30% 20%, black, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 30% 20%, black, transparent 70%)',
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-cyan-400 to-cyan-700 text-[13px] font-bold text-[#04202e] shadow-[0_0_18px_rgba(34,211,238,0.35)]">OS</div>
          <div>
            <p className="text-sm font-semibold leading-tight">Opusmed SST</p>
            <p className="text-xs text-[#9db7d0]">Segurança do Trabalho</p>
          </div>
        </div>

        <div className="relative">
          <h2 className="max-w-md text-[34px] font-bold leading-[1.15] tracking-tight">Gestão de PPP, simples e sem papel.</h2>
          <p className="mt-3.5 max-w-sm text-[15px] text-[#b9cde0]">
            Receba os dados das empresas, acompanhe cada solicitação e emita o PPP com segurança.
          </p>
          <ul className="mt-8 space-y-3 text-[#d6e4f2]">
            <li className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/10"><ShieldCheck className="h-[18px] w-[18px]" /></span>
              Dados protegidos e com acesso por perfil
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/10"><LayoutList className="h-[18px] w-[18px]" /></span>
              Todas as solicitações em um só painel
            </li>
          </ul>
        </div>

        <p className="relative text-xs text-[#8fa9c2]">Opusmed Medicina e Segurança do Trabalho · CNPJ 27.389.598/0001-09</p>
      </div>

      {/* Formulário */}
      <div className="flex flex-1 items-center justify-center bg-white p-6 sm:p-10">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-cyan-400 to-cyan-700 text-[13px] font-bold text-[#04202e]">OS</div>
            <p className="text-sm font-semibold text-ink">Opusmed SST</p>
          </div>

          <h1 className="text-[26px] font-bold tracking-tight text-ink">Bem-vindo de volta</h1>
          <p className="mt-1 text-sm text-slate-500">Entre com suas credenciais corporativas.</p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-[13px] font-semibold text-ink">E-mail</label>
              <div className="flex items-center gap-2 rounded-[10px] border border-slate-200 bg-paper px-3 py-3 text-slate-400 focus-within:border-cyan-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-cyan-400/25">
                <Mail className="h-4 w-4 flex-none" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="voce@opus.med.br"
                  className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="senha" className="mb-1.5 block text-[13px] font-semibold text-ink">Senha</label>
              <div className="flex items-center gap-2 rounded-[10px] border border-slate-200 bg-paper px-3 py-3 text-slate-400 focus-within:border-cyan-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-cyan-400/25">
                <Lock className="h-4 w-4 flex-none" />
                <input
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(v => !v)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  className="text-slate-400 hover:text-slate-600"
                >
                  {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {erro && (
              <p role="alert" className="rounded-[10px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-700">
                {erro}
              </p>
            )}

            <button type="submit" disabled={carregando} className="btn-primary w-full py-3">
              {carregando ? <><Loader2 className="h-4 w-4 animate-spin" /> Entrando…</> : 'Entrar'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">Opusmed Segurança do Trabalho · acesso restrito à equipe</p>
        </div>
      </div>
    </div>
  );
}
