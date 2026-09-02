import React from 'react';
import type { ArchiveItem, BatchConfig } from '../types/archive';

interface LabelItemProps {
  item: ArchiveItem;
  config: BatchConfig;
  className?: string;
  showCutLines?: boolean;
}

export const LabelItem: React.FC<LabelItemProps> = ({
  item,
  config,
  className = '',
  showCutLines = true,
}) => {
  // Obter título da categoria
  const getTituloPrincipal = () => {
    switch (item.categoria) {
      case 'licitacao':
        return 'PROCESSOS LICITATÓRIOS';
      case 'balancete':
        return 'BALANCETE';
      case 'dispensa':
        return item.subtipoDispensa || 'DISPENSA DE LICITAÇÃO';
      case 'outros':
        return (item.tituloCustomizado || 'DOCUMENTAÇÃO ARQUIVADA').toUpperCase();
      case 'nao_identificado':
        return 'DOCUMENTAÇÃO NÃO IDENTIFICADA';
      default:
        return 'ARQUIVO PÚBLICO';
    }
  };

  // Calcular tamanho de fonte responsivo para o campo Objeto
  const getObjetoFontSizeClass = (text?: string) => {
    if (!text) return 'text-[7pt] leading-[9pt]';
    const len = text.length;
    if (len > 220) return 'text-[5.5pt] leading-[7.5pt]';
    if (len > 150) return 'text-[6pt] leading-[8pt]';
    if (len > 90) return 'text-[6.5pt] leading-[8.5pt]';
    return 'text-[7pt] leading-[9.5pt]';
  };

  const objetoText = item.objeto || item.observacoes;

  return (
    <div
      style={{
        width: '50mm',
        height: '155mm',
        boxSizing: 'border-box',
      }}
      className={`relative bg-white text-slate-900 flex flex-col justify-between overflow-hidden select-none print:select-auto ${
        showCutLines ? 'border border-slate-300' : 'border border-transparent'
      } ${className}`}
    >
      {/* ======================= 1. TOPO: CABEÇALHO ======================= */}
      <div className="pt-2 px-2 flex flex-col items-center flex-shrink-0">
        {/* Logotipo da Prefeitura */}
        <div className="w-full flex justify-center items-center h-[21mm] mb-1">
          {config.logoUrl ? (
            <img
              src={config.logoUrl}
              alt="Prefeitura de Faina"
              className="max-h-[21mm] max-w-[46mm] object-contain"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="text-center">
              <div className="text-[7pt] font-black tracking-wider text-slate-800 uppercase">
                Prefeitura Municipal de
              </div>
              <div className="text-[13pt] font-black tracking-tighter text-[#0B3A5E] leading-tight">
                FAINA
              </div>
              <div className="text-[5pt] font-semibold text-emerald-700 tracking-wide">
                GESTÃO 2025-2028
              </div>
            </div>
          )}
        </div>

        {/* Código de Localização da Pilha */}
        <div className="w-full mt-0.5 mb-1.5">
          <div className="bg-[#0B3A5E] text-white text-center py-0.5 px-1 rounded-sm shadow-sm flex items-center justify-between">
            <span className="text-[5.5pt] font-medium tracking-widest text-slate-200 uppercase">
              LOCALIZAÇÃO
            </span>
            <span className="text-[8.5pt] font-mono font-black tracking-wider text-amber-300">
              {item.codigoLocalizacao || `${config.siglaPilha}/001`}
            </span>
          </div>
        </div>
      </div>

      {/* ======================= 2. CORPO CENTRAL: CONTEÚDO ======================= */}
      <div className="flex-1 mx-2 flex flex-col justify-between border-2 border-slate-800 rounded p-1.5 bg-slate-50/40 min-h-0 overflow-hidden">
        {/* Título & Subtítulo */}
        <div className="text-center pb-1 border-b border-slate-300 flex-shrink-0">
          <h1 className="text-[8.5pt] font-black text-slate-900 tracking-tight leading-tight uppercase">
            {getTituloPrincipal()}
          </h1>
          {item.modalidade && (
            <div className="inline-block mt-0.5 px-1.5 py-0.2 bg-emerald-100 text-emerald-900 font-bold text-[6.5pt] rounded">
              {item.modalidade}
            </div>
          )}
        </div>

        {/* Informações Específicas / Metadados */}
        <div className="flex-1 flex flex-col justify-evenly py-1 min-h-0">
          {/* Fundo Municipal */}
          {item.fundoMunicipal && (
            <div className="text-center flex-shrink-0">
              <span className="text-[5.5pt] font-bold text-slate-500 uppercase tracking-wider block leading-tight">
                Origem / Fundo
              </span>
              <span className="text-[7pt] font-extrabold text-slate-800 leading-tight block truncate">
                {item.fundoMunicipal}
              </span>
            </div>
          )}

          {/* Processo / Mês / Ano */}
          <div className="grid grid-cols-2 gap-1 bg-white border border-slate-200 rounded p-1 text-center shadow-xs flex-shrink-0">
            {item.categoria === 'balancete' ? (
              <>
                <div className="border-r border-slate-200 pr-1">
                  <span className="text-[5pt] font-bold text-slate-500 uppercase block">
                    MÊS
                  </span>
                  <span className="text-[7.5pt] font-black text-[#0B3A5E] block leading-tight">
                    {item.mes || '-'}
                  </span>
                </div>
                <div className="pl-1">
                  <span className="text-[5pt] font-bold text-slate-500 uppercase block">
                    ANO
                  </span>
                  <span className="text-[7.5pt] font-black text-[#0B3A5E] block leading-tight">
                    {item.ano || '-'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="border-r border-slate-200 pr-1">
                  <span className="text-[5pt] font-bold text-slate-500 uppercase block">
                    PROCESSO
                  </span>
                  <span className="text-[7.5pt] font-black text-[#0B3A5E] block leading-tight">
                    {item.numeroProcesso || '-'}
                  </span>
                </div>
                <div className="pl-1">
                  <span className="text-[5pt] font-bold text-slate-500 uppercase block">
                    ANO
                  </span>
                  <span className="text-[7.5pt] font-black text-[#0B3A5E] block leading-tight">
                    {item.ano || '-'}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Objeto Descritivo */}
          {objetoText && (
            <div className="bg-white border border-slate-200 rounded p-1 min-h-0 flex flex-col justify-start">
              <span className="text-[5pt] font-bold text-slate-500 uppercase block mb-0.5 tracking-wider">
                OBJETO / DESCRIÇÃO:
              </span>
              <p
                className={`${getObjetoFontSizeClass(
                  objetoText
                )} font-medium text-slate-800 text-justify hyphens-auto overflow-hidden line-clamp-6`}
              >
                {objetoText}
              </p>
            </div>
          )}
        </div>

        {/* Seção de Volumes (Informado x Calculado) */}
        <div className="pt-1 border-t border-slate-300 flex-shrink-0">
          <div className="grid grid-cols-2 gap-1">
            {/* Volume Informado */}
            <div className="bg-slate-100 rounded px-1 py-0.5 text-center border border-slate-300">
              <span className="text-[4.5pt] font-bold text-slate-600 block uppercase">
                VOL. INFORMADO
              </span>
              <span className="text-[6.5pt] font-bold text-slate-700 truncate block">
                {item.volumeInformado || '—'}
              </span>
            </div>

            {/* Volume Calculado */}
            <div className="bg-[#0B3A5E]/10 rounded px-1 py-0.5 text-center border border-[#0B3A5E]/30">
              <span className="text-[4.5pt] font-bold text-[#0B3A5E] block uppercase">
                VOL. CALCULADO
              </span>
              <span className="text-[7pt] font-black text-[#0B3A5E] truncate block">
                {item.volumeCalculado || 'Vol. Único'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================= 3. RODAPÉ: RESSALVA JURÍDICA ======================= */}
      <div className="pb-1.5 pt-1 px-2 flex-shrink-0 flex flex-col items-center text-center">
        {/* Texto de ressalva jurídica arquivística */}
        <p className="text-[4.8pt] leading-[6.2pt] text-slate-600 text-justify w-full mb-1 font-normal tracking-tight">
          {config.ressalvaJuridica}
        </p>

        {/* Órgão emitente em destaque */}
        <div className="border-t border-slate-400 w-full pt-0.5 flex justify-center">
          <span className="text-[6pt] font-black text-slate-900 tracking-wider uppercase">
            {config.nomeInstitucional}
          </span>
        </div>
      </div>
    </div>
  );
};
