import React, { useRef } from 'react';
import type { BatchConfig } from '../types/archive';
import {
  FolderArchive,
  Image as ImageIcon,
  RotateCcw,
  Plus,
  Scissors,
  Sparkles,
  Trash2,
  Download,
} from 'lucide-react';

interface ConfigBarProps {
  config: BatchConfig;
  onChangeConfig: (newConfig: Partial<BatchConfig>) => void;
  onAddItem: () => void;
  onLoadSamples: () => void;
  onClearAll: () => void;
  onOpenImportExport: () => void;
  onOpenConnectMobile?: () => void;
  totalItems: number;
  totalPages: number;
}

export const ConfigBar: React.FC<ConfigBarProps> = ({
  config,
  onChangeConfig,
  onAddItem,
  onLoadSamples,
  onClearAll,
  onOpenImportExport,
  onOpenConnectMobile,
  totalItems,
  totalPages,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        onChangeConfig({ logoUrl: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetLogo = () => {
    onChangeConfig({ logoUrl: '/logo-faina.png' });
  };

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-3 shadow-xs print:hidden">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Lado Esquerdo: Configurações do Lote / Pilha */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sigla da Pilha */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
            <FolderArchive className="w-4 h-4 text-blue-700" />
            <div>
              <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                Sigla da Pilha / Lote
              </span>
              <input
                type="text"
                value={config.siglaPilha}
                onChange={(e) => onChangeConfig({ siglaPilha: e.target.value.toUpperCase() })}
                placeholder="Ex: LIC-2023"
                className="w-24 text-xs font-bold text-slate-800 bg-transparent outline-none uppercase"
              />
            </div>
          </div>

          {/* Sequencial Inicial */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
            <div>
              <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                Sequencial Inicial
              </span>
              <input
                type="number"
                min="1"
                value={config.sequencialInicial}
                onChange={(e) =>
                  onChangeConfig({ sequencialInicial: Math.max(1, parseInt(e.target.value) || 1) })
                }
                className="w-16 text-xs font-bold text-slate-800 bg-transparent outline-none"
              />
            </div>
          </div>

          {/* Upload e Troca de Logotipo */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5">
            <div className="w-7 h-7 rounded border border-slate-200 bg-white flex items-center justify-center overflow-hidden">
              {config.logoUrl ? (
                <img
                  src={config.logoUrl}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <ImageIcon className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                Brasão / Logotipo
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] font-medium text-blue-700 hover:text-blue-900 underline"
                >
                  Trocar
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={handleResetLogo}
                  title="Restaurar logotipo oficial de Faina"
                  className="text-[11px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-0.5"
                >
                  <RotateCcw className="w-3 h-3" /> Padrão
                </button>
              </div>
            </div>
          </div>

          {/* Opção de Marcas de Corte */}
          <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={config.mostrarMarcasCorte}
              onChange={(e) => onChangeConfig({ mostrarMarcasCorte: e.target.checked })}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <Scissors className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-xs font-semibold text-slate-700">Linhas de Corte</span>
          </label>
        </div>

        {/* Lado Direito: Ações de Planilha & Estatísticas */}
        <div className="flex items-center gap-2">
          {/* Badge Informativo de Itens e Folhas */}
          <div className="hidden sm:flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 text-blue-900">
            <span className="text-xs font-medium">
              <strong className="font-bold">{totalItems}</strong> etiquetas
            </span>
            <span className="text-blue-300">|</span>
            <span className="text-xs font-medium">
              <strong className="font-bold">{totalPages}</strong> {totalPages === 1 ? 'folha A4' : 'folhas A4'}
            </span>
          </div>

          {/* Botão Adicionar Linha */}
          <button
            type="button"
            onClick={onAddItem}
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-3 py-2 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Pasta</span>
          </button>

          {/* Botão Carregar Amostras */}
          <button
            type="button"
            onClick={onLoadSamples}
            title="Preencher com dados de exemplo da Prefeitura de Faina"
            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-2.5 py-2 rounded-lg border border-slate-300 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden md:inline">Exemplos</span>
          </button>

          {/* Backup / JSON */}
          <button
            type="button"
            onClick={onOpenImportExport}
            title="Importar ou exportar lote em JSON"
            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-2.5 py-2 rounded-lg border border-slate-300 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">JSON</span>
          </button>

          {/* Botão Celular */}
          {onOpenConnectMobile && (
            <button
              type="button"
              onClick={onOpenConnectMobile}
              title="Abrir QR Code para preencher pelo celular em tempo real"
              className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-2 rounded-lg border border-emerald-300 transition-colors cursor-pointer"
            >
              <span>📱</span>
              <span className="hidden md:inline">Celular</span>
            </button>
          )}

          {/* Limpar Tudo */}
          <button
            type="button"
            onClick={onClearAll}
            title="Limpar todos os registros"
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>

        </div>
      </div>
    </div>
  );
};
