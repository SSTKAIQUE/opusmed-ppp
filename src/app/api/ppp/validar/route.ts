import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { clientIp, rateLimit } from '@/lib/rate-limit';

export async function GET(request: Request) {
  if (!rateLimit(`validar:${clientIp(request)}`, 30, 10 * 60_000)) {
    return NextResponse.json({ error: 'Link inválido ou expirado.' }, { status: 404 });
  }

  const token = new URL(request.url).searchParams.get('token');
  if (!token || !/^[A-Za-z0-9-]{16,128}$/.test(token)) {
    return NextResponse.json({ error: 'Link inválido ou expirado.' }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data: empresa, error } = await admin
    .from('empresas')
    .select('id, razao_social, cnpj')
    .eq('token_link', token)
    .is('revogado_em', null)
    .single();

  if (error || !empresa) {
    return NextResponse.json({ error: 'Link inválido ou expirado.' }, { status: 404 });
  }

  return NextResponse.json({ empresa });
}
