import { AlumniRecord, EventAgenda, AnnouncementItem } from '../types';
import { INITIAL_ALUMNI, INITIAL_EVENTS, INITIAL_ANNOUNCEMENTS } from '../data/mockData';
import { getAlumniPhotoUrl, formatPhotoUrlForHostinger } from '../utils/photoUtils';
import { ensureConsistentAlumniIdentities } from '../utils/alumniIdentityUtils';

// URL Endpoint API di Hostinger (Domain Portal Alumni)
export const HOSTINGER_API_URL =
  import.meta.env.VITE_HOSTINGER_API_URL || 'https://alumni.attaroqqy.com/api_alumni.php';

// URL Endpoint Express DB Backend SmartSantri (aplikasi lama)
export const HOSTINGER_EXPRESS_DB_URL =
  import.meta.env.VITE_HOSTINGER_EXPRESS_DB_URL || '/api/db';

// Broadcast Channel untuk sinkronisasi instan antar-tab / browser
export const syncChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('attaroqqy_portal_sync_v1')
    : null;

export function broadcastSyncEvent(type: 'alumni' | 'events' | 'announcements' | 'all') {
  if (syncChannel) {
    try {
      syncChannel.postMessage({ type, timestamp: Date.now() });
    } catch (e) {}
  }
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('attaroqqy_sync_pulse', `${type}_${Date.now()}`);
    } catch (e) {}
  }
}

export interface HostingerApiResponse<T> {
  success: boolean;
  total?: number;
  data?: T;
  message?: string;
  id?: string;
}

/**
 * Normalisasi data santri dari database Hostinger MySQL / Express ke AlumniRecord
 */
