/**
 * WebSocket Realtime Client Service
 * Menghubungkan aplikasi web ke WebSocket Server di Node.js Express (server.ts)
 * Menangani sinkronisasi dua arah secara realtime, auto-reconnect, dan heartbeat.
 */

export interface WsMessage {
  type: 'CONNECTED' | 'DATA_CHANGED' | 'REMOTE_DATA_CHANGED' | 'PONG' | 'SYNC_PULSE';
  entity?: 'alumni' | 'events' | 'announcements' | 'comments' | 'attendance' | 'all';
  action?: 'create' | 'update' | 'delete' | 'refresh' | 'rsvp' | 'scan' | 'sync';
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
  private socket: WebSocket | null = null;
  private messageListeners = new Set<MessageCallback>();
  private statusListeners = new Set<StatusCallback>();
  private currentStatus: WsStatus = 'disconnected';
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;
  private reconnectAttempts = 0;
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
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isIntentionallyClosed = false;
    this.setStatus('connecting');

    try {
      const isSecure = window.location.protocol === 'https:';
      const wsProtocol = isSecure ? 'wss:' : 'ws:';
      const wsHost = window.location.host;
      const wsUrl = `${wsProtocol}//${wsHost}/ws`;

      console.log(`[WebSocket] Menghubungkan ke ${wsUrl}...`);
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('[WebSocket] Terkoneksi secara Realtime!');
        this.setStatus('connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
      };

      this.socket.onmessage = (event) => {
        try {
          const parsed: WsMessage = JSON.parse(event.data);
          if (parsed.type === 'PONG') {
            return;
          }

          console.log('[WebSocket] Pesan Realtime diterima:', parsed.entity, parsed.action, parsed.type);
          this.messageListeners.forEach((cb) => {
            try {
              cb(parsed);
            } catch (err) {
              console.error('[WebSocket] Callback handler error:', err);
            }
          });
        } catch (err) {
          console.warn('[WebSocket] Gagal parse JSON pesan:', err);
        }
      };

      this.socket.onclose = () => {
        this.stopHeartbeat();
        this.setStatus('disconnected');
        this.socket = null;

        if (!this.isIntentionallyClosed) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = (err) => {
        console.warn('[WebSocket] Error jaringan:', err);
        // Biarkan onclose yang memicu reconnect
      };
    } catch (e) {
      console.warn('[WebSocket] Gagal inisiasi socket:', e);
      this.setStatus('disconnected');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectAttempts++;
    // Interval reconnect 2 - 5 detik
    const delay = Math.min(2000 + this.reconnectAttempts * 500, 5000);
    console.log(`[WebSocket] Menjadwalkan koneksi ulang dalam ${delay}ms...`);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        try {
          this.socket.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
        } catch (e) {}
      }
    }, 20000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Kirim mutasi data dari client agar langsung disiarkan server ke semua client lain
   */
  public sendMutation(entity: 'alumni' | 'events' | 'announcements' | 'comments' | 'attendance', action: string, data?: any, id?: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(
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
        console.warn('[WebSocket] Gagal kirim mutasi:', err);
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
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.setStatus('disconnected');
  }
}

export const wsClient = new WebSocketClientService();
