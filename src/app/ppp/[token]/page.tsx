import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase-server';
import PPPFormClient from '@/components/ppp/PPPFormClient';
import type { Empresa } from '@/types';

export const metadata = { title: 'Formulário PPP — Opusmed' };

export default async function PPPPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: empresa } = await supabase
    .from('empresas')
    .select('*')
    .eq('token_link', token)
    .single();

  if (!empresa) notFound();

  return <PPPFormClient empresa={empresa as Empresa} token={token} />;
}
