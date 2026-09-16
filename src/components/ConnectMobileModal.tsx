import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Wifi,
  Copy,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Radio,
} from 'lucide-react';
import { syncManager, type NetworkInfo } from '../utils/apiSync';

interface ConnectMobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncStatus: 'connected' | 'connecting' | 'offline';
}

export const ConnectMobileModal: React.FC<ConnectMobileModalProps> = ({
  isOpen,
  onClose,
  syncStatus,
}) => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedIp, setSelectedIp] = useState<string>('');

  const loadNetwork = async () => {
    setIsLoading(true);
    const info = await syncManager.getNetworkInfo();
    if (info) {
      setNetworkInfo(info);
      if (info.networks && info.networks.length > 0) {
        setSelectedIp(info.networks[0].ip);
      }
    } else {
      // Fallback usando o hostname atual caso o endpoint não responda
      const host = window.location.hostname;
      const port = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
      setSelectedIp(host !== 'localhost' ? host : '192.168.x.x');
      setNetworkInfo({
        port: parseInt(port) || 3000,
        networks: [{ interface: 'Rede Local (Wi-Fi / Ethernet)', ip: host }],
        connectedClients: 1,
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadNetwork();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPort = networkInfo?.port || window.location.port || '3000';
  const mobileUrl = selectedIp
    ? `http://${selectedIp}:${currentPort}/#/formulario`
    : `${window.location.origin}/#/formulario`;

  // Gerador de QR Code
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    mobileUrl
  )}&margin=1`;

  const handleCopyLink = (url: string, index: number) => {
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Cabeçalho do Modal */}
        <div className="px-5 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                Conectar Celular em Tempo Real
              </h2>
              <p className="text-xs text-slate-400">
                O que for digitado no celular vai para esta tela na hora!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-5 flex flex-col gap-5 max-h-[80vh] overflow-y-auto">
          {/* Status do Banco de Dados Local */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Radio
                className={`w-4 h-4 ${
                  syncStatus === 'connected'
                    ? 'text-emerald-400 animate-pulse'
                    : 'text-amber-400'
                }`}
              />
              <div>
                <p className="text-xs font-bold text-white">
                  Banco de Dados Local Ativo
                </p>
                <p className="text-[11px] text-slate-400">
                  {syncStatus === 'connected'
                    ? 'Sincronização instantânea pronta (Server-Sent Events)'
                    : 'Aguardando conexão...'}
                </p>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                syncStatus === 'connected'
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/40'
                  : 'bg-amber-950/80 text-amber-300 border-amber-600/40'
              }`}
            >
              {syncStatus === 'connected' ? 'Ao Vivo 🟢' : 'Conectando 🟡'}
            </span>
          </div>

          {/* QR Code e Instruções */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
            {/* Box do QR Code */}
            <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-md">
              {isLoading ? (
                <div className="w-44 h-44 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
              ) : (
                <img
                  src={qrCodeUrl}
                  alt="QR Code para conectar o formulário no celular"
                  className="w-44 h-44 object-contain"
                />
              )}
              <span className="text-[10px] font-bold text-slate-700 mt-1">
                Aponte a câmera do celular
              </span>
            </div>

            {/* Passo a Passo */}
            <div className="flex flex-col gap-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  Certifique-se de que o <strong>celular e o computador</strong> estão na <strong>mesma rede Wi-Fi</strong>.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  Abra a câmera do celular e <strong>escaneie o QR Code</strong> ao lado.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </span>
                <p>
                  Pronto! Preencha as pastas no celular e clique em <strong>PRÓXIMO</strong> — aparecerá aqui na tela instantaneamente!
                </p>
              </div>
            </div>
          </div>

          {/* Links e IPs Disponíveis */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-blue-400" />
                Endereço de Acesso Direto (Link no Navegador):
              </label>
              <button
                type="button"
                onClick={loadNetwork}
                className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                title="Recarregar endereços IP"
              >
                <RefreshCw className="w-3 h-3" />
                Atualizar
              </button>
            </div>

            {networkInfo?.networks && networkInfo.networks.length > 0 ? (
              networkInfo.networks.map((net, idx) => {
                const url = `http://${net.ip}:${currentPort}/#/formulario`;
                const isSelected = selectedIp === net.ip;

                return (
                  <div
                    key={net.ip + idx}
                    onClick={() => setSelectedIp(net.ip)}
                    className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-950/60 border-blue-500/60 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-emerald-400 truncate">
                          {url}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] bg-blue-600 text-white font-bold px-1.5 py-0.2 rounded flex-shrink-0">
                            Selecionado
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 truncate block">
                        {net.interface}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyLink(url, idx);
                        }}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        title="Copiar link"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[10px] text-emerald-400 font-bold">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[10px]">Copiar</span>
                          </>
                        )}
                      </button>

                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                        title="Testar em nova aba"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-emerald-400">{mobileUrl}</span>
                <button
                  type="button"
                  onClick={() => handleCopyLink(mobileUrl, 0)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Copiar</span>
                </button>
              </div>
            )}
          </div>

          {/* Dica de Segurança / Uso Local */}
          <div className="bg-blue-950/40 border border-blue-800/40 rounded-xl p-3 flex items-center gap-2.5 text-xs text-blue-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <p className="text-[11px] leading-relaxed">
              O banco de dados é salvo diretamente no arquivo <strong>data/database.json</strong> deste computador. Nenhuma informação é enviada para servidores de terceiros.
            </p>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="px-5 py-3 bg-slate-800/80 border-t border-slate-700 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
          >
            Entendido / Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
