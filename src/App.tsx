import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { ArchiveItem, BatchConfig } from './types/archive';
import {
  loadStoredItems,
  saveStoredItems,
  loadStoredConfig,
  saveStoredConfig,
  SAMPLE_ITEMS,
  DEFAULT_BATCH_CONFIG,
} from './utils/storage';
import { processArchiveItems } from './utils/volumeCalculator';
import { triggerBrowserPrint, generatePdfFromSheets } from './utils/pdfGenerator';
import { Header } from './components/Header';
import { ConfigBar } from './components/ConfigBar';
import { SpreadsheetGrid } from './components/SpreadsheetGrid';
import { PreviewView } from './components/PreviewView';
import { MobileFormView } from './components/MobileFormView';
import { PrintContainer } from './components/PrintContainer';
import { SheetPreview } from './components/SheetPreview';
import { ImportExportModal } from './components/ImportExportModal';

import { syncManager } from './utils/apiSync';

function detectInitialTab(): 'spreadsheet' | 'preview' | 'mobile' {
  if (typeof window === 'undefined') return 'spreadsheet';
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();

  if (
    path.includes('formulario') ||
    path.includes('mobile') ||
    path.includes('coleta') ||
    path.includes('form') ||
    hash.includes('formulario') ||
    hash.includes('mobile') ||
    hash.includes('coleta') ||
    hash.includes('form') ||
    search.includes('view=mobile') ||
    search.includes('view=formulario')
  ) {
    return 'mobile';
  }

  if (path.includes('preview') || hash.includes('preview')) {
    return 'preview';
  }

  return 'spreadsheet';
}

