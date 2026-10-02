import { AlumniRecord } from '../types';
import { INITIAL_ALUMNI } from '../data/mockData';

// URL Endpoint API di Hostinger
export const HOSTINGER_API_URL =
  import.meta.env.VITE_HOSTINGER_API_URL || 'https://attaroqqy.com/api_alumni.php';

export interface HostingerApiResponse<T> {
  success: boolean;
  total?: number;
  data?: T;
  message?: string;
  id?: string;
}

/**
 * Mengambil seluruh data santri/alumni dari database Hostinger (tabel santri)
 */
export async function fetchAlumniFromHostinger(): Promise<{
  success: boolean;
  data: AlumniRecord[];
  isLive: boolean;
  message?: string;
}> {
  try {
    const response = await fetch(`${HOSTINGER_API_URL}?action=get_alumni`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const result: HostingerApiResponse<AlumniRecord[]> = await response.json();

    if (result.success && Array.isArray(result.data)) {
      // Normalisasi data jika ada kolom dengan nama berbeda dari MySQL / Hostinger
      const normalizedData: AlumniRecord[] = result.data.map((item: any) => {
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

        const isPutri = 
          rawGender === 'p' ||
          rawGender === 'f' ||
          rawGender.startsWith('perem') ||
          rawGender.startsWith('putri') ||
          rawGender === 'wanita' ||
          rawGender === 'female';

        const gender: 'L' | 'P' = isPutri ? 'P' : 'L';

        // Urutan anak (anak ke - database field: anak_ke)
        const rawAnakKe = 
          item.anak_ke ??
          item.anakKe ??
          item.anakke ??
          item.urutanAnak ??
          item.urutan_anak ??
          item.urutan ??
          item.anak;
        const anak_ke = rawAnakKe !== undefined && rawAnakKe !== null && rawAnakKe !== '' && !isNaN(Number(rawAnakKe))
          ? Number(rawAnakKe)
          : (rawAnakKe !== undefined && rawAnakKe !== null ? rawAnakKe : undefined);
        const urutanAnak = typeof anak_ke === 'number' ? anak_ke : Number(anak_ke) || undefined;

        // Dari bersaudara (database field: dari_bersaudara)
        const rawDariBersaudara = 
          item.dari_bersaudara ??
          item.dariBersaudara ??
          item.daribersaudara ??
          item.bersaudara ??
          item.jumlahSaudara ??
          item.jumlah_saudara ??
          item.jml_saudara ??
          item.saudara ??
          item.jml_sdr ??
          item.saudara_kandung ??
          item.jumlah_saudara_kandung ??
          item.total_saudara ??
          item.saudara_total;
        const dari_bersaudara = rawDariBersaudara !== undefined && rawDariBersaudara !== null && rawDariBersaudara !== '' && !isNaN(Number(rawDariBersaudara))
          ? Number(rawDariBersaudara)
          : (rawDariBersaudara !== undefined && rawDariBersaudara !== null ? rawDariBersaudara : undefined);
        const jumlahSaudara = typeof dari_bersaudara === 'number' ? dari_bersaudara : Number(dari_bersaudara) || undefined;

        // Tempat & Tanggal Lahir
        const tempatLahir = item.tempatLahir || item.tempat_lahir || item.tmp_lahir || item.tmplahir || item.kota_lahir || '';
        const tanggalLahir = item.tanggalLahir || item.tanggal_lahir || item.tgl_lahir || item.tgllahir || item.tglLahir || '';

        // Tahun boyong / lulus & masuk
        const gradYear = String(
          item.gradYear ||
          item.tahun_lulus ||
          item.thn_lulus ||
          item.tahun_boyong ||
          item.thn_boyong ||
          item.boyong ||
          item.lulus ||
          '2022'
        );
        const entryYear = String(
          item.entryYear ||
          item.tahun_masuk ||
          item.thn_masuk ||
          item.masuk ||
          '2016'
        );

        // Alamat
        const desa = item.desa || item.kelurahan || item.desa_kelurahan || item.nama_desa || '';
        const kecamatan = item.kecamatan || item.nama_kecamatan || item.kec || '';
        const city = item.city || item.kabupaten || item.kota || item.kab || item.kab_kota || item.nama_kabupaten || '';
        const province = item.province || item.provinsi || item.propinsi || item.nama_provinsi || '';
        const alamatLengkap = item.alamatLengkap || item.address || item.alamat || '';
        
        return {
          id: String(item.id || `alm-${Math.random().toString(36).substring(2, 9)}`),
          nik: item.nik || '',
          noKk: item.noKk || item.no_kk || item.nokk || '',
          nis: item.nis || '',
          nism: item.nism || '',
          nisn: item.nisn || '',
          name: item.name || item.nama || item.nama_lengkap || 'Tanpa Nama',
          username: item.username || (item.name ? item.name.toLowerCase().replace(/\s+/g, '_') : ''),
          gender,
          tempatLahir,
          tanggalLahir,
          anak_ke,
          dari_bersaudara,
          urutanAnak,
          jumlahSaudara,
          // Data Orang Tua (Mendukung alias nama_ayah, nama_bapak, ayah, bapak, nama_ibu, ibu)
          namaAyah: item.namaAyah || item.nama_ayah || item.nama_bapak || item.ayah || item.bapak || '',
          nikAyah: item.nikAyah || item.nik_ayah || item.nik_bapak || '',
          pekerjaanAyah: item.pekerjaanAyah || item.pekerjaan_ayah || item.pekerjaan_bapak || '',
          pendidikanAyah: item.pendidikanAyah || item.pendidikan_ayah || item.pendidikan_bapak || '',
          namaIbu: item.namaIbu || item.nama_ibu || item.ibu || '',
          nikIbu: item.nikIbu || item.nik_ibu || '',
          pekerjaanIbu: item.pekerjaanIbu || item.pekerjaan_ibu || '',
          pendidikanIbu: item.pendidikanIbu || item.pendidikan_ibu || '',
          gradYear,
          entryYear,
          entryDate: item.entryDate || item.entry_date || item.tgl_masuk || '',
          gradDate: item.gradDate || item.grad_date || item.tgl_lulus || '',
          jenjang: item.jenjang || 'Madrasah Aliyah Keagamaan (MAK)',
          asramaDulu: item.asramaDulu || item.asrama || item.komplek || 'Komplek Santri',
          email: item.email || '',
          phone: item.phone || item.no_hp || item.nohp || item.telepon || item.wa || '',
          alamatLengkap,
          desa,
          kecamatan,
          city,
          province,
          occupation: item.occupation || item.pekerjaan || item.profesi || '',
          institution: item.institution || item.instansi || item.perusahaan || item.kampus || '',
          photoUrl: item.avatarUrl || item.photoUrl || item.foto || item.foto_url || '',
          coverPhotoUrl: item.coverPhotoUrl || item.foto_sampul || item.sampul || '',
          bio: item.bio || '',
          coordinates: item.coordinates || undefined,
          password: item.password || '1234',
          isPasswordChanged: Boolean(item.isPasswordChanged),
          hasLoggedIn: Boolean(item.hasLoggedIn || item.isPasswordChanged),
          shareContact: item.shareContact !== undefined ? Boolean(item.shareContact) : true,
          shareFullAddress: true,
          shareLocationTag: true,
          status: 'alumni',
          source: 'hostinger_sync',
          syncTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
        };
      });

      return {
        success: true,
        data: normalizedData.length > 0 ? normalizedData : INITIAL_ALUMNI,
        isLive: true,
      };
    }

    return {
      success: false,
      data: INITIAL_ALUMNI,
      isLive: false,
      message: result.message || 'Format data dari server tidak sesuai',
    };
  } catch (error: any) {
    console.warn('Gagal memuat data dari Hostinger API, menggunakan data lokal:', error?.message);
    return {
      success: false,
      data: INITIAL_ALUMNI,
      isLive: false,
      message: error?.message || 'Gagal tersambung ke Hostinger',
    };
  }
}

/**
 * Menyimpan pembaruan data alumni ke database Hostinger secara realtime
 */
export async function updateAlumniInHostinger(
  id: string,
  updates: Partial<AlumniRecord>
): Promise<{ success: boolean; message?: string }> {
  try {
    const payload = {
      id,
      ...updates,
      // Pastikan field gender, anak_ke, dan dari_bersaudara terisi sesuai format database
      ...(updates.gender !== undefined ? { gender: updates.gender } : {}),
      ...(updates.anak_ke !== undefined || updates.urutanAnak !== undefined
        ? {
            anak_ke: updates.anak_ke ?? updates.urutanAnak,
            urutanAnak: updates.anak_ke ?? updates.urutanAnak,
          }
        : {}),
      ...(updates.dari_bersaudara !== undefined || updates.jumlahSaudara !== undefined
        ? {
            dari_bersaudara: updates.dari_bersaudara ?? updates.jumlahSaudara,
            jumlahSaudara: updates.dari_bersaudara ?? updates.jumlahSaudara,
          }
        : {}),
    };

    const response = await fetch(`${HOSTINGER_API_URL}?action=update_alumni`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }

    const result = await response.json();
    return {
      success: result.success === true,
      message: result.message,
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
    const payload = {
      ...newAlumni,
      gender: newAlumni.gender,
      anak_ke: newAlumni.anak_ke ?? newAlumni.urutanAnak ?? 1,
      dari_bersaudara: newAlumni.dari_bersaudara ?? newAlumni.jumlahSaudara ?? 1,
      urutanAnak: newAlumni.anak_ke ?? newAlumni.urutanAnak ?? 1,
      jumlahSaudara: newAlumni.dari_bersaudara ?? newAlumni.jumlahSaudara ?? 1,
    };

    const response = await fetch(`${HOSTINGER_API_URL}?action=add_alumni`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }

    const result = await response.json();
    return {
      success: result.success === true,
      id: result.id,
      message: result.message,
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
