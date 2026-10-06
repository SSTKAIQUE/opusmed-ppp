import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase-server';
import { requireUser, readJson } from '@/lib/auth';
import { onlyDigits, validateCNPJ } from '@/lib/utils';

const schema = z.object({
  razao_social:  z.string().trim().min(2).max(200),
  cnpj:          z.string().refine(validateCNPJ, 'CNPJ inválido.'),
  email_contato: z.string().trim().toLowerCase().email('E-mail inválido.').max(200),
  nome_contato:  z.string().trim().min(2).max(120),
});

function formatCNPJ(d: string) {
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Dados inválidos.' },
      { status: 400 }
    );
  }

  // CNPJ sempre gravado no mesmo formato (evita duplicata por pontuação)
  const cnpj = formatCNPJ(onlyDigits(parsed.data.cnpj));

  const admin = createAdminClient();
  const { data: empresa, error } = await admin
    .from('empresas')
    .insert({ ...parsed.data, cnpj })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Já existe uma empresa com este CNPJ.' }, { status: 409 });
    }
    console.error('Erro ao criar empresa:', error);
    return NextResponse.json({ error: 'Erro interno ao criar empresa.' }, { status: 500 });
  }

  return NextResponse.json({ empresa }, { status: 201 });
}
