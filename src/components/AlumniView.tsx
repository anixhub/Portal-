import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Home,
  Bell,
  BookOpen,
  BookMarked,
  Scroll,
  Flame,
  LogOut, 
  Calendar, 
  Search, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  Share2, 
  Download, 
  QrCode, 
  CheckCircle2, 
  Lock, 
  UserCheck, 
  MapPin, 
  Briefcase, 
  Phone, 
  ShieldAlert, 
  RotateCw, 
  Edit3, 
  Save, 
  IdCard, 
  X, 
  MessageCircle, 
  Clock, 
  Image as ImageIcon, 
  ZoomIn,
  Camera,
  Trash2,
  Maximize2,
  User,
  Mail,
  CreditCard,
  FileText,
  Pencil,
  ScanFace,
  Coins,
  Glasses,
  Languages,
  Smartphone,
  KeyRound,
  Check,
  GraduationCap,
  Users,
  Heart,
  AtSign,
  FileCheck,
  Filter,
  Loader2,
  UserX,
  MoreHorizontal,
  Megaphone,
  CheckCircle,
  ArrowLeft,
  CheckCheck,
  Wallet,
  Navigation,
  Map,
  AlertCircle,
  Upload,
  Pin,
  Plus,
  Globe,
  MessageSquare,
  MoreVertical,
  Copy
} from 'lucide-react';
import { AlumniRecord, AdminUser, EventAgenda, AnnouncementItem, EventComment, EventCommentReply, NotificationItem, AudienceTarget } from '../types';
import { INITIAL_ANNOUNCEMENTS, INITIAL_EVENT_COMMENTS } from '../data/mockData';
import { WilayahAddressFilter } from './common/WilayahAddressFilter';
import { DateWheelPicker } from './common/DateWheelPicker';
import { LocationCoordinates } from './common/FullscreenLocationMapModal';
import { AlumniDetailAdminModal } from './admin/AlumniDetailAdminModal';
import { AlumniProfileCardModal } from './common/AlumniProfileCardModal';
import { EventCommentsModal } from './common/EventCommentsModal';
import { AlumniDistributionMapModal } from './common/AlumniDistributionMapModal';
import { CleanMediaPreviewModal } from './common/CleanMediaPreviewModal';
import { PostMediaCarousel } from './common/PostMediaCarousel';
import { formatAudienceSummary } from './common/AudienceTargetModal';
import { AlumniFinanceView } from './AlumniFinanceView';
import { formatAuthorUsername, resolveAuthorAlumniRecord } from '../utils/authorUtils';
import { shareMediaWithCaption } from '../utils/shareUtils';
import posterReuniImg from '../assets/images/poster_reuni_akbar_1790648045947.jpg';
import logoPonpesImg from '../assets/images/logo_ponpes_attaroqqy_1790648746461.jpg';
import bgMenuQuranImg from '../assets/images/bg_menu_alquran_1790822566925.jpg';
import bgMenuMajmuahImg from '../assets/images/bg_menu_majmuah_1790822579673.jpg';
import bgMenuMaulidImg from '../assets/images/bg_menu_maulid_1790822594019.jpg';
import bgMenuAurodImg from '../assets/images/bg_menu_aurod_1790822607881.jpg';

const matchesAudienceTarget = (target?: AudienceTarget, alumniUser?: AlumniRecord): boolean => {
  if (!target || !alumniUser) return true;

  // 1. Gender check
  if (target.gender && target.gender !== 'semua') {
    if (alumniUser.gender !== target.gender) {
      return false;
    }
  }

  // 2. Region check
  if (target.regionScope === 'khusus') {
    if (target.villageName) {
      const userDesa = (alumniUser.desa || '').toLowerCase();
      const targetDesa = target.villageName.toLowerCase();
      if (!userDesa.includes(targetDesa) && !targetDesa.includes(userDesa)) {
        return false;
      }
    } else if (target.districtName) {
      const userKec = (alumniUser.kecamatan || '').toLowerCase();
      const targetKec = target.districtName.toLowerCase();
      if (!userKec.includes(targetKec) && !targetKec.includes(userKec)) {
        return false;
      }
    } else if (target.regencyName) {
      const userCity = (alumniUser.city || '').toLowerCase();
      const targetReg = target.regencyName.toLowerCase();
      if (!userCity.includes(targetReg) && !targetReg.includes(userCity)) {
        return false;
      }
    } else if (target.provinceName) {
      const userProv = (alumniUser.province || '').toLowerCase();
      const targetProv = target.provinceName.toLowerCase();
      if (!userProv.includes(targetProv) && !targetProv.includes(userProv)) {
        return false;
      }
    }
  }

  return true;
};

interface AlumniViewProps {
  alumni: AlumniRecord;
  allAlumni: AlumniRecord[];
  events: EventAgenda[];
  announcements?: AnnouncementItem[];
  adminAccount?: AdminUser;
  onLogout: () => void;
  onUpdateProfile: (updated: Partial<AlumniRecord>) => void;
  onRsvpEvent: (eventId: string, rsvp: 'hadir' | 'belum_pasti' | 'tidak_hadir', note?: string) => void;
  onAddAnnouncement?: (newAnn: AnnouncementItem) => void;
}

type TabType = 'home' | 'events' | 'directory' | 'finance' | 'profile' | 'notifications' | 'announcements';

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'reply',
    title: 'Balasan Tanggapan Agenda',
    message: 'Ust. Fauzi Rahman membalas tanggapan Anda di agenda Reuni Akbar Ke-42: "InsyaAllah siap, nanti stan santri wilayah Malang disatukan di aula utama."',
    time: '25 mnt lalu',
    read: false,
    authorName: 'Ust. Fauzi Rahman',
    tag: 'Interaksi Balasan'
  },
  {
    id: 'notif-2',
    type: 'finance',
    title: 'Pembayaran Sukses Diverifikasi',
    message: 'Pembayaran pelunasan tunggakan infaq & syahriyah pondok sebesar Rp 250.000 telah sukses diverifikasi oleh bagian keuangan pondok.',
    time: '1 jam lalu',
    read: false,
    authorName: 'Bendahara Pondok',
    tag: 'Keuangan Sukses'
  },
  {
    id: 'notif-3',
    type: 'reply',
    title: 'Balasan Komentar Diskusi',
    message: 'Ahmad Rifai menanggapi diskusi Anda di agenda Haul Masyayikh: "Sampai jumpa di pondok ya Kang, kami rombongan dari Jawa Timur berangkat bareng."',
    time: '3 jam lalu',
    read: false,
    authorName: 'Ahmad Rifai',
    tag: 'Interaksi Balasan'
  },
  {
    id: 'notif-4',
    type: 'system',
    title: 'Verifikasi Akun KTA Digital',
    message: 'Pembaruan data induk KTA Digital Santri Anda telah disetujui resmi oleh Bagian Kesantrian Pondok Pesantren Attaroqqy.',
    time: 'Kemarin',
    read: true,
    authorName: 'Admin Kesantrian',
    tag: 'Sistem Pondok'
  },
  {
    id: 'notif-5',
    type: 'finance',
    title: 'Fitur Keuangan Alumni Tersedia',
    message: 'Alumni kini dapat mengecek rincian tagihan lama pondok dan melakukan pembayaran langsung lewat aplikasi secara praktis dan transparan.',
    time: '2 hari lalu',
    read: true,
    authorName: 'Sistem Keuangan',
    tag: 'Fitur Keuangan'
  }
];

/**
 * Komponen Viewer Foto Profil Layar Penuh Bersih
 * Hanya menampilkan foto fullscreen tanpa UI mengganggu, hanya ada tombol X dan tombol Hapus.
 * Dilengkapi fitur pinch-to-zoom (cubit), double-tap zoom, mouse-wheel zoom, dan geser (pan).
 */
