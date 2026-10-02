import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  User, 
  Search, 
  Filter, 
  Plus, 
  ChevronRight, 
  MapPin, 
  Clock, 
  X, 
  KeyRound, 
  LogOut, 
  ShieldCheck, 
  UserPlus, 
  Pencil, 
  Download, 
  Share2, 
  Map, 
  Camera, 
  ArrowLeft,
  Tag,
  QrCode,
  Trash2,
  Upload,
  ImageIcon,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Megaphone,
  Check,
  MoreVertical
} from 'lucide-react';
import { AlumniRecord, AdminUser, EventAgenda, EventComment, EventCommentReply, AnnouncementItem, AttendanceSession, AttendanceAttendee } from '../types';
import { AddAlumniModal } from './admin/AddAlumniModal';
import { AlumniDetailAdminModal } from './admin/AlumniDetailAdminModal';
import { AdminAnnouncementsTab } from './admin/AdminAnnouncementsTab';
import { WilayahAddressFilter } from './common/WilayahAddressFilter';
import { AlumniDistributionMapModal } from './common/AlumniDistributionMapModal';
import { CleanMediaPreviewModal } from './common/CleanMediaPreviewModal';
import { FullscreenPhotoViewerModal } from './common/FullscreenPhotoViewerModal';
import { EventCommentsModal } from './common/EventCommentsModal';
import { EventAttendanceScannerModal } from './admin/EventAttendanceScannerModal';
import { CreateAttendanceModal } from './admin/CreateAttendanceModal';
import { FullAttendanceViewModal } from './admin/FullAttendanceViewModal';
import { TimeWheelPickerBottomSheet } from './admin/TimeWheelPickerBottomSheet';
import { INITIAL_EVENT_COMMENTS, INITIAL_ANNOUNCEMENTS } from '../data/mockData';
import logoPonpesImg from '../assets/images/logo_ponpes_attaroqqy_1790648746461.jpg';
import posterReuniImg from '../assets/images/poster_reuni_akbar_1790648045947.jpg';

const indonesianMonthMap: Record<string, string> = {
  januari: '01', februari: '02', maret: '03', april: '04',
  mei: '05', juni: '06', juli: '07', agustus: '08',
  september: '09', oktober: '10', november: '11', desember: '12'
};

const indonesianMonths = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const formatToIndonesianDate = (isoStr: string) => {
  if (!isoStr) return '';
  const [y, m, d] = isoStr.split('-');
  if (!y || !m || !d) return isoStr;
  const monthIdx = parseInt(m, 10) - 1;
  const monthName = indonesianMonths[monthIdx] || m;
  return `${parseInt(d, 10)} ${monthName} ${y}`;
};

const parseIndonesianDateToIso = (str: string): string => {
  if (!str) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parts = str.trim().split(/\s+/);
  if (parts.length >= 3) {
    const day = parts[0].padStart(2, '0');
    const month = indonesianMonthMap[parts[1].toLowerCase()];
    const year = parts[2];
    if (day && month && year) {
      return `${year}-${month}-${day}`;
    }
  }
  return '';
};

const calculateAge = (birthDateStr?: string): number | null => {
  if (!birthDateStr) return null;
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 && age < 130 ? age : null;
};

interface AdminViewProps {
  admin: AdminUser;
  alumniList: AlumniRecord[];
  events: EventAgenda[];
  announcements?: AnnouncementItem[];
  onLogout: () => void;
  onAddAlumni: (newAlumni: AlumniRecord) => void;
  onUpdateAlumni: (id: string, updated: Partial<AlumniRecord>) => void;
  onResetPassword: (id: string) => void;
  onAddEvent: (newEvent: EventAgenda) => void;
  onUpdateAdmin?: (updated: Partial<AdminUser>) => void;
  onAddAnnouncement?: (ann: AnnouncementItem) => void;
  onUpdateAnnouncement?: (id: string, updated: Partial<AnnouncementItem>) => void;
  onDeleteAnnouncement?: (id: string) => void;
}

type AdminTab = 'agenda' | 'alumni' | 'pengumuman' | 'profile';

