import { NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { createAdminClient } from '@/lib/supabase-server';
import { enviarEmailNovaSolicitacao } from '@/lib/email';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { MAX_FILES, MAX_FILE_BYTES, TIPOS_ARQUIVO, detectMime } from '@/lib/upload';
import { validateCPF } from '@/lib/utils';

const MAX_DADOS_BYTES = 200_000;
const MAX_POR_EMPRESA_HORA = 30;

const dadosSchema = z
  .object({
    trab_nome: z.string().trim().min(3, 'Informe o nome do trabalhador.').max(200),
    trab_cpf:  z.string().refine(validateCPF, 'CPF do trabalhador inválido.'),
    rep_cpf:   z.string().max(20).optional(),
  })
  .passthrough();

const tokenSchema = z.string().regex(/^[a-f0-9]{64}$/);

export async function POST(request: Request) {
  if (!rateLimit(`ppp:${clientIp(request)}`, 10, 10 * 60_000)) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde alguns minutos.' }, { status: 429 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 });
  }

  const token    = formData.get('token');
  const dadosPPP = formData.get('dados_ppp');
  const arquivos = formData.getAll('arquivos').filter((f): f is File => f instanceof File && !!f.name);
  const tipos    = formData.getAll('tipos').map(String);

  if (!tokenSchema.safeParse(token).success || typeof dadosPPP !== 'string') {
    return NextResponse.json({ error: 'Dados obrigatórios ausentes.' }, { status: 400 });
  }
  if (formData.get('consentimento') !== 'true') {
    return NextResponse.json({ error: 'É necessário confirmar a ciência sobre o tratamento de dados.' }, { status: 400 });
  }
  if (dadosPPP.length > MAX_DADOS_BYTES) {
    return NextResponse.json({ error: 'Dados muito grandes.' }, { status: 413 });
  }
  if (arquivos.length > MAX_FILES) {
    return NextResponse.json({ error: `Máximo de ${MAX_FILES} arquivos.` }, { status: 400 });
  }

  let dadosRaw: unknown;
  try {
    dadosRaw = JSON.parse(dadosPPP);
  } catch {
    return NextResponse.json({ error: 'Formato de dados inválido.' }, { status: 400 });
  }
  const parsed = dadosSchema.safeParse(dadosRaw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dados inválidos.' }, { status: 400 });
  }
  const dados = parsed.data;

  // Valida os arquivos ANTES de criar qualquer registro
  const prontos: { arquivo: File; tipo: string; ext: string; mime: string; buffer: ArrayBuffer }[] = [];
  for (let i = 0; i < arquivos.length; i++) {
    const arquivo = arquivos[i];
    const tipo = (TIPOS_ARQUIVO as readonly string[]).includes(tipos[i]) ? tipos[i] : 'outro';
    if (arquivo.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: `"${arquivo.name}" excede 10 MB.` }, { status: 413 });
    }
    const ext = (arquivo.name.split('.').pop() ?? '').toLowerCase();
    const buffer = await arquivo.arrayBuffer();
    const mime = detectMime(ext, new Uint8Array(buffer.slice(0, 12)));
    if (!mime) {
      return NextResponse.json(
        { error: `"${arquivo.name}": tipo não permitido (use PDF, JPG, PNG, WEBP, DOC ou DOCX).` },
        { status: 415 }
      );
    }
    prontos.push({ arquivo, tipo, ext, mime, buffer });
  }

  const admin = createAdminClient();

  const { data: empresa, error: empErr } = await admin
    .from('empresas')
    .select('*')
    .eq('token_link', token as string)
    .is('revogado_em', null)
    .single();

  if (empErr || !empresa) {
    return NextResponse.json({ error: 'Link inválido ou expirado.' }, { status: 404 });
  }

  const desde = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await admin
    .from('solicitacoes_ppp')
    .select('id', { count: 'exact', head: true })
    .eq('empresa_id', empresa.id)
    .gte('created_at', desde);
  if ((count ?? 0) >= MAX_POR_EMPRESA_HORA) {
    return NextResponse.json({ error: 'Limite de envios atingido. Tente mais tarde.' }, { status: 429 });
  }

  const { data: solicitacao, error: solErr } = await admin
    .from('solicitacoes_ppp')
    .insert({
      empresa_id: empresa.id,
      status: 'pendente',
      dados_ppp: { ...dados, consentimento_lgpd: { aceito: true, em: new Date().toISOString() } },
    })
    .select()
    .single();

  if (solErr || !solicitacao) {
    console.error('Erro ao criar solicitação:', solErr);
    return NextResponse.json({ error: 'Erro interno ao salvar solicitação.' }, { status: 500 });
  }

  // Upload com rollback: se algo falhar, nada fica pela metade
  const enviados: string[] = [];
  const rollback = async () => {
    if (enviados.length) await admin.storage.from('ppp-arquivos').remove(enviados);
    await admin.from('solicitacoes_ppp').delete().eq('id', solicitacao.id);
  };

  for (const p of prontos) {
    const storagePath = `${solicitacao.id}/${p.tipo}-${uuidv4()}.${p.ext}`;
    const { error: upErr } = await admin.storage
      .from('ppp-arquivos')
      .upload(storagePath, p.buffer, { contentType: p.mime, upsert: false });
    if (upErr) {
      console.error('Upload error:', upErr);
      await rollback();
      return NextResponse.json({ error: 'Falha ao enviar um dos arquivos. Tente novamente.' }, { status: 502 });
    }
    enviados.push(storagePath);

    const { error: insErr } = await admin.from('arquivos_ppp').insert({
      solicitacao_id: solicitacao.id,
      tipo: p.tipo,
      nome_original: p.arquivo.name.slice(0, 200),
      storage_path: storagePath,
      tamanho: p.arquivo.size,
      mime_type: p.mime,
    });
    if (insErr) {
      console.error('Erro ao registrar arquivo:', insErr);
      await rollback();
      return NextResponse.json({ error: 'Erro interno ao registrar arquivo.' }, { status: 500 });
    }
  }

  const mail = await enviarEmailNovaSolicitacao(empresa, solicitacao.id, dados.trab_nome);
  if (!mail.success) console.error('Aviso: e-mail à equipe não enviado:', mail.error);

  return NextResponse.json(
    { message: 'PPP recebido com sucesso.', solicitacao_id: solicitacao.id },
    { status: 201 }
  );
}
