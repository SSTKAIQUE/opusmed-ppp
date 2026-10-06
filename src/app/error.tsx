'use client';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-6">
      <div className="max-w-sm text-center" role="alert">
        <h2 className="mb-2 text-lg font-bold text-ink">Algo deu errado</h2>
        <p className="mb-5 text-sm text-slate-500">
          Não foi possível carregar esta página. Tente novamente em instantes.
        </p>
        <button onClick={reset} className="btn-primary">
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
