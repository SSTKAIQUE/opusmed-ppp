import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase-server';
import { enviarLinkParaEmpresa } from '@/lib/email';
import { generatePPPLink } from '@/lib/utils';

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const { empresa_id } = await request.json();
  if (!empresa_id) return NextResponse.json({ error: 'empresa_id ausente.' }, { status: 400 });

  const admin = createAdminClient();
  const { data: empresa, error } = await admin
    .from('empresas')
    .select('*')
    .eq('id', empresa_id)
    .single();

  if (error || !empresa) {
    return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 });
  }

  const link = generatePPPLink(empresa.token_link);
  const { success, error: emailError } = await enviarLinkParaEmpresa(empresa, link);

  if (!success) {
    return NextResponse.json({ error: emailError || 'Erro ao enviar e-mail.' }, { status: 500 });
  }

  return NextResponse.json({ message: 'E-mail enviado com sucesso.', link });
}
