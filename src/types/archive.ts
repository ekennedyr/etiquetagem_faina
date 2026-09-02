export type DocCategory = 
  | 'licitacao'
  | 'balancete'
  | 'dispensa'
  | 'outros'
  | 'nao_identificado';

export interface ArchiveItem {
  id: string;
  categoria: DocCategory;
  // Campos específicos
  modalidade?: string; // Para licitação (Pregão Presencial, Eletrônico, etc.)
  subtipoDispensa?: 'DISPENSA DE LICITAÇÃO' | 'INEXIGIBILIDADE'; // Para dispensas/inexigibilidades
  tituloCustomizado?: string; // Para 'outros'
  fundoMunicipal?: string; // FMS, FME, FMAS, Tesouro Geral, etc.
  numeroProcesso?: string; // ex: 015/2023 ou 004
  ano?: string; // ex: 2023
  mes?: string; // ex: Março ou 03
  objeto?: string; // Descrição / Objeto do processo
  observacoes?: string; // Para não identificado ou outros
  volumeInformado?: string; // Digitado manualmente da etiqueta antiga (ex: "Vol 2", "1/3")
  
  // Metadados calculados pelo sistema
  volumeCalculado?: string; // ex: "Vol. 1 de 3"
  sequencial?: number; // 1, 2, 3...
  codigoLocalizacao?: string; // ex: "LIC-2023/001"
}

export interface BatchConfig {
  siglaPilha: string; // Ex: LIC-2023, FMS-2022
  sequencialInicial: number; // Ex: 1
  logoUrl: string; // Base64 ou URL do logo
  nomeInstitucional: string; // "CONTROLADORIA-GERAL DO MUNICÍPIO"
  ressalvaJuridica: string; // Texto legal de ressalva
  mostrarMarcasCorte: boolean; // Linhas guia pontilhadas
}

export const CATEGORIA_LABELS: Record<DocCategory, string> = {
  licitacao: 'Processos Licitatórios',
  balancete: 'Balancetes',
  dispensa: 'Dispensas / Inexigibilidades',
  outros: 'Outros Arquivos',
  nao_identificado: 'Não Identificado',
};

export const FUNDOS_PADRAO = [
  'Prefeitura Municipal / Gabinete',
  'Fundo Municipal de Saúde (FMS)',
  'Fundo Municipal de Educação (FME)',
  'Fundo Municipal de Assistência Social (FMAS)',
  'Fundo Municipal do Meio Ambiente (FMMA)',
  'Tesouro Geral',
  'Câmara Municipal',
];

export const MODALIDADES_LICITACAO = [
  'Pregão Eletrônico',
  'Pregão Presencial',
  'Concorrência Pública',
  'Tomada de Preços',
  'Convite',
  'Credenciamento',
  'Chamamento Público',
  'Leilão',
  'Concurso',
  'Adesão à Ata (Carona)',
];

export const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
