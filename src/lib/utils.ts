import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try { return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR }); }
  catch { return dateStr; }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try { return format(parseISO(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }); }
  catch { return dateStr; }
}

export function formatCNPJ(value: string): string {
  const d = value.replace(/\D/g, '');
  return d.replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d)/, '$1-$2').slice(0, 18);
}

export function formatCPF(value: string): string {
  const d = value.replace(/\D/g, '');
  return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14);
}

export function formatCEP(value: string): string {
  const d = value.replace(/\D/g, '');
  return d.replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
}

export const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente', em_andamento: 'Em Andamento',
  concluido: 'Concluído', cancelado: 'Cancelado', todos: 'Todos',
};

export const STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  em_andamento: 'bg-blue-100 text-blue-800 border-blue-200',
  concluido: 'bg-green-100 text-green-800 border-green-200',
  cancelado: 'bg-red-100 text-red-800 border-red-200',
};

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/** Gera link público do PPP — funciona no browser e no servidor */
export function generatePPPLink(token: string): string {
  const base =
    typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
  return `${base}/ppp/${token}`;
}

export function validateCNPJ(cnpj: string): boolean {
  const d = cnpj.replace(/\D/g, '');
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const calc = (s: string, len: number) => {
    let sum = 0, pos = len - 7;
    for (let i = len; i >= 1; i--) { sum += parseInt(s.charAt(len - i)) * pos--; if (pos < 2) pos = 9; }
    return (sum % 11 < 2 ? 0 : 11 - (sum % 11)).toString();
  };
  return calc(d, 12) === d.charAt(12) && calc(d, 13) === d.charAt(13);
}