export function normalizeSingleAlumni(item: any): AlumniRecord {
  // Gender parser
  const rawGender = String(
    item.gender ??
    item.jenis_kelamin ??
    item.jenisKelamin ??
    item.jk ??
    item.jeniskelamin ??
    item.sex ??
    item.kelamin ??
    ''
  ).trim().toLowerCase();

  const isPutra =
    rawGender === 'l' ||
    rawGender === '1' ||
    rawGender === 'putra' ||
    rawGender === 'pria' ||
    rawGender === 'laki-laki' ||
    rawGender === 'laki' ||
    rawGender === 'ikhwan' ||
    rawGender === 'male' ||
    rawGender.startsWith('laki') ||
    rawGender.startsWith('pria') ||
    rawGender.startsWith('putra');

  const isPutri = 
    rawGender === 'p' ||
    rawGender === 'f' ||
    rawGender === '2' ||
    rawGender === 'putri' ||
    rawGender === 'wanita' ||
    rawGender === 'perempuan' ||
    rawGender === 'akhwat' ||
    rawGender === 'female' ||
    rawGender.startsWith('perem') ||
    rawGender.startsWith('putri') ||
    rawGender.startsWith('wanita');

  const gender: 'L' | 'P' = (isPutri && !isPutra) ? 'P' : 'L';

  // Urutan anak (anak ke - database field: anak_ke)
  const rawAnakKe = 
    item.anak_ke ??
    item.anakKe ??
    item.anakke ??
    item.urutanAnak ??
    item.urutan_anak ??
    item.urutan ??
    item.anak ??
    item.anak_ke_berapa;
  const parsedAnakKe = parseInt(String(rawAnakKe !== undefined && rawAnakKe !== null ? rawAnakKe : '').replace(/[^0-9]/g, ''), 10);
  const urutanAnak = !isNaN(parsedAnakKe) && parsedAnakKe >= 0 ? parsedAnakKe : 1;
  const anak_ke = urutanAnak;

  // Jumlah saudara (database field: dari_bersaudara / jumlah_saudara / dariBersaudara)
  const rawDariBersaudara = 
    item.dari_bersaudara ??
    item.dariBersaudara ??
    item.jumlahSaudara ??
    item.jumlah_saudara ??
    item.daribersaudara ??
    item.bersaudara ??
    item.jml_saudara ??
    item.saudara ??
    item.jml_sdr ??
    item.saudara_kandung ??
    item.jumlah_saudara_kandung ??
    item.total_saudara ??
    item.saudara_total ??
    item.banyak_saudara;
  const parsedSaudara = parseInt(String(rawDariBersaudara !== undefined && rawDariBersaudara !== null ? rawDariBersaudara : '').replace(/[^0-9]/g, ''), 10);
  const jumlahSaudara = !isNaN(parsedSaudara) && parsedSaudara >= 0 ? parsedSaudara : 0;
  const dari_bersaudara = jumlahSaudara;

  // Tempat & Tanggal Lahir
  const tempatLahir = item.tempatLahir || item.tempat_lahir || item.tmp_lahir || item.tmplahir || item.kota_lahir || '';
  const tanggalLahir = item.tanggalLahir || item.tanggal_lahir || item.tgl_lahir || item.tgllahir || item.tglLahir || '';

  // Tanggal & Tahun Keluar (Boyong) - Tanpa nilai palsu default 2022
  const rawGradDate = item.gradDate || item.grad_date || item.tgl_lulus || item.tanggal_keluar || '';
  const cleanGradDate = rawGradDate && rawGradDate !== 'null' && rawGradDate !== '0000-00-00' ? String(rawGradDate).trim() : '';

  const rawGradYear = item.gradYear || item.tahun_lulus || item.thn_lulus || item.tahun_boyong || item.thn_boyong || item.boyong || item.lulus || '';
  const cleanGradYear = rawGradYear && rawGradYear !== 'null' && rawGradYear !== '0000'
    ? String(rawGradYear).trim()
    : (cleanGradDate ? cleanGradDate.slice(0, 4) : '');

  // Tanggal & Tahun Masuk - Tanpa nilai palsu default 2016
  const rawEntryDate = item.entryDate || item.entry_date || item.tgl_masuk || item.tanggal_masuk || '';
  const cleanEntryDate = rawEntryDate && rawEntryDate !== 'null' && rawEntryDate !== '0000-00-00' ? String(rawEntryDate).trim() : '';

  const rawEntryYear = item.entryYear || item.tahun_masuk || item.thn_masuk || item.masuk || '';
  const cleanEntryYear = rawEntryYear && rawEntryYear !== 'null' && rawEntryYear !== '0000'
    ? String(rawEntryYear).trim()
    : (cleanEntryDate ? cleanEntryDate.slice(0, 4) : '');

  // Alamat
  const desa = item.desa || item.kelurahan || item.desa_kelurahan || item.nama_desa || '';
  const kecamatan = item.kecamatan || item.nama_kecamatan || item.kec || '';
  const city = item.city || item.kabupaten || item.kota || item.kab || item.kab_kota || item.nama_kabupaten || '';
  const province = item.province || item.provinsi || item.propinsi || item.nama_provinsi || '';
  const alamatLengkap = item.alamatLengkap || item.address || item.alamat || (item.asal ? 'Asal: ' + item.asal : '');
  
  return {
    id: String(item.id || `alm-${Math.random().toString(36).substring(2, 9)}`),
    nik: item.nik || '',
    noKk: item.noKk || item.no_kk || item.nokk || '',
    nis: String(item.nis || ''),
    nism: String(item.nism || ''),
    nisn: String(item.nisn || ''),
    name: item.name || item.nama || item.nama_lengkap || 'Tanpa Nama',
    username: item.username || (item.nama ? item.nama.toLowerCase().replace(/\s+/g, '_') : (item.name ? item.name.toLowerCase().replace(/\s+/g, '_') : 'santri_' + item.id)),
    gender,
    tempatLahir,
    tanggalLahir,
    anak_ke,
    dari_bersaudara,
    urutanAnak,
    jumlahSaudara,
    namaAyah: item.namaAyah || item.nama_ayah || item.nama_bapak || item.ayah || item.bapak || '',
    nikAyah: item.nikAyah || item.nik_ayah || item.nik_bapak || '',
    pekerjaanAyah: item.pekerjaanAyah || item.pekerjaan_ayah || item.pekerjaan_bapak || '',
    pendidikanAyah: item.pendidikanAyah || item.pendidikan_ayah || item.pendidikan_bapak || '',
    namaIbu: item.namaIbu || item.nama_ibu || item.ibu || '',
    nikIbu: item.nikIbu || item.nik_ibu || '',
    pekerjaanIbu: item.pekerjaanIbu || item.pekerjaan_ibu || '',
    pendidikanIbu: item.pendidikanIbu || item.pendidikan_ibu || '',
    gradYear: cleanGradYear,
    entryYear: cleanEntryYear,
    entryDate: cleanEntryDate,
    gradDate: cleanGradDate,
    jenjang: item.jenjang || 'Madrasah Aliyah Keagamaan (MAK)',
    asramaDulu: item.asramaDulu || item.asrama || item.komplek || item.kamar || 'Komplek Santri',
    email: item.email || '',
    phone: item.phone || item.no_hp || item.nohp || item.telepon || item.wa || '',
    alamatLengkap,
    desa,
    kecamatan,
    city,
    province,
    occupation: item.occupation || item.pekerjaan || item.profesi || '',
    institution: item.institution || item.instansi || item.perusahaan || item.kampus || '',
    photoUrl: getAlumniPhotoUrl(item.avatarUrl || item.photoUrl || item.foto || item.foto_url || item.file_pas_foto || ''),
    coverPhotoUrl: getAlumniPhotoUrl(item.coverPhotoUrl || item.foto_sampul || item.sampul || ''),
    bio: item.bio || '',
    coordinates: item.coordinates || (item.latitude && item.longitude ? { lat: Number(item.latitude), lng: Number(item.longitude) } : undefined),
    password: String(item.password || '1234'),
    isPasswordChanged: Boolean(item.isPasswordChanged || item.is_password_changed),
    hasLoggedIn: Boolean(item.hasLoggedIn || item.isPasswordChanged || item.is_password_changed),
    shareContact: item.shareContact !== undefined ? Boolean(item.shareContact) : (item.share_contact !== undefined ? Boolean(item.share_contact) : true),
    shareFullAddress: true,
    shareLocationTag: true,
    status: 'alumni',
    source: 'hostinger_sync',
    syncTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
  };
}

