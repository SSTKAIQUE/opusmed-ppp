'use client';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="text-center max-w-sm" role="alert">
        <h2 className="text-lg font-bold text-slate-800 mb-2">Algo deu errado</h2>
        <p className="text-sm text-slate-500 mb-4">
          Não foi possível carregar esta página. Tente novamente em instantes.
        </p>
        <button
          onClick={reset}
          className="bg-[#1F4E79] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#163a5f]"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
