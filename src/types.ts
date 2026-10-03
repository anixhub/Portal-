export interface AlumniRecord {
  id: string;
  nik: string;
  noKk?: string;
  nis: string;
  name: string;
  username?: string;
  gender: 'L' | 'P';
  gradYear: string;
  entryYear: string;
  gradDate?: string;
  entryDate?: string;
  jenjang: string;
  asramaDulu: string;
  email: string;
  phone: string;
  city: string;
  province: string;
  kecamatan?: string;
  desa?: string;
  alamatLengkap?: string;
  coordinates?: { lat: number; lng: number } | null;
  occupation: string;
  institution: string;
  password: string; // default '1234'
  isPasswordChanged: boolean;
  source: 'hostinger_sync' | 'manual_admin';
  syncTime: string;
  bio?: string;
  photoUrl?: string;
  coverPhotoUrl?: string;
  hasLoggedIn?: boolean;
  shareContact: boolean;
  shareEmail?: boolean;
  shareFullAddress?: boolean;
  shareLocationTag?: boolean;
  status: 'alumni' | 'santri_aktif' | 'admin';
  // Informasi Tambahan
  tempatLahir?: string;
  tanggalLahir?: string;
  anak_ke?: number | string;
  dari_bersaudara?: number | string;
  urutanAnak?: number;
  jumlahSaudara?: number;
  nism?: string;
  nisn?: string;
  namaAyah?: string;
  nikAyah?: string;
  pekerjaanAyah?: string;
  pendidikanAyah?: string;
  namaIbu?: string;
  nikIbu?: string;
  pekerjaanIbu?: string;
  pendidikanIbu?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  username: string;
  email?: string;
  phone?: string;
  bio?: string;
  occupation?: string;
  institution?: string;
  province?: string;
  city?: string;
  kecamatan?: string;
  desa?: string;
  alamatLengkap?: string;
  coordinates?: { lat: number; lng: number };
  shareFullAddress?: boolean;
  role: 'super_admin' | 'pengurus_pondok';
  jabatan: string;
  avatar?: string;
  coverPhotoUrl?: string;
  password?: string;
}

export interface AudienceTarget {
  gender?: 'semua' | 'L' | 'P'; // 'semua' | 'L' (Ikhwan) | 'P' (Akhwat)
  regionScope?: 'semua' | 'khusus'; // 'semua' wilayah | 'khusus' wilayah
  provinceId?: string;
  provinceName?: string;
  regencyId?: string;
  regencyName?: string;
  districtId?: string;
  districtName?: string;
  villageId?: string;
  villageName?: string;
}

export interface EventAgenda {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: 'reuni' | 'haul' | 'kajian' | 'korda';
  description: string;
  attendeesCount: number;
  absentCount?: number;
  notAttendingCount?: number;
  uncertainCount?: number;
  userRsvp?: 'hadir' | 'belum_pasti' | 'tidak_hadir';
  rsvpNote?: string;
  posterUrl?: string;
  images?: string[];
  authorName?: string;
  authorHandle?: string;
  authorAvatar?: string;
  postedAt?: string;
  targetAudience?: AudienceTarget;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  date: string;
  postedAt?: string;
  category?: 'maklumat' | 'kegiatan' | 'beasiswa' | 'umum';
  content: string;
  authorName: string;
  authorHandle?: string;
  authorAvatar?: string;
  authorRole: string;
  isImportant?: boolean;
  images?: string[];
  targetAudience?: AudienceTarget;
  likesCount?: number;
  isLiked?: boolean;
  commentsCount?: number;
}

export interface AttendanceAttendee {
  id: string;
  alumniId: string;
  alumniName: string;
  alumniNis: string;
  desa?: string;
  kecamatan?: string;
  city?: string;
  addressText?: string;
  gradYear?: string;
  jenjang?: string;
  checkInTime: string;
  photoUrl?: string;
  gender?: 'L' | 'P';
  method: 'qr' | 'manual';
}

export interface AttendanceSession {
  id: string;
  title: string;
  date: string;
  sourceEventId?: string;
  sourceType: 'imported' | 'manual';
  createdAt: string;
  attendees: AttendanceAttendee[];
}

export interface EventCommentReply {
  id: string;
  commentId: string;
  authorName: string;
  authorHandle?: string;
  authorAvatar?: string;
  avatarRing?: boolean;
  content: string;
  timeAgo: string;
  likesCount?: number;
  isLiked?: boolean;
}

export interface EventComment {
  id: string;
  eventId: string;
  authorName: string;
  authorHandle?: string;
  authorAvatar?: string;
  avatarRing?: boolean;
  status?: 'hadir' | 'tidak_hadir';
  content: string;
  timeAgo: string;
  likesCount?: number;
  isLiked?: boolean;
  repliesCount?: number;
  replies?: EventCommentReply[];
  isCurrentUser?: boolean;
}

export type UserRole = 'alumni' | 'admin';

export interface ActiveSession {
  role: UserRole;
  alumniData?: AlumniRecord;
  adminData?: AdminUser;
}

export interface RegisterFormData {
  name: string;
  email: string;
  phone: string;
  gradYear: string;
  majorOrProgram: string;
  password: string;
  confirmPassword: string;
}

export interface NotificationItem {
  id: string;
  type: 'reply' | 'system' | 'finance' | 'like';
  title: string;
  message: string;
  time: string;
  read: boolean;
  authorName?: string;
  tag?: string;
}