/**
 * Mengambil seluruh data santri/alumni dari database Hostinger (tabel santri)
 */
export async function fetchAlumniFromHostinger(forceFresh: boolean = false): Promise<{
  success: boolean;
  data: AlumniRecord[];
  isLive: boolean;
  message?: string;
}> {
  const ts = Date.now();
  const freshParam = forceFresh ? `&fresh=true&_t=${ts}` : `&_t=${ts}`;
  const endpointsToTry = [
    `/api/db/santri?_t=${ts}`,
    `${HOSTINGER_API_URL}?action=get_alumni${freshParam}`,
    `https://alumni.attaroqqy.com/api_alumni.php?action=get_alumni${freshParam}`,
    `${HOSTINGER_EXPRESS_DB_URL}/santri?fresh=true&_t=${ts}`,
  ];

  for (const url of endpointsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        // Melewati jika respons berupa HTML SPA fallback
        continue;
      }

      const result = await response.json();
      const rawList = Array.isArray(result) ? result : (Array.isArray(result?.data) ? result.data : []);

      if (rawList.length > 0) {
        // Filter santri yang berstatus 'Alumni' (jika ada)
        const alumniOnly = rawList.filter((item: any) => {
          const status = String(item.status_keanggotaan || '').toLowerCase();
          return status.includes('alumni') || !status;
        });

        const listToNormalize = alumniOnly.length > 0 ? alumniOnly : rawList;
        const normalizedData: AlumniRecord[] = ensureConsistentAlumniIdentities(listToNormalize.map(normalizeSingleAlumni));

        if (normalizedData.length > 0) {
          console.log(`[Database Hostinger] Berhasil memuat ${normalizedData.length} data alumni dari ${url}`);
          return {
            success: true,
            data: normalizedData,
            isLive: true,
          };
        }
      }
    } catch (err: any) {
      console.info(`[apiService] Info: sumber ${url} (${err?.message || 'offline'}), mencoba cadangan.`);
      continue;
    }
  }

  // Fallback 1: Coba ambil dari snapshot database santri bawaan sistem
  try {
    const snapshotModule = await import('../data/santri_snapshot.json');
    const snapshotData = (snapshotModule.default || snapshotModule) as any;
    const rawList = Array.isArray(snapshotData) ? snapshotData : (Array.isArray(snapshotData?.data) ? snapshotData.data : []);
    if (rawList.length > 0) {
      const alumniOnly = rawList.filter((item: any) => {
        const status = String(item.status_keanggotaan || '').toLowerCase();
        return status.includes('alumni') || !status;
      });
      const listToNormalize = alumniOnly.length > 0 ? alumniOnly : rawList;
      const normalizedData: AlumniRecord[] = ensureConsistentAlumniIdentities(listToNormalize.map(normalizeSingleAlumni));
      if (normalizedData.length > 0) {
        console.log(`[Database Snapshot] Memuat ${normalizedData.length} data alumni dari snapshot lokal`);
        return {
          success: true,
          data: normalizedData,
          isLive: false,
          message: 'Menggunakan snapshot data database terbaru',
        };
      }
    }
  } catch (snapErr) {
    console.warn('Gagal memuat snapshot lokal:', snapErr);
  }

  console.warn('Gagal memuat data dari Hostinger API, menggunakan data lokal awal');
  return {
    success: false,
    data: ensureConsistentAlumniIdentities(INITIAL_ALUMNI),
    isLive: false,
    message: 'Gagal tersambung ke database Hostinger',
  };
}

/**
 * Upload file base64 ke server Hostinger attaroqqy.com (/api/upload)
 * Mengembalikan path file relatif di server (misal: /api/uploads/dokumen/...)
 */
export async function uploadFileToHostinger(
  fileBase64: string,
  fileName: string = 'foto_alumni.jpg'
): Promise<string> {
  if (!fileBase64 || !fileBase64.startsWith('data:')) return fileBase64;

  const endpoints = ['/api/upload', 'https://attaroqqy.com/api/upload'];
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, fileBase64 }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && (data.path || data.publicUrl)) {
          return data.path || data.publicUrl;
        }
      }
    } catch (e) {
      console.warn('Upload to Hostinger failed via', ep, e);
    }
  }
  return fileBase64;
}

