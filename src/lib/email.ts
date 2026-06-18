import { Resend } from 'resend';
import type { Empresa, SolicitacaoPPP } from '@/types';
import { formatDateTime } from './utils';

const EQUIPE_EMAILS = [
  'seguranca@opus.med.br',
  'seguranca2@opus.med.br',
  'seguranca3@opus.med.br',
];

const FROM_EMAIL = 'noreply@opus.med.br'; // configure domínio verificado no Resend

// ─── Template HTML ────────────────────────────────────────────────────────────
function templateBase(conteudo: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Opusmed SST</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#1F4E79;padding:28px 40px;">
              <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Opusmed</p>
              <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">Segurança do Trabalho</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              ${conteudo}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                Opusmed Segurança do Trabalho · CNPJ 27.389.598/0001-09<br/>
                seguranca@opus.med.br
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Email: Nova Solicitação PPP recebida ─────────────────────────────────────
export async function enviarEmailNovaSolicitacao(
  empresa: Empresa,
  solicitacaoId: string,
  trabalhadorNome: string
): Promise<{ success: boolean; error?: string }> {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/solicitacoes/${solicitacaoId}`;

  const corpo = `
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;font-weight:700;">
      📋 Nova solicitação de PPP recebida
    </h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;">
      ${formatDateTime(new Date().toISOString())}
    </p>

    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:28px;">
      <tr>
        <td style="padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px 6px 0 0;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Empresa</td>
        <td style="padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-left:none;border-radius:0 6px 0 0;color:#0f172a;font-size:14px;font-weight:600;">${empresa.razao_social}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;border:1px solid #e2e8f0;border-top:none;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">CNPJ</td>
        <td style="padding:10px 14px;border:1px solid #e2e8f0;border-top:none;border-left:none;color:#0f172a;font-size:14px;">${empresa.cnpj}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-top:none;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Trabalhador</td>
        <td style="padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-left:none;color:#0f172a;font-size:14px;">${trabalhadorNome}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 0 6px;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Contato</td>
        <td style="padding:10px 14px;border:1px solid #e2e8f0;border-top:none;border-left:none;border-radius:0 0 6px 0;color:#0f172a;font-size:14px;">${empresa.nome_contato} — ${empresa.email_contato}</td>
      </tr>
    </table>

    <a href="${dashboardUrl}"
       style="display:inline-block;background:#1F4E79;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
      Ver no painel →
    </a>
  `;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: FROM_EMAIL,
      to: EQUIPE_EMAILS,
      subject: `[Opusmed PPP] Nova solicitação — ${empresa.razao_social}`,
      html: templateBase(corpo),
    });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('Erro ao enviar e-mail:', message);
    return { success: false, error: message };
  }
}

// ─── Email: Link de acesso enviado para a empresa ─────────────────────────────
export async function enviarLinkParaEmpresa(
  empresa: Empresa,
  link: string
): Promise<{ success: boolean; error?: string }> {
  const corpo = `
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;font-weight:700;">
      Olá, ${empresa.nome_contato}!
    </h2>
    <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
      A <strong>Opusmed Segurança do Trabalho</strong> enviou um link exclusivo para que você preencha o <strong>Perfil Profissiográfico Previdenciário (PPP)</strong> dos trabalhadores de <em>${empresa.razao_social}</em>.
    </p>

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:20px;margin-bottom:28px;">
      <p style="margin:0 0 8px;color:#1e3a8a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Seu link exclusivo</p>
      <p style="margin:0;color:#1d4ed8;font-size:14px;word-break:break-all;">${link}</p>
    </div>

    <a href="${link}"
       style="display:inline-block;background:#1F4E79;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;margin-bottom:28px;">
      Preencher PPP agora →
    </a>

    <div style="background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:16px;">
      <p style="margin:0;color:#713f12;font-size:13px;line-height:1.5;">
        ⚠️ <strong>Atenção:</strong> Este link é exclusivo para a sua empresa. Tenha em mãos o PGR, LTCAT e as Fichas de EPI para fazer o upload durante o preenchimento.
      </p>
    </div>
  `;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: FROM_EMAIL,
      to: empresa.email_contato,
      cc: EQUIPE_EMAILS,
      subject: `Opusmed — Acesse o formulário de PPP da ${empresa.razao_social}`,
      html: templateBase(corpo),
    });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return { success: false, error: message };
  }
}
