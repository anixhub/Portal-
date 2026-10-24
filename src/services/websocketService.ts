/**
 * WebSocket Realtime Client Service
 * Menghubungkan aplikasi web secara serentak ke:
 * 1. Local /ws (Node.js dev server bila aktif)
 * 2. Remote wss://attaroqqy.com (Hub WebSocket Realtime Aplikasi Lama SmartSantri)
 * Menjamin perubahan mengalir 2-arah secara instan (0-detik) tanpa lag.
 */

export interface WsMessage {
  type: 'CONNECTED' | 'DATA_CHANGED' | 'REMOTE_DATA_CHANGED' | 'PONG' | 'SYNC_PULSE';
  entity?: 'alumni' | 'events' | 'announcements' | 'comments' | 'attendance' | 'admin' | 'all';
  action?: 'create' | 'update' | 'delete' | 'refresh' | 'rsvp' | 'scan' | 'sync' | 'save' | 'save_user' | 'delete_user';
  id?: string;
  data?: any;
  timestamp?: number;
  total?: number;
  source?: string;
}

type WsStatus = 'connected' | 'connecting' | 'disconnected';
type MessageCallback = (msg: WsMessage) => void;
type StatusCallback = (status: WsStatus) => void;

class WebSocketClientService {
  private localSocket: WebSocket | null = null;
  private remoteSocket: WebSocket | null = null;
  private remoteQueue: string[] = [];
  private messageListeners = new Set<MessageCallback>();
  private statusListeners = new Set<StatusCallback>();
  private currentStatus: WsStatus = 'disconnected';
  private reconnectTimer: any = null;
  private remoteReconnectTimer: any = null;
  private heartbeatTimer: any = null;
  private remoteHeartbeatTimer: any = null;
  private isIntentionallyClosed = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  public getStatus(): WsStatus {
    return this.currentStatus;
  }

  private setStatus(status: WsStatus) {
    if (this.currentStatus !== status) {
      this.currentStatus = status;
      this.statusListeners.forEach((cb) => {
        try {
          cb(status);
        } catch (e) {
          console.error('[WebSocket] Status listener error:', e);
        }
      });
    }
  }

  public connect() {
    if (typeof window === 'undefined') return;
    this.isIntentionallyClosed = false;
    this.connectLocal();
    this.connectRemote();
  }

