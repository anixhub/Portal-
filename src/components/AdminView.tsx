import React, { useState, useRef } from 'react';
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
  Tag
} from 'lucide-react';
import { AlumniRecord, AdminUser, EventAgenda } from '../types';
import { AddAlumniModal } from './admin/AddAlumniModal';
import { AlumniDetailAdminModal } from './admin/AlumniDetailAdminModal';
import { WilayahAddressFilter } from './common/WilayahAddressFilter';
import { AlumniDistributionMapModal } from './common/AlumniDistributionMapModal';
import { CleanMediaPreviewModal } from './common/CleanMediaPreviewModal';
import logoPonpesImg from '../assets/images/logo_ponpes_attaroqqy_1790648746461.jpg';
import posterReuniImg from '../assets/images/poster_reuni_akbar_1790648045947.jpg';

interface AdminViewProps {
  admin: AdminUser;
  alumniList: AlumniRecord[];
  events: EventAgenda[];
  onLogout: () => void;
  onAddAlumni: (newAlumni: AlumniRecord) => void;
  onUpdateAlumni: (id: string, updated: Partial<AlumniRecord>) => void;
  onResetPassword: (id: string) => void;
  onAddEvent: (newEvent: EventAgenda) => void;
}

type AdminTab = 'agenda' | 'alumni' | 'profile';

