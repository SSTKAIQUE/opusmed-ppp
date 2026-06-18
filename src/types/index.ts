// ─── Perfis / Autenticação ───────────────────────────────────────────────────
export type UserRole = 'admin' | 'tecnico';

export interface Profile {
  id: string;
  email: string;
  nome: string;
  role: UserRole;
  created_at: string;
}

// ─── Empresa ──────────────────────────────────────────────────────────────────
export interface Empresa {
  id: string;
  razao_social: string;
  cnpj: string;
  email_contato: string;
  nome_contato: string;
  token_link: string;
  created_at: string;
  updated_at: string;
}

// ─── Solicitação de PPP ───────────────────────────────────────────────────────
export type StatusSolicitacao = 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';

export interface SolicitacaoPPP {
  id: string;
  empresa_id: string;
  empresa?: Empresa;
  status: StatusSolicitacao;
  responsavel_id: string | null;
  responsavel?: Profile;
  dados_ppp: DadosPPP;
  arquivos: ArquivoPPP[];
  created_at: string;
  updated_at: string;
}

// ─── Campos do PPP Oficial ────────────────────────────────────────────────────
export interface DadosPPP {
  // 1. Identificação da Empresa
  empresa_razao_social: string;
  empresa_cnpj: string;
  empresa_cnae: string;
  empresa_grau_risco: string;
  empresa_endereco: string;
  empresa_cep: string;
  empresa_cidade: string;
  empresa_uf: string;

  // 2. Identificação do Trabalhador
  trabalhador_nome: string;
  trabalhador_cpf: string;
  trabalhador_nis_pis_pasep: string;
  trabalhador_data_nascimento: string;
  trabalhador_sexo: string;
  trabalhador_nome_mae: string;
  trabalhador_cbo: string;
  trabalhador_funcao: string;
  trabalhador_setor: string;

  // 3. Histórico de Atividades Profissionais
  historico_atividades: HistoricoAtividade[];

  // 4. Exposição a Agentes Nocivos
  agentes_nocivos: AgenteNocivo[];

  // 5. Condições Ambientais do Trabalho (CAT)
  cat_existencia_cat: boolean;
  cat_numero: string;
  cat_data: string;
  cat_descricao: string;

  // 6. Responsável pelos Registros Ambientais
  resp_nome: string;
  resp_cpf: string;
  resp_cargo: string;
  resp_crea_crm: string;
  resp_data_elaboracao: string;

  // 7. Responsável pelas Monitorações Biológicas
  resp_bio_nome: string;
  resp_bio_cpf: string;
  resp_bio_crm: string;
  resp_bio_data: string;

  // 8. Representante Legal
  rep_legal_nome: string;
  rep_legal_cpf: string;
  rep_legal_cargo: string;

  // Observações gerais
  observacoes: string;
}

export interface HistoricoAtividade {
  id: string;
  periodo_inicio: string;
  periodo_fim: string;
  empresa_nome: string;
  cnpj_empresa: string;
  funcao: string;
  setor: string;
  cbo: string;
  exposicao_agentes: boolean;
  descricao_atividades: string;
}

export interface AgenteNocivo {
  id: string;
  tipo: 'fisico' | 'quimico' | 'biologico' | 'ergonomico';
  codigo_esocial: string;
  descricao: string;
  metodologia_avaliacao: string;
  valor_encontrado: string;
  limite_tolerancia: string;
  tecnica_utilizacao: string;
  epc_eficaz: boolean;
  epi_eficaz: boolean;
  epi_descricao: string;
  epi_ca: string;
  periodo_exposicao_inicio: string;
  periodo_exposicao_fim: string;
}

// ─── Arquivos Anexados ────────────────────────────────────────────────────────
export type TipoArquivo = 'pgr' | 'ltcat' | 'ficha_epi' | 'outro';

export interface ArquivoPPP {
  id: string;
  solicitacao_id: string;
  tipo: TipoArquivo;
  nome_original: string;
  storage_path: string;
  tamanho: number;
  mime_type: string;
  uploaded_at: string;
}

// ─── Filtros do Painel ────────────────────────────────────────────────────────
export interface FiltrosSolicitacoes {
  busca: string;
  status: StatusSolicitacao | 'todos';
  responsavel_id: string | 'todos';
  data_inicio: string;
  data_fim: string;
}

// ─── Stats do Painel ──────────────────────────────────────────────────────────
export interface EstatisticasPainel {
  total: number;
  pendentes: number;
  em_andamento: number;
  concluidos: number;
  cancelados: number;
}
