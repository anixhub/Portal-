import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory cache for live santri data
let cachedSantriData: any = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds cache to prevent repeated remote overhead

// Load local fallback snapshot if available
let localSnapshot: any = null;
const snapshotPath = path.resolve(__dirname, 'src/data/santri_snapshot.json');
try {
  if (fs.existsSync(snapshotPath)) {
    const raw = fs.readFileSync(snapshotPath, 'utf-8');
    localSnapshot = JSON.parse(raw);
    cachedSantriData = localSnapshot; // Pre-seed in-memory cache with snapshot for instant response
    console.log('[Server] Local santri snapshot loaded successfully with', localSnapshot.data?.length, 'items');
  }
} catch (err) {
  console.info('[Server] Local snapshot not loaded:', err);
}

// Load Rembang & Sedan wilayah dataset for instant and offline response
let rembangWilayahData: any = null;
try {
  const rembangPath = path.resolve(__dirname, 'src/data/rembangWilayahData.json');
  if (fs.existsSync(rembangPath)) {
    rembangWilayahData = JSON.parse(fs.readFileSync(rembangPath, 'utf-8'));
    console.log('[Server] Rembang wilayah data loaded successfully');
  }
} catch (err) {
  console.info('[Server] Rembang wilayah data not loaded:', err);
}

