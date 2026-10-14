import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory cache for live santri data
let cachedSantriData: any = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 5 * 1000; // 5 seconds for fast 2-way sync with Hostinger

// Load local fallback snapshot if available
let localSnapshot: any = null;
try {
  const snapshotPath = path.resolve(__dirname, 'src/data/santri_snapshot.json');
  if (fs.existsSync(snapshotPath)) {
    const raw = fs.readFileSync(snapshotPath, 'utf-8');
    localSnapshot = JSON.parse(raw);
    console.log('[Server] Local santri snapshot loaded successfully with', localSnapshot.data?.length, 'items');
  }
} catch (err) {
  console.warn('[Server] Could not load local snapshot:', err);
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
  console.warn('[Server] Could not load rembangWilayahData.json:', err);
}

// Function to fetch live santri data with timeout and fallback
async function getSantriData(forceFresh: boolean = false): Promise<any> {
  const now = Date.now();
  if (!forceFresh && cachedSantriData && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedSantriData;
  }

  const urlsToTry = [
    'https://alumni.attaroqqy.com/api_alumni.php?action=get_alumni',
    'https://attaroqqy.com/api/db/santri',
  ];

  for (const url of urlsToTry) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
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
      console.warn(`[Server] Failed to fetch from ${url}:`, err?.message);
    }
  }

  // Fallback to cache or snapshot
  if (cachedSantriData) return cachedSantriData;
  if (localSnapshot) return localSnapshot;

  return { success: true, data: [] };
}

async function startServer() {
  const app = express();

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
      timestamp: new Date().toISOString(),
    });
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
      const isFresh = req.query.fresh === 'true' || req.query.force === 'true';
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
      console.log(`[Server] Forwarding PUT update for santri ID: ${id} to alumni.attaroqqy.com and attaroqqy.com`);
      const payload = { id, ...req.body };
      await Promise.allSettled([
        fetch('https://alumni.attaroqqy.com/api_alumni.php?action=update_alumni', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(12000),
        }),
        fetch(`https://attaroqqy.com/api/db/santri/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(12000),
        }),
      ]);

      cachedSantriData = null;
      lastCacheTime = 0;
      res.json({ success: true, message: 'Data santri berhasil diperbarui' });
    } catch (err: any) {
      console.warn(`[Server] Error proxying PUT for ${id}:`, err?.message);
      res.status(500).json({ success: false, message: err?.message });
    }
  });

  // Santri API: POST (create)
  app.post('/api/db/santri', async (req, res) => {
    try {
      console.log('[Server] Forwarding POST new santri to alumni.attaroqqy.com and attaroqqy.com');
      await Promise.allSettled([
        fetch('https://alumni.attaroqqy.com/api_alumni.php?action=add_alumni', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(req.body),
          signal: AbortSignal.timeout(12000),
        }),
        fetch('https://attaroqqy.com/api/db/santri', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(req.body),
          signal: AbortSignal.timeout(12000),
        }),
      ]);

      cachedSantriData = null;
      lastCacheTime = 0;
      res.json({ success: true, message: 'Santri/alumni baru berhasil ditambahkan' });
    } catch (err: any) {
      console.warn('[Server] Error proxying POST santri:', err?.message);
      res.status(500).json({ success: false, message: err?.message });
    }
  });

  // Santri API: DELETE
  app.delete('/api/db/santri/:id', async (req, res) => {
    const { id } = req.params;
    try {
      console.log(`[Server] Forwarding DELETE for santri ID: ${id} to alumni.attaroqqy.com`);
      const remoteRes = await fetch('https://alumni.attaroqqy.com/api_alumni.php?action=delete_alumni', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ id }),
        signal: AbortSignal.timeout(12000),
      });

      const responseData = await remoteRes.json().catch(() => ({ success: remoteRes.ok }));
      cachedSantriData = null;
      lastCacheTime = 0;
      res.status(remoteRes.status || 200).json(responseData);
    } catch (err: any) {
      console.warn(`[Server] Error proxying DELETE for ${id}:`, err?.message);
      res.status(500).json({ success: false, message: err?.message });
    }
  });

  // In-memory cache for events & announcements in dev/fallback
  let cachedEvents: any[] = [];
  let cachedAnnouncements: any[] = [];

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
            cachedEvents = list;
            return res.json({ success: true, data: list });
          }
        }
      }
    } catch (err: any) {
      // Ignore network/remote formatting errors safely
    }
    res.json({ success: true, data: cachedEvents });
  });

  // Events API: POST (save/create)
  app.post('/api/events', async (req, res) => {
    const event = req.body;
    if (event && event.id) {
      const idx = cachedEvents.findIndex((e: any) => e.id === event.id);
      if (idx >= 0) cachedEvents[idx] = event;
      else cachedEvents.unshift(event);
    }
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

  // Events API: DELETE
  app.delete('/api/events/:id', async (req, res) => {
    const { id } = req.params;
    cachedEvents = cachedEvents.filter((e: any) => e.id !== id);
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
    res.json({ success: true });
  });

  // Events API: RSVP
  app.post('/api/events/rsvp', async (req, res) => {
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
    res.json({ success: true });
  });

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
            cachedAnnouncements = list;
            return res.json({ success: true, data: list });
          }
        }
      }
    } catch (err: any) {
      // Ignore network/remote formatting errors safely
    }
    res.json({ success: true, data: cachedAnnouncements });
  });

  // Announcements API: POST (save/create)
  app.post('/api/announcements', async (req, res) => {
    const ann = req.body;
    if (ann && ann.id) {
      const idx = cachedAnnouncements.findIndex((a: any) => a.id === ann.id);
      if (idx >= 0) cachedAnnouncements[idx] = ann;
      else cachedAnnouncements.unshift(ann);
    }
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

  // Announcements API: DELETE
  app.delete('/api/announcements/:id', async (req, res) => {
    const { id } = req.params;
    cachedAnnouncements = cachedAnnouncements.filter((a: any) => a.id !== id);
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
    res.json({ success: true });
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Portal Alumni backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