const FullscreenPhotoViewerModal: React.FC<{
  photoUrl?: string;
  name: string;
  onClose: () => void;
  onDelete?: () => void;
}> = ({ photoUrl, name, onClose, onDelete }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const touchStartRef = useRef<{ dist: number; scale: number; x: number; y: number; posX: number; posY: number }>({ dist: 0, scale: 1, x: 0, y: 0, posX: 0, posY: 0 });
  const isDraggingRef = useRef(false);
  const lastTapRef = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartRef.current = {
        dist,
        scale,
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        posX: position.x,
        posY: position.y
      };
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        if (scale > 1) {
          setScale(1);
          setPosition({ x: 0, y: 0 });
        } else {
          setScale(2.5);
        }
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
      isDraggingRef.current = true;
      touchStartRef.current.x = e.touches[0].clientX;
      touchStartRef.current.y = e.touches[0].clientY;
      touchStartRef.current.posX = position.x;
      touchStartRef.current.posY = position.y;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (touchStartRef.current.dist > 0) {
        const factor = dist / touchStartRef.current.dist;
        const newScale = Math.min(Math.max(touchStartRef.current.scale * factor, 1), 6);
        setScale(newScale);
        if (newScale === 1) {
          setPosition({ x: 0, y: 0 });
        }
      }
    } else if (e.touches.length === 1 && scale > 1 && isDraggingRef.current) {
      const dx = e.touches[0].clientX - touchStartRef.current.x;
      const dy = e.touches[0].clientY - touchStartRef.current.y;
      setPosition({
        x: touchStartRef.current.posX + dx,
        y: touchStartRef.current.posY + dy
      });
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    if (scale <= 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.002;
    const newScale = Math.min(Math.max(scale + delta, 1), 6);
    setScale(newScale);
    if (newScale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[999999] bg-black flex items-center justify-center overflow-hidden touch-none select-none animate-in fade-in duration-200"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Tombol kontrol sudut kanan atas: Hanya Ikon Hapus dan X Tutup */}
      <div className="absolute top-5 right-5 sm:top-6 sm:right-6 z-50 flex items-center gap-3">
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="w-11 h-11 rounded-full bg-black/60 hover:bg-rose-600/90 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-90"
            title="Hapus foto profil"
          >
            <Trash2 className="w-5 h-5 text-white" />
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="w-11 h-11 rounded-full bg-black/60 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-90"
          title="Tutup"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Gambar layar penuh bersih dengan dukungan pinch & pan */}
      <div
        className="w-full h-full flex items-center justify-center p-0 cursor-grab active:cursor-grabbing transition-transform duration-75"
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0px) scale(${scale})`,
          transformOrigin: 'center center'
        }}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className="w-full h-full object-contain pointer-events-none"
            draggable={false}
          />
        ) : (
          <div className="w-56 h-56 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold text-7xl flex items-center justify-center shadow-2xl">
            {name.charAt(0)}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export const AlumniView: React.FC<AlumniViewProps> = ({
  alumni,
  allAlumni,
  events,
  announcements: propAnnouncements,
  adminAccount,
  onLogout,
  onUpdateProfile,
  onRsvpEvent,
  onAddAnnouncement,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showKtaCardModal, setShowKtaCardModal] = useState(false);
  const [isDistributionMapOpen, setIsDistributionMapOpen] = useState(false);
  const [deviceGps, setDeviceGps] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDeviceGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    }
  }, []);
  const [activeIslamicMenu, setActiveIslamicMenu] = useState<'quran' | 'majmuah' | 'maulid' | 'aurod' | null>(null);
  const [fullscreenPosterUrl, setFullscreenPosterUrl] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dedicated notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [notifFilter, setNotifFilter] = useState<'all' | 'interaction' | 'finance'>('all');
  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    triggerToast('Semua pemberitahuan ditandai sudah dibaca');
  };

  const handleToggleNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const filteredNotifications = notifications.filter((n) => {
    if (notifFilter === 'interaction') return n.type === 'reply' || n.type === 'like';
    if (notifFilter === 'finance') return n.type === 'finance' || n.type === 'system';
    return true;
  });

  // Countdown timer untuk Event Terdekat (12 Oktober 2026, 08:00 WIB)
  const [countdown, setCountdown] = useState({ days: 11, hours: 12, minutes: 45, seconds: 20 });

  useEffect(() => {
    const targetDate = new Date('2026-10-12T08:00:00+07:00').getTime();
    const calculateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;
      if (difference <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      setCountdown({ days, hours, minutes, seconds });
    };
    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter Jangkauan untuk Agenda & Pengumuman
  const [alumniEventScopeFilter, setAlumniEventScopeFilter] = useState<'Semua' | 'Umum' | 'Provinsi' | 'Kabupaten' | 'Kecamatan' | 'Desa'>('Semua');
  const [alumniAnnouncementScopeFilter, setAlumniAnnouncementScopeFilter] = useState<'Semua' | 'Umum' | 'Provinsi' | 'Kabupaten' | 'Kecamatan' | 'Desa'>('Semua');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  // Profile Edit State
  const [editNik, setEditNik] = useState(alumni.nik);
  const [editNoKk, setEditNoKk] = useState(alumni.noKk || '');
  const [editName, setEditName] = useState(alumni.name);
  const [editTempatLahir, setEditTempatLahir] = useState(alumni.tempatLahir || '');
  const [editTanggalLahir, setEditTanggalLahir] = useState(alumni.tanggalLahir || '');
  const [editGender, setEditGender] = useState<'L' | 'P'>((alumni.gender as 'L' | 'P') || 'L');
  const [editUrutanAnak, setEditUrutanAnak] = useState<number>(Number(alumni.anak_ke ?? alumni.urutanAnak) || 1);
  const [editJumlahSaudara, setEditJumlahSaudara] = useState<number>(Number(alumni.dari_bersaudara ?? alumni.jumlahSaudara) || 1);
  const [editUsername, setEditUsername] = useState(alumni.username || '');
  const [editPhone, setEditPhone] = useState(alumni.phone);
  const [editEmail, setEditEmail] = useState(alumni.email);
  const [editCity, setEditCity] = useState(alumni.city);
  const [editProvince, setEditProvince] = useState(alumni.province);
  const [editKecamatan, setEditKecamatan] = useState(alumni.kecamatan || '');
  const [editDesa, setEditDesa] = useState(alumni.desa || '');
  const [editAlamatLengkap, setEditAlamatLengkap] = useState(alumni.alamatLengkap || '');
  const [editCoordinates, setEditCoordinates] = useState<LocationCoordinates | null>(alumni.coordinates || null);
  const [editOccupation, setEditOccupation] = useState(alumni.occupation);
  const [editInstitution, setEditInstitution] = useState(alumni.institution);
  const [editBio, setEditBio] = useState(alumni.bio || '');
  const [editPhotoUrl, setEditPhotoUrl] = useState<string | undefined>(alumni.photoUrl);
  const [editCoverPhotoUrl, setEditCoverPhotoUrl] = useState<string | undefined>(alumni.coverPhotoUrl);
  const [isCoverBottomSheetOpen, setIsCoverBottomSheetOpen] = useState(false);
  const [showFullscreenCover, setShowFullscreenCover] = useState(false);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  const handleCoverPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      triggerToast('Mohon pilih file gambar (JPG, PNG, atau WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      triggerToast('Ukuran gambar maksimal 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setEditCoverPhotoUrl(result);
      onUpdateProfile({ coverPhotoUrl: result });
      triggerToast('Foto sampul berhasil diperbarui');
    };
    reader.readAsDataURL(file);
  };
  const [editShareContact, setEditShareContact] = useState(alumni.shareContact);
  const [editShareEmail, setEditShareEmail] = useState(alumni.shareEmail !== false);
  const [editShareFullAddress, setEditShareFullAddress] = useState(alumni.shareFullAddress !== false);
  const [editShareLocationTag, setEditShareLocationTag] = useState(alumni.shareLocationTag !== false);
  const [showLocationNotSetPopup, setShowLocationNotSetPopup] = useState(false);
  const locationNotSetTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isLocationTagSet = Boolean(editCoordinates?.lat && editCoordinates?.lng);

  const handleTriggerDisabledLocationTag = () => {
    setShowLocationNotSetPopup(true);
    if (locationNotSetTimerRef.current) clearTimeout(locationNotSetTimerRef.current);
    locationNotSetTimerRef.current = setTimeout(() => {
      setShowLocationNotSetPopup(false);
    }, 2500);
  };

  // Username Check State
  const [newUsernameInput, setNewUsernameInput] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'available' | 'taken'>('idle');
  const checkDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleUsernameInputChange = (val: string) => {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setNewUsernameInput(cleaned);
    if (checkDebounceRef.current) clearTimeout(checkDebounceRef.current);

    if (!cleaned.trim()) {
      setIsCheckingUsername(false);
      setUsernameStatus('idle');
      return;
    }

    setIsCheckingUsername(true);
    checkDebounceRef.current = setTimeout(() => {
      setIsCheckingUsername(false);
      const isTaken = allAlumni.some(
        (a) => a.id !== alumni.id && a.username && a.username.toLowerCase() === cleaned
      );
      setUsernameStatus(isTaken ? 'taken' : 'available');
    }, 450);
  };

  // Riwayat Pendidikan State
  const [editNism, setEditNism] = useState(alumni.nism || '');
  const [editNisn, setEditNisn] = useState(alumni.nisn || '');
  const [editEntryYear, setEditEntryYear] = useState(alumni.entryYear || '');
  const [editGradYear, setEditGradYear] = useState(alumni.gradYear || '');
  const [editEntryDate, setEditEntryDate] = useState(alumni.entryDate || '');
  const [editGradDate, setEditGradDate] = useState(alumni.gradDate || '');
  const [tempEntryDate, setTempEntryDate] = useState(alumni.entryDate || '');
  const [tempGradDate, setTempGradDate] = useState(alumni.gradDate || '');
  const [activeDateTab, setActiveDateTab] = useState<'masuk' | 'keluar'>('masuk');

  // Informasi Orang Tua State
  const [editNamaAyah, setEditNamaAyah] = useState(alumni.namaAyah || '');
  const [editNikAyah, setEditNikAyah] = useState(alumni.nikAyah || '');
  const [editPekerjaanAyah, setEditPekerjaanAyah] = useState(alumni.pekerjaanAyah || '');
  const [editPendidikanAyah, setEditPendidikanAyah] = useState(alumni.pendidikanAyah || '');

  const [editNamaIbu, setEditNamaIbu] = useState(alumni.namaIbu || '');
  const [editNikIbu, setEditNikIbu] = useState(alumni.nikIbu || '');
  const [editPekerjaanIbu, setEditPekerjaanIbu] = useState(alumni.pekerjaanIbu || '');
  const [editPendidikanIbu, setEditPendidikanIbu] = useState(alumni.pendidikanIbu || '');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showFullscreenPhoto, setShowFullscreenPhoto] = useState(false);
  const [activeEditModal, setActiveEditModal] = useState<
    'nama' | 'ttl' | 'saudara' | 'nik_kk' | 'alamat' | 'kontak' | 'pekerjaan' | 'bio' | 'tanggal_masuk' | 'tanggal_keluar' | 'ayah' | 'ibu' | 'username' | 'password' | 'pendidikan_info' | null
  >(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sub-tab Event & Pengumuman
  const [eventSubTab, setEventSubTab] = useState<'event' | 'pengumuman'>('event');
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(propAnnouncements || INITIAL_ANNOUNCEMENTS);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (propAnnouncements) {
      setAnnouncements(propAnnouncements);
    }
  }, [propAnnouncements]);

  // Caption expand/collapse state (default terpotong, klik selengkapnya untuk memperlihatkan semuanya)
  const [expandedCaptions, setExpandedCaptions] = useState<Record<string, boolean>>({});
  const toggleCaption = (eventId: string) => {
    setExpandedCaptions((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  // Tanggapan / Komentar Ala Instagram (Persis Screenshot 2)
  const [commentsList, setCommentsList] = useState<EventComment[]>(INITIAL_EVENT_COMMENTS);
  const [activeCommentsModalEvent, setActiveCommentsModalEvent] = useState<EventAgenda | null>(null);

  // Komentar & Menu Pengumuman untuk Akun Alumni
  const [activeCommentsAnnouncement, setActiveCommentsAnnouncement] = useState<AnnouncementItem | null>(null);
  const [activeMenuAnnouncement, setActiveMenuAnnouncement] = useState<AnnouncementItem | null>(null);

  const handleToggleLikeAnnouncement = (annId: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => {
        if (a.id !== annId) return a;
        const isNowLiked = !a.isLiked;
        return {
          ...a,
          isLiked: isNowLiked,
          likesCount: Math.max(0, (a.likesCount || 0) + (isNowLiked ? 1 : -1)),
        };
      })
    );
  };

  const handleAddAnnouncementComment = (targetId: string, text: string, replyToCommentId?: string) => {
    if (!text.trim()) return;

    if (replyToCommentId) {
      const newReply: EventCommentReply = {
        id: `ann-rep-${Date.now()}`,
        commentId: replyToCommentId,
        authorName: alumni.name,
        authorAvatar: alumni.photoUrl,
        content: text.trim(),
        timeAgo: 'Baru saja',
        likesCount: 0,
        isLiked: false,
      };

      setCommentsList((prev) =>
        prev.map((c) => {
          if (c.id === replyToCommentId) {
            const replies = c.replies || [];
            return {
              ...c,
              repliesCount: (c.repliesCount || replies.length) + 1,
              replies: [...replies, newReply],
            };
          }
          return c;
        })
      );
    } else {
      const newComment: EventComment = {
        id: `ann-comm-${Date.now()}`,
        eventId: targetId,
        authorName: alumni.name,
        authorAvatar: alumni.photoUrl,
        content: text.trim(),
        timeAgo: 'Baru saja',
        likesCount: 0,
        isLiked: false,
        repliesCount: 0,
        replies: [],
      };

      setCommentsList((prev) => [newComment, ...prev]);
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === targetId ? { ...a, commentsCount: (a.commentsCount || 0) + 1 } : a))
      );
    }
  };

  // Modal RSVP Text Confirmation
  const [rsvpModalData, setRsvpModalData] = useState<{
    eventId: string;
    eventTitle: string;
    type: 'hadir' | 'tidak_hadir' | 'belum_pasti';
    defaultText: string;
  } | null>(null);
  const [rsvpNoteInput, setRsvpNoteInput] = useState('');

  const formatTanggalIndonesia = (dateStr?: string) => {
    if (!dateStr) return '14 Mei 1998';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatTanggalSingkat = (dateStr?: string, fallbackYear?: string) => {
    if (!dateStr && fallbackYear) return fallbackYear;
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return fallbackYear || dateStr;
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return fallbackYear || dateStr;
    }
  };

  useEffect(() => {
    setEditNik(alumni.nik);
    setEditNoKk(alumni.noKk || '');
    setEditName(alumni.name);
    setEditTempatLahir(alumni.tempatLahir || '');
    setEditTanggalLahir(alumni.tanggalLahir || '');
    setEditGender((alumni.gender as 'L' | 'P') || 'L');
    setEditUrutanAnak(Number(alumni.anak_ke ?? alumni.urutanAnak) || 1);
    setEditJumlahSaudara(Number(alumni.dari_bersaudara ?? alumni.jumlahSaudara) || 1);
    setEditUsername(alumni.username || '');
    setEditPhone(alumni.phone);
    setEditEmail(alumni.email);
    setEditCity(alumni.city);
    setEditProvince(alumni.province);
    setEditKecamatan(alumni.kecamatan || '');
    setEditDesa(alumni.desa || '');
    setEditAlamatLengkap(alumni.alamatLengkap || '');
    setEditCoordinates(alumni.coordinates || null);
    setEditOccupation(alumni.occupation);
    setEditInstitution(alumni.institution);
    setEditBio(alumni.bio || '');
    setEditPhotoUrl(alumni.photoUrl);
    setEditShareContact(alumni.shareContact);
    setEditShareEmail(alumni.shareEmail !== false);
    setEditShareFullAddress(alumni.shareFullAddress !== false);
    setEditShareLocationTag(alumni.shareLocationTag !== false);
    setEditNism(alumni.nism || '');
    setEditNisn(alumni.nisn || '');
    setEditEntryYear(alumni.entryYear || '');
    setEditGradYear(alumni.gradYear || '');
    setEditEntryDate(alumni.entryDate || '');
    setEditGradDate(alumni.gradDate || '');
    setEditNamaAyah(alumni.namaAyah || '');
    setEditNikAyah(alumni.nikAyah || '');
    setEditPekerjaanAyah(alumni.pekerjaanAyah || '');
    setEditPendidikanAyah(alumni.pendidikanAyah || '');
    setEditNamaIbu(alumni.namaIbu || '');
    setEditNikIbu(alumni.nikIbu || '');
    setEditPekerjaanIbu(alumni.pekerjaanIbu || '');
    setEditPendidikanIbu(alumni.pendidikanIbu || '');
  }, [alumni]);

  // Handle uploading and scaling photo
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      triggerToast('Format file harus berupa gambar (JPG, PNG, atau WEBP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.88);
          setEditPhotoUrl(compressed);
          triggerToast('Foto profil dipilih. Klik "Simpan Perubahan" untuk menyimpan.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle deleting photo
  const handleDeletePhoto = () => {
    setEditPhotoUrl(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    triggerToast('Foto profil dihapus. Klik "Simpan Perubahan" untuk menyimpan.');
  };

  // Directory Search State (Persis Kelola Data Alumni di Akun Admin)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlumniDetail, setSelectedAlumniDetail] = useState<AlumniRecord | null>(null);

  const handleOpenAuthorProfile = (authorName?: string, authorHandle?: string, authorAvatar?: string) => {
    const record = resolveAuthorAlumniRecord(authorName, authorHandle, authorAvatar, allAlumni, adminAccount);
    setSelectedAlumniDetail(record);
  };
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [filterEntryFrom, setFilterEntryFrom] = useState('');
  const [filterEntryTo, setFilterEntryTo] = useState('');
  const [filterGradFrom, setFilterGradFrom] = useState('');
  const [filterGradTo, setFilterGradTo] = useState('');
  const [filterProvince, setFilterProvince] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterKecamatan, setFilterKecamatan] = useState('');
  const [filterDesa, setFilterDesa] = useState('');

  // Quick Location Filter Tags: 'nearby' | 'kecamatan' | 'city' | 'province' | null
  type QuickLocationTag = 'nearby' | 'kecamatan' | 'city' | 'province' | null;
  const [activeQuickTag, setActiveQuickTag] = useState<QuickLocationTag>(null);

  const userKecamatan = alumni.kecamatan || 'Sedan';
  const userCity = alumni.city || 'Rembang';
  const userProvince = alumni.province || 'Jawa Tengah';
  const userCoordinates = alumni.coordinates || { lat: -6.7423, lng: 111.4589 };

  const normalizePlace = (val: string) => val.toLowerCase().replace(/^(kota|kabupaten|kab\.)\s+/i, '').trim();

  // Hitung jumlah alumni terdata pada masing-masing tag lokasi
  const countKecamatan = allAlumni.filter((item) =>
    Boolean(
      item.kecamatan &&
      (item.kecamatan.toLowerCase().includes(userKecamatan.toLowerCase()) ||
       userKecamatan.toLowerCase().includes(item.kecamatan.toLowerCase()))
    )
  ).length;

  const countCity = allAlumni.filter((item) => {
    const itemCityNorm = normalizePlace(item.city);
    const userCityNorm = normalizePlace(userCity);
    return (
      itemCityNorm.includes(userCityNorm) ||
      userCityNorm.includes(itemCityNorm) ||
      item.city.toLowerCase().includes(userCity.toLowerCase())
    );
  }).length;

  const countProvince = allAlumni.filter((item) =>
    item.province.toLowerCase().includes(userProvince.toLowerCase()) ||
    userProvince.toLowerCase().includes(item.province.toLowerCase())
  ).length;

  // Hitung jarak radius geografis (Haversine Formula)
  const getAlumniDistance = (item: AlumniRecord): number => {
    if (item.id === alumni.id) return 0;
    let itemCoords = item.coordinates;
    if (!itemCoords) {
      const key = `${item.kecamatan || ''} ${item.city || ''} ${item.province || ''}`.toLowerCase();
      if (key.includes('sedan')) itemCoords = { lat: -6.7455, lng: 111.4620 };
      else if (key.includes('sarang')) itemCoords = { lat: -6.7380, lng: 111.6420 };
      else if (key.includes('lasem')) itemCoords = { lat: -6.6912, lng: 111.4501 };
      else if (key.includes('rembang')) itemCoords = { lat: -6.7082, lng: 111.3411 };
      else if (key.includes('pati')) itemCoords = { lat: -6.7557, lng: 111.0379 };
      else if (key.includes('semarang')) itemCoords = { lat: -6.9666, lng: 110.4381 };
      else if (key.includes('surabaya')) itemCoords = { lat: -7.2575, lng: 112.7521 };
      else if (key.includes('malang')) itemCoords = { lat: -7.9797, lng: 112.6304 };
      else if (key.includes('jakarta')) itemCoords = { lat: -6.2415, lng: 106.7992 };
      else if (key.includes('yogyakarta')) itemCoords = { lat: -7.7956, lng: 110.3695 };
      else itemCoords = { lat: -7.0, lng: 111.0 };
    }
    const R = 6371; // km
    const dLat = (itemCoords.lat - userCoordinates.lat) * (Math.PI / 180);
    const dLng = (itemCoords.lng - userCoordinates.lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userCoordinates.lat * (Math.PI / 180)) * Math.cos(itemCoords.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  const hasAdvancedFilters = Boolean(
    filterEntryFrom ||
    filterEntryTo ||
    filterGradFrom ||
    filterGradTo ||
    filterProvince ||
    filterCity ||
    filterKecamatan ||
    filterDesa
  );

  const hasActiveFilters = Boolean(
    activeQuickTag ||
    hasAdvancedFilters
  );

  const handleResetFilters = () => {
    setActiveQuickTag(null);
    setFilterEntryFrom('');
    setFilterEntryTo('');
    setFilterGradFrom('');
    setFilterGradTo('');
    setFilterProvince('');
    setFilterCity('');
    setFilterKecamatan('');
    setFilterDesa('');
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    if (!editNik.trim()) {
      triggerToast('NIK tidak boleh kosong!');
      setIsSavingProfile(false);
      return;
    }

    if (editNik.trim().length !== 16) {
      triggerToast('NIK harus terdiri dari 16 digit angka');
      setIsSavingProfile(false);
      return;
    }

    if (editNoKk.trim() && editNoKk.trim().length !== 16) {
      triggerToast('Nomor KK harus terdiri dari 16 digit angka');
      setIsSavingProfile(false);
      return;
    }

    const updates: Partial<AlumniRecord> = {
      nik: editNik.trim(),
      noKk: editNoKk.trim() || undefined,
      name: editName,
      username: editUsername.trim() || undefined,
      phone: editPhone,
      email: editEmail,
      city: editCity,
      province: editProvince,
      kecamatan: editKecamatan,
      desa: editDesa,
      alamatLengkap: editAlamatLengkap,
      coordinates: editCoordinates || undefined,
      occupation: editOccupation,
      institution: editInstitution,
      bio: editBio,
      photoUrl: editPhotoUrl || undefined,
      shareContact: editShareContact,
      shareFullAddress: editShareFullAddress,
      shareLocationTag: editShareLocationTag,
    };

    if (newPassword) {
      if (newPassword.length < 4) {
        triggerToast('Kata sandi baru minimal 4 karakter');
        setIsSavingProfile(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        triggerToast('Konfirmasi kata sandi tidak cocok!');
        setIsSavingProfile(false);
        return;
      }
      updates.password = newPassword;
      updates.isPasswordChanged = true;
    }

    setTimeout(() => {
      onUpdateProfile(updates);
      setIsSavingProfile(false);
      setNewPassword('');
      setConfirmPassword('');
      triggerToast('Profil & Pengaturan berhasil disimpan!');
    }, 500);
  };

  const handleOpenRsvpModal = (ev: EventAgenda, type?: 'hadir' | 'tidak_hadir' | 'belum_pasti') => {
    const selectedType = type || (ev.userRsvp === 'hadir' || ev.userRsvp === 'tidak_hadir' ? ev.userRsvp : 'hadir');
    const defaultText = selectedType === 'hadir' ? 'Insya Allah saya hadir' : selectedType === 'tidak_hadir' ? 'Mohon maaf belum bisa hadir' : '';
    setRsvpModalData({
      eventId: ev.id,
      eventTitle: ev.title,
      type: selectedType,
      defaultText,
    });
    setRsvpNoteInput(ev.rsvpNote || defaultText);
  };

  const handleConfirmRsvpModal = () => {
    if (!rsvpModalData) return;

    // Filter keluar tanggapan lama dari user saat ini untuk event ini (sehingga tanggapan lama dan seluruh balasannya otomatis terhapus)
    const currentUserName = alumni.name.toLowerCase().trim();
    const updatedComments = commentsList.filter(
      (c) =>
        !(
          c.eventId === rsvpModalData.eventId &&
          (c.isCurrentUser || c.authorName.toLowerCase().trim() === currentUserName)
        )
    );

    if (rsvpModalData.type === 'belum_pasti') {
      onRsvpEvent(rsvpModalData.eventId, 'belum_pasti', '');
      setCommentsList(updatedComments);
      triggerToast('Pilihan kehadiran dibatalkan (Belum Memutuskan)');
      setRsvpModalData(null);
      return;
    }

    const finalNote = rsvpNoteInput.trim() || rsvpModalData.defaultText;
    onRsvpEvent(rsvpModalData.eventId, rsvpModalData.type, finalNote);

    // Mengganti tanggapan yang sudah di-up di postingan dengan tanggapan baru yang fresh (tanpa balasan lama)
    const newComment: EventComment = {
      id: `comm-user-${Date.now()}`,
      eventId: rsvpModalData.eventId,
      authorName: alumni.name,
      authorHandle: alumni.username || alumni.name.toLowerCase().replace(/\s+/g, '_'),
      authorAvatar: alumni.photoUrl,
      avatarRing: true,
      status: rsvpModalData.type,
      content: finalNote,
      timeAgo: 'Baru saja',
      likesCount: 0,
      repliesCount: 0,
      replies: [],
      isCurrentUser: true,
    };
    setCommentsList([newComment, ...updatedComments]);

    triggerToast(
      rsvpModalData.type === 'hadir'
        ? 'Alhamdulillah, konfirmasi kehadiran berhasil dicatat!'
        : 'Respons ketidakhadiran berhasil dicatat.'
    );
    setRsvpModalData(null);
  };

  const handleAddComment = (eventId: string, text: string, replyToCommentId?: string) => {
    if (replyToCommentId) {
      // Balasan ke tanggapan tertentu
      const newReply: EventCommentReply = {
        id: `rep-${Date.now()}`,
        commentId: replyToCommentId,
        authorName: alumni.name,
        authorHandle: alumni.username || alumni.name.toLowerCase().replace(/\s+/g, '_'),
        authorAvatar: alumni.photoUrl,
        avatarRing: true,
        content: text,
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
      // Tanggapan utama baru
      const newComment: EventComment = {
        id: `comm-${Date.now()}`,
        eventId,
        authorName: alumni.name,
        authorHandle: alumni.username || alumni.name.toLowerCase().replace(/\s+/g, '_'),
        authorAvatar: alumni.photoUrl,
        avatarRing: true,
        content: text,
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
            return { ...c, replies: updatedReplies };
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

  const handleShareEvent = async (ev: EventAgenda) => {
    const posterSrc = (ev.images && ev.images.length > 0) ? ev.images[0] : (ev.posterUrl || posterReuniImg);
    const shareText = `*AGENDA RESMI AT-TAROQQY*\n*${ev.title}*\n\n🗓️ Tanggal: ${ev.date}\n⏰ Waktu: ${ev.time}\n📍 Tempat: ${ev.location}\n\n${ev.description}\n\nInfo selengkapnya di Portal Alumni At-taroqqy:\n${window.location.origin}`;

    await shareMediaWithCaption({
      imageUrl: posterSrc,
      title: ev.title,
      text: shareText,
      onToast: triggerToast,
    });
  };

  const handleShareAnnouncement = async (ann: AnnouncementItem) => {
    const imageSrc = (ann.images && ann.images.length > 0) ? ann.images[0] : null;
    const shareText = `*PENGUMUMAN RESMI AT-TAROQQY*\n*${ann.title}*\n🗓️ ${ann.date}\n\n${ann.content}\n\n— ${ann.authorName || 'Pondok Pesantren At-taroqqy'}${ann.authorRole ? ` (${ann.authorRole})` : ''}\n\nPortal Alumni At-taroqqy:\n${window.location.origin}`;

    await shareMediaWithCaption({
      imageUrl: imageSrc,
      title: ann.title,
      text: shareText,
      onToast: triggerToast,
    });
  };

  const handleDownloadPoster = (ev: EventAgenda) => {
    const posterSrc = ev.posterUrl || posterReuniImg;
    const a = document.createElement('a');
    a.href = posterSrc;
    a.download = `poster-${ev.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    triggerToast('Poster berhasil diunduh');
  };

  // Filter list data alumni persis seperti halaman kelola data alumni admin
  const filteredAlumni = allAlumni.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.nik.includes(q) ||
      item.nis.toLowerCase().includes(q) ||
      (item.username && item.username.toLowerCase().includes(q)) ||
      item.city.toLowerCase().includes(q) ||
      (Boolean(item.kecamatan) && item.kecamatan!.toLowerCase().includes(q)) ||
      (item.shareFullAddress !== false && Boolean(item.desa) && item.desa!.toLowerCase().includes(q)) ||
      item.province.toLowerCase().includes(q) ||
      item.occupation.toLowerCase().includes(q);

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

    // Quick Location Tag filter
    let matchQuickTag = true;
    if (activeQuickTag === 'kecamatan') {
      matchQuickTag = Boolean(
        item.kecamatan &&
        (item.kecamatan.toLowerCase().includes(userKecamatan.toLowerCase()) ||
         userKecamatan.toLowerCase().includes(item.kecamatan.toLowerCase()))
      );
    } else if (activeQuickTag === 'city') {
      const itemCityNorm = normalizePlace(item.city);
      const userCityNorm = normalizePlace(userCity);
      matchQuickTag = Boolean(
        itemCityNorm.includes(userCityNorm) ||
        userCityNorm.includes(itemCityNorm) ||
        item.city.toLowerCase().includes(userCity.toLowerCase())
      );
    } else if (activeQuickTag === 'province') {
      matchQuickTag = Boolean(
        item.province.toLowerCase().includes(userProvince.toLowerCase()) ||
        userProvince.toLowerCase().includes(item.province.toLowerCase())
      );
    } else if (activeQuickTag === 'nearby') {
      // Radius sekitarmu (< 60 km)
      const dist = getAlumniDistance(item);
      matchQuickTag = dist <= 60;
    }

    return (
      matchSearch &&
      matchEntryFrom &&
      matchEntryTo &&
      matchGradFrom &&
      matchGradTo &&
      matchProvince &&
      matchCity &&
      matchKecamatan &&
      matchDesa &&
      matchQuickTag
    );
  });

  // Urutkan berdasarkan jarak jika tag 'Sekitarmu' aktif
  const sortedFilteredAlumni = activeQuickTag === 'nearby'
    ? [...filteredAlumni].sort((a, b) => getAlumniDistance(a) - getAlumniDistance(b))
    : filteredAlumni;

  return (
    <div className="w-full h-full flex flex-col bg-slate-100 overflow-hidden relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-sky-800/95 text-white text-xs px-4 py-2 rounded-full shadow-lg border border-sky-600/40 backdrop-blur-md animate-in fade-in duration-150 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* BODY SCROLLABLE CONTENT (HEADER BIRU TELAH DIHAPUS DI SEMUA HALAMAN) */}
      <div className={`flex-1 overflow-y-auto ${activeTab === 'profile' || activeTab === 'directory' ? 'p-0 bg-slate-50' : 'px-4 py-4 space-y-4'}`}>
        {/* ================= TAB 1: HOME (PERSIS LAYOUT SCREENSHOT) ================= */}
        {activeTab === 'home' && (
          <div className="space-y-4 max-w-md mx-auto w-full pb-4">
            {/* 1. TOP HEADER: FOTO PROFIL + HI, NAMA / GREETING + NOTIFICATION BELL */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <div
                  onClick={() => setShowFullscreenPhoto(true)}
                  className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-xs cursor-pointer shrink-0 bg-slate-200"
                  title="Lihat Foto Profil"
                >
                  {alumni.photoUrl ? (
                    <img
                      src={alumni.photoUrl}
                      alt={alumni.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-slate-700 text-sm">
                      {alumni.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <span>Hi, {alumni.name.split(' ')[0]}</span>
                    <span>👋</span>
                  </p>
                  <h1 className="text-xl font-bold font-display text-slate-900 leading-tight">
                    {getGreeting()}
                  </h1>
                </div>
              </div>

              {/* Tombol Pengumuman & Lonceng Notifikasi Bulat */}
              <div className="flex items-center gap-2">
                {/* Tombol Pengumuman Resmi (Di sebelah kiri ikon notifikasi) */}
                <button
                  type="button"
                  onClick={() => setActiveTab('announcements')}
                  className="w-11 h-11 rounded-full bg-white border border-slate-200/80 shadow-xs flex items-center justify-center relative cursor-pointer hover:bg-slate-50 transition-colors"
                  title="Buka Pengumuman Resmi Pondok"
                >
                  <Megaphone className="w-5 h-5 text-slate-800" />
                  {announcements.length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-sky-600 ring-2 ring-white text-[10px] font-bold text-white flex items-center justify-center shadow-xs">
                      {announcements.length}
                    </span>
                  )}
                </button>

                {/* Tombol Lonceng Notifikasi */}
                <button
                  type="button"
                  onClick={() => setActiveTab('notifications')}
                  className="w-11 h-11 rounded-full bg-white border border-slate-200/80 shadow-xs flex items-center justify-center relative cursor-pointer hover:bg-slate-50 transition-colors"
                  title="Buka Halaman Pemberitahuan"
                >
                  <Bell className="w-5 h-5 text-slate-800" />
                  {unreadNotifsCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-rose-500 ring-2 ring-white text-[10px] font-bold text-white flex items-center justify-center shadow-xs">
                      {unreadNotifsCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* 2. KTA DIGITAL SANTRI BANNER */}
            <div
              onClick={() => setShowKtaCardModal(true)}
              className="rounded-full bg-sky-600 text-white p-2.5 px-4 flex items-center justify-between shadow-md shadow-sky-600/20 cursor-pointer hover:bg-sky-700 transition-colors select-none"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-sky-600 shrink-0 shadow-2xs">
                  <IdCard className="w-5 h-5 text-sky-600" />
                </div>
                <span className="font-bold text-sm text-white tracking-wide">
                  KTA Digital Santri
                </span>
              </div>

              <ChevronRight className="w-5 h-5 text-white/80 shrink-0 ml-2" />
            </div>

            {/* 3. MENU UTAMA */}
            <div className="space-y-2.5 pt-1">
              <h2 className="font-display font-bold text-base text-slate-900 tracking-tight">
                Menu Utama
              </h2>

              <div className="grid grid-cols-2 gap-3 select-none">
                {/* 1. Alquran */}
                <div
                  onClick={() => setActiveIslamicMenu('quran')}
                  className="relative rounded-[26px] overflow-hidden shadow-sm flex flex-col justify-between h-36 cursor-pointer hover:shadow-md transition-all active:scale-[0.98] group select-none border border-sky-100"
                >
                  <img
                    src={bgMenuQuranImg}
                    alt="Alquran"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-sky-950/85 via-sky-900/45 to-sky-950/30" />
                  
                  <div className="relative z-10 p-4.5 flex flex-col justify-between h-full">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-2xs">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="text-xl font-bold font-display text-white drop-shadow-sm">
                        Alquran
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Majmuah */}
                <div
                  onClick={() => setActiveIslamicMenu('majmuah')}
                  className="relative rounded-[26px] overflow-hidden shadow-sm flex flex-col justify-between h-36 cursor-pointer hover:shadow-md transition-all active:scale-[0.98] group select-none border border-sky-100"
                >
                  <img
                    src={bgMenuMajmuahImg}
                    alt="Majmuah"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-sky-950/85 via-sky-900/45 to-sky-950/30" />
                  
                  <div className="relative z-10 p-4.5 flex flex-col justify-between h-full">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-2xs">
                      <BookMarked className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="text-xl font-bold font-display text-white drop-shadow-sm">
                        Majmuah
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Maulid */}
                <div
                  onClick={() => setActiveIslamicMenu('maulid')}
                  className="relative rounded-[26px] overflow-hidden shadow-sm flex flex-col justify-between h-36 cursor-pointer hover:shadow-md transition-all active:scale-[0.98] group select-none border border-sky-100"
                >
                  <img
                    src={bgMenuMaulidImg}
                    alt="Maulid"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-sky-950/85 via-sky-900/45 to-sky-950/30" />
                  
                  <div className="relative z-10 p-4.5 flex flex-col justify-between h-full">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-2xs">
                      <Scroll className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="text-xl font-bold font-display text-white drop-shadow-sm">
                        Maulid
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Aurod */}
                <div
                  onClick={() => setActiveIslamicMenu('aurod')}
                  className="relative rounded-[26px] overflow-hidden shadow-sm flex flex-col justify-between h-36 cursor-pointer hover:shadow-md transition-all active:scale-[0.98] group select-none border border-sky-100"
                >
                  <img
                    src={bgMenuAurodImg}
                    alt="Aurod"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-sky-950/85 via-sky-900/45 to-sky-950/30" />
                  
                  <div className="relative z-10 p-4.5 flex flex-col justify-between h-full">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-2xs">
                      <Flame className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <span className="text-xl font-bold font-display text-white drop-shadow-sm">
                        Aurod
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. AGENDA TERDEKAT DENGAN COUNTDOWN ELEGAN (MENGGANTIKAN ROOM OVERVIEW) */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-base text-slate-900 tracking-tight">
                  Agenda Terdekat
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('events')}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  Lihat semua
                </button>
              </div>

              {/* Kotak Poster Event dengan Judul dan Tag Lokasi & Waktu di bawah judul (Menutup sedikit countdown agar menyatu) */}
              <div
                onClick={() => setActiveTab('events')}
                className="relative z-10 rounded-[28px] overflow-hidden shadow-md aspect-[16/10] sm:aspect-[16/9] cursor-pointer group select-none border border-slate-200/60"
              >
                <img
                  src={events[0]?.posterUrl || posterReuniImg}
                  alt={events[0]?.title || 'Agenda Terdekat'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent" />

                {/* Bottom Overlay: Judul Acara & Tag Lokasi dan Waktu tepat di bawah judul */}
                <div className="absolute bottom-0 inset-x-0 p-4 pt-10 bg-gradient-to-t from-black/95 via-black/80 to-transparent">
                  <h3 className="font-bold text-base sm:text-lg text-white leading-snug drop-shadow-sm mb-2">
                    {events[0]?.title || 'Reuni Akbar & Haul Masyayikh Ke-42'}
                  </h3>

                  {/* Tag Lokasi dan Waktu tepat di bawah judul */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="backdrop-blur-md bg-black/50 border border-white/20 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
                      <Calendar className="w-3.5 h-3.5 text-sky-400" />
                      <span>{events[0]?.date || '12 Okt 2026'}</span>
                    </div>
                    <div className="backdrop-blur-md bg-black/50 border border-white/20 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      <span>{events[0]?.location || 'Ponpes At-taroqqy'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Countdown Elegan di Bawah Kotak Poster (Menyatu tanpa teks Hitung Mundur Acara & Reuni Akbar) */}
              <div className="bg-white rounded-b-3xl border-x border-b border-slate-200/90 p-3.5 -mt-3.5 pt-5 shadow-xs relative z-0">
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-gradient-to-b from-slate-50 to-slate-100/90 border border-slate-200/80 rounded-xl py-2 px-1 text-center shadow-2xs">
                    <span className="block text-xl font-bold font-mono text-sky-900 tracking-tight leading-none">
                      {String(countdown.days).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-slate-600 tracking-wider mt-1 block">
                      Hari
                    </span>
                  </div>
                  <div className="bg-gradient-to-b from-slate-50 to-slate-100/90 border border-slate-200/80 rounded-xl py-2 px-1 text-center shadow-2xs">
                    <span className="block text-xl font-bold font-mono text-sky-900 tracking-tight leading-none">
                      {String(countdown.hours).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-slate-600 tracking-wider mt-1 block">
                      Jam
                    </span>
                  </div>
                  <div className="bg-gradient-to-b from-slate-50 to-slate-100/90 border border-slate-200/80 rounded-xl py-2 px-1 text-center shadow-2xs">
                    <span className="block text-xl font-bold font-mono text-sky-900 tracking-tight leading-none">
                      {String(countdown.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-slate-600 tracking-wider mt-1 block">
                      Menit
                    </span>
                  </div>
                  <div className="bg-gradient-to-b from-slate-50 to-slate-100/90 border border-slate-200/80 rounded-xl py-2 px-1 text-center shadow-2xs">
                    <span className="block text-xl font-bold font-mono text-sky-900 tracking-tight leading-none">
                      {String(countdown.seconds).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-slate-600 tracking-wider mt-1 block">
                      Detik
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: DAFTAR AGENDA & EVENT ================= */}
        {activeTab === 'events' && (
          <div className="space-y-4 max-w-xl mx-auto w-full pb-8">
            {/* Header Agenda dan Kegiatan */}
            <div className="pb-1 pt-1">
              <h2 className="font-display font-bold text-base text-slate-900 leading-tight">
                Agenda dan Kegiatan
              </h2>
            </div>

            {/* Filter Tag Jangkauan: Semua, Umum, Provinsi, Kabupaten, Kecamatan, Desa */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {(['Semua', 'Umum', 'Provinsi', 'Kabupaten', 'Kecamatan', 'Desa'] as const).map((tag) => {
                const isActive = alumniEventScopeFilter === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setAlumniEventScopeFilter(tag)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all border ${
                      isActive
                        ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            {/* List Event Feed */}
            <div className="space-y-4">
              {events
                .filter((ev) => matchesAudienceTarget(ev.targetAudience, alumni))
                .filter((ev) => {
                  if (alumniEventScopeFilter === 'Semua') return true;
                  if (alumniEventScopeFilter === 'Umum') {
                    return (
                      !ev.targetAudience ||
                      ev.targetAudience.regionScope === 'semua' ||
                      (!ev.targetAudience.provinceId &&
                        !ev.targetAudience.regencyId &&
                        !ev.targetAudience.districtId &&
                        !ev.targetAudience.villageId)
                    );
                  }
                  if (alumniEventScopeFilter === 'Provinsi') {
                    return Boolean(ev.targetAudience?.provinceId && !ev.targetAudience?.regencyId);
                  }
                  if (alumniEventScopeFilter === 'Kabupaten') {
                    return Boolean(ev.targetAudience?.regencyId && !ev.targetAudience?.districtId);
                  }
                  if (alumniEventScopeFilter === 'Kecamatan') {
                    return Boolean(ev.targetAudience?.districtId && !ev.targetAudience?.villageId);
                  }
                  if (alumniEventScopeFilter === 'Desa') {
                    return Boolean(ev.targetAudience?.villageId || ev.targetAudience?.villageName);
                  }
                  return true;
                })
                .map((ev) => (
                  <div
                    key={ev.id}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden"
                  >
                    {/* 1. POST HEADER (FOTO PROFIL & USERNAME SAJA) */}
                    <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100 bg-white">
                      <div 
                        onClick={() => handleOpenAuthorProfile(ev.authorName, ev.authorHandle, ev.authorAvatar)}
                        className="flex items-center gap-3 min-w-0 cursor-pointer group select-none"
                        title="Lihat profil"
                      >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <img
                            src={ev.authorAvatar || logoPonpesImg}
                            alt={ev.authorHandle || ev.authorName || 'Admin Humas'}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 ring-2 ring-slate-100 shadow-2xs group-hover:ring-sky-400 transition-all"
                          />
                        </div>
                        <div className="min-w-0">
                          {/* Username Saja */}
                          <h4 className="font-display font-bold text-xs sm:text-sm text-slate-900 truncate leading-tight group-hover:text-sky-600 transition-colors">
                            {formatAuthorUsername(ev.authorHandle || ev.authorName)}
                          </h4>
                          {/* Keterangan Jangkauan & Waktu Upload */}
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200/90 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Globe className="w-2.5 h-2.5 text-sky-600" />
                              <span>{formatAudienceSummary(ev.targetAudience)}</span>
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {ev.postedAt || '2 jam yang lalu'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tombol Unduh & Bagikan (Menggantikan Posisi Titik Tiga di Kanan Atas) */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDownloadPoster(ev)}
                          className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                          title="Unduh Poster"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleShareEvent(ev)}
                          className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                          title="Bagikan Event"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* 2. POSTER MEDIA (MULTI-IMAGE SLIDER DENGAN COUNTER DAN TITIK GESER) */}
                    <PostMediaCarousel
                      images={ev.images}
                      fallbackImage={ev.posterUrl || posterReuniImg}
                      title={ev.title}
                      onPreview={(url) => setFullscreenPosterUrl(url)}
                    />

                    {/* 3. BARIS KONFIRMASI KEHADIRAN */}
                    {!ev.userRsvp || ev.userRsvp === 'belum_pasti' ? (
                      /* Belum konfirmasi: Teks 2 baris tanpa kontainer & 2 tombol sejajar horizontal (Ya / Tidak) */
                      <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-slate-100 bg-white">
                        <p className="text-xs font-semibold text-slate-800 leading-snug select-none">
                          Apakah anda<br />akan menghadirinya?
                        </p>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenRsvpModal(ev, 'hadir')}
                            className="px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer select-none active:scale-95 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200"
                          >
                            Ya
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenRsvpModal(ev, 'tidak_hadir')}
                            className="px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer select-none active:scale-95 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200"
                          >
                            Tidak
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Sudah konfirmasi: Kata 'Hadir' di baris ke dua dan pesan tidak ditampilkan */
                      <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-slate-100 bg-white">
                        <div className="text-xs select-none min-w-0 pr-2 leading-tight">
                          <p className="text-slate-600 font-medium">Anda sudah mengonfirmasi</p>
                          <p className={`font-bold mt-0.5 ${ev.userRsvp === 'hadir' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {ev.userRsvp === 'hadir' ? 'Hadir' : 'Tidak Hadir'}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenRsvpModal(ev, ev.userRsvp)}
                          className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer shrink-0 active:scale-95"
                        >
                          Ubah
                        </button>
                      </div>
                    )}

                    {/* 4. CAPTION & DETAIL INFORMASI ACARA */}
                    <div className="px-4 py-3 space-y-2.5 text-xs">
                      {/* Judul & Caption Deskripsi Ala Instagram (Default Terpotong, Cukup Klik Caption atau Tombol untuk Membuka/Menyembunyikan Selengkapnya) */}
                      <div className="text-slate-800 text-xs">
                        <p 
                          onClick={() => toggleCaption(ev.id)}
                          className={`leading-relaxed cursor-pointer select-none ${expandedCaptions[ev.id] ? '' : 'line-clamp-2'}`}
                          title={expandedCaptions[ev.id] ? "Klik untuk menyembunyikan" : "Klik untuk membaca selengkapnya"}
                        >
                          <span className="font-bold text-slate-900 mr-1.5">{ev.title}</span>
                          <span className="text-slate-600">{ev.description}</span>
                        </p>

                        {/* Tombol 'selengkapnya' (Persis Screenshot 1) */}
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

                      {/* Kotak Tanggal, Waktu & Tempat (HANYA TAMPIL SAAT CAPTION DIBUKA / SELENGKAPNYA) */}
                      {expandedCaptions[ev.id] && (
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-slate-700 text-xs mt-2 animate-in fade-in duration-150">
                          {/* Tanggal dan Waktu Dibedakan */}
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

                      {/* Link Keterangan Jumlah Orang yang Sudah Memberi Tanggapan (Membuka Bottom Sheet Persis Screenshot 2) */}
                      <div className="pt-0.5">
                        <button
                          type="button"
                          onClick={() => setActiveCommentsModalEvent(ev)}
                          className="text-slate-400 hover:text-slate-600 text-xs font-normal cursor-pointer select-none text-left"
                        >
                          Lihat semua {((ev.attendeesCount || 0) + (ev.absentCount || 0)) || commentsList.filter(c => c.eventId === ev.id).length || 0} tanggapan
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3: CARI ALUMNI (SAMA PERSIS KELOLA DATA ALUMNI ADMIN) ================= */}
        {activeTab === 'directory' && (
          <div className="p-4 space-y-3 flex-1 overflow-y-auto pb-24">
            {/* Search & Filter Button - NOT inside a container */}
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

              {/* Tombol filter sejajar di samping kanan (dinonaktifkan jika tag lokasi aktif) */}
              <button
                type="button"
                disabled={Boolean(activeQuickTag)}
                onClick={() => !activeQuickTag && setIsFilterSheetOpen(true)}
                className={`p-2.5 rounded-xl border transition-all flex items-center justify-center shrink-0 ${
                  activeQuickTag
                    ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed opacity-50'
                    : hasAdvancedFilters
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs cursor-pointer'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer'
                }`}
                title={activeQuickTag ? 'Filter dinonaktifkan saat tag lokasi aktif' : 'Buka Filter Data'}
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>

            {/* QUICK LOCATION TAGS: SEKITARMU, KECAMATAN USER, KABUPATEN USER, PROVINSI USER */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {/* 1. Tag Sekitarmu (tanpa kurung jumlah alumni) */}
              <button
                type="button"
                onClick={() => setActiveQuickTag(activeQuickTag === 'nearby' ? null : 'nearby')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer select-none ${
                  activeQuickTag === 'nearby'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200/90 hover:border-sky-300 hover:bg-sky-50/50 shadow-2xs'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Sekitarmu</span>
              </button>

              {/* 2. Tag Kecamatan User (misal Sedan (2)) */}
              <button
                type="button"
                onClick={() => setActiveQuickTag(activeQuickTag === 'kecamatan' ? null : 'kecamatan')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer select-none ${
                  activeQuickTag === 'kecamatan'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200/90 hover:border-sky-300 hover:bg-sky-50/50 shadow-2xs'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{userKecamatan} ({countKecamatan})</span>
              </button>

              {/* 3. Tag Kabupaten User (misal Rembang (4)) */}
              <button
                type="button"
                onClick={() => setActiveQuickTag(activeQuickTag === 'city' ? null : 'city')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer select-none ${
                  activeQuickTag === 'city'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200/90 hover:border-sky-300 hover:bg-sky-50/50 shadow-2xs'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{userCity} ({countCity})</span>
              </button>

              {/* 4. Tag Provinsi User (misal Jawa Tengah (5)) */}
              <button
                type="button"
                onClick={() => setActiveQuickTag(activeQuickTag === 'province' ? null : 'province')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer select-none ${
                  activeQuickTag === 'province'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200/90 hover:border-sky-300 hover:bg-sky-50/50 shadow-2xs'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{userProvince} ({countProvince})</span>
              </button>
            </div>

            {/* Filter Active Indicator & Quick Reset (Hanya saat filter lembar aktif & tanpa tag lokasi) */}
            {!activeQuickTag && hasAdvancedFilters && (
              <div className="flex items-center justify-between text-[11px] text-sky-800 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-100">
                <span>Filter aktif diterapkan ({filteredAlumni.length} alumni)</span>
                <button
                  onClick={handleResetFilters}
                  className="font-bold underline text-sky-700 hover:text-sky-900 cursor-pointer"
                >
                  Reset Filter
                </button>
              </div>
            )}

            {/* Daftar Kartu Alumni (Card View) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {sortedFilteredAlumni.map((item) => {
                const addressText = item.shareFullAddress === false
                  ? [item.kecamatan, item.city].filter(Boolean).join(', ') || item.city || item.province || 'Alamat disembunyikan'
                  : [item.desa, item.kecamatan, item.city].filter(Boolean).join(', ') || item.province || 'Alamat belum diisi';
                const distance = getAlumniDistance(item);

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedAlumniDetail(item)}
                    className="bg-white rounded-2xl p-3.5 border border-slate-200/80 hover:border-sky-400 hover:shadow-md transition-all cursor-pointer flex items-center gap-3.5 group relative"
                  >
                    {/* Foto / Avatar */}
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
                    </div>

                    {/* Informasi: Nama & Alamat (Desa, Kecamatan, Kabupaten) */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-display font-bold text-sm text-slate-900 group-hover:text-sky-700 transition-colors truncate">
                          {item.name}
                        </h4>
                        {item.id === alumni.id ? (
                          <span className="text-[9px] bg-sky-100 text-sky-700 px-1.5 py-0.2 rounded font-semibold shrink-0">
                            Anda
                          </span>
                        ) : activeQuickTag === 'nearby' ? (
                          <span className="text-[9px] bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.2 rounded font-semibold shrink-0 flex items-center gap-0.5">
                            <Navigation className="w-2.5 h-2.5" />
                            {distance} km
                          </span>
                        ) : null}
                      </div>
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

                    {/* Chevron Panah Detail */}
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all shrink-0 ml-auto" />
                  </div>
                );
              })}
            </div>

            {sortedFilteredAlumni.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
                Tidak ditemukan data alumni dengan filter atau pencarian yang dipilih.
              </div>
            )}
          </div>
        )}

        {/* ================= TAB KEUANGAN (TANGGUNGAN PEMBAYARAN & INFAQ) ================= */}
        {activeTab === 'finance' && (
          <AlumniFinanceView onToast={triggerToast} />
        )}

        {/* ================= TAB 4: PROFILKU (LAYOUT PERSIS SCREENSHOT & BAHASA INDONESIA) ================= */}
        {activeTab === 'profile' && (
          <div className="bg-[#f0f2fb] min-h-full flex flex-col animate-in fade-in duration-150">
            {/* FOTO SAMPUL / COVER PHOTO - UKURAN PENUH SAMPAI KOTAK PENGATURAN INFORMASI PRIBADI */}
            <div 
              onClick={() => setIsCoverBottomSheetOpen(true)}
              className="relative w-full h-52 sm:h-60 overflow-hidden cursor-pointer group select-none shrink-0 bg-[#0369a1]"
              title="Klik foto sampul untuk opsi foto"
            >
              {editCoverPhotoUrl ? (
                <img
                  src={editCoverPhotoUrl}
                  alt="Foto Sampul"
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
                <span>{editCoverPhotoUrl ? 'Foto Sampul' : 'Upload Sampul'}</span>
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

            {/* WADAH KARTU PUTIH MELENGKUNG PENGATURAN INFORMASI PRIBADI (LANGSUNG MENEMPEL KE FOTO SAMPUL) */}
            <div className="bg-white rounded-t-[36px] shadow-sm px-6 pt-0 pb-24 space-y-6 flex-1 border-t border-slate-200/40 relative z-20 -mt-10 sm:-mt-12">
              {/* Lingkaran Avatar tepat di perbatasan foto sampul & kotak pengaturan */}
              <div className="text-center flex flex-col items-center relative -top-11 -mb-7">
                <div className="relative inline-block mb-1.5">
                  {/* Lingkaran Avatar */}
                  <button
                    type="button"
                    onClick={() => setShowFullscreenPhoto(true)}
                    className="w-22 h-22 sm:w-24 sm:h-24 rounded-full ring-4 ring-white shadow-lg overflow-hidden bg-slate-200 flex items-center justify-center cursor-pointer group transition-transform active:scale-95"
                    title="Lihat foto profil penuh"
                  >
                    {editPhotoUrl ? (
                      <img
                        src={editPhotoUrl}
                        alt={editName || alumni.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold text-3xl flex items-center justify-center">
                        {(editName || alumni.name).charAt(0)}
                      </div>
                    )}
                  </button>

                  {/* Badge Pensil Edit di Sudut Kanan Bawah */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white shadow-md border border-slate-200/80 text-slate-700 hover:text-sky-600 flex items-center justify-center cursor-pointer active:scale-90 transition-all ring-2 ring-white"
                    title="Ganti Foto Profil"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  {/* Input file gambar tersembunyi */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </div>

                <h2 className="font-display font-bold text-lg text-slate-900 tracking-tight">
                  Profilku
                </h2>
              </div>

              {/* SEGMEN 1: INFORMASI PRIBADI */}
              <div>
                <p className="text-xs font-semibold text-slate-400 text-center tracking-wide mb-3">
                  Informasi Pribadi
                </p>

                <div className="divide-y divide-slate-100">
                  {/* 1. Nama Lengkap */}
                  <div
                    onClick={() => setActiveEditModal('nama')}
                    className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-2">
                      <div className="w-6 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-slate-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-400 font-medium leading-tight">Nama Lengkap</p>
                        <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                          {editName || alumni.name}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  {/* 2. Tempat, Tanggal Lahir (TTL) */}
                  <div
                    onClick={() => setActiveEditModal('ttl')}
                    className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-2">
                      <div className="w-6 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-slate-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-400 font-medium leading-tight">Tempat, Tanggal Lahir (TTL)</p>
                        <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                          {editTempatLahir || editTanggalLahir
                            ? [editTempatLahir, formatTanggalIndonesia(editTanggalLahir)].filter(Boolean).join(', ')
                            : 'Belum diisi'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  {/* 3. Gender & Saudara */}
                  <div
                    onClick={() => setActiveEditModal('saudara')}
                    className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-2">
                      <div className="w-6 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 text-slate-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-400 font-medium leading-tight">Gender & Saudara</p>
                        <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                          {editGender === 'P' ? 'Perempuan' : 'Laki-laki'}
                          {editUrutanAnak && editJumlahSaudara && editJumlahSaudara > 0
                            ? `, anak ke-${editUrutanAnak} dari ${editJumlahSaudara} bersaudara`
                            : editUrutanAnak
                            ? `, anak ke-${editUrutanAnak}`
                            : ''}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  {/* 4. NIK & Nomor KK */}
                  <div
                    onClick={() => setActiveEditModal('nik_kk')}
                    className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-2">
                      <div className="w-6 flex items-center justify-center shrink-0">
                        <CreditCard className="w-5 h-5 text-slate-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-400 font-medium leading-tight">NIK & No. KK</p>
                        <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                          {editNik || alumni.nik}{editNoKk ? ` · KK: ${editNoKk}` : ''}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  {/* 5. Alamat */}
                  <div
                    onClick={() => setActiveEditModal('alamat')}
                    className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-2">
                      <div className="w-6 flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-slate-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-400 font-medium leading-tight">Alamat & Titik Domisili</p>
                        <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                          {!editShareFullAddress
                            ? [editKecamatan || alumni.kecamatan, editCity || alumni.city].filter(Boolean).join(', ') || 'Kecamatan & Kota/Kabupaten'
                            : [editAlamatLengkap || alumni.alamatLengkap, editDesa || alumni.desa, editKecamatan || alumni.kecamatan, editCity || alumni.city, editProvince || alumni.province].filter(Boolean).join(', ') || 'Atur alamat & titik domisili'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  {/* 6. Kontak */}
                  <div
                    onClick={() => setActiveEditModal('kontak')}
                    className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-2">
                      <div className="w-6 flex items-center justify-center shrink-0">
                        <Phone className="w-5 h-5 text-slate-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-400 font-medium leading-tight">Kontak WhatsApp & Email</p>
                        <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                          {editPhone || alumni.phone} · {editEmail || alumni.email}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  {/* 7. Pekerjaan */}
                  <div
                    onClick={() => setActiveEditModal('pekerjaan')}
                    className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-2">
                      <div className="w-6 flex items-center justify-center shrink-0">
                        <Briefcase className="w-5 h-5 text-slate-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-400 font-medium leading-tight">Pekerjaan & Instansi</p>
                        <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                          {editOccupation || alumni.occupation || 'Alumni Pesantren'}
                          {editInstitution || alumni.institution ? ` · ${editInstitution || alumni.institution}` : ''}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  {/* 8. Bio */}
                  <div
                    onClick={() => setActiveEditModal('bio')}
                    className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-2">
                      <div className="w-6 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-slate-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-400 font-medium leading-tight">Bio</p>
                        <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                          {editBio || alumni.bio || 'Tulis bio atau catatan singkat...'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>

              {/* SEGMEN 2: RIWAYAT PENDIDIKAN */}
              <div>
                <p className="text-xs font-semibold text-slate-400 text-center tracking-wide mb-3">
                  Riwayat Pendidikan
                </p>

                <div className="divide-y divide-slate-100">
                  {/* 1. NIS (Terkunci / Warna Mati / Tidak Bereaksi Saat Diklik) */}
                  <div className="flex items-center justify-between py-3.5 -mx-3 px-3 rounded-2xl cursor-default select-none opacity-45">
                    <div className="flex items-center gap-4 min-w-0 pr-2">
                      <div className="w-6 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-400 font-medium leading-tight">NIS (Nomor Induk Santri)</p>
                        <p className="text-sm font-semibold font-mono text-slate-500 truncate mt-0.5">
                          {alumni.nis}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2. NISM (Terkunci / Warna Mati / Tidak Bereaksi Saat Diklik) */}
                  <div className="flex items-center justify-between py-3.5 -mx-3 px-3 rounded-2xl cursor-default select-none opacity-45">
                    <div className="flex items-center gap-4 min-w-0 pr-2">
                      <div className="w-6 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-400 font-medium leading-tight">NISM (Nomor Induk Santri Madrasah)</p>
                        <p className="text-sm font-semibold font-mono text-slate-500 truncate mt-0.5">
                          {editNism || alumni.nism || '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 3. NISN (Terkunci / Warna Mati / Tidak Bereaksi Saat Diklik) */}
                  <div className="flex items-center justify-between py-3.5 -mx-3 px-3 rounded-2xl cursor-default select-none opacity-45">
                    <div className="flex items-center gap-4 min-w-0 pr-2">
                      <div className="w-6 flex items-center justify-center shrink-0">
                        <FileCheck className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-400 font-medium leading-tight">NISN (Nomor Induk Siswa Nasional)</p>
                        <p className="text-sm font-semibold font-mono text-slate-500 truncate mt-0.5">
                          {editNisn || alumni.nisn || '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 4. Tanggal Masuk */}
                  <div
                    onClick={() => {
                      setTempEntryDate(editEntryDate || '');
                      setActiveEditModal('tanggal_masuk');
                    }}
                    className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-2">
                      <div className="w-6 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-sky-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-400 font-medium leading-tight">Tanggal Masuk</p>
                        <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                          {formatTanggalSingkat(editEntryDate, editEntryYear) || 'Atur tanggal masuk'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  {/* 5. Tanggal Keluar */}
                  <div
                    onClick={() => {
                      setTempGradDate(editGradDate || '');
                      setActiveEditModal('tanggal_keluar');
                    }}
                    className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-2">
                      <div className="w-6 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-sky-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-400 font-medium leading-tight">Tanggal Keluar</p>
                        <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                          {formatTanggalSingkat(editGradDate, editGradYear) || 'Atur tanggal keluar'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>

              {/* SEGMEN 3: INFORMASI ORANG TUA */}
              <div>
                <p className="text-xs font-semibold text-slate-400 text-center tracking-wide mb-3">
                  Informasi Orang Tua
                </p>

                <div className="divide-y divide-slate-100">
                  {/* 1. Data Ayah */}
                  <div
                    onClick={() => setActiveEditModal('ayah')}
                    className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-2">
                      <div className="w-6 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-slate-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-400 font-medium leading-tight">Data Ayah Kandung</p>
                        {editNamaAyah || alumni.namaAyah ? (
                          <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                            {editNamaAyah || alumni.namaAyah}
                            {(editNikAyah || alumni.nikAyah) ? ` · NIK: ${editNikAyah || alumni.nikAyah}` : ''}
                            {(editPekerjaanAyah || alumni.pekerjaanAyah) ? ` · ${editPekerjaanAyah || alumni.pekerjaanAyah}` : ''}
                            {(editPendidikanAyah || alumni.pendidikanAyah) ? ` · ${editPendidikanAyah || alumni.pendidikanAyah}` : ''}
                          </p>
                        ) : (
                          <p className="text-sm font-normal text-slate-400 mt-0.5">Belum diisi</p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  {/* 2. Data Ibu (Icon User sama seperti Ayah) */}
                  <div
                    onClick={() => setActiveEditModal('ibu')}
                    className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-2">
                      <div className="w-6 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-slate-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-400 font-medium leading-tight">Data Ibu Kandung</p>
                        {editNamaIbu || alumni.namaIbu ? (
                          <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                            {editNamaIbu || alumni.namaIbu}
                            {(editNikIbu || alumni.nikIbu) ? ` · NIK: ${editNikIbu || alumni.nikIbu}` : ''}
                            {(editPekerjaanIbu || alumni.pekerjaanIbu) ? ` · ${editPekerjaanIbu || alumni.pekerjaanIbu}` : ''}
                            {(editPendidikanIbu || alumni.pendidikanIbu) ? ` · ${editPendidikanIbu || alumni.pendidikanIbu}` : ''}
                          </p>
                        ) : (
                          <p className="text-sm font-normal text-slate-400 mt-0.5">Belum diisi</p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>

              {/* SEGMEN 4: PENGATURAN AKUN */}
              <div>
                <p className="text-xs font-semibold text-slate-400 text-center tracking-wide mb-3">
                  Pengaturan Akun
                </p>

                <div className="divide-y divide-slate-100">
                  {/* 1. Ganti Username */}
                  <div
                    onClick={() => {
                      setNewUsernameInput('');
                      setUsernameStatus('idle');
                      setActiveEditModal('username');
                    }}
                    className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-2">
                      <div className="w-6 flex items-center justify-center shrink-0">
                        <AtSign className="w-5 h-5 text-slate-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 leading-tight">Ganti Username</p>
                        <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                          {editUsername || alumni.username ? `@${editUsername || alumni.username}` : 'Belum diatur'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  {/* 2. Ganti Kata Sandi */}
                  <div
                    onClick={() => setActiveEditModal('password')}
                    className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-2">
                      <div className="w-6 flex items-center justify-center shrink-0">
                        <KeyRound className="w-5 h-5 text-slate-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 leading-tight">Ganti Kata Sandi</p>
                        <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                          {alumni.isPasswordChanged ? 'Sudah pernah diubah' : 'Atur atau perbarui kata sandi akun'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  {/* 3. Toggle Izinkan Nomor WA Ditampilkan */}
                  <div className="flex items-center justify-between py-3.5 -mx-3 px-3 rounded-2xl">
                    <div className="flex items-center gap-4 min-w-0 pr-3">
                      <div className="w-6 flex items-center justify-center shrink-0">
                        <MessageCircle className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 leading-tight">Izinkan Nomor WA Ditampilkan</p>
                        <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                          Tampilkan nomor WhatsApp pada pencarian sesama alumni
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = !editShareContact;
                        setEditShareContact(nextVal);
                        onUpdateProfile({ shareContact: nextVal });
                        triggerToast(nextVal ? 'Izin nomor WhatsApp aktif' : 'Izin nomor WhatsApp dinonaktifkan');
                      }}
                      className={`w-12 h-7 rounded-full p-0.5 transition-colors relative cursor-pointer shrink-0 ${
                        editShareContact ? 'bg-[#2563eb]' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                          editShareContact ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 4. Toggle Izinkan Email Ditampilkan */}
                  <div className="flex items-center justify-between py-3.5 -mx-3 px-3 rounded-2xl">
                    <div className="flex items-center gap-4 min-w-0 pr-3">
                      <div className="w-6 flex items-center justify-center shrink-0">
                        <Mail className="w-5 h-5 text-sky-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 leading-tight">Izinkan Email Ditampilkan</p>
                        <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                          Tampilkan alamat email pada profil kepada sesama alumni
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = !editShareEmail;
                        setEditShareEmail(nextVal);
                        onUpdateProfile({ shareEmail: nextVal });
                        triggerToast(nextVal ? 'Izin email aktif' : 'Izin email dinonaktifkan');
                      }}
                      className={`w-12 h-7 rounded-full p-0.5 transition-colors relative cursor-pointer shrink-0 ${
                        editShareEmail ? 'bg-[#2563eb]' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                          editShareEmail ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 5. Toggle Izinkan Alamat Lengkap Ditampilkan */}
                  <div className="flex items-center justify-between py-3.5 -mx-3 px-3 rounded-2xl">
                    <div className="flex items-center gap-4 min-w-0 pr-3">
                      <div className="w-6 flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-sky-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 leading-tight">Izinkan Alamat Lengkap Ditampilkan</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = !editShareFullAddress;
                        setEditShareFullAddress(nextVal);
                        onUpdateProfile({ shareFullAddress: nextVal });
                      }}
                      className={`w-12 h-7 rounded-full p-0.5 transition-colors relative cursor-pointer shrink-0 ${
                        editShareFullAddress ? 'bg-[#2563eb]' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                          editShareFullAddress ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 5. Toggle Izinkan Tampilkan Tag Lokasi (Mati jika lokasi belum diatur & popup kecil muncul di atas) */}
                  <div className="relative flex items-center justify-between py-3.5 -mx-3 px-3 rounded-2xl">
                    {/* Popup kecil di atas jika lokasi belum diatur */}
                    {showLocationNotSetPopup && (
                      <div className="absolute -top-7 right-3 z-30 bg-slate-900 text-white text-[11px] font-semibold px-3 py-1 rounded-lg shadow-xl flex items-center gap-1.5 animate-in fade-in zoom-in-95 pointer-events-none">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Lokasi belum diatur</span>
                        <div className="absolute -bottom-1 right-6 w-2 h-2 bg-slate-900 rotate-45" />
                      </div>
                    )}

                    <div 
                      className="flex items-center gap-4 min-w-0 pr-3 cursor-pointer"
                      onClick={!isLocationTagSet ? handleTriggerDisabledLocationTag : undefined}
                    >
                      <div className="w-6 flex items-center justify-center shrink-0">
                        <MapPin className={`w-5 h-5 ${isLocationTagSet ? 'text-sky-600' : 'text-slate-400'}`} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold leading-tight ${isLocationTagSet ? 'text-slate-800' : 'text-slate-500'}`}>
                          Izinkan Tampilkan Tag Lokasi
                        </p>
                        <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                          Tampilkan titik lokasi akun Anda pada peta sebaran alumni
                        </p>
                      </div>
                    </div>

                    {isLocationTagSet ? (
                      <button
                        type="button"
                        onClick={() => {
                          const nextVal = !editShareLocationTag;
                          setEditShareLocationTag(nextVal);
                          onUpdateProfile({ shareLocationTag: nextVal });
                          triggerToast(nextVal ? 'Izin tag lokasi aktif (tampil di peta)' : 'Izin tag lokasi dinonaktifkan (disembunyikan dari peta)');
                        }}
                        className={`w-12 h-7 rounded-full p-0.5 transition-colors relative cursor-pointer shrink-0 ${
                          editShareLocationTag ? 'bg-[#2563eb]' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                            editShareLocationTag ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    ) : (
                      <div
                        onClick={handleTriggerDisabledLocationTag}
                        className="w-12 h-7 rounded-full p-0.5 bg-slate-200/90 relative cursor-pointer shrink-0 opacity-60"
                        title="Lokasi belum diatur"
                      >
                        <div className="w-6 h-6 rounded-full bg-white shadow-xs translate-x-0" />
                      </div>
                    )}
                  </div>

                  {/* 6. Keluar dari Akun (Logout) */}
                  <div
                    onClick={onLogout}
                    className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-rose-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-2">
                      <div className="w-6 flex items-center justify-center shrink-0">
                        <LogOut className="w-5 h-5 text-rose-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-rose-600 leading-tight">Keluar dari Akun</p>
                        <p className="text-[11px] text-slate-400 leading-tight mt-0.5">Akhiri sesi login di perangkat ini</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </div>

            {/* ================= EDIT MODAL: NAMA LENGKAP ================= */}
            {activeEditModal === 'nama' && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
                <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                    <h3 className="font-bold text-sm text-slate-900">Ubah Nama Lengkap</h3>
                    <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
                        placeholder="Nama lengkap..."
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
                    <button type="button" onClick={() => { onUpdateProfile({ name: editName }); setActiveEditModal(null); triggerToast('Nama berhasil diperbarui'); }} className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= EDIT MODAL: TEMPAT TANGGAL LAHIR ================= */}
            {activeEditModal === 'ttl' && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
                <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                    <h3 className="font-bold text-sm text-slate-900">Ubah Tempat & Tanggal Lahir</h3>
                    <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Tempat Lahir (Kota/Kabupaten)</label>
                      <input type="text" value={editTempatLahir} onChange={(e) => setEditTempatLahir(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs" placeholder="Contoh: Rembang" />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Tanggal Lahir</label>
                      <input type="date" value={editTanggalLahir} onChange={(e) => setEditTanggalLahir(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
                    <button type="button" onClick={() => { onUpdateProfile({ tempatLahir: editTempatLahir, tanggalLahir: editTanggalLahir }); setActiveEditModal(null); triggerToast('TTL berhasil diperbarui'); }} className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= EDIT MODAL: GENDER & SAUDARA ================= */}
            {activeEditModal === 'saudara' && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
                <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                    <h3 className="font-bold text-sm text-slate-900">Ubah Gender & Saudara</h3>
                    <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin (gender)</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setEditGender('L')}
                          className={`py-2 rounded-xl font-semibold border text-xs cursor-pointer transition-all ${
                            editGender === 'L' ? 'bg-sky-50 border-sky-600 text-sky-700 ring-2 ring-sky-500/20' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Laki-laki
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditGender('P')}
                          className={`py-2 rounded-xl font-semibold border text-xs cursor-pointer transition-all ${
                            editGender === 'P' ? 'bg-rose-50 border-rose-600 text-rose-700 ring-2 ring-rose-500/20' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Perempuan
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Anak Ke- (anak_ke)</label>
                        <input
                          type="number"
                          min={1}
                          max={25}
                          value={editUrutanAnak}
                          onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value) || 1);
                            setEditUrutanAnak(val);
                            if (val > editJumlahSaudara) {
                              setEditJumlahSaudara(val);
                            }
                          }}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Dari Bersaudara (dari_bersaudara)</label>
                        <input
                          type="number"
                          min={editUrutanAnak}
                          max={25}
                          value={editJumlahSaudara}
                          onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value) || 1);
                            setEditJumlahSaudara(Math.max(val, editUrutanAnak));
                          }}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
                        />
                      </div>
                    </div>
                    {editUrutanAnak > editJumlahSaudara && (
                      <p className="text-[11px] text-rose-500 font-medium">
                        * Jumlah bersaudara tidak boleh lebih kecil dari anak ke-{editUrutanAnak}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
                    <button 
                      type="button" 
                      onClick={() => { 
                        const finalAnak = Math.max(1, editUrutanAnak);
                        const finalSaudara = Math.max(finalAnak, editJumlahSaudara);
                        setEditUrutanAnak(finalAnak);
                        setEditJumlahSaudara(finalSaudara);
                        onUpdateProfile({ 
                          gender: editGender, 
                          anak_ke: finalAnak, 
                          dari_bersaudara: finalSaudara, 
                          urutanAnak: finalAnak, 
                          jumlahSaudara: finalSaudara 
                        }); 
                        setActiveEditModal(null); 
                        triggerToast('Status keluarga berhasil diperbarui'); 
                      }} 
                      className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= EDIT MODAL: NIK & NOMOR KK ================= */}
            {activeEditModal === 'nik_kk' && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
                <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                    <h3 className="font-bold text-sm text-slate-900">Ubah NIK & Nomor Kartu Keluarga</h3>
                    <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Nomor Induk Kependudukan (NIK)</label>
                      <input
                        type="text"
                        maxLength={16}
                        value={editNik}
                        onChange={(e) => setEditNik(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="16 digit NIK KTP"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Nomor Kartu Keluarga (No. KK)</label>
                      <input
                        type="text"
                        maxLength={16}
                        value={editNoKk}
                        onChange={(e) => setEditNoKk(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="16 digit Nomor KK"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
                    <button type="button" onClick={() => { onUpdateProfile({ nik: editNik, noKk: editNoKk }); setActiveEditModal(null); triggerToast('NIK & No. KK berhasil disimpan'); }} className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= EDIT MODAL: KONTAK ================= */}
            {activeEditModal === 'kontak' && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
                <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                    <h3 className="font-bold text-sm text-slate-900">Ubah Kontak WhatsApp & Email</h3>
                    <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="08xxxxxxxxxx"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Alamat Email</label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
                        placeholder="nama@email.com"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
                    <button type="button" onClick={() => { onUpdateProfile({ phone: editPhone, email: editEmail }); setActiveEditModal(null); triggerToast('Kontak berhasil diperbarui'); }} className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= EDIT MODAL: PEKERJAAN ================= */}
            {activeEditModal === 'pekerjaan' && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
                <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                    <h3 className="font-bold text-sm text-slate-900">Ubah Pekerjaan & Instansi</h3>
                    <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Profesi / Pekerjaan</label>
                      <input
                        type="text"
                        value={editOccupation}
                        onChange={(e) => setEditOccupation(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
                        placeholder="Guru / Wiraswasta / Pegawai"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Instansi / Lembaga / Usaha</label>
                      <input
                        type="text"
                        value={editInstitution}
                        onChange={(e) => setEditInstitution(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
                        placeholder="Nama tempat bekerja atau usaha"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
                    <button type="button" onClick={() => { onUpdateProfile({ occupation: editOccupation, institution: editInstitution }); setActiveEditModal(null); triggerToast('Pekerjaan berhasil diperbarui'); }} className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= EDIT MODAL: BIO ================= */}
            {activeEditModal === 'bio' && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
                <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                    <h3 className="font-bold text-sm text-slate-900">Ubah Bio</h3>
                    <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Bio / Catatan Singkat</label>
                      <div className="relative">
                        <textarea
                          rows={3}
                          maxLength={150}
                          value={editBio}
                          onChange={(e) => setEditBio(e.target.value.slice(0, 150))}
                          className="w-full px-3 py-2 pb-6 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs resize-none"
                          placeholder="Tulis pesan atau bio singkat Anda (maks. 150 karakter)..."
                        />
                        <div className="absolute bottom-2 right-3 text-[11px] font-mono text-slate-400 pointer-events-none select-none">
                          {editBio.length}/150
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer hover:bg-slate-50">Batal</button>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateProfile({ bio: editBio });
                        setActiveEditModal(null);
                        triggerToast('Bio berhasil diperbarui');
                      }}
                      className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= EDIT MODAL: TANGGAL MASUK (BOTTOM SHEET PERSIS SCREENSHOT) ================= */}
            {activeEditModal === 'tanggal_masuk' && (
              <div 
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex flex-col justify-end animate-in fade-in"
                onClick={() => setActiveEditModal(null)}
              >
                <div 
                  className="w-full max-w-md mx-auto bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl p-6 pt-5 pb-8 flex flex-col items-center animate-in slide-in-from-bottom duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Handle Drag Bar */}
                  <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-4" />

                  {/* Header Title (Tanpa Tab Date/Time & Tanpa June 2026) */}
                  <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 text-center mb-5 tracking-tight">
                    Atur Tanggal Masuk
                  </h3>
                  
                  {/* Date Wheel Picker 3 Kolom (Tgl - Bln - Thn) */}
                  <DateWheelPicker
                    value={tempEntryDate}
                    onChange={(newVal) => setTempEntryDate(newVal)}
                  />

                  {/* Tombol Bawah Bahasa Indonesia: Batal | Simpan (Mati jika tidak ada perubahan) */}
                  <div className="w-full mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveEditModal(null)}
                      className="flex-1 py-2 text-center text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
                    >
                      Batal
                    </button>

                    <div className="h-6 w-px bg-slate-200" />

                    <button
                      type="button"
                      disabled={tempEntryDate === editEntryDate}
                      onClick={() => {
                        if (tempEntryDate === editEntryDate) return;
                        setEditEntryDate(tempEntryDate);
                        const yr = tempEntryDate.split('-')[0] || editEntryYear;
                        setEditEntryYear(yr);
                        onUpdateProfile({ entryDate: tempEntryDate, entryYear: yr });
                        setActiveEditModal(null);
                        triggerToast('Tanggal masuk berhasil diperbarui');
                      }}
                      className={`flex-1 py-2 text-center text-sm transition-all ${
                        tempEntryDate === editEntryDate
                          ? 'text-slate-300 font-semibold cursor-not-allowed select-none'
                          : 'text-sky-600 hover:text-sky-700 font-bold cursor-pointer active:scale-95'
                      }`}
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= EDIT MODAL: TANGGAL KELUAR (BOTTOM SHEET PERSIS SCREENSHOT) ================= */}
            {activeEditModal === 'tanggal_keluar' && (
              <div 
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex flex-col justify-end animate-in fade-in"
                onClick={() => setActiveEditModal(null)}
              >
                <div 
                  className="w-full max-w-md mx-auto bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl p-6 pt-5 pb-8 flex flex-col items-center animate-in slide-in-from-bottom duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Handle Drag Bar */}
                  <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-4" />

                  {/* Header Title (Tanpa Tab Date/Time & Tanpa June 2026) */}
                  <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 text-center mb-5 tracking-tight">
                    Atur Tanggal Keluar
                  </h3>
                  
                  {/* Date Wheel Picker 3 Kolom (Tgl - Bln - Thn) */}
                  <DateWheelPicker
                    value={tempGradDate}
                    onChange={(newVal) => setTempGradDate(newVal)}
                  />

                  {/* Tombol Bawah Bahasa Indonesia: Batal | Simpan (Mati jika tidak ada perubahan) */}
                  <div className="w-full mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveEditModal(null)}
                      className="flex-1 py-2 text-center text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
                    >
                      Batal
                    </button>

                    <div className="h-6 w-px bg-slate-200" />

                    <button
                      type="button"
                      disabled={tempGradDate === editGradDate}
                      onClick={() => {
                        if (tempGradDate === editGradDate) return;
                        setEditGradDate(tempGradDate);
                        const yr = tempGradDate.split('-')[0] || editGradYear;
                        setEditGradYear(yr);
                        onUpdateProfile({ gradDate: tempGradDate, gradYear: yr });
                        setActiveEditModal(null);
                        triggerToast('Tanggal keluar berhasil diperbarui');
                      }}
                      className={`flex-1 py-2 text-center text-sm transition-all ${
                        tempGradDate === editGradDate
                          ? 'text-slate-300 font-semibold cursor-not-allowed select-none'
                          : 'text-sky-600 hover:text-sky-700 font-bold cursor-pointer active:scale-95'
                      }`}
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= MODAL INFO: NIS, NISM, NISN (TERKUNCI) ================= */}
            {activeEditModal === 'pendidikan_info' && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
                <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                    <h3 className="font-bold text-sm text-slate-900">Data Induk Registrasi Santri</h3>
                    <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">NIS Pesantren:</span>
                        <span className="font-mono font-bold text-slate-800">{alumni.nis}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">NISM Madrasah:</span>
                        <span className="font-mono font-bold text-slate-800">{editNism || alumni.nism || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">NISN Nasional:</span>
                        <span className="font-mono font-bold text-slate-800">{editNisn || alumni.nisn || '-'}</span>
                      </div>
                    </div>
                    <div className="p-2.5 bg-amber-50 border border-amber-200/80 rounded-2xl text-[11px] text-amber-800 flex items-start gap-2">
                      <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>Nomor registrasi santri diterbitkan resmi oleh Sekretariat Pondok Pesantren At-taroqqy dan Kemenag RI sehingga tidak dapat diubah sembarangan oleh akun mandiri.</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => setActiveEditModal(null)} className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer">Tutup</button>
                </div>
              </div>
            )}

            {/* ================= EDIT MODAL: INFORMASI AYAH ================= */}
            {activeEditModal === 'ayah' && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
                <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                    <h3 className="font-bold text-sm text-slate-900">Ubah Informasi Ayah Kandung</h3>
                    <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Ayah</label>
                      <input
                        type="text"
                        value={editNamaAyah}
                        onChange={(e) => setEditNamaAyah(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
                        placeholder="Nama lengkap ayah"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">NIK Ayah (16 digit)</label>
                      <input
                        type="text"
                        maxLength={16}
                        value={editNikAyah}
                        onChange={(e) => setEditNikAyah(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="NIK KTP Ayah"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Pekerjaan Ayah</label>
                      <input
                        type="text"
                        value={editPekerjaanAyah}
                        onChange={(e) => setEditPekerjaanAyah(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
                        placeholder="Petani / Guru / Wiraswasta"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Pendidikan Terakhir Ayah</label>
                      <input
                        type="text"
                        value={editPendidikanAyah}
                        onChange={(e) => setEditPendidikanAyah(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
                        placeholder="SMA / S1 / Pesantren"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
                    <button type="button" onClick={() => { onUpdateProfile({ namaAyah: editNamaAyah, nikAyah: editNikAyah, pekerjaanAyah: editPekerjaanAyah, pendidikanAyah: editPendidikanAyah }); setActiveEditModal(null); triggerToast('Data ayah berhasil disimpan'); }} className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= EDIT MODAL: INFORMASI IBU ================= */}
            {activeEditModal === 'ibu' && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
                <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                    <h3 className="font-bold text-sm text-slate-900">Ubah Informasi Ibu Kandung</h3>
                    <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Ibu</label>
                      <input
                        type="text"
                        value={editNamaIbu}
                        onChange={(e) => setEditNamaIbu(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
                        placeholder="Nama lengkap ibu"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">NIK Ibu (16 digit)</label>
                      <input
                        type="text"
                        maxLength={16}
                        value={editNikIbu}
                        onChange={(e) => setEditNikIbu(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="NIK KTP Ibu"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Pekerjaan Ibu</label>
                      <input
                        type="text"
                        value={editPekerjaanIbu}
                        onChange={(e) => setEditPekerjaanIbu(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
                        placeholder="Ibu Rumah Tangga / Guru / Wiraswasta"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Pendidikan Terakhir Ibu</label>
                      <input
                        type="text"
                        value={editPendidikanIbu}
                        onChange={(e) => setEditPendidikanIbu(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
                        placeholder="SMA / S1 / Pesantren"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
                    <button type="button" onClick={() => { onUpdateProfile({ namaIbu: editNamaIbu, nikIbu: editNikIbu, pekerjaanIbu: editPekerjaanIbu, pendidikanIbu: editPendidikanIbu }); setActiveEditModal(null); triggerToast('Data ibu berhasil disimpan'); }} className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= EDIT MODAL: USERNAME ================= */}
            {activeEditModal === 'username' && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
                <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                    <h3 className="font-bold text-sm text-slate-900">Ganti Username</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setNewUsernameInput('');
                        setUsernameStatus('idle');
                        setActiveEditModal(null);
                      }}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3.5 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Username Saat Ini</label>
                      <div className="px-3.5 py-2.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 select-all border border-slate-200/60">
                        {editUsername || alumni.username ? `@${editUsername || alumni.username}` : 'Belum diatur'}
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Username Baru</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-400 font-bold">@</span>
                        <input
                          type="text"
                          value={newUsernameInput}
                          onChange={(e) => handleUsernameInputChange(e.target.value)}
                          className="w-full pl-7 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
                          placeholder="username_baru"
                        />
                        <div className="absolute right-3 top-2.5 flex items-center justify-center">
                          {isCheckingUsername && (
                            <Loader2 className="w-4 h-4 text-sky-600 animate-spin" />
                          )}
                          {!isCheckingUsername && usernameStatus === 'available' && (
                            <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                          {!isCheckingUsername && usernameStatus === 'taken' && (
                            <div className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center">
                              <X className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      </div>
                      {usernameStatus === 'taken' && (
                        <p className="text-[11px] text-rose-600 mt-1 font-medium">Username sudah digunakan</p>
                      )}
                      {usernameStatus === 'available' && (
                        <p className="text-[11px] text-emerald-600 mt-1 font-medium">Username tersedia</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setNewUsernameInput('');
                        setUsernameStatus('idle');
                        setActiveEditModal(null);
                      }}
                      className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer hover:bg-slate-50"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      disabled={isCheckingUsername || usernameStatus === 'taken' || !newUsernameInput.trim()}
                      onClick={() => {
                        if (!newUsernameInput.trim()) return;
                        if (usernameStatus === 'taken') {
                          triggerToast('Username sudah dipakai');
                          return;
                        }
                        setEditUsername(newUsernameInput.trim());
                        onUpdateProfile({ username: newUsernameInput.trim() });
                        setActiveEditModal(null);
                        setNewUsernameInput('');
                        setUsernameStatus('idle');
                        triggerToast('Username berhasil diperbarui');
                      }}
                      className={`flex-1 py-2 rounded-xl text-white font-bold text-xs transition-colors ${
                        isCheckingUsername || usernameStatus === 'taken' || !newUsernameInput.trim()
                          ? 'bg-blue-300 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                      }`}
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= EDIT MODAL: ALAMAT & DOMISILI ================= */}
            {activeEditModal === 'alamat' && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
                <div className="bg-white rounded-3xl p-5 w-full max-w-lg max-h-[88vh] overflow-y-auto space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                    <h3 className="font-bold text-sm text-slate-900">Alamat & Titik Domisili</h3>
                    <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="text-xs">
                    <WilayahAddressFilter
                      province={editProvince}
                      city={editCity}
                      kecamatan={editKecamatan}
                      desa={editDesa}
                      alamatLengkap={editAlamatLengkap}
                      coordinates={editCoordinates}
                      showAlamatLengkap={true}
                      showLocationTag={true}
                      onChange={(vals) => {
                        setEditProvince(vals.province);
                        setEditCity(vals.city);
                        setEditKecamatan(vals.kecamatan);
                        setEditDesa(vals.desa);
                        if (vals.alamatLengkap !== undefined) setEditAlamatLengkap(vals.alamatLengkap);
                        setEditCoordinates(vals.coordinates || null);
                      }}
                    />
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
                    <button 
                      type="button" 
                      onClick={() => { 
                        onUpdateProfile({ 
                          province: editProvince, 
                          city: editCity, 
                          kecamatan: editKecamatan, 
                          desa: editDesa, 
                          alamatLengkap: editAlamatLengkap, 
                          coordinates: editCoordinates || undefined 
                        }); 
                        setActiveEditModal(null); 
                        triggerToast('Alamat & titik domisili berhasil disimpan'); 
                      }} 
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
                    >
                      Simpan Alamat
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= EDIT MODAL: GANTI KATA SANDI ================= */}
            {activeEditModal === 'password' && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
                <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                    <h3 className="font-bold text-sm text-slate-900">Ubah Kata Sandi Akun</h3>
                    <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Kata Sandi Baru</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
                        placeholder="Minimal 4 karakter"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Ulangi Kata Sandi Baru</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
                        placeholder="Ketik ulang kata sandi baru"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setNewPassword('');
                        setConfirmPassword('');
                        setActiveEditModal(null);
                      }}
                      className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newPassword || newPassword.length < 4) {
                          triggerToast('Kata sandi minimal 4 karakter');
                          return;
                        }
                        if (newPassword !== confirmPassword) {
                          triggerToast('Konfirmasi kata sandi tidak cocok!');
                          return;
                        }
                        onUpdateProfile({ password: newPassword, isPasswordChanged: true });
                        setNewPassword('');
                        setConfirmPassword('');
                        setActiveEditModal(null);
                        triggerToast('Kata sandi akun berhasil diubah');
                      }}
                      className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
                    >
                      Simpan Sandi
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 5: HALAMAN PEMBERITAHUAN TERSENDIRI ================= */}
        {activeTab === 'notifications' && (
          <div className="space-y-4 max-w-md mx-auto w-full pb-6">
            {/* 1. TOP HEADER PEMBERITAHUAN */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 pt-1">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('home')}
                  className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                  title="Kembali ke Beranda"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="font-display font-bold text-lg text-slate-900 leading-tight">
                  Pemberitahuan
                </h1>
              </div>

              {notifications.some((n) => !n.read) && (
                <button
                  type="button"
                  onClick={handleMarkAllNotificationsRead}
                  className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1.5 cursor-pointer bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl border border-sky-100 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Tandai dibaca</span>
                </button>
              )}
            </div>

            {/* 2. SUB-TAB FILTER PEMBERITAHUAN */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/70 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setNotifFilter('all')}
                className={`flex-1 py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  notifFilter === 'all'
                    ? 'bg-white text-sky-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Semua</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-mono">
                  {notifications.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setNotifFilter('interaction')}
                className={`flex-1 py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  notifFilter === 'interaction'
                    ? 'bg-white text-sky-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Interaksi</span>
              </button>

              <button
                type="button"
                onClick={() => setNotifFilter('finance')}
                className={`flex-1 py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  notifFilter === 'finance'
                    ? 'bg-white text-sky-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Keuangan</span>
              </button>
            </div>

            {/* 3. DAFTAR KARTU PEMBERITAHUAN */}
            <div className="space-y-3">
              {filteredNotifications.length === 0 ? (
                <div className="py-12 text-center bg-white rounded-3xl border border-slate-200/80 p-6 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 mx-auto flex items-center justify-center">
                    <Bell className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-800">Belum Ada Pemberitahuan</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Pemberitahuan interaksi komentar, balasan alumni, dan konfirmasi sistem keuangan akan muncul di sini.
                  </p>
                </div>
              ) : (
                filteredNotifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleNotificationRead(item.id)}
                    className={`rounded-2xl p-4 border transition-all cursor-pointer relative ${
                      !item.read
                        ? 'bg-sky-50/70 border-sky-200/80 shadow-xs'
                        : 'bg-white border-slate-200/80 hover:bg-slate-50/80'
                    }`}
                  >
                    {!item.read && (
                      <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-sky-600 ring-2 ring-white" />
                    )}

                    <div className="flex items-start gap-3">
                      {/* Icon type */}
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                          item.type === 'reply'
                            ? 'bg-sky-100 text-sky-700'
                            : item.type === 'finance'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {item.type === 'reply' && <MessageCircle className="w-5 h-5" />}
                        {item.type === 'finance' && <Wallet className="w-5 h-5" />}
                        {item.type === 'system' && <ShieldAlert className="w-5 h-5" />}
                        {item.type === 'like' && <Heart className="w-5 h-5" />}
                      </div>

                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.type === 'reply'
                                ? 'bg-sky-200/60 text-sky-800'
                                : item.type === 'finance'
                                ? 'bg-emerald-200/60 text-emerald-800'
                                : 'bg-amber-200/60 text-amber-800'
                            }`}
                          >
                            {item.tag || (item.type === 'reply' ? 'Interaksi' : item.type === 'finance' ? 'Keuangan' : 'Sistem')}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {item.time}
                          </span>
                        </div>

                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                          {item.title}
                        </h4>

                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {item.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 6: HALAMAN PENGUMUMAN RESMI TERSENDIRI ================= */}
        {activeTab === 'announcements' && (
          <div className="space-y-4 max-w-md mx-auto w-full pb-20 relative">
            {/* Header Pengumuman dengan Tombol Kembali ke Home */}
            <div className="flex items-center gap-2.5 border-b border-slate-200/90 pb-3 pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('home')}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                title="Kembali ke Beranda"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="font-display font-bold text-base text-slate-900 leading-tight">
                Pengumuman
              </h2>
            </div>

            {/* Scope Filter Tags: Semua, Umum, Provinsi, Kabupaten, Kecamatan, Desa */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {(['Semua', 'Umum', 'Provinsi', 'Kabupaten', 'Kecamatan', 'Desa'] as const).map((tag) => {
                const isActive = alumniAnnouncementScopeFilter === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setAlumniAnnouncementScopeFilter(tag)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all border ${
                      isActive
                        ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            {/* Daftar Pengumuman Resmi (Tampilan Ala Agenda) */}
            <div className="space-y-5">
              {announcements
                .filter((a) => matchesAudienceTarget(a.targetAudience, alumni))
                .filter((a) => {
                  if (alumniAnnouncementScopeFilter === 'Semua') return true;
                  if (alumniAnnouncementScopeFilter === 'Umum') {
                    return (
                      !a.targetAudience ||
                      a.targetAudience.regionScope === 'semua' ||
                      (!a.targetAudience.provinceId &&
                        !a.targetAudience.regencyId &&
                        !a.targetAudience.districtId &&
                        !a.targetAudience.villageId)
                    );
                  }
                  if (alumniAnnouncementScopeFilter === 'Provinsi') {
                    return Boolean(a.targetAudience?.provinceId && !a.targetAudience?.regencyId);
                  }
                  if (alumniAnnouncementScopeFilter === 'Kabupaten') {
                    return Boolean(a.targetAudience?.regencyId && !a.targetAudience?.districtId);
                  }
                  if (alumniAnnouncementScopeFilter === 'Kecamatan') {
                    return Boolean(a.targetAudience?.districtId && !a.targetAudience?.villageId);
                  }
                  if (alumniAnnouncementScopeFilter === 'Desa') {
                    return Boolean(a.targetAudience?.villageId || a.targetAudience?.villageName);
                  }
                  return true;
                })
                .map((ann) => (
                <div
                  key={ann.id}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden"
                >
                  {/* 1. Header Kartu: Username Penulis Saja + Titik 3 Kanan Atas */}
                  <div className="p-4 flex items-center justify-between gap-3">
                    <div 
                      onClick={() => handleOpenAuthorProfile(ann.authorName, ann.authorHandle, ann.authorAvatar)}
                      className="flex items-center gap-3 min-w-0 cursor-pointer group select-none"
                      title="Lihat profil"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center group-hover:ring-2 group-hover:ring-sky-400 transition-all">
                        <img
                          src={ann.authorAvatar || logoPonpesImg}
                          alt={ann.authorHandle || ann.authorName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-display font-bold text-xs sm:text-sm text-slate-900 truncate leading-tight group-hover:text-sky-600 transition-colors">
                          {formatAuthorUsername(ann.authorHandle || ann.authorName)}
                        </h4>
                        {/* Keterangan Jangkauan & Waktu Upload */}
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200/90 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Globe className="w-2.5 h-2.5 text-sky-600" />
                            <span>{formatAudienceSummary(ann.targetAudience)}</span>
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {ann.postedAt || ann.date || 'Baru saja'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Titik 3 Kanan Atas */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveMenuAnnouncement(ann)}
                        className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                        title="Opsi Pengumuman"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 2. Media Poster / Multi-foto Carousel */}
                  {ann.images && ann.images.length > 0 && (
                    <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-slate-950 overflow-hidden select-none group">
                      {ann.images.length === 1 ? (
                        <div
                          onClick={() => setPreviewPhotoUrl(ann.images![0])}
                          className="w-full h-full cursor-pointer"
                        >
                          <img
                            src={ann.images[0]}
                            alt={ann.title}
                            className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-200"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar">
                          {ann.images.map((imgSrc, idx) => (
                            <div
                              key={idx}
                              onClick={() => setPreviewPhotoUrl(imgSrc)}
                              className="min-w-full w-full h-full flex-shrink-0 snap-center relative bg-slate-950 flex items-center justify-center cursor-pointer"
                            >
                              <img
                                src={imgSrc}
                                alt={`Foto ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Badge Counter Foto jika lebih dari 1 */}
                      {ann.images.length > 1 && (
                        <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-mono font-bold text-white tracking-wide shadow-md pointer-events-none">
                          {ann.images.length} Foto (Geser)
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. Caption & Detail Pengumuman */}
                  <div className="px-4 py-3 space-y-2 text-xs">
                    <div className="text-slate-800 text-xs">
                      <p 
                        onClick={() => toggleCaption(ann.id)}
                        className={`leading-relaxed cursor-pointer select-none ${expandedCaptions[ann.id] ? '' : 'line-clamp-2'}`}
                        title={expandedCaptions[ann.id] ? "Klik untuk menyembunyikan" : "Klik untuk membaca selengkapnya"}
                      >
                        <span className="font-bold text-slate-900 mr-1.5">{ann.title}</span>
                        <span className="text-slate-600 whitespace-pre-line">{ann.content}</span>
                      </p>

                      <button
                        type="button"
                        onClick={() => toggleCaption(ann.id)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-normal mt-1 cursor-pointer block select-none"
                      >
                        {expandedCaptions[ann.id] ? 'sembunyikan' : 'selengkapnya'}
                      </button>
                    </div>
                  </div>

                  {/* 4. Footer 3 Tombol: Suka (Ikon + Jumlah), Komentar (Ikon + Jumlah), Bagikan (Hanya Ikon) */}
                  <div className="border-t border-slate-100 grid grid-cols-3 divide-x divide-slate-100 bg-white">
                    {/* Tombol Suka */}
                    <button
                      type="button"
                      onClick={() => handleToggleLikeAnnouncement(ann.id)}
                      className={`py-2.5 px-2 flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer active:scale-95 ${
                        ann.isLiked
                          ? 'text-rose-600 hover:text-rose-700 bg-rose-50/40'
                          : 'text-slate-600 hover:text-rose-600 hover:bg-slate-50'
                      }`}
                      title="Sukai Pengumuman"
                    >
                      <Heart className={`w-4 h-4 transition-transform active:scale-125 ${ann.isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`} />
                      <span>{ann.likesCount || 0}</span>
                    </button>

                    {/* Tombol Komentar */}
                    <button
                      type="button"
                      onClick={() => setActiveCommentsAnnouncement(ann)}
                      className="py-2.5 px-2 flex items-center justify-center gap-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50/50 text-xs font-semibold transition-colors cursor-pointer active:scale-95"
                      title="Buka Komentar"
                    >
                      <MessageSquare className="w-4 h-4 text-slate-500" />
                      <span>{ann.commentsCount || 0}</span>
                    </button>

                    {/* Tombol Bagikan (Hanya Ikon) */}
                    <button
                      type="button"
                      onClick={() => handleShareAnnouncement(ann)}
                      className="py-2.5 px-2 flex items-center justify-center text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/50 text-xs font-semibold transition-colors cursor-pointer active:scale-95"
                      title="Bagikan Pengumuman"
                    >
                      <Share2 className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                </div>
              ))}

              {announcements
                .filter((a) => matchesAudienceTarget(a.targetAudience, alumni))
                .filter((a) => {
                  if (alumniAnnouncementScopeFilter === 'Semua') return true;
                  if (alumniAnnouncementScopeFilter === 'Umum') {
                    return (
                      !a.targetAudience ||
                      a.targetAudience.regionScope === 'semua' ||
                      (!a.targetAudience.provinceId &&
                        !a.targetAudience.regencyId &&
                        !a.targetAudience.districtId &&
                        !a.targetAudience.villageId)
                    );
                  }
                  if (alumniAnnouncementScopeFilter === 'Provinsi') {
                    return Boolean(a.targetAudience?.provinceId && !a.targetAudience?.regencyId);
                  }
                  if (alumniAnnouncementScopeFilter === 'Kabupaten') {
                    return Boolean(a.targetAudience?.regencyId && !a.targetAudience?.districtId);
                  }
                  if (alumniAnnouncementScopeFilter === 'Kecamatan') {
                    return Boolean(a.targetAudience?.districtId && !a.targetAudience?.villageId);
                  }
                  if (alumniAnnouncementScopeFilter === 'Desa') {
                    return Boolean(a.targetAudience?.villageId || a.targetAudience?.villageName);
                  }
                  return true;
                }).length === 0 && (
                <div className="bg-white rounded-3xl border border-slate-200/90 p-8 text-center text-slate-500 text-xs space-y-2">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-700">Tidak ada pengumuman</p>
                  <p className="text-slate-400 text-[11px]">
                    Belum ada informasi pada jangkauan {alumniAnnouncementScopeFilter}.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tombol Melayang Peta Alumni (HANYA ICON di Sudut Kanan Bawah, Tidak Ikut Scroll) */}
      {activeTab === 'directory' && (
        <button
          type="button"
          onClick={() => setIsDistributionMapOpen(true)}
          className="absolute right-4 bottom-18 z-40 w-12 h-12 rounded-full bg-gradient-to-tr from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white shadow-xl shadow-sky-600/40 border-2 border-white flex items-center justify-center cursor-pointer transition-all active:scale-90 hover:scale-105 select-none group"
          title="Lihat Peta Sebaran Alumni"
        >
          <Map className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
          <span className="sr-only">Lihat Peta Alumni</span>
        </button>
      )}

      {/* ================= BOTTOM BAR TABS ================= */}
      <div className="bg-white border-t border-slate-200 px-3 py-2 flex items-center justify-around shrink-0 select-none z-30">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'home' ? 'text-[#0284c7] font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'events' ? 'text-[#0284c7] font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">Agenda</span>
        </button>

        <button
          onClick={() => setActiveTab('directory')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'directory' ? 'text-[#0284c7] font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px]">Cari Alumni</span>
        </button>

        <button
          onClick={() => setActiveTab('finance')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'finance' ? 'text-[#0284c7] font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px]">Keuangan</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'profile' ? 'text-[#0284c7] font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">Profil</span>
        </button>
      </div>

      {/* ================= MODAL KTA DIGITAL BERSIH (HANYA KTA + 3 TOMBOL LINGKARAN DI BAWAH) ================= */}
      {showKtaCardModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setShowKtaCardModal(false)}
        >
          <div
            className="w-full max-w-sm flex flex-col items-center gap-5 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. KARTU TANDA ALUMNI (BERSIH TANPA UI LAIN) */}
            <div
              onClick={() => setIsCardFlipped(!isCardFlipped)}
              className="w-full aspect-[1.58/1] rounded-2xl p-4 sm:p-5 text-white shadow-2xl relative overflow-hidden cursor-pointer transition-all duration-300 transform select-none border border-white/20"
              style={{
                background: isCardFlipped
                  ? 'linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #0ea5e9 100%)'
                  : 'linear-gradient(135deg, #0284c7 0%, #0369a1 60%, #075985 100%)',
              }}
            >
              <div className="absolute inset-0 droplet-pattern opacity-15 pointer-events-none" />
              <div className="absolute -top-12 -right-12 w-44 h-44 bg-sky-400/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-amber-400/15 rounded-full blur-xl pointer-events-none" />

              {!isCardFlipped ? (
                /* SISI DEPAN KTA */
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white p-0.5 shadow-md border border-white/50 shrink-0 overflow-hidden flex items-center justify-center">
                        <img
                          src={logoPonpesImg}
                          alt="Logo Ponpes"
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                      <div>
                        <p className="text-[8px] font-mono tracking-widest text-sky-200 uppercase font-bold">
                          KARTU TANDA ALUMNI
                        </p>
                        <h4 className="text-xs font-bold font-display tracking-wide text-white">
                          Pondok Pesantren Attaroqqy
                        </h4>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 my-auto">
                    <div className="w-12 h-14 bg-white/10 border border-white/40 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                      {alumni.photoUrl ? (
                        <img src={alumni.photoUrl} alt={alumni.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">👨‍🎓</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] font-mono text-sky-200">NO: {alumni.nis}</p>
                      <h3 className="font-bold text-xs sm:text-sm leading-tight truncate text-white">
                        {alumni.name}
                      </h3>
                      <p className="text-[9px] text-sky-100 truncate mt-0.5">{alumni.jenjang}</p>
                      <p className="text-[9px] text-sky-200 truncate">{alumni.city}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-end pt-1.5 border-t border-white/20 text-[8px]">
                    <p className="text-sky-300 font-mono">PORTAL RESMI IKAPAZ AT-TAROQQY</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowQrModal(true);
                      }}
                      className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded border border-white/30 text-white cursor-pointer"
                    >
                      <QrCode className="w-3 h-3 text-amber-300" />
                      <span>QR Presensi</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* SISI BELAKANG KTA */
                <div className="relative z-10 h-full flex flex-col justify-between text-[9px]">
                  <div className="border-b border-white/20 pb-1 flex justify-between items-center">
                    <span className="font-bold font-display text-sky-200">KETENTUAN KTA ALUMNI</span>
                    <span className="font-mono text-slate-300 text-[8px]">TRQ-RULE-V2</span>
                  </div>

                  <div className="space-y-1 text-[8.5px] text-slate-200 leading-relaxed">
                    <p>1. Kartu keanggotaan resmi Ikatan Alumni Ponpes At-taroqqy (IKAPAZ).</p>
                    <p>2. Digunakan untuk identitas presensi reuni akbar dan jaringan pesantren.</p>
                    <p>3. Berlaku seumur hidup selama menjaga nama baik almamater.</p>
                  </div>

                  <div className="flex justify-between items-end pt-1 border-t border-white/20 text-[8px]">
                    <p className="text-sky-300 font-mono">www.attaroqqy.ac.id</p>
                    <p className="font-bold text-white">Pengasuh Pesantren</p>
                  </div>
                </div>
              )}
            </div>

            {/* 2. TIGA ICON TOMBOL DENGAN LINGKARAN DI BAWAHNYA: KIRI DOWNLOAD, TENGAH BALIK, KANAN BAGIKAN */}
            <div className="flex items-center justify-center gap-6 pt-1 select-none">
              {/* KIRI: DOWNLOAD */}
              <button
                type="button"
                onClick={() => triggerToast('KTA Digital berhasil disimpan ke galeri')}
                className="w-13 h-13 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 backdrop-blur-md border border-white/30 text-white flex items-center justify-center shadow-lg transition-all cursor-pointer"
                title="Unduh KTA Digital"
              >
                <Download className="w-5 h-5 text-white" />
              </button>

              {/* TENGAH: BALIK */}
              <button
                type="button"
                onClick={() => setIsCardFlipped(!isCardFlipped)}
                className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 backdrop-blur-md border border-white/35 text-white flex items-center justify-center shadow-xl transition-all cursor-pointer"
                title="Balik Kartu (Depan / Belakang)"
              >
                <RotateCw className={`w-6 h-6 text-white transition-transform duration-300 ${isCardFlipped ? 'rotate-180' : ''}`} />
              </button>

              {/* KANAN: BAGIKAN */}
              <button
                type="button"
                onClick={() => triggerToast('Tautan KTA disalin ke clipboard')}
                className="w-13 h-13 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 backdrop-blur-md border border-white/30 text-white flex items-center justify-center shadow-lg transition-all cursor-pointer"
                title="Bagikan KTA"
              >
                <Share2 className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL MENU UTAMA (QURAN, MAJMUAH, MAULID, AUROD) ================= */}
      {activeIslamicMenu && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
          onClick={() => setActiveIslamicMenu(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-5 space-y-4 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center">
                  {activeIslamicMenu === 'quran' && <BookOpen className="w-4 h-4 text-sky-600" />}
                  {activeIslamicMenu === 'majmuah' && <BookMarked className="w-4 h-4 text-sky-600" />}
                  {activeIslamicMenu === 'maulid' && <Scroll className="w-4 h-4 text-emerald-600" />}
                  {activeIslamicMenu === 'aurod' && <Flame className="w-4 h-4 text-amber-500" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 capitalize">
                    {activeIslamicMenu === 'quran' && "Al-Qur'an 30 Juz"}
                    {activeIslamicMenu === 'majmuah' && "Kitab Majmu'ah Syarif"}
                    {activeIslamicMenu === 'maulid' && 'Kitab Maulid Nabi'}
                    {activeIslamicMenu === 'aurod' && 'Aurod & Wirid Santri'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {activeIslamicMenu === 'quran' && 'Bacaan mushaf digital & terjemahan resmi'}
                    {activeIslamicMenu === 'majmuah' && 'Kumpulan doa mustajab & istighotsah masyayikh'}
                    {activeIslamicMenu === 'maulid' && "Simtudduror, Diba'i, Al-Barzanji, & Qasidah"}
                    {activeIslamicMenu === 'aurod' && 'Wirid ba’da sholat, Rotib Al-Haddad & Hizib'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveIslamicMenu(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of Content Items */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar text-xs">
              {activeIslamicMenu === 'quran' && (
                <div className="space-y-2">
                  {[
                    { no: 1, name: 'Al-Fatihah', meaning: 'Pembukaan', verses: 7, arabic: 'الفاتحة' },
                    { no: 36, name: 'Yasin', meaning: 'Jantung Al-Qur’an', verses: 83, arabic: 'يس' },
                    { no: 56, name: 'Al-Waqi’ah', meaning: 'Hari Kiamat', verses: 96, arabic: 'الواقعة' },
                    { no: 67, name: 'Al-Mulk', meaning: 'Kerajaan', verses: 30, arabic: 'الملك' },
                    { no: 55, name: 'Ar-Rahman', meaning: 'Yang Maha Pengasih', verses: 78, arabic: 'الرحمن' },
                    { no: 18, name: 'Al-Kahf', meaning: 'Gua', verses: 110, arabic: 'الكهف' },
                    { no: 112, name: 'Al-Ikhlas', meaning: 'Kemurnian Keesaan Allah', verses: 4, arabic: 'الإخلاص' },
                    { no: 113, name: 'Al-Falaq', meaning: 'Waktu Subuh', verses: 5, arabic: 'الفلق' },
                    { no: 114, name: 'An-Nas', meaning: 'Manusia', verses: 6, arabic: 'الناس' },
                  ].map((s) => (
                    <div
                      key={s.no}
                      onClick={() => triggerToast(`Membuka Surah ${s.name}`)}
                      className="p-3 rounded-2xl border border-slate-100 hover:border-sky-300 hover:bg-sky-50/50 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center">
                          {s.no}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{s.name}</p>
                          <p className="text-[11px] text-slate-400">{s.meaning} • {s.verses} Ayat</p>
                        </div>
                      </div>
                      <span className="font-arabic text-base text-slate-700">{s.arabic}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeIslamicMenu === 'majmuah' && (
                <div className="space-y-2">
                  {[
                    { title: 'Doa Kanzul Arsy', desc: 'Doa agung perbendaharaan Arsy' },
                    { title: 'Doa Akasyah', desc: 'Doa amalan para sholihin & sahabat' },
                    { title: 'Istighotsah Masyayikh Ponpes At-taroqqy', desc: 'Kumpulan munajat & doa pengetuk pintu langit' },
                    { title: 'Tahlil Lengkap & Doa Arwah', desc: 'Bacaan tahlil khususi masyayikh & ahlul bait' },
                    { title: 'Doa Nisfu Sya’ban & Akhir Tahun', desc: 'Doa pergantian masa penuh keberkahan' },
                  ].map((m, idx) => (
                    <div
                      key={idx}
                      onClick={() => triggerToast(`Membuka ${m.title}`)}
                      className="p-3 rounded-2xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <p className="font-bold text-slate-800 text-xs">{m.title}</p>
                        <p className="text-[11px] text-slate-400">{m.desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              )}

              {activeIslamicMenu === 'maulid' && (
                <div className="space-y-2">
                  {[
                    { title: 'Maulid Simtudduror', author: 'Al-Habib Ali bin Muhammad Al-Habsyi', rawi: 'Lengkap 15 Rawi & Mahalul Qiyam' },
                    { title: 'Maulid Ad-Diba’i', author: 'Al-Imam Abdurrahman Ad-Diba’i', rawi: 'Bait qasidah & sholawat pembuka' },
                    { title: 'Maulid Al-Barzanji', author: 'Sayyid Ja’far bin Hasan Al-Barzanji', rawi: 'Nasab mulia & akhlak Rasulullah SAW' },
                    { title: 'Maulid Dhiyaul Lami’', author: 'Al-Habib Umar bin Hafidz', rawi: 'Untaian cahaya maulid zaman kini' },
                    { title: 'Qashidah Burdah', author: 'Imam Al-Bushiri', rawi: '10 Fasal syair kecintaan kpd Nabi' },
                  ].map((m, idx) => (
                    <div
                      key={idx}
                      onClick={() => triggerToast(`Membuka ${m.title}`)}
                      className="p-3 rounded-2xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <p className="font-bold text-slate-800 text-xs">{m.title}</p>
                        <p className="text-[11px] text-slate-500 font-medium">{m.author}</p>
                        <p className="text-[10px] text-slate-400">{m.rawi}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              )}

              {activeIslamicMenu === 'aurod' && (
                <div className="space-y-2">
                  {[
                    { title: 'Wirid Ba’da Sholat Maktubah', desc: 'Dzikir harian santri usai 5 waktu' },
                    { title: 'Rotib Al-Haddad', desc: 'Al-Imam Abdullah bin Alwi Al-Haddad' },
                    { title: 'Rotib Al-Athos', desc: 'Al-Habib Umar bin Abdurrahman Al-Athos' },
                    { title: 'Hizib Bahr', desc: 'Al-Imam Abul Hasan Asy-Syadzili' },
                    { title: 'Hizib Nashr', desc: 'Doa perlindungan & kemenangan umat' },
                    { title: 'Sholawat Nariyah & Munjiyat', desc: 'Amalan pelepas kesulitan & hajat' },
                  ].map((a, idx) => (
                    <div
                      key={idx}
                      onClick={() => triggerToast(`Membuka ${a.title}`)}
                      className="p-3 rounded-2xl border border-slate-100 hover:border-amber-300 hover:bg-amber-50/50 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <p className="font-bold text-slate-800 text-xs">{a.title}</p>
                        <p className="text-[11px] text-slate-400">{a.desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL QR CODE PRESENSI REUNI */}
      {showQrModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowQrModal(false)}
        >
          <div 
            className="w-full max-w-xs bg-white rounded-3xl p-6 text-center space-y-4 shadow-2xl border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                QR Presensi Reuni
              </span>
              <button onClick={() => setShowQrModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner">
              {/* Simulated QR Code matrix */}
              <div className="w-40 h-40 bg-white p-2 rounded-xl border border-slate-300 flex flex-col items-center justify-center relative">
                <QrCode className="w-32 h-32 text-slate-900" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-7 h-7 bg-sky-600 rounded-md flex items-center justify-center text-white text-[9px] font-bold border-2 border-white shadow-sm">
                    TRQ
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="font-bold text-sm text-slate-900">{alumni.name}</p>
              <p className="text-xs font-mono text-sky-700">NIS: {alumni.nis}</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Tunjukkan QR code ini ke petugas panitia saat tiba di gerbang Ponpes At-taroqqy.
              </p>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* MODAL DETAIL ALUMNI (PERSIS REFERENSI DENGAN BOYONG 2024, BIO DENGAN TANDA PETIK, ALAMAT & MAP PREVIEW, WA & EMAIL SAJA) */}
      {selectedAlumniDetail && (
        <AlumniProfileCardModal
          isOpen={Boolean(selectedAlumniDetail)}
          alumni={
            selectedAlumniDetail.id === alumni.id
              ? { ...selectedAlumniDetail, ...alumni }
              : selectedAlumniDetail
          }
          currentUser={alumni}
          userGps={deviceGps}
          onClose={() => setSelectedAlumniDetail(null)}
        />
      )}

      {/* BOTTOM SHEET FILTER (SAMA PERSIS DENGAN KELOLA DATA ALUMNI ADMIN) */}
      {isFilterSheetOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex flex-col justify-end animate-in fade-in"
          onClick={() => setIsFilterSheetOpen(false)}
        >
          <div 
            className="w-full max-w-lg mx-auto bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle Drag Bar */}
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mt-3 mb-1" />

            {/* Sheet Header */}
            <div className="px-5 py-3 flex items-center justify-between border-b border-slate-100 relative z-10 bg-white">
              <h3 className="font-display font-bold text-sm text-slate-900">
                Filter Data Alumni
              </h3>
              <button
                onClick={() => setIsFilterSheetOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="p-5 space-y-4 text-xs relative z-30 overflow-visible">
              {/* Rentang Tanggal Masuk */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Rentang Tanggal Masuk (Tahun)
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

              {/* Rentang Tanggal Keluar */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Rentang Tanggal Keluar (Tahun)
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

              {/* Alamat Berdasarkan Wilayah */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">
                  Alamat Santri & Alumni
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

            {/* Actions */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsFilterSheetOpen(false)}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer text-center shadow-xs"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL FULLSCREEN BERSIH: POSTER EVENT (FIT LAYAR, PURE BLACK, ZOOM & PAN) ================= */}
      {fullscreenPosterUrl && (
        <FullscreenPhotoViewerModal
          photoUrl={fullscreenPosterUrl}
          name="Poster Event"
          onClose={() => setFullscreenPosterUrl(null)}
        />
      )}

      {/* ================= MODAL FULLSCREEN BERSIH: FOTO PROFIL (PINCH TO ZOOM & PAN) ================= */}
      {showFullscreenPhoto && (
        <FullscreenPhotoViewerModal
          photoUrl={editPhotoUrl}
          name={editName || alumni.name}
          onClose={() => setShowFullscreenPhoto(false)}
          onDelete={
            editPhotoUrl
              ? () => {
                  handleDeletePhoto();
                  setShowFullscreenPhoto(false);
                }
              : undefined
          }
        />
      )}

      {/* ================= MODAL TEKS KONFIRMASI RSVP (HADIR / TIDAK HADIR) ================= */}
      {rsvpModalData && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setRsvpModalData(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-5 space-y-4 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-600" />
                  <span>Konfirmasi Kehadiran Event</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRsvpModalData(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pilihan 3 Opsi: Hadir, Tidak Hadir, atau Belum Memutuskan / Batal Konfirmasi */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700 text-xs">
                Pilih Status Kehadiran:
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
                {/* 1. Opsi Hadir */}
                <button
                  type="button"
                  onClick={() => {
                    setRsvpModalData(prev => prev ? { ...prev, type: 'hadir' } : null);
                    if (!rsvpNoteInput || rsvpNoteInput === 'Mohon maaf belum bisa hadir') {
                      setRsvpNoteInput('Insya Allah saya hadir');
                    }
                  }}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    rsvpModalData.type === 'hadir'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  Hadir
                </button>

                {/* 2. Opsi Tidak Hadir */}
                <button
                  type="button"
                  onClick={() => {
                    setRsvpModalData(prev => prev ? { ...prev, type: 'tidak_hadir' } : null);
                    if (!rsvpNoteInput || rsvpNoteInput === 'Insya Allah saya hadir') {
                      setRsvpNoteInput('Mohon maaf belum bisa hadir');
                    }
                  }}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    rsvpModalData.type === 'tidak_hadir'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-rose-700'
                  }`}
                >
                  Tidak Hadir
                </button>

                {/* 3. Opsi Belum Memutuskan / Batal Konfirmasi */}
                <button
                  type="button"
                  onClick={() => {
                    setRsvpModalData(prev => prev ? { ...prev, type: 'belum_pasti' } : null);
                    setRsvpNoteInput('');
                  }}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    rsvpModalData.type === 'belum_pasti'
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Batalkan pilihan kehadiran dan kembalikan ke status belum konfirmasi"
                >
                  Belum Tahu
                </button>
              </div>

              {rsvpModalData.type === 'belum_pasti' && (
                <p className="text-[11px] text-amber-600 font-medium px-1">
                  *Memilih opsi ini akan membatalkan konfirmasi kehadiran Anda dan mengembalikan ke status awal.
                </p>
              )}
            </div>

            {/* Input Edit Tanggapan / Catatan */}
            {rsvpModalData.type !== 'belum_pasti' && (
              <div className="space-y-1.5 text-xs">
                <label className="block font-semibold text-slate-700">
                  Pesan / Catatan
                </label>
                <textarea
                  rows={3}
                  value={rsvpNoteInput}
                  onChange={(e) => setRsvpNoteInput(e.target.value)}
                  placeholder="Tulis pesan atau tanggapan Anda..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRsvpModalData(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRsvpModal}
                className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs transition-all shadow-xs cursor-pointer ${
                  rsvpModalData.type === 'hadir'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                    : rsvpModalData.type === 'tidak_hadir'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                    : 'bg-slate-700 hover:bg-slate-800 shadow-slate-700/20'
                }`}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL TANGGAPAN / KOMENTAR (PERSIS SCREENSHOT 2) ================= */}
      {activeCommentsModalEvent && (
        <EventCommentsModal
          event={activeCommentsModalEvent}
          comments={commentsList}
          currentUser={{
            name: alumni.name,
            username: alumni.username,
            photoUrl: alumni.photoUrl,
          }}
          onClose={() => setActiveCommentsModalEvent(null)}
          onAddComment={handleAddComment}
          onToggleLike={handleToggleLikeComment}
        />
      )}

      {/* ================= MODAL KOMENTAR PENGUMUMAN ================= */}
      {activeCommentsAnnouncement && (
        <EventCommentsModal
          targetId={activeCommentsAnnouncement.id}
          modalTitle="Komentar"
          hideAttendanceSummary={true}
          comments={commentsList}
          currentUser={{
            name: alumni.name,
            username: alumni.username,
            photoUrl: alumni.photoUrl,
          }}
          onClose={() => setActiveCommentsAnnouncement(null)}
          onAddComment={handleAddAnnouncementComment}
          onToggleLike={handleToggleLikeComment}
        />
      )}

      {/* ================= BOTTOM SHEET MENU TITIK 3 PENGUMUMAN ALUMNI ================= */}
      {activeMenuAnnouncement && (
        <div 
          className="fixed inset-0 z-[100020] bg-black/60 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-150"
          onClick={() => setActiveMenuAnnouncement(null)}
        >
          <div 
            className="bg-white rounded-t-3xl w-full max-w-lg p-5 pb-6 space-y-2 shadow-2xl border-t border-slate-200 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Drag Handle */}
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-2" />

            <div className="space-y-1">
              {/* 1. Salin Teks */}
              <button
                type="button"
                onClick={() => {
                  const ann = activeMenuAnnouncement;
                  setActiveMenuAnnouncement(null);
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(`*${ann.title}*\n\n${ann.content}\n\nInfo selengkapnya di Portal Alumni Ponpes At-Taroqqy`);
                  }
                  triggerToast('Teks pengumuman disalin');
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-colors cursor-pointer text-left"
              >
                <Copy className="w-5 h-5 text-slate-700 shrink-0" />
                <span>Salin Teks Pengumuman</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= BOTTOM SHEET FOTO SAMPUL (PERSIS SCREENSHOT REFERENSI) ================= */}
      {isCoverBottomSheetOpen && (
        <div 
          className="fixed inset-0 z-[100002] bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200"
          onClick={() => setIsCoverBottomSheetOpen(false)}
        >
          <div 
            className="w-full max-w-lg mx-auto bg-white rounded-t-[28px] shadow-2xl p-5 pt-3 pb-8 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle Bar */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-5" />

            <div className="space-y-1">
              {!editCoverPhotoUrl ? (
                /* Menu saat belum ada foto sampul: HANYA Upload Foto Sampul */
                <button
                  type="button"
                  onClick={() => {
                    setIsCoverBottomSheetOpen(false);
                    coverFileInputRef.current?.click();
                  }}
                  className="w-full flex items-center gap-4 py-3 px-2 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer text-left group"
                >
                  <div className="w-11 h-11 rounded-full bg-slate-100 group-hover:bg-slate-200 text-slate-800 flex items-center justify-center shrink-0 transition-colors">
                    <Upload className="w-5 h-5 text-slate-800" />
                  </div>
                  <span className="text-base font-semibold text-slate-900">
                    Upload foto sampul
                  </span>
                </button>
              ) : (
                /* Menu saat sudah ada foto sampul: Lihat foto sampul, Ubah foto sampul, Hapus foto sampul */
                <>
                  {/* Opsi 1: Lihat foto sampul */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCoverBottomSheetOpen(false);
                      setShowFullscreenCover(true);
                    }}
                    className="w-full flex items-center gap-4 py-3 px-2 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer text-left group"
                  >
                    <div className="w-11 h-11 rounded-full bg-slate-100 group-hover:bg-slate-200 text-slate-800 flex items-center justify-center shrink-0 transition-colors">
                      <ImageIcon className="w-5 h-5 text-slate-800" />
                    </div>
                    <span className="text-base font-semibold text-slate-900">
                      Lihat foto sampul
                    </span>
                  </button>

                  {/* Opsi 2: Ubah foto sampul */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCoverBottomSheetOpen(false);
                      coverFileInputRef.current?.click();
                    }}
                    className="w-full flex items-center gap-4 py-3 px-2 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer text-left group"
                  >
                    <div className="w-11 h-11 rounded-full bg-slate-100 group-hover:bg-slate-200 text-slate-800 flex items-center justify-center shrink-0 transition-colors">
                      <Pencil className="w-5 h-5 text-slate-800" />
                    </div>
                    <span className="text-base font-semibold text-slate-900">
                      Ubah foto sampul
                    </span>
                  </button>

                  {/* Opsi 3: Hapus foto sampul */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCoverBottomSheetOpen(false);
                      setEditCoverPhotoUrl(undefined);
                      onUpdateProfile({ coverPhotoUrl: undefined });
                      triggerToast('Foto sampul berhasil dihapus');
                    }}
                    className="w-full flex items-center gap-4 py-3 px-2 rounded-2xl hover:bg-rose-50 transition-colors cursor-pointer text-left group"
                  >
                    <div className="w-11 h-11 rounded-full bg-rose-100 group-hover:bg-rose-200 text-rose-600 flex items-center justify-center shrink-0 transition-colors">
                      <Trash2 className="w-5 h-5 text-rose-600" />
                    </div>
                    <span className="text-base font-semibold text-rose-600">
                      Hapus foto sampul
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN PREVIEW FOTO SAMPUL */}
      {showFullscreenCover && (
        <CleanMediaPreviewModal
          isOpen={showFullscreenCover}
          imageUrl={editCoverPhotoUrl || alumni.coverPhotoUrl || posterReuniImg}
          onClose={() => setShowFullscreenCover(false)}
        />
      )}

      {/* ================= MODAL PETA SEBARAN ALUMNI FULLSCREEN ================= */}
      <AlumniDistributionMapModal
        isOpen={isDistributionMapOpen}
        onClose={() => setIsDistributionMapOpen(false)}
        alumniList={allAlumni}
        currentUser={alumni}
        deviceGps={deviceGps}
        onSelectAlumni={(selected) => setSelectedAlumniDetail(selected)}
        onUpdateProfile={onUpdateProfile}
      />

      {/* FULLSCREEN PREVIEW FOTO LAMPIRAN PENGUMUMAN */}
      {previewPhotoUrl && (
        <CleanMediaPreviewModal
          isOpen={Boolean(previewPhotoUrl)}
          imageUrl={previewPhotoUrl}
          onClose={() => setPreviewPhotoUrl(null)}
        />
      )}
    </div>
  );
};
