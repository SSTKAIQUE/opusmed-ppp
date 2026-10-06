import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-paper p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_320px_at_50%_-60px,rgba(34,211,238,0.14),transparent)]" />
      <div className="relative text-center">
        <p className="bg-gradient-to-b from-[#0b2545] to-cyan-600 bg-clip-text font-mono text-[88px] font-bold leading-none tracking-tight text-transparent">404</p>
        <h1 className="mt-4 text-xl font-bold text-ink">Página não encontrada</h1>
        <p className="mx-auto mb-6 mt-2 max-w-xs text-sm text-slate-500">
          O link pode ter expirado ou o endereço está incorreto.
        </p>
        <Link href="/" className="btn-primary">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