/**
 * Memperbarui data alumni di database Hostinger & Express SmartSantri
 */
export async function updateAlumniInHostinger(
  id: string,
  updates: Partial<AlumniRecord>
): Promise<{ success: boolean; message?: string }> {
  try {
    const rawGender = updates.gender;
    const isPutri =
      rawGender === 'P' ||
      rawGender === 'Putri' ||
      rawGender?.toLowerCase() === 'putri' ||
      rawGender?.toLowerCase() === 'perempuan';
    const standardGender = rawGender !== undefined ? (isPutri ? 'P' : 'L') : undefined;
    const expressGender = rawGender !== undefined ? (isPutri ? 'Putri' : 'Putra') : undefined;

    const finalAnakKe = updates.anak_ke !== undefined
      ? Number(updates.anak_ke)
      : (updates.urutanAnak !== undefined ? Number(updates.urutanAnak) : undefined);

    const finalJumlahSaudara = updates.dari_bersaudara !== undefined
      ? Number(updates.dari_bersaudara)
      : (updates.jumlahSaudara !== undefined ? Number(updates.jumlahSaudara) : undefined);

    // 1. Siapkan payload untuk Express SmartSantri API (/api/db/santri/:id)
    // yang digunakan oleh aplikasi lama
    const expressPayload: Record<string, any> = {
      id,
    };
    if (expressGender !== undefined) {
      expressPayload.gender = expressGender; // Tersimpan 'Putra' atau 'Putri' persis database aplikasi lama
      expressPayload.jenis_kelamin = expressGender;
      expressPayload.jk = expressGender;
    }
    if (updates.name !== undefined) expressPayload.nama = updates.name;
    if (updates.username !== undefined) expressPayload.username = updates.username;
    if (updates.nis !== undefined) expressPayload.nis = updates.nis;
    if (updates.tempatLahir !== undefined) expressPayload.tempat_lahir = updates.tempatLahir;
    if (updates.tanggalLahir !== undefined) expressPayload.tanggal_lahir = updates.tanggalLahir;
    if (finalAnakKe !== undefined) {
      expressPayload.anak_ke = finalAnakKe;
      expressPayload.anakKe = finalAnakKe;
      expressPayload.urutanAnak = finalAnakKe;
    }
    if (finalJumlahSaudara !== undefined) {
      expressPayload.dari_bersaudara = finalJumlahSaudara;
      expressPayload.dariBersaudara = finalJumlahSaudara;
      expressPayload.jumlahSaudara = finalJumlahSaudara;
      expressPayload.jumlah_saudara = finalJumlahSaudara;
    }
    if (updates.namaAyah !== undefined) expressPayload.nama_ayah = updates.namaAyah;
    if (updates.nikAyah !== undefined) expressPayload.nik_ayah = updates.nikAyah;
    if (updates.pekerjaanAyah !== undefined) expressPayload.pekerjaan_ayah = updates.pekerjaanAyah;
    if (updates.pendidikanAyah !== undefined) expressPayload.pendidikan_ayah = updates.pendidikanAyah;
    if (updates.namaIbu !== undefined) expressPayload.nama_ibu = updates.namaIbu;
    if (updates.nikIbu !== undefined) expressPayload.nik_ibu = updates.nikIbu;
    if (updates.pekerjaanIbu !== undefined) expressPayload.pekerjaan_ibu = updates.pekerjaanIbu;
    if (updates.pendidikanIbu !== undefined) expressPayload.pendidikan_ibu = updates.pendidikanIbu;
    if (updates.phone !== undefined) expressPayload.no_hp = updates.phone;
    if (updates.email !== undefined) expressPayload.email = updates.email;
    if (updates.alamatLengkap !== undefined || (updates as any).address !== undefined) {
      expressPayload.alamat = updates.alamatLengkap ?? (updates as any).address;
    }
    if (updates.desa !== undefined) expressPayload.desa = updates.desa;
    if (updates.kecamatan !== undefined) expressPayload.kecamatan = updates.kecamatan;
    if (updates.city !== undefined) expressPayload.kabupaten = updates.city;
    if (updates.province !== undefined) expressPayload.provinsi = updates.province;
    if (updates.occupation !== undefined) expressPayload.pekerjaan = updates.occupation;
    if (updates.institution !== undefined) expressPayload.instansi = updates.institution;
    if (updates.bio !== undefined) expressPayload.bio = updates.bio;

    // Sinkronisasi Foto: Upload base64 ke server agar aplikasi lama dan aplikasi ini mengakses file yang sama persis
    if (updates.photoUrl !== undefined || (updates as any).avatarUrl !== undefined) {
      const rawPhoto = updates.photoUrl ?? (updates as any).avatarUrl;
      if (rawPhoto && rawPhoto.startsWith('data:image/')) {
        const uploadedPath = await uploadFileToHostinger(rawPhoto, `pas_foto_${id}_${Date.now()}.jpg`);
        expressPayload.file_pas_foto = uploadedPath;
      } else {
        expressPayload.file_pas_foto = formatPhotoUrlForHostinger(rawPhoto);
      }
    }
    if (updates.coverPhotoUrl !== undefined) {
      const rawCover = updates.coverPhotoUrl;
      if (rawCover && rawCover.startsWith('data:image/')) {
        const uploadedCover = await uploadFileToHostinger(rawCover, `sampul_${id}_${Date.now()}.jpg`);
        expressPayload.foto_sampul = uploadedCover;
      } else {
        expressPayload.foto_sampul = formatPhotoUrlForHostinger(rawCover);
      }
    }
    if (updates.password !== undefined) expressPayload.password = updates.password;
    if (updates.isPasswordChanged !== undefined) {
      expressPayload.is_password_changed = updates.isPasswordChanged ? 1 : 0;
    }
    if (updates.hasLoggedIn !== undefined) {
      expressPayload.is_password_changed = updates.hasLoggedIn ? 1 : 0;
    }
    if (updates.shareContact !== undefined) {
      expressPayload.share_contact = updates.shareContact ? 1 : 0;
    }

    // Sinkronisasi tanggal keluar / lulus (boyong) secara konsisten
    if (updates.gradDate !== undefined) {
      expressPayload.tanggal_keluar = updates.gradDate ? updates.gradDate : null;
      expressPayload.tahun_lulus = updates.gradDate ? updates.gradDate.slice(0, 4) : (updates.gradYear || null);
    } else if (updates.gradYear !== undefined) {
      expressPayload.tahun_lulus = updates.gradYear || null;
    }

    // Sinkronisasi tanggal masuk
    if (updates.entryDate !== undefined) {
      expressPayload.tanggal_masuk = updates.entryDate ? updates.entryDate : null;
      expressPayload.tahun_masuk = updates.entryDate ? updates.entryDate.slice(0, 4) : (updates.entryYear || null);
    } else if (updates.entryYear !== undefined) {
      expressPayload.tahun_masuk = updates.entryYear || null;
    }

    if (updates.asramaDulu !== undefined) expressPayload.kamar = updates.asramaDulu;
    if (updates.coordinates !== undefined) {
      expressPayload.latitude = updates.coordinates ? updates.coordinates.lat : null;
      expressPayload.longitude = updates.coordinates ? updates.coordinates.lng : null;
    }
    expressPayload.status_keanggotaan = 'Alumni';

    // 2. Siapkan payload untuk PHP Hostinger API (/api_alumni.php?action=update_alumni)
    const phpPayload: Record<string, any> = {
      id,
      ...updates,
      nama: updates.name ?? (updates as any).nama,
      name: updates.name ?? (updates as any).nama,
      nik: updates.nik,
      no_kk: updates.noKk ?? (updates as any).no_kk,
      noKk: updates.noKk ?? (updates as any).no_kk,
      kamar: updates.asramaDulu ?? (updates as any).kamar,
      asramaDulu: updates.asramaDulu ?? (updates as any).kamar,
      kelas: updates.jenjang ?? (updates as any).kelas,
      jenjang: updates.jenjang ?? (updates as any).kelas,
      tahun_lulus: updates.gradYear ?? (updates as any).tahun_lulus,
      tanggal_masuk: updates.entryDate ?? (updates as any).tanggal_masuk,
      tanggal_keluar: updates.gradDate ?? (updates as any).tanggal_keluar,
      ...(standardGender !== undefined
        ? {
            gender: standardGender,
            raw_gender: rawGender,
            jenis_kelamin: standardGender === 'P' ? 'Perempuan' : 'Laki-laki',
            jenisKelamin: standardGender,
            jk: standardGender,
          }
        : {}),
      ...(finalAnakKe !== undefined
        ? {
            anak_ke: finalAnakKe,
            urutanAnak: finalAnakKe,
            anakKe: finalAnakKe,
            urutan_anak: finalAnakKe,
          }
        : {}),
      ...(finalJumlahSaudara !== undefined
        ? {
            dari_bersaudara: finalJumlahSaudara,
            jumlahSaudara: finalJumlahSaudara,
            dariBersaudara: finalJumlahSaudara,
            jumlah_saudara: finalJumlahSaudara,
          }
        : {}),
    };

    // Eksekusi pembaruan ke kedua backend secara bersamaan
    const targets = [
      fetch(`${HOSTINGER_API_URL}?action=update_alumni`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(phpPayload),
      }).catch((err) => {
        console.warn('Gagal sync ke PHP API:', err?.message);
        return null;
      }),
      fetch(`https://alumni.attaroqqy.com/api_alumni.php?action=update_alumni`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(phpPayload),
      }).catch(() => null),
      fetch(`${HOSTINGER_EXPRESS_DB_URL}/santri/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(expressPayload),
      }).catch((err) => {
        console.warn('Gagal sync ke Express backend:', err?.message);
        return null;
      }),
    ];

    const responses = await Promise.all(targets);
    const isSuccess = responses.some((res) => res && res.ok);

    broadcastSyncEvent('alumni');

    return {
      success: !!isSuccess,
      message: isSuccess ? 'Data berhasil diperbarui di database Hostinger & aplikasi lama' : 'Gagal sinkronisasi data',
    };
  } catch (error: any) {
    console.error('Gagal memperbarui ke Hostinger:', error?.message);
    return {
      success: false,
      message: error?.message,
    };
  }
}

/**
 * Menambahkan alumni baru langsung ke database Hostinger (tabel santri)
 */
export async function addAlumniToHostinger(
  newAlumni: AlumniRecord
): Promise<{ success: boolean; id?: string; message?: string }> {
  try {
    const isPutri = newAlumni.gender === 'P';
    const expressGender = isPutri ? 'Putri' : 'Putra';
    const finalAnak = newAlumni.anak_ke ?? newAlumni.urutanAnak ?? 1;
    const finalSaudara = newAlumni.dari_bersaudara ?? newAlumni.jumlahSaudara ?? 1;

    // 1. Express payload
    const expressPayload: Record<string, any> = {
      id: newAlumni.id,
      nis: newAlumni.nis || '',
      nama: newAlumni.name || '',
      username: newAlumni.username || '',
      gender: expressGender,
      jenis_kelamin: expressGender,
      jk: expressGender,
      tanggal_masuk: newAlumni.entryDate || null,
      tanggal_keluar: newAlumni.gradDate || null,
      tahun_masuk: newAlumni.entryDate ? newAlumni.entryDate.slice(0, 4) : newAlumni.entryYear,
      tempat_lahir: newAlumni.tempatLahir || '',
      tanggal_lahir: newAlumni.tanggalLahir || null,
      anak_ke: finalAnak,
      anakKe: finalAnak,
      urutanAnak: finalAnak,
      dari_bersaudara: finalSaudara,
      dariBersaudara: finalSaudara,
      jumlahSaudara: finalSaudara,
      jumlah_saudara: finalSaudara,
      nama_ayah: newAlumni.namaAyah || '',
      nik_ayah: newAlumni.nikAyah || '',
      pekerjaan_ayah: newAlumni.pekerjaanAyah || '',
      pendidikan_ayah: newAlumni.pendidikanAyah || '',
      nama_ibu: newAlumni.namaIbu || '',
      nik_ibu: newAlumni.nikIbu || '',
      pekerjaan_ibu: newAlumni.pekerjaanIbu || '',
      pendidikan_ibu: newAlumni.pendidikanIbu || '',
      alamat: newAlumni.alamatLengkap || '',
      desa: newAlumni.desa || '',
      kecamatan: newAlumni.kecamatan || '',
      kabupaten: newAlumni.city || '',
      provinsi: newAlumni.province || '',
      no_hp: newAlumni.phone || '',
      email: newAlumni.email || '',
      pekerjaan: newAlumni.occupation || '',
      instansi: newAlumni.institution || '',
      tahun_lulus: newAlumni.gradYear || String(new Date().getFullYear()),
      kamar: newAlumni.asramaDulu || '',
      password: newAlumni.password || '1234',
      status_keanggotaan: 'Alumni',
    };

    // 2. PHP payload
    const phpPayload = {
      ...newAlumni,
      gender: newAlumni.gender,
      raw_gender: isPutri ? 'Putri' : 'Putra',
      jenis_kelamin: isPutri ? 'Perempuan' : 'Laki-laki',
      jenisKelamin: newAlumni.gender,
      jk: newAlumni.gender,
      anak_ke: finalAnak,
      dari_bersaudara: finalSaudara,
      urutanAnak: finalAnak,
      jumlahSaudara: finalSaudara,
      anakKe: finalAnak,
      urutan_anak: finalAnak,
      dariBersaudara: finalSaudara,
      jumlah_saudara: finalSaudara,
    };

    await Promise.all([
      fetch(`${HOSTINGER_API_URL}?action=add_alumni`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(phpPayload),
      }).catch((err) => console.warn('Gagal add santri ke PHP API:', err?.message)),
      fetch(`https://alumni.attaroqqy.com/api_alumni.php?action=add_alumni`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(phpPayload),
      }).catch(() => null),
      fetch(`${HOSTINGER_EXPRESS_DB_URL}/santri`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(expressPayload),
      }).catch((err) => console.warn('Gagal add santri ke Express backend:', err?.message)),
    ]);

    broadcastSyncEvent('alumni');

    return {
      success: true,
      id: newAlumni.id,
      message: 'Alumni berhasil ditambahkan ke database',
    };
  } catch (error: any) {
    console.error('Gagal menambah alumni ke Hostinger:', error?.message);
    return {
      success: false,
      message: error?.message,
    };
  }
}