  /**
   * 1. Hubungkan ke WebSocket Server Lokal / Dev Server (/ws)
   */
  private connectLocal() {
    if (this.localSocket && (this.localSocket.readyState === WebSocket.OPEN || this.localSocket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const isSecure = window.location.protocol === 'https:';
      const wsProtocol = isSecure ? 'wss:' : 'ws:';
      const wsHost = window.location.host;
      const wsUrl = `${wsProtocol}//${wsHost}/ws`;

      this.localSocket = new WebSocket(wsUrl);

      this.localSocket.onopen = () => {
        console.log('[WebSocket] Terkoneksi ke local /ws');
        this.setStatus('connected');
        this.startLocalHeartbeat();
      };

      this.localSocket.onmessage = (event) => {
        try {
          const parsed: WsMessage = JSON.parse(event.data);
          if (parsed.type === 'PONG') return;
          this.emitMessage(parsed);
        } catch (err) {
          console.warn('[WebSocket] Gagal parse JSON lokal:', err);
        }
      };

      this.localSocket.onclose = () => {
        this.stopLocalHeartbeat();
        this.localSocket = null;
        if (!this.isIntentionallyClosed) {
          if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => this.connectLocal(), 3000);
        }
      };

      this.localSocket.onerror = () => {
        // Biarkan onclose yang menangani retry
      };
    } catch (e) {
      if (!this.isIntentionallyClosed) {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.connectLocal(), 4000);
      }
    }
  }

  /**
   * 2. Hubungkan ke WebSocket Hub Aplikasi Lama (wss://attaroqqy.com)
   * Ini adalah saluran utama yang digunakan aplikasi lama untuk menerima pembaruan secara realtime.
   */
  private connectRemote() {
    if (this.remoteSocket && (this.remoteSocket.readyState === WebSocket.OPEN || this.remoteSocket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const remoteUrl = 'wss://attaroqqy.com';
      console.log(`[WebSocket Remote Bridge] Menghubungkan ke ${remoteUrl}...`);
      this.remoteSocket = new WebSocket(remoteUrl);

      this.remoteSocket.onopen = () => {
        console.log('⚡ [WebSocket Remote Bridge] Terhubung ke wss://attaroqqy.com (Aplikasi Lama)!');
        this.setStatus('connected');

        // Flush pesan yang sempat antre
        while (this.remoteQueue.length > 0) {
          const queued = this.remoteQueue.shift();
          if (queued && this.remoteSocket && this.remoteSocket.readyState === WebSocket.OPEN) {
            try {
              this.remoteSocket.send(queued);
            } catch (e) {}
          }
        }

        this.startRemoteHeartbeat();
      };

      this.remoteSocket.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          // Tangani event db_change dari aplikasi lama
          if (raw.type === 'db_change' || raw.event === 'db_change' || raw.action === 'db_change') {
            if (raw.table === 'santri') {
              console.log('⚡ [WebSocket Remote Bridge] Data santri berubah di aplikasi lama!', raw.id);
              const data = raw.data || {};
              const id = raw.id || data.id;

              this.emitMessage({
                type: 'REMOTE_DATA_CHANGED',
                entity: 'alumni',
                action: (raw.action === 'delete' ? 'delete' : 'update') as any,
                id,
                data,
                source: 'attaroqqy_old_app',
                timestamp: Date.now(),
              });
            }
          }
        } catch (e) {}
      };

      this.remoteSocket.onclose = () => {
        this.stopRemoteHeartbeat();
        this.remoteSocket = null;
        if (!this.isIntentionallyClosed) {
          if (this.remoteReconnectTimer) clearTimeout(this.remoteReconnectTimer);
          this.remoteReconnectTimer = setTimeout(() => this.connectRemote(), 2500);
        }
      };

      this.remoteSocket.onerror = () => {
        // Biarkan onclose menangani
      };
    } catch (e) {
      if (!this.isIntentionallyClosed) {
        if (this.remoteReconnectTimer) clearTimeout(this.remoteReconnectTimer);
        this.remoteReconnectTimer = setTimeout(() => this.connectRemote(), 3000);
      }
    }
  }

  private emitMessage(msg: WsMessage) {
    this.messageListeners.forEach((cb) => {
      try {
        cb(msg);
      } catch (err) {
        console.error('[WebSocket] Callback handler error:', err);
      }
    });
  }

  private startLocalHeartbeat() {
    this.stopLocalHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.localSocket && this.localSocket.readyState === WebSocket.OPEN) {
        try {
          this.localSocket.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
        } catch (e) {}
      }
    }, 20000);
  }

  private stopLocalHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private startRemoteHeartbeat() {
    this.stopRemoteHeartbeat();
    this.remoteHeartbeatTimer = setInterval(() => {
      if (this.remoteSocket && this.remoteSocket.readyState === WebSocket.OPEN) {
        try {
          this.remoteSocket.send(JSON.stringify({ type: 'ping' }));
        } catch (e) {}
      }
    }, 12000);
  }

  private stopRemoteHeartbeat() {
    if (this.remoteHeartbeatTimer) {
      clearInterval(this.remoteHeartbeatTimer);
      this.remoteHeartbeatTimer = null;
    }
  }

  /**
   * Kirim mutasi data ke server lokal DAN langsung ke wss://attaroqqy.com
   * agar aplikasi lama seketika mengalir dan ikut berubah tanpa menunggu atau reload.
   */
  public sendMutation(
    entity: 'alumni' | 'events' | 'announcements' | 'comments' | 'attendance' | 'admin' | 'all',
    action: string,
    data?: any,
    id?: string
  ) {
    // 1. Kirim ke local dev server WebSocket (/ws)
    if (this.localSocket && this.localSocket.readyState === WebSocket.OPEN) {
      try {
        this.localSocket.send(
          JSON.stringify({
            type: 'CLIENT_MUTATION',
            entity,
            action,
            id,
            data,
            timestamp: Date.now(),
          })
        );
      } catch (err) {
        console.warn('[WebSocket] Gagal kirim mutasi lokal:', err);
      }
    }

    // 2. Kirim ke WebSocket aplikasi lama (wss://attaroqqy.com)
    if (entity === 'alumni') {
      const targetId = id || data?.id;
      const santriData = data
        ? {
            id: targetId,
            ...data,
            nama: data.name || data.nama || '',
            name: data.name || data.nama || '',
            status_keanggotaan: 'Alumni',
          }
        : { id: targetId, status_keanggotaan: 'Alumni' };

      const oldAppPayload = JSON.stringify({
        type: 'db_change',
        event: 'db_change',
        table: 'santri',
        action: action === 'delete' ? 'delete' : 'update',
        id: targetId,
        data: santriData,
      });

      if (this.remoteSocket && this.remoteSocket.readyState === WebSocket.OPEN) {
        try {
          this.remoteSocket.send(oldAppPayload);
          console.log('⚡ [WebSocket] Berhasil menyiarkan mutasi ke wss://attaroqqy.com untuk aplikasi lama:', targetId);
        } catch (err) {
          console.warn('[WebSocket] Gagal kirim ke remote ws:', err);
          this.remoteQueue.push(oldAppPayload);
        }
      } else {
        this.remoteQueue.push(oldAppPayload);
        this.connectRemote();
      }
    }
  }

  public onMessage(callback: MessageCallback): () => void {
    this.messageListeners.add(callback);
    return () => {
      this.messageListeners.delete(callback);
    };
  }

  public onStatusChange(callback: StatusCallback): () => void {
    this.statusListeners.add(callback);
    callback(this.currentStatus);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  public disconnect() {
    this.isIntentionallyClosed = true;
    this.stopLocalHeartbeat();
    this.stopRemoteHeartbeat();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.remoteReconnectTimer) clearTimeout(this.remoteReconnectTimer);
    if (this.localSocket) {
      this.localSocket.close();
      this.localSocket = null;
    }
    if (this.remoteSocket) {
      this.remoteSocket.close();
      this.remoteSocket = null;
    }
    this.setStatus('disconnected');
  }
}

export const wsClient = new WebSocketClientService();

