import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase-server';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const body = await request.json();
  const campos = ['status', 'responsavel_id'];
  const update: Record<string, string | null> = {};

  for (const campo of campos) {
    if (body[campo] !== undefined) update[campo] = body[campo] || null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo válido enviado.' }, { status: 400 });
  }

  update.updated_at = new Date().toISOString();

  const admin = createAdminClient();
  const { data: solicitacao, error } = await admin
    .from('solicitacoes_ppp')
    .update(update)
    .eq('id', params.id)
    .select(`*, empresa:empresas(*), responsavel:profiles(id, nome, email, role)`)
    .single();

  if (error) {
    console.error('Erro ao atualizar solicitação:', error);
    return NextResponse.json({ error: 'Erro ao atualizar.' }, { status: 500 });
  }

  return NextResponse.json({ solicitacao });
}
