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
      // Normalisasi data jika ada kolom kosong
      const normalizedData: AlumniRecord[] = result.data.map((item: any) => {
        const g = String(item.gender || '').trim().toLowerCase();
        const isPutri = g === 'putri' || g === 'p' || g === 'perempuan' || g === 'wanita';
        
        return {
          id: String(item.id || `alm-${Math.random().toString(36).substring(2, 9)}`),
          nik: item.nik || '',
          noKk: item.noKk || '',
          nis: item.nis || '',
          nism: item.nism || '',
          nisn: item.nisn || '',
          name: item.name || 'Tanpa Nama',
          username: item.username || (item.name ? item.name.toLowerCase().replace(/\s+/g, '_') : ''),
          gender: isPutri ? 'P' : 'L',
          tempatLahir: item.tempatLahir || '',
          tanggalLahir: item.tanggalLahir || '',
          urutanAnak: item.urutanAnak ? Number(item.urutanAnak) : undefined,
          jumlahSaudara: item.jumlahSaudara ? Number(item.jumlahSaudara) : undefined,
          // Data Orang Tua (Mendukung alias nama_ayah, nama_bapak, ayah, bapak, nama_ibu, ibu)
          namaAyah: item.namaAyah || item.nama_ayah || item.nama_bapak || item.ayah || item.bapak || '',
          nikAyah: item.nikAyah || item.nik_ayah || item.nik_bapak || '',
          pekerjaanAyah: item.pekerjaanAyah || item.pekerjaan_ayah || item.pekerjaan_bapak || '',
          pendidikanAyah: item.pendidikanAyah || item.pendidikan_ayah || item.pendidikan_bapak || '',
          namaIbu: item.namaIbu || item.nama_ibu || item.ibu || '',
          nikIbu: item.nikIbu || item.nik_ibu || '',
          pekerjaanIbu: item.pekerjaanIbu || item.pekerjaan_ibu || '',
          pendidikanIbu: item.pendidikanIbu || item.pendidikan_ibu || '',
          gradYear: String(item.gradYear || '2022'),
          entryYear: String(item.entryYear || '2016'),
          entryDate: item.entryDate || '',
          gradDate: item.gradDate || '',
          jenjang: item.jenjang || 'Madrasah Aliyah Keagamaan (MAK)',
          asramaDulu: item.asramaDulu || 'Komplek Santri',
          email: item.email || '',
          phone: item.phone || '',
          alamatLengkap: item.address || item.alamatLengkap || '',
          desa: item.desa || '',
          kecamatan: item.kecamatan || '',
          city: item.city || '',
          province: item.province || '',
          occupation: item.occupation || '',
          institution: item.institution || '',
          photoUrl: item.avatarUrl || item.photoUrl || '',
          coverPhotoUrl: item.coverPhotoUrl || '',
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
    const response = await fetch(`${HOSTINGER_API_URL}?action=add_alumni`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(newAlumni),
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
