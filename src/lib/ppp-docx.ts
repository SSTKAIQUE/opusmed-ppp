import 'server-only';

import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';

/**
 * Preenche o modelo oficial (src/templates/ppp-modelo.docx) com os dados da solicitação.
 * O layout não é recriado: só entram textos nas células do próprio Word.
 */

type Row = Record<string, string>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dados = Record<string, any>;

const xmlEsc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** replace sem interpretar $ do texto novo */
const sub = (s: string, de: string, para: string) => s.replace(de, () => para);

const data = (v?: string) => (v ? v.split('-').reverse().join('/') : '');
const periodo = (r: Row) => (r.dt_ini ? `${data(r.dt_ini)} a ${r.dt_fim ? data(r.dt_fim) : 'Atual'}` : '');

/** Texto da célula: troca o conteúdo do 1º parágrafo mantendo a formatação do parágrafo. */
function setCell(tc: string, texto: string): string {
  const p = tc.match(/<w:p[ >][\s\S]*?<\/w:p>/);
  if (!p) return tc;
  const par = p[0];
  const pPr = par.match(/<w:pPr>[\s\S]*?<\/w:pPr>/)?.[0] ?? '';
  const rPr = pPr.match(/<w:rPr>[\s\S]*?<\/w:rPr>/)?.[0] ?? '';
  const abre = par.match(/^<w:p[^>]*>/)![0];
  const run = texto
    ? `<w:r>${rPr.replace(/<w:rStyle w:val="Forte"\/>|<w:highlight [^>]*\/>/g, '')}<w:t xml:space="preserve">${xmlEsc(texto)}</w:t></w:r>`
    : '';
  return sub(tc, par, `${abre}${pPr}${run}</w:p>`);
}

const cellsOf = (tr: string) => [...tr.matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)].map((m) => m[0]);

/** Preenche as células de uma linha, na ordem (undefined = não mexe). */
function fillRow(tr: string, valores: (string | undefined)[]): string {
  const cells = cellsOf(tr);
  let out = tr;
  cells.forEach((c, i) => {
    if (valores[i] !== undefined) out = sub(out, c, setCell(c, valores[i]!));
  });
  return out;
}

const semIds = (tr: string) => tr.replace(/ w14:(paraId|textId)="[^"]*"/g, '');

/** Garante `n` linhas de dados a partir de `modelo`, preenchendo cada uma. */
function linhasDe(modelo: string, itens: (string | undefined)[][], minimo: number): string {
  const lista = [...itens];
  while (lista.length < minimo) lista.push([]);
  return lista.map((vals, i) => {
    const base = i === 0 ? modelo : semIds(modelo);
    // limpa o que veio de exemplo no modelo antes de preencher
    const limpo = fillRow(base, cellsOf(base).map(() => ''));
    return fillRow(limpo, vals);
  }).join('');
}

