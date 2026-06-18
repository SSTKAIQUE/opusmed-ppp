import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token ausente.' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: empresa, error } = await admin
    .from('empresas')
    .select('id, razao_social, cnpj')
    .eq('token_link', token)
    .single();

  if (error || !empresa) {
    return NextResponse.json({ error: 'Link inválido ou expirado.' }, { status: 404 });
  }

  return NextResponse.json({ empresa });
}
