import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generatePdfFromSheets(
  sheetElements: HTMLElement[],
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  if (!sheetElements.length) {
    throw new Error('Nenhuma folha encontrada para gerar PDF.');
  }

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

    // Aguardar imagens estarem completamente carregadas
    const images = Array.from(sheetEl.querySelectorAll('img'));
    await Promise.all(
      images.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
        });
      })
    );

    // Renderizar o elemento com html2canvas em alta resolução
    const canvas = await html2canvas(sheetEl, {
      scale: 2, // 2x de densidade de pixels para alta nitidez e performance estável
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: sheetEl.offsetWidth,
      height: sheetEl.offsetHeight,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // Dimensões exatas da folha A4 em landscape (297mm x 210mm)
    pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');
  }

  // Baixar o arquivo PDF utilizando Blob explícito (garante extensão .pdf válida e sem corrupção de DataURI)
  const filename = `etiquetas-lombada-faina-${new Date().toISOString().slice(0, 10)}.pdf`;
  const pdfBlob = pdf.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);

  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  // Limpeza do Blob da memória após o download
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  }, 3000);
}

export function triggerBrowserPrint(): void {
  window.print();
}
