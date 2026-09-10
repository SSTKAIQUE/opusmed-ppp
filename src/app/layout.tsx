import type { Metadata } from 'next';
import { Inter, Source_Serif_4, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const sourceSerif = Source_Serif_4({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-source-serif' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-plex-mono' });

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
    <html lang="pt-BR" className={`${inter.variable} ${sourceSerif.variable} ${plexMono.variable}`}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
