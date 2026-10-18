import { AlumniRecord, AdminUser } from '../types';
import logoPonpesImg from '../assets/images/logo_ponpes_attaroqqy_1790648746461.jpg';

/**
 * Format string handle or name to standard @username
 */
export const formatAuthorUsername = (handleOrName?: string, defaultHandle: string = '@admin_pusat'): string => {
  if (!handleOrName) return defaultHandle;
  const clean = handleOrName.trim();
  if (clean.startsWith('@')) return clean;
  if (!clean.includes(' ')) return `@${clean}`;
  const slug = clean
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return `@${slug || 'attaroqqy_official'}`;
};

/**
 * Resolves the author's display photo for an event or announcement card.
 * Priority:
 * 1. Matching admin in adminList or currentAdmin (reflecting the exact photo configured in admin settings)
 * 2. Matching alumni in alumniList
 * 3. Non-dummy post avatar
 * 4. Fallback to currentAdmin.avatar or official pondok logo
 */
export const resolvePostAuthorAvatar = (
  authorName?: string,
  authorHandle?: string,
  postAvatar?: string,
  currentAdmin?: AdminUser,
  adminList?: AdminUser[],
  alumniList?: AlumniRecord[]
): string => {
  const cleanHandle = (authorHandle || '').replace(/^@/, '').toLowerCase().trim();
  const cleanName = (authorName || '').toLowerCase().trim();

  // 1. Check if matches currentAdmin
  if (currentAdmin) {
    const adminH = (currentAdmin.username || '').replace(/^@/, '').toLowerCase().trim();
    const adminN = (currentAdmin.name || '').toLowerCase().trim();
    const isPusat = cleanHandle === 'admin_pusat' || cleanHandle === '' || cleanName === 'ust. h. abdurrahman, m.pd.' || cleanName === 'davidko' || cleanName === 'davidson' || cleanName === 'admin pusat';
    const isThisAdmin = (cleanHandle && cleanHandle === adminH) || (cleanName && cleanName === adminN);

    if ((isThisAdmin || (isPusat && (currentAdmin.regionLevel === 'pusat' || currentAdmin.role === 'super_admin'))) && currentAdmin.avatar) {
      if (!currentAdmin.avatar.includes('unsplash.com')) {
        return currentAdmin.avatar;
      }
    }
  }

  // 2. Check if matches any admin in adminList
  if (adminList && adminList.length > 0) {
    const matchedAdmin = adminList.find((adm) => {
      const h = (adm.username || '').replace(/^@/, '').toLowerCase().trim();
      const n = (adm.name || '').toLowerCase().trim();
      return (cleanHandle && h === cleanHandle) || (cleanName && n === cleanName);
    });

    if (matchedAdmin && matchedAdmin.avatar && !matchedAdmin.avatar.includes('unsplash.com')) {
      return matchedAdmin.avatar;
    }
  }

  // 3. Check in alumniList
  if (alumniList && alumniList.length > 0) {
    const matchedAlumni = alumniList.find((alm) => {
      const h = (alm.username || '').replace(/^@/, '').toLowerCase().trim();
      const n = (alm.name || '').toLowerCase().trim();
      return (cleanHandle && h === cleanHandle) || (cleanName && n === cleanName);
    });

    if (matchedAlumni && matchedAlumni.photoUrl) {
      return matchedAlumni.photoUrl;
    }
  }

  // 4. Use postAvatar if it is valid and NOT an unsplash fake photo
  if (postAvatar && typeof postAvatar === 'string' && postAvatar.trim()) {
    if (!postAvatar.includes('unsplash.com')) {
      return postAvatar;
    }
  }

  // 5. Fallback: currentAdmin avatar or official logo
  if (currentAdmin?.avatar && !currentAdmin.avatar.includes('unsplash.com')) {
    return currentAdmin.avatar;
  }

  return logoPonpesImg;
};

/**
 * Finds or constructs the AlumniRecord for an author so it can be opened
 * with AlumniProfileCardModal (exact same modal as when clicking alumni in search).
 */
