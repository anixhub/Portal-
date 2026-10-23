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
  if (!name || !name.trim()) return '';
  const cleaned = name
    .toLowerCase()
    .trim()
    .replace(/[\s\t\n]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned;
}

/**
 * Menghasilkan username unik baru berdasarkan nama alumni dan daftar alumni yang ada.
 */
export function generateUniqueUsername(
  name: string,
  existingList: { id?: string; username?: string }[],
  currentId?: string
): string {
  const base = formatBaseUsername(name) || 'santri';
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
      const base = formatBaseUsername(alumni.name) || 'santri';
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
      const base = formatBaseUsername(alumni.name) || 'santri';
      const currentCount = usernameMap.get(base) || 0;
      usernameMap.set(base, currentCount + 1);
    }

    usedUsernames.add(username);

    return {
      ...alumni,
      username,
    };
  });

  // 2. Kelompokkan berdasarkan tanggal masuk untuk menghitung urutan NIS konsisten
  // Sesuai aturan:
  // "Buat tgl masuk ini menjadi acuan generate nis di database. Yaitu 4 digit tahun 3 digit akhir nomor urut santri di tahun itu. Apabila tgl nya sama ya maka yang lebih dulu diinput lebih awal nomernya. Apabila belum mengisi tanggal masuk maka nis belum ada"
  const recordsByYear = new Map<string, { alumni: AlumniRecord; originalIndex: number }[]>();

  withUniqueUsernames.forEach((alumni, originalIndex) => {
    const rawDate = (alumni.entryDate || '').trim();
    const yearMatch = rawDate.match(/^(\d{4})/);

    if (yearMatch) {
      const year = yearMatch[1];
      if (!recordsByYear.has(year)) {
        recordsByYear.set(year, []);
      }
      recordsByYear.get(year)!.push({ alumni, originalIndex });
    }
  });

  // Urutkan per tahun: tanggal masuk lebih awal -> urutan lebih awal, jika tgl sama -> yang lebih awal diinput (originalIndex)
  const nisLookup = new Map<string, string>();

  recordsByYear.forEach((yearList, year) => {
    yearList.sort((a, b) => {
      const dateA = a.alumni.entryDate || `${year}-01-01`;
      const dateB = b.alumni.entryDate || `${year}-01-01`;
      const cmp = dateA.localeCompare(dateB);
      if (cmp !== 0) return cmp;
      return a.originalIndex - b.originalIndex;
    });

    yearList.forEach((item, idx) => {
      const seq = String(idx + 1).padStart(3, '0');
      const standardNis = `${year}${seq}`;
      nisLookup.set(item.alumni.id, standardNis);
    });
  });

  return withUniqueUsernames.map((alumni) => {
    // Apabila belum mengisi tanggal masuk maka NIS belum ada (kosong)
    const rawDate = (alumni.entryDate || '').trim();
    if (!rawDate) {
      return {
        ...alumni,
        nis: '',
      };
    }

    const calculatedNis = nisLookup.get(alumni.id);
    return {
      ...alumni,
      nis: calculatedNis || '',
    };
  });
}

export interface NisCascadeResult {
  targetNis: string;
  affectedAlumni: Array<{ id: string; nis: string; name: string }>;
}

/**
 * Menghitung NIS baru saat tanggal masuk diubah atau dihapus,
 * serta menghitung pergeseran berantai (cascade shift) santri lain di tahun tersebut.
 *
 * Contoh:
 * - Awalnya santri A masuk 2011 urutan ke-5 (2011005).
 * - Tanggal masuk diubah sehingga urutannya menjadi ke-3 (2011003).
 * - Maka santri yang sebelumnya urutan ke-3 digeser jadi 4, urutan ke-4 jadi 5.
 * - Santri A menjadi 2011003.
 * - Jika tanggal masuk dihapus -> NIS menjadi '', santri lain di tahun tersebut urutannya dirapatkan.
 */