export const AdminView: React.FC<AdminViewProps> = ({
  admin,
  alumniList,
  events,
  onLogout,
  onAddAlumni,
  onUpdateAlumni,
  onResetPassword,
  onAddEvent,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('agenda');
  const [eventList, setEventList] = useState<EventAgenda[]>(events);

  // Expanded caption toggles for agenda cards
  const [expandedCaptions, setExpandedCaptions] = useState<{ [id: string]: boolean }>({});
  const toggleCaption = (id: string) => {
    setExpandedCaptions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Search & Filter state for Kelola Alumni
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [filterEntryFrom, setFilterEntryFrom] = useState('');
  const [filterEntryTo, setFilterEntryTo] = useState('');
  const [filterGradFrom, setFilterGradFrom] = useState('');
  const [filterGradTo, setFilterGradTo] = useState('');
  const [filterProvince, setFilterProvince] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterKecamatan, setFilterKecamatan] = useState('');
  const [filterDesa, setFilterDesa] = useState('');

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
  const [eventTime, setEventTime] = useState('08.00 - 15.00 WIB');
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

  // Password modal state for Admin Profile
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newAdminPassword, setNewAdminPassword] = useState('');

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
    if (!newAdminPassword) return;
    setIsPasswordModalOpen(false);
    setNewAdminPassword('');
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

      {/* ================= TOP BAR (HANYA MUNCUL DI TAB PROFIL ADMIN, DI AGENDA & KELOLA ALUMNI DIHAPUS) ================= */}
      {activeTab === 'profile' && (
        <div className="bg-white border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between shrink-0 z-30 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-sky-100 flex items-center justify-center shrink-0 border border-slate-200">
              <img src={logoPonpesImg} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-sm font-bold font-display text-slate-900 leading-tight">
                IKAPAZ Attaroqqy
              </h1>
              <p className="text-[10px] text-slate-500 leading-none">
                Panel Administrator
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </span>
          </div>
        </div>
      )}

      {/* ================= BODY TAB CONTAINER ================= */}
      <div className="flex-1 overflow-y-auto flex flex-col relative">
        {/* ================= TAB 1: AGENDA (BERSIH TANPA HEADER) ================= */}
        {activeTab === 'agenda' && (
          <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full space-y-5 pb-28">
            {eventList.map((ev) => (
              <div
                key={ev.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden"
              >
                {/* 1. HEADER KARTU EVENT: PROFIL ADMIN PONDOK + TOMBOL EDIT & AKSI */}
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

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditEvent(ev)}
                      className="px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer active:scale-95"
                      title="Edit Agenda"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => triggerToast('Poster agenda berhasil diunduh')}
                      className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                      title="Unduh Poster"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => triggerToast('Tautan agenda disalin')}
                      className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                      title="Bagikan Agenda"
                    >
                      <Share2 className="w-4 h-4" />
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

                {/* 3. BARIS KETERANGAN KEHADIRAN (LANGSUNG KETERANGAN HADIR, TIDAK HADIR, RAGU) */}
                <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100 bg-white text-xs select-none">
                  <span className="font-semibold text-slate-500">
                    Status Respon:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Hadir: {ev.attendeesCount || 0}
                    </span>
                    <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                      Tidak: {ev.notAttendingCount || 0}
                    </span>
                    <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      Ragu: {ev.uncertainCount || 0}
                    </span>
                  </div>
                </div>

                {/* 4. CAPTION & DETAIL INFORMASI ACARA */}
                <div className="px-4 py-3 space-y-2.5 text-xs">
                  <div className="text-slate-800 text-xs">
                    <p className={`leading-relaxed ${expandedCaptions[ev.id] ? '' : 'line-clamp-2'}`}>
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

        {/* ================= TAB 2: KELOLA ALUMNI (BERSIH TANPA HEADER) ================= */}
        {activeTab === 'alumni' && (
          <div className="flex-1 overflow-y-auto px-4 py-4 max-w-2xl mx-auto w-full space-y-3.5 pb-28">
            {/* Search & Filter Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari NIK, NIS, nama, atau domisili..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-600 focus:outline-none shadow-2xs"
                />
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
              {filteredList.map((item) => {
                const addressText = item.shareFullAddress === false
                  ? [item.kecamatan, item.city].filter(Boolean).join(', ') || item.city || item.province || 'Alamat disembunyikan'
                  : [item.desa, item.kecamatan, item.city].filter(Boolean).join(', ') || item.province || 'Alamat belum diisi';

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
                          className="w-12 h-12 rounded-full object-cover border border-slate-100 ring-2 ring-slate-100 group-hover:ring-sky-200 transition-all"
                        />
                      ) : (
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-base shadow-2xs border border-white ring-2 ring-slate-100 group-hover:ring-sky-200 transition-all ${
                            item.gender === 'P'
                              ? 'bg-gradient-to-br from-rose-100 to-pink-200 text-rose-700'
                              : 'bg-gradient-to-br from-sky-100 to-blue-200 text-sky-800'
                          }`}
                        >
                          {item.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-display font-bold text-sm text-slate-900 group-hover:text-sky-700 transition-colors truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs text-slate-500 capitalize truncate mt-0.5">
                        {addressText}
                      </p>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all shrink-0 ml-auto" />
                  </div>
                );
              })}
            </div>

            {filteredList.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
                Tidak ditemukan data alumni dengan filter atau pencarian yang dipilih.
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: PROFIL ADMIN ================= */}
        {activeTab === 'profile' && (
          <div className="bg-[#f0f2fb] min-h-full flex flex-col">
            <div 
              className="relative w-full h-44 sm:h-52 overflow-hidden select-none shrink-0"
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 60%, #075985 100%)',
              }}
            >
              <div className="absolute inset-0 droplet-pattern opacity-15 pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-44 h-44 bg-sky-300/25 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-amber-300/20 rounded-full blur-xl pointer-events-none" />
            </div>

            <div className="bg-white rounded-t-[36px] shadow-sm px-6 pt-0 pb-24 space-y-6 flex-1 border-t border-slate-200/40 relative z-20 -mt-10 sm:-mt-12 max-w-2xl mx-auto w-full">
              <div className="text-center flex flex-col items-center relative -top-11 -mb-7">
                <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-full ring-4 ring-white shadow-lg overflow-hidden bg-gradient-to-tr from-sky-600 to-indigo-700 text-white font-bold text-3xl flex items-center justify-center">
                  {admin.name.charAt(0)}
                </div>

                <div className="mt-3">
                  <h3 className="font-display font-extrabold text-lg text-slate-900 leading-tight">
                    {admin.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {admin.jabatan || 'Pengurus Pondok'}
                  </p>
                  <span className="inline-block mt-1 text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-3 py-0.5 rounded-full">
                    Administrator Portal
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-400 font-medium">Nama Lengkap</span>
                    <span className="font-bold text-slate-800">{admin.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-400 font-medium">Email / ID</span>
                    <span className="font-bold text-slate-800">{admin.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-400 font-medium">Hak Akses</span>
                    <span className="font-bold text-emerald-600">Full Access Administrator</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/90 p-4 divide-y divide-slate-100 shadow-2xs">
                  <div
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="flex items-center justify-between py-3 cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-sky-50 text-slate-700 group-hover:text-sky-600 flex items-center justify-center transition-colors">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Ganti Kata Sandi</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  <div
                    onClick={onLogout}
                    className="flex items-center justify-between py-3 cursor-pointer hover:bg-rose-50/70 -mx-2 px-2 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                        <LogOut className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-rose-600">Keluar dari Akun</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= TOMBOL MELAYANG DI POJOK KANAN BAWAH ================= */}
      {/* 1. Tombol Melayang Tambah Agenda (Khusus Tab Agenda) */}
      {activeTab === 'agenda' && (
        <button
          type="button"
          onClick={handleOpenAddEvent}
          className="fixed bottom-20 right-5 z-40 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-sky-600 hover:bg-sky-700 text-white shadow-2xl flex items-center justify-center cursor-pointer transition-all active:scale-95 group"
          title="Tambah Agenda Baru"
        >
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" />
        </button>
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

      {/* ================= DOCKER / BOTTOM NAVIGATION (HANYA AGENDA, KELOLA ALUMNI, PROFIL ADMIN) ================= */}
      <div className="bg-white border-t border-slate-200 px-6 py-2 flex items-center justify-around shrink-0 select-none z-30 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('agenda')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'agenda' ? 'text-[#0284c7] font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">Agenda</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('alumni')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'alumni' ? 'text-[#0284c7] font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">Kelola Alumni</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-colors cursor-pointer ${
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
          currentUser={alumniList[0]}
          isAdmin={true}
          onSelectAlumni={(selected) => setDetailAlumni(selected)}
          onUpdateProfile={(updated) => {
            if (detailAlumni) {
              onUpdateAlumni(detailAlumni.id, updated);
            }
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

                  <div className="py-2.5 flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      placeholder="Tanggal (contoh: 20 Oktober 2026)"
                      className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                  </div>

                  <div className="py-2.5 flex items-center gap-3">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      placeholder="Waktu (contoh: 08.00 - 15.00 WIB)"
                      className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
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

      {/* ================= MODAL GANTI SANDI ADMIN ================= */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 space-y-4 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900">Ganti Kata Sandi Admin</h3>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdminPassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kata Sandi Baru</label>
                <input
                  type="password"
                  required
                  placeholder="Masukkan kata sandi baru..."
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
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
    </div>
  );
};
