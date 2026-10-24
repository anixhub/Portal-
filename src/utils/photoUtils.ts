/**
 * Utility Penanganan URL Foto Profil Santri / Alumni & Cover Banner
 * Memastikan foto dari database Hostinger (attaroqqy.com & alumni.attaroqqy.com) tidak pecah
 * dan sinkronisasi 2 arah berjalan sempurna.
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

  // Jika sudah URL lengkap http / https
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // Jika mengarah ke domain Hostinger attaroqqy / alumni.attaroqqy
    // Arahkan ke endpoint relatif /uploads/ yang dikelola oleh server aplikasi,
    // yang akan mencari file lokal terlebih dahulu atau memproksikannya secara otomatis
    if (trimmed.includes('alumni.attaroqqy.com/uploads/')) {
      return trimmed.replace(/^https?:\/\/alumni\.attaroqqy\.com/, '');
    }
    if (trimmed.includes('attaroqqy.com/uploads/')) {
      return trimmed.replace(/^https?:\/\/attaroqqy\.com/, '');
    }
    if (trimmed.includes('attaroqqy.com/api/uploads/')) {
      return trimmed.replace(/^https?:\/\/attaroqqy\.com\/api\/uploads\//, '/uploads/');
    }

    // Jika URL mengarah ke localhost atau port dev internal aplikasi
    if (trimmed.includes('localhost:') || trimmed.includes('127.0.0.1:')) {
      const pathPart = trimmed.replace(/^https?:\/\/[^/]+/, '');
      return pathPart.startsWith('/') ? pathPart : '/' + pathPart;
    }

    return trimmed;
  }

  // Jika URL berupa path relatif berawalan slash (misal: /uploads/pas_foto/... atau /api/uploads/...)
  if (trimmed.startsWith('/api/uploads/')) {
    return trimmed.replace('/api/uploads/', '/uploads/');
  }

  if (trimmed.startsWith('/uploads/')) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // Jika berawalan tanpa slash (misal: api/uploads/... atau uploads/...)
  if (trimmed.startsWith('api/uploads/')) {
    return '/' + trimmed.replace('api/uploads/', 'uploads/');
  }

  if (trimmed.startsWith('uploads/')) {
    return '/' + trimmed;
  }

  // Jika hanya berupa nama file murni (misal: filePasFoto_... atau adminAvatar_... atau sampul_...)
  if (trimmed.includes('.')) {
    return `/uploads/pas_foto/${trimmed}`;
  }

  return trimmed;
}

/**
 * Image Error Fallback Handler
 * Jika file gagal dimuat dari local/subdomain, coba alternatif sebelum menampilkan fallback avatar/cover
 */
export function handleImageFallbackError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
  const img = e.currentTarget;
  const currentSrc = img.src;

  const retryCount = Number(img.getAttribute('data-retry-count') || '0');
  if (retryCount >= 3) {
    // Sembunyikan gambar yang pecah secara bersih agar elemen fallback di bawahnya terlihat
    img.setAttribute('data-load-failed', 'true');
    img.style.display = 'none';
    const parentContainer = img.parentElement;
    if (parentContainer) {
      const fallbackEl = parentContainer.querySelector('[data-img-fallback]');
      if (fallbackEl) {
        (fallbackEl as HTMLElement).style.display = 'flex';
      }
    }
    return;
  }

  img.setAttribute('data-retry-count', String(retryCount + 1));

  try {
    const urlObj = new URL(currentSrc);
    // Jika gagal load dari remote Hostinger, coba load melalui endpoint lokal /uploads/
    if (urlObj.pathname.includes('/uploads/')) {
      const uploadPath = urlObj.pathname.substring(urlObj.pathname.indexOf('/uploads/'));
      if (retryCount === 0 && !currentSrc.startsWith(window.location.origin)) {
        img.src = uploadPath;
        return;
      }
    }
  } catch {}

  if (currentSrc.includes('alumni.attaroqqy.com')) {
    // Coba ke domain utama attaroqqy.com
    img.src = currentSrc.replace('https://alumni.attaroqqy.com', 'https://attaroqqy.com');
  } else if (currentSrc.includes('attaroqqy.com')) {
    // Coba ke subdomain alumni.attaroqqy.com
    img.src = currentSrc.replace('https://attaroqqy.com', 'https://alumni.attaroqqy.com');
  } else {
    // Jika dari local path gagal, coba ambil dari alumni.attaroqqy.com
    const pathPart = currentSrc.replace(/^https?:\/\/[^/]+/, '');
    if (pathPart.includes('/uploads/')) {
      img.src = `https://alumni.attaroqqy.com${pathPart.substring(pathPart.indexOf('/uploads/'))}`;
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
