import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase-server';
import { requireUser } from '@/lib/auth';
import { preencherPPP } from '@/lib/ppp-docx';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
  }

  const { data } = await createAdminClient()
    .from('solicitacoes_ppp')
    .select('dados_ppp, empresa:empresas(razao_social, cnpj)')
    .eq('id', id)
    .maybeSingle();
  if (!data) return NextResponse.json({ error: 'Solicitação não encontrada.' }, { status: 404 });

  const empresa = (Array.isArray(data.empresa) ? data.empresa[0] : data.empresa) ?? null;
  const buffer = preencherPPP(data.dados_ppp ?? {}, empresa);

  const nome = String((data.dados_ppp as { trab_nome?: string } | null)?.trab_nome || 'Trabalhador')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w\- ]+/g, '').trim() || 'Trabalhador';

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="PPP - ${nome}.docx"`,
      'Cache-Control': 'no-store',
    },
  });
}
