import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Opusmed SST — Gestão de PPP',
    template: '%s | Opusmed SST',
  },
  description: 'Sistema de Gestão de Perfil Profissiográfico Previdenciário — Opusmed Segurança do Trabalho',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
