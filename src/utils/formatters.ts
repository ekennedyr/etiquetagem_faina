/**
 * Utilitário para formatação de meses em numeral (01 a 12).
 * Converte meses digitados por extenso ("Janeiro", "Fevereiro", etc.)
 * ou abreviados ("Jan", "Fev") para seu numeral de 2 dígitos.
 */
export function formatMesNumeral(mes?: string): string {
  if (!mes) return '—';
  const trimmed = mes.trim().toLowerCase();

  const mapaMeses: Record<string, string> = {
    janeiro: '01',
    jan: '01',
    '01': '01',
    '1': '01',
    fevereiro: '02',
    fev: '02',
    '02': '02',
    '2': '02',
    março: '03',
    marco: '03',
    mar: '03',
    '03': '03',
    '3': '03',
    abril: '04',
    abr: '04',
    '04': '04',
    '4': '04',
    maio: '05',
    mai: '05',
    '05': '05',
    '5': '05',
    junho: '06',
    jun: '06',
    '06': '06',
    '6': '06',
    julho: '07',
    jul: '07',
    '07': '07',
    '7': '07',
    agosto: '08',
    ago: '08',
    '08': '08',
    '8': '08',
    setembro: '09',
    set: '09',
    '09': '09',
    '9': '09',
    outubro: '10',
    out: '10',
    '10': '10',
    novembro: '11',
    nov: '11',
    '11': '11',
    dezembro: '12',
    dez: '12',
    '12': '12',
  };

  if (mapaMeses[trimmed]) {
    return mapaMeses[trimmed];
  }

  // Se for número direto de 1 a 12
  const num = parseInt(trimmed, 10);
  if (!isNaN(num) && num >= 1 && num <= 12) {
    return String(num).padStart(2, '0');
  }

  return mes.toUpperCase();
}
