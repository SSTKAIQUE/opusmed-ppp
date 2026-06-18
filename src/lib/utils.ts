import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format date to Brazilian standard */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return dateStr;
  }
}

/** Format datetime to Brazilian standard */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

/** Format CNPJ: 00.000.000/0000-00 */
export function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18);
}

/** Format CPF: 000.000.000-00 */
export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .slice(0, 14);
}

/** Format CEP: 00000-000 */
export function formatCEP(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
}

/** Status label map */
export const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  todos: 'Todos',
};

/** Status color map (Tailwind classes) */
export const STATUS_COLORS: Record<string, string> = {
  pendente:    'bg-yellow-100 text-yellow-800 border-yellow-200',
  em_andamento:'bg-blue-100 text-blue-800 border-blue-200',
  concluido:   'bg-green-100 text-green-800 border-green-200',
  cancelado:   'bg-red-100 text-red-800 border-red-200',
};

/** File size formatter */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/** Generate public PPP link */
export function generatePPPLink(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${base}/ppp/${token}`;
}

/** Validate CNPJ checksum */
export function validateCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  const calc = (d: string, len: number) => {
    let sum = 0;
    let pos = len - 7;
    for (let i = len; i >= 1; i--) {
      sum += parseInt(d.charAt(len - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    const result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return result.toString();
  };

  return (
    calc(digits, 12) === digits.charAt(12) &&
    calc(digits, 13) === digits.charAt(13)
  );
}
