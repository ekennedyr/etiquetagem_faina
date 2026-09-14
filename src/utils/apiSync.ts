import type { ArchiveItem, BatchConfig } from '../types/archive';
import { loadStoredItems, saveStoredItems, saveStoredConfig } from './storage';

export interface SyncPayload {
  items: ArchiveItem[];
  config: BatchConfig;
  lastUpdated?: number;
}

type SyncCallback = (data: SyncPayload) => void;
type StatusCallback = (status: 'connected' | 'connecting' | 'offline') => void;

class RealtimeSyncManager {
  private eventSource: EventSource | null = null;
  private pollInterval: number | null = null;
  private onSyncListeners: Set<SyncCallback> = new Set();
  private onStatusListeners: Set<StatusCallback> = new Set();
  private currentStatus: 'connected' | 'connecting' | 'offline' = 'connecting';
  private lastKnownTimestamp = 0;
  private consecutiveErrors = 0;
  private isSaving = false;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // 1. Busca dados imediatamente ao iniciar
    this.fetchLatest();

    // 2. Conecta SSE para atualizações em tempo real (milissegundos)
    this.connectSSE();

    // 3. Polling ultrarrápido a cada 1.5s como garantia total (à prova de falhas de rede)
    this.startPolling();
  }

  private setStatus(status: 'connected' | 'connecting' | 'offline') {
    if (this.currentStatus !== status) {
      this.currentStatus = status;
      this.onStatusListeners.forEach((listener) => listener(status));
    }
  }

  private connectSSE() {
    try {
      if (this.eventSource) {
        this.eventSource.close();
      }

      const es = new EventSource('/api/events');
      this.eventSource = es;

      es.onopen = () => {
        this.consecutiveErrors = 0;
        this.setStatus('connected');
      };

      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload && Array.isArray(payload.items)) {
            this.consecutiveErrors = 0;
            this.setStatus('connected');
            if (payload.lastUpdated && payload.lastUpdated > this.lastKnownTimestamp) {
              this.lastKnownTimestamp = payload.lastUpdated;
              saveStoredItems(payload.items);
              if (payload.config) saveStoredConfig(payload.config);
              this.notifySync(payload);
            }
          }
        } catch (e) {
          console.error('Erro ao ler evento SSE', e);
        }
      };

      es.onerror = () => {
        // Não marca offline imediatamente ao desconectar SSE, pois o polling HTTP continua mantendo online
        es.close();
        this.eventSource = null;
        // Tenta reconectar em 5 segundos
        setTimeout(() => {
          this.connectSSE();
        }, 5000);
      };
    } catch {
      // Ignora erro no SSE, fallback HTTP cuidará da sincronização
    }
  }

  private startPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    // Polling a cada 1.5 segundos
    this.pollInterval = window.setInterval(() => {
      this.fetchLatest();
    }, 1500);
  }

  public async fetchLatest(): Promise<SyncPayload | null> {
    try {
      const res = await fetch(`/api/data?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      if (res.ok) {
        const data: SyncPayload = await res.json();
        if (data && Array.isArray(data.items)) {
          this.consecutiveErrors = 0;
          this.setStatus('connected');

          if (!this.lastKnownTimestamp || (data.lastUpdated && data.lastUpdated > this.lastKnownTimestamp)) {
            this.lastKnownTimestamp = data.lastUpdated || Date.now();
            saveStoredItems(data.items);
            if (data.config) saveStoredConfig(data.config);
            this.notifySync(data);
          }
          return data;
        }
      } else {
        this.handleFetchError();
      }
    } catch {
      this.handleFetchError();
    }
    return null;
  }

  private handleFetchError() {
    this.consecutiveErrors++;
    // Se falhar 3 vezes seguidas no HTTP (após ~4.5 segundos), marca offline
    if (this.consecutiveErrors >= 3) {
      this.setStatus('offline');
    }
  }

  public async addItem(item: ArchiveItem): Promise<boolean> {
    // 1. Garante que fique salvo no localStorage local imediatamente
    const currentLocal = loadStoredItems();
    saveStoredItems([...currentLocal, item]);

    // 2. Envia para o banco de dados do servidor
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(item),
      });

      if (res.ok) {
        const payload: SyncPayload = await res.json();
        this.consecutiveErrors = 0;
        this.setStatus('connected');
        if (payload.lastUpdated) {
          this.lastKnownTimestamp = payload.lastUpdated;
        }
        return true;
      }
    } catch (e) {
      console.warn('Falha ao enviar item para o backend remoto', e);
      this.handleFetchError();
    }
    return false;
  }

  public async syncAll(items: ArchiveItem[], config: BatchConfig): Promise<boolean> {
    if (this.isSaving) return false;
    this.isSaving = true;

    // Salva no localStorage local
    saveStoredItems(items);
    saveStoredConfig(config);

    try {
      const timestamp = Date.now();
      const res = await fetch('/api/data', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ items, config, lastUpdated: timestamp }),
      });

      if (res.ok) {
        this.lastKnownTimestamp = timestamp;
        this.consecutiveErrors = 0;
        this.setStatus('connected');
        return true;
      }
    } catch (e) {
      console.warn('Falha ao sincronizar dados com o backend', e);
      this.handleFetchError();
    } finally {
      this.isSaving = false;
    }
    return false;
  }

  public onSync(callback: SyncCallback): () => void {
    this.onSyncListeners.add(callback);
    return () => this.onSyncListeners.delete(callback);
  }

  public onStatusChange(callback: StatusCallback): () => void {
    this.onStatusListeners.add(callback);
    // Dispara o status atual imediatamente para quem se inscreveu
    callback(this.currentStatus);
    return () => this.onStatusListeners.delete(callback);
  }

  private notifySync(data: SyncPayload) {
    this.onSyncListeners.forEach((listener) => listener(data));
  }
}

export const syncManager = new RealtimeSyncManager();
