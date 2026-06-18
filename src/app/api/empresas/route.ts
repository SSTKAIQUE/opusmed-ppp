import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const body = await request.json();
  const { razao_social, cnpj, email_contato, nome_contato } = body;

  if (!razao_social || !cnpj || !email_contato || !nome_contato) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: existente } = await admin
    .from('empresas')
    .select('id')
    .eq('cnpj', cnpj)
    .maybeSingle();

  if (existente) {
    return NextResponse.json({ error: 'Já existe uma empresa com este CNPJ.' }, { status: 409 });
  }

  const { data: empresa, error } = await admin
    .from('empresas')
    .insert({ razao_social, cnpj, email_contato, nome_contato })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar empresa:', error);
    return NextResponse.json({ error: 'Erro interno ao criar empresa.' }, { status: 500 });
  }

  return NextResponse.json({ empresa }, { status: 201 });
}
