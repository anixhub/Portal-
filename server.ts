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
const CACHE_TTL_MS = 60 * 1000; // 60 seconds cache to prevent repeated remote overhead

// Load local fallback snapshot if available
let localSnapshot: any = null;
try {
  const snapshotPath = path.resolve(__dirname, 'src/data/santri_snapshot.json');
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
    'https://alumni.attaroqqy.com/api_alumni.php?action=get_alumni',
    'https://attaroqqy.com/api/db/santri',
  ];

  for (const url of urlsToTry) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'AttaroqqyPortal/1.0',
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

  // Persistent file paths for dev/fallback storage
  const eventsStorePath = path.resolve(__dirname, 'src/data/events_store.json');
  const announcementsStorePath = path.resolve(__dirname, 'src/data/announcements_store.json');
  const deletedEventsStorePath = path.resolve(__dirname, 'src/data/deleted_events_store.json');
  const deletedAnnouncementsStorePath = path.resolve(__dirname, 'src/data/deleted_announcements_store.json');
  const commentsStorePath = path.resolve(__dirname, 'src/data/comments_store.json');
  const quranBookmarksStorePath = path.resolve(__dirname, 'src/data/quran_bookmarks_store.json');

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
            const filtered = list.filter((e: any) => e && e.id && !deletedEventIds.includes(e.id));
            cachedEvents = filtered;
            saveJsonStore(eventsStorePath, cachedEvents);
            return res.json({ success: true, data: filtered });
          }
        }
      }
    } catch (err: any) {
      // Ignore network/remote formatting errors safely
    }
    const filteredCached = cachedEvents.filter((e: any) => e && e.id && !deletedEventIds.includes(e.id));
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
    const { eventId, alumniId, status, note, authorName, authorHandle, authorAvatar } = req.body || {};
    if (eventId && alumniId) {
      const commId = `comm-rsvp-${alumniId}-${eventId}`;
      const defaultNote = status === 'hadir' ? 'Insya Allah saya hadir' : status === 'tidak_hadir' ? 'Mohon maaf belum bisa hadir' : '';
      const finalContent = (note && String(note).trim()) ? String(note).trim() : defaultNote;

      if (finalContent) {
        const rsvpComment = {
          id: commId,
          eventId,
          postType: 'event',
          authorId: alumniId,
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
            const filtered = list.filter((a: any) => a && a.id && !deletedAnnouncementIds.includes(a.id));
            cachedAnnouncements = filtered;
            saveJsonStore(announcementsStorePath, cachedAnnouncements);
            return res.json({ success: true, data: filtered });
          }
        }
      }
    } catch (err: any) {
      // Ignore network/remote formatting errors safely
    }
    const filteredCached = cachedAnnouncements.filter((a: any) => a && a.id && !deletedAnnouncementIds.includes(a.id));
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
          cachedComments = json.data;
          saveJsonStore(commentsStorePath, cachedComments);
          return res.json({ success: true, data: json.data });
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
        if (idx >= 0) cachedComments[idx] = comm;
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Portal Alumni backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
