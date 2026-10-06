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
    .select('*')
    .eq('token_link', token)
    .single();

  if (error || !empresa || empresa.revogado_em) {
    return NextResponse.json({ error: 'Link inválido ou expirado.' }, { status: 404 });
  }

  return NextResponse.json({ empresa: { id: empresa.id, razao_social: empresa.razao_social, cnpj: empresa.cnpj } });
}
