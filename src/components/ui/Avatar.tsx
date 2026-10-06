import { cn } from '@/lib/utils';

export function initialsOf(nome: string): string {
  return (
    nome
      .replace(/[^\p{L}\s]/gu, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  );
}

export default function Avatar({ nome, size = 'md', className }: { nome: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 'h-7 w-7 text-[11px]', md: 'h-9 w-9 text-xs', lg: 'h-11 w-11 text-sm' };
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex flex-none items-center justify-center rounded-full bg-navy/10 font-semibold text-navy',
        sizes[size],
        className
      )}
    >
      {initialsOf(nome)}
    </span>
  );
}
