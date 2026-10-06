import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase-server';
import { requireUser, readJson } from '@/lib/auth';

const idSchema = z.string().uuid();
const bodySchema = z.object({
  status: z.enum(['pendente', 'em_andamento', 'concluido', 'cancelado']).optional(),
  responsavel_id: z.string().uuid().nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const { id } = await params;
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (parsed.data.status !== undefined)         update.status         = parsed.data.status;
  if (parsed.data.responsavel_id !== undefined) update.responsavel_id = parsed.data.responsavel_id;
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nada para atualizar.' }, { status: 400 });
  }

  const admin = createAdminClient();

  if (update.responsavel_id) {
    const { data: resp } = await admin
      .from('profiles').select('id').eq('id', update.responsavel_id as string).maybeSingle();
    if (!resp) return NextResponse.json({ error: 'Responsável não encontrado.' }, { status: 400 });
  }

  const { error } = await admin.from('solicitacoes_ppp').update(update).eq('id', id);
  if (error) {
    console.error('Erro ao atualizar solicitação:', error);
    return NextResponse.json({ error: 'Erro ao atualizar.' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Atualizado com sucesso.' });
}
