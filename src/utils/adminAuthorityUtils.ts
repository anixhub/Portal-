import { AdminUser, AudienceTarget, AdminRegionLevel } from '../types';

/**
 * Mendapatkan label wilayah kewenangan akun admin dalam bahasa Indonesia yang ramah.
 */
export const formatAdminAuthorityLabel = (admin: AdminUser): string => {
  const level = admin.regionLevel || (admin.role === 'super_admin' ? 'pusat' : 'provinsi');
  if (level === 'pusat') {
    return 'Pusat (Nasional / Seluruh Wilayah)';
  }
  if (level === 'provinsi') {
    return `Wilayah Provinsi ${admin.province || 'Jawa Timur'}`;
  }
  if (level === 'kota') {
    return `Wilayah ${admin.city || 'Kab. Malang'}`;
  }
  if (level === 'kecamatan') {
    return `Kecamatan ${admin.kecamatan || '-'}, ${admin.city || ''}`;
  }
  return 'Wilayah Khusus';
};

/**
 * Cek apakah currentAdmin memiliki wewenang untuk menambah/mengatur/menghapus targetAdmin.
 * Aturan:
 * - Admin Pusat: Memiliki akses penuh mengelola semua akun admin.
 * - Admin Daerah: Hanya bisa mengelola akun di wilayahnya atau daerah bawahnya (misal: Provinsi bisa kelola Kota/Kecamatan di provinsinya).
 * - Luar daerah: Hanya bisa melihat datanya, TIDAK bisa edit/hapus.
 */
export const canAdminManage = (currentAdmin: AdminUser, targetAdmin: AdminUser): boolean => {
  const currentLevel: AdminRegionLevel = currentAdmin.regionLevel || (currentAdmin.role === 'super_admin' ? 'pusat' : 'provinsi');
  const targetLevel: AdminRegionLevel = targetAdmin.regionLevel || (targetAdmin.role === 'super_admin' ? 'pusat' : 'provinsi');

  // 1. Admin Pusat / Super Admin dapat mengelola semua
  if (currentLevel === 'pusat' || currentAdmin.role === 'super_admin') {
    return true;
  }

  // 2. Admin tidak bisa mengedit akun Pusat jika bukan Pusat
  if (targetLevel === 'pusat' || targetAdmin.role === 'super_admin') {
    return false;
  }

  // 3. Akun milik dirinya sendiri selalu bisa diedit (profil)
  if (targetAdmin.id === currentAdmin.id) {
    return true;
  }

  const normalize = (str?: string) => (str || '').toLowerCase().trim();

  // 4. Admin Tingkat Provinsi
  if (currentLevel === 'provinsi') {
    const sameProv = normalize(currentAdmin.province) === normalize(targetAdmin.province);
    if (!sameProv) return false;

    // Bisa mengelola kota & kecamatan di bawah provinsinya, atau sesama pengurus provinsi
    return targetLevel === 'kota' || targetLevel === 'kecamatan' || targetLevel === 'provinsi';
  }

  // 5. Admin Tingkat Kota / Kabupaten
  if (currentLevel === 'kota') {
    const sameProv = normalize(currentAdmin.province) === normalize(targetAdmin.province);
    const sameCity = normalize(currentAdmin.city) === normalize(targetAdmin.city);
    if (!sameProv || !sameCity) return false;

    // Bisa mengelola kecamatan di bawah kotanya, atau sesama pengurus kotanya
    return targetLevel === 'kecamatan' || targetLevel === 'kota';
  }

  // 6. Admin Tingkat Kecamatan
  if (currentLevel === 'kecamatan') {
    const sameProv = normalize(currentAdmin.province) === normalize(targetAdmin.province);
    const sameCity = normalize(currentAdmin.city) === normalize(targetAdmin.city);
    const sameKec = normalize(currentAdmin.kecamatan) === normalize(targetAdmin.kecamatan);
    return sameProv && sameCity && sameKec;
  }

  return false;
};

/**
 * Menghasilkan target audiens otomatis berdasarkan wewenang daerah akun admin.
 * Postingan dia otomatis hanya bisa dilihat daerahnya atau daerah bawahnya yang dia bawahi.
 */
export const getAdminDefaultAudience = (admin: AdminUser): AudienceTarget => {
  const level: AdminRegionLevel = admin.regionLevel || (admin.role === 'super_admin' ? 'pusat' : 'provinsi');

  if (level === 'pusat') {
    return {
      gender: 'semua',
      regionScope: 'semua',
    };
  }

  if (level === 'provinsi') {
    return {
      gender: 'semua',
      regionScope: 'khusus',
      provinceName: admin.province || 'Jawa Timur',
    };
  }

  if (level === 'kota') {
    return {
      gender: 'semua',
      regionScope: 'khusus',
      provinceName: admin.province || 'Jawa Timur',
      regencyName: admin.city || '',
    };
  }

  if (level === 'kecamatan') {
    return {
      gender: 'semua',
      regionScope: 'khusus',
      provinceName: admin.province || 'Jawa Timur',
      regencyName: admin.city || '',
      districtName: admin.kecamatan || '',
    };
  }

  return {
    gender: 'semua',
    regionScope: 'semua',
  };
};