export const AdminView: React.FC<AdminViewProps> = ({
  admin,
  alumniList,
  events,
  announcements,
  onLogout,
  onAddAlumni,
  onUpdateAlumni,
  onResetPassword,
  onAddEvent,
  onUpdateAdmin,
  onAddAnnouncement,
  onUpdateAnnouncement,
  onDeleteAnnouncement,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('alumni');
  const [eventList, setEventList] = useState<EventAgenda[]>(events);
  const [announcementList, setAnnouncementList] = useState<AnnouncementItem[]>(
    announcements || INITIAL_ANNOUNCEMENTS
  );

  // Admin Profile Edit State
  const [adminUser, setAdminUser] = useState<AdminUser>(admin);
  const [editAdminName, setEditAdminName] = useState(admin.name);
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);
  const [editAdminUsername, setEditAdminUsername] = useState(admin.username || '@admin_pusat');
  const [isEditUsernameModalOpen, setIsEditUsernameModalOpen] = useState(false);

  useEffect(() => {
    setAdminUser(admin);
    setEditAdminName(admin.name);
    setEditAdminUsername(admin.username || '@admin_pusat');
  }, [admin]);

  useEffect(() => {
    if (announcements) {
      setAnnouncementList(announcements);
    }
  }, [announcements]);

  const handleAddAnnouncement = (newAnn: AnnouncementItem) => {
    setAnnouncementList((prev) => [newAnn, ...prev]);
    onAddAnnouncement?.(newAnn);
  };

  const handleUpdateAnnouncement = (id: string, updated: Partial<AnnouncementItem>) => {
    setAnnouncementList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );
    onUpdateAnnouncement?.(id, updated);
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncementList((prev) => prev.filter((item) => item.id !== id));
    onDeleteAnnouncement?.(id);
  };

  const handleSaveAdminUsername = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = editAdminUsername.trim();
    if (!clean) {
      triggerToast('Username tidak boleh kosong');
      return;
    }
    const formatted = clean.startsWith('@') ? clean : '@' + clean;
    const updated: Partial<AdminUser> = {
      username: formatted,
    };
    setAdminUser((prev) => ({ ...prev, ...updated }));
    onUpdateAdmin?.(updated);
    setIsEditUsernameModalOpen(false);
    triggerToast('Username admin berhasil diperbarui');
  };

  const handleSaveAdminName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAdminName.trim()) {
      triggerToast('Nama lengkap tidak boleh kosong');
      return;
    }

    const updated: Partial<AdminUser> = {
      name: editAdminName.trim(),
    };

    setAdminUser((prev) => ({ ...prev, ...updated }));
    onUpdateAdmin?.(updated);
    setIsEditNameModalOpen(false);
    triggerToast('Nama lengkap berhasil diperbarui');
  };

  // Photo & Cover States (sama persis dengan akun alumni/user biasa)
  const [showFullscreenAvatar, setShowFullscreenAvatar] = useState(false);
  const [isCoverBottomSheetOpen, setIsCoverBottomSheetOpen] = useState(false);
  const [showFullscreenCover, setShowFullscreenCover] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      triggerToast('Ukuran foto maksimal 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAdminUser((prev) => ({ ...prev, avatar: result }));
      onUpdateAdmin?.({ avatar: result });
      triggerToast('Foto profil admin berhasil diperbarui');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveAvatar = () => {
    setAdminUser((prev) => ({ ...prev, avatar: undefined }));
    onUpdateAdmin?.({ avatar: undefined });
    setShowFullscreenAvatar(false);
    triggerToast('Foto profil admin berhasil dihapus');
  };

  const handleCoverPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      triggerToast('Ukuran foto sampul maksimal 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAdminUser((prev) => ({ ...prev, coverPhotoUrl: result }));
      onUpdateAdmin?.({ coverPhotoUrl: result });
      triggerToast('Foto sampul admin berhasil diperbarui');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveCoverPhoto = () => {
    setAdminUser((prev) => ({ ...prev, coverPhotoUrl: undefined }));
    onUpdateAdmin?.({ coverPhotoUrl: undefined });
    setIsCoverBottomSheetOpen(false);
    triggerToast('Foto sampul berhasil dihapus');
  };

  // Agenda sub-tabs: 'kelola' | 'presensi'
  const [agendaSubTab, setAgendaSubTab] = useState<'kelola' | 'presensi'>('kelola');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedEventForAttendance, setSelectedEventForAttendance] = useState<EventAgenda | null>(null);

  // Sesi Presensi State (Daftar sesi presensi yang dibuat)
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>(() => {
    const saved = localStorage.getItem('attaroqqy_attendance_sessions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn(e);
      }
    }
    return [
      {
        id: 'att-session-1',
        title: 'Reuni Akbar & Haul Masyayikh Ponpes At-Taroqqy',
        date: '2026-06-20',
        sourceEventId: 'ev-1',
        sourceType: 'imported',
        createdAt: '2026-06-20 07:00:00',
        attendees: [],
      },
      {
        id: 'att-session-2',
        title: 'Registrasi Khataman Ihya Ulumiddin & Ijazahan Kubro',
        date: '2026-05-15',
        sourceType: 'manual',
        createdAt: '2026-05-15 08:30:00',
        attendees: [],
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem('attaroqqy_attendance_sessions', JSON.stringify(attendanceSessions));
  }, [attendanceSessions]);

  // Sesi aktif yang dibuka di halaman penuh daftar hadir
  const [activeAttendanceSession, setActiveAttendanceSession] = useState<AttendanceSession | null>(null);

  // Modal Buat Presensi State
  const [isCreateAttendanceModalOpen, setIsCreateAttendanceModalOpen] = useState(false);
  const [initialEventForCreateAttendance, setInitialEventForCreateAttendance] = useState<EventAgenda | null>(null);

  // Bottom Sheet Menu Opsi Agenda (Titik 3)
  const [activeMenuEvent, setActiveMenuEvent] = useState<EventAgenda | null>(null);

  // Modal Konfirmasi Hapus Sesi Presensi
  const [sessionToDelete, setSessionToDelete] = useState<AttendanceSession | null>(null);

  // Simpan sesi presensi baru
  const handleSaveNewAttendanceSession = (data: {
    title: string;
    date: string;
    sourceEventId?: string;
    sourceType: 'imported' | 'manual';
  }) => {
    const newSession: AttendanceSession = {
      id: 'att-session-' + Date.now(),
      title: data.title,
      date: data.date,
      sourceEventId: data.sourceEventId,
      sourceType: data.sourceType,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      attendees: [],
    };

    setAttendanceSessions((prev) => [newSession, ...prev]);
    triggerToast(`Sesi presensi "${data.title}" berhasil dibuat`);
  };

  // Update kehadiran santri pada sesi presensi
  const handleUpdateSessionAttendees = (sessionId: string, newAttendees: AttendanceAttendee[]) => {
    setAttendanceSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, attendees: newAttendees } : s))
    );
    if (activeAttendanceSession && activeAttendanceSession.id === sessionId) {
      setActiveAttendanceSession((prev) => (prev ? { ...prev, attendees: newAttendees } : null));
    }
  };

  // Expanded caption toggles for agenda cards
  const [expandedCaptions, setExpandedCaptions] = useState<{ [id: string]: boolean }>({});
  const toggleCaption = (id: string) => {
    setExpandedCaptions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Comments modal state & handlers (sama persis dengan agenda akun alumni)
  const [activeCommentsModalEvent, setActiveCommentsModalEvent] = useState<EventAgenda | null>(null);
  const [commentsList, setCommentsList] = useState<EventComment[]>(INITIAL_EVENT_COMMENTS);

  const handleAddComment = (eventId: string, text: string, replyToCommentId?: string) => {
    if (!text.trim()) return;
    if (replyToCommentId) {
      const newReply: EventCommentReply = {
        id: `rep-${Date.now()}`,
        commentId: replyToCommentId,
        authorName: admin.name,
        authorHandle: 'admin_official',
        authorAvatar: admin.avatar,
        avatarRing: true,
        content: text.trim(),
        timeAgo: 'Baru saja',
        likesCount: 0,
      };

      setCommentsList((prev) =>
        prev.map((c) => {
          if (c.id === replyToCommentId) {
            const existingReplies = c.replies || [];
            return {
              ...c,
              replies: [...existingReplies, newReply],
              repliesCount: existingReplies.length + 1,
            };
          }
          return c;
        })
      );
      triggerToast('Balasan berhasil dikirim!');
    } else {
      const newComment: EventComment = {
        id: `comm-${Date.now()}`,
        eventId,
        authorName: admin.name,
        authorHandle: 'admin_official',
        authorAvatar: admin.avatar,
        avatarRing: true,
        content: text.trim(),
        timeAgo: 'Baru saja',
        likesCount: 0,
        repliesCount: 0,
        replies: [],
        isCurrentUser: true,
      };
      setCommentsList((prev) => [newComment, ...prev]);
      triggerToast('Tanggapan berhasil dikirim!');
    }
  };

  const handleToggleLikeComment = (commentId: string, replyId?: string) => {
    setCommentsList((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          if (replyId) {
            const updatedReplies = (c.replies || []).map((rep) => {
              if (rep.id === replyId) {
                const isLiked = !rep.isLiked;
                return {
                  ...rep,
                  isLiked,
                  likesCount: (rep.likesCount || 0) + (isLiked ? 1 : -1),
                };
              }
              return rep;
            });
            return {
              ...c,
              replies: updatedReplies,
            };
          } else {
            const isLiked = !c.isLiked;
            return {
              ...c,
              isLiked,
              likesCount: (c.likesCount || 0) + (isLiked ? 1 : -1),
            };
          }
        }
        return c;
      })
    );
  };

  // Search & Filter state for Kelola Alumni
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'semua' | 'aktif' | 'tidak_aktif'>('semua');
  const [visibleCount, setVisibleCount] = useState(60);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [filterEntryFrom, setFilterEntryFrom] = useState('');
  const [filterEntryTo, setFilterEntryTo] = useState('');
  const [filterGradFrom, setFilterGradFrom] = useState('');
  const [filterGradTo, setFilterGradTo] = useState('');
  const [filterProvince, setFilterProvince] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterKecamatan, setFilterKecamatan] = useState('');
  const [filterDesa, setFilterDesa] = useState('');

  useEffect(() => {
    setVisibleCount(60);
  }, [
    searchQuery,
    filterEntryFrom,
    filterEntryTo,
    filterGradFrom,
    filterGradTo,
    filterProvince,
    filterCity,
    filterKecamatan,
    filterDesa,
    statusFilter,
  ]);

  const hasActiveFilters = Boolean(
    filterEntryFrom ||
    filterEntryTo ||
    filterGradFrom ||
    filterGradTo ||
    filterProvince ||
    filterCity ||
    filterKecamatan ||
    filterDesa
  );

  const handleResetFilters = () => {
    setFilterEntryFrom('');
    setFilterEntryTo('');
    setFilterGradFrom('');
    setFilterGradTo('');
    setFilterProvince('');
    setFilterCity('');
    setFilterKecamatan('');
    setFilterDesa('');
  };

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [detailAlumni, setDetailAlumni] = useState<AlumniRecord | null>(null);
  const [isDistributionMapOpen, setIsDistributionMapOpen] = useState(false);
  const [fullscreenPosterUrl, setFullscreenPosterUrl] = useState<string | null>(null);

  // Fullscreen Instagram-style Event Creator state
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventAgenda | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const eventDateInputRef = useRef<HTMLInputElement>(null);
  const [eventTime, setEventTime] = useState('08.00 - 15.00 WIB');
  const [isTimePickerSheetOpen, setIsTimePickerSheetOpen] = useState(false);
  const [startHour, setStartHour] = useState('08');
  const [startMinute, setStartMinute] = useState('00');
  const [endHour, setEndHour] = useState('15');
  const [endMinute, setEndMinute] = useState('00');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventPosterUrl, setEventPosterUrl] = useState<string>(posterReuniImg);
  const [showDraftConfirmModal, setShowDraftConfirmModal] = useState(false);
  const [agendaDraft, setAgendaDraft] = useState<{
    title: string;
    date: string;
    time: string;
    location: string;
    desc: string;
    posterUrl: string;
  } | null>(null);

  const posterFileInputRef = useRef<HTMLInputElement | null>(null);

  // Password modal state for Admin Profile (2 Kolom: Kata Sandi Baru & Konfirmasi)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Counts for status labels
  const activeCount = alumniList.filter((item) => item.hasLoggedIn === true || item.isPasswordChanged === true).length;
  const inactiveCount = alumniList.filter((item) => !item.hasLoggedIn && !item.isPasswordChanged).length;

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Filtered alumni list
  const filteredList = alumniList.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(q) ||
      item.nik.includes(q) ||
      item.nis.toLowerCase().includes(q) ||
      item.city.toLowerCase().includes(q) ||
      item.province.toLowerCase().includes(q) ||
      (item.kecamatan && item.kecamatan.toLowerCase().includes(q)) ||
      (item.desa && item.desa.toLowerCase().includes(q)) ||
      item.occupation.toLowerCase().includes(q);

    // Filter status aktif/tidak aktif: Aktif = NIK pernah login
    const isAlumniActive = item.hasLoggedIn === true || item.isPasswordChanged === true;
    const matchStatus =
      statusFilter === 'semua'
        ? true
        : statusFilter === 'aktif'
        ? isAlumniActive
        : !isAlumniActive;

    const entryNum = parseInt(item.entryYear, 10);
    const gradNum = parseInt(item.gradYear, 10);

    const matchEntryFrom = !filterEntryFrom || (!isNaN(entryNum) && entryNum >= parseInt(filterEntryFrom, 10));
    const matchEntryTo = !filterEntryTo || (!isNaN(entryNum) && entryNum <= parseInt(filterEntryTo, 10));

    const matchGradFrom = !filterGradFrom || (!isNaN(gradNum) && gradNum >= parseInt(filterGradFrom, 10));
    const matchGradTo = !filterGradTo || (!isNaN(gradNum) && gradNum <= parseInt(filterGradTo, 10));

    const normalizePlace = (val: string) => val.toLowerCase().replace(/^(kota|kabupaten|kab\.)\s+/i, '').trim();

    const matchProvince = !filterProvince || 
      item.province.toLowerCase().includes(filterProvince.toLowerCase()) ||
      filterProvince.toLowerCase().includes(item.province.toLowerCase());

    const matchCity = !filterCity || 
      item.city.toLowerCase().includes(normalizePlace(filterCity)) ||
      normalizePlace(filterCity).includes(item.city.toLowerCase()) ||
      item.city.toLowerCase().includes(filterCity.toLowerCase());

    const matchKecamatan = !filterKecamatan || 
      (Boolean(item.kecamatan) && (
        item.kecamatan!.toLowerCase().includes(filterKecamatan.toLowerCase()) ||
        filterKecamatan.toLowerCase().includes(item.kecamatan!.toLowerCase())
      ));

    const matchDesa = !filterDesa 
      ? true 
      : item.shareFullAddress === false 
        ? false 
        : (Boolean(item.desa) && (
            item.desa!.toLowerCase().includes(filterDesa.toLowerCase()) ||
            filterDesa.toLowerCase().includes(item.desa!.toLowerCase())
          ));

    return (
      matchSearch &&
      matchStatus &&
      matchEntryFrom &&
      matchEntryTo &&
      matchGradFrom &&
      matchGradTo &&
      matchProvince &&
      matchCity &&
      matchKecamatan &&
      matchDesa
    );
  });

  const handleOpenAddEvent = () => {
    setEditingEvent(null);
    if (agendaDraft) {
      setEventTitle(agendaDraft.title);
      setEventDate(agendaDraft.date);
      setEventTime(agendaDraft.time);
      setEventLocation(agendaDraft.location);
      setEventDesc(agendaDraft.desc);
      setEventPosterUrl(agendaDraft.posterUrl || posterReuniImg);
    } else {
      setEventTitle('');
      setEventDate('20 Oktober 2026');
      setEventTime('08.00 - 15.00 WIB');
      setEventLocation('Aula Utama Ponpes At-taroqqy');
      setEventDesc('');
      setEventPosterUrl(posterReuniImg);
    }
    setIsAddEventOpen(true);
  };

  const handleOpenEditEvent = (ev: EventAgenda) => {
    setEditingEvent(ev);
    setEventTitle(ev.title);
    setEventDate(ev.date);
    setEventTime(ev.time || '08.00 - 15.00 WIB');
    setEventLocation(ev.location);
    setEventDesc(ev.description || '');
    setEventPosterUrl(ev.posterUrl || posterReuniImg);
    setIsAddEventOpen(true);
  };

  const handlePosterFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setEventPosterUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBackAttempt = () => {
    const isDirty = Boolean(
      eventTitle.trim() ||
      eventDesc.trim() ||
      (eventLocation && eventLocation !== 'Aula Utama Ponpes At-taroqqy') ||
      (eventPosterUrl && eventPosterUrl !== posterReuniImg)
    );

    if (isDirty) {
      setShowDraftConfirmModal(true);
    } else {
      setIsAddEventOpen(false);
    }
  };

  const handleSaveDraft = () => {
    setAgendaDraft({
      title: eventTitle,
      date: eventDate,
      time: eventTime,
      location: eventLocation,
      desc: eventDesc,
      posterUrl: eventPosterUrl,
    });
    setShowDraftConfirmModal(false);
    setIsAddEventOpen(false);
    triggerToast('Draf agenda tersimpan');
  };

  const handleDiscardDraft = () => {
    setAgendaDraft(null);
    setShowDraftConfirmModal(false);
    setIsAddEventOpen(false);
    triggerToast('Perubahan dibuang');
  };

  const handlePublish = () => {
    if (!eventTitle.trim()) {
      triggerToast('Masukkan nama agenda');
      return;
    }

    if (editingEvent) {
      const updated: EventAgenda = {
        ...editingEvent,
        title: eventTitle.trim(),
        date: eventDate.trim() || '20 Oktober 2026',
        time: eventTime.trim() || '08.00 - 15.00 WIB',
        location: eventLocation.trim() || 'Aula Utama Ponpes At-taroqqy',
        description: eventDesc.trim(),
        posterUrl: eventPosterUrl || posterReuniImg,
      };
      setEventList((prev) => prev.map((ev) => (ev.id === editingEvent.id ? updated : ev)));
      triggerToast('Perubahan agenda dibagikan');
    } else {
      const created: EventAgenda = {
        id: 'ev-' + Date.now(),
        title: eventTitle.trim(),
        date: eventDate.trim() || '20 Oktober 2026',
        time: eventTime.trim() || '08.00 - 15.00 WIB',
        location: eventLocation.trim() || 'Aula Utama Ponpes At-taroqqy',
        category: 'reuni',
        description: eventDesc.trim() || 'Agenda pertemuan silaturahmi alumni pondok pesantren.',
        attendeesCount: 0,
        notAttendingCount: 0,
        uncertainCount: 0,
        authorName: 'Admin Humas & Alumni Pondok',
        authorHandle: 'attaroqqy_official',
        postedAt: 'Baru saja',
        posterUrl: eventPosterUrl || posterReuniImg,
      };
      onAddEvent(created);
      setEventList((prev) => [created, ...prev]);
      setAgendaDraft(null);
      triggerToast('Agenda berhasil dibagikan');
    }

    setIsAddEventOpen(false);
  };

  const handleSaveAdminPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!newAdminPassword.trim()) {
      setPasswordError('Silakan masukkan kata sandi baru.');
      return;
    }

    if (newAdminPassword.length < 4) {
      setPasswordError('Kata sandi minimal 4 karakter.');
      return;
    }

    if (newAdminPassword !== confirmAdminPassword) {
      setPasswordError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setAdminUser((prev) => ({ ...prev, password: newAdminPassword }));
    onUpdateAdmin?.({ password: newAdminPassword });
    setIsPasswordModalOpen(false);
    setNewAdminPassword('');
    setConfirmAdminPassword('');
    triggerToast('Kata sandi admin berhasil diperbarui');
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#f0f2fb] overflow-hidden select-none relative font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white text-xs font-medium px-4 py-2 rounded-full shadow-2xl border border-white/20 backdrop-blur-md animate-in fade-in flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= BODY TAB CONTAINER (HEADER DIHAPUS DI SEMUA TAB TERMASUK PROFIL) ================= */}
      <div className="flex-1 overflow-y-auto flex flex-col relative">
        {/* ================= TAB 1: AGENDA (BERSIH TANPA HEADER) ================= */}
        {activeTab === 'agenda' && (
          <div className="flex-1 overflow-y-auto px-4 py-3 max-w-lg mx-auto w-full flex flex-col pb-28">
            {/* 2-Tab Segment Switcher: Kelola Agenda vs Presensi */}
            <div className="flex items-center justify-center p-1 bg-slate-200/90 rounded-2xl w-full mb-4 shrink-0 shadow-inner">
              <button
                type="button"
                onClick={() => setAgendaSubTab('kelola')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  agendaSubTab === 'kelola'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kelola Agenda
              </button>
              <button
                type="button"
                onClick={() => setAgendaSubTab('presensi')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  agendaSubTab === 'presensi'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Presensi
              </button>
            </div>

            {/* SUB-TAB 1: KELOLA AGENDA */}
            {agendaSubTab === 'kelola' && (
              <div className="space-y-5">
                {eventList.map((ev) => (
                  <div
                    key={ev.id}
                    className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden"
                  >
                    {/* 1. HEADER KARTU EVENT: PROFIL ADMIN PONDOK + AKSI */}
                    <div className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          <img
                            src={logoPonpesImg}
                            alt="Admin Humas"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-display font-bold text-xs sm:text-sm text-slate-900 truncate leading-tight">
                            {ev.authorName || 'Admin Humas & Alumni Pondok'}
                          </h4>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {ev.postedAt || '2 jam yang lalu'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setActiveMenuEvent(ev)}
                          className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                          title="Menu Opsi Agenda"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* 2. POSTER MEDIA */}
                    <div
                      onClick={() => setFullscreenPosterUrl(ev.posterUrl || posterReuniImg)}
                      className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-slate-950 overflow-hidden cursor-pointer select-none"
                      title="Ketuk untuk melihat poster layar penuh"
                    >
                      <img
                        src={ev.posterUrl || posterReuniImg}
                        alt={ev.title}
                        className="w-full h-full object-cover hover:scale-[1.01] transition-transform duration-200"
                      />
                    </div>

                    {/* 3. BARIS KETERANGAN KEHADIRAN (KETERANGAN KEHADIRAN DI KIRI, TOMBOL BUAT PRESENSI DI KANAN) */}
                    <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100 bg-white text-xs select-none gap-2">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px] sm:text-xs">
                          Hadir: {ev.attendeesCount || 0}
                        </span>
                        <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full text-[11px] sm:text-xs">
                          Tidak: {ev.notAttendingCount || 0}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setInitialEventForCreateAttendance(ev);
                          setIsCreateAttendanceModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
                        title="Buat Sesi Presensi dari Agenda Ini"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Buat Presensi</span>
                      </button>
                    </div>

                    {/* 4. CAPTION & DETAIL INFORMASI ACARA */}
                    <div className="px-4 py-3 space-y-2.5 text-xs">
                      <div className="text-slate-800 text-xs">
                        <p 
                          onClick={() => toggleCaption(ev.id)}
                          className={`leading-relaxed cursor-pointer select-none ${expandedCaptions[ev.id] ? '' : 'line-clamp-2'}`}
                          title={expandedCaptions[ev.id] ? "Klik untuk menyembunyikan" : "Klik untuk membaca selengkapnya"}
                        >
                          <span className="font-bold text-slate-900 mr-1.5 font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
                            @{ev.authorHandle || 'attaroqqy_official'}
                          </span>
                          <span className="font-bold text-slate-900 mr-1">{ev.title}</span>
                          <span className="text-slate-600">{ev.description}</span>
                        </p>

                        {!expandedCaptions[ev.id] && (
                          <button
                            type="button"
                            onClick={() => toggleCaption(ev.id)}
                            className="text-slate-400 hover:text-slate-600 text-xs font-normal mt-0.5 cursor-pointer block select-none"
                          >
                            selengkapnya
                          </button>
                        )}
                        {expandedCaptions[ev.id] && (
                          <button
                            type="button"
                            onClick={() => toggleCaption(ev.id)}
                            className="text-slate-400 hover:text-slate-600 text-[11px] font-normal mt-1 cursor-pointer block select-none"
                          >
                            sembunyikan
                          </button>
                        )}
                      </div>

                      {expandedCaptions[ev.id] && (
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-slate-700 text-xs mt-2 animate-in fade-in duration-150">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-sky-600 shrink-0" />
                            <span className="text-slate-500 font-medium">Tanggal:</span>
                            <span className="font-semibold text-slate-800">{ev.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                            <span className="text-slate-500 font-medium">Waktu:</span>
                            <span className="font-semibold text-slate-800">{ev.time}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <span className="text-slate-500 font-medium">Tempat:</span>
                            <span className="text-slate-700 leading-tight font-medium">{ev.location}</span>
                          </div>
                        </div>
                      )}

                      {/* Link Keterangan Jumlah Orang yang Sudah Memberi Tanggapan */}
                      <div className="pt-0.5">
                        <button
                          type="button"
                          onClick={() => setActiveCommentsModalEvent(ev)}
                          className="text-slate-400 hover:text-slate-600 text-xs font-normal cursor-pointer select-none text-left"
                        >
                          Lihat semua {((ev.attendeesCount || 0) + (ev.notAttendingCount || 0)) || commentsList.filter(c => c.eventId === ev.id).length || 0} tanggapan
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {eventList.length === 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center text-slate-500 text-xs">
                    Belum ada agenda kegiatan yang ditambahkan.
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 2: PRESENSI BERSIH */}
            {agendaSubTab === 'presensi' && (
              <div className="space-y-2.5">
                {attendanceSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => setActiveAttendanceSession(session)}
                    className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:border-sky-300 hover:shadow-xs transition-all cursor-pointer flex flex-col gap-2.5 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h5 className="font-bold text-sm text-slate-900 leading-snug group-hover:text-sky-600 transition-colors">
                          {session.title}
                        </h5>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                          {session.date}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSessionToDelete(session);
                        }}
                        className="w-8 h-8 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        title="Hapus Sesi Presensi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600 font-medium">
                      <span>{session.attendees.length} orang hadir</span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                ))}

                {attendanceSessions.length === 0 && (
                  <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 text-center flex flex-col items-center gap-3 shadow-2xs">
                    <div className="w-14 h-14 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                      <QrCode className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">
                        Belum Ada Sesi Presensi
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                        Ketuk tombol melayang <strong>+</strong> di kanan bawah untuk membuat presensi baru (bisa impor dari agenda atau buat presensi mandiri).
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: KELOLA ALUMNI (BERSIH TANPA HEADER) ================= */}
        {activeTab === 'alumni' && (
          <div className="flex-1 overflow-y-auto px-4 py-4 max-w-2xl mx-auto w-full space-y-3 pb-28">
            {/* Search & Filter Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari NIK, NIS, nama, atau domisili..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-600 focus:outline-none shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                    title="Hapus pencarian"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsFilterSheetOpen(true)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                  hasActiveFilters
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
                title="Buka Filter Data"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Label Status: Semua, Aktif, Tidak Aktif (Aktif = NIK pernah login) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              <button
                type="button"
                onClick={() => setStatusFilter('semua')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  statusFilter === 'semua'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Semua ({alumniList.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('aktif')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  statusFilter === 'aktif'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${statusFilter === 'aktif' ? 'bg-white' : 'bg-emerald-500'}`} />
                Aktif ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('tidak_aktif')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  statusFilter === 'tidak_aktif'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${statusFilter === 'tidak_aktif' ? 'bg-white' : 'bg-slate-400'}`} />
                Tidak Aktif ({inactiveCount})
              </button>
            </div>

            {/* Filter Active Indicator & Quick Reset */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between text-[11px] text-sky-800 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-100">
                <span>Filter aktif diterapkan ({filteredList.length} alumni)</span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="font-bold underline text-sky-700 hover:text-sky-900 cursor-pointer"
                >
                  Reset Filter
                </button>
              </div>
            )}

            {/* Daftar Kartu Alumni */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredList.slice(0, visibleCount).map((item) => {
                const addressText = item.shareFullAddress === false
                  ? [item.kecamatan, item.city].filter(Boolean).join(', ') || item.city || item.province || 'Alamat disembunyikan'
                  : [item.desa, item.kecamatan, item.city].filter(Boolean).join(', ') || item.province || 'Alamat belum diisi';

                const isItemActive = item.hasLoggedIn === true || item.isPasswordChanged === true;
                const age = calculateAge(item.tanggalLahir);

                return (
                  <div
                    key={item.id}
                    onClick={() => setDetailAlumni(item)}
                    className="bg-white rounded-2xl p-3.5 border border-slate-200/80 hover:border-sky-400 hover:shadow-md transition-all cursor-pointer flex items-center gap-3.5 group relative"
                  >
                    <div className="relative shrink-0">
                      {item.photoUrl ? (
                        <img
                          src={item.photoUrl}
                          alt={item.name}
                          className={`w-12 h-12 rounded-full object-cover border-2 transition-all ${
                            item.gender === 'P'
                              ? 'border-pink-300 ring-2 ring-pink-100 group-hover:ring-pink-200'
                              : 'border-sky-300 ring-2 ring-sky-100 group-hover:ring-sky-200'
                          }`}
                        />
                      ) : (
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-base shadow-2xs border-2 transition-all ${
                            item.gender === 'P'
                              ? 'border-pink-300 ring-2 ring-pink-100 bg-pink-50 text-pink-600'
                              : 'border-sky-300 ring-2 ring-sky-100 bg-sky-50 text-sky-700'
                          }`}
                        >
                          {item.name.charAt(0)}
                        </div>
                      )}

                      {/* Lingkaran di sisi kiri bawah foto berupa umurnya saat ini */}
                      {age !== null && (
                        <span
                          className={`absolute -bottom-1 -left-1 px-1 min-w-[18px] h-[18px] rounded-full text-white font-mono font-bold text-[9px] flex items-center justify-center border border-white shadow-xs z-10 ${
                            item.gender === 'P' ? 'bg-pink-600' : 'bg-sky-700'
                          }`}
                          title={`Usia: ${age} tahun`}
                        >
                          {age}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-display font-bold text-sm text-slate-900 group-hover:text-sky-700 transition-colors truncate">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
                        {item.gradYear && (
                          <span className="font-medium text-slate-600 shrink-0">
                            Boyong {item.gradYear}
                          </span>
                        )}
                        {item.gradYear && addressText && (
                          <span className="text-slate-300">•</span>
                        )}
                        <p className="truncate capitalize text-slate-500">
                          {addressText}
                        </p>
                      </div>
                    </div>

                    {/* Di sebelah kiri icon > : lingkaran hijau / lingkaran mati */}
                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isItemActive
                            ? 'bg-emerald-500 ring-2 ring-emerald-100 shadow-xs'
                            : 'bg-slate-300 ring-1 ring-slate-200'
                        }`}
                        title={isItemActive ? 'Aktif' : 'Tidak Aktif'}
                      />
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredList.length > visibleCount && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 60)}
                  className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-sky-700 font-bold text-xs rounded-2xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Muat Lebih Banyak ({visibleCount} dari {filteredList.length} alumni)</span>
                </button>
              </div>
            )}

            {filteredList.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
                Tidak ditemukan data alumni dengan filter atau pencarian yang dipilih.
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: PENGUMUMAN & MAKLUMAT ADMIN ================= */}
        {activeTab === 'pengumuman' && (
          <AdminAnnouncementsTab
            announcements={announcementList}
            adminUser={adminUser}
            onAddAnnouncement={handleAddAnnouncement}
            onUpdateAnnouncement={handleUpdateAnnouncement}
            onDeleteAnnouncement={handleDeleteAnnouncement}
            triggerToast={triggerToast}
          />
        )}

        {/* ================= TAB 4: PROFIL ADMIN ================= */}
        {activeTab === 'profile' && (
          <div className="bg-[#f0f2fb] min-h-full flex flex-col animate-in fade-in duration-150">
            {/* FOTO SAMPUL / COVER PHOTO - UKURAN PENUH SAMA DENGAN AKUN BIASA */}
            <div 
              onClick={() => setIsCoverBottomSheetOpen(true)}
              className="relative w-full h-52 sm:h-60 overflow-hidden cursor-pointer group select-none shrink-0 bg-[#0369a1]"
              title="Klik foto sampul untuk opsi foto"
            >
              {adminUser.coverPhotoUrl ? (
                <img
                  src={adminUser.coverPhotoUrl}
                  alt="Foto Sampul Admin"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div 
                  className="w-full h-full relative overflow-hidden transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 60%, #075985 100%)',
                  }}
                >
                  <div className="absolute inset-0 droplet-pattern opacity-15 pointer-events-none" />
                  <div className="absolute -top-10 -right-10 w-44 h-44 bg-sky-300/25 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-amber-300/20 rounded-full blur-xl pointer-events-none" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/35 pointer-events-none" />

              {/* Badge Ikon Kamera Foto Sampul (di sebelah kanan) */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsCoverBottomSheetOpen(true);
                }}
                className="absolute bottom-14 right-4 bg-black/60 hover:bg-black/80 active:scale-95 backdrop-blur-md border border-white/25 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg transition-all cursor-pointer z-30 pointer-events-auto select-none"
              >
                <Camera className="w-3.5 h-3.5 text-white" />
                <span>{adminUser.coverPhotoUrl ? 'Foto Sampul' : 'Upload Sampul'}</span>
              </button>
            </div>

            {/* Input File Tersembunyi untuk Foto Sampul */}
            <input
              ref={coverFileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleCoverPhotoSelect}
              className="hidden"
            />

            {/* WADAH KARTU PUTIH MELENGKUNG */}
            <div className="bg-white rounded-t-[36px] shadow-sm px-6 pt-0 pb-24 space-y-6 flex-1 border-t border-slate-200/40 relative z-20 -mt-10 sm:-mt-12 max-w-2xl mx-auto w-full">
              {/* Lingkaran Avatar tepat di perbatasan foto sampul */}
              <div className="text-center flex flex-col items-center relative -top-11 -mb-7">
                <div className="relative inline-block mb-1.5">
                  <button
                    type="button"
                    onClick={() => setShowFullscreenAvatar(true)}
                    className="w-22 h-22 sm:w-24 sm:h-24 rounded-full ring-4 ring-white shadow-lg overflow-hidden bg-slate-200 flex items-center justify-center cursor-pointer group transition-transform active:scale-95"
                    title="Lihat foto profil penuh"
                  >
                    {adminUser.avatar ? (
                      <img
                        src={adminUser.avatar}
                        alt={adminUser.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-sky-600 to-indigo-700 text-white font-bold text-3xl flex items-center justify-center">
                        {adminUser.name.charAt(0)}
                      </div>
                    )}
                  </button>

                  {/* Badge Pensil Edit di Sudut Kanan Bawah Avatar */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      avatarFileInputRef.current?.click();
                    }}
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white shadow-md border border-slate-200/80 text-slate-700 hover:text-sky-600 flex items-center justify-center cursor-pointer active:scale-90 transition-all ring-2 ring-white"
                    title="Ganti Foto Profil"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <input
                    ref={avatarFileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleAvatarSelect}
                    className="hidden"
                  />
                </div>

                <div className="mt-1">
                  <h3 className="font-display font-extrabold text-lg text-slate-900 leading-tight">
                    {adminUser.name}
                  </h3>
                  {/* USERNAME ADMIN */}
                  <p className="text-xs text-sky-700 font-semibold mt-0.5 flex items-center justify-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-sky-600" />
                    <span>{adminUser.username.startsWith('@') ? adminUser.username : '@' + adminUser.username}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {adminUser.jabatan || 'Pengurus Pondok'}
                  </p>
                  <span className="inline-block mt-1 text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-3 py-0.5 rounded-full">
                    Administrator Portal
                  </span>
                </div>
              </div>

              {/* CARD LEBIH RINGKAS: KOLOM NAMA LENGKAP, USERNAME, GANTI KATA SANDI, LOGOUT */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200/90 divide-y divide-slate-100 shadow-2xs overflow-hidden">
                  {/* 1. Kolom Nama Lengkap (Saat diklik munculkan modal edit nama lengkap) */}
                  <div
                    onClick={() => {
                      setEditAdminName(adminUser.name);
                      setIsEditNameModalOpen(true);
                    }}
                    className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-slate-400">Nama Lengkap</p>
                        <p className="text-xs font-bold text-slate-800 truncate">{adminUser.name}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
                  </div>

                  {/* 2. Kolom Username */}
                  <div
                    onClick={() => {
                      setEditAdminUsername(adminUser.username || '@admin_pusat');
                      setIsEditUsernameModalOpen(true);
                    }}
                    className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-slate-400">Username</p>
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {adminUser.username.startsWith('@') ? adminUser.username : '@' + adminUser.username}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
                  </div>

                  {/* 3. Kolom Ganti Kata Sandi (Saat diklik munculkan modal dengan 2 kolom input) */}
                  <div
                    onClick={() => {
                      setNewAdminPassword('');
                      setConfirmAdminPassword('');
                      setPasswordError(null);
                      setIsPasswordModalOpen(true);
                    }}
                    className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800">Ganti Kata Sandi</p>
                        <p className="text-[11px] text-slate-400">Perbarui kata sandi akun admin</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
                  </div>

                  {/* 4. Keluar dari Akun */}
                  <div
                    onClick={onLogout}
                    className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-rose-50/70 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <LogOut className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-rose-600">Keluar dari Akun</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= TOMBOL MELAYANG DI POJOK KANAN BAWAH ================= */}
      {/* 1. Tombol Melayang Khusus Tab Agenda: Tambah Agenda (di Kelola) atau Buat Presensi (di Presensi) */}
      {activeTab === 'agenda' && (
        agendaSubTab === 'kelola' ? (
          <button
            type="button"
            onClick={handleOpenAddEvent}
            className="fixed bottom-20 right-5 z-40 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-sky-600 hover:bg-sky-700 text-white shadow-2xl flex items-center justify-center cursor-pointer transition-all active:scale-95 group"
            title="Tambah Agenda Baru"
          >
            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setInitialEventForCreateAttendance(null);
              setIsCreateAttendanceModalOpen(true);
            }}
            className="fixed bottom-20 right-5 z-40 w-14 h-14 rounded-full bg-sky-600 hover:bg-sky-700 text-white shadow-2xl flex items-center justify-center cursor-pointer transition-all active:scale-95 group"
            title="Buat Sesi Presensi Baru"
          >
            <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-200" />
          </button>
        )
      )}

      {/* 2. Dua Tombol Melayang (Khusus Tab Kelola Alumni): Sebaran Alumni (Hanya Icon) & Tambah Alumni */}
      {activeTab === 'alumni' && (
        <div className="fixed bottom-20 right-5 z-40 flex flex-col items-end gap-3 pointer-events-auto">
          {/* Tombol Sebaran Alumni (Hanya Icon) */}
          <button
            type="button"
            onClick={() => setIsDistributionMapOpen(true)}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xl flex items-center justify-center cursor-pointer transition-all active:scale-95 group"
            title="Peta Sebaran Alumni"
          >
            <Map className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
          </button>

          {/* Tombol Tambah Alumni */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-sky-600 hover:bg-sky-700 text-white shadow-2xl flex items-center justify-center cursor-pointer transition-all active:scale-95 group"
            title="Tambah Alumni Baru"
          >
            <UserPlus className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
          </button>
        </div>
      )}

      {/* ================= DOCKER / BOTTOM NAVIGATION (KELOLA ALUMNI, AGENDA, PENGUMUMAN, PROFIL ADMIN) ================= */}
      <div className="bg-white border-t border-slate-200 px-4 py-2 flex items-center justify-around shrink-0 select-none z-30 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('alumni')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'alumni' ? 'text-[#0284c7] font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">Kelola Alumni</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('agenda')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'agenda' ? 'text-[#0284c7] font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">Agenda</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pengumuman')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'pengumuman' ? 'text-[#0284c7] font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Megaphone className="w-5 h-5" />
          <span className="text-[10px]">Pengumuman</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'profile' ? 'text-[#0284c7] font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">Profil Admin</span>
        </button>
      </div>

      {/* ================= MODAL TAMBAH ALUMNI BARU ================= */}
      {isAddModalOpen && (
        <AddAlumniModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={(data) => {
            onAddAlumni(data);
            triggerToast('Data alumni berhasil ditambahkan');
          }}
        />
      )}

      {/* ================= MODAL DETAIL BIODATA ALUMNI (PERSIS EDIT PROFIL USER) ================= */}
      {detailAlumni && (
        <AlumniDetailAdminModal
          isOpen={Boolean(detailAlumni)}
          alumni={detailAlumni}
          onClose={() => setDetailAlumni(null)}
          onResetPassword={(id) => {
            onResetPassword(id);
            triggerToast('Kata sandi berhasil di-reset ke: 1234');
          }}
          onSave={(id, updated) => {
            onUpdateAlumni(id, updated);
            setDetailAlumni((prev) => (prev ? { ...prev, ...updated } : null));
            triggerToast('Perubahan data alumni berhasil disimpan');
          }}
        />
      )}

      {/* ================= MODAL PETA SEBARAN ALUMNI ================= */}
      {isDistributionMapOpen && (
        <AlumniDistributionMapModal
          isOpen={isDistributionMapOpen}
          onClose={() => setIsDistributionMapOpen(false)}
          alumniList={alumniList}
          isAdmin={true}
          onSelectAlumni={(selected) => setDetailAlumni(selected)}
          onUpdateProfile={(updated) => {
            if (detailAlumni) {
              onUpdateAlumni(detailAlumni.id, updated);
            }
          }}
        />
      )}

      {/* ================= MODAL TANGGAPAN / KOMENTAR AGENDA (PERSIS AKUN BIASA) ================= */}
      {activeCommentsModalEvent && (
        <EventCommentsModal
          event={activeCommentsModalEvent}
          comments={commentsList}
          currentUser={{
            name: admin.name,
            photoUrl: admin.avatar,
          }}
          onClose={() => setActiveCommentsModalEvent(null)}
          onAddComment={handleAddComment}
          onToggleLike={handleToggleLikeComment}
        />
      )}

      {/* ================= MODAL FULLSCREEN PRESENSI KAMERA & DAFTAR KEHADIRAN ================= */}
      {isScannerOpen && selectedEventForAttendance && (
        <EventAttendanceScannerModal
          isOpen={isScannerOpen}
          event={selectedEventForAttendance}
          alumniList={alumniList}
          onClose={() => {
            setIsScannerOpen(false);
            setSelectedEventForAttendance(null);
          }}
          onUpdateEventAttendees={(eventId, newCount) => {
            setEventList((prev) =>
              prev.map((e) => (e.id === eventId ? { ...e, attendeesCount: newCount } : e))
            );
          }}
        />
      )}

      {/* ================= FULLSCREEN POSTER PREVIEW ================= */}
      {fullscreenPosterUrl && (
        <CleanMediaPreviewModal
          isOpen={Boolean(fullscreenPosterUrl)}
          imageUrl={fullscreenPosterUrl}
          onClose={() => setFullscreenPosterUrl(null)}
        />
      )}

      {/* ================= MODAL EDIT NAMA LENGKAP ADMIN ================= */}
      {isEditNameModalOpen && (
        <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-base text-slate-900">
                  Edit Nama Lengkap
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditNameModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdminName} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap & Gelar
                </label>
                <input
                  type="text"
                  required
                  value={editAdminName}
                  onChange={(e) => setEditAdminName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:bg-white"
                  placeholder="Contoh: Ust. H. Abdurrahman, M.Pd."
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditNameModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-sky-600/20"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL EDIT USERNAME ADMIN ================= */}
      {isEditUsernameModalOpen && (
        <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-base text-slate-900">
                  Edit Username Admin
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditUsernameModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdminUsername} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Username Akun Admin
                </label>
                <input
                  type="text"
                  required
                  value={editAdminUsername}
                  onChange={(e) => setEditAdminUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:bg-white"
                  placeholder="Contoh: @admin_pusat"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Username digunakan untuk masuk (login) ke portal admin.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditUsernameModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-sky-600/20"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= FULLSCREEN POSTINGAN AGENDA ALA INSTAGRAM ================= */}
      {isAddEventOpen && (
        <div className="fixed inset-0 z-[100010] bg-white flex flex-col animate-in fade-in duration-150 select-none">
          {/* Header Instagram Post Bar */}
          <div className="px-4 py-3 border-b border-slate-200/90 flex items-center justify-between shrink-0 bg-white">
            <button
              type="button"
              onClick={handleBackAttempt}
              className="p-1 -ml-1 text-slate-800 hover:text-slate-900 cursor-pointer transition-transform active:scale-90"
              title="Kembali"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h3 className="font-bold text-base text-slate-900">
              {editingEvent ? 'Edit Agenda' : 'Agenda Baru'}
            </h3>
            <button
              type="button"
              onClick={handlePublish}
              className="text-sky-600 hover:text-sky-700 font-bold text-sm px-2 py-1 cursor-pointer active:scale-95 transition-all"
            >
              Bagikan
            </button>
          </div>

          {/* Form Body - Fokus Postingan */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-lg mx-auto w-full pb-16">
              {/* Media Preview Aspect 4:3 / 16:9 */}
              <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-slate-900 overflow-hidden select-none">
                <img
                  src={eventPosterUrl || posterReuniImg}
                  alt="Poster Agenda"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => posterFileInputRef.current?.click()}
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all"
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                  <span>Ganti Gambar</span>
                </button>
                <input
                  ref={posterFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePosterFileSelect}
                  className="hidden"
                />
              </div>

              {/* Caption & Field Detail */}
              <div className="p-4 space-y-4">
                {/* Author Info */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-sky-100 border border-slate-200 shrink-0">
                    <img src={logoPonpesImg} alt="Logo" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 leading-tight">
                      Pondok Pesantren At-taroqqy
                    </p>
                    <p className="text-[11px] text-slate-400">@attaroqqy_official</p>
                  </div>
                </div>

                {/* Caption Input */}
                <textarea
                  rows={4}
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  placeholder="Tulis keterangan agenda..."
                  className="w-full text-sm text-slate-800 placeholder-slate-400 focus:outline-none resize-none leading-relaxed"
                />

                {/* Clean Field Inputs */}
                <div className="divide-y divide-slate-100 border-t border-b border-slate-100 py-1">
                  <div className="py-2.5 flex items-center gap-3">
                    <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder="Nama agenda kegiatan..."
                      className="w-full text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                  </div>

                  <div 
                    onClick={() => eventDateInputRef.current?.showPicker?.() || eventDateInputRef.current?.focus()}
                    className="py-2.5 flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Calendar className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors shrink-0" />
                      <span className={`text-xs truncate ${eventDate ? 'font-semibold text-slate-800' : 'text-slate-400'}`}>
                        {eventDate || 'Pilih tanggal kegiatan...'}
                      </span>
                    </div>
                    <input
                      ref={eventDateInputRef}
                      type="date"
                      className="sr-only"
                      value={parseIndonesianDateToIso(eventDate)}
                      onChange={(e) => {
                        if (e.target.value) {
                          setEventDate(formatToIndonesianDate(e.target.value));
                        }
                      }}
                    />
                  </div>

                  <div 
                    onClick={() => setIsTimePickerSheetOpen(true)}
                    className="py-2.5 flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Clock className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors shrink-0" />
                      <span className={`text-xs truncate ${eventTime ? 'font-semibold text-slate-800' : 'text-slate-400'}`}>
                        {eventTime || 'Pilih waktu kegiatan (jam menit)...'}
                      </span>
                    </div>
                  </div>

                  <div className="py-2.5 flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      placeholder="Lokasi kegiatan..."
                      className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= POPUP SIMPAN SEBAGAI DRAF ================= */}
      {showDraftConfirmModal && (
        <div 
          className="fixed inset-0 z-[100020] bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowDraftConfirmModal(false)}
        >
          <div 
            className="w-full max-w-xs bg-white rounded-3xl p-5 space-y-4 shadow-2xl text-center animate-in zoom-in-95 duration-150 border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="font-bold text-base text-slate-900 leading-tight">
                Simpan sebagai draf?
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Jika keluar sekarang, perubahan dapat disimpan sebagai draf atau dibuang.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-colors cursor-pointer active:scale-95 shadow-xs"
              >
                Simpan Draf
              </button>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs transition-colors cursor-pointer active:scale-95"
              >
                Buang Perubahan
              </button>
              <button
                type="button"
                onClick={() => setShowDraftConfirmModal(false)}
                className="w-full py-2 rounded-xl text-slate-500 hover:text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= BOTTOM SHEET WHEEL PICKER WAKTU ================= */}
      <TimeWheelPickerBottomSheet
        isOpen={isTimePickerSheetOpen}
        value={eventTime}
        onClose={() => setIsTimePickerSheetOpen(false)}
        onSelect={(range) => setEventTime(range)}
      />

      {/* ================= MODAL GANTI SANDI ADMIN (2 KOLOM: KATA SANDI BARU & KONFIRMASI) ================= */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 space-y-4 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Ganti Kata Sandi</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {passwordError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
                <span className="text-[11px] leading-tight font-medium">{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAdminPassword} className="space-y-3 text-xs">
              {/* KOLOM 1: KATA SANDI BARU */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kata Sandi Baru</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan kata sandi baru..."
                    value={newAdminPassword}
                    onChange={(e) => {
                      setNewAdminPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none text-xs text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* KOLOM 2: KONFIRMASI KATA SANDI */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Konfirmasi Kata Sandi</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Ulangi kata sandi baru..."
                    value={confirmAdminPassword}
                    onChange={(e) => {
                      setConfirmAdminPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none text-xs text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition-colors"
                >
                  Simpan Sandi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= BOTTOM SHEET PILIHAN FOTO SAMPUL ADMIN ================= */}
      {isCoverBottomSheetOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex flex-col justify-end animate-in fade-in"
          onClick={() => setIsCoverBottomSheetOpen(false)}
        >
          <div 
            className="w-full max-w-md mx-auto bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 flex flex-col animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mt-3 mb-1" />

            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Foto Sampul Profil</h3>
              <button 
                type="button" 
                onClick={() => setIsCoverBottomSheetOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-2">
              {!adminUser.coverPhotoUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsCoverBottomSheetOpen(false);
                    coverFileInputRef.current?.click();
                  }}
                  className="w-full flex items-center gap-3.5 py-3 px-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer text-left group"
                >
                  <div className="w-10 h-10 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <Upload className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-900 block">
                      Upload foto sampul
                    </span>
                    <span className="text-[11px] text-slate-400">Pilih gambar dari perangkat</span>
                  </div>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCoverBottomSheetOpen(false);
                      setShowFullscreenCover(true);
                    }}
                    className="w-full flex items-center gap-3.5 py-3 px-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer text-left group"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <ImageIcon className="w-5 h-5 text-slate-700" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-900 block">
                        Lihat foto sampul
                      </span>
                      <span className="text-[11px] text-slate-400">Tampilkan ukuran penuh</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCoverBottomSheetOpen(false);
                      coverFileInputRef.current?.click();
                    }}
                    className="w-full flex items-center gap-3.5 py-3 px-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer text-left group"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <Pencil className="w-5 h-5 text-slate-700" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-900 block">
                        Ubah foto sampul
                      </span>
                      <span className="text-[11px] text-slate-400">Ganti dengan gambar baru</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveCoverPhoto}
                    className="w-full flex items-center gap-3.5 py-3 px-3 rounded-2xl hover:bg-rose-50 transition-colors cursor-pointer text-left group"
                  >
                    <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <Trash2 className="w-5 h-5 text-rose-600" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-rose-600 block">
                        Hapus foto sampul
                      </span>
                      <span className="text-[11px] text-rose-400">Kembalikan ke tampilan default</span>
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN PREVIEW FOTO SAMPUL ADMIN */}
      {showFullscreenCover && (
        <CleanMediaPreviewModal
          isOpen={showFullscreenCover}
          imageUrl={adminUser.coverPhotoUrl || posterReuniImg}
          onClose={() => setShowFullscreenCover(false)}
        />
      )}

      {/* FULLSCREEN FOTO PROFIL ADMIN (DENGAN ZOOM, PAN & DELETE) */}
      {showFullscreenAvatar && (
        <FullscreenPhotoViewerModal
          photoUrl={adminUser.avatar}
          name={adminUser.name}
          onClose={() => setShowFullscreenAvatar(false)}
          onDelete={adminUser.avatar ? handleRemoveAvatar : undefined}
        />
      )}

      {/* ================= BOTTOM SHEET FILTER DATA ALUMNI ================= */}
      {isFilterSheetOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex flex-col justify-end animate-in fade-in"
          onClick={() => setIsFilterSheetOpen(false)}
        >
          <div 
            className="w-full max-w-lg mx-auto bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mt-3 mb-1" />

            <div className="px-5 py-3 flex items-center justify-between border-b border-slate-100 bg-white">
              <h3 className="font-bold text-sm text-slate-900">
                Filter Data
              </h3>
              <button
                type="button"
                onClick={() => setIsFilterSheetOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs overflow-y-auto">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Tahun Masuk
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Dari (contoh: 2012)"
                    value={filterEntryFrom}
                    onChange={(e) => setFilterEntryFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-600 focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Sampai (contoh: 2020)"
                    value={filterEntryTo}
                    onChange={(e) => setFilterEntryTo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Tahun Lulus
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Dari (contoh: 2016)"
                    value={filterGradFrom}
                    onChange={(e) => setFilterGradFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-600 focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Sampai (contoh: 2024)"
                    value={filterGradTo}
                    onChange={(e) => setFilterGradTo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">
                  Wilayah Domisili
                </label>
                <WilayahAddressFilter
                  province={filterProvince}
                  city={filterCity}
                  kecamatan={filterKecamatan}
                  desa={filterDesa}
                  showLocationTag={false}
                  showAlamatLengkap={false}
                  onChange={({ province, city, kecamatan, desa }) => {
                    setFilterProvince(province);
                    setFilterCity(city);
                    setFilterKecamatan(kecamatan);
                    setFilterDesa(desa);
                  }}
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsFilterSheetOpen(false)}
                className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer text-center shadow-xs"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= BOTTOM SHEET MENU AGENDA (TITIK 3: EDIT, BAGIKAN, UNDUH) ================= */}
      {activeMenuEvent && (
        <div 
          className="fixed inset-0 z-[100020] bg-black/60 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-150"
          onClick={() => setActiveMenuEvent(null)}
        >
          <div 
            className="bg-white rounded-t-3xl w-full max-w-lg p-5 pb-6 space-y-2 shadow-2xl border-t border-slate-200 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Drag Handle */}
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-2" />

            <div className="space-y-1">
              {/* 1. Edit */}
              <button
                type="button"
                onClick={() => {
                  const evToEdit = activeMenuEvent;
                  setActiveMenuEvent(null);
                  handleOpenEditEvent(evToEdit);
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-colors cursor-pointer text-left"
              >
                <Pencil className="w-5 h-5 text-slate-700 shrink-0" />
                <span>Edit</span>
              </button>

              {/* 2. Bagikan */}
              <button
                type="button"
                onClick={() => {
                  const evToShare = activeMenuEvent;
                  setActiveMenuEvent(null);
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(
                      `*${evToShare.title}*\nTanggal: ${evToShare.date}\nWaktu: ${evToShare.time}\nTempat: ${evToShare.location}\n\nInfo selengkapnya di Portal Alumni Ponpes At-Taroqqy: https://attaroqqy.com`
                    );
                  }
                  triggerToast('Tautan agenda disalin');
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-colors cursor-pointer text-left"
              >
                <Share2 className="w-5 h-5 text-slate-700 shrink-0" />
                <span>Bagikan</span>
              </button>

              {/* 3. Unduh */}
              <button
                type="button"
                onClick={() => {
                  const posterUrl = activeMenuEvent.posterUrl || posterReuniImg;
                  const link = document.createElement('a');
                  link.href = posterUrl;
                  link.download = `Poster_${activeMenuEvent.title.replace(/\s+/g, '_')}.jpg`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  setActiveMenuEvent(null);
                  triggerToast('Poster agenda diunduh');
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-colors cursor-pointer text-left"
              >
                <Download className="w-5 h-5 text-slate-700 shrink-0" />
                <span>Unduh</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI HAPUS SESI PRESENSI ================= */}
      {sessionToDelete && (
        <div 
          className="fixed inset-0 z-[100030] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSessionToDelete(null)}
        >
          <div 
            className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl border border-slate-100 flex flex-col gap-3 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-slate-900 leading-tight">
                  Hapus Sesi Presensi?
                </h4>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {sessionToDelete.title}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Seluruh rekapan data presensi yang sudah tercatat pada sesi ini akan ikut terhapus. Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSessionToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setAttendanceSessions((prev) => prev.filter((s) => s.id !== sessionToDelete.id));
                  setSessionToDelete(null);
                  triggerToast('Sesi presensi berhasil dihapus');
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-rose-600/20"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL BUAT SESI PRESENSI ================= */}
      {isCreateAttendanceModalOpen && (
        <CreateAttendanceModal
          isOpen={isCreateAttendanceModalOpen}
          onClose={() => {
            setIsCreateAttendanceModalOpen(false);
            setInitialEventForCreateAttendance(null);
          }}
          eventList={eventList}
          initialEvent={initialEventForCreateAttendance}
          onSave={handleSaveNewAttendanceSession}
        />
      )}

      {/* ================= HALAMAN PENUH BERSIH DAFTAR HADIR ================= */}
      {activeAttendanceSession && (
        <FullAttendanceViewModal
          session={activeAttendanceSession}
          alumniList={alumniList}
          onClose={() => setActiveAttendanceSession(null)}
          onUpdateSessionAttendees={handleUpdateSessionAttendees}
        />
      )}
    </div>
  );
};
