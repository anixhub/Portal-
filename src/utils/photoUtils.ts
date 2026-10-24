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
    // Jika URL mengarah ke localhost atau port dev internal aplikasi
    if (trimmed.includes('localhost:') || trimmed.includes('127.0.0.1:')) {
      const pathPart = trimmed.replace(/^https?:\/\/[^/]+/, '');
      return `${HOSTINGER_BASE_URL}${pathPart.startsWith('/') ? pathPart : '/' + pathPart}`;
    }

    // PENTING: File fisik yang diunggah via api_alumni.php disimpan di subdomain alumni.attaroqqy.com/uploads/
    // Jika domain utama attaroqqy.com/uploads/ diakses langsung, server Hostinger mengembalikan HTTP 422
    // Kita arahkan ke alumni.attaroqqy.com yang mengembalikan HTTP 200 OK
    if (trimmed.includes('attaroqqy.com/uploads/')) {
      return trimmed
        .replace('https://attaroqqy.com/uploads/', 'https://alumni.attaroqqy.com/uploads/')
        .replace('http://attaroqqy.com/uploads/', 'https://alumni.attaroqqy.com/uploads/');
    }

    if (trimmed.includes('attaroqqy.com/api/uploads/')) {
      return trimmed
        .replace('https://attaroqqy.com/api/uploads/', 'https://alumni.attaroqqy.com/uploads/')
        .replace('http://attaroqqy.com/api/uploads/', 'https://alumni.attaroqqy.com/uploads/');
    }

    return trimmed;
  }

  // Jika URL berupa path relatif berawalan slash (misal: /uploads/pas_foto/... atau /api/uploads/...)
  if (trimmed.startsWith('/api/uploads/')) {
    return `${HOSTINGER_BASE_URL}${trimmed.replace('/api/uploads/', '/uploads/')}`;
  }

  if (trimmed.startsWith('/uploads/')) {
    return `${HOSTINGER_BASE_URL}${trimmed}`;
  }

  if (trimmed.startsWith('/')) {
    return `${HOSTINGER_BASE_URL}${trimmed}`;
  }

  // Jika berawalan tanpa slash (misal: api/uploads/... atau uploads/...)
  if (trimmed.startsWith('api/uploads/')) {
    return `${HOSTINGER_BASE_URL}/${trimmed.replace('api/uploads/', 'uploads/')}`;
  }

  if (trimmed.startsWith('uploads/')) {
    return `${HOSTINGER_BASE_URL}/${trimmed}`;
  }

  // Jika hanya berupa nama file murni (misal: filePasFoto_... atau adminAvatar_... atau sampul_...)
  if (trimmed.includes('.')) {
    return `${HOSTINGER_BASE_URL}/uploads/pas_foto/${trimmed}`;
  }

  return trimmed;
}

/**
 * Image Error Fallback Handler
 * Jika file gagal dimuat dari satu subdomain/domain, coba domain alternatif
 */
export function handleImageFallbackError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
  const img = e.currentTarget;
  const currentSrc = img.src;

  const retryCount = Number(img.getAttribute('data-retry-count') || '0');
  if (retryCount >= 2) {
    // Sembunyikan elemen jika semua alternatif sudah dicoba agar tidak tampak ikon silang pecah
    img.style.opacity = '0';
    return;
  }

  img.setAttribute('data-retry-count', String(retryCount + 1));

  if (currentSrc.includes('alumni.attaroqqy.com')) {
    // Coba ke domain utama attaroqqy.com
    img.src = currentSrc.replace('https://alumni.attaroqqy.com', 'https://attaroqqy.com');
  } else if (currentSrc.includes('attaroqqy.com')) {
    // Coba ke subdomain alumni.attaroqqy.com
    img.src = currentSrc.replace('https://attaroqqy.com', 'https://alumni.attaroqqy.com');
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
