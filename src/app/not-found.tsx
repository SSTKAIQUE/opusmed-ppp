import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-slate-200 mb-4">404</p>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Página não encontrada</h1>
        <p className="text-slate-500 mb-6 text-sm">
          O link pode ter expirado ou o endereço está incorreto.
        </p>
        <Link href="/" className="btn-primary inline-flex">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
