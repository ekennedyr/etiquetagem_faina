import React, { useState, useRef } from 'react';
import type { ArchiveItem, BatchConfig } from '../types/archive';
import { exportDataAsJson } from '../utils/storage';
import { X, Download, Upload, Copy, Check, FileJson, AlertCircle } from 'lucide-react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ArchiveItem[];
  config: BatchConfig;
  onImportData: (items: ArchiveItem[], config?: Partial<BatchConfig>) => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  items,
  config,
  onImportData,
}) => {
  const [jsonText, setJsonText] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentJson = JSON.stringify(
    {
      version: '1.0',
      exportDate: new Date().toISOString(),
      config,
      items,
    },
    null,
    2
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(currentJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    exportDataAsJson(items, config);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (Array.isArray(parsed.items)) {
          onImportData(parsed.items, parsed.config);
          onClose();
        } else if (Array.isArray(parsed)) {
          onImportData(parsed);
          onClose();
        } else {
          setError('Formato inválido: o arquivo deve conter uma lista de itens.');
        }
      } catch (err) {
        setError('Erro ao ler o arquivo JSON. Certifique-se de que é um JSON válido.');
      }
    };
    reader.readAsText(file);
  };

  const handleApplyPastedJson = () => {
    try {
      setError(null);
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed.items)) {
        onImportData(parsed.items, parsed.config);
        onClose();
      } else if (Array.isArray(parsed)) {
        onImportData(parsed);
        onClose();
      } else {
        setError('O JSON colado não contém uma lista de itens válida.');
      }
    } catch (err) {
      setError('JSON inválido. Verifique a formatação.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 print:hidden">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
        {/* Header do Modal */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileJson className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold">Importar & Exportar Lote de Etiquetas</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 text-xs">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Exportação */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-600" /> Exportar Dados Atuais
            </h3>
            <p className="text-xs text-slate-600 mb-3">
              Baixe o arquivo de backup com todas as {items.length} etiquetas e configurações para uso futuro ou transição entre computadores.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" /> Baixar Arquivo .JSON
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copiado!' : 'Copiar JSON'}</span>
              </button>
            </div>
          </div>

          {/* Importação */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-600" /> Restaurar / Importar
            </h3>
            <p className="text-xs text-slate-600 mb-3">
              Faça upload de um arquivo JSON anteriormente salvo ou cole o texto do JSON abaixo.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json,application/json"
              className="hidden"
            />
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors"
              >
                <Upload className="w-4 h-4" /> Selecionar Arquivo .JSON
              </button>

              <div>
                <textarea
                  rows={3}
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder="Ou cole aqui o conteúdo do JSON..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
                />
                {jsonText.trim() && (
                  <button
                    type="button"
                    onClick={handleApplyPastedJson}
                    className="mt-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    Carregar JSON Colado
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="bg-slate-100 px-6 py-3 flex justify-end border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
