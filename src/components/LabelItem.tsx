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

  const objetoText = (item.objeto || item.observacoes || '').trim();
  const hasObjeto = objetoText.length > 0;
  const objetoLen = objetoText.length;
  const isLongObjeto = objetoLen > 130;
  const isMediumObjeto = objetoLen > 45 && !isLongObjeto;
  const isShortObjeto = hasObjeto && !isLongObjeto && !isMediumObjeto;
  const hasFundo = Boolean(item.fundoMunicipal?.trim());
  const hasModalidade = Boolean(item.modalidade?.trim());

  // Tipografia dinâmica do Objeto
  const getObjetoStyle = () => {
    if (isLongObjeto) return 'text-[6.5pt] leading-[8.5pt] line-clamp-6';
    if (isMediumObjeto) return 'text-[7.5pt] leading-[10pt] line-clamp-5';
    return 'text-[8.5pt] leading-[11.5pt] line-clamp-4';
  };

  // Ajuste do nome institucional garantindo "DE FAINA"
  const nomeInstitucional = config.nomeInstitucional?.includes('DE FAINA')
    ? config.nomeInstitucional
    : 'CONTROLADORIA-GERAL DO MUNICÍPIO DE FAINA';

  return (
    <div
      style={{
        width: '50mm',
        height: '155mm',
        boxSizing: 'border-box',
      }}
      className={`relative bg-white text-black flex flex-col justify-between overflow-hidden select-none print:select-auto ${
        showCutLines ? 'border border-slate-400' : 'border border-transparent'
      } ${className}`}
    >
      {/* ======================= 1. TOPO: CABEÇALHO ======================= */}
      <div className="pt-2 px-2 flex flex-col items-center flex-shrink-0">
        {/* Logotipo da Prefeitura */}
        <div className="w-full flex justify-center items-center h-[20mm] mb-1">
          {config.logoUrl ? (
            <img
              src={config.logoUrl}
              alt="Prefeitura de Faina"
              className="max-h-[20mm] max-w-[46mm] object-contain filter contrast-125"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="text-center">
              <div className="text-[7pt] font-black tracking-wider text-black uppercase">
                Prefeitura Municipal de
              </div>
              <div className="text-[14pt] font-black tracking-tight text-black leading-tight">
                FAINA
              </div>
              <div className="text-[5.5pt] font-bold text-black tracking-wider">
                GESTÃO 2025-2028
              </div>
            </div>
          )}
        </div>

        {/* Código de Localização da Pilha - Alto Contraste P&B */}
        <div className="w-full mt-0.5 mb-1.5">
          <div className="bg-white border-2 border-black text-black text-center py-0.5 px-1.5 rounded-sm flex items-center justify-between shadow-xs">
            <span className="text-[6.5pt] font-black tracking-widest text-black uppercase">
              LOCALIZAÇÃO:
            </span>
            <span className="text-[10.5pt] font-mono font-black tracking-wider text-black">
              {item.codigoLocalizacao || `${config.siglaPilha}/001`}
            </span>
          </div>
        </div>
      </div>

      {/* ======================= 2. CORPO CENTRAL: CONTEÚDO EXPANDIDO ======================= */}
      <div className="flex-1 mx-2 flex flex-col justify-between border-2 border-black rounded p-2 bg-white min-h-0 overflow-hidden">
        {/* Título Principal & Modalidade */}
        <div className="text-center pb-1.5 border-b-2 border-black flex-shrink-0 flex flex-col items-center justify-center">
          <h1
            className={`font-black text-black tracking-tight uppercase leading-tight text-center ${
              !hasObjeto && !hasModalidade
                ? 'text-[13pt] leading-[15pt]'
                : !hasObjeto
                ? 'text-[11.5pt] leading-[13.5pt]'
                : isShortObjeto
                ? 'text-[10.5pt] leading-[12.5pt]'
                : 'text-[9.5pt] leading-[11.5pt]'
            }`}
          >
            {getTituloPrincipal()}
          </h1>

          {/* Modalidade / Tipo */}
          {item.modalidade && (
            <div
              className={`mt-1 font-black uppercase text-black border border-black rounded inline-block ${
                !hasObjeto
                  ? 'text-[9pt] px-2 py-0.5 bg-slate-100'
                  : 'text-[7.5pt] px-1.5 py-0.2 bg-slate-50'
              }`}
            >
              {item.modalidade}
            </div>
          )}
        </div>

        {/* Área Central: Metadados & Objeto (Auto-fit para preencher o espaço vertical) */}
        <div className="flex-1 flex flex-col justify-around py-1 min-h-0">
          {/* Fundo Municipal */}
          {hasFundo && (
            <div className="text-center flex-shrink-0 my-0.5">
              <span className="text-[5.5pt] font-black text-black uppercase tracking-wider block leading-none">
                ORIGEM / FUNDO
              </span>
              <span
                className={`font-black text-black leading-tight block truncate ${
                  !hasObjeto ? 'text-[9.5pt] mt-0.5' : 'text-[7.5pt]'
                }`}
              >
                {item.fundoMunicipal}
              </span>
            </div>
          )}

          {/* Destaque Gigante do Processo / Mês / Ano (Legível de Longe na Estante) */}
          <div
            className={`border-2 border-black rounded text-center shadow-xs flex-shrink-0 bg-white ${
              !hasObjeto ? 'p-2 my-1' : 'p-1 my-0.5'
            }`}
          >
            {item.categoria === 'balancete' ? (
              <div className="grid grid-cols-2 divide-x-2 divide-black items-center">
                <div className="pr-1">
                  <span
                    className={`font-black text-black uppercase block leading-none ${
                      !hasObjeto ? 'text-[6.5pt]' : 'text-[5.5pt]'
                    }`}
                  >
                    MÊS
                  </span>
                  <span
                    className={`font-black text-black block leading-tight ${
                      !hasObjeto ? 'text-[14pt]' : 'text-[10pt]'
                    }`}
                  >
                    {item.mes || '—'}
                  </span>
                </div>
                <div className="pl-1">
                  <span
                    className={`font-black text-black uppercase block leading-none ${
                      !hasObjeto ? 'text-[6.5pt]' : 'text-[5.5pt]'
                    }`}
                  >
                    ANO
                  </span>
                  <span
                    className={`font-mono font-black text-black block leading-tight ${
                      !hasObjeto ? 'text-[15pt]' : 'text-[11pt]'
                    }`}
                  >
                    {item.ano || '—'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 divide-x-2 divide-black items-center">
                <div className="pr-1">
                  <span
                    className={`font-black text-black uppercase block leading-none ${
                      !hasObjeto ? 'text-[6.5pt]' : 'text-[5.5pt]'
                    }`}
                  >
                    PROCESSO
                  </span>
                  <span
                    className={`font-mono font-black text-black block leading-tight tracking-tight ${
                      !hasObjeto ? 'text-[15pt]' : 'text-[10.5pt]'
                    }`}
                  >
                    {item.numeroProcesso || '—'}
                  </span>
                </div>
                <div className="pl-1">
                  <span
                    className={`font-black text-black uppercase block leading-none ${
                      !hasObjeto ? 'text-[6.5pt]' : 'text-[5.5pt]'
                    }`}
                  >
                    ANO
                  </span>
                  <span
                    className={`font-mono font-black text-black block leading-tight ${
                      !hasObjeto ? 'text-[15pt]' : 'text-[11pt]'
                    }`}
                  >
                    {item.ano || '—'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Objeto Descritivo (Quando preenchido, ocupa o centro com nitidez) */}
          {hasObjeto && (
            <div className="border border-black rounded p-1.5 my-0.5 bg-white min-h-0 flex flex-col justify-start">
              <span className="text-[5.5pt] font-black text-black uppercase block mb-0.5 tracking-wider">
                OBJETO / DESCRIÇÃO:
              </span>
              <p
                className={`${getObjetoStyle()} font-medium text-black text-justify hyphens-auto overflow-hidden`}
              >
                {objetoText}
              </p>
            </div>
          )}
        </div>

        {/* Seção de Volumes - Alto Contraste Monocromático */}
        <div className="pt-1.5 border-t-2 border-black flex-shrink-0">
          <div className="grid grid-cols-2 gap-1.5">
            {/* Volume Informado */}
            <div className="border border-black rounded px-1 py-0.5 text-center bg-white">
              <span className="text-[5pt] font-black text-black block uppercase tracking-tight">
                VOL. INFORMADO
              </span>
              <span className="text-[7.5pt] font-bold text-black truncate block">
                {item.volumeInformado || '—'}
              </span>
            </div>

            {/* Volume Calculado */}
            <div className="border-2 border-black rounded px-1 py-0.5 text-center bg-slate-100">
              <span className="text-[5pt] font-black text-black block uppercase tracking-tight">
                VOL. CALCULADO
              </span>
              <span className="text-[8pt] font-black text-black truncate block">
                {item.volumeCalculado || 'Vol. Único'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================= 3. RODAPÉ: RESSALVA JURÍDICA ======================= */}
      <div className="pb-1.5 pt-1 px-2 flex-shrink-0 flex flex-col items-center text-center">
        {/* Texto de ressalva jurídica arquivística */}
        <p className="text-[4.8pt] leading-[6.2pt] text-black text-justify w-full mb-1 font-normal tracking-tight">
          {config.ressalvaJuridica}
        </p>

        {/* Órgão emitente em destaque preto: CONTROLADORIA-GERAL DO MUNICÍPIO DE FAINA */}
        <div className="border-t-2 border-black w-full pt-0.5 flex justify-center">
          <span className="text-[6.5pt] font-black text-black tracking-wider uppercase">
            {nomeInstitucional}
          </span>
        </div>
      </div>
    </div>
  );
};
