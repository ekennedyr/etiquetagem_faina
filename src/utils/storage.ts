import type { ArchiveItem, BatchConfig } from '../types/archive';

export const STORAGE_KEY_ITEMS = 'etiquetagem_faina_items';
export const STORAGE_KEY_CONFIG = 'etiquetagem_faina_config';

export const DEFAULT_BATCH_CONFIG: BatchConfig = {
  siglaPilha: 'LIC-2023',
  sequencialInicial: 1,
  logoUrl: '/logo-faina.png',
  nomeInstitucional: 'CONTROLADORIA-GERAL DO MUNICÍPIO DE FAINA',
  ressalvaJuridica: 'Etiquetagem gerada através de esforços da CGM para organização do arquivo da administração 2021/2024. O conteúdo no interior dessa pasta não foi verificado.',
  mostrarMarcasCorte: true,
};

export const SAMPLE_ITEMS: ArchiveItem[] = [
  {
    id: 'sample-1',
    categoria: 'licitacao',
    modalidade: 'Pregão Eletrônico',
    fundoMunicipal: 'Fundo Municipal de Saúde (FMS)',
    numeroProcesso: '015/2023',
    ano: '2023',
    objeto: 'Registro de preços para eventual aquisição futura de medicamentos essenciais e insumos hospitalares para a rede municipal.',
    volumeInformado: 'Vol. 1',
  },
  {
    id: 'sample-2',
    categoria: 'licitacao',
    modalidade: 'Pregão Eletrônico',
    fundoMunicipal: 'Fundo Municipal de Saúde (FMS)',
    numeroProcesso: '015/2023',
    ano: '2023',
    objeto: 'Registro de preços para eventual aquisição futura de medicamentos essenciais e insumos hospitalares para a rede municipal.',
    volumeInformado: 'Vol. 2',
  },
  {
    id: 'sample-3',
    categoria: 'balancete',
    fundoMunicipal: 'Fundo Municipal de Saúde (FMS)',
    mes: 'Março',
    ano: '2022',
    objeto: 'Prestação de contas contábil e documental do Fundo Municipal de Saúde referente ao mês de março/2022.',
    volumeInformado: '1/2',
  },
  {
    id: 'sample-4',
    categoria: 'balancete',
    fundoMunicipal: 'Fundo Municipal de Saúde (FMS)',
    mes: 'Março',
    ano: '2022',
    objeto: 'Prestação de contas contábil e documental do Fundo Municipal de Saúde referente ao mês de março/2022.',
    volumeInformado: '2/2',
  },
  {
    id: 'sample-5',
    categoria: 'dispensa',
    subtipoDispensa: 'DISPENSA DE LICITAÇÃO',
    fundoMunicipal: 'Fundo Municipal de Educação (FME)',
    numeroProcesso: '004/2022',
    ano: '2022',
    objeto: 'Contratação emergencial de serviços de manutenção preventiva e corretiva com fornecimento de peças para a frota do transporte escolar.',
    volumeInformado: 'Vol. Único',
  }
];

export function loadStoredItems(): ArchiveItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ITEMS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Falha ao carregar itens do localStorage', e);
  }
  return SAMPLE_ITEMS;
}

export function saveStoredItems(items: ArchiveItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
  } catch (e) {
    console.error('Falha ao salvar itens no localStorage', e);
  }
}

export function loadStoredConfig(): BatchConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      const config = { ...DEFAULT_BATCH_CONFIG, ...parsed };
      if (!config.nomeInstitucional || config.nomeInstitucional === 'CONTROLADORIA-GERAL DO MUNICÍPIO') {
        config.nomeInstitucional = 'CONTROLADORIA-GERAL DO MUNICÍPIO DE FAINA';
      }
      return config;
    }
  } catch (e) {
    console.error('Falha ao carregar config do localStorage', e);
  }
  return DEFAULT_BATCH_CONFIG;
}

export function saveStoredConfig(config: BatchConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Falha ao salvar config no localStorage', e);
  }
}

export function exportDataAsJson(items: ArchiveItem[], config: BatchConfig): void {
  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    config,
    items,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `etiquetas-faina-${config.siglaPilha || 'lote'}-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
