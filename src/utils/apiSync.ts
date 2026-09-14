import type { ArchiveItem, BatchConfig } from '../types/archive';
import { loadStoredItems, saveStoredItems, saveStoredConfig } from './storage';

export interface SyncPayload {
  items: ArchiveItem[];
  config: BatchConfig;
  lastUpdated?: number;
}

type SyncCallback = (data: SyncPayload) => void;
type StatusCallback = (status: 'connected' | 'connecting' | 'offline') => void;

const CLOUD_SYNC_TOPIC = 'faina_cgm_etiquetas_realtime_v1';
const CLOUD_SYNC_PUB_URL = `https://ntfy.sh/${CLOUD_SYNC_TOPIC}`;
const CLOUD_SYNC_SSE_URL = `https://ntfy.sh/${CLOUD_SYNC_TOPIC}/sse`;
const CLOUD_SYNC_POLL_URL = `https://ntfy.sh/${CLOUD_SYNC_TOPIC}/json?poll=1&since=12h`;

class RealtimeSyncManager {
  private localEventSource: EventSource | null = null;
  private cloudEventSource: EventSource | null = null;
  private pollInterval: number | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private onSyncListeners: Set<SyncCallback> = new Set();
  private onStatusListeners: Set<StatusCallback> = new Set();
  private currentStatus: 'connected' | 'connecting' | 'offline' = 'connecting';
  private lastKnownTimestamp = 0;
  private isPublishing = false;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // 1. BroadcastChannel para sincronizar abas no mesmo navegador
    try {
      this.broadcastChannel = new BroadcastChannel('etiquetas_faina_sync');
      this.broadcastChannel.onmessage = (event) => {
        if (event.data && Array.isArray(event.data.items)) {
          this.applyIncomingData(event.data);
        }
      };
    } catch {
      // Ignora se não suportado
    }

    // 2. Conecta canais de tempo real
    this.connectLocalSSE();
    this.connectCloudRealtime();

    // 3. Busca dados mais recentes
    this.fetchInitial();

