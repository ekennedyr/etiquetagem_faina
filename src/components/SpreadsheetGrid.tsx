import React from 'react';
import type {
  ArchiveItem,
  DocCategory,
} from '../types/archive';
import {
  CATEGORIA_LABELS,
  FUNDOS_PADRAO,
  MODALIDADES_LICITACAO,
} from '../types/archive';
import { formatMesNumeral } from '../utils/formatters';
import {
  Copy,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

const OPCOES_MESES_NUMERAIS = [
  { val: '01', label: '01 (Jan)' },
  { val: '02', label: '02 (Fev)' },
  { val: '03', label: '03 (Mar)' },
  { val: '04', label: '04 (Abr)' },
  { val: '05', label: '05 (Mai)' },
  { val: '06', label: '06 (Jun)' },
  { val: '07', label: '07 (Jul)' },
  { val: '08', label: '08 (Ago)' },
  { val: '09', label: '09 (Set)' },
  { val: '10', label: '10 (Out)' },
  { val: '11', label: '11 (Nov)' },
  { val: '12', label: '12 (Dez)' },
];

interface SpreadsheetGridProps {
  items: ArchiveItem[];
  onChangeItem: (id: string, updates: Partial<ArchiveItem>) => void;
  onDeleteItem: (id: string) => void;
  onDuplicateItem: (index: number) => void;
  onInsertBelow: (index: number) => void;
  onMoveItem: (index: number, direction: 'up' | 'down') => void;
}

export const SpreadsheetGrid: React.FC<SpreadsheetGridProps> = ({
  items,
  onChangeItem,
  onDeleteItem,
  onDuplicateItem,
  onInsertBelow,
  onMoveItem,
}) => {
  return (
    <div className="w-full bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden print:hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          {/* Cabeçalho da Tabela */}
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 select-none">
              <th className="py-2.5 px-3 w-12 text-center">#</th>
              <th className="py-2.5 px-3 w-28 text-center">Cód. Pilha</th>
              <th className="py-2.5 px-3 w-44">Categoria</th>
              <th className="py-2.5 px-3 w-56">Fundo / Órgão</th>
              <th className="py-2.5 px-3 w-40">Modalidade / Tipo</th>
              <th className="py-2.5 px-3 w-28">Nº Processo</th>
              <th className="py-2.5 px-3 w-28">Mês / Ano</th>
              <th className="py-2.5 px-3 min-w-[240px]">Objeto / Descrição</th>
              <th className="py-2.5 px-3 w-32 text-center">Vol. Informado</th>
              <th className="py-2.5 px-3 w-32 text-center">Vol. Calculado</th>
              <th className="py-2.5 px-3 w-32 text-center">Ações</th>
            </tr>
          </thead>

          {/* Corpo da Planilha */}
          <tbody className="divide-y divide-slate-200">
            {items.map((item, index) => {
              const isEven = index % 2 === 0;

              return (
                <tr
                  key={item.id}
                  className={`group transition-colors ${
                    isEven ? 'bg-white' : 'bg-slate-50/70'
                  } hover:bg-blue-50/40`}
                >
                  {/* Índice da linha */}
                  <td className="py-2 px-3 text-center text-slate-600 font-mono font-medium">
                    {index + 1}
                  </td>

                  {/* Código de Localização da Pilha */}
                  <td className="py-2 px-2 text-center">
                    <span className="inline-block bg-[#0B3A5E]/10 text-[#0B3A5E] font-mono font-black text-[11px] px-2 py-0.5 rounded border border-[#0B3A5E]/20">
                      {item.codigoLocalizacao || '—'}
                    </span>
                  </td>

                  {/* Categoria do Documento */}
                  <td className="py-2 px-2">
                    <select
                      value={item.categoria}
                      onChange={(e) => {
                        const newCat = e.target.value as DocCategory;
                        const updates: Partial<ArchiveItem> = { categoria: newCat };
                        // Predefinir padrões dependendo da categoria
                        if (newCat === 'licitacao' && !item.modalidade) {
                          updates.modalidade = 'Pregão Eletrônico';
                        } else if (newCat === 'dispensa' && !item.subtipoDispensa) {
                          updates.subtipoDispensa = 'DISPENSA DE LICITAÇÃO';
                        } else if (newCat === 'balancete') {
                          updates.modalidade = undefined;
                        }
                        onChangeItem(item.id, updates);
                      }}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      {Object.entries(CATEGORIA_LABELS).map(([catKey, label]) => (
                        <option key={catKey} value={catKey}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Fundo Municipal */}
                  <td className="py-2 px-2">
                    <div className="relative">
                      <input
                        type="text"
                        list={`fundos-list-${item.id}`}
                        value={item.fundoMunicipal || ''}
                        onChange={(e) =>
                          onChangeItem(item.id, { fundoMunicipal: e.target.value })
                        }
                        placeholder="Selecione ou digite..."
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 placeholder-slate-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                      <datalist id={`fundos-list-${item.id}`}>
                        {FUNDOS_PADRAO.map((fundo) => (
                          <option key={fundo} value={fundo} />
                        ))}
                      </datalist>
                    </div>
                  </td>

                  {/* Modalidade / Tipo específico */}
                  <td className="py-2 px-2">
                    {item.categoria === 'licitacao' ? (
                      <div className="relative">
                        <input
                          type="text"
                          list={`mod-list-${item.id}`}
                          value={item.modalidade || ''}
                          onChange={(e) =>
                            onChangeItem(item.id, { modalidade: e.target.value })
                          }
                          placeholder="Ex: Pregão Eletrônico"
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 font-medium placeholder-slate-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                        <datalist id={`mod-list-${item.id}`}>
                          {MODALIDADES_LICITACAO.map((m) => (
                            <option key={m} value={m} />
                          ))}
                        </datalist>
                      </div>
                    ) : item.categoria === 'dispensa' ? (
                      <select
                        value={item.subtipoDispensa || 'DISPENSA DE LICITAÇÃO'}
                        onChange={(e) =>
                          onChangeItem(item.id, {
                            subtipoDispensa: e.target.value as
                              | 'DISPENSA DE LICITAÇÃO'
                              | 'INEXIGIBILIDADE',
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                        <option value="DISPENSA DE LICITAÇÃO">DISPENSA</option>
                        <option value="INEXIGIBILIDADE">INEXIGIBILIDADE</option>
                      </select>
                    ) : item.categoria === 'outros' ? (
                      <input
                        type="text"
                        value={item.tituloCustomizado || ''}
                        onChange={(e) =>
                          onChangeItem(item.id, { tituloCustomizado: e.target.value })
                        }
                        placeholder="Título do Arquivo..."
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 placeholder-slate-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase"
                      />
                    ) : (
                      <span className="text-slate-600 italic text-[11px] block text-center">
                        —
                      </span>
                    )}
                  </td>

                  {/* Número do Processo */}
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={item.numeroProcesso || ''}
                      onChange={(e) =>
                        onChangeItem(item.id, { numeroProcesso: e.target.value })
                      }
                      placeholder="Ex: 015/2023"
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono text-slate-800 placeholder-slate-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </td>

                  {/* Mês e Ano */}
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-1">
                      {item.categoria === 'balancete' && (
                        <select
                          value={formatMesNumeral(item.mes) === '—' ? '' : formatMesNumeral(item.mes)}
                          onChange={(e) =>
                            onChangeItem(item.id, { mes: e.target.value })
                          }
                          className="w-1/2 bg-white border border-slate-300 rounded px-1 py-1 text-xs font-mono font-bold text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                          <option value="">Mês</option>
                          {OPCOES_MESES_NUMERAIS.map((m) => (
                            <option key={m.val} value={m.val}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      )}
                      <input
                        type="text"
                        value={item.ano || ''}
                        onChange={(e) => onChangeItem(item.id, { ano: e.target.value })}
                        placeholder="Ano"
                        className={`${
                          item.categoria === 'balancete' ? 'w-1/2' : 'w-full'
                        } bg-white border border-slate-300 rounded px-1.5 py-1 text-xs font-mono text-slate-800 placeholder-slate-600 focus:ring-1 focus:ring-blue-500 outline-none`}
                      />
                    </div>
                  </td>

                  {/* Objeto / Descrição */}
                  <td className="py-2 px-2">
                    <textarea
                      rows={1}
                      value={item.objeto || item.observacoes || ''}
                      onChange={(e) =>
                        onChangeItem(item.id, {
                          objeto: e.target.value,
                          observacoes: e.target.value,
                        })
                      }
                      placeholder="Descrição resumida do objeto / conteúdo..."
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 placeholder-slate-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y min-h-[30px]"
                    />
                  </td>

                  {/* Volume Informado (Manual) */}
                  <td className="py-2 px-2 text-center">
                    <input
                      type="text"
                      value={item.volumeInformado || ''}
                      onChange={(e) =>
                        onChangeItem(item.id, { volumeInformado: e.target.value })
                      }
                      placeholder="Ex: Vol. 1"
                      className="w-24 bg-white border border-slate-300 rounded px-2 py-1 text-xs text-center font-medium text-slate-800 placeholder-slate-600 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </td>

                  {/* Volume Calculado (Automático) */}
                  <td className="py-2 px-2 text-center">
                    <span className="inline-block bg-emerald-50 text-emerald-800 font-bold text-[11px] px-2 py-0.5 rounded border border-emerald-200">
                      {item.volumeCalculado || 'Vol. Único'}
                    </span>
                  </td>

                  {/* Ações da Linha */}
                  <td className="py-2 px-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {/* Mover para Cima */}
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => onMoveItem(index, 'up')}
                        title="Mover para cima"
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none rounded hover:bg-slate-100"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Mover para Baixo */}
                      <button
                        type="button"
                        disabled={index === items.length - 1}
                        onClick={() => onMoveItem(index, 'down')}
                        title="Mover para baixo"
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none rounded hover:bg-slate-100"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Duplicar Linha */}
                      <button
                        type="button"
                        onClick={() => onDuplicateItem(index)}
                        title="Duplicar esta linha"
                        className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Inserir Abaixo */}
                      <button
                        type="button"
                        onClick={() => onInsertBelow(index)}
                        title="Inserir nova linha abaixo"
                        className="p-1 text-slate-400 hover:text-emerald-600 rounded hover:bg-emerald-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>

                      {/* Excluir Linha */}
                      <button
                        type="button"
                        disabled={items.length <= 1}
                        onClick={() => onDeleteItem(item.id)}
                        title="Excluir linha"
                        className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:pointer-events-none rounded hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Dica de Produtividade no Rodapé da Planilha */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-3">
          <span>💡 <strong>Dica:</strong> Use as ações de linha para duplicar pastas contínuas do mesmo processo.</span>
        </div>
        <div className="text-slate-600 font-medium">
          O cálculo de volume agrupa automaticamente processos com o mesmo número/ano ou balancetes com mesmo fundo/mês/ano.
        </div>
      </div>
    </div>
  );
};