export const resolveAuthorAlumniRecord = (
  authorName?: string,
  authorHandle?: string,
  authorAvatar?: string,
  alumniList: AlumniRecord[] = [],
  fallbackAdmin?: AdminUser,
  adminList?: AdminUser[]
): AlumniRecord => {
  const cleanHandle = (authorHandle || '').replace(/^@/, '').toLowerCase().trim();
  const cleanName = (authorName || '').toLowerCase().trim();

  // 1. Search in alumniList by username
  if (cleanHandle) {
    const matchByUsername = alumniList.find(
      (a) => a.username && a.username.replace(/^@/, '').toLowerCase().trim() === cleanHandle
    );
    if (matchByUsername) return matchByUsername;
  }

  // 2. Search in alumniList by name
  if (cleanName) {
    const matchByName = alumniList.find(
      (a) => a.name && a.name.toLowerCase().trim() === cleanName
    );
    if (matchByName) return matchByName;
  }

  // 3. Search in adminList or fallbackAdmin
  const matchedAdmin = adminList?.find((a) => {
    const aH = (a.username || '').replace(/^@/, '').toLowerCase().trim();
    const aN = (a.name || '').toLowerCase().trim();
    return (cleanHandle && aH === cleanHandle) || (cleanName && aN === cleanName);
  }) || fallbackAdmin;

  const effectiveAvatar = resolvePostAuthorAvatar(
    authorName,
    authorHandle,
    authorAvatar,
    matchedAdmin || fallbackAdmin,
    adminList,
    alumniList
  );

  // 4. Return complete and consistent author profile
  return {
    id: matchedAdmin?.id || 'author-admin',
    nik: '3507000000000000',
    nis: 'TRQ-ADMIN',
    name: matchedAdmin?.name || authorName || fallbackAdmin?.name || 'Ust. H. Abdurrahman, M.Pd.',
    username: (matchedAdmin?.username || cleanHandle || fallbackAdmin?.username || 'admin_pusat').replace(/^@/, ''),
    gender: 'L',
    gradYear: 'Administrator Alumni',
    entryYear: '2016',
    jenjang: 'Pondok Pesantren At-taroqqy',
    asramaDulu: 'Pusat Santri',
    email: matchedAdmin?.email || fallbackAdmin?.email || 'ponpes@attaroqqy.com',
    phone: matchedAdmin?.phone || fallbackAdmin?.phone || '081234567890',
    city: matchedAdmin?.city || fallbackAdmin?.city || 'Kab. Malang',
    province: matchedAdmin?.province || fallbackAdmin?.province || 'Jawa Timur',
    kecamatan: matchedAdmin?.kecamatan || fallbackAdmin?.kecamatan || 'Dampit',
    desa: matchedAdmin?.desa || fallbackAdmin?.desa || 'Majangtengah',
    alamatLengkap: matchedAdmin?.alamatLengkap || fallbackAdmin?.alamatLengkap || 'Jl. Pesantren No. 01 RT 02 / RW 01',
    coordinates: matchedAdmin?.coordinates || fallbackAdmin?.coordinates || { lat: -8.2123, lng: 112.7534 },
    occupation: matchedAdmin?.jabatan || fallbackAdmin?.jabatan || 'Kepala Bidang Kesantrian & Alumni Ponpes At-taroqqy',
    institution: '',
    bio: matchedAdmin?.bio || fallbackAdmin?.bio || 'Pengasuh & Dewan Pembina Ikatan Alumni Pondok Pesantren At-taroqqy.',
    photoUrl: effectiveAvatar,
    coverPhotoUrl: matchedAdmin?.coverPhotoUrl || fallbackAdmin?.coverPhotoUrl,
    password: '',
    isPasswordChanged: true,
    source: 'manual_admin',
    syncTime: new Date().toISOString(),
    shareContact: true,
    shareFullAddress: true,
    shareLocationTag: true,
    status: 'alumni',
  };
};
