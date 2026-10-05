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
        // Intelligent and High-Precision Gender Classifier
        // 1. Cek NIK (Standar Kependudukan RI: digit 7-8 adalah tanggal lahir. Laki-laki 01-31, Perempuan 41-71)
        let detectedGender: 'L' | 'P' | null = null;
        const nikClean = String(item.nik ?? '').trim().replace(/[^0-9]/g, '');
        if (nikClean.length === 16) {
          const tglNik = parseInt(nikClean.substring(6, 8), 10);
          if (tglNik > 40 && tglNik <= 71) {
            detectedGender = 'P';
          } else if (tglNik >= 1 && tglNik <= 31) {
            detectedGender = 'L';
          }
        }

        // 2. Cek kolom gender asli dari database jika tersedia (raw_gender, gender_asli, gender)
        const rawGenderField = String(item.raw_gender ?? item.gender_asli ?? '').trim().toLowerCase();
        const baseGender = String(item.gender ?? '').trim().toLowerCase();

        if (['putra', 'l', 'laki-laki', 'pria', 'male', '1'].includes(rawGenderField)) {
          detectedGender = 'L';
        } else if (['putri', 'p', 'perempuan', 'wanita', 'female', '2'].includes(rawGenderField)) {
          detectedGender = 'P';
        } else if (['putra', 'laki-laki', 'pria', 'male'].includes(baseGender) || baseGender === 'l') {
          detectedGender = 'L';
        } else if (['putri', 'perempuan', 'wanita', 'female'].includes(baseGender)) {
          detectedGender = 'P';
        }

        // 3. Cek Jenjang / Kelas jika memuat PA (Putra) atau PI (Putri)
        if (!detectedGender) {
          const jenjangUpper = String(item.jenjang || '').toUpperCase();
          if (jenjangUpper.includes(' PA') || jenjangUpper.endsWith(' PA') || jenjangUpper.includes('- PA')) {
            detectedGender = 'L';
          } else if (jenjangUpper.includes(' PI') || jenjangUpper.endsWith(' PI') || jenjangUpper.includes('- PI')) {
            detectedGender = 'P';
          }
        }

        // 4. Analisis Berbasis Token Kata & Morfologi Nama Santri Indonesia/Arab
        if (!detectedGender) {
          const cleanName = String(item.name || item.nama || '')
            .toLowerCase()
            .replace(/[^a-z0-9'\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          const words = cleanName.split(' ');

          const femaleExactWords = new Set([
            'siti', 'putri', 'nisa', 'anisa', 'annisa', 'aulia', 'fadhila', 'fadhilah', 'nabila',
            'salma', 'salwa', 'zahra', 'zahratus', 'wardah', 'khofifah', 'laila', 'laili', 'fatimah',
            'dewi', 'ayu', 'diah', 'rahma', 'rahmah', 'safitri', 'mahmudah', 'sholihah', 'solihah',
            'hasanah', 'khusna', 'marwah', 'chasanah', 'ulfa', 'wulandari', 'lestari', 'khoirunnisa',
            'khotimah', 'chotimah', 'rohmah', 'muthoharoh', 'muthmainnah', 'hanifah', 'azizah',
            'khoiriyah', 'latifah', 'hidayah', 'fauziyah', 'khasanah', 'shofiyah', 'nadhiroh',
            'muniroh', 'syarifah', 'musyarofah', 'mufidah', 'karimah', 'jamilah', 'hamidah',
            'zakiyah', "badi'ah", 'badriyah', 'farihah', 'afifah', 'afifatun', 'nafila',
            'septiyana', 'faiqotul', 'nadhifatul', 'shakinah', 'mella', 'maghfiroh', 'maliyatul',
            'sariroh', 'alifa', 'anindya', 'neli', 'lilis', 'jahro', "safa'atun", 'fartiah',
            'suweri', 'kurniawati', 'retno', 'indah', "mar'ah", 'aisyah', 'khadijah', 'maryam',
            'asma', 'ruqayyah', 'ruqoyyah', 'ummu', 'umi', 'kulsum', 'kalsum', 'munawwaroh', 'munawwarotul',
            'nadia', 'nadiatus', 'husna', 'qurrota', 'aini', 'thoifatul', 'maula', 'syifa', 'naila',
            'alya', 'chumairoh', 'himmah', 'fikriyah', 'fikriyyah', 'sofi', 'sofiyana', 'atiah',
            'nuraeni', 'khumaedah', 'fitriyana', 'fitriyani', 'fitriyah', 'istianatul', 'halimah',
            'noviyanti', 'agustina', 'nurhaliza', 'amelia', 'aprilianti', 'cahyani', 'maharani',
            'puspitasari', 'damayanti', 'astuti', 'handayani', 'susanti', 'rahayu', 'kusumawati',
            'wati', 'ningsih', 'fatmawati', 'herawati', 'anggraeni', 'binti', 'dina', 'vina',
            'rina', 'lutfiana', 'alfiana', 'fiana', 'triana', 'yuliana', 'rosida', 'farida',
            'nurul', 'kurnia', 'ani', 'sri', 'nissa', 'fitri', 'charirotul', 'chilma', 'maratun',
            "mar'atun", 'zulfah', 'zulfa', 'fitriani', 'fitria', 'sunarifah', 'arifatut', 'syarifatun'
          ]);

          const maleExactWords = new Set([
            'muhammad', 'moch', 'moh', 'muh', 'm', 'ahmad', 'achmad', 'abdul', 'abd', 'ibnu', 'bin',
            'dafa', 'daffa', 'habib', 'fajar', 'rizky', 'rizqi', 'maulana', 'syarif', 'ulum',
            'mubarok', 'hakim', 'baha', "baha'udin", 'azid', 'dzikrullah', 'fuad', 'eric',
            'agus', 'kasnari', 'nasrullah', 'faizi', 'shohib', 'sholahuddin', 'albab', 'ikhsan',
            'saifuloh', 'saifullah', 'rosyikhul', 'ali', 'umar', 'usman', 'uthman', 'hasan', 'husain',
            'husen', 'fauzan', 'farhan', 'fathur', 'fathurrahman', 'ilham', 'zaki', 'zakariya',
            'putra', 'saputra', 'sputra', 'adi', 'budi', 'eko', 'joko', 'bayu', 'bagus', 'dimas', 'hendra',
            'indra', 'slamet', 'prasetyo', 'hadi', 'wahyu', 'triyono', 'sukamto', 'supri', 'supriyadi',
            'riyanto', 'sutrisno', 'sugeng', 'sugiyanto', 'anwar', 'munir', 'basri', 'asyhari',
            'musthofa', 'mustafa', 'nawawi', 'sholeh', 'soleh', 'mahrus', 'marzuqi', 'mukhlis',
            'mukhlas', 'fadhil', 'ghani', 'hanif', 'hafizh', 'hafidz', 'hafid', 'iqbal', 'irfan',
            'ihsan', 'khilmi', 'hilmi', 'khoirul', 'khairul', 'latif', 'marwan', 'naufal', 'qosim',
            'qasim', 'rafi', 'rafli', 'raihan', 'reyhan', 'rabbani', 'rizal', 'rofiq', 'sabik',
            'shafiq', 'shonhaji', 'subhan', 'syamsul', "syafi'i", 'syafii', 'taufiq', 'taufiqurrahman',
            'wildan', 'zuhdi', 'zidan', 'fadli', 'fadhly', 'arif', 'afwan', 'awaludin', 'awaluddin',
            'ishomuddin', 'ishom', 'hamzah', 'lukman', 'luqman', 'faisal', 'khalid', 'thoriq',
            'bilal', 'salman', 'furqon', 'furqan', 'ridho', 'ridwan', 'malik', 'pratama', 'setiawan',
            'wibowo', 'susanto', 'widodo', 'santoso', 'firmansyah', 'irawan', 'kurniawan', 'saputro',
            'nugroho', 'gunawan', 'hermawan', 'kusuma', 'pradana', 'purnomo', 'dwi', 'yusuf',
            'ibrahim', 'ismail', 'musa', 'harun', 'ilyas', 'shodiq', 'sodiq', 'zaid', 'anas',
            'habibi', 'ghozali', 'minanurrohman', 'minanurrahman', 'rhamdani', 'ramdhani', 'ramdani',
            'lathif', 'islahuddin', 'alfaiz', 'fahri', 'jadid', 'dimyati', 'jauhari', 'alawi', 'rohman',
            'musyodiq', 'nasih', 'amin', 'miftah', 'khoir', 'khafidz', 'arifin', 'maarif', "ma'arif"
          ]);

          let maleScore = 0;
          let femaleScore = 0;

          for (const w of words) {
            if (femaleExactWords.has(w)) femaleScore += 2;
            if (maleExactWords.has(w)) maleScore += 2;

            if (w.endsWith('uddin') || w.endsWith('udin')) maleScore += 3;
            if (w.endsWith('putra') || w.endsWith('saputra') || w.endsWith('sputra') || w.endsWith('wan') || w.endsWith('to') || w.endsWith('wo')) maleScore += 2;
            if (w.endsWith('wati') || w.endsWith('atun') || w.endsWith('iyah') || w.endsWith('iyyah') || w.endsWith('unnisa') || w.endsWith('aeni')) femaleScore += 3;
            if (w.endsWith('ah') && !['hamzah', 'hudzaifah', 'talhah', 'albab', 'syah', 'nasih', 'miftah', 'abdullah', 'saifullah', 'hidayatullah'].includes(w)) femaleScore += 1;
          }

          if (femaleScore > maleScore) {
            detectedGender = 'P';
          } else if (maleScore > femaleScore) {
            detectedGender = 'L';
          } else {
            // Mayoritas santri di pesantren adalah putra (80%)
            detectedGender = 'L';
          }
        }

        const gender: 'L' | 'P' = detectedGender || 'L';

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
        const hasAnakKe = rawAnakKe !== undefined && rawAnakKe !== null && String(rawAnakKe).trim() !== '' && String(rawAnakKe).trim() !== '0';
        const parsedAnakKe = hasAnakKe ? parseInt(String(rawAnakKe).replace(/[^0-9]/g, ''), 10) : NaN;
        const urutanAnak: number | undefined = !isNaN(parsedAnakKe) && parsedAnakKe > 0 ? parsedAnakKe : undefined;

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
          item.saudara_total ??
          item.banyak_saudara;
        const hasSaudara = rawDariBersaudara !== undefined && rawDariBersaudara !== null && String(rawDariBersaudara).trim() !== '' && String(rawDariBersaudara).trim() !== '0';
        const parsedSaudara = hasSaudara ? parseInt(String(rawDariBersaudara).replace(/[^0-9]/g, ''), 10) : NaN;
        let jumlahSaudara: number | undefined = !isNaN(parsedSaudara) && parsedSaudara > 0 ? parsedSaudara : undefined;

        // Jika data ada dan urutanAnak > jumlahSaudara (misal di database terisi "anak ke-3, saudara: 2" - maksudnya punya 2 saudara kandung):
        // Maka total anak bersaudara disesuaikan agar logis dan valid
        if (urutanAnak !== undefined && jumlahSaudara !== undefined && urutanAnak > jumlahSaudara) {
          jumlahSaudara = Math.max(urutanAnak, jumlahSaudara + 1);
        }

        const anak_ke = urutanAnak;
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
      ...(updates.gender !== undefined
        ? {
            gender: updates.gender,
            jenis_kelamin: updates.gender === 'P' ? 'Perempuan' : 'Laki-laki',
            jenisKelamin: updates.gender,
            jk: updates.gender,
          }
        : {}),
      ...(updates.anak_ke !== undefined || updates.urutanAnak !== undefined
        ? {
            anak_ke: updates.anak_ke ?? updates.urutanAnak,
            urutanAnak: updates.anak_ke ?? updates.urutanAnak,
            anakKe: updates.anak_ke ?? updates.urutanAnak,
            urutan_anak: updates.anak_ke ?? updates.urutanAnak,
          }
        : {}),
      ...(updates.dari_bersaudara !== undefined || updates.jumlahSaudara !== undefined
        ? {
            dari_bersaudara: updates.dari_bersaudara ?? updates.jumlahSaudara,
            jumlahSaudara: updates.dari_bersaudara ?? updates.jumlahSaudara,
            dariBersaudara: updates.dari_bersaudara ?? updates.jumlahSaudara,
            jumlah_saudara: updates.dari_bersaudara ?? updates.jumlahSaudara,
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
      jenis_kelamin: newAlumni.gender === 'P' ? 'Perempuan' : 'Laki-laki',
      jenisKelamin: newAlumni.gender,
      jk: newAlumni.gender,
      anak_ke: newAlumni.anak_ke ?? newAlumni.urutanAnak ?? 1,
      dari_bersaudara: newAlumni.dari_bersaudara ?? newAlumni.jumlahSaudara ?? 1,
      urutanAnak: newAlumni.anak_ke ?? newAlumni.urutanAnak ?? 1,
      jumlahSaudara: newAlumni.dari_bersaudara ?? newAlumni.jumlahSaudara ?? 1,
      anakKe: newAlumni.anak_ke ?? newAlumni.urutanAnak ?? 1,
      urutan_anak: newAlumni.anak_ke ?? newAlumni.urutanAnak ?? 1,
      dariBersaudara: newAlumni.dari_bersaudara ?? newAlumni.jumlahSaudara ?? 1,
      jumlah_saudara: newAlumni.dari_bersaudara ?? newAlumni.jumlahSaudara ?? 1,
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
