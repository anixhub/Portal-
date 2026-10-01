import React, { useState } from 'react';
import { 
  LogOut, 
  Users, 
  UserPlus, 
  Calendar, 
  Search, 
  Edit, 
  KeyRound, 
  Sparkles, 
  ShieldCheck, 
  Eye, 
  Plus, 
  ArrowLeft, 
  ChevronRight,
  MapPin,
  Clock,
  Filter,
  X,
  RotateCcw
} from 'lucide-react';
import { AlumniRecord, AdminUser, EventAgenda } from '../types';
import { AddAlumniModal } from './admin/AddAlumniModal';
import { EditAlumniModal } from './admin/EditAlumniModal';
import { AlumniDetailAdminModal } from './admin/AlumniDetailAdminModal';
import { WilayahAddressFilter } from './common/WilayahAddressFilter';

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

type AdminScreen = 'home' | 'alumni' | 'events';

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
  const [currentScreen, setCurrentScreen] = useState<AdminScreen>('home');

  // Search & Filter for Master Data Alumni
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
  const [editingAlumni, setEditingAlumni] = useState<AlumniRecord | null>(null);
  const [detailAlumni, setDetailAlumni] = useState<AlumniRecord | null>(null);

  // Event modal state
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [newEvTitle, setNewEvTitle] = useState('');
  const [newEvDate, setNewEvDate] = useState('');
  const [newEvLocation, setNewEvLocation] = useState('');
  const [newEvDesc, setNewEvDesc] = useState('');

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

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvTitle.trim()) return;

    const created: EventAgenda = {
      id: 'ev-' + Date.now(),
      title: newEvTitle.trim(),
      date: newEvDate.trim() || '20 Oktober 2026',
      time: '08.30 - 15.00 WIB',
      location: newEvLocation.trim() || "Aula Ponpes At-taroqqy",
      category: 'reuni',
      description: newEvDesc.trim() || 'Agenda pertemuan silaturahmi alumni pondok pesantren.',
      attendeesCount: 0,
    };

    onAddEvent(created);
    setIsAddEventOpen(false);
    setNewEvTitle('');
    setNewEvDate('');
    setNewEvLocation('');
    setNewEvDesc('');
    triggerToast('Agenda baru berhasil dibuat!');
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 overflow-hidden relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-sky-800/95 text-white text-xs px-4 py-2 rounded-full shadow-xl border border-sky-600/40 backdrop-blur-md animate-in fade-in flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER ADMIN (CLEAN & MINIMALIST) - HANYA DI TAMPILAN NON-ALUMNI */}
      {currentScreen !== 'alumni' && (
        <div className="bg-sky-600 text-white px-5 py-3.5 shrink-0 flex items-center justify-between border-b border-sky-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold text-white shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-sm leading-tight text-white">
                Admin At-taroqqy
              </h2>
              <p className="text-[11px] text-sky-100">
                {admin.name}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold transition-all cursor-pointer"
            title="Keluar dari Panel Admin"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      )}

      {/* ================= 1. HALAMAN AWAL (2 MENU SANGAT MINIMALIS & BERSIH) ================= */}
      {currentScreen === 'home' && (
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 flex flex-col justify-center max-w-xl mx-auto w-full">
          <div className="mb-6 text-center">
            <h1 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900">
              Panel Pengelolaan
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Silakan pilih menu untuk mulai mengelola
            </p>
          </div>

          <div className="space-y-3.5">
            {/* MENU 1: MASTER DATA ALUMNI */}
            <div
              onClick={() => setCurrentScreen('alumni')}
              className="group bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-sky-400 transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-13 h-13 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center group-hover:scale-105 group-hover:bg-sky-600 group-hover:text-white transition-all shadow-xs">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900 group-hover:text-sky-700 transition-colors">
                    Master Data Alumni
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Lihat, olah detail, tambah alumni baru & reset sandi
                  </p>
                  <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100/80 text-sky-800">
                    {alumniList.length} Alumni Terdaftar
                  </span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-sky-50 text-slate-400 group-hover:text-sky-600 flex items-center justify-center shrink-0 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>

            {/* MENU 2: EVENT MANAGER */}
            <div
              onClick={() => setCurrentScreen('events')}
              className="group bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-amber-400 transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-13 h-13 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-xs">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900 group-hover:text-amber-700 transition-colors">
                    Event Manager
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kelola jadwal reuni akbar, haul masyayikh & kegiatan
                  </p>
                  <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100/80 text-amber-800">
                    {events.length} Agenda Aktif
                  </span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-amber-50 text-slate-400 group-hover:text-amber-600 flex items-center justify-center shrink-0 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 2. FOKUS: MASTER DATA ALUMNI ================= */}
      {currentScreen === 'alumni' && (
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Header Kelola Data Alumni */}
          <div className="bg-white border-b border-slate-200/90 px-4 py-3 shrink-0 flex items-center justify-between gap-3">
            <button
              onClick={() => setCurrentScreen('home')}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
              title="Kembali ke Menu"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <h2 className="font-display font-bold text-sm sm:text-base text-slate-900 text-center truncate flex-1">
              Kelola Data Alumni
            </h2>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-9 h-9 rounded-xl bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center transition-all shadow-xs shadow-sky-600/20 cursor-pointer shrink-0"
              title="Tambah Alumni Baru"
              aria-label="Tambah Alumni"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>

          {/* Content Area */}
          <div className="p-4 space-y-3 flex-1 overflow-y-auto">
            {/* Search & Filter Button - NOT inside a container */}
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

              {/* Tombol kecil filter sejajar di samping kanan */}
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
                  onClick={handleResetFilters}
                  className="font-bold underline text-sky-700 hover:text-sky-900 cursor-pointer"
                >
                  Reset Filter
                </button>
              </div>
            )}

            {/* Daftar Kartu Alumni (Card View) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredList.map((item) => {
                const addressText = [item.desa, item.kecamatan, item.city].filter(Boolean).join(', ') || item.province || 'Alamat belum diisi';

                return (
                  <div
                    key={item.id}
                    onClick={() => setDetailAlumni(item)}
                    className="bg-white rounded-2xl p-3.5 border border-slate-200/80 hover:border-sky-400 hover:shadow-md transition-all cursor-pointer flex items-center gap-3.5 group relative"
                  >
                    {/* Foto / Avatar */}
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

                    {/* Informasi: Nama & Alamat (Desa, Kecamatan, Kabupaten) */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-display font-bold text-sm text-slate-900 group-hover:text-sky-700 transition-colors truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs text-slate-500 capitalize truncate mt-0.5">
                        {addressText}
                      </p>
                    </div>

                    {/* Chevron Panah Detail */}
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all shrink-0 ml-auto" />
                  </div>
                );
              })}
            </div>

            {filteredList.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
                Tidak ditemukan data alumni dengan pencarian yang dipilih.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= 3. FOKUS: EVENT MANAGER ================= */}
      {currentScreen === 'events' && (
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Sub Header Navigation */}
          <div className="bg-white border-b border-slate-200 px-4 py-3 shrink-0 flex items-center justify-between">
            <button
              onClick={() => setCurrentScreen('home')}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 py-1.5 px-2.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Menu</span>
            </button>

            <button
              onClick={() => setIsAddEventOpen(true)}
              className="py-1.5 px-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm shadow-amber-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Buat Agenda Baru</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="p-4 space-y-3 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {events.map((ev) => (
                <div key={ev.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900">{ev.title}</h4>
                    <span className="text-[11px] font-semibold text-emerald-600 shrink-0 ml-2">
                      {ev.attendeesCount} Terdaftar
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">{ev.description}</p>

                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                    <p className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>{ev.date} · {ev.time}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="truncate">{ev.location}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH ALUMNI BARU */}
      {isAddModalOpen && (
        <AddAlumniModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={(data) => {
            onAddAlumni(data);
            triggerToast('Data alumni baru berhasil disimpan!');
          }}
        />
      )}

      {/* MODAL EDIT DATA ALUMNI */}
      {editingAlumni && (
        <EditAlumniModal
          isOpen={Boolean(editingAlumni)}
          alumni={editingAlumni}
          onClose={() => setEditingAlumni(null)}
          onSave={(id, updated) => {
            onUpdateAlumni(id, updated);
            triggerToast('Perubahan data berhasil disimpan!');
          }}
        />
      )}

      {/* MODAL / TAMPILAN DETAIL BIODATA LAYAR PENUH & EDIT ADMIN */}
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
            triggerToast('Perubahan data alumni berhasil disimpan!');
          }}
        />
      )}

      {/* MODAL TAMBAH AGENDA REUNI */}
      {isAddEventOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 space-y-3 shadow-2xl border border-slate-100">
            <h3 className="font-display font-bold text-base text-slate-900">Tambah Agenda Baru</h3>
            <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Agenda / Kegiatan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Reuni Akbar 2026"
                  value={newEvTitle}
                  onChange={(e) => setNewEvTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal & Waktu</label>
                <input
                  type="text"
                  placeholder="Contoh: 15 November 2026 · 08.00 WIB"
                  value={newEvDate}
                  onChange={(e) => setNewEvDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lokasi Kegiatan</label>
                <input
                  type="text"
                  placeholder="Contoh: Aula Ponpes At-taroqqy"
                  value={newEvLocation}
                  onChange={(e) => setNewEvLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Rincian kegiatan..."
                  value={newEvDesc}
                  onChange={(e) => setNewEvDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddEventOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-amber-600/20"
                >
                  Publikasikan Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOTTOM SHEET FILTER */}
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

              {/* Alamat Berdasarkan Provinsi, Kota/Kabupaten, Kecamatan, Desa */}
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
    </div>
  );
};
