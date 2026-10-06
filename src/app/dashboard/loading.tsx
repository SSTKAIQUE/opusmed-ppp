export default function Loading() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-8 sm:py-8" role="status" aria-label="Carregando">
      <div className="mb-2 h-7 w-64 animate-pulse rounded-lg bg-slate-200" />
      <div className="mb-6 h-4 w-80 animate-pulse rounded bg-slate-200/70" />
      <div className="mb-5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[84px] animate-pulse rounded-xl bg-slate-200/80" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-xl bg-slate-200/80" />
    </div>
  );
}
