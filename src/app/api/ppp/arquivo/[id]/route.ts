import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase-server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

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
    .createSignedUrl(arquivo.storage_path, 60);

  if (urlError || !signedUrl) {
    return NextResponse.json({ error: 'Erro ao gerar link de download.' }, { status: 500 });
  }

  return NextResponse.redirect(signedUrl.signedUrl);
}
