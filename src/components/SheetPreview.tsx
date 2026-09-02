import React from 'react';
import type { ArchiveItem, BatchConfig } from '../types/archive';
import { LabelItem } from './LabelItem';

interface SheetPreviewProps {
  items: ArchiveItem[];
  config: BatchConfig;
  sheetIndex?: number;
}

export const SheetPreview: React.FC<SheetPreviewProps> = ({
  items,
  config,
  sheetIndex = 0,
}) => {
  // Exatamente 5 etiquetas por folha A4
  const sheetItems = items.slice(sheetIndex * 5, (sheetIndex + 1) * 5);
  
  // Criar 5 slots (se tiver menos de 5 itens na última folha, renderiza slots vazios para manter o layout da folha)
  const slots = Array.from({ length: 5 }, (_, i) => sheetItems[i] || null);

  return (
    <div className="sheet-container relative bg-white shadow-2xl mx-auto overflow-hidden print:shadow-none print:m-0 print:border-none print:w-[297mm] print:h-[210mm]"
      style={{
        width: '297mm',
        height: '210mm',
        boxSizing: 'border-box',
        pageBreakAfter: 'always',
        breakAfter: 'page',
      }}
    >
      {/* Informações sutis de rodapé da página para conferência fora da área das etiquetas */}
      <div className="absolute top-2 left-6 text-[8pt] text-slate-600 print:text-slate-600 font-mono flex items-center gap-4">
        <span>PREFEITURA MUNICIPAL DE FAINA - ARQUIVO PÚBLICO</span>
        <span>•</span>
        <span>FOLHA {sheetIndex + 1} (5 ETIQUETAS 50x155mm)</span>
        <span>•</span>
        <span>ESCALA 100% (A4 PAISAGEM)</span>
      </div>

      {/* Conteúdo centralizado com margens exatas:
          Largura total: 297mm -> (297 - 250) / 2 = 23.5mm em cada lado
          Altura total: 210mm -> (210 - 155) / 2 = 27.5mm acima e abaixo
      */}
      <div
        className="absolute flex flex-row items-center justify-center"
        style={{
          left: '23.5mm',
          top: '27.5mm',
          width: '250mm',
          height: '155mm',
        }}
      >
        {/* Marcas de corte guias externas para a folha */}
        {config.mostrarMarcasCorte && (
          <>
            {/* Canto superior esquerdo */}
            <div className="absolute -top-4 -left-4 w-4 h-4 border-r-2 border-b-2 border-black pointer-events-none" />
            {/* Canto superior direito */}
            <div className="absolute -top-4 -right-4 w-4 h-4 border-l-2 border-b-2 border-black pointer-events-none" />
            {/* Canto inferior esquerdo */}
            <div className="absolute -bottom-4 -left-4 w-4 h-4 border-r-2 border-t-2 border-black pointer-events-none" />
            {/* Canto inferior direito */}
            <div className="absolute -bottom-4 -right-4 w-4 h-4 border-l-2 border-t-2 border-black pointer-events-none" />
          </>
        )}

        {/* As 5 etiquetas lado a lado */}
        <div className="flex flex-row border-2 border-black shadow-xs bg-white">
          {slots.map((item, idx) => {
            if (item) {
              return (
                <div key={item.id} className="relative">
                  <LabelItem
                    item={item}
                    config={config}
                    showCutLines={config.mostrarMarcasCorte}
                  />
                  {/* Linha guia de corte pontilhada vertical entre etiquetas */}
                  {config.mostrarMarcasCorte && idx < 4 && (
                    <div className="absolute top-0 right-0 w-[1px] h-full border-r border-dashed border-slate-500 pointer-events-none z-10" />
                  )}
                </div>
              );
            }

            // Espaço vazio pontilhado na folha se a última página tiver menos de 5 itens
            return (
              <div
                key={`empty-${idx}`}
                style={{ width: '50mm', height: '155mm' }}
                className="border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-slate-600 p-2 text-center"
              >
                <span className="text-[7pt] font-medium">Espaço Livre</span>
                <span className="text-[6pt]">50 x 155 mm</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
