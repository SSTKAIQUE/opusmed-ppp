import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { enviarEmailNovaSolicitacao } from '@/lib/email';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  const formData = await request.formData();
  const token    = formData.get('token') as string;
  const dadosPPP = formData.get('dados_ppp') as string;
  const arquivos = formData.getAll('arquivos') as File[];
  const tipos    = formData.getAll('tipos') as string[];

  if (!token || !dadosPPP) {
    return NextResponse.json({ error: 'Dados obrigatórios ausentes.' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: empresa, error: empErr } = await admin
    .from('empresas')
    .select('*')
    .eq('token_link', token)
    .single();

  if (empErr || !empresa) {
    return NextResponse.json({ error: 'Link inválido ou expirado.' }, { status: 404 });
  }

  let dados: Record<string, unknown>;
  try {
    dados = JSON.parse(dadosPPP);
  } catch {
    return NextResponse.json({ error: 'Formato de dados inválido.' }, { status: 400 });
  }

  const { data: solicitacao, error: solErr } = await admin
    .from('solicitacoes_ppp')
    .insert({ empresa_id: empresa.id, status: 'pendente', dados_ppp: dados })
    .select()
    .single();

  if (solErr || !solicitacao) {
    console.error('Erro ao criar solicitação:', solErr);
    return NextResponse.json({ error: 'Erro interno ao salvar solicitação.' }, { status: 500 });
  }

  for (let i = 0; i < arquivos.length; i++) {
    const arquivo = arquivos[i];
    const tipo    = tipos[i] || 'outro';
    if (!arquivo || !arquivo.name) continue;

    const ext         = arquivo.name.split('.').pop() ?? 'bin';
    const storagePath = `${solicitacao.id}/${tipo}-${uuidv4()}.${ext}`;
    const buffer      = await arquivo.arrayBuffer();

    const { error: upErr } = await admin.storage
      .from('ppp-arquivos')
      .upload(storagePath, buffer, {
        contentType: arquivo.type || 'application/octet-stream',
        upsert: false,
      });

    if (upErr) { console.error('Upload error:', upErr); continue; }

    await admin.from('arquivos_ppp').insert({
      solicitacao_id: solicitacao.id,
      tipo,
      nome_original: arquivo.name,
      storage_path:  storagePath,
      tamanho:       arquivo.size,
      mime_type:     arquivo.type || 'application/octet-stream',
    });
  }

  const trabalhadorNome = (dados.trabalhador_nome as string) || 'Não informado';
  await enviarEmailNovaSolicitacao(empresa, solicitacao.id, trabalhadorNome);

  return NextResponse.json({
    message: 'PPP recebido com sucesso.',
    solicitacao_id: solicitacao.id,
  }, { status: 201 });
}
