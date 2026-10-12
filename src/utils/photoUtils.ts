/**
 * Utility Penanganan URL Foto Profil Santri / Alumni & Cover Banner
 * Memastikan foto dari database Hostinger (attaroqqy.com) tidak pecah di subdomain (alumni.attaroqqy.com)
 * dan sinkronisasi 2 arah berjalan sempurna.
 */

export const HOSTINGER_BASE_URL = 'https://attaroqqy.com';

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
    // Jika URL mengarah ke localhost atau port dev internal aplikasi lama
    if (trimmed.includes('localhost:') || trimmed.includes('127.0.0.1:')) {
      const pathPart = trimmed.replace(/^https?:\/\/[^/]+/, '');
      return `${HOSTINGER_BASE_URL}${pathPart.startsWith('/') ? pathPart : '/' + pathPart}`;
    }
    return trimmed;
  }

  // Jika URL berupa path relatif berawalan slash (misal: /api/uploads/pas_foto/filePasFoto_...)
  if (trimmed.startsWith('/')) {
    return `${HOSTINGER_BASE_URL}${trimmed}`;
  }

  // Jika berawalan tanpa slash (misal: api/uploads/pas_foto/... atau uploads/...)
  if (trimmed.startsWith('api/') || trimmed.startsWith('uploads/')) {
    return `${HOSTINGER_BASE_URL}/${trimmed}`;
  }

  // Jika hanya berupa nama file murni (misal: filePasFoto_1785902675996_8jgje.png)
  if (trimmed.includes('.')) {
    return `${HOSTINGER_BASE_URL}/api/uploads/pas_foto/${trimmed}`;
  }

  return trimmed;
}

/**
 * Memformat URL foto sebelum disimpan ke database MySQL Hostinger / Express
 * agar sesuai format asli aplikasi lama (/api/uploads/pas_foto/...)
 */
export function formatPhotoUrlForHostinger(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Jika URL lengkap mengarah ke attaroqqy.com, ubah kembali ke path relatif
  if (trimmed.startsWith(`${HOSTINGER_BASE_URL}/`)) {
    return trimmed.replace(HOSTINGER_BASE_URL, '');
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
