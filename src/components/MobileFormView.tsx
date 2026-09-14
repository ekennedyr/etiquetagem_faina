import React, { useState, useRef } from 'react';
import type { ArchiveItem, BatchConfig } from '../types/archive';
import {
  PlusCircle,
  CheckCircle2,
  Table,
  Building2,
  Trash2,
  Layers,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  FileSpreadsheet,
} from 'lucide-react';

const MODALIDADES_FORM = [
  'PREGÃO ELETRÔNICO',
  'PREGÃO PRESENCIAL',
  'CONCORRÊNCIA',
  'DIÁLOGO COMPETITIVO',
  'CONCURSO',
  'LEILÃO',
  'CREDENCIAMENTO',
  'REGISTRO/TOMADA DE PREÇOS',
  'CONVITE',
] as const;

const ANOS_FORM = ['2021', '2022', '2023', '2024'] as const;

interface MobileFormViewProps {
  items: ArchiveItem[];
  config: BatchConfig;
  onAddItem: (item: ArchiveItem) => void;
  onDeleteItem: (id: string) => void;
  onGoToSpreadsheet: () => void;
  onGoToPreview: () => void;
  syncStatus?: 'connected' | 'connecting' | 'offline';
}

export const MobileFormView: React.FC<MobileFormViewProps> = ({
  items,
  config,
  onAddItem,
  onDeleteItem,
  onGoToSpreadsheet,
  syncStatus = 'connected',
}) => {
  // Estados dos campos (todos não obrigatórios)
  const [modalidade, setModalidade] = useState<string>(MODALIDADES_FORM[0]);
  const [numeroProcesso, setNumeroProcesso] = useState<string>('');
  const [ano, setAno] = useState<string>('2024');
  const [objeto, setObjeto] = useState<string>('');
  const [volume, setVolume] = useState<string>('');

  // Estados auxiliares de UX
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [lastInsertedSummary, setLastInsertedSummary] = useState<string>('');
  const [showRecentList, setShowRecentList] = useState<boolean>(true);

  // Referência para focar no campo de número do processo após submissão
  const numProcessoInputRef = useRef<HTMLInputElement>(null);

  // Formatação de números com até 2 dígitos
  const handleProcessoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    if (rawVal.length <= 2) {
      setNumeroProcesso(rawVal);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    if (rawVal.length <= 2) {
      setVolume(rawVal);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Formatar o volume se informado
    const formattedVolume = volume.trim()
      ? volume.toLowerCase().startsWith('vol')
        ? volume
        : `Vol. ${parseInt(volume, 10)}`
      : '';

    // Cria o ArchiveItem com a categoria 'licitacao' (Processos Licitatórios)
    const newItem: ArchiveItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      categoria: 'licitacao',
      modalidade: modalidade.trim(),
      numeroProcesso: numeroProcesso.trim(),
      ano: ano.trim(),
      objeto: objeto.trim(),
      volumeInformado: formattedVolume,
      fundoMunicipal: 'Prefeitura Municipal / Gabinete',
    };

    onAddItem(newItem);

    // Resumo para feedback visual
    const summary = [
      modalidade,
      numeroProcesso ? `Nº ${numeroProcesso}/${ano || ''}` : ano ? `Ano ${ano}` : '',
      formattedVolume,
    ]
      .filter(Boolean)
      .join(' • ');

    setLastInsertedSummary(summary || 'Nova pasta cadastrada');
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 2800);

    // Limpar campos para a próxima inserção (mantendo modalidade e ano como facilitador de lote)
    setNumeroProcesso('');
    setObjeto('');
    setVolume('');

    // Focar no campo de número do processo para fluxo contínuo
    setTimeout(() => {
      numProcessoInputRef.current?.focus();
    }, 50);
  };

  const handleResetForm = () => {
    setModalidade(MODALIDADES_FORM[0]);
    setNumeroProcesso('');
    setAno('2024');
    setObjeto('');
    setVolume('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Topo Oficial Institucional */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-xl">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Logotipo da Prefeitura de Faina */}
            <div className="w-11 h-11 rounded-xl bg-white p-1 flex items-center justify-center shadow-md border border-slate-700 flex-shrink-0">
              {config.logoUrl ? (
                <img
                  src={config.logoUrl}
                  alt="Brasão da Prefeitura Municipal de Faina"
                  className="w-full h-full object-contain"
                />
              ) : (
                <Building2 className="w-6 h-6 text-blue-900" />
              )}
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-extrabold tracking-tight text-white leading-tight">
                Controladoria-Geral do Município de Faina
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-semibold text-blue-400">
                  Aplicativo de Etiquetagem
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                    syncStatus === 'connected'
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-600/40'
                      : syncStatus === 'connecting'
                      ? 'bg-amber-950/60 text-amber-400 border-amber-600/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <span
                    className={`w-1 h-1 rounded-full ${
                      syncStatus === 'connected'
                        ? 'bg-emerald-400 animate-pulse'
                        : syncStatus === 'connecting'
                        ? 'bg-amber-400 animate-ping'
                        : 'bg-slate-500'
                    }`}
                  />
                  <span>
                    {syncStatus === 'connected'
                      ? 'Ao Vivo'
                      : syncStatus === 'connecting'
                      ? 'Conectando...'
                      : 'Offline'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Botão para ver a planilha completa */}
          <button
            type="button"
            onClick={onGoToSpreadsheet}
            className="flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white text-xs font-bold px-3 py-2 rounded-xl border border-blue-500/30 shadow-sm transition-all flex-shrink-0"
            title="Ir para a planilha completa de etiquetas"
          >
            <Table className="w-4 h-4 text-blue-400" />
            <span className="hidden xs:inline">Planilha</span>
            <span className="bg-blue-600 text-white font-mono text-[10px] px-1.5 py-0.2 rounded-full font-black">
              {items.length}
            </span>
          </button>
        </div>
      </header>

      {/* Toast de Sucesso Flutuante */}
      {showSuccessToast && (
        <div className="fixed top-20 left-4 right-4 z-50 max-w-md mx-auto animate-bounce">
          <div className="bg-emerald-600 text-white p-3.5 rounded-2xl shadow-2xl shadow-emerald-950/80 border border-emerald-400/50 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-200" />
            <div className="flex-1 text-xs">
              <p className="font-bold">Pasta adicionada com sucesso!</p>
              <p className="text-emerald-100 font-mono text-[11px] truncate">
                {lastInsertedSummary}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo Principal da Coleta */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 flex flex-col gap-4 pb-24">
        {/* Banner Informativo de Processos Licitatórios */}
        <div className="bg-gradient-to-r from-blue-950/70 via-slate-900 to-slate-900 border border-blue-800/40 rounded-2xl p-3.5 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="text-xs font-black text-white uppercase tracking-wider">
                Processos Licitatórios
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-800/50">
              {items.length} {items.length === 1 ? 'pasta cadastrada' : 'pastas cadastradas'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
            Preencha as informações da lombada da pasta e toque em <strong>"PRÓXIMO"</strong> para adicionar e abrir novo registro.
          </p>
        </div>

        {/* Formulário com todos os campos não obrigatórios */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-2xl flex flex-col gap-4"
        >
          {/* Campo: MODALIDADE */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">
                MODALIDADE
              </label>
              <span className="text-[10px] text-slate-500 font-medium">Lista suspensa</span>
            </div>
            <select
              value={modalidade}
              onChange={(e) => setModalidade(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-3 text-xs font-bold text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-inner"
            >
              {MODALIDADES_FORM.map((mod) => (
                <option key={mod} value={mod} className="bg-slate-900 text-white font-medium py-1">
                  {mod}
                </option>
              ))}
            </select>
          </div>

          {/* Linha com NÚMERO DO PROCESSO + ANO */}
          <div className="grid grid-cols-2 gap-3">
            {/* Campo: NÚMERO PROCESSO */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">
                  Nº PROCESSO
                </label>
                <span className="text-[10px] text-slate-500">Até 2 dígitos</span>
              </div>
              <input
                ref={numProcessoInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                value={numeroProcesso}
                onChange={handleProcessoChange}
                placeholder="Ex: 01"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-3 text-sm font-mono font-bold text-white text-center placeholder-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-inner"
              />
            </div>

            {/* Campo: ANO */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">
                  ANO
                </label>
                <span className="text-[10px] text-slate-500">Selecione</span>
              </div>
              <select
                value={ano}
                onChange={(e) => setAno(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-3 text-sm font-mono font-bold text-white text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-inner"
              >
                {ANOS_FORM.map((yearOption) => (
                  <option key={yearOption} value={yearOption} className="bg-slate-900 text-white font-medium py-1">
                    {yearOption}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Campo: OBJETO */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">
                OBJETO
              </label>
              <span className="text-[10px] text-slate-500">Texto simples</span>
            </div>
            <textarea
              rows={2}
              value={objeto}
              onChange={(e) => setObjeto(e.target.value)}
              placeholder="Ex: Aquisição de medicamentos e insumos hospitalares..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-all leading-relaxed shadow-inner"
            />
          </div>

          {/* Campo: VOLUME */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">
                VOLUME
              </label>
              <span className="text-[10px] text-slate-500">Até 2 dígitos</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 font-mono pl-1">Vol.</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                value={volume}
                onChange={handleVolumeChange}
                placeholder="Ex: 1, 2..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetForm}
              className="p-3 text-slate-400 hover:text-slate-200 active:scale-95 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-center transition-all"
              title="Limpar campos do formulário"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* BOTÃO PRÓXIMO */}
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white font-black text-sm py-3.5 px-4 rounded-xl shadow-lg shadow-blue-900/60 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <PlusCircle className="w-5 h-5 text-white" />
              <span>PRÓXIMO</span>
            </button>
          </div>
        </form>

        {/* Seção dos Últimos Itens Cadastrados */}
        {items.length > 0 && (
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
            <button
              type="button"
              onClick={() => setShowRecentList((prev) => !prev)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-slate-300 hover:bg-slate-800/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Últimos Itens Inseridos ({items.length})</span>
              </div>
              {showRecentList ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showRecentList && (
              <div className="divide-y divide-slate-800 max-h-56 overflow-y-auto">
                {items
                  .slice(-5)
                  .reverse()
                  .map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 flex items-start justify-between gap-3 hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold font-mono bg-blue-950 text-blue-300 border border-blue-800/60 px-1.5 py-0.2 rounded">
                            #{items.length - idx}
                          </span>
                          <span className="text-xs font-bold text-white truncate">
                            {item.modalidade || 'Processo'}
                          </span>
                          {item.numeroProcesso && (
                            <span className="text-xs font-mono font-extrabold text-amber-400">
                              Nº {item.numeroProcesso}/{item.ano || ''}
                            </span>
                          )}
                          {item.volumeInformado && (
                            <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-1.5 py-0.2 rounded">
                              {item.volumeInformado}
                            </span>
                          )}
                        </div>
                        {item.objeto && (
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                            {item.objeto}
                          </p>
                        )}
                      </div>

                      {/* Botão de Excluir */}
                      <button
                        type="button"
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 active:scale-95 rounded-lg hover:bg-rose-500/10 transition-colors flex-shrink-0"
                        title="Remover esta pasta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Rodapé Oficial da Página Mobile First */}
      <footer className="mt-auto bg-slate-900 border-t border-slate-800 py-3.5 px-4 text-center text-xs text-slate-400 print:hidden select-none">
        <div className="max-w-md mx-auto flex flex-col gap-2">
          <button
            type="button"
            onClick={onGoToSpreadsheet}
            className="w-full bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 font-bold py-2.5 px-3 rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-all mb-1"
          >
            <Table className="w-4 h-4 text-blue-400" />
            <span>Ver Planilha / Imprimir Etiquetas ({items.length})</span>
          </button>
          <p className="text-[10px] leading-relaxed text-slate-400">
            Desenvolvido por <strong>Eduardo Kennedy Rodrigues</strong> para a <strong>Controladoria-Geral do Município de Faina</strong>. Todos os Direitos Reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};
