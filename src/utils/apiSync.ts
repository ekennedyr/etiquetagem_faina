import type { ArchiveItem, BatchConfig } from '../types/archive';
import { loadStoredItems, saveStoredItems, loadStoredConfig, saveStoredConfig } from './storage';

export interface SyncPayload {
  items: ArchiveItem[];
  config: BatchConfig;
  lastUpdated?: number;
}

export interface NetworkInfo {
  port: number;
  networks: { interface: string; ip: string }[];
  connectedClients: number;
}

type SyncCallback = (data: SyncPayload) => void;
type StatusCallback = (status: 'connected' | 'connecting' | 'offline') => void;

class RealtimeSyncManager {
  private eventSource: EventSource | null = null;
  private pollInterval: number | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private onSyncListeners: Set<SyncCallback> = new Set();
  private onStatusListeners: Set<StatusCallback> = new Set();
  private currentStatus: 'connected' | 'connecting' | 'offline' = 'connecting';
  private lastKnownTimestamp = 0;
  private reconnectTimeout: number | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // 1. BroadcastChannel para sincronização instantânea entre abas no mesmo dispositivo
    try {
      this.broadcastChannel = new BroadcastChannel('etiquetas_faina_sync');
      this.broadcastChannel.onmessage = (event) => {
        if (event.data && Array.isArray(event.data.items)) {
          this.applyIncomingData(event.data, false);
        }
      };
    } catch {
      // Ignora se não suportado
    }

    // 2. Inicia conexão Server-Sent Events (SSE) com o backend local
    this.connectSSE();

    // 3. Fallback de Polling inteligente a cada 2.5s caso o SSE oscile
    this.startPolling();

    // 4. Busca os dados mais recentes na inicialização
    this.fetchLatest();
  }

  private setStatus(status: 'connected' | 'connecting' | 'offline') {
    if (this.currentStatus !== status) {
      this.currentStatus = status;
      this.onStatusListeners.forEach((listener) => listener(status));
    }
  }

  /**
   * Conecta ao endpoint Server-Sent Events (/api/events) do backend local.
   * Permite que qualquer alteração feita no celular apareça no computador em milissegundos.
   */
  private connectSSE() {
    if (typeof window === 'undefined') return;

    try {
      if (this.eventSource) {
        this.eventSource.close();
      }

      this.eventSource = new EventSource('/api/events');

      this.eventSource.onopen = () => {
        this.setStatus('connected');
      };

      this.eventSource.onmessage = (event) => {
        try {
          if (!event.data || event.data.startsWith(':')) return; // ignora pings
          const data: SyncPayload = JSON.parse(event.data);
          if (data && Array.isArray(data.items)) {
            this.applyIncomingData(data, true);
            this.setStatus('connected');
          }
        } catch (err) {
          console.error('Erro ao processar dados SSE:', err);
        }
      };

      this.eventSource.onerror = () => {
        this.setStatus('connecting');
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }

        // Tenta reconectar após 2.5 segundos
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = window.setTimeout(() => {
          this.connectSSE();
        }, 2500);
      };
    } catch {
      this.setStatus('connecting');
    }
  }

  private startPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = window.setInterval(async () => {
      // Se o SSE não estiver ativo ou se o status for connecting/offline, faz polling
      if (!this.eventSource || this.eventSource.readyState !== EventSource.OPEN) {
        await this.fetchLatest();
      }
    }, 2500);
  }

  /**
   * Aplica dados recebidos do servidor e notifica componentes
   */
  private applyIncomingData(data: SyncPayload, broadcastToOtherTabs = true) {
    if (data.lastUpdated && data.lastUpdated <= this.lastKnownTimestamp) {
      return;
    }
    this.lastKnownTimestamp = data.lastUpdated || Date.now();
    saveStoredItems(data.items);
    if (data.config) saveStoredConfig(data.config);

    if (broadcastToOtherTabs && this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(data);
      } catch {}
    }

    this.notifySync(data);
  }

  /**
   * Busca os dados mais recentes do banco de dados local
   */
  public async fetchLatest(): Promise<SyncPayload | null> {
    try {
      const res = await fetch(`/api/data?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data: SyncPayload = await res.json();
        if (data && Array.isArray(data.items)) {
          this.applyIncomingData(data, true);
          this.setStatus('connected');
          return data;
        }
      }
    } catch {
      this.setStatus('offline');
    }
    return null;
  }

  /**
   * Adiciona um novo item (chamado quando o celular clica em 'PRÓXIMO')
   */
  public async addItem(item: ArchiveItem): Promise<boolean> {
    const timestamp = Date.now();
    this.lastKnownTimestamp = timestamp;

    // Atualiza localmente no navegador de imediato para resposta instantânea
    const currentLocal = loadStoredItems();
    const updatedItems = [...currentLocal.filter(i => i.id !== item.id), item];
    saveStoredItems(updatedItems);

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });

      if (res.ok) {
        const serverData: SyncPayload = await res.json();
        if (serverData && Array.isArray(serverData.items)) {
          this.applyIncomingData(serverData, true);
        }
        this.setStatus('connected');
        return true;
      }
    } catch (err) {
      console.warn('Falha ao enviar item para o servidor local:', err);
    }

    // Se falhar o POST por instabilidade momentânea, tenta via PUT completo
    return this.syncAll(updatedItems, loadStoredConfig());
  }

  /**
   * Remove um item do banco de dados local
   */
  public async deleteItem(id: string): Promise<boolean> {
    const currentLocal = loadStoredItems();
    const updatedItems = currentLocal.filter((i) => i.id !== id);
    saveStoredItems(updatedItems);
    this.lastKnownTimestamp = Date.now();

    try {
      const res = await fetch(`/api/items/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        const serverData: SyncPayload = await res.json();
        if (serverData && Array.isArray(serverData.items)) {
          this.applyIncomingData(serverData, true);
        }
        this.setStatus('connected');
        return true;
      }
    } catch (err) {
      console.warn('Falha ao excluir item do servidor local:', err);
    }

    return this.syncAll(updatedItems, loadStoredConfig());
  }

  /**
   * Sincroniza a lista inteira de itens e configurações com o banco de dados local
   */
  public async syncAll(items: ArchiveItem[], config: BatchConfig): Promise<boolean> {
    const timestamp = Date.now();
    this.lastKnownTimestamp = timestamp;

    saveStoredItems(items);
    saveStoredConfig(config);

    const payload: SyncPayload = {
      items,
      config,
      lastUpdated: timestamp,
    };

    // Propaga para outras abas locais
    try {
      this.broadcastChannel?.postMessage(payload);
    } catch {}

    try {
      const res = await fetch('/api/data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        this.setStatus('connected');
        return true;
      }
    } catch {
      this.setStatus('offline');
    }
    return false;
  }

  /**
   * Obtém os endereços IPs da máquina na rede local
   */
  public async getNetworkInfo(): Promise<NetworkInfo | null> {
    try {
      const res = await fetch('/api/network-info', {
        cache: 'no-store',
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return null;
  }

  public onSync(callback: SyncCallback): () => void {
    this.onSyncListeners.add(callback);
    return () => this.onSyncListeners.delete(callback);
  }

  public onStatusChange(callback: StatusCallback): () => void {
    this.onStatusListeners.add(callback);
    callback(this.currentStatus);
    return () => this.onStatusListeners.delete(callback);
  }

  private notifySync(data: SyncPayload) {
    this.onSyncListeners.forEach((listener) => listener(data));
  }
}

export const syncManager = new RealtimeSyncManager();

