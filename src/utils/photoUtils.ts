/**
 * Utility Penanganan URL Foto Profil Santri / Alumni, Cover Banner, Agenda & Pengumuman
 * Memastikan foto dari database Hostinger (attaroqqy.com & alumni.attaroqqy.com) tidak pecah
 * dan sinkronisasi 2 arah berjalan sempurna di browser apa pun.
 */

export const HOSTINGER_BASE_URL = 'https://alumni.attaroqqy.com';
export const MAIN_HOSTINGER_URL = 'https://attaroqqy.com';

/**
 * Menormalkan URL foto agar selalu dapat diakses dari browser mana pun tanpa icon foto pecah
 */
export function getAlumniPhotoUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // Jika string kosong atau nilai literal null / undefined
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined' || trimmed === 'none') {
    return '';
  }

  // Jika sudah berupa data image base64 atau blob URL
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Ambil nama file bersih (tanpa query param dan path folder)
  const filename = trimmed.split('?')[0].replace(/.*[/\\]/, '').trim();
  const isEventMedia = filename.startsWith('event_');

  // Jika sudah URL lengkap http / https
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // Pada Hostinger, /api/uploads/ hanya ada di attaroqqy.com (di alumni.attaroqqy.com mengembalikan 422)
    if (trimmed.includes('alumni.attaroqqy.com') && (isEventMedia || trimmed.includes('/api/uploads/'))) {
      return `https://attaroqqy.com/api/uploads/pas_foto/${filename}`;
    }

    // Jika mengarah ke attaroqqy.com/uploads/ tetapi filenya event: arahkan ke /api/uploads/pas_foto/
    if (trimmed.includes('attaroqqy.com/uploads/') && isEventMedia) {
      return `https://attaroqqy.com/api/uploads/pas_foto/${filename}`;
    }

    // Jika URL mengarah ke localhost atau port dev internal saat diakses dari HP / browser eksternal
    if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
      if (trimmed.includes('localhost:') || trimmed.includes('127.0.0.1:')) {
        if (isEventMedia) {
          return `https://attaroqqy.com/api/uploads/pas_foto/${filename}`;
        }
        return `https://alumni.attaroqqy.com/uploads/pas_foto/${filename}`;
      }
    }

    return trimmed;
  }

  // Jika berupa media event (poster atau lampiran foto Agenda)
  if (isEventMedia) {
    return `https://attaroqqy.com/api/uploads/pas_foto/${filename}`;
  }

  // Jika berupa path relatif /api/uploads/...
  if (trimmed.startsWith('/api/uploads/')) {
    // Jika di lingkungan dev lokal AI Studio, Express proxy menangani /api/uploads/
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('run.app'))) {
      return trimmed;
    }
    // Di produksi (alumni.attaroqqy.com):
    return `https://attaroqqy.com/api/uploads/pas_foto/${filename}`;
  }

  // Jika berupa path relatif /uploads/...
  if (trimmed.startsWith('/uploads/')) {
    // Di dev AI Studio:
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('run.app'))) {
      return trimmed;
    }
    // Di produksi (alumni.attaroqqy.com):
    return `https://alumni.attaroqqy.com/uploads/pas_foto/${filename}`;
  }

  // Jika nama file murni dengan ekstensi (misal: event_poster_... atau adminAvatar_...)
  if (trimmed.includes('.')) {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('run.app'))) {
      return `/uploads/pas_foto/${trimmed}`;
    }
    return `https://alumni.attaroqqy.com/uploads/pas_foto/${trimmed}`;
  }

  return trimmed;
}

/**
 * Image Error Fallback Handler
 * Jika file gagal dimuat dari sumber pertama, otomatis coba server alternatif secara berurutan:
 * 1. https://attaroqqy.com/api/uploads/pas_foto/${filename}
 * 2. https://alumni.attaroqqy.com/uploads/pas_foto/${filename}
 * 3. https://attaroqqy.com/uploads/pas_foto/${filename}
 * 4. /uploads/pas_foto/${filename}
 * 5. /api/uploads/pas_foto/${filename}
 * Jika semua server gagal, sembunyikan <img> agar tidak ada ikon foto rusak/pecah browser,
 * lalu aktifkan kontainer fallback [data-img-fallback] di elemen induknya.
 */
export function handleImageFallbackError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
  const img = e.currentTarget;
  const currentSrc = img.src || '';

  // Dapatkan nama file murni
  const cleanFilename = currentSrc.split('?')[0].replace(/.*[/\\]/, '').trim();
  if (!cleanFilename || !cleanFilename.includes('.')) {
    hideBrokenImage(img);
    return;
  }

  const fallbackCandidates = [
    `https://attaroqqy.com/api/uploads/pas_foto/${cleanFilename}`,
    `https://alumni.attaroqqy.com/uploads/pas_foto/${cleanFilename}`,
    `https://attaroqqy.com/uploads/pas_foto/${cleanFilename}`,
    `/uploads/pas_foto/${cleanFilename}`,
    `/api/uploads/pas_foto/${cleanFilename}`,
  ];

  let step = parseInt(img.getAttribute('data-fallback-step') || '0', 10);

  // Cari kandidat berikutnya yang belum dicoba dan berbeda dari currentSrc
  while (step < fallbackCandidates.length) {
    const candidate = fallbackCandidates[step];
    step++;
    if (candidate !== currentSrc && !currentSrc.endsWith(candidate)) {
      img.setAttribute('data-fallback-step', String(step));
      img.src = candidate;
      return;
    }
  }

  // Jika semua kandidat sudah dicoba dan gagal:
  hideBrokenImage(img);
}

function hideBrokenImage(img: HTMLImageElement) {
  img.setAttribute('data-load-failed', 'true');
  img.style.display = 'none';
  const parentContainer = img.parentElement;
  if (parentContainer) {
    const fallbackEl = parentContainer.querySelector('[data-img-fallback]');
    if (fallbackEl) {
      (fallbackEl as HTMLElement).style.display = 'flex';
    }
  }
}

/**
 * Memformat URL foto sebelum disimpan ke database MySQL Hostinger / Express
 * agar konsisten
 */
export function formatPhotoUrlForHostinger(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith(`${HOSTINGER_BASE_URL}/`)) {
    return trimmed.replace(HOSTINGER_BASE_URL, '');
  }

  if (trimmed.startsWith(`${MAIN_HOSTINGER_URL}/`)) {
    return trimmed.replace(MAIN_HOSTINGER_URL, '');
  }

  return trimmed;
}

/**
 * Inisial nama untuk avatar fallback jika foto tidak ada atau gagal dimuat
 */
export function getInitials(name?: string): string {
  if (!name) return 'A';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'A';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