/**
 * Menghapus data alumni dari database Hostinger
 */
export async function deleteAlumniFromHostinger(
  id: string
): Promise<{ success: boolean; message?: string }> {
  try {
    await Promise.all([
      fetch(`${HOSTINGER_API_URL}?action=delete_alumni`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      }).catch((err) => console.warn('Gagal delete di PHP:', err?.message)),
      fetch(`https://alumni.attaroqqy.com/api_alumni.php?action=delete_alumni`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      }).catch(() => null),
      fetch(`${HOSTINGER_EXPRESS_DB_URL}/santri/${id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
        },
      }).catch((err) => console.warn('Gagal delete di Express:', err?.message)),
    ]);

    broadcastSyncEvent('alumni');
    return { success: true };
  } catch (error: any) {
    console.warn('Gagal menghapus alumni dari database Hostinger:', error?.message);
    return { success: false, message: error?.message };
  }
}

/**
 * Reset kata sandi alumni menjadi 1234 di database Hostinger
 */
export async function resetAlumniPasswordInHostinger(
  id: string
): Promise<{ success: boolean; message?: string }> {
  return updateAlumniInHostinger(id, {
    password: '1234',
    isPasswordChanged: false,
  });
}

/**
 * ==========================================
 * EVENT & AGENDA CRUD API (HOSTINGER & DB)
 * ==========================================
 */

export async function fetchEventsFromHostinger(): Promise<{ success: boolean; data: EventAgenda[] }> {
  const ts = Date.now();
  const endpoints = [
    `${HOSTINGER_API_URL}?action=get_events&_t=${ts}`,
    `https://alumni.attaroqqy.com/api_alumni.php?action=get_events&_t=${ts}`,
    `/api/events?_t=${ts}`,
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout(10000),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const text = await res.text();
        if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
          const json = JSON.parse(text);
          const list = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : null);
          if (Array.isArray(list)) {
            if (list.length > 0) {
              try {
                localStorage.setItem('attaroqqy_events_cache_v1', JSON.stringify(list));
              } catch (e) {}
              return { success: true, data: list };
            }
          }
        }
      }
    } catch (e) {
      // Continue to next endpoint
    }
  }

  // Fallback to local cache if present
  try {
    const cached = localStorage.getItem('attaroqqy_events_cache_v1');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { success: true, data: parsed };
      }
    }
  } catch (e) {}

  return { success: true, data: INITIAL_EVENTS };
}

