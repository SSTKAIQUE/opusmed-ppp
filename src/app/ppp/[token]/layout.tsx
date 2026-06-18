import type { Metadata } from 'next';
import '../../../app/globals.css';

export const metadata: Metadata = {
  title: 'Formulário PPP | Opusmed',
  description: 'Perfil Profissiográfico Previdenciário — Opusmed Segurança do Trabalho',
};

export default function PPPLayout({ children }: { children: React.ReactNode }) {
  return children;
}