export function preencherPPP(dados: Dados, empresa: { razao_social?: string; cnpj?: string } | null): Buffer {
  const d: Dados = dados ?? {};
  const zip = new PizZip(fs.readFileSync(path.join(process.cwd(), 'src/templates/ppp-modelo.docx')));
  let xml = zip.file('word/document.xml')!.asText();

  const razao = d.empresa_razao_social || empresa?.razao_social || '';
  const sexo = d.trab_sexo === 'Masculino' ? 'M' : d.trab_sexo === 'Feminino' ? 'F' : d.trab_sexo || '';
  const emissao = d.emissao_data ? data(d.emissao_data) : new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  const tabelas = [...xml.matchAll(/<w:tbl>[\s\S]*?<\/w:tbl>/g)];
  const novas: string[] = tabelas.map((m) => m[0]);

  const rowsOf = (t: string) => [...t.matchAll(/<w:tr[ >][\s\S]*?<\/w:tr>/g)].map((m) => m[0]);
  const trocaLinhas = (t: string, antigas: string[], nova: string) => {
    let out = sub(t, antigas[0], nova);
    antigas.slice(1).forEach((a) => { out = sub(out, a, ""); });
    return out;
  };

  // ── Tabela 0: dados administrativos ──
  {
    let t = novas[0];
    const r = rowsOf(t);
    const subst = (idx: number, vals: (string | undefined)[]) => { t = sub(t, r[idx], fillRow(r[idx], vals)); };
    subst(2, [d.empresa_cnpj || empresa?.cnpj || '', razao, d.empresa_cnae || '']);
    subst(4, [d.trab_nome || '', d.trab_br_pdh || 'N.A.', d.trab_cpf || '']);
    subst(6, [data(d.trab_nascimento), sexo, d.trab_matricula_esocial || '', data(d.trab_admissao), d.trab_regime_revezamento || '']);
    subst(9, [data(d.cat_data) || 'N.A', d.cat_numero || 'N.A']);

    // Dados do trabalhador servem de reserva quando a linha de lotação veio só com datas
    const cnpjLot = d.empresa_cnpj || empresa?.cnpj || '';
    const lotBase = ((d.lotacao ?? []) as Row[]).filter((x) => x.dt_ini || x.cnpj || x.setor || x.cargo || x.funcao);
    if (lotBase.length === 0) lotBase.push({ dt_ini: d.trab_admissao || '', dt_fim: d.trab_demissao || '' });
    const lot = lotBase.map((x) => [
      periodo(x), x.cnpj || cnpjLot, x.setor || d.trab_setor || '', x.cargo || d.trab_cargo || '',
      x.funcao || d.trab_funcao || '', x.cbo || d.trab_cbo || '', x.cod_cat || '',
    ]);
    t = trocaLinhas(t, [r[12], r[13]], linhasDe(r[12], lot, 2));

    const prof = ((d.prof ?? []) as Row[]).filter((x) => x.dt_ini || x.atividades)
      .map((x) => [periodo(x), x.atividades || '']);
    t = trocaLinhas(t, [r[16], r[17]], linhasDe(r[16], prof, 2));
    novas[0] = t;
  }

  // ── Tabela 1: registros ambientais e responsáveis ──
  {
    let t = novas[1];
    const r = rowsOf(t);
    const amb = ((d.amb ?? []) as Row[]).filter((x) => x.dt_ini || x.fator).map((x) => {
      const per = periodo(x.dt_ini ? x : { dt_ini: d.trab_admissao || '', dt_fim: x.dt_fim || '' });
      const tipo = (x.tipo || '').split(/[–-]/).pop()?.trim() || '';
      const med = x.med_protecao || '';
      return [per, tipo, x.fator || '', x.intensidade || 'NA', x.tecnica || '', x.epc || '', x.epi || '', x.ca || '', med, med, med];
    });
    if (amb.length === 0) amb.push(['', 'Físico', 'Ausencia de agentes nocivos']);
    t = trocaLinhas(t, [r[4], r[5]], linhasDe(r[4], amb, 2));

    const resp = ((d.resp ?? []) as Row[]).filter((x) => x.dt_ini || x.nome)
      .map((x) => [periodo(x), x.cpf || '', x.crea || '', x.nome || '']);
    t = trocaLinhas(t, [r[9], r[10]], linhasDe(r[9], resp, 2));
    novas[1] = t;
  }

  // ── Tabela 2: emissão, representante, observações e recibo ──
  {
    let t = novas[2];
    const r = rowsOf(t);
    t = sub(t, r[1], fillRow(r[1], [emissao]));
    t = sub(t, r[2], fillRow(r[2], [undefined, d.rep_cpf || '', d.rep_nome || '']));

    // Observações: empresa que forneceu as informações (+ observações livres como item extra)
    let obs = sub(r[5], 'Trigo Arte &amp; Cia Ltda.', xmlEsc(`${razao}.`));
    if (d.observacoes) {
      const ultimo = [...obs.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].pop()![0];
      const extra = semIds(ultimo)
        .replace(/<w:r[ >][\s\S]*<\/w:r>/, () => `<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t xml:space="preserve">${xmlEsc(String(d.observacoes))}</w:t></w:r>`);
      obs = sub(obs, ultimo, ultimo + extra);
    }
    t = sub(t, r[5], obs);

    // Recibo: nome do trabalhador (sem o destaque amarelo) e CPF entre parênteses
    const rec = r[7]
      .replace(/<w:highlight w:val="yellow"\/>/, '')
      .replace('Wallace dos Santos Ramos', () => xmlEsc(d.trab_nome || ''))
      .replace(/<w:t>\(<\/w:t>/, () => `<w:t>(${xmlEsc(d.trab_cpf || '')}</w:t>`);
    t = sub(t, r[7], rec);
    novas[2] = t;
  }

  // Reaplica as tabelas no documento (de trás para frente para não deslocar índices)
  for (let i = 2; i >= 0; i--) {
    const m = tabelas[i];
    xml = xml.slice(0, m.index!) + novas[i] + xml.slice(m.index! + m[0].length);
  }

  zip.file('word/document.xml', xml);
  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}
