import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase-server';
import { enviarLinkParaEmpresa } from '@/lib/email';
import { generatePPPLink } from '@/lib/utils';
import { requireUser, readJson } from '@/lib/auth';

const schema = z.object({ empresa_id: z.string().uuid() });

export async function POST(request: Request) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ error: 'empresa_id inválido.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: empresa, error } = await admin
    .from('empresas')
    .select('*')
    .eq('id', parsed.data.empresa_id)
    .single();

  if (error || !empresa) {
    return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 });
  }

  const link = generatePPPLink(empresa.token_link);
  const { success, error: emailError } = await enviarLinkParaEmpresa(empresa, link);

  if (!success) {
    console.error('Falha ao enviar link:', emailError);
    return NextResponse.json({ error: 'Não foi possível enviar o e-mail. Tente novamente.' }, { status: 502 });
  }

  return NextResponse.json({ message: 'E-mail enviado com sucesso.', link });
}
