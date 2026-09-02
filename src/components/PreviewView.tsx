import React, { useState } from 'react';
import type { ArchiveItem, BatchConfig } from '../types/archive';
import { SheetPreview } from './SheetPreview';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Printer,
  FileDown,
} from 'lucide-react';

interface PreviewViewProps {
  items: ArchiveItem[];
  config: BatchConfig;
  onPrint: () => void;
  onGeneratePdf: () => void;
}

export const PreviewView: React.FC<PreviewViewProps> = ({
  items,
  config,
  onPrint,
  onGeneratePdf,
}) => {
  const [zoom, setZoom] = useState<number>(0.85); // 85% para caber confortavelmente em monitores comuns
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');

  const totalPages = Math.max(1, Math.ceil(items.length / 5));

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="w-full flex flex-col items-center gap-4 py-4 print:hidden">
      {/* Barra de Ferramentas do Preview */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-xs flex flex-wrap items-center justify-between gap-4 w-full max-w-5xl">
        {/* Navegação entre Páginas */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={currentPage === 0 || viewMode === 'all'}
            className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-700"
            title="Página Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-bold text-slate-700 select-none">
            {viewMode === 'all'
              ? `Todas as ${totalPages} Folhas`
              : `Folha ${currentPage + 1} de ${totalPages}`}
          </span>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages - 1 || viewMode === 'all'}
            className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-700"
            title="Próxima Página"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-slate-300 mx-1" />

          {/* Alternar entre ver uma folha ou todas */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('single')}
              className={`px-2 py-1 rounded ${
                viewMode === 'single' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Folha a Folha
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`px-2 py-1 rounded ${
                viewMode === 'all' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Ver Todas
            </button>
          </div>
        </div>

        {/* Controles de Zoom */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
            className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700"
            title="Diminuir Zoom"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono font-bold text-slate-700 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>

          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.5, Number((z + 0.1).toFixed(2))))}
            className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700"
            title="Aumentar Zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setZoom(1.0)}
            className="px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700"
            title="Tamanho Real 100%"
          >
            100% Real
          </button>
        </div>

        {/* Ações Rápidas */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onGeneratePdf}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" /> Baixar PDF
          </button>

          <button
            type="button"
            onClick={onPrint}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> Imprimir Agora
          </button>
        </div>
      </div>

      {/* Área de Visualização com Zoom */}
      <div className="w-full flex justify-center overflow-auto p-4 bg-slate-200/60 rounded-2xl border border-slate-300 min-h-[500px]">
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="flex flex-col gap-8 items-center"
        >
          {viewMode === 'single' ? (
            <div className="preview-sheet-box">
              <SheetPreview
                items={items}
                config={config}
                sheetIndex={currentPage}
              />
            </div>
          ) : (
            Array.from({ length: totalPages }, (_, i) => (
              <div key={`sheet-all-${i}`} className="preview-sheet-box">
                <SheetPreview
                  items={items}
                  config={config}
                  sheetIndex={i}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
