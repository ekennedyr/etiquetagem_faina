import type { ArchiveItem, BatchConfig } from '../types/archive';

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
  private isConnected = false;
  private lastKnownTimestamp = 0;
  private isSaving = false;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;
    this.connectSSE();
    this.startPollingFallback();
  }

  private setStatus(status: 'connected' | 'connecting' | 'offline') {
    this.isConnected = status === 'connected';
    this.onStatusListeners.forEach((listener) => listener(status));
  }

  private connectSSE() {
    try {
      if (this.eventSource) {
        this.eventSource.close();
      }

      this.setStatus('connecting');
      const es = new EventSource('/api/events');
      this.eventSource = es;

      es.onopen = () => {
        this.setStatus('connected');
      };

      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload && payload.items) {
            if (payload.lastUpdated && payload.lastUpdated > this.lastKnownTimestamp) {
              this.lastKnownTimestamp = payload.lastUpdated;
              this.notifySync(payload);
            }
          }
        } catch (e) {
          console.error('Erro ao processar mensagem SSE', e);
        }
      };

      es.onerror = () => {
        this.setStatus('offline');
        es.close();
        this.eventSource = null;
        // Tentar reconectar em 3 segundos
        setTimeout(() => {
          this.connectSSE();
        }, 3000);
      };
    } catch {
      this.setStatus('offline');
    }
  }

  private startPollingFallback() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    // Polling a cada 2.5s para garantir sincronização mesmo se SSE oscilar
    this.pollInterval = window.setInterval(() => {
      this.fetchLatest();
    }, 2500);
  }

  public async fetchLatest(): Promise<SyncPayload | null> {
    try {
      const res = await fetch('/api/data', { cache: 'no-store' });
      if (!res.ok) return null;
      const data: SyncPayload = await res.json();
      if (data && data.items && Array.isArray(data.items)) {
        if (!this.lastKnownTimestamp || (data.lastUpdated && data.lastUpdated > this.lastKnownTimestamp)) {
          this.lastKnownTimestamp = data.lastUpdated || Date.now();
          this.notifySync(data);
          if (!this.isConnected) this.setStatus('connected');
        }
        return data;
      }
    } catch {
      // Backend offline ou rodando local sem servidor
    }
    return null;
  }

  public async addItem(item: ArchiveItem): Promise<boolean> {
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        const payload: SyncPayload = await res.json();
        if (payload.lastUpdated) {
          this.lastKnownTimestamp = payload.lastUpdated;
        }
        return true;
      }
    } catch (e) {
      console.warn('Falha ao enviar item para o backend, operando em modo local', e);
    }
    return false;
  }

  public async syncAll(items: ArchiveItem[], config: BatchConfig): Promise<boolean> {
    if (this.isSaving) return false;
    this.isSaving = true;
    try {
      const timestamp = Date.now();
      const res = await fetch('/api/data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, config, lastUpdated: timestamp }),
      });
      if (res.ok) {
        this.lastKnownTimestamp = timestamp;
        return true;
      }
    } catch (e) {
      console.warn('Falha ao sincronizar dados com o backend', e);
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
    return () => this.onStatusListeners.delete(callback);
  }

  private notifySync(data: SyncPayload) {
    this.onSyncListeners.forEach((listener) => listener(data));
  }
}

export const syncManager = new RealtimeSyncManager();
