/**
 * Utility untuk Generate Username Unik dan NIS Santri / Alumni
 * Sesuai aturan sistem Pondok Pesantren At-Taroqqy
 */

import { AlumniRecord } from '../types';

/**
 * Menghasilkan username unik dari nama:
 * - Huruf kecil
 * - Spasi diganti dengan underscore '_'
 * - Karakter non-alfanumerik dihapus
 * - Jika nama sudah ada di database, beri akhiran angka pembeda (_2, _3, dst)
 */
export function generateUniqueUsername(
  name: string,
  existingUsernames: Set<string> | string[]
): string {
  const takenSet =
    existingUsernames instanceof Set
      ? existingUsernames
      : new Set(existingUsernames.map((u) => u.toLowerCase().trim()));

  const clean = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '') // hilangkan tanda baca seperti tanda petik, kurung, dsb
    .replace(/\s+/g, '_') // ganti spasi dengan underscore
    .replace(/^_+|_+$/g, ''); // hilangkan underscore di awal/akhir

  const baseUsername = clean || 'santri';

  if (!takenSet.has(baseUsername)) {
    return baseUsername;
  }

  // Jika sudah ada yang memakai, cari nomor pembeda terkecil yang belum terpakai
  let counter = 2;
  while (takenSet.has(`${baseUsername}_${counter}`)) {
    counter++;
  }

  return `${baseUsername}_${counter}`;
}

/**
 * Memeriksa apakah username sudah dipakai oleh alumni lain
 */
export function isUsernameTaken(
  username: string,
  currentAlumniId: string | undefined,
  alumniList: AlumniRecord[]
): boolean {
  const cleanUsername = username.toLowerCase().replace(/^@/, '').trim();
  if (!cleanUsername) return false;

  return alumniList.some((alm) => {
    if (currentAlumniId && alm.id === currentAlumniId) return false;
    const almUser = (alm.username || '').toLowerCase().replace(/^@/, '').trim();
    return almUser === cleanUsername;
  });
}

/**
 * Generate NIS berdasarkan Tanggal Masuk:
 * Format: 4 digit tahun masuk + 3 digit nomor urut di tahun itu
 * Contoh: Tahun masuk 2024 -> 2024001, 2024002, dst.
 * Jika tanggal masuk belum diisi, kembalikan string kosong ''
 */
export function generateNisFromEntryDate(
  entryDateOrYear: string | undefined,
  alumniList: AlumniRecord[]
): string {
  if (!entryDateOrYear || !entryDateOrYear.trim()) {
    return '';
  }

  // Ambil 4 digit tahun (dari format YYYY-MM-DD atau string tahun YYYY)
  const trimmed = entryDateOrYear.trim();
  const yearMatch = trimmed.match(/^(\d{4})/);
  if (!yearMatch) {
    return '';
  }

  const yearStr = yearMatch[1]; // misal "2024"

  // Cari seluruh NIS di alumniList yang sudah ada pada tahun tersebut
  // NIS standar: YYYYXXX (7 digit, misal 1993006 atau 2024001)
  let maxSequence = 0;

  for (const alm of alumniList) {
    const nisStr = String(alm.nis || '').trim();
    if (nisStr.startsWith(yearStr)) {
      const suffix = nisStr.slice(yearStr.length);
      const parsedNum = parseInt(suffix, 10);
      if (!isNaN(parsedNum) && parsedNum > maxSequence) {
        maxSequence = parsedNum;
      }
    }
  }

  const nextSeq = maxSequence + 1;
  const seqPadded = nextSeq.toString().padStart(3, '0');

  return `${yearStr}${seqPadded}`;
}
