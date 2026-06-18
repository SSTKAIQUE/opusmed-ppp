import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase-server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const body = await request.json();
  const { status, responsavel_id } = body;

  const VALID_STATUS = ['pendente', 'em_andamento', 'concluido', 'cancelado'];
  if (status && !VALID_STATUS.includes(status)) {
    return NextResponse.json({ error: 'Status inválido.' }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (status !== undefined)         update.status         = status;
  if (responsavel_id !== undefined) update.responsavel_id = responsavel_id;

  const admin = createAdminClient();
  const { error } = await admin
    .from('solicitacoes_ppp')
    .update(update)
    .eq('id', id);

  if (error) {
    console.error('Erro ao atualizar solicitação:', error);
    return NextResponse.json({ error: 'Erro ao atualizar.' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Atualizado com sucesso.' });
}
