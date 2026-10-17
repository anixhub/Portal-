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

/**
 * Cek apakah seorang alumni berada di wilayah kekuasaan / kewenangan admin.
 * Admin pusat: berhak mengelola semua alumni se-Indonesia.
 * Admin daerah: hanya berhak mengelola alumni di daerahnya atau sub-wilayah bawahnya.
 */
export const isAlumniInAdminJurisdiction = (alumni: any, admin: AdminUser): boolean => {
  const level: AdminRegionLevel = admin.regionLevel || (admin.role === 'super_admin' ? 'pusat' : 'provinsi');
  if (level === 'pusat' || admin.role === 'super_admin' || admin.username === '@admin_pusat') {
    return true;
  }

  const norm = (s?: string) =>
    (s || '').toLowerCase().replace(/^(provinsi|kota|kabupaten|kab\.|kecamatan|kec\.|desa|kelurahan)\s+/i, '').trim();

  const almProv = norm(alumni.province);
  const adminProv = norm(admin.province);

  // Tingkat Provinsi: alumni harus di provinsi yang sama
  if (level === 'provinsi') {
    return Boolean(adminProv && (almProv.includes(adminProv) || adminProv.includes(almProv)));
  }

  const almCity = norm(alumni.city);
  const adminCity = norm(admin.city);

  // Tingkat Kota / Kabupaten: alumni harus di kota/kabupaten yang sama
  if (level === 'kota') {
    const matchCity = Boolean(adminCity && (almCity.includes(adminCity) || adminCity.includes(almCity)));
    const matchProv = !adminProv || (almProv.includes(adminProv) || adminProv.includes(almProv));
    return matchCity && matchProv;
  }

  const almKec = norm(alumni.kecamatan);
  const adminKec = norm(admin.kecamatan);

  // Tingkat Kecamatan: alumni harus di kecamatan yang sama
  if (level === 'kecamatan') {
    const matchKec = Boolean(adminKec && (almKec.includes(adminKec) || adminKec.includes(almKec)));
    const matchCity = !adminCity || (almCity.includes(adminCity) || adminCity.includes(almCity));
    return matchKec && matchCity;
  }

  // Tingkat Desa
  if (level === 'desa') {
    const almDesa = norm(alumni.desa);
    const adminDesa = norm(admin.desa);
    return Boolean(adminDesa && (almDesa.includes(adminDesa) || adminDesa.includes(almDesa)));
  }

  return true;
};

/**
 * Memastikan admin hanya dapat menargetkan postingan ke wilayahnya atau wilayah bawahnya.
 */
export const isTargetInAdminJurisdiction = (admin: AdminUser, target: AudienceTarget): boolean => {
  const level: AdminRegionLevel = admin.regionLevel || (admin.role === 'super_admin' ? 'pusat' : 'provinsi');
  if (level === 'pusat' || admin.role === 'super_admin' || admin.username === '@admin_pusat') {
    return true;
  }

  if (target.regionScope === 'semua') {
    return false;
  }

  const norm = (s?: string) =>
    (s || '').toLowerCase().replace(/^(provinsi|kota|kabupaten|kab\.|kecamatan|kec\.|desa|kelurahan)\s+/i, '').trim();

  const targetProv = norm(target.provinceName);
  const adminProv = norm(admin.province);

  if (level === 'provinsi') {
    return Boolean(adminProv && (targetProv.includes(adminProv) || adminProv.includes(targetProv)));
  }

  const targetCity = norm(target.regencyName);
  const adminCity = norm(admin.city);

  if (level === 'kota') {
    const matchCity = Boolean(adminCity && (targetCity.includes(adminCity) || adminCity.includes(targetCity)));
    return matchCity;
  }

  const targetKec = norm(target.districtName);
  const adminKec = norm(admin.kecamatan);

  if (level === 'kecamatan') {
    return Boolean(adminKec && (targetKec.includes(adminKec) || adminKec.includes(targetKec)));
  }

  return true;
};
