import React from 'react';
import type { BatchConfig } from '../types/archive';
import {
  Printer,
  FileDown,
  Table,
  Eye,
  Info,
  Building2,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'spreadsheet' | 'preview' | 'mobile';
  setActiveTab: (tab: 'spreadsheet' | 'preview' | 'mobile') => void;
  onPrint: () => void;
  onGeneratePdf: () => void;
  isGeneratingPdf: boolean;
  pdfProgress: { current: number; total: number } | null;
  config: BatchConfig;
  totalItems: number;
  syncStatus?: 'connected' | 'connecting' | 'offline';
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onPrint,
  onGeneratePdf,
  isGeneratingPdf,
  pdfProgress,
  config,
  totalItems,
  syncStatus = 'connected',
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md print:hidden select-none">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Identificação Institucional */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 p-1 flex items-center justify-center border border-white/20">
            {config.logoUrl ? (
              <img
                src={config.logoUrl}
                alt="Brasão de Faina"
                className="w-full h-full object-contain"
              />
            ) : (
              <Building2 className="w-6 h-6 text-amber-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-white">
                Prefeitura Municipal de Faina
              </h1>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-1.5 py-0.5 rounded">
                CGM
              </span>
              {/* Badge de sincronização em tempo real */}
              <div
                title={
                  syncStatus === 'connected'
                    ? 'Sincronizado em tempo real com celular e outros dispositivos'
                    : syncStatus === 'connecting'
                    ? 'Conectando ao servidor em tempo real...'
                    : 'Modo Offline (Salvo localmente)'
                }
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                  syncStatus === 'connected'
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-600/40'
                    : syncStatus === 'connecting'
                    ? 'bg-amber-950/60 text-amber-400 border-amber-600/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    syncStatus === 'connected'
                      ? 'bg-emerald-400 animate-pulse'
                      : syncStatus === 'connecting'
                      ? 'bg-amber-400 animate-ping'
                      : 'bg-slate-500'
                  }`}
                />
                <span className="hidden sm:inline">
                  {syncStatus === 'connected'
                    ? 'Tempo Real'
                    : syncStatus === 'connecting'
                    ? 'Conectando...'
                    : 'Offline'}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Etiquetagem de Lombadas para Pastas AZ • Padrão A4 Paisagem (50x155mm)
            </p>
          </div>
        </div>

        {/* Alternância de Abas: Planilha vs Pré-visualização vs Formulário Mobile */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab('spreadsheet')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'spreadsheet'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Planilha</span>
            <span className="bg-slate-900/60 text-slate-300 px-1.5 py-0.2 rounded text-[10px]">
              {totalItems}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'preview'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Pré-visualização</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mobile')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'mobile'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40'
            }`}
          >
            <span className="text-sm">📱</span>
            <span>Formulário Mobile</span>
          </button>
        </div>

        {/* Ações de Impressão e PDF */}
        <div className="flex items-center gap-2.5">
          {/* Botão de Download Direto em PDF */}
          <button
            type="button"
            onClick={onGeneratePdf}
            disabled={isGeneratingPdf || totalItems === 0}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-700 transition-all shadow-xs"
          >
            <FileDown className="w-4 h-4 text-amber-400" />
            <span>
              {isGeneratingPdf
                ? pdfProgress
                  ? `Gerando PDF (${pdfProgress.current}/${pdfProgress.total})...`
                  : 'Processando...'
                : 'Baixar PDF'}
            </span>
          </button>

          {/* Botão Principal de Impressão Direta em Tamanho Real */}
          <button
            type="button"
            onClick={onPrint}
            disabled={totalItems === 0}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs px-4 py-2 rounded-xl shadow-md transition-all active:scale-98"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Imprimir em Tamanho Real</span>
          </button>
        </div>
      </div>

      {/* Faixa Informativa de Impressão com Escala 100% */}
      <div className="bg-[#0B3A5E] text-slate-200 px-4 py-1 text-[11px] font-medium flex items-center justify-between border-t border-blue-900/50">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
            <span>
              <strong>Dica de Impressão Física:</strong> Na janela do navegador/impressora, marque <strong>A4</strong>, orientação <strong>Paisagem</strong>, margens <strong>Nenhuma</strong> e escala <strong>100% (Tamanho Real)</strong> para 5x15,5cm milimétricos exatos.
            </span>
          </div>
          <span className="hidden md:inline-block text-[10px] text-blue-200">
            5 etiquetas por folha A4
          </span>
        </div>
      </div>
    </header>
  );
};
