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
 * Finds or constructs the AlumniRecord for an author so it can be opened
 * with AlumniProfileCardModal (exact same modal as when clicking alumni in search).
 */
export const resolveAuthorAlumniRecord = (
  authorName?: string,
  authorHandle?: string,
  authorAvatar?: string,
  alumniList: AlumniRecord[] = [],
  fallbackAdmin?: AdminUser
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

  // 3. Fallback: Admin / Pengasuh profile
  return {
    id: 'author-admin',
    nik: '3507000000000000',
    nis: 'TRQ-ADMIN',
    name: authorName || fallbackAdmin?.name || 'Ust. H. Abdurrahman, M.Pd.',
    username: cleanHandle || (fallbackAdmin?.username ? fallbackAdmin.username.replace(/^@/, '') : 'admin_pusat'),
    gender: 'L',
    gradYear: 'Kehormatan',
    entryYear: '2016',
    jenjang: 'Pondok Pesantren At-taroqqy',
    asramaDulu: 'Pusat Santri',
    email: 'ponpes@attaroqqy.com',
    phone: '081234567890',
    city: 'Malang',
    province: 'Jawa Timur',
    occupation: 'Pengasuh & Pengurus Alumni',
    institution: 'Pondok Pesantren At-taroqqy',
    bio: 'Pengasuh & Dewan Pembina Ikatan Alumni Pondok Pesantren At-taroqqy.',
    photoUrl: authorAvatar || fallbackAdmin?.avatar || logoPonpesImg,
    coverPhotoUrl: fallbackAdmin?.coverPhotoUrl,
    password: '',
    isPasswordChanged: true,
    source: 'manual_admin',
    syncTime: new Date().toISOString(),
    shareContact: true,
    status: 'alumni',
  };
};
