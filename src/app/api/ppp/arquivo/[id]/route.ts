import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase-server';
import { requireUser } from '@/lib/auth';

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

  const admin = createAdminClient();
  const { data: arquivo, error } = await admin
    .from('arquivos_ppp')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !arquivo) {
    return NextResponse.json({ error: 'Arquivo não encontrado.' }, { status: 404 });
  }

  const { data: signedUrl, error: urlError } = await admin.storage
    .from('ppp-arquivos')
    .createSignedUrl(arquivo.storage_path, 60, { download: arquivo.nome_original });

  if (urlError || !signedUrl) {
    return NextResponse.json({ error: 'Erro ao gerar link de download.' }, { status: 500 });
  }

  // Trilha de auditoria (LGPD): quem baixou qual arquivo
  await admin.from('auditoria_acessos').insert({
    user_id: auth.user.id,
    acao: 'download_arquivo',
    recurso: 'arquivos_ppp',
    recurso_id: arquivo.id,
  });

  return NextResponse.redirect(signedUrl.signedUrl);
}