export async function saveEventToHostinger(event: EventAgenda): Promise<{ success: boolean; id?: string }> {
  try {
    // 1. Simpan segera ke localStorage agar responsif
    try {
      const raw = localStorage.getItem('attaroqqy_events_cache_v1');
      const list = raw ? JSON.parse(raw) : [...INITIAL_EVENTS];
      const idx = list.findIndex((e: any) => e.id === event.id);
      if (idx >= 0) list[idx] = event;
      else list.unshift(event);
      localStorage.setItem('attaroqqy_events_cache_v1', JSON.stringify(list));
    } catch (e) {}

    // 2. Kirim serentak ke Hostinger Database (alumni subdomain) & server proxy
    const endpoints = [
      `${HOSTINGER_API_URL}?action=save_event`,
      'https://alumni.attaroqqy.com/api_alumni.php?action=save_event',
      '/api/events',
    ];

    const results = await Promise.allSettled(
      endpoints.map((ep) =>
        fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(event),
          signal: AbortSignal.timeout(12000),
        }).then((res) => res.ok)
      )
    );

    const isSuccess = results.some((r) => r.status === 'fulfilled' && r.value === true);
    broadcastSyncEvent('events');
    return { success: isSuccess, id: event.id };
  } catch (error: any) {
    console.warn('Gagal menyimpan event ke Hostinger:', error?.message);
    return { success: false };
  }
}