export function calculateCascadeShiftOnEntryDateChange(
  targetId: string,
  newEntryDate: string | undefined | null,
  allAlumni: AlumniRecord[]
): NisCascadeResult {
  const cleanNewDate = (newEntryDate || '').trim();
  const currentAlumni = allAlumni.find((a) => a.id === targetId);
  const oldEntryDate = (currentAlumni?.entryDate || '').trim();
  const oldYear = oldEntryDate.match(/^(\d{4})/)?.[1];
  const newYear = cleanNewDate.match(/^(\d{4})/)?.[1];

  const affectedMap = new Map<string, { id: string; nis: string; name: string }>();

  // KASUS 1: Tanggal masuk dihapus / kosong
  if (!cleanNewDate || !newYear) {
    if (oldYear) {
      // Rapatkan urutan tahun lama
      const oldYearAlumni = allAlumni
        .filter((a) => a.id !== targetId && (a.entryDate || '').startsWith(oldYear))
        .sort((a, b) => {
          const dA = a.entryDate || `${oldYear}-01-01`;
          const dB = b.entryDate || `${oldYear}-01-01`;
          const cmp = dA.localeCompare(dB);
          if (cmp !== 0) return cmp;
          return (a.nis || '').localeCompare(b.nis || '');
        });

      oldYearAlumni.forEach((alm, idx) => {
        const nextNis = `${oldYear}${String(idx + 1).padStart(3, '0')}`;
        if (alm.nis !== nextNis) {
          affectedMap.set(alm.id, { id: alm.id, nis: nextNis, name: alm.name });
        }
      });
    }

    return {
      targetNis: '',
      affectedAlumni: Array.from(affectedMap.values()),
    };
  }

  // KASUS 2: Tanggal masuk diubah / diatur
  // A. Jika berganti tahun, rapatkan tahun lama
  if (oldYear && oldYear !== newYear) {
    const oldYearAlumni = allAlumni
      .filter((a) => a.id !== targetId && (a.entryDate || '').startsWith(oldYear))
      .sort((a, b) => {
        const dA = a.entryDate || `${oldYear}-01-01`;
        const dB = b.entryDate || `${oldYear}-01-01`;
        const cmp = dA.localeCompare(dB);
        if (cmp !== 0) return cmp;
        return (a.nis || '').localeCompare(b.nis || '');
      });

    oldYearAlumni.forEach((alm, idx) => {
      const nextNis = `${oldYear}${String(idx + 1).padStart(3, '0')}`;
      if (alm.nis !== nextNis) {
        affectedMap.set(alm.id, { id: alm.id, nis: nextNis, name: alm.name });
      }
    });
  }

  // B. Susun ulang seluruh santri di tahun baru
  const newYearAlumni = allAlumni
    .filter((a) => (a.entryDate || '').startsWith(newYear))
    .map((a) => (a.id === targetId ? { ...a, entryDate: cleanNewDate } : a));

  // Jika target sebelumnya belum masuk daftar tahun baru, tambahkan
  if (!newYearAlumni.some((a) => a.id === targetId) && currentAlumni) {
    newYearAlumni.push({ ...currentAlumni, entryDate: cleanNewDate });
  }

  newYearAlumni.sort((a, b) => {
    const dA = (a.id === targetId ? cleanNewDate : a.entryDate) || `${newYear}-01-01`;
    const dB = (b.id === targetId ? cleanNewDate : b.entryDate) || `${newYear}-01-01`;
    const cmp = dA.localeCompare(dB);
    if (cmp !== 0) return cmp;
    // Jika tanggal sama persis, pertahankan nomor urut lama atau ID
    const numA = parseInt((a.nis || '').slice(4), 10) || 9999;
    const numB = parseInt((b.nis || '').slice(4), 10) || 9999;
    if (numA !== numB) return numA - numB;
    return a.id.localeCompare(b.id);
  });

  let calculatedTargetNis = `${newYear}001`;

  newYearAlumni.forEach((alm, idx) => {
    const nextNis = `${newYear}${String(idx + 1).padStart(3, '0')}`;
    if (alm.id === targetId) {
      calculatedTargetNis = nextNis;
    } else if (alm.nis !== nextNis) {
      affectedMap.set(alm.id, { id: alm.id, nis: nextNis, name: alm.name });
    }
  });

  return {
    targetNis: calculatedTargetNis,
    affectedAlumni: Array.from(affectedMap.values()),
  };
}

/**
 * Menghitung pergeseran berantai ketika admin secara manual mengisi NIS tertentu (7 digit: YYYYNNN)
 * Jika NIS sudah dipakai santri lain (baik alumni maupun aktif), santri yang bentrok dan seluruh urutan setelahnya digeser naik (+1).
 */
export function cascadeShiftOnManualNisChange(
  targetId: string,
  desiredNis: string,
  allSantriOrAlumni: Array<AlumniRecord | { id: string; nis?: string; name?: string; nama?: string; status?: string }>
): NisCascadeResult {
  const cleanNis = desiredNis.trim();
  if (cleanNis.length !== 7 || !/^\d{7}$/.test(cleanNis)) {
    return { targetNis: cleanNis, affectedAlumni: [] };
  }

  const year = cleanNis.slice(0, 4);
  const targetSeq = parseInt(cleanNis.slice(4), 10);
  if (isNaN(targetSeq) || targetSeq <= 0) {
    return { targetNis: cleanNis, affectedAlumni: [] };
  }

  // Cari apakah ada yang bentrok di tahun ini
  const colliding = allSantriOrAlumni.find(
    (a) => a.id !== targetId && a.nis && a.nis.trim() === cleanNis
  );

  if (!colliding) {
    return { targetNis: cleanNis, affectedAlumni: [] };
  }

  // Ada benturan: kumpulkan semua record di tahun yang sama dengan urutan >= targetSeq
  const sameYearRecords = allSantriOrAlumni
    .filter((a) => a.id !== targetId && a.nis && a.nis.startsWith(year) && /^\d{7}$/.test(a.nis))
    .map((a) => {
      const seq = parseInt(a.nis!.slice(4), 10);
      return { item: a, seq };
    })
    .filter((entry) => entry.seq >= targetSeq)
    .sort((a, b) => b.seq - a.seq); // Geser dari urutan paling besar dulu

  const affectedAlumni: Array<{ id: string; nis: string; name: string }> = [];

  sameYearRecords.forEach((entry) => {
    const nextSeq = entry.seq + 1;
    const nextNis = `${year}${String(nextSeq).padStart(3, '0')}`;
    affectedAlumni.push({
      id: entry.item.id,
      nis: nextNis,
      name: entry.item.name || (entry.item as any).nama || 'Santri',
    });
  });

  return {
    targetNis: cleanNis,
    affectedAlumni,
  };
}

