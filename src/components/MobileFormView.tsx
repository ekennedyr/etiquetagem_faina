import React, { useState, useRef } from 'react';
import type { ArchiveItem, BatchConfig } from '../types/archive';
import {
  Smartphone,
  PlusCircle,
  CheckCircle2,
  Table,
  Building2,
  Trash2,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  RotateCcw,
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
}

export const MobileFormView: React.FC<MobileFormViewProps> = ({
  items,
  config,
  onAddItem,
  onDeleteItem,
  onGoToSpreadsheet,
}) => {
  // Estados do formulário
  const [modalidade, setModalidade] = useState<string>(MODALIDADES_FORM[0]);
  const [numeroProcesso, setNumeroProcesso] = useState<string>('');
  const [ano, setAno] = useState<string>('2024');
  const [objeto, setObjeto] = useState<string>('');
  const [volume, setVolume] = useState<string>('');

  // Estados auxiliares de UX
  const [errors, setErrors] = useState<{
    modalidade?: string;
    numeroProcesso?: string;
    ano?: string;
    objeto?: string;
    volume?: string;
  }>({});
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [lastInsertedTitle, setLastInsertedTitle] = useState<string>('');
  const [showRecentList, setShowRecentList] = useState<boolean>(true);

  // Referência para focar no campo inicial após submissão
  const numProcessoInputRef = useRef<HTMLInputElement>(null);

  // Validação e formatação de números até 2 dígitos
  const handleProcessoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, ''); // apenas dígitos
    if (rawVal.length <= 2) {
      setNumeroProcesso(rawVal);
      if (errors.numeroProcesso) {
        setErrors((prev) => ({ ...prev, numeroProcesso: undefined }));
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, ''); // apenas dígitos
    if (rawVal.length <= 2) {
      setVolume(rawVal);
      if (errors.volume) {
        setErrors((prev) => ({ ...prev, volume: undefined }));
      }
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!modalidade.trim()) {
      newErrors.modalidade = 'Selecione a modalidade.';
    }

    if (!numeroProcesso.trim()) {
      newErrors.numeroProcesso = 'Informe o número do processo (até 2 dígitos).';
    }

    if (!ano.trim()) {
      newErrors.ano = 'Selecione o ano.';
    }

    if (!objeto.trim()) {
      newErrors.objeto = 'Informe a descrição/objeto do processo.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Criar novo ArchiveItem
    const formattedVolume = volume.trim()
      ? volume.toLowerCase().startsWith('vol')
        ? volume
        : `Vol. ${parseInt(volume, 10)}`
      : '';

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

    // Feedback visual
    const summary = `${modalidade} Nº ${numeroProcesso}/${ano}`;
    setLastInsertedTitle(summary);
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 3000);

    // Limpar o formulário para a próxima inserção
    setNumeroProcesso('');
    setObjeto('');
    setVolume('');
    setErrors({});

    // Focar no campo de número do processo para fluxo ágil contínuo
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
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header Mobile */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-1.5 flex items-center justify-center shadow-md shadow-blue-900/40 border border-blue-500/30">
              {config.logoUrl ? (
                <img
                  src={config.logoUrl}
                  alt="Brasão de Faina"
                  className="w-full h-full object-contain"
                />
              ) : (
                <Building2 className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight text-white">
                  Faina • CGM
                </span>
                <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-1">
                  <Smartphone className="w-2.5 h-2.5" />
                  Mobile
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Coleta Rápida de Pastas</p>
            </div>
          </div>

          {/* Botão para alternar para a planilha completa */}
          <button
            type="button"
            onClick={onGoToSpreadsheet}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 shadow-sm transition-all"
            title="Ir para a planilha completa de etiquetas"
          >
            <Table className="w-3.5 h-3.5 text-blue-400" />
            <span>Planilha</span>
            <span className="bg-blue-600 text-white font-mono text-[10px] px-1.5 py-0.2 rounded-full">
              {items.length}
            </span>
          </button>
        </div>
      </header>

      {/* Toast de Sucesso Flutuante */}
      {showSuccessToast && (
        <div className="fixed top-16 left-4 right-4 z-50 max-w-md mx-auto animate-bounce">
          <div className="bg-emerald-600 text-white p-3 rounded-2xl shadow-xl shadow-emerald-950/60 border border-emerald-400/40 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-200" />
            <div className="flex-1 text-xs">
              <p className="font-bold">Item adicionado com sucesso!</p>
              <p className="text-emerald-100 font-mono text-[11px] truncate">
                {lastInsertedTitle}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo Principal do Formulário */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 flex flex-col gap-4 pb-20">
        {/* Banner Informativo */}
        <div className="bg-gradient-to-r from-blue-950/60 to-slate-800/80 border border-blue-800/40 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Novo Registro de Arquivo
              </h2>
            </div>
            <span className="text-[11px] font-mono font-bold text-blue-400 bg-blue-900/40 px-2 py-0.5 rounded-md border border-blue-700/40">
              Total: {items.length} {items.length === 1 ? 'pasta' : 'pastas'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Preencha os campos abaixo e toque em <strong>"Próximo"</strong> para salvar na planilha e cadastrar a próxima pasta.
          </p>
        </div>

        {/* Formulário Principal */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700 shadow-xl flex flex-col gap-4"
        >
          {/* Campo: MODALIDADE */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>
                MODALIDADE <span className="text-rose-400">*</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Lista suspensa</span>
            </label>
            <div className="relative">
              <select
                value={modalidade}
                onChange={(e) => {
                  setModalidade(e.target.value);
                  if (errors.modalidade) {
                    setErrors((prev) => ({ ...prev, modalidade: undefined }));
                  }
                }}
                className={`w-full bg-slate-900/90 border ${
                  errors.modalidade ? 'border-rose-500' : 'border-slate-600'
                } rounded-xl px-3.5 py-3 text-xs font-bold text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all`}
              >
                {MODALIDADES_FORM.map((mod) => (
                  <option key={mod} value={mod} className="bg-slate-900 text-white font-medium py-1">
                    {mod}
                  </option>
                ))}
              </select>
            </div>
            {errors.modalidade && (
              <span className="text-[11px] text-rose-400 font-medium">
                {errors.modalidade}
              </span>
            )}
          </div>

          {/* Linha com NÚMERO DO PROCESSO + ANO */}
          <div className="grid grid-cols-2 gap-3">
            {/* Campo: NÚMERO PROCESSO */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>
                  Nº PROCESSO <span className="text-rose-400">*</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Até 2 dígitos</span>
              </label>
              <input
                ref={numProcessoInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                value={numeroProcesso}
                onChange={handleProcessoChange}
                placeholder="Ex: 01"
                className={`w-full bg-slate-900/90 border ${
                  errors.numeroProcesso ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-600'
                } rounded-xl px-3.5 py-3 text-sm font-mono font-bold text-white text-center placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all`}
              />
              {errors.numeroProcesso && (
                <span className="text-[10px] text-rose-400 font-medium leading-tight">
                  {errors.numeroProcesso}
                </span>
              )}
            </div>

            {/* Campo: ANO */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>
                  ANO <span className="text-rose-400">*</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Selecione</span>
              </label>
              <select
                value={ano}
                onChange={(e) => {
                  setAno(e.target.value);
                  if (errors.ano) {
                    setErrors((prev) => ({ ...prev, ano: undefined }));
                  }
                }}
                className={`w-full bg-slate-900/90 border ${
                  errors.ano ? 'border-rose-500' : 'border-slate-600'
                } rounded-xl px-3 py-3 text-sm font-mono font-bold text-white text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all`}
              >
                {ANOS_FORM.map((yearOption) => (
                  <option key={yearOption} value={yearOption} className="bg-slate-900 text-white font-medium py-1">
                    {yearOption}
                  </option>
                ))}
              </select>
              {errors.ano && (
                <span className="text-[10px] text-rose-400 font-medium leading-tight">
                  {errors.ano}
                </span>
              )}
            </div>
          </div>

          {/* Campo: OBJETO */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>
                OBJETO <span className="text-rose-400">*</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Texto simples</span>
            </label>
            <textarea
              rows={2}
              value={objeto}
              onChange={(e) => {
                setObjeto(e.target.value);
                if (errors.objeto) {
                  setErrors((prev) => ({ ...prev, objeto: undefined }));
                }
              }}
              placeholder="Ex: Aquisição de medicamentos e insumos..."
              className={`w-full bg-slate-900/90 border ${
                errors.objeto ? 'border-rose-500' : 'border-slate-600'
              } rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-all leading-relaxed`}
            />
            {errors.objeto && (
              <span className="text-[11px] text-rose-400 font-medium">
                {errors.objeto}
              </span>
            )}
          </div>

          {/* Campo: VOLUME (OPCIONAL) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">
                VOLUME
              </label>
              <span className="text-[10px] bg-slate-700/60 text-slate-400 px-2 py-0.5 rounded-full font-medium">
                Opcional • até 2 dígitos
              </span>
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
                className="flex-1 bg-slate-900/90 border border-slate-600 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Botões de Ação do Formulário */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetForm}
              className="p-3 text-slate-400 hover:text-slate-200 active:scale-95 bg-slate-900/60 rounded-xl border border-slate-700 flex items-center justify-center transition-all"
              title="Limpar campos"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* BOTÃO PRINCIPAL PRÓXIMO */}
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white font-black text-sm py-3.5 px-4 rounded-xl shadow-lg shadow-blue-900/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <PlusCircle className="w-5 h-5 text-white" />
              <span>PRÓXIMO</span>
            </button>
          </div>
        </form>

        {/* Seção dos Últimos Itens Cadastrados na Sessão */}
        {items.length > 0 && (
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700/80 overflow-hidden shadow-md">
            <button
              type="button"
              onClick={() => setShowRecentList((prev) => !prev)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-slate-300 hover:bg-slate-800/90 transition-colors"
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
              <div className="divide-y divide-slate-700/60 max-h-60 overflow-y-auto">
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
                            {item.modalidade}
                          </span>
                          <span className="text-xs font-mono font-extrabold text-amber-400">
                            Nº {item.numeroProcesso || '—'}/{item.ano}
                          </span>
                          {item.volumeInformado && (
                            <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-1.5 py-0.2 rounded">
                              {item.volumeInformado}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                          {item.objeto || 'Sem descrição'}
                        </p>
                      </div>

                      {/* Botão de Excluir */}
                      <button
                        type="button"
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 active:scale-95 rounded-lg hover:bg-rose-500/10 transition-colors flex-shrink-0"
                        title="Remover este item"
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

      {/* Barra de Ação Fixa Inferior */}
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-2.5 z-20 shadow-2xl">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={onGoToSpreadsheet}
            className="flex-1 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 font-bold py-2.5 px-3 rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-all"
          >
            <Table className="w-4 h-4 text-blue-400" />
            <span>Ver Planilha ({items.length})</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