export async function deleteEventFromHostinger(id: string): Promise<{ success: boolean }> {
  try {
    try {
      const raw = localStorage.getItem('attaroqqy_events_cache_v1');
      if (raw) {
        const list = JSON.parse(raw).filter((e: any) => e.id !== id);
        localStorage.setItem('attaroqqy_events_cache_v1', JSON.stringify(list));
      }
    } catch (e) {}

    const endpoints = [
      `${HOSTINGER_API_URL}?action=delete_event`,
      'https://alumni.attaroqqy.com/api_alumni.php?action=delete_event',
      `/api/events/${encodeURIComponent(id)}`,
    ];

    await Promise.allSettled(
      endpoints.map((ep) =>
        fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
          signal: AbortSignal.timeout(10000),
        })
      )
    );

    broadcastSyncEvent('events');
  } catch (e) {}

  return { success: true };
}

export async function saveRsvpToHostinger(
  eventId: string,
  alumniId: string,
  status: 'hadir' | 'belum_pasti' | 'tidak_hadir',
  note?: string
): Promise<{ success: boolean }> {
  const endpoints = [
    `${HOSTINGER_API_URL}?action=save_rsvp`,
    'https://alumni.attaroqqy.com/api_alumni.php?action=save_rsvp',
    '/api/events/rsvp',
  ];

  await Promise.allSettled(
    endpoints.map((ep) =>
      fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, alumniId, status, note }),
        signal: AbortSignal.timeout(10000),
      })
    )
  );

  broadcastSyncEvent('events');
  return { success: true };
}

