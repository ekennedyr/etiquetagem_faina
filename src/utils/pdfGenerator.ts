import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generatePdfFromSheets(
  sheetElements: HTMLElement[],
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  if (!sheetElements.length) return;

  // Criar documento jsPDF em A4 Paisagem (297mm x 210mm)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const total = sheetElements.length;

  for (let i = 0; i < total; i++) {
    if (onProgress) {
      onProgress(i + 1, total);
    }

    if (i > 0) {
      pdf.addPage('a4', 'landscape');
    }

    const sheetEl = sheetElements[i];

    // Renderizar o elemento com html2canvas em alta resolução (scale: 3 = ~300 DPI)
    const canvas = await html2canvas(sheetEl, {
      scale: 3,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1200,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // Dimensões exatas da folha A4 em landscape
    pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');
  }

  // Baixar o arquivo PDF
  const filename = `etiquetas-lombada-faina-${new Date().toISOString().slice(0, 10)}.pdf`;
  pdf.save(filename);
}

export function triggerBrowserPrint(): void {
  window.print();
}
