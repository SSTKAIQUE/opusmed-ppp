export default function Loading() {
  return (
    <div className="p-8" role="status" aria-label="Carregando">
      <div className="h-6 w-56 bg-slate-200 rounded animate-pulse mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-200 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="h-64 bg-slate-200 rounded-xl animate-pulse" />
    </div>
  );
}
