/**
 * Utility Pengelolaan Username dan NIS Alumni
 * Sesuai aturan:
 * 1. Default username: nama diubah menjadi lowercase, spasi diganti underscore (_).
 *    Jika ada nama sama, diberi nomor pembeda (_2, _3, dst). Semua username harus unik.
 * 2. NIS: Acuan generate dari Tanggal Masuk (entryDate).
 *    Format: 4 digit tahun + 3 digit nomor urut santri pada tahun tersebut (contoh: 2021001, 2021002).
 *    Jika tgl masuk sama, yang lebih awal diinput mendapat nomor lebih dulu.
 *    Jika belum mengisi tanggal masuk, NIS belum ada (kosong).
 */

import { AlumniRecord } from '../types';

/**
 * Membersihkan nama menjadi username dasar:
 * - lowercase
 * - ganti spasi dengan underscore
 * - hapus simbol/karakter ilegal selain huruf, angka, dan underscore
 */
export function formatBaseUsername(name: string): string {
  if (!name || !name.trim()) return 'santri';
  const cleaned = name
    .toLowerCase()
    .trim()
    .replace(/[\s\t\n]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned || 'santri';
}

/**
 * Menghasilkan username unik baru berdasarkan nama alumni dan daftar alumni yang ada.
 */
export function generateUniqueUsername(
  name: string,
  existingList: { id?: string; username?: string }[],
  currentId?: string
): string {
  const base = formatBaseUsername(name);
  const taken = new Set<string>();

  for (const item of existingList) {
    if (item.id && currentId && item.id === currentId) continue;
    if (item.username) {
      const u = item.username.toLowerCase().replace(/^@/, '').trim();
      if (u) taken.add(u);
    }
  }

  if (!taken.has(base)) {
    return base;
  }

  let counter = 2;
  while (taken.has(`${base}_${counter}`)) {
    counter++;
  }
  return `${base}_${counter}`;
}

/**
 * Mengecek apakah suatu username sudah dipakai oleh alumni lain.
 */
export function isUsernameTaken(
  username: string,
  existingList: { id?: string; username?: string }[],
  currentId?: string
): boolean {
  const clean = username.toLowerCase().replace(/^@/, '').trim();
  if (!clean) return false;

  return existingList.some((item) => {
    if (item.id && currentId && item.id === currentId) return false;
    const existing = (item.username || '').toLowerCase().replace(/^@/, '').trim();
    return existing === clean;
  });
}

/**
 * Menghasilkan NIS baru untuk alumni berdasarkan tanggal masuk (entryDate).
 * Format: 4 digit tahun + 3 digit nomor urut santri di tahun itu (contoh: 2021001, 2021002).
 * Jika entryDate belum diisi -> mengembalikan string kosong ''.
 */
export function generateNisFromEntryDate(
  entryDate: string | undefined | null,
  existingList: { id?: string; nis?: string; entryDate?: string; entryYear?: string }[],
  currentId?: string
): string {
  if (!entryDate || !entryDate.trim()) {
    return '';
  }

  const cleanDate = entryDate.trim();
  // Ambil 4 digit tahun dari YYYY-MM-DD atau YYYY
  const yearMatch = cleanDate.match(/^(\d{4})/);
  if (!yearMatch) {
    return '';
  }

  const year = yearMatch[1]; // misal "2021"

  // Cari semua NIS yang sudah ada pada tahun tersebut
  const existingNisNumbers: number[] = [];

  for (const item of existingList) {
    if (item.id && currentId && item.id === currentId) continue;
    const nis = (item.nis || '').trim();
    if (!nis) continue;

    // Pola 1: YYYYNNN (7 digit angka, misal 2021001)
    if (nis.startsWith(year) && /^\d{7}$/.test(nis)) {
      const seqStr = nis.slice(4);
      const seqNum = parseInt(seqStr, 10);
      if (!isNaN(seqNum) && seqNum > 0) {
        existingNisNumbers.push(seqNum);
      }
    } else if (nis.startsWith(year)) {
      // Pola lain berawalan tahun
      const digitsOnly = nis.replace(/\D/g, '');
      if (digitsOnly.startsWith(year)) {
        const seqStr = digitsOnly.slice(4);
        const seqNum = parseInt(seqStr, 10);
        if (!isNaN(seqNum) && seqNum > 0) {
          existingNisNumbers.push(seqNum);
        }
      }
    }
  }

  const maxSeq = existingNisNumbers.length > 0 ? Math.max(...existingNisNumbers) : 0;
  const nextSeq = maxSeq + 1;
  const seqPadded = String(nextSeq).padStart(3, '0');

  return `${year}${seqPadded}`;
}

/**
 * Menormalkan seluruh daftar alumni agar:
 * 1. Seluruh username terisi unik dan sesuai aturan (_2, _3 jika nama sama).
 * 2. Seluruh NIS yang memiliki tanggal masuk terformat 4 digit tahun + 3 digit urutan (YYYYNNN).
 *    Jika alumni belum memiliki tanggal masuk, NIS dikosongkan.
 */
export function ensureConsistentAlumniIdentities(list: AlumniRecord[]): AlumniRecord[] {
  const usernameMap = new Map<string, number>();
  const usedUsernames = new Set<string>();

  // 1. Pastikan Username Unik untuk semua record
  const withUniqueUsernames = list.map((alumni) => {
    let username = (alumni.username || '').toLowerCase().replace(/^@/, '').trim();

    if (!username || usedUsernames.has(username)) {
      const base = formatBaseUsername(alumni.name);
      let count = usernameMap.get(base) || 0;
      count++;
      usernameMap.set(base, count);

      let candidate = count === 1 ? base : `${base}_${count}`;
      while (usedUsernames.has(candidate)) {
        count++;
        usernameMap.set(base, count);
        candidate = `${base}_${count}`;
      }
      username = candidate;
    } else {
      const base = formatBaseUsername(alumni.name);
      const currentCount = usernameMap.get(base) || 0;
      usernameMap.set(base, currentCount + 1);
    }

    usedUsernames.add(username);

    return {
      ...alumni,
      username,
    };
  });

  // 2. Kelompokkan berdasarkan tahun masuk untuk menghitung urutan NIS konsisten
  // Jika alumni tidak memiliki entryDate atau tanggal masuk kosong, nis = ''
  const recordsByYear = new Map<string, AlumniRecord[]>();

  withUniqueUsernames.forEach((alumni) => {
    const rawDate = alumni.entryDate || '';
    const yearMatch = rawDate.match(/^(\d{4})/);
    const year = yearMatch ? yearMatch[1] : (alumni.entryYear && /^\d{4}$/.test(alumni.entryYear) ? alumni.entryYear : null);

    if (year) {
      if (!recordsByYear.has(year)) {
        recordsByYear.set(year, []);
      }
      recordsByYear.get(year)!.push(alumni);
    }
  });

  // Urutkan per tahun: tanggal masuk lebih awal -> urutan lebih awal, jika sama -> urutan asli list
  const nisLookup = new Map<string, string>();

  recordsByYear.forEach((yearList, year) => {
    // Sort stable berdasarkan entryDate
    yearList.sort((a, b) => {
      const dateA = a.entryDate || `${year}-01-01`;
      const dateB = b.entryDate || `${year}-01-01`;
      return dateA.localeCompare(dateB);
    });

    yearList.forEach((alm, idx) => {
      // Jika nis alumni sudah berformat YYYYNNN yang valid untuk tahun tersebut, pertahankan jika tidak tabrakan
      const seq = String(idx + 1).padStart(3, '0');
      const standardNis = `${year}${seq}`;
      nisLookup.set(alm.id, standardNis);
    });
  });

  return withUniqueUsernames.map((alumni) => {
    // Jika tidak memiliki tanggal masuk sama sekali, NIS belum ada
    if (!alumni.entryDate && !alumni.entryYear) {
      return {
        ...alumni,
        nis: '',
      };
    }

    const calculatedNis = nisLookup.get(alumni.id);
    return {
      ...alumni,
      nis: calculatedNis || alumni.nis || '',
    };
  });
}
