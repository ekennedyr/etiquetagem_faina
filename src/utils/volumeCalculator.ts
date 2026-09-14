import type { ArchiveItem, BatchConfig } from '../types/archive';
import { formatMesNumeral } from './formatters';

function normalize(val?: string): string {
  return (val || '').trim().toLowerCase();
}

/**
 * Normaliza o número do processo desconsiderando zeros à esquerda (ex: "05" vira "5", "005" vira "5")
 * para que processos digitados como 5 e 05 sejam agrupados na mesma contagem de volume.
 */
export function normalizeProcesso(val?: string): string {
  if (!val) return '';
  const clean = val.trim().toLowerCase();
  // Remove zeros à esquerda de sequências numéricas (ex: "05" -> "5", "05/2023" -> "5/2023")
  return clean.replace(/\b0+(\d+)\b/g, '$1');
}

/**
 * Calcula a chave de agrupamento de volumes com base na categoria e campos do item.
 */
export function getGroupingKey(item: ArchiveItem): string {
  switch (item.categoria) {
    case 'licitacao': {
      const num = normalizeProcesso(item.numeroProcesso);
      const ano = normalize(item.ano);
      if (!num && !ano) return `single_${item.id}`;
      return `lic_${num}_${ano}`;
    }
    case 'balancete': {
      const fundo = normalize(item.fundoMunicipal);
      const mes = formatMesNumeral(item.mes);
      const ano = normalize(item.ano);
      if (!fundo && mes === '—' && !ano) return `single_${item.id}`;
      return `bal_${fundo}_${mes}_${ano}`;
    }
    case 'dispensa': {
      const subtipo = normalize(item.subtipoDispensa || 'dispensa');
      const num = normalizeProcesso(item.numeroProcesso);
      const ano = normalize(item.ano);
      if (!num && !ano) return `single_${item.id}`;
      return `disp_${subtipo}_${num}_${ano}`;
    }
    case 'outros': {
      const tit = normalize(item.tituloCustomizado);
      const ano = normalize(item.ano);
      const num = normalizeProcesso(item.numeroProcesso);
      if (!tit && !ano && !num) return `single_${item.id}`;
      return `out_${tit}_${num}_${ano}`;
    }
    case 'nao_identificado': {
      return `single_${item.id}`;
    }
    default:
      return `single_${item.id}`;
  }
}

/**
 * Processa a lista de itens, atribuindo os números sequenciais de localização
 * e calculando os volumes automaticamente por agrupamento.
 */
export function processArchiveItems(items: ArchiveItem[], config: BatchConfig): ArchiveItem[] {
  // 1. Agrupar itens para contagem total de cada grupo
  const groupCounts = new Map<string, number>();
  const groupKeys = items.map((item) => {
    const key = getGroupingKey(item);
    groupCounts.set(key, (groupCounts.get(key) || 0) + 1);
    return key;
  });

  // 2. Rastrear o índice atual de cada grupo conforme percorremos
  const groupIndices = new Map<string, number>();

  return items.map((item, index) => {
    const key = groupKeys[index];
    const totalInGroup = groupCounts.get(key) || 1;
    const currentIndex = (groupIndices.get(key) || 0) + 1;
    groupIndices.set(key, currentIndex);

    // Formatar volume calculado
    let volumeCalculado = '';
    if (key.startsWith('single_') && totalInGroup === 1) {
      volumeCalculado = 'Vol. Único';
    } else {
      volumeCalculado = `Vol. ${currentIndex} de ${totalInGroup}`;
    }

    // Número sequencial da pilha
    const seqNum = (config.sequencialInicial || 1) + index;
    const padSeq = String(seqNum).padStart(3, '0');
    const sigla = (config.siglaPilha || 'DOC').trim().toUpperCase();
    const codigoLocalizacao = `${sigla}/${padSeq}`;

    return {
      ...item,
      sequencial: seqNum,
      codigoLocalizacao,
      volumeCalculado,
    };
  });
}
