import { AlumniRecord } from '../types';
import { INITIAL_ALUMNI } from '../data/mockData';

// URL Endpoint API di Hostinger
export const HOSTINGER_API_URL =
  import.meta.env.VITE_HOSTINGER_API_URL || 'https://attaroqqy.com/api_alumni.php';

// URL Endpoint Express DB Backend SmartSantri (aplikasi lama)
export const HOSTINGER_EXPRESS_DB_URL =
  import.meta.env.VITE_HOSTINGER_EXPRESS_DB_URL || 'https://attaroqqy.com/api/db';

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
          rawGender === '2' ||
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
        // Pertahankan nilai asli jumlah saudara tanpa memaksa >= urutan anak
        const jumlahSaudara = !isNaN(parsedSaudara) && parsedSaudara >= 0 ? parsedSaudara : 0;
        const dari_bersaudara = jumlahSaudara;

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
 * Mensinkronisasikan ke:
 * 1. Express backend (/api/db/santri/:id) yang digunakan oleh aplikasi lama (SmartSantri)
 * 2. PHP backend (/api_alumni.php?action=update_alumni)
 */
export async function updateAlumniInHostinger(
  id: string,
  updates: Partial<AlumniRecord>
): Promise<{ success: boolean; message?: string }> {
  try {
    // Tentukan gender standar
    let rawGender: string | undefined = undefined;
    let expressGender: 'putra' | 'putri' | undefined = undefined;
    let standardGender: 'L' | 'P' | undefined = undefined;

    if (updates.gender !== undefined) {
      const g = String(updates.gender).trim().toLowerCase();
      const isPutri = g === 'p' || g === 'putri' || g.startsWith('perem') || g === 'wanita' || g === 'female' || g === '2';
      standardGender = isPutri ? 'P' : 'L';
      rawGender = isPutri ? 'Putri' : 'Putra';
      expressGender = isPutri ? 'putri' : 'putra';
    }

    const finalAnakKe = updates.anak_ke !== undefined || updates.urutanAnak !== undefined
      ? (updates.anak_ke ?? updates.urutanAnak)
      : undefined;

    const finalJumlahSaudara = updates.dari_bersaudara !== undefined || updates.jumlahSaudara !== undefined
      ? (updates.dari_bersaudara ?? updates.jumlahSaudara)
      : undefined;

    // 1. Siapkan payload untuk Express SmartSantri API (/api/db/santri/:id)
    // yang digunakan oleh aplikasi lama
    const expressPayload: Record<string, any> = {
      id,
    };
    if (expressGender !== undefined) expressPayload.gender = expressGender;
    if (updates.name !== undefined) expressPayload.nama = updates.name;
    if (updates.username !== undefined) expressPayload.username = updates.username;
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
    if (updates.photoUrl !== undefined || (updates as any).avatarUrl !== undefined) {
      expressPayload.file_pas_foto = updates.photoUrl ?? (updates as any).avatarUrl;
    }
    if (updates.coverPhotoUrl !== undefined) expressPayload.foto_sampul = updates.coverPhotoUrl;
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
    if (updates.gradYear !== undefined) expressPayload.tahun_lulus = updates.gradYear;
    if (updates.gradDate !== undefined) expressPayload.tanggal_keluar = updates.gradDate;
    if (updates.entryDate !== undefined) expressPayload.tanggal_masuk = updates.entryDate;
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
    const [expressRes, phpRes] = await Promise.all([
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
    ]);

    const isSuccess = (expressRes && expressRes.ok) || (phpRes && phpRes.ok);

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
    const expressGender = isPutri ? 'putri' : 'putra';
    const finalAnak = newAlumni.anak_ke ?? newAlumni.urutanAnak ?? 1;
    const finalSaudara = newAlumni.dari_bersaudara ?? newAlumni.jumlahSaudara ?? 1;

    // 1. Express payload
    const expressPayload: Record<string, any> = {
      id: newAlumni.id,
      nis: newAlumni.nis || '',
      nama: newAlumni.name || '',
      gender: expressGender,
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
      fetch(`${HOSTINGER_EXPRESS_DB_URL}/santri`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(expressPayload),
      }).catch((err) => console.warn('Gagal add santri ke Express backend:', err?.message)),
      fetch(`${HOSTINGER_API_URL}?action=add_alumni`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(phpPayload),
      }).catch((err) => console.warn('Gagal add santri ke PHP API:', err?.message)),
    ]);

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
      fetch(`${HOSTINGER_EXPRESS_DB_URL}/santri/${id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
        },
      }).catch((err) => console.warn('Gagal delete di Express:', err?.message)),
      fetch(`${HOSTINGER_API_URL}?action=delete_alumni`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      }).catch((err) => console.warn('Gagal delete di PHP:', err?.message)),
    ]);

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
