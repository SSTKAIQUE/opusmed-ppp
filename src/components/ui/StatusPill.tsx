import { cn, STATUS_LABELS } from '@/lib/utils';

const STYLES: Record<string, string> = {
  pendente:     'bg-status-amberBg text-status-amber',
  em_andamento: 'bg-status-blueBg text-status-blue',
  concluido:    'bg-status-greenBg text-status-green',
  cancelado:    'bg-status-redBg text-status-red',
};

export default function StatusPill({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        STYLES[status] ?? 'bg-slate-100 text-slate-600',
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