/**
 * ==========================================
 * ANNOUNCEMENT CRUD API (HOSTINGER & DB)
 * ==========================================
 */

export async function fetchAnnouncementsFromHostinger(): Promise<{ success: boolean; data: AnnouncementItem[] }> {
  const ts = Date.now();
  const endpoints = [
    `${HOSTINGER_API_URL}?action=get_announcements&_t=${ts}`,
    `https://alumni.attaroqqy.com/api_alumni.php?action=get_announcements&_t=${ts}`,
    `/api/announcements?_t=${ts}`,
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout(10000),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const text = await res.text();
        if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
          const json = JSON.parse(text);
          const list = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : null);
          if (Array.isArray(list)) {
            if (list.length > 0) {
              try {
                localStorage.setItem('attaroqqy_announcements_cache_v1', JSON.stringify(list));
              } catch (e) {}
              return { success: true, data: list };
            }
          }
        }
      }
    } catch (e) {}
  }

  // Fallback to local cache
  try {
    const cached = localStorage.getItem('attaroqqy_announcements_cache_v1');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { success: true, data: parsed };
      }
    }
  } catch (e) {}

  return { success: true, data: INITIAL_ANNOUNCEMENTS };
}

export async function saveAnnouncementToHostinger(
  announcement: AnnouncementItem
): Promise<{ success: boolean; id?: string }> {
  try {
    // 1. Simpan segera ke localStorage
    try {
      const raw = localStorage.getItem('attaroqqy_announcements_cache_v1');
      const list = raw ? JSON.parse(raw) : [...INITIAL_ANNOUNCEMENTS];
      const idx = list.findIndex((a: any) => a.id === announcement.id);
      if (idx >= 0) list[idx] = announcement;
      else list.unshift(announcement);
      localStorage.setItem('attaroqqy_announcements_cache_v1', JSON.stringify(list));
    } catch (e) {}

    // 2. Kirim serentak ke Hostinger Database & server proxy
    const endpoints = [
      `${HOSTINGER_API_URL}?action=save_announcement`,
      'https://alumni.attaroqqy.com/api_alumni.php?action=save_announcement',
      '/api/announcements',
    ];

    const results = await Promise.allSettled(
      endpoints.map((ep) =>
        fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(announcement),
          signal: AbortSignal.timeout(12000),
        }).then((res) => res.ok)
      )
    );

    const isSuccess = results.some((r) => r.status === 'fulfilled' && r.value === true);
    broadcastSyncEvent('announcements');
    return { success: isSuccess, id: announcement.id };
  } catch (error: any) {
    console.warn('Gagal menyimpan pengumuman ke Hostinger:', error?.message);
    return { success: false };
  }
}

export async function deleteAnnouncementFromHostinger(id: string): Promise<{ success: boolean }> {
  try {
    try {
      const raw = localStorage.getItem('attaroqqy_announcements_cache_v1');
      if (raw) {
        const list = JSON.parse(raw).filter((a: any) => a.id !== id);
        localStorage.setItem('attaroqqy_announcements_cache_v1', JSON.stringify(list));
      }
    } catch (e) {}

    const endpoints = [
      `${HOSTINGER_API_URL}?action=delete_announcement`,
      'https://alumni.attaroqqy.com/api_alumni.php?action=delete_announcement',
      `/api/announcements/${encodeURIComponent(id)}`,
    ];

    await Promise.allSettled(
      endpoints.map((ep) =>
        fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
          signal: AbortSignal.timeout(10000),
        })
      )
    );

    broadcastSyncEvent('announcements');
  } catch (e) {}

  return { success: true };
}