    // 4. Polling periódico de garantia a cada 2 segundos
    this.startPolling();
  }

  private setStatus(status: 'connected' | 'connecting' | 'offline') {
    if (this.currentStatus !== status) {
      this.currentStatus = status;
      this.onStatusListeners.forEach((listener) => listener(status));
    }
  }

  private async fetchInitial() {
    // Tenta primeiro no backend local
    const localOk = await this.fetchLocalData();
    if (!localOk) {
      // Se o backend local for estático/Caddy, busca no canal cloud
      await this.fetchCloudData();
    }
  }

  private connectLocalSSE() {
    try {
      if (this.localEventSource) this.localEventSource.close();
      const es = new EventSource('/api/events');
      this.localEventSource = es;

      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload && Array.isArray(payload.items)) {
            this.applyIncomingData(payload);
            this.setStatus('connected');
          }
        } catch {
          // Ignora se for HTML (Caddy static)
        }
      };

      es.onerror = () => {
        es.close();
        this.localEventSource = null;
      };
    } catch {
      // Ignora erro no SSE local
    }
  }

  private connectCloudRealtime() {
    try {
      if (this.cloudEventSource) this.cloudEventSource.close();
      const es = new EventSource(CLOUD_SYNC_SSE_URL);
      this.cloudEventSource = es;

      es.onopen = () => {
        this.setStatus('connected');
      };

      es.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          if (raw && raw.event === 'message' && raw.message) {
            const payload: SyncPayload = JSON.parse(raw.message);
            if (payload && Array.isArray(payload.items)) {
              this.applyIncomingData(payload);
              this.setStatus('connected');
            }
          }
        } catch {
          // Ignora mensagens de controle
        }
      };

      es.onerror = () => {
        es.close();
        this.cloudEventSource = null;
        setTimeout(() => this.connectCloudRealtime(), 4000);
      };
    } catch {
      // Ignora
    }
  }

  private startPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = window.setInterval(async () => {
      const localOk = await this.fetchLocalData();
      if (!localOk) {
        await this.fetchCloudData();
      }
    }, 2000);
  }

  private async fetchLocalData(): Promise<boolean> {
    try {
      const res = await fetch(`/api/data?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });

      const contentType = res.headers.get('content-type') || '';
      // Só processa se o servidor realmente retornou JSON (e não a página HTML do Caddy)
      if (res.ok && contentType.includes('application/json')) {
        const data: SyncPayload = await res.json();
        if (data && Array.isArray(data.items)) {
          this.applyIncomingData(data);
          this.setStatus('connected');
          return true;
        }
      }
    } catch {
      // Fallback para cloud
    }
    return false;
  }

  private async fetchCloudData(): Promise<boolean> {
    try {
      const res = await fetch(`${CLOUD_SYNC_POLL_URL}&_t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const text = await res.text();
        const lines = text.trim().split('\n');
        // Lê a última mensagem válida publicada no canal
        for (let i = lines.length - 1; i >= 0; i--) {
          try {
            const raw = JSON.parse(lines[i]);
            if (raw && raw.message) {
              const payload: SyncPayload = JSON.parse(raw.message);
              if (payload && Array.isArray(payload.items)) {
                this.applyIncomingData(payload);
                this.setStatus('connected');
                return true;
              }
            }
          } catch {
            continue;
          }
        }
        this.setStatus('connected');
      }
    } catch {
      this.setStatus('offline');
    }
    return false;
  }

  public async fetchLatest(): Promise<void> {
    await this.fetchInitial();
  }

  private applyIncomingData(data: SyncPayload) {
    if (data.lastUpdated && data.lastUpdated <= this.lastKnownTimestamp) {
      return;
    }
    this.lastKnownTimestamp = data.lastUpdated || Date.now();
    saveStoredItems(data.items);
    if (data.config) saveStoredConfig(data.config);
    this.notifySync(data);
  }

  public async addItem(item: ArchiveItem): Promise<boolean> {
    const currentLocal = loadStoredItems();
    const updatedItems = [...currentLocal, item];
    const timestamp = Date.now();
    this.lastKnownTimestamp = timestamp;

    // Salva localmente
    saveStoredItems(updatedItems);

    const payload: SyncPayload = {
      items: updatedItems,
      config: loadStoredItems ? (window as any).__batchConfig || {} : ({} as any),
      lastUpdated: timestamp,
    };

    return this.broadcastPayload(payload);
  }

  public async syncAll(items: ArchiveItem[], config: BatchConfig): Promise<boolean> {
    if (this.isPublishing) return false;
    this.isPublishing = true;

    const timestamp = Date.now();
    this.lastKnownTimestamp = timestamp;

    saveStoredItems(items);
    saveStoredConfig(config);

    const payload: SyncPayload = {
      items,
      config,
      lastUpdated: timestamp,
    };

    try {
      return await this.broadcastPayload(payload);
    } finally {
      this.isPublishing = false;
    }
  }

  private async broadcastPayload(payload: SyncPayload): Promise<boolean> {
    // 1. BroadcastChannel para outras abas locais
    try {
      this.broadcastChannel?.postMessage(payload);
    } catch {}

    let sent = false;

    // 2. Envia para o backend local (se container Node estiver rodando)
    try {
      const res = await fetch('/api/data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        sent = true;
      }
    } catch {}

    // 3. Publica no canal em nuvem em tempo real (para celular ⇄ computador direto via internet)
    try {
      const cloudRes = await fetch(CLOUD_SYNC_PUB_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body: JSON.stringify(payload),
      });
      if (cloudRes.ok) {
        sent = true;
        this.setStatus('connected');
      }
    } catch (e) {
      console.warn('Falha na sincronização em nuvem', e);
    }

    return sent;
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
