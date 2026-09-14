import type { ArchiveItem, BatchConfig } from '../types/archive';
import { loadStoredItems, saveStoredItems, loadStoredConfig, saveStoredConfig } from './storage';

export interface SyncPayload {
  items: ArchiveItem[];
  config: BatchConfig;
  lastUpdated?: number;
}

type SyncCallback = (data: SyncPayload) => void;
type StatusCallback = (status: 'connected' | 'connecting' | 'offline') => void;

// Endpoint persistente em nuvem com alta disponibilidade e suporte a CORS nativo
const CLOUD_SYNC_OBJECT_ID = 'ff808181a09d98f701a0a13d321e072a';
const CLOUD_SYNC_URL = `https://api.restful-api.dev/objects/${CLOUD_SYNC_OBJECT_ID}`;

class RealtimeSyncManager {
  private pollInterval: number | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private onSyncListeners: Set<SyncCallback> = new Set();
  private onStatusListeners: Set<StatusCallback> = new Set();
  private currentStatus: 'connected' | 'connecting' | 'offline' = 'connecting';
  private lastKnownTimestamp = 0;
  private isPushing = false;

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
          this.applyIncomingData(event.data);
        }
      };
    } catch {
      // Ignora se não suportado
    }

    // 2. Sincronização inicial inteligente
    this.performInitialSync();

    // 3. Polling em tempo real a cada 1.5s
    this.startPolling();
  }

  private setStatus(status: 'connected' | 'connecting' | 'offline') {
    if (this.currentStatus !== status) {
      this.currentStatus = status;
      this.onStatusListeners.forEach((listener) => listener(status));
    }
  }

  /**
   * Sincronização inicial:
   * Carrega os dados locais e compara com a nuvem. Se o dispositivo local tiver registros
   * (ex: 5 itens cadastrados no celular), garante que eles subam para a nuvem caso a nuvem esteja vazia/antiga.
   */
  private async performInitialSync() {
    const localItems = loadStoredItems();
    const localConfig = loadStoredConfig();

    try {
      const cloudData = await this.fetchCloudData();

      if (cloudData && Array.isArray(cloudData.items)) {
        // Se a nuvem tem mais itens ou é mais recente, adota a nuvem
        if (cloudData.items.length > localItems.length || (cloudData.lastUpdated || 0) > this.lastKnownTimestamp) {
          this.applyIncomingData(cloudData);
        } else if (localItems.length > 0 && cloudData.items.length < localItems.length) {
          // Se o dispositivo local tem mais itens (ex: usuário cadastrou no celular antes do PC abrir), envia para a nuvem
          await this.pushToCloud({
            items: localItems,
            config: localConfig,
            lastUpdated: Date.now(),
          });
        }
      } else if (localItems.length > 0) {
        // Se a nuvem não retornou nada, envia os locais
        await this.pushToCloud({
          items: localItems,
          config: localConfig,
          lastUpdated: Date.now(),
        });
      }

      this.setStatus('connected');
    } catch {
      this.setStatus('offline');
    }
  }

  private startPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = window.setInterval(async () => {
      // Tenta primeiro no backend local caso esteja rodando Node.js
      const localOk = await this.fetchLocalData();
      if (!localOk) {
        await this.fetchAndApplyCloud();
      }
    }, 1500);
  }

  private async fetchLocalData(): Promise<boolean> {
    try {
      const res = await fetch(`/api/data?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data: SyncPayload = await res.json();
        if (data && Array.isArray(data.items)) {
          this.applyIncomingData(data);
          this.setStatus('connected');
          return true;
        }
      }
    } catch {
      // Ignora erro no backend local e segue para a nuvem
    }
    return false;
  }

  private async fetchCloudData(): Promise<SyncPayload | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      const res = await fetch(`${CLOUD_SYNC_URL}?_t=${Date.now()}`, {
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json && json.data && Array.isArray(json.data.items)) {
          return json.data as SyncPayload;
        }
      }
    } catch {
      clearTimeout(timeoutId);
    }
    return null;
  }

  private async fetchAndApplyCloud() {
    if (this.isPushing) return;

    try {
      const cloudPayload = await this.fetchCloudData();
      if (cloudPayload && Array.isArray(cloudPayload.items)) {
        this.applyIncomingData(cloudPayload);
        this.setStatus('connected');
      }
    } catch {
      this.setStatus('offline');
    }
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

  public async fetchLatest(): Promise<void> {
    await this.performInitialSync();
  }

  public async addItem(item: ArchiveItem): Promise<boolean> {
    const currentLocal = loadStoredItems();
    const currentConfig = loadStoredConfig();
    const updatedItems = [...currentLocal, item];
    const timestamp = Date.now();
    this.lastKnownTimestamp = timestamp;

    // Salva localmente de imediato
    saveStoredItems(updatedItems);

    const payload: SyncPayload = {
      items: updatedItems,
      config: currentConfig,
      lastUpdated: timestamp,
    };

    return this.broadcastPayload(payload);
  }

  public async syncAll(items: ArchiveItem[], config: BatchConfig): Promise<boolean> {
    if (this.isPushing) return false;

    const timestamp = Date.now();
    this.lastKnownTimestamp = timestamp;

    saveStoredItems(items);
    saveStoredConfig(config);

    const payload: SyncPayload = {
      items,
      config,
      lastUpdated: timestamp,
    };

    return this.broadcastPayload(payload);
  }

  private async broadcastPayload(payload: SyncPayload): Promise<boolean> {
    // 1. BroadcastChannel para outras abas no mesmo navegador
    try {
      this.broadcastChannel?.postMessage(payload);
    } catch {}

    // 2. Envia para o backend local caso disponível
    try {
      fetch('/api/data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    } catch {}

    // 3. Envia para a nuvem de alta disponibilidade (computador ⇄ celular em tempo real)
    return this.pushToCloud(payload);
  }

  private async pushToCloud(payload: SyncPayload): Promise<boolean> {
    this.isPushing = true;
    try {
      const res = await fetch(CLOUD_SYNC_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'etiquetas_faina_cgm_dataset',
          data: payload,
        }),
      });

      if (res.ok) {
        this.setStatus('connected');
        return true;
      }
    } catch (e) {
      console.warn('Falha ao sincronizar nuvem:', e);
      this.setStatus('offline');
    } finally {
      this.isPushing = false;
    }
    return false;
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