// Function to fetch live santri data with timeout and fallback
async function getSantriData(forceFresh: boolean = false): Promise<any> {
  const now = Date.now();
  if (!forceFresh && cachedSantriData && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedSantriData;
  }

  const urlsToTry = [
    `https://alumni.attaroqqy.com/api_alumni.php?action=get_alumni&_t=${now}`,
    `https://attaroqqy.com/api/db/santri?_t=${now}`,
  ];

  for (const url of urlsToTry) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'AttaroqqyPortal/1.0',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) continue;

        const data = await response.json();
        if (data && (Array.isArray(data) || Array.isArray(data.data))) {
          cachedSantriData = data;
          lastCacheTime = Date.now();
          console.log(`[Server] Fetched fresh santri data from ${url} (`, data.data?.length || data.length, 'records )');
          return cachedSantriData;
        }
      }
    } catch (err: any) {
      console.log(`[Server] Note: fetch from ${url} (${err?.message || 'offline'}), using cached data.`);
    }
  }

  // Fallback to cache or snapshot
  if (cachedSantriData) return cachedSantriData;
  if (localSnapshot) return localSnapshot;

  return { success: true, data: [] };
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });
  const wsClients = new Set<WebSocket>();

  // WebSocket Server Connection Handler
  wss.on('connection', (ws: WebSocket) => {
    wsClients.add(ws);
    (ws as any).isAlive = true;
    console.log(`[WebSocket] Client connected. Active clients: ${wsClients.size}`);

    ws.on('pong', () => {
      (ws as any).isAlive = true;
    });

    ws.send(JSON.stringify({
      type: 'CONNECTED',
      timestamp: Date.now(),
      totalCached: cachedSantriData?.data?.length || localSnapshot?.data?.length || 0,
      message: 'Terkoneksi ke WebSocket Server Realtime Portal Alumni At-Taroqqy',
    }));

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
        } else if (msg.type === 'CLIENT_MUTATION') {
          // Relai mutasi data dari client ini ke client lainnya
          broadcastWs({
            type: 'DATA_CHANGED',
            entity: msg.entity || 'alumni',
            action: msg.action || 'update',
            id: msg.id,
            data: msg.data,
            timestamp: Date.now(),
          }, ws);
        }
      } catch (e) {}
    });

    ws.on('close', () => {
      wsClients.delete(ws);
      console.log(`[WebSocket] Client disconnected. Active clients: ${wsClients.size}`);
    });

    ws.on('error', (err) => {
      console.warn('[WebSocket] Error pada client:', err.message);
      wsClients.delete(ws);
    });
  });

  // Heartbeat ping interval setiap 25 detik
  const wsHeartbeatInterval = setInterval(() => {
    for (const ws of wsClients) {
      if ((ws as any).isAlive === false) {
        wsClients.delete(ws);
        ws.terminate();
        continue;
      }
      (ws as any).isAlive = false;
      try {
        ws.ping();
      } catch (e) {
        wsClients.delete(ws);
      }
    }
  }, 25000);

  // Upgrade HTTP to WebSocket for /ws path
  httpServer.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
    if (pathname === '/ws' || pathname === '/ws/') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  // Fungsi broadcast ke seluruh client WebSocket
  function broadcastWs(payload: object, excludeWs?: WebSocket) {
    const message = JSON.stringify(payload);
    for (const ws of wsClients) {
      if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
        } catch (err) {
          console.warn('[WebSocket] Gagal mengirim pesan ke client:', err);
        }
      }
    }
  }

  // ==========================================
  // REALTIME 2-WAY SYNC: HOSTINGER / APLIKASI SEBELUMNYA <-> APLIKASI INI
  // ==========================================
  let lastRemoteHash: string = '';
  let isCheckingRemote = false;

  async function checkRemoteDatabaseSync() {
    if (isCheckingRemote) return;
    isCheckingRemote = true;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`https://alumni.attaroqqy.com/api_alumni.php?action=get_sync_status&_t=${Date.now()}`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.hash) {
          if (!lastRemoteHash) {
            lastRemoteHash = json.hash;
            return;
          }

          if (json.hash !== lastRemoteHash) {
            console.log(`[Realtime 2-Way Sync] Perubahan terdeteksi di database Hostinger / aplikasi sebelumnya! (Hash baru: ${json.hash})`);
            lastRemoteHash = json.hash;

            // Ambil data alumni terbaru secara paksa
            const fresh = await getSantriData(true);

            // Broadcast sinyal REMOTE_DATA_CHANGED ke seluruh client WebSocket aktif
            broadcastWs({
              type: 'REMOTE_DATA_CHANGED',
              entity: 'all',
              action: 'sync',
              total: fresh?.data?.length || 0,
              timestamp: Date.now(),
            });
          }
        }
      }
    } catch (err) {
      // Abaikan jika network delay/offline sesaat
    } finally {
      isCheckingRemote = false;
    }
  }

  // Polling deteksi perubahan dari aplikasi sebelumnya setiap 3.5 detik
  const remoteSyncPoller = setInterval(checkRemoteDatabaseSync, 3500);

  // Port resolution: Dev server must run on port 3000
  let port = 3000;
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    port = parseInt(process.argv[portArgIndex + 1], 10);
  } else if (process.env.NODE_ENV === 'production' && process.env.PORT) {
    port = parseInt(process.env.PORT, 10);
  }
  const PORT = port;

  // Middleware
  app.use(express.json({ limit: '10mb' }));

  // CORS headers
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Health and Status API
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasSnapshot: !!localSnapshot,
      cachedRecords: cachedSantriData?.data?.length || localSnapshot?.data?.length || 0,
      wsClients: wsClients.size,
      timestamp: new Date().toISOString(),
    });
  });

  // Webhook / Notify Endpoint: menerima ping instan dari aplikasi sebelumnya / PHP
  app.post('/api/sync/webhook', async (req, res) => {
    try {
      const { entity = 'alumni', action = 'update', data, source = 'external' } = req.body || {};
      console.log(`[Realtime Sync] Webhook dipicu dari ${source} (Entity: ${entity}, Action: ${action})`);

      if (entity === 'alumni' || entity === 'all') {
        await getSantriData(true);
      }

      broadcastWs({
        type: 'REMOTE_DATA_CHANGED',
        entity,
        action,
        data,
        source,
        timestamp: Date.now(),
      });

      res.json({ success: true, message: 'Sync webhook processed & broadcasted via WebSocket' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message });
    }
  });

  app.post('/api/sync/notify', async (req, res) => {
    try {
      const { entity = 'alumni' } = req.body || {};
      await getSantriData(true);
      broadcastWs({
        type: 'REMOTE_DATA_CHANGED',
        entity,
        action: 'refresh',
        timestamp: Date.now(),
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false });
    }
  });

  // Media / Photo Uploads Proxy to attaroqqy.com
  app.use('/api/uploads', async (req, res) => {
    try {
      const remoteUrl = `https://attaroqqy.com/api/uploads${req.url}`;
      const remoteRes = await fetch(remoteUrl);
      if (!remoteRes.ok) {
        return res.status(remoteRes.status).end();
      }
      const contentType = remoteRes.headers.get('content-type');
      if (contentType) res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      const buffer = await remoteRes.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (err: any) {
      console.warn('[Server] Error proxying upload media:', err?.message);
      res.status(404).end();
    }
  });

  // Photo & Document Upload API Proxy to attaroqqy.com
  app.post('/api/upload', async (req, res) => {
    try {
      console.log('[Server] Proxying /api/upload to attaroqqy.com, fileName:', req.body?.fileName);
      const remoteRes = await fetch('https://attaroqqy.com/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(req.body),
      });

      const responseData = await remoteRes.json().catch(() => ({ success: remoteRes.ok }));
      res.status(remoteRes.status).json(responseData);
    } catch (err: any) {
      console.warn('[Server] Error proxying /api/upload:', err?.message);
      res.status(500).json({ success: false, message: err?.message });
    }
  });

  // Santri API: GET
  app.get('/api/db/santri', async (req, res) => {
    try {
      const isFresh = req.query.fresh === 'true' || req.query.force === 'true' || Boolean(req.query._t);
      const data = await getSantriData(isFresh);
      res.setHeader('Content-Type', 'application/json');
      res.json(data);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err?.message || 'Error fetching santri data',
        data: localSnapshot?.data || [],
      });
    }
  });

  // Santri API: PUT (update)
  app.put('/api/db/santri/:id', async (req, res) => {
    const { id } = req.params;
    try {
      console.log(`[Server] Forwarding PUT update for santri ID: ${id}`);
      const payload = { id, ...req.body };

      // Normalize both snake_case and camelCase aliases for full compatibility
      const normalizedPayload: Record<string, any> = { ...payload };
      if (payload.nama) { normalizedPayload.name = payload.nama; normalizedPayload.nama = payload.nama; }
      if (payload.name) { normalizedPayload.nama = payload.name; normalizedPayload.name = payload.name; }
      if (payload.tempatLahir !== undefined) { normalizedPayload.tempat_lahir = payload.tempatLahir; normalizedPayload.tempatLahir = payload.tempatLahir; }
      if (payload.tempat_lahir !== undefined) { normalizedPayload.tempatLahir = payload.tempat_lahir; normalizedPayload.tempat_lahir = payload.tempat_lahir; }
      if (payload.tanggalLahir !== undefined) { normalizedPayload.tanggal_lahir = payload.tanggalLahir; normalizedPayload.tanggalLahir = payload.tanggalLahir; }
      if (payload.tanggal_lahir !== undefined) { normalizedPayload.tanggalLahir = payload.tanggal_lahir; normalizedPayload.tanggal_lahir = payload.tanggal_lahir; }
      if (payload.alamatLengkap !== undefined) {
        normalizedPayload.alamat = payload.alamatLengkap;
        normalizedPayload.address = payload.alamatLengkap;
        normalizedPayload.alamatLengkap = payload.alamatLengkap;
      }
      if (payload.alamat !== undefined) {
        normalizedPayload.alamatLengkap = payload.alamat;
        normalizedPayload.alamat = payload.alamat;
      }
      if (payload.city !== undefined) { normalizedPayload.kabupaten = payload.city; normalizedPayload.city = payload.city; }
      if (payload.kabupaten !== undefined) { normalizedPayload.city = payload.kabupaten; normalizedPayload.kabupaten = payload.kabupaten; }
      if (payload.province !== undefined) { normalizedPayload.provinsi = payload.province; normalizedPayload.province = payload.province; }
      if (payload.provinsi !== undefined) { normalizedPayload.province = payload.provinsi; normalizedPayload.provinsi = payload.provinsi; }
      if (payload.phone !== undefined) { normalizedPayload.no_hp = payload.phone; normalizedPayload.phone = payload.phone; }
      if (payload.no_hp !== undefined) { normalizedPayload.phone = payload.no_hp; normalizedPayload.no_hp = payload.no_hp; }
      if (payload.occupation !== undefined) { normalizedPayload.pekerjaan = payload.occupation; normalizedPayload.occupation = payload.occupation; }
      if (payload.pekerjaan !== undefined) { normalizedPayload.occupation = payload.pekerjaan; normalizedPayload.pekerjaan = payload.pekerjaan; }
      if (payload.institution !== undefined) { normalizedPayload.instansi = payload.institution; normalizedPayload.institution = payload.institution; }
      if (payload.instansi !== undefined) { normalizedPayload.institution = payload.instansi; normalizedPayload.instansi = payload.instansi; }
      if (payload.namaAyah !== undefined) { normalizedPayload.nama_ayah = payload.namaAyah; normalizedPayload.namaAyah = payload.namaAyah; }
      if (payload.nama_ayah !== undefined) { normalizedPayload.namaAyah = payload.nama_ayah; normalizedPayload.nama_ayah = payload.nama_ayah; }
      if (payload.nikAyah !== undefined) { normalizedPayload.nik_ayah = payload.nikAyah; normalizedPayload.nikAyah = payload.nikAyah; }
      if (payload.nik_ayah !== undefined) { normalizedPayload.nikAyah = payload.nik_ayah; normalizedPayload.nik_ayah = payload.nik_ayah; }
      if (payload.pekerjaanAyah !== undefined) { normalizedPayload.pekerjaan_ayah = payload.pekerjaanAyah; normalizedPayload.pekerjaanAyah = payload.pekerjaanAyah; }
      if (payload.pekerjaan_ayah !== undefined) { normalizedPayload.pekerjaanAyah = payload.pekerjaan_ayah; normalizedPayload.pekerjaan_ayah = payload.pekerjaan_ayah; }
      if (payload.pendidikanAyah !== undefined) { normalizedPayload.pendidikan_ayah = payload.pendidikanAyah; normalizedPayload.pendidikanAyah = payload.pendidikanAyah; }
      if (payload.pendidikan_ayah !== undefined) { normalizedPayload.pendidikanAyah = payload.pendidikan_ayah; normalizedPayload.pendidikan_ayah = payload.pendidikan_ayah; }
      if (payload.namaIbu !== undefined) { normalizedPayload.nama_ibu = payload.namaIbu; normalizedPayload.namaIbu = payload.namaIbu; }
      if (payload.nama_ibu !== undefined) { normalizedPayload.namaIbu = payload.nama_ibu; normalizedPayload.nama_ibu = payload.nama_ibu; }
      if (payload.nikIbu !== undefined) { normalizedPayload.nik_ibu = payload.nikIbu; normalizedPayload.nikIbu = payload.nikIbu; }
      if (payload.nik_ibu !== undefined) { normalizedPayload.nikIbu = payload.nik_ibu; normalizedPayload.nik_ibu = payload.nik_ibu; }
      if (payload.pekerjaanIbu !== undefined) { normalizedPayload.pekerjaan_ibu = payload.pekerjaanIbu; normalizedPayload.pekerjaanIbu = payload.pekerjaanIbu; }
      if (payload.pekerjaan_ibu !== undefined) { normalizedPayload.pekerjaanIbu = payload.pekerjaan_ibu; normalizedPayload.pekerjaan_ibu = payload.pekerjaan_ibu; }
      if (payload.pendidikanIbu !== undefined) { normalizedPayload.pendidikan_ibu = payload.pendidikanIbu; normalizedPayload.pendidikanIbu = payload.pendidikanIbu; }
      if (payload.pendidikan_ibu !== undefined) { normalizedPayload.pendidikanIbu = payload.pendidikan_ibu; normalizedPayload.pendidikan_ibu = payload.pendidikan_ibu; }
      if (payload.urutanAnak !== undefined) { normalizedPayload.anak_ke = payload.urutanAnak; normalizedPayload.urutanAnak = payload.urutanAnak; }
      if (payload.anak_ke !== undefined) { normalizedPayload.urutanAnak = payload.anak_ke; normalizedPayload.anak_ke = payload.anak_ke; }
      if (payload.jumlahSaudara !== undefined) { normalizedPayload.dari_bersaudara = payload.jumlahSaudara; normalizedPayload.jumlahSaudara = payload.jumlahSaudara; }
      if (payload.dari_bersaudara !== undefined) { normalizedPayload.jumlahSaudara = payload.dari_bersaudara; normalizedPayload.dari_bersaudara = payload.dari_bersaudara; }
      if (payload.entryDate !== undefined) { normalizedPayload.tanggal_masuk = payload.entryDate; normalizedPayload.entryDate = payload.entryDate; }
      if (payload.tanggal_masuk !== undefined) { normalizedPayload.entryDate = payload.tanggal_masuk; normalizedPayload.tanggal_masuk = payload.tanggal_masuk; }
      if (payload.gradDate !== undefined) { normalizedPayload.tanggal_keluar = payload.gradDate; normalizedPayload.gradDate = payload.gradDate; }
      if (payload.tanggal_keluar !== undefined) { normalizedPayload.gradDate = payload.tanggal_keluar; normalizedPayload.tanggal_keluar = payload.tanggal_keluar; }
      if (payload.gradYear !== undefined) { normalizedPayload.tahun_lulus = payload.gradYear; normalizedPayload.gradYear = payload.gradYear; }
      if (payload.tahun_lulus !== undefined) { normalizedPayload.gradYear = payload.tahun_lulus; normalizedPayload.tahun_lulus = payload.tahun_lulus; }
      if (payload.asramaDulu !== undefined) { normalizedPayload.kamar = payload.asramaDulu; normalizedPayload.asramaDulu = payload.asramaDulu; }
      if (payload.kamar !== undefined) { normalizedPayload.asramaDulu = payload.kamar; normalizedPayload.kamar = payload.kamar; }
      if (payload.bio !== undefined) {
        normalizedPayload.bio = payload.bio;
      }
      if (payload.coordinates !== undefined) {
        normalizedPayload.latitude = payload.coordinates?.lat ?? payload.latitude;
        normalizedPayload.longitude = payload.coordinates?.lng ?? payload.longitude;
      }

      // Update in-memory localSnapshot and persist to disk immediately
      if (localSnapshot && Array.isArray(localSnapshot.data)) {
        const idx = localSnapshot.data.findIndex(
          (s: any) =>
            String(s.id) === String(id) ||
            (payload.nik && String(s.nik) === String(payload.nik)) ||
            (payload.nis && String(s.nis) === String(payload.nis))
        );
        if (idx >= 0) {
          localSnapshot.data[idx] = { ...localSnapshot.data[idx], ...normalizedPayload };
        } else {
          localSnapshot.data.unshift(normalizedPayload);
        }
        try {
          fs.writeFileSync(snapshotPath, JSON.stringify(localSnapshot, null, 2), 'utf-8');
        } catch (e) {
          console.warn('[Server] Error persisting santri_snapshot.json:', e);
        }
      }

      // Update in-memory cache
      if (cachedSantriData && Array.isArray(cachedSantriData.data)) {
        const idx = cachedSantriData.data.findIndex(
          (s: any) =>
            String(s.id) === String(id) ||
            (payload.nik && String(s.nik) === String(payload.nik)) ||
            (payload.nis && String(s.nis) === String(payload.nis))
        );
        if (idx >= 0) {
          cachedSantriData.data[idx] = { ...cachedSantriData.data[idx], ...normalizedPayload };
        } else {
          cachedSantriData.data.unshift(normalizedPayload);
        }
      } else {
        cachedSantriData = localSnapshot;
      }
      lastCacheTime = Date.now();

      // Forward to remote Hostinger backend in background
      Promise.allSettled([
        fetch('https://alumni.attaroqqy.com/api_alumni.php?action=update_alumni', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(normalizedPayload),
          signal: AbortSignal.timeout(10000),
        }),
        fetch(`https://attaroqqy.com/api/db/santri/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(normalizedPayload),
          signal: AbortSignal.timeout(10000),
        }),
      ]).catch(() => {});

      // Broadcast perubahan santri secara realtime ke seluruh WebSocket client
      broadcastWs({
        type: 'DATA_CHANGED',
        entity: 'alumni',
        action: 'update',
        id,
        data: normalizedPayload,
        timestamp: Date.now(),
      });

      res.json({ success: true, message: 'Data santri berhasil diperbarui' });
    } catch (err: any) {
      console.warn(`[Server] Error processing PUT for ${id}:`, err?.message);
      res.status(500).json({ success: false, message: err?.message });
    }
  });

  // Santri API: POST (create)
  app.post('/api/db/santri', async (req, res) => {
    try {
      console.log('[Server] Adding new santri:', req.body?.name || req.body?.nama);
      const newRecord = { ...req.body };
      if (!newRecord.id) {
        newRecord.id = `alm-${Date.now()}`;
      }

      if (localSnapshot && Array.isArray(localSnapshot.data)) {
        localSnapshot.data.unshift(newRecord);
        try {
          fs.writeFileSync(snapshotPath, JSON.stringify(localSnapshot, null, 2), 'utf-8');
        } catch (e) {
          console.warn('[Server] Error persisting new santri to snapshot:', e);
        }
      }

      if (cachedSantriData && Array.isArray(cachedSantriData.data)) {
        cachedSantriData.data.unshift(newRecord);
      } else {
        cachedSantriData = localSnapshot;
      }
      lastCacheTime = Date.now();

      // Forward to remote Hostinger backend in background
      Promise.allSettled([
        fetch('https://alumni.attaroqqy.com/api_alumni.php?action=add_alumni', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(newRecord),
          signal: AbortSignal.timeout(10000),
        }),
        fetch('https://attaroqqy.com/api/db/santri', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(newRecord),
          signal: AbortSignal.timeout(10000),
        }),
      ]).catch(() => {});

      // Broadcast alumni baru secara realtime via WebSocket
      broadcastWs({
        type: 'DATA_CHANGED',
        entity: 'alumni',
        action: 'create',
        id: newRecord.id,
        data: newRecord,
        timestamp: Date.now(),
      });

      res.json({ success: true, message: 'Santri/alumni baru berhasil ditambahkan', id: newRecord.id });
    } catch (err: any) {
      console.warn('[Server] Error adding santri:', err?.message);
      res.status(500).json({ success: false, message: err?.message });
    }
  });

  // Santri API: DELETE
  app.delete('/api/db/santri/:id', async (req, res) => {
    const { id } = req.params;
    try {
      console.log(`[Server] Deleting santri ID: ${id}`);
      if (localSnapshot && Array.isArray(localSnapshot.data)) {
        localSnapshot.data = localSnapshot.data.filter((s: any) => String(s.id) !== String(id));
        try {
          fs.writeFileSync(snapshotPath, JSON.stringify(localSnapshot, null, 2), 'utf-8');
        } catch (e) {
          console.warn('[Server] Error deleting from snapshot:', e);
        }
      }

      if (cachedSantriData && Array.isArray(cachedSantriData.data)) {
        cachedSantriData.data = cachedSantriData.data.filter((s: any) => String(s.id) !== String(id));
      }
      lastCacheTime = Date.now();

      fetch('https://alumni.attaroqqy.com/api_alumni.php?action=delete_alumni', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ id }),
        signal: AbortSignal.timeout(8000),
      }).catch(() => {});

      // Broadcast hapus santri secara realtime via WebSocket
      broadcastWs({
        type: 'DATA_CHANGED',
        entity: 'alumni',
        action: 'delete',
        id,
        timestamp: Date.now(),
      });

      res.json({ success: true, message: 'Alumni berhasil dihapus' });
    } catch (err: any) {
      console.warn(`[Server] Error deleting santri ${id}:`, err?.message);
      res.status(500).json({ success: false, message: err?.message });
    }
  });

  // Persistent file paths for dev/fallback storage
  const eventsStorePath = path.resolve(__dirname, 'src/data/events_store.json');
  const announcementsStorePath = path.resolve(__dirname, 'src/data/announcements_store.json');
  const deletedEventsStorePath = path.resolve(__dirname, 'src/data/deleted_events_store.json');
  const deletedAnnouncementsStorePath = path.resolve(__dirname, 'src/data/deleted_announcements_store.json');
  const commentsStorePath = path.resolve(__dirname, 'src/data/comments_store.json');
  const quranBookmarksStorePath = path.resolve(__dirname, 'src/data/quran_bookmarks_store.json');
  const adminProfileStorePath = path.resolve(__dirname, 'src/data/admin_profile_store.json');

  const loadJsonStore = (filePath: string, fallback: any = []) => {
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      }
    } catch (e) {
      console.warn('[Server] Error reading store:', filePath, e);
    }
    return fallback;
  };

  const saveJsonStore = (filePath: string, data: any) => {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.warn('[Server] Error writing store:', filePath, e);
    }
  };

  let deletedEventIds: string[] = loadJsonStore(deletedEventsStorePath, []);
  let deletedAnnouncementIds: string[] = loadJsonStore(deletedAnnouncementsStorePath, []);
  let cachedEvents: any[] = loadJsonStore(eventsStorePath, []).filter((e: any) => e && e.id && !deletedEventIds.includes(e.id));
  let cachedAnnouncements: any[] = loadJsonStore(announcementsStorePath, []).filter((a: any) => a && a.id && !deletedAnnouncementIds.includes(a.id));
  let cachedComments: any[] = loadJsonStore(commentsStorePath, []);
  let cachedQuranBookmarks: Record<string, any> = loadJsonStore(quranBookmarksStorePath, {});
  let cachedAdminProfile: any = loadJsonStore(adminProfileStorePath, null);

  // Events API: GET
  app.get('/api/events', async (req, res) => {
    try {
      const remoteRes = await fetch('https://alumni.attaroqqy.com/api_alumni.php?action=get_events', {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      const contentType = remoteRes.headers.get('content-type') || '';
      if (remoteRes.ok && contentType.includes('application/json')) {
        const text = await remoteRes.text();
        if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
          const data = JSON.parse(text);
          const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : null);
          if (Array.isArray(list)) {
            const remoteClean = list.filter((e: any) => e && e.id && !deletedEventIds.includes(e.id));
            const remoteMap = new Map(remoteClean.map((e: any) => [e.id, e]));

            const merged = cachedEvents.map((localEv: any) => {
              const remoteEv = remoteMap.get(localEv.id);
              if (remoteEv) remoteMap.delete(localEv.id);
              const baseEv = remoteEv ? { ...remoteEv, ...localEv } : localEv;

              const rsvpHadir = cachedComments.filter((c: any) => (c.eventId === baseEv.id || c.postId === baseEv.id) && c.status === 'hadir').length;
              const rsvpTidak = cachedComments.filter((c: any) => (c.eventId === baseEv.id || c.postId === baseEv.id) && c.status === 'tidak_hadir').length;
              const finalHadir = Math.max(Number(baseEv.attendeesCount || 0), rsvpHadir);
              const finalTidak = Math.max(Number(baseEv.absentCount || baseEv.notAttendingCount || 0), rsvpTidak);

              let effectiveAvatar = baseEv.authorAvatar;
              const cleanH = (baseEv.authorHandle || '').replace(/^@/, '').toLowerCase();
              const isPusatAdmin = cleanH === 'admin_pusat' || cleanH === '' || baseEv.authorName === 'Davidko' || baseEv.authorName === 'Davidson' || baseEv.authorName === 'Ust. H. Abdurrahman, M.Pd.';
              if (isPusatAdmin && cachedAdminProfile?.avatar && !cachedAdminProfile.avatar.includes('unsplash.com')) {
                effectiveAvatar = cachedAdminProfile.avatar;
              }

              return {
                ...baseEv,
                attendeesCount: finalHadir,
                absentCount: finalTidak,
                notAttendingCount: finalTidak,
                userRsvp: localEv.userRsvp || remoteEv?.userRsvp,
                rsvpNote: localEv.rsvpNote || remoteEv?.rsvpNote,
                authorName: (isPusatAdmin && cachedAdminProfile?.name) ? cachedAdminProfile.name : (localEv.authorName || remoteEv?.authorName),
                authorHandle: (isPusatAdmin && cachedAdminProfile?.username) ? cachedAdminProfile.username : (localEv.authorHandle || remoteEv?.authorHandle),
                authorAvatar: effectiveAvatar,
              };
            });
            for (const rem of remoteMap.values()) {
              merged.push(rem);
            }
            cachedEvents = merged.filter((e: any) => e && e.id && !deletedEventIds.includes(e.id));
            saveJsonStore(eventsStorePath, cachedEvents);
            return res.json({ success: true, data: cachedEvents });
          }
        }
      }
    } catch (err: any) {
      // Ignore network/remote formatting errors safely
    }
    const filteredCached = cachedEvents.filter((e: any) => e && e.id && !deletedEventIds.includes(e.id)).map((ev: any) => {
      const rsvpHadir = cachedComments.filter((c: any) => (c.eventId === ev.id || c.postId === ev.id) && c.status === 'hadir').length;
      const rsvpTidak = cachedComments.filter((c: any) => (c.eventId === ev.id || c.postId === ev.id) && c.status === 'tidak_hadir').length;
      const cleanH = (ev.authorHandle || '').replace(/^@/, '').toLowerCase();
      const isPusatAdmin = cleanH === 'admin_pusat' || cleanH === '' || ev.authorName === 'Davidko' || ev.authorName === 'Davidson' || ev.authorName === 'Ust. H. Abdurrahman, M.Pd.';
      const effectiveAvatar = (isPusatAdmin && cachedAdminProfile?.avatar && !cachedAdminProfile.avatar.includes('unsplash.com'))
        ? cachedAdminProfile.avatar
        : ev.authorAvatar;

      return {
        ...ev,
        attendeesCount: Math.max(Number(ev.attendeesCount || 0), rsvpHadir),
        absentCount: Math.max(Number(ev.absentCount || ev.notAttendingCount || 0), rsvpTidak),
        notAttendingCount: Math.max(Number(ev.absentCount || ev.notAttendingCount || 0), rsvpTidak),
        authorAvatar: effectiveAvatar,
      };
    });
    res.json({ success: true, data: filteredCached });
  });

  // Events API: POST (save/create/update)
  app.post('/api/events', async (req, res) => {
    const event = req.body;
    if (event && event.id) {
      deletedEventIds = deletedEventIds.filter((dId) => dId !== event.id);
      saveJsonStore(deletedEventsStorePath, deletedEventIds);
      const idx = cachedEvents.findIndex((e: any) => e.id === event.id);
      if (idx >= 0) cachedEvents[idx] = event;
      else cachedEvents.unshift(event);
      saveJsonStore(eventsStorePath, cachedEvents);
    }

    // Broadcast event perubahan via WebSocket
    broadcastWs({
      type: 'DATA_CHANGED',
      entity: 'events',
      action: 'save',
      id: event?.id,
      data: event,
      timestamp: Date.now(),
    });

    try {
      const remoteRes = await fetch('https://alumni.attaroqqy.com/api_alumni.php?action=save_event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(req.body),
        signal: AbortSignal.timeout(12000),
      });
      const data = await remoteRes.json().catch(() => null);
      return res.json(data || { success: true, id: req.body?.id });
    } catch (err: any) {
      console.warn('[Server] Error proxying save_event to Hostinger:', err?.message);
      return res.json({ success: true, id: req.body?.id, note: 'Saved locally' });
    }
  });

  // Events API: DELETE (DELETE & POST)
  const handleEventDeletion = async (id: string, res: any) => {
    if (!id) return res.status(400).json({ success: false, message: 'ID required' });
    if (!deletedEventIds.includes(id)) {
      deletedEventIds.push(id);
      saveJsonStore(deletedEventsStorePath, deletedEventIds);
    }
    cachedEvents = cachedEvents.filter((e: any) => e.id !== id);
    saveJsonStore(eventsStorePath, cachedEvents);

    // Broadcast hapus event via WebSocket
    broadcastWs({
      type: 'DATA_CHANGED',
      entity: 'events',
      action: 'delete',
      id,
      timestamp: Date.now(),
    });

    try {
      await fetch('https://alumni.attaroqqy.com/api_alumni.php?action=delete_event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ id }),
        signal: AbortSignal.timeout(10000),
      }).catch(() => {});
    } catch (err: any) {}
    res.json({ success: true, message: 'Event berhasil dihapus' });
  };

  app.delete('/api/events/:id', async (req, res) => {
    await handleEventDeletion(req.params.id, res);
  });

  app.post('/api/events/delete', async (req, res) => {
    const id = req.body?.id;
    await handleEventDeletion(id, res);
  });

  app.post('/api/events/:id/delete', async (req, res) => {
    await handleEventDeletion(req.params.id, res);
  });

  // Events API: RSVP
  app.post('/api/events/rsvp', async (req, res) => {
    const { eventId, alumniId, status, note, authorName, authorHandle, authorAvatar, attendeesCount, absentCount } = req.body || {};
    let updatedEvent: any = null;

    if (eventId) {
      const idx = cachedEvents.findIndex((e: any) => e.id === eventId);
      if (idx >= 0) {
        const ev = cachedEvents[idx];
        let newAttendees = attendeesCount !== undefined ? attendeesCount : (ev.attendeesCount || 0);
        let newAbsent = absentCount !== undefined ? absentCount : (ev.absentCount || ev.notAttendingCount || 0);

        // If specific counts weren't supplied, adjust based on previous rsvp
        if (attendeesCount === undefined && absentCount === undefined) {
          const prevStatus = ev.userRsvp;
          if (prevStatus === 'hadir') newAttendees = Math.max(0, newAttendees - 1);
          if (prevStatus === 'tidak_hadir') newAbsent = Math.max(0, newAbsent - 1);
          if (status === 'hadir') newAttendees += 1;
          if (status === 'tidak_hadir') newAbsent += 1;
        }

        cachedEvents[idx] = {
          ...ev,
          userRsvp: status,
          attendeesCount: newAttendees,
          absentCount: newAbsent,
          notAttendingCount: newAbsent,
          rsvpNote: note !== undefined ? note : ev.rsvpNote,
        };
        updatedEvent = cachedEvents[idx];
        saveJsonStore(eventsStorePath, cachedEvents);
      }
    }

    if (eventId) {
      const effectiveUserKey = alumniId || 'admin_user';
      const commId = `comm-rsvp-${effectiveUserKey}-${eventId}`;
      const defaultNote = status === 'hadir' ? 'Insya Allah saya hadir' : status === 'tidak_hadir' ? 'Mohon maaf belum bisa hadir' : '';
      const finalContent = (note && String(note).trim()) ? String(note).trim() : defaultNote;

      if (finalContent) {
        const rsvpComment = {
          id: commId,
          eventId,
          postId: eventId,
          postType: 'event',
          authorId: alumniId || 'admin',
          authorName: authorName || 'Alumni',
          authorHandle: authorHandle || '@alumni',
          authorAvatar: authorAvatar || '',
          avatarRing: true,
          status: status || 'hadir',
          content: finalContent,
          timeAgo: 'Baru saja',
          likesCount: 0,
          repliesCount: 0,
          replies: [],
        };
        const idx = cachedComments.findIndex((c: any) => c.id === commId);
        if (idx >= 0) {
          cachedComments[idx] = { ...cachedComments[idx], ...rsvpComment };
        } else {
          cachedComments.unshift(rsvpComment);
        }
        saveJsonStore(commentsStorePath, cachedComments);

        // Forward comment to Hostinger save_comment endpoint
        fetch('https://alumni.attaroqqy.com/api_alumni.php?action=save_comment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rsvpComment),
          signal: AbortSignal.timeout(10000),
        }).catch(() => {});
      }
    }

    try {
      await fetch('https://alumni.attaroqqy.com/api_alumni.php?action=save_rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(req.body),
        signal: AbortSignal.timeout(10000),
      }).catch(() => {});
    } catch (err: any) {}

    // Broadcast RSVP update via WebSocket
    broadcastWs({
      type: 'DATA_CHANGED',
      entity: 'events',
      action: 'rsvp',
      id: eventId,
      data: { eventId, status, updatedEvent },
      timestamp: Date.now(),
    });

    res.json({ success: true, event: updatedEvent });
  });

  // Admin Profile Sync across all events, announcements, and comments
  const handleAdminProfileSync = (req: any, res: any) => {
    const { prevName, prevUsername, name, username, avatar } = req.body || {};
    const pName = (prevName || '').trim();
    const pUser = (prevUsername || '').replace(/^@/, '').toLowerCase().trim();
    const newName = (name || '').trim();
    const newUsername = username ? (username.startsWith('@') ? username : `@${username}`) : undefined;

    cachedAdminProfile = {
      ...(cachedAdminProfile || {}),
      name: newName || cachedAdminProfile?.name || 'Ust. H. Abdurrahman, M.Pd.',
      username: newUsername || cachedAdminProfile?.username || '@admin_pusat',
      avatar: avatar !== undefined ? avatar : cachedAdminProfile?.avatar,
      updatedAt: new Date().toISOString(),
    };
    saveJsonStore(adminProfileStorePath, cachedAdminProfile);

    let eventsChanged = false;
    cachedEvents = cachedEvents.map((ev: any) => {
      const evUser = (ev.authorHandle || '').replace(/^@/, '').toLowerCase().trim();
      const isAuthor =
        !ev.authorHandle ||
        evUser === pUser ||
        evUser === 'admin_pusat' ||
        ev.authorName === pName ||
        ev.authorName === 'Ust. H. Abdurrahman, M.Pd.' ||
        ev.authorName === 'Davidko' ||
        ev.authorName === 'Davidson' ||
        ev.authorName === newName;

      if (isAuthor) {
        eventsChanged = true;
        const updatedEv = {
          ...ev,
          authorName: newName || ev.authorName,
          authorHandle: newUsername || ev.authorHandle,
          authorAvatar: avatar !== undefined ? avatar : ev.authorAvatar,
        };
        fetch('https://alumni.attaroqqy.com/api_alumni.php?action=save_event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedEv),
          signal: AbortSignal.timeout(10000),
        }).catch(() => {});
        return updatedEv;
      }
      return ev;
    });
    if (eventsChanged) {
      saveJsonStore(eventsStorePath, cachedEvents);
    }

    let annChanged = false;
    cachedAnnouncements = cachedAnnouncements.map((ann: any) => {
      const annUser = (ann.authorHandle || '').replace(/^@/, '').toLowerCase().trim();
      const isAuthor =
        !ann.authorHandle ||
        annUser === pUser ||
        annUser === 'admin_pusat' ||
        ann.authorName === pName ||
        ann.authorName === 'Ust. H. Abdurrahman, M.Pd.' ||
        ann.authorName === 'Davidko' ||
        ann.authorName === 'Davidson' ||
        ann.authorName === 'Pondok Pesantren At-taroqqy' ||
        ann.authorName === newName;

      if (isAuthor) {
        annChanged = true;
        const updatedAnn = {
          ...ann,
          authorName: newName || ann.authorName,
          authorHandle: newUsername || ann.authorHandle,
          authorAvatar: avatar !== undefined ? avatar : ann.authorAvatar,
        };
        fetch('https://alumni.attaroqqy.com/api_alumni.php?action=save_announcement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedAnn),
          signal: AbortSignal.timeout(10000),
        }).catch(() => {});
        return updatedAnn;
      }
      return ann;
    });
    if (annChanged) {
      saveJsonStore(announcementsStorePath, cachedAnnouncements);
    }

    let commChanged = false;
    cachedComments = cachedComments.map((c: any) => {
      const cUser = (c.authorHandle || '').replace(/^@/, '').toLowerCase().trim();
      const isAuthor = cUser === pUser || cUser === 'admin_pusat' || c.authorName === pName || c.authorName === newName;
      if (isAuthor) {
        commChanged = true;
        const updatedComm = {
          ...c,
          authorName: newName || c.authorName,
          authorHandle: newUsername || c.authorHandle,
          authorAvatar: avatar !== undefined ? avatar : c.authorAvatar,
        };
        fetch('https://alumni.attaroqqy.com/api_alumni.php?action=save_comment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedComm),
          signal: AbortSignal.timeout(10000),
        }).catch(() => {});
        return updatedComm;
      }
      return c;
    });
    if (commChanged) {
      saveJsonStore(commentsStorePath, cachedComments);
    }

    res.json({ success: true, message: 'Admin profile synced to all posts & comments' });
  };

  app.get('/api/admin/profile', (req, res) => {
    res.json({ success: true, data: cachedAdminProfile });
  });

  app.post('/api/admin/profile', handleAdminProfileSync);
  app.post('/api/admin/sync-profile', handleAdminProfileSync);

  // Announcements API: GET
  app.get('/api/announcements', async (req, res) => {
    try {
      const remoteRes = await fetch('https://alumni.attaroqqy.com/api_alumni.php?action=get_announcements', {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      const contentType = remoteRes.headers.get('content-type') || '';
      if (remoteRes.ok && contentType.includes('application/json')) {
        const text = await remoteRes.text();
        if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
          const data = JSON.parse(text);
          const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : null);
          if (Array.isArray(list)) {
            const filtered = list.filter((a: any) => a && a.id && !deletedAnnouncementIds.includes(a.id)).map((a: any) => {
              const cleanH = (a.authorHandle || '').replace(/^@/, '').toLowerCase();
              const isPusat = cleanH === 'admin_pusat' || cleanH === '' || a.authorName === 'Ust. H. Abdurrahman, M.Pd.' || a.authorName === 'Davidson' || a.authorName === 'Davidko';
              if (isPusat && cachedAdminProfile?.avatar && !cachedAdminProfile.avatar.includes('unsplash.com')) {
                return { ...a, authorAvatar: cachedAdminProfile.avatar };
              }
              return a;
            });
            cachedAnnouncements = filtered;
            saveJsonStore(announcementsStorePath, cachedAnnouncements);
            return res.json({ success: true, data: filtered });
          }
        }
      }
    } catch (err: any) {
      // Ignore network/remote formatting errors safely
    }
    const filteredCached = cachedAnnouncements.filter((a: any) => a && a.id && !deletedAnnouncementIds.includes(a.id)).map((a: any) => {
      const cleanH = (a.authorHandle || '').replace(/^@/, '').toLowerCase();
      const isPusat = cleanH === 'admin_pusat' || cleanH === '' || a.authorName === 'Ust. H. Abdurrahman, M.Pd.' || a.authorName === 'Davidson' || a.authorName === 'Davidko';
      if (isPusat && cachedAdminProfile?.avatar && !cachedAdminProfile.avatar.includes('unsplash.com')) {
        return { ...a, authorAvatar: cachedAdminProfile.avatar };
      }
      return a;
    });
    res.json({ success: true, data: filteredCached });
  });

  // Announcements API: POST (save/create/update)
  app.post('/api/announcements', async (req, res) => {
    const ann = req.body;
    if (ann && ann.id) {
      deletedAnnouncementIds = deletedAnnouncementIds.filter((dId) => dId !== ann.id);
      saveJsonStore(deletedAnnouncementsStorePath, deletedAnnouncementIds);
      const idx = cachedAnnouncements.findIndex((a: any) => a.id === ann.id);
      if (idx >= 0) cachedAnnouncements[idx] = ann;
      else cachedAnnouncements.unshift(ann);
      saveJsonStore(announcementsStorePath, cachedAnnouncements);
    }

    // Broadcast pengumuman via WebSocket
    broadcastWs({
      type: 'DATA_CHANGED',
      entity: 'announcements',
      action: 'save',
      id: ann?.id,
      data: ann,
      timestamp: Date.now(),
    });

    try {
      const remoteRes = await fetch('https://alumni.attaroqqy.com/api_alumni.php?action=save_announcement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(req.body),
        signal: AbortSignal.timeout(12000),
      });
      const data = await remoteRes.json().catch(() => null);
      return res.json(data || { success: true, id: req.body?.id });
    } catch (err: any) {
      console.warn('[Server] Error proxying save_announcement to Hostinger:', err?.message);
      return res.json({ success: true, id: req.body?.id, note: 'Saved locally' });
    }
  });

  // Announcements API: DELETE (DELETE & POST)
  const handleAnnouncementDeletion = async (id: string, res: any) => {
    if (!id) return res.status(400).json({ success: false, message: 'ID required' });
    if (!deletedAnnouncementIds.includes(id)) {
      deletedAnnouncementIds.push(id);
      saveJsonStore(deletedAnnouncementsStorePath, deletedAnnouncementIds);
    }
    cachedAnnouncements = cachedAnnouncements.filter((a: any) => a.id !== id);
    saveJsonStore(announcementsStorePath, cachedAnnouncements);

    // Broadcast hapus pengumuman via WebSocket
    broadcastWs({
      type: 'DATA_CHANGED',
      entity: 'announcements',
      action: 'delete',
      id,
      timestamp: Date.now(),
    });

    try {
      await fetch('https://alumni.attaroqqy.com/api_alumni.php?action=delete_announcement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ id }),
        signal: AbortSignal.timeout(10000),
      }).catch(() => {});
    } catch (err: any) {}
    res.json({ success: true, message: 'Pengumuman berhasil dihapus' });
  };

  app.delete('/api/announcements/:id', async (req, res) => {
    await handleAnnouncementDeletion(req.params.id, res);
  });

  app.post('/api/announcements/delete', async (req, res) => {
    const id = req.body?.id;
    await handleAnnouncementDeletion(id, res);
  });

  app.post('/api/announcements/:id/delete', async (req, res) => {
    await handleAnnouncementDeletion(req.params.id, res);
  });

  // Comments API: GET
  app.get('/api/comments', async (req, res) => {
    const { postId } = req.query;
    try {
      const remoteUrl = postId
        ? `https://alumni.attaroqqy.com/api_alumni.php?action=get_comments&post_id=${encodeURIComponent(String(postId))}`
        : 'https://alumni.attaroqqy.com/api_alumni.php?action=get_comments';
      const remoteRes = await fetch(remoteUrl, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      const contentType = remoteRes.headers.get('content-type') || '';
      if (remoteRes.ok && contentType.includes('application/json')) {
        const json = await remoteRes.json();
        if (json && Array.isArray(json.data) && json.data.length > 0) {
          // Merge remote comments with cachedComments without destroying locally created RSVP comments
          const remoteList = json.data;
          remoteList.forEach((rComm: any) => {
            const idx = cachedComments.findIndex((c: any) => c.id === rComm.id);
            if (idx >= 0) {
              cachedComments[idx] = { ...cachedComments[idx], ...rComm };
            } else {
              cachedComments.push(rComm);
            }
          });
          saveJsonStore(commentsStorePath, cachedComments);
        }
      }
    } catch (e) {}

    let filtered = cachedComments;
    if (postId) {
      filtered = cachedComments.filter((c: any) => c.eventId === postId || c.postId === postId);
    }
    res.json({ success: true, data: filtered });
  });

  // Comments API: POST (save comment or reply)
  app.post('/api/comments', async (req, res) => {
    const comm = req.body;
    if (comm && comm.id) {
      comm.eventId = comm.eventId || comm.postId;
      comm.postId = comm.postId || comm.eventId;

      if (comm.commentId) {
        // It is a reply to an existing parent comment
        const parent = cachedComments.find((c: any) => c.id === comm.commentId);
        if (parent) {
          if (!parent.replies) parent.replies = [];
          const repIdx = parent.replies.findIndex((r: any) => r.id === comm.id);
          if (repIdx >= 0) parent.replies[repIdx] = comm;
          else parent.replies.push(comm);
          parent.repliesCount = parent.replies.length;
        }
      } else {
        const idx = cachedComments.findIndex((c: any) => c.id === comm.id);
        if (idx >= 0) cachedComments[idx] = { ...cachedComments[idx], ...comm };
        else cachedComments.unshift(comm);
      }
      saveJsonStore(commentsStorePath, cachedComments);
    }

    try {
      await fetch('https://alumni.attaroqqy.com/api_alumni.php?action=save_comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
        signal: AbortSignal.timeout(10000),
      }).catch(() => {});
    } catch (e) {}

    // Broadcast komentar via WebSocket
    broadcastWs({
      type: 'DATA_CHANGED',
      entity: 'comments',
      action: 'save',
      id: comm?.id,
      data: comm,
      timestamp: Date.now(),
    });

    res.json({ success: true, id: comm.id });
  });

  // Comments API: LIKE
  app.post('/api/comments/like', async (req, res) => {
    const { commentId, replyId, isLiked } = req.body;
    const delta = isLiked ? 1 : -1;

    cachedComments = cachedComments.map((c: any) => {
      if (c.id === commentId) {
        if (replyId && c.replies) {
          c.replies = c.replies.map((r: any) => {
            if (r.id === replyId) {
              return { ...r, isLiked, likesCount: Math.max(0, (r.likesCount || 0) + delta) };
            }
            return r;
          });
        } else {
          return { ...c, isLiked, likesCount: Math.max(0, (c.likesCount || 0) + delta) };
        }
      }
      return c;
    });
    saveJsonStore(commentsStorePath, cachedComments);

    try {
      await fetch('https://alumni.attaroqqy.com/api_alumni.php?action=like_comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId: replyId || commentId, delta }),
        signal: AbortSignal.timeout(8000),
      }).catch(() => {});
    } catch (e) {}

    broadcastWs({
      type: 'DATA_CHANGED',
      entity: 'comments',
      action: 'like',
      id: replyId || commentId,
      data: { commentId, replyId, isLiked },
      timestamp: Date.now(),
    });

    res.json({ success: true });
  });

  // Comments API: DELETE
  app.delete('/api/comments/:id', async (req, res) => {
    const { id } = req.params;
    cachedComments = cachedComments.filter((c: any) => c.id !== id);
    saveJsonStore(commentsStorePath, cachedComments);

    try {
      await fetch('https://alumni.attaroqqy.com/api_alumni.php?action=delete_comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId: id }),
        signal: AbortSignal.timeout(8000),
      }).catch(() => {});
    } catch (e) {}

    broadcastWs({
      type: 'DATA_CHANGED',
      entity: 'comments',
      action: 'delete',
      id,
      timestamp: Date.now(),
    });

    res.json({ success: true });
  });

  // Post Like API: POST (Event or Announcement)
  app.post('/api/posts/like', async (req, res) => {
    const { postId, postType, isLiked } = req.body;
    const delta = isLiked ? 1 : -1;

    if (postType === 'announcement') {
      cachedAnnouncements = cachedAnnouncements.map((a: any) => {
        if (a.id === postId) {
          return {
            ...a,
            isLiked,
            likesCount: Math.max(0, (a.likesCount || 0) + delta),
          };
        }
        return a;
      });
      saveJsonStore(announcementsStorePath, cachedAnnouncements);
    } else {
      cachedEvents = cachedEvents.map((e: any) => {
        if (e.id === postId) {
          return {
            ...e,
            isLiked,
            likesCount: Math.max(0, (e.likesCount || 0) + delta),
          };
        }
        return e;
      });
      saveJsonStore(eventsStorePath, cachedEvents);
    }

    try {
      await fetch('https://alumni.attaroqqy.com/api_alumni.php?action=like_post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, postType, delta, isLiked }),
        signal: AbortSignal.timeout(8000),
      }).catch(() => {});
    } catch (e) {}

    broadcastWs({
      type: 'DATA_CHANGED',
      entity: postType === 'announcement' ? 'announcements' : 'events',
      action: 'like',
      id: postId,
      data: { postId, postType, isLiked },
      timestamp: Date.now(),
    });

    res.json({ success: true });
  });

  // Quran Bookmark API: GET
  app.get('/api/quran/bookmark/:userId', async (req, res) => {
    const { userId } = req.params;
    if (cachedQuranBookmarks[userId]) {
      return res.json({ success: true, data: cachedQuranBookmarks[userId] });
    }
    try {
      const remoteRes = await fetch(`https://alumni.attaroqqy.com/api_alumni.php?action=get_quran_bookmark&user_id=${encodeURIComponent(userId)}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (remoteRes.ok) {
        const json = await remoteRes.json();
        if (json && json.data) {
          cachedQuranBookmarks[userId] = json.data;
          saveJsonStore(quranBookmarksStorePath, cachedQuranBookmarks);
          return res.json(json);
        }
      }
    } catch (e) {}

    res.json({ success: true, data: null });
  });

  // Quran Bookmark API: POST (save)
  app.post('/api/quran/bookmark', async (req, res) => {
    const { userId, lr, bm, page, curPage } = req.body;
    if (userId) {
      cachedQuranBookmarks[userId] = {
        lr: lr || null,
        bm: bm || {},
        page: page || curPage || 1,
        updatedAt: new Date().toISOString(),
      };
      saveJsonStore(quranBookmarksStorePath, cachedQuranBookmarks);
    }

    try {
      await fetch('https://alumni.attaroqqy.com/api_alumni.php?action=save_quran_bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
        signal: AbortSignal.timeout(8000),
      }).catch(() => {});
    } catch (e) {}

    res.json({ success: true, message: 'Batas Al-Qur\'an berhasil disimpan' });
  });

  // Wilayah API In-Memory Cache
  const wilayahMemoryCache = new Map<string, any>();

  // Wilayah API: Provinces
  app.get('/api/wilayah/provinces', async (req, res) => {
    const cacheKey = 'provinces';
    if (wilayahMemoryCache.has(cacheKey)) {
      return res.json(wilayahMemoryCache.get(cacheKey));
    }
    try {
      const remote = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json', { signal: AbortSignal.timeout(5000) });
      if (remote.ok) {
        const data = await remote.json();
        wilayahMemoryCache.set(cacheKey, data);
        return res.json(data);
      }
    } catch (err: any) {
      console.warn('[Server] Error proxying provinces:', err?.message);
    }
    return res.status(500).json([]);
  });

  // Wilayah API: Regencies
  app.get('/api/wilayah/regencies/:provinceId', async (req, res) => {
    const { provinceId } = req.params;
    const cacheKey = `regencies_${provinceId}`;
    if (wilayahMemoryCache.has(cacheKey)) {
      return res.json(wilayahMemoryCache.get(cacheKey));
    }
    try {
      const remote = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinceId}.json`, { signal: AbortSignal.timeout(5000) });
      if (remote.ok) {
        const data = await remote.json();
        wilayahMemoryCache.set(cacheKey, data);
        return res.json(data);
      }
    } catch (err: any) {
      console.warn(`[Server] Error proxying regencies for ${provinceId}:`, err?.message);
    }
    return res.status(500).json([]);
  });

  // Wilayah API: Districts (Proxied with Rembang dataset fallback and caching)
  app.get('/api/wilayah/districts/:regencyId', async (req, res) => {
    const { regencyId } = req.params;
    const cacheKey = `districts_${regencyId}`;
    if (wilayahMemoryCache.has(cacheKey)) {
      return res.json(wilayahMemoryCache.get(cacheKey));
    }
    if (regencyId === '3317' && rembangWilayahData?.districts) {
      wilayahMemoryCache.set(cacheKey, rembangWilayahData.districts);
      return res.json(rembangWilayahData.districts);
    }
    try {
      const remote = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${regencyId}.json`, { signal: AbortSignal.timeout(5000) });
      if (remote.ok) {
        const data = await remote.json();
        wilayahMemoryCache.set(cacheKey, data);
        return res.json(data);
      }
    } catch (err: any) {
      console.warn(`[Server] Error proxying districts for ${regencyId}:`, err?.message);
    }
    if (regencyId === '3317' && rembangWilayahData?.districts) {
      return res.json(rembangWilayahData.districts);
    }
    return res.status(500).json([]);
  });

  // Wilayah API: Villages (Proxied with Sedan and Rembang dataset fallback and caching)
  app.get('/api/wilayah/villages/:districtId', async (req, res) => {
    const { districtId } = req.params;
    const cacheKey = `villages_${districtId}`;
    if (wilayahMemoryCache.has(cacheKey)) {
      return res.json(wilayahMemoryCache.get(cacheKey));
    }
    if (rembangWilayahData?.villages?.[districtId]) {
      wilayahMemoryCache.set(cacheKey, rembangWilayahData.villages[districtId]);
      return res.json(rembangWilayahData.villages[districtId]);
    }
    try {
      const remote = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${districtId}.json`, { signal: AbortSignal.timeout(5000) });
      if (remote.ok) {
        const data = await remote.json();
        wilayahMemoryCache.set(cacheKey, data);
        return res.json(data);
      }
    } catch (err: any) {
      console.warn(`[Server] Error proxying villages for ${districtId}:`, err?.message);
    }
    if (rembangWilayahData?.villages?.[districtId]) {
      return res.json(rembangWilayahData.villages[districtId]);
    }
    return res.status(500).json([]);
  });

  // Serve static assets from public directory
  app.use(express.static(path.resolve(__dirname, 'public')));

  // In production, serve built frontend assets
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && fs.existsSync(path.resolve(__dirname, 'dist'))) {
    console.log('[Server] Running in production mode, serving dist folder');
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  } else {
    console.log('[Server] Running in development mode with Vite middlewares');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  // Pre-fetch santri data in background
  getSantriData().catch(() => {});

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Portal Alumni backend & WebSocket running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