export const App: React.FC = () => {
  const [rawItems, setRawItems] = useState<ArchiveItem[]>(loadStoredItems);
  const [config, setConfig] = useState<BatchConfig>(loadStoredConfig);
  const [activeTab, setActiveTab] = useState<'spreadsheet' | 'preview' | 'mobile'>(detectInitialTab);
  const [isImportExportOpen, setIsImportExportOpen] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfProgress, setPdfProgress] = useState<{ current: number; total: number } | null>(null);
  const [syncStatus, setSyncStatus] = useState<'connected' | 'connecting' | 'offline'>('connecting');

  const printRootRef = useRef<HTMLDivElement>(null);

  // Sincronização em Tempo Real (SSE + Polling de fallback)
  useEffect(() => {
    // 1. Escuta eventos em tempo real vindos do servidor (SSE)
    const unsubSync = syncManager.onSync((data) => {
      if (data.items && Array.isArray(data.items)) {
        setRawItems(data.items);
      }
      if (data.config) {
        setConfig((prev) => ({ ...prev, ...data.config }));
      }
    });

    // 2. Escuta mudanças no status da conexão
    const unsubStatus = syncManager.onStatusChange((status) => {
      setSyncStatus(status);
    });

    // 3. Busca os dados mais recentes na inicialização
    syncManager.fetchLatest();

    return () => {
      unsubSync();
      unsubStatus();
    };
  }, []);

  // Escuta alterações na URL (ex: botão voltar/avançar do navegador e hashchange)
  useEffect(() => {
    const handleUrlChange = () => {
      setActiveTab(detectInitialTab());
    };

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  // Sincronizar hash com activeTab
  const handleTabChange = (tab: 'spreadsheet' | 'preview' | 'mobile') => {
    setActiveTab(tab);
    try {
      if (tab === 'mobile') {
        window.history.replaceState(null, '', '#/formulario');
      } else if (tab === 'preview') {
        window.history.replaceState(null, '', '#/preview');
      } else {
        window.history.replaceState(null, '', '#/');
      }
    } catch {
      // Ignorar erros em ambientes restritos
    }
  };

  // Recalcular volumes e sequenciais automaticamente sempre que a lista ou configuração mudar
  const processedItems = useMemo(() => {
    return processArchiveItems(rawItems, config);
  }, [rawItems, config]);

  // Persistência automática no localStorage
  useEffect(() => {
    saveStoredItems(rawItems);
  }, [rawItems]);

  useEffect(() => {
    saveStoredConfig(config);
  }, [config]);

  // Adicionar item direto do formulário mobile com broadcast em tempo real
  const handleAddMobileItem = (newItem: ArchiveItem) => {
    setRawItems((prev) => [...prev, newItem]);
    // Envia para o servidor para que o computador atualize imediatamente
    syncManager.addItem(newItem);
  };

  // Atualizar configurações do lote
  const handleConfigChange = (updates: Partial<BatchConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    syncManager.syncAll(rawItems, newConfig);
  };

  // Alterar um item na planilha
  const handleChangeItem = (id: string, updates: Partial<ArchiveItem>) => {
    const updated = rawItems.map((item) => (item.id === id ? { ...item, ...updates } : item));
    setRawItems(updated);
    syncManager.syncAll(updated, config);
  };

  // Adicionar novo item
  const handleAddItem = () => {
    const newItem: ArchiveItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      categoria: 'licitacao',
      modalidade: 'PREGÃO ELETRÔNICO',
      numeroProcesso: '',
      ano: new Date().getFullYear().toString(),
      fundoMunicipal: 'Prefeitura Municipal / Gabinete',
      objeto: '',
      volumeInformado: 'Vol. 1',
    };
    const updated = [...rawItems, newItem];
    setRawItems(updated);
    syncManager.syncAll(updated, config);
  };

  // Duplicar item existente
  const handleDuplicateItem = (index: number) => {
    const itemToClone = rawItems[index];
    if (!itemToClone) return;

    const cloned: ArchiveItem = {
      ...itemToClone,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      volumeInformado: itemToClone.volumeInformado
        ? `Vol. ${(parseInt(itemToClone.volumeInformado.replace(/\D/g, '')) || 1) + 1}`
        : '',
    };

    const updated = [
      ...rawItems.slice(0, index + 1),
      cloned,
      ...rawItems.slice(index + 1),
    ];
    setRawItems(updated);
    syncManager.syncAll(updated, config);
  };

  // Inserir nova linha logo abaixo da atual
  const handleInsertBelow = (index: number) => {
    const current = rawItems[index];
    const newItem: ArchiveItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      categoria: current?.categoria || 'licitacao',
      modalidade: current?.modalidade || 'PREGÃO ELETRÔNICO',
      fundoMunicipal: current?.fundoMunicipal || 'Prefeitura Municipal / Gabinete',
      numeroProcesso: current?.numeroProcesso || '',
      ano: current?.ano || new Date().getFullYear().toString(),
      objeto: '',
      volumeInformado: '',
    };

    const updated = [
      ...rawItems.slice(0, index + 1),
      newItem,
      ...rawItems.slice(index + 1),
    ];
    setRawItems(updated);
    syncManager.syncAll(updated, config);
  };

  // Excluir item
  const handleDeleteItem = (id: string) => {
    if (rawItems.length <= 1) return;
    const updated = rawItems.filter((item) => item.id !== id);
    setRawItems(updated);
    syncManager.syncAll(updated, config);
  };

  // Mover item para cima ou para baixo
  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= rawItems.length) return;

    const newItems = [...rawItems];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);
    setRawItems(newItems);
    syncManager.syncAll(newItems, config);
  };

  // Carregar dados de amostra
  const handleLoadSamples = () => {
    setRawItems(SAMPLE_ITEMS);
    setConfig(DEFAULT_BATCH_CONFIG);
    syncManager.syncAll(SAMPLE_ITEMS, DEFAULT_BATCH_CONFIG);
  };

  // Limpar tudo e recomeçar
  const handleClearAll = () => {
    if (window.confirm('Deseja realmente limpar todas as etiquetas cadastradas?')) {
      const initialItem: ArchiveItem = {
        id: `item-${Date.now()}`,
        categoria: 'licitacao',
        modalidade: 'PREGÃO ELETRÔNICO',
        numeroProcesso: '',
        ano: new Date().getFullYear().toString(),
        fundoMunicipal: '',
        objeto: '',
      };
      setRawItems([initialItem]);
      syncManager.syncAll([initialItem], config);
    }
  };

  // Importar dados via modal
  const handleImportData = (items: ArchiveItem[], newConfig?: Partial<BatchConfig>) => {
    setRawItems(items);
    const finalConfig = newConfig ? { ...config, ...newConfig } : config;
    if (newConfig) {
      setConfig(finalConfig);
    }
    syncManager.syncAll(items, finalConfig);
  };

  // Impressão nativa do navegador em tamanho real 100%
  const handlePrint = () => {
    triggerBrowserPrint();
  };

  // Geração direta de PDF com jsPDF
  const handleGeneratePdf = async () => {
    if (isGeneratingPdf || !printRootRef.current) return;

    try {
      setIsGeneratingPdf(true);
      setPdfProgress({ current: 1, total: 1 });

      // Permitir breve espera para garantir layout estabilizado no DOM
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Obter os elementos de folha dentro do container dedicado
      const sheetElements = Array.from(
        printRootRef.current.querySelectorAll<HTMLElement>('.sheet-container')
      );

      if (sheetElements.length === 0) {
        alert('Nenhuma folha encontrada para gerar PDF.');
        return;
      }

      await generatePdfFromSheets(sheetElements, (current, total) => {
        setPdfProgress({ current, total });
      });
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Ocorreu um erro ao gerar o PDF. Você também pode utilizar a opção "Imprimir em Tamanho Real" e salvar como PDF pelo navegador.');
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(processedItems.length / 5));

  // Se a aba ativa for mobile, renderiza a visão de formulário mobile-first
  if (activeTab === 'mobile') {
    return (
      <MobileFormView
        items={rawItems}
        config={config}
        onAddItem={handleAddMobileItem}
        onDeleteItem={handleDeleteItem}
        onGoToSpreadsheet={() => handleTabChange('spreadsheet')}
        onGoToPreview={() => handleTabChange('preview')}
        syncStatus={syncStatus}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Cabeçalho Superior */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onPrint={handlePrint}
        onGeneratePdf={handleGeneratePdf}
        isGeneratingPdf={isGeneratingPdf}
        pdfProgress={pdfProgress}
        config={config}
        totalItems={processedItems.length}
        syncStatus={syncStatus}
      />

      {/* Barra de Configurações Globais */}
      <ConfigBar
        config={config}
        onChangeConfig={handleConfigChange}
        onAddItem={handleAddItem}
        onLoadSamples={handleLoadSamples}
        onClearAll={handleClearAll}
        onOpenImportExport={() => setIsImportExportOpen(true)}
        totalItems={processedItems.length}
        totalPages={totalPages}
      />

      {/* Área Principal de Conteúdo */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col">
        {activeTab === 'spreadsheet' ? (
          <SpreadsheetGrid
            items={processedItems}
            onChangeItem={handleChangeItem}
            onDeleteItem={handleDeleteItem}
            onDuplicateItem={handleDuplicateItem}
            onInsertBelow={handleInsertBelow}
            onMoveItem={handleMoveItem}
          />
        ) : (
          <PreviewView
            items={processedItems}
            config={config}
            onPrint={handlePrint}
            onGeneratePdf={handleGeneratePdf}
          />
        )}
      </main>

      {/* Rodapé Informativo da Aplicação */}
      <footer className="bg-white border-t border-slate-200 py-3 px-4 text-center text-xs text-slate-500 print:hidden select-none">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>
            Prefeitura Municipal de Faina • Controladoria-Geral do Município (CGM)
          </span>
          <span className="font-mono text-slate-400">
            Formato: 5 etiquetas (50x155mm) por Folha A4 Paisagem (297x210mm)
          </span>
        </div>
      </footer>

      {/* Container Oculto fora da tela para Captura precisa do PDF (Sem display: none para permitir cálculo milimétrico) */}
      <div
        style={{
          position: 'fixed',
          left: '-99999px',
          top: '0px',
          width: '297mm',
          opacity: 1,
          zIndex: -9999,
          pointerEvents: 'none',
        }}
      >
        <div ref={printRootRef}>
          {Array.from({ length: totalPages }, (_, i) => (
            <div key={`capture-sheet-${i}`} className="mb-4 bg-white" style={{ width: '297mm', height: '210mm' }}>
              <SheetPreview
                items={processedItems}
                config={config}
                sheetIndex={i}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Container Direto para window.print() */}
      <PrintContainer items={processedItems} config={config} />

      {/* Modal de Importar / Exportar JSON */}
      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        items={rawItems}
        config={config}
        onImportData={handleImportData}
      />
    </div>
  );
};

export default App;
