import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ArrowLeft, 
  User, 
  Calendar, 
  Users, 
  CreditCard, 
  MapPin, 
  Phone, 
  Briefcase, 
  GraduationCap, 
  Clock, 
  KeyRound, 
  ChevronRight, 
  Camera,
  FileText,
  FileCheck,
  Trash2,
  AtSign,
  Check
} from 'lucide-react';
import { AlumniRecord } from '../../types';
import { WilayahAddressFilter } from '../common/WilayahAddressFilter';
import { FullscreenPhotoViewerModal } from '../common/FullscreenPhotoViewerModal';
import { LocationCoordinates } from '../common/FullscreenLocationMapModal';
import { useBackHandler } from '../../utils/navigationHistory';
import { getAlumniPhotoUrl } from '../../utils/photoUtils';
import { generateNisFromEntryDate, isUsernameTaken, formatBaseUsername } from '../../utils/alumniIdentityUtils';
import { DateWheelPicker } from '../common/DateWheelPicker';
import { formatToDDMMYYYY } from '../../utils/dateUtils';

interface AlumniDetailAdminModalProps {
  isOpen: boolean;
  alumni: AlumniRecord | null;
  existingAlumni?: AlumniRecord[];
  onClose: () => void;
  onResetPassword: (id: string) => void;
  onSave?: (id: string, updated: Partial<AlumniRecord>, fullRecord?: AlumniRecord) => void;
  onDeleteAlumni?: (id: string) => void;
}

export const AlumniDetailAdminModal: React.FC<AlumniDetailAdminModalProps> = ({
  isOpen,
  alumni,
  existingAlumni = [],
  onClose,
  onResetPassword,
  onSave,
  onDeleteAlumni,
}) => {
  if (!isOpen || !alumni) return null;

  // Active edit modal state for individual sections
  const [activeEditModal, setActiveEditModal] = useState<string | null>(null);
  const [showFullscreenPhoto, setShowFullscreenPhoto] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  // Penanganan tombol fisik kembali (Android hardware back & swipe back)
  useBackHandler(Boolean(showFullscreenPhoto), 'detail-admin-fullscreen-photo', () => setShowFullscreenPhoto(false));
  useBackHandler(Boolean(showDeleteConfirmModal), 'detail-admin-delete-modal', () => setShowDeleteConfirmModal(false));
  useBackHandler(Boolean(activeEditModal), 'detail-admin-edit-submodal', () => setActiveEditModal(null));
  useBackHandler(isOpen, 'detail-admin-root-modal', onClose);

  // Form edit states
  const [editPhotoUrl, setEditPhotoUrl] = useState(alumni.photoUrl || '');
  const [editName, setEditName] = useState(alumni.name);
  const [editTempatLahir, setEditTempatLahir] = useState(alumni.tempatLahir || '');
  const [editTanggalLahir, setEditTanggalLahir] = useState(alumni.tanggalLahir || '');
  const [editGender, setEditGender] = useState<'L' | 'P'>((alumni.gender as 'L' | 'P') || 'L');
  const [editUrutanAnak, setEditUrutanAnak] = useState<number | string>(
    alumni.anak_ke !== undefined && alumni.anak_ke !== null
      ? Number(alumni.anak_ke)
      : (alumni.urutanAnak !== undefined && alumni.urutanAnak !== null ? Number(alumni.urutanAnak) : 1)
  );
  const [editJumlahSaudara, setEditJumlahSaudara] = useState<number | string>(
    alumni.dari_bersaudara !== undefined && alumni.dari_bersaudara !== null
      ? Number(alumni.dari_bersaudara)
      : (alumni.jumlahSaudara !== undefined && alumni.jumlahSaudara !== null ? Number(alumni.jumlahSaudara) : 0)
  );
  const [editNik, setEditNik] = useState(alumni.nik || '');
  const [editNoKk, setEditNoKk] = useState(alumni.noKk || '');
  const [editPhone, setEditPhone] = useState(alumni.phone || '');
  const [editEmail, setEditEmail] = useState(alumni.email || '');
  const [editOccupation, setEditOccupation] = useState(alumni.occupation || '');
  const [editInstitution, setEditInstitution] = useState(alumni.institution || '');

  // Address
  const [editProvince, setEditProvince] = useState(alumni.province || '');
  const [editCity, setEditCity] = useState(alumni.city || '');
  const [editKecamatan, setEditKecamatan] = useState(alumni.kecamatan || '');
  const [editDesa, setEditDesa] = useState(alumni.desa || '');
  const [editAlamatLengkap, setEditAlamatLengkap] = useState(alumni.alamatLengkap || '');
  const [editCoordinates, setEditCoordinates] = useState(alumni.coordinates || null);

  // Riwayat Pendidikan Pondok
  const [editNis, setEditNis] = useState(alumni.nis || '');
  const [editNism, setEditNism] = useState(alumni.nism || '');
  const [editNisn, setEditNisn] = useState(alumni.nisn || '');
  const [editEntryDate, setEditEntryDate] = useState(alumni.entryDate || '');
  const [editGradDate, setEditGradDate] = useState(alumni.gradDate || '');
  const [tempEntryDate, setTempEntryDate] = useState(alumni.entryDate || '');
  const [tempGradDate, setTempGradDate] = useState(alumni.gradDate || '');

  // Parents
  const [editNamaAyah, setEditNamaAyah] = useState(alumni.namaAyah || '');
  const [editNikAyah, setEditNikAyah] = useState(alumni.nikAyah || '');
  const [editPekerjaanAyah, setEditPekerjaanAyah] = useState(alumni.pekerjaanAyah || '');
  const [editPendidikanAyah, setEditPendidikanAyah] = useState(alumni.pendidikanAyah || '');

  const [editNamaIbu, setEditNamaIbu] = useState(alumni.namaIbu || '');
  const [editNikIbu, setEditNikIbu] = useState(alumni.nikIbu || '');
  const [editPekerjaanIbu, setEditPekerjaanIbu] = useState(alumni.pekerjaanIbu || '');
  const [editPendidikanIbu, setEditPendidikanIbu] = useState(alumni.pendidikanIbu || '');

  // Username
  const [editUsername, setEditUsername] = useState(alumni.username || '');
  const [newAdminUsernameInput, setNewAdminUsernameInput] = useState('');
  const [adminUsernameError, setAdminUsernameError] = useState<string | null>(null);

  // Dedicated Draft states for submodals
  const [draftName, setDraftName] = useState('');
  const [draftTempatLahir, setDraftTempatLahir] = useState('');
  const [draftTanggalLahir, setDraftTanggalLahir] = useState('');
  const [draftGender, setDraftGender] = useState<'L' | 'P'>('L');
  const [draftUrutanAnak, setDraftUrutanAnak] = useState<number | string>(1);
  const [draftJumlahSaudara, setDraftJumlahSaudara] = useState<number | string>(0);
  const [draftNik, setDraftNik] = useState('');
  const [draftNoKk, setDraftNoKk] = useState('');
  const [draftPhone, setDraftPhone] = useState('');
  const [draftEmail, setDraftEmail] = useState('');
  const [draftOccupation, setDraftOccupation] = useState('');
  const [draftInstitution, setDraftInstitution] = useState('');
  const [draftProvince, setDraftProvince] = useState('');
  const [draftCity, setDraftCity] = useState('');
  const [draftKecamatan, setDraftKecamatan] = useState('');
  const [draftDesa, setDraftDesa] = useState('');
  const [draftAlamatLengkap, setDraftAlamatLengkap] = useState('');
  const [draftCoordinates, setDraftCoordinates] = useState<LocationCoordinates | null>(null);
  const [draftNis, setDraftNis] = useState('');
  const [draftNism, setDraftNism] = useState('');
  const [draftNisn, setDraftNisn] = useState('');
  const [draftNamaAyah, setDraftNamaAyah] = useState('');
  const [draftNikAyah, setDraftNikAyah] = useState('');
  const [draftPekerjaanAyah, setDraftPekerjaanAyah] = useState('');
  const [draftPendidikanAyah, setDraftPendidikanAyah] = useState('');
  const [draftNamaIbu, setDraftNamaIbu] = useState('');
  const [draftNikIbu, setDraftNikIbu] = useState('');
  const [draftPekerjaanIbu, setDraftPekerjaanIbu] = useState('');
  const [draftPendidikanIbu, setDraftPendidikanIbu] = useState('');

  const openEditModal = (modalKey: string) => {
    if (modalKey === 'nama') setDraftName(editName);
    if (modalKey === 'username') {
      setNewAdminUsernameInput(editUsername || alumni.username || '');
      setAdminUsernameError(null);
    }
    if (modalKey === 'ttl') {
      setDraftTempatLahir(editTempatLahir);
      setDraftTanggalLahir(editTanggalLahir);
    }
    if (modalKey === 'gender_saudara') {
      setDraftGender(editGender);
      setDraftUrutanAnak(editUrutanAnak);
      setDraftJumlahSaudara(editJumlahSaudara);
    }
    if (modalKey === 'nik_kk') {
      setDraftNik(editNik);
      setDraftNoKk(editNoKk);
    }
    if (modalKey === 'alamat') {
      setDraftProvince(editProvince);
      setDraftCity(editCity);
      setDraftKecamatan(editKecamatan);
      setDraftDesa(editDesa);
      setDraftAlamatLengkap(editAlamatLengkap);
      setDraftCoordinates(editCoordinates);
    }
    if (modalKey === 'kontak') {
      setDraftPhone(editPhone);
      setDraftEmail(editEmail);
    }
    if (modalKey === 'pekerjaan') {
      setDraftOccupation(editOccupation);
      setDraftInstitution(editInstitution);
    }
    if (modalKey === 'nis') setDraftNis(editNis);
    if (modalKey === 'nism') setDraftNism(editNism);
    if (modalKey === 'nisn') setDraftNisn(editNisn);
    if (modalKey === 'tanggal_masuk') setTempEntryDate(editEntryDate || '');
    if (modalKey === 'tanggal_keluar') setTempGradDate(editGradDate || '');
    if (modalKey === 'ayah') {
      setDraftNamaAyah(editNamaAyah);
      setDraftNikAyah(editNikAyah);
      setDraftPekerjaanAyah(editPekerjaanAyah);
      setDraftPendidikanAyah(editPendidikanAyah);
    }
    if (modalKey === 'ibu') {
      setDraftNamaIbu(editNamaIbu);
      setDraftNikIbu(editNikIbu);
      setDraftPekerjaanIbu(editPekerjaanIbu);
      setDraftPendidikanIbu(editPendidikanIbu);
    }
    setActiveEditModal(modalKey);
  };

  // Sinkronisasi state saat data alumni dari props berubah
  useEffect(() => {
    setEditPhotoUrl(alumni.photoUrl || '');
    setEditName(alumni.name);
    setEditUsername(alumni.username || '');
    setEditTempatLahir(alumni.tempatLahir || '');
    setEditTanggalLahir(alumni.tanggalLahir || '');
    setEditGender((alumni.gender as 'L' | 'P') || 'L');
    setEditUrutanAnak(
      alumni.anak_ke !== undefined && alumni.anak_ke !== null
        ? Number(alumni.anak_ke)
        : (alumni.urutanAnak !== undefined && alumni.urutanAnak !== null ? Number(alumni.urutanAnak) : 1)
    );
    setEditJumlahSaudara(
      alumni.dari_bersaudara !== undefined && alumni.dari_bersaudara !== null
        ? Number(alumni.dari_bersaudara)
        : (alumni.jumlahSaudara !== undefined && alumni.jumlahSaudara !== null ? Number(alumni.jumlahSaudara) : 0)
    );
    setEditNik(alumni.nik || '');
    setEditNoKk(alumni.noKk || '');
    setEditPhone(alumni.phone || '');
    setEditEmail(alumni.email || '');
    setEditOccupation(alumni.occupation || '');
    setEditInstitution(alumni.institution || '');
    setEditProvince(alumni.province || '');
    setEditCity(alumni.city || '');
    setEditKecamatan(alumni.kecamatan || '');
    setEditDesa(alumni.desa || '');
    setEditAlamatLengkap(alumni.alamatLengkap || '');
    setEditCoordinates(alumni.coordinates || null);
    setEditNis(alumni.nis || '');
    setEditNism(alumni.nism || '');
    setEditNisn(alumni.nisn || '');
    setEditEntryDate(alumni.entryDate || '');
    setEditGradDate(alumni.gradDate || '');
    setTempEntryDate(alumni.entryDate || '');
    setTempGradDate(alumni.gradDate || '');
    setEditNamaAyah(alumni.namaAyah || '');
    setEditNikAyah(alumni.nikAyah || '');
    setEditPekerjaanAyah(alumni.pekerjaanAyah || '');
    setEditPendidikanAyah(alumni.pendidikanAyah || '');
    setEditNamaIbu(alumni.namaIbu || '');
    setEditNikIbu(alumni.nikIbu || '');
    setEditPekerjaanIbu(alumni.pekerjaanIbu || '');
    setEditPendidikanIbu(alumni.pendidikanIbu || '');
  }, [alumni]);

  const photoFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUpdate = (updated: Partial<AlumniRecord>) => {
    const cleanNama = updated.name ?? (updated as any).nama ?? alumni.name;
    const fullMerged: AlumniRecord = {
      ...alumni,
      ...updated,
      name: cleanNama,
      status: 'alumni',
    };
    (fullMerged as any).nama = cleanNama;
    (fullMerged as any).status_keanggotaan = 'Alumni';

    const finalUpdates = {
      ...updated,
      ...(updated.name !== undefined ? { nama: cleanNama } : {}),
      status_keanggotaan: 'Alumni',
    };

    if (onSave) {
      onSave(alumni.id, finalUpdates, fullMerged);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const newUrl = event.target.result as string;
        setEditPhotoUrl(newUrl);
        handleUpdate({ photoUrl: newUrl });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = () => {
    setEditPhotoUrl('');
    handleUpdate({ photoUrl: '' });
  };

  const addressText = [editDesa, editKecamatan, editCity, editProvince].filter(Boolean).join(', ') || 'Alamat belum diatur';

  return (
    <div className="fixed inset-0 z-[100005] bg-[#f0f2fb] flex flex-col w-full h-full overflow-hidden animate-in fade-in select-none">
      {/* ================= TOP NAVIGATION BAR (TEKS "Detail Biodata Alumni", TANPA TOMBOL KANAN) ================= */}
      <div className="bg-white px-4 py-3 border-b border-slate-200/80 shrink-0 z-30 shadow-2xs flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          title="Kembali"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h2 className="font-display font-bold text-sm sm:text-base text-slate-900 leading-tight text-center">
          Detail Biodata Alumni
        </h2>

        {/* Placeholder penyeimbang agar judul tetap tepat di tengah */}
        <div className="w-9 h-9 shrink-0" />
      </div>

      {/* ================= PROFILE BODY ================= */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full flex flex-col">
          {/* FOTO SAMPUL / COVER */}
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

          {/* WADAH KARTU PUTIH MELENGKUNG */}
          <div className="bg-white rounded-t-[36px] shadow-sm px-6 pt-0 pb-24 space-y-6 flex-1 border-t border-slate-200/40 relative z-20 -mt-10 sm:-mt-12">
            {/* Lingkaran Avatar dengan klik fullscreen dan tombol kamera */}
            <div className="text-center flex flex-col items-center relative -top-11 -mb-7">
              <div className="relative inline-block mb-1.5">
                <button
                  type="button"
                  onClick={() => setShowFullscreenPhoto(true)}
                  className="relative w-22 h-22 sm:w-24 sm:h-24 rounded-full ring-4 ring-white shadow-lg overflow-hidden bg-slate-200 flex items-center justify-center cursor-pointer group transition-transform active:scale-95"
                  title="Klik untuk melihat foto profil layar penuh"
                >
                  <div className="w-full h-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold text-3xl flex items-center justify-center">
                    {(editName || alumni.name).charAt(0)}
                  </div>
                  {editPhotoUrl && (
                    <img
                      src={getAlumniPhotoUrl(editPhotoUrl)}
                      alt={editName || alumni.name}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  )}
                </button>

                {/* Tombol Kamera Ganti Foto Profil Alumni oleh Admin */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    photoFileInputRef.current?.click();
                  }}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white shadow-md border border-slate-200/80 text-slate-700 hover:text-sky-600 flex items-center justify-center cursor-pointer active:scale-90 transition-all ring-2 ring-white z-10"
                  title="Ganti Foto Profil Alumni"
                >
                  <Camera className="w-4 h-4" />
                </button>

                <input
                  ref={photoFileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>

              <h2 className="font-display font-bold text-lg text-slate-900 tracking-tight">
                {editName || alumni.name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {[editKecamatan, editCity, editProvince].filter(Boolean).join(', ')}
              </p>
            </div>

            {/* SEGMEN 1: INFORMASI PRIBADI */}
            <div>
              <p className="text-xs font-semibold text-slate-400 text-center tracking-wide mb-3">
                Informasi Pribadi
              </p>

              <div className="divide-y divide-slate-100">
                {/* 1. Nama Lengkap */}
                <div
                  onClick={() => openEditModal('nama')}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">Nama Lengkap</p>
                      <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                        {editName}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* 1b. Username Alumni */}
                <div
                  onClick={() => openEditModal('username')}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <AtSign className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">Username Alumni</p>
                      <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                        {editUsername || alumni.username ? `@${editUsername || alumni.username}` : 'Belum diatur'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* 2. Tempat, Tanggal Lahir (TTL) */}
                <div
                  onClick={() => openEditModal('ttl')}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">Tempat, Tanggal Lahir</p>
                      <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                        {editTempatLahir ? `${editTempatLahir}, ` : ''}{editTanggalLahir ? formatToDDMMYYYY(editTanggalLahir) : 'Belum diisi'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* 3. Gender & Saudara */}
                <div
                  onClick={() => openEditModal('gender_saudara')}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">Jenis Kelamin & Jumlah Saudara</p>
                      <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                        {editGender === 'P' ? 'Perempuan' : 'Laki-laki'}
                        {editUrutanAnak ? `, Anak ke-${editUrutanAnak}` : ''}
                        {editJumlahSaudara !== undefined && editJumlahSaudara !== null
                          ? `, Jumlah saudara: ${editJumlahSaudara}`
                          : ''}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* 4. NIK & Nomor KK */}
                <div
                  onClick={() => openEditModal('nik_kk')}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">NIK & No. KK</p>
                      <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                        {editNik || '-'} · {editNoKk || '-'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* 5. Alamat */}
                <div
                  onClick={() => openEditModal('alamat')}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">Alamat Domisili</p>
                      <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                        {addressText}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* 6. Kontak WhatsApp & Email */}
                <div
                  onClick={() => openEditModal('kontak')}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">WhatsApp & Email</p>
                      <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                        {editPhone || '-'} · {editEmail || '-'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* 7. Pekerjaan & Instansi */}
                <div
                  onClick={() => openEditModal('pekerjaan')}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <Briefcase className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">Pekerjaan & Instansi</p>
                      <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                        {editOccupation || 'Alumni Pesantren'}
                        {editInstitution ? ` · ${editInstitution}` : ''}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>

            {/* SEGMEN 2: RIWAYAT PENDIDIKAN PONDOK (JENJANG & KAMAR DIHAPUS SESUAI PERMINTAAN) */}
            <div>
              <p className="text-xs font-semibold text-slate-400 text-center tracking-wide mb-3">
                Riwayat Pendidikan
              </p>

              <div className="divide-y divide-slate-100">
                {/* 1. NIS (Bisa diubah oleh Admin) */}
                <div
                  onClick={() => openEditModal('nis')}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">NIS (Nomor Induk Santri)</p>
                      <p className="text-sm font-semibold font-mono text-slate-800 truncate mt-0.5">
                        {editNis || '-'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* 2. NISM (Nomor Induk Santri Madrasah) */}
                <div
                  onClick={() => openEditModal('nism')}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">NISM (Nomor Induk Santri Madrasah)</p>
                      <p className="text-sm font-semibold font-mono text-slate-800 truncate mt-0.5">
                        {editNism || '-'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* 3. NISN (Nomor Induk Siswa Nasional) */}
                <div
                  onClick={() => openEditModal('nisn')}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <FileCheck className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">NISN (Nomor Induk Siswa Nasional)</p>
                      <p className="text-sm font-semibold font-mono text-slate-800 truncate mt-0.5">
                        {editNisn || '-'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* 4. Tanggal Masuk */}
                <div
                  onClick={() => openEditModal('tanggal_masuk')}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-sky-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">Tanggal Masuk</p>
                      <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                        {editEntryDate ? formatToDDMMYYYY(editEntryDate) : 'Belum diisi'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* 5. Tanggal Keluar */}
                <div
                  onClick={() => openEditModal('tanggal_keluar')}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-sky-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">Tanggal Keluar (Boyong)</p>
                      <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                        {editGradDate ? formatToDDMMYYYY(editGradDate) : (alumni.gradYear ? `Tahun ${alumni.gradYear}` : 'Belum diisi')}
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
                {/* 1. Ayah */}
                <div
                  onClick={() => openEditModal('ayah')}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">Data Ayah Kandung</p>
                      {editNamaAyah ? (
                        <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                          {editNamaAyah}{editNikAyah ? ` · NIK: ${editNikAyah}` : ''}{editPekerjaanAyah ? ` · ${editPekerjaanAyah}` : ''}{editPendidikanAyah ? ` · ${editPendidikanAyah}` : ''}
                        </p>
                      ) : (
                        <p className="text-sm font-normal text-slate-400 mt-0.5">Belum diisi</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* 2. Ibu */}
                <div
                  onClick={() => openEditModal('ibu')}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">Data Ibu Kandung</p>
                      {editNamaIbu ? (
                        <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                          {editNamaIbu}{editNikIbu ? ` · NIK: ${editNikIbu}` : ''}{editPekerjaanIbu ? ` · ${editPekerjaanIbu}` : ''}{editPendidikanIbu ? ` · ${editPendidikanIbu}` : ''}
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

            {/* SEGMEN 4: AKUN & KEAMANAN */}
            <div>
              <p className="text-xs font-semibold text-slate-400 text-center tracking-wide mb-3">
                Keamanan Akun
              </p>

              <div className="divide-y divide-slate-100">
                <div
                  onClick={() => onResetPassword(alumni.id)}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-amber-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <KeyRound className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 leading-tight">Reset Kata Sandi Akun</p>
                      <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                        Kembalikan kata sandi login alumni ini ke pengaturan awal
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-xl">
                    Reset
                  </span>
                </div>
              </div>
            </div>

            {/* TOMBOL HAPUS DATA ALUMNI (PALING BAWAH) */}
            <div className="pt-4 pb-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(true)}
                className="w-full py-3 px-4 rounded-2xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] shadow-2xs"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Hapus Data Alumni</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= POPUP KONFIRMASI HAPUS ALUMNI ================= */}
      {showDeleteConfirmModal && (
        <div 
          className="fixed inset-0 z-[100030] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in select-none"
          onClick={() => setShowDeleteConfirmModal(false)}
        >
          <div 
            className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3.5 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-900">
                Hapus Data Alumni?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Apakah Anda yakin ingin menghapus data alumni <b>"{alumni.name}"</b>? Tindakan ini akan menghapus seluruh data alumni dari portal.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  onDeleteAlumni?.(alumni.id);
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-md shadow-rose-600/20"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= FULLSCREEN PHOTO VIEWER (DENGAN X, HAPUS, ZOOM IN/OUT & GESER) ================= */}
      {showFullscreenPhoto && (
        <FullscreenPhotoViewerModal
          photoUrl={editPhotoUrl}
          name={editName || alumni.name}
          onClose={() => setShowFullscreenPhoto(false)}
          onDelete={editPhotoUrl ? handleDeletePhoto : undefined}
        />
      )}

      {/* ================= EDIT MODALS UNTUK SETIAP FIELD ================= */}
      {/* 1. EDIT NAMA */}
      {activeEditModal === 'nama' && (
        <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900">Ubah Nama Lengkap</h3>
              <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
              placeholder="Nama lengkap..."
            />
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button type="button" onClick={() => { 
                const trimmed = draftName.trim();
                if (!trimmed) return;
                setEditName(trimmed);
                handleUpdate({ name: trimmed }); 
                setActiveEditModal(null); 
              }} className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* 1b. EDIT USERNAME */}
      {activeEditModal === 'username' && (
        <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900">Ubah Username Alumni</h3>
              <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Username login bersifat unik. Spasi akan otomatis diganti underscore (_) dan tidak boleh sama dengan alumni lain.
              </p>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Username Baru</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">@</span>
                  <input
                    type="text"
                    value={newAdminUsernameInput}
                    onChange={(e) => {
                      const clean = formatBaseUsername(e.target.value);
                      setNewAdminUsernameInput(clean);
                      if (clean && isUsernameTaken(clean, existingAlumni, alumni.id)) {
                        setAdminUsernameError('Username sudah digunakan alumni lain');
                      } else {
                        setAdminUsernameError(null);
                      }
                    }}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
                    placeholder="username_baru"
                  />
                </div>
                {adminUsernameError && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{adminUsernameError}</p>
                )}
                {!adminUsernameError && newAdminUsernameInput && (
                  <p className="text-[11px] text-emerald-600 mt-1 font-medium">Username tersedia</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button
                type="button"
                disabled={!newAdminUsernameInput.trim() || Boolean(adminUsernameError)}
                onClick={() => {
                  const clean = formatBaseUsername(newAdminUsernameInput);
                  if (!clean) return;
                  if (isUsernameTaken(clean, existingAlumni, alumni.id)) {
                    setAdminUsernameError('Username sudah digunakan alumni lain');
                    return;
                  }
                  setEditUsername(clean);
                  handleUpdate({ username: clean });
                  setActiveEditModal(null);
                }}
                className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. EDIT TTL */}
      {activeEditModal === 'ttl' && (
        <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900">Ubah Tempat & Tanggal Lahir</h3>
              <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tempat Lahir</label>
                <input
                  type="text"
                  value={draftTempatLahir}
                  onChange={(e) => setDraftTempatLahir(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                  placeholder="Kota/Kabupaten kelahiran..."
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Lahir</label>
                <input
                  type="date"
                  value={draftTanggalLahir}
                  onChange={(e) => setDraftTanggalLahir(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button type="button" onClick={() => { 
                setEditTempatLahir(draftTempatLahir);
                setEditTanggalLahir(draftTanggalLahir);
                handleUpdate({ tempatLahir: draftTempatLahir, tanggalLahir: draftTanggalLahir }); 
                setActiveEditModal(null); 
              }} className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. EDIT GENDER & SAUDARA */}
      {activeEditModal === 'gender_saudara' && (
        <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900">Ubah Gender & Saudara</h3>
              <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin (gender)</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDraftGender('L')}
                    className={`p-2.5 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                      draftGender === 'L' ? 'bg-sky-50 border-sky-600 text-sky-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Laki-laki
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraftGender('P')}
                    className={`p-2.5 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                      draftGender === 'P' ? 'bg-rose-50 border-rose-600 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Perempuan
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Anak Ke</label>
                  <input
                    type="number"
                    min={1}
                    max={25}
                    value={draftUrutanAnak}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => e.currentTarget.select()}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === '') {
                        setDraftUrutanAnak('');
                        return;
                      }
                      const val = parseInt(raw, 10);
                      setDraftUrutanAnak(isNaN(val) ? '' : val);
                    }}
                    onBlur={() => {
                      if (draftUrutanAnak === '' || Number(draftUrutanAnak) < 1) {
                        setDraftUrutanAnak(1);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jumlah Saudara</label>
                  <input
                    type="number"
                    min={0}
                    max={25}
                    value={draftJumlahSaudara}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => e.currentTarget.select()}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === '') {
                        setDraftJumlahSaudara('');
                        return;
                      }
                      const val = parseInt(raw, 10);
                      setDraftJumlahSaudara(isNaN(val) ? '' : Math.max(0, val));
                    }}
                    onBlur={() => {
                      if (draftJumlahSaudara === '' || Number(draftJumlahSaudara) < 0) {
                        setDraftJumlahSaudara(0);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs font-semibold"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button 
                type="button" 
                onClick={() => { 
                  const finalAnak = typeof draftUrutanAnak === 'number'
                    ? Math.max(1, draftUrutanAnak)
                    : (parseInt(String(draftUrutanAnak), 10) || 1);
                  const finalSaudara = typeof draftJumlahSaudara === 'number'
                    ? Math.max(0, draftJumlahSaudara)
                    : (parseInt(String(draftJumlahSaudara), 10) || 0);
                  setEditGender(draftGender);
                  setEditUrutanAnak(finalAnak);
                  setEditJumlahSaudara(finalSaudara);
                  handleUpdate({ 
                    gender: draftGender, 
                    anak_ke: finalAnak, 
                    dari_bersaudara: finalSaudara, 
                    urutanAnak: finalAnak, 
                    jumlahSaudara: finalSaudara 
                  }); 
                  setActiveEditModal(null); 
                }} 
                className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. EDIT NIK & NO KK */}
      {activeEditModal === 'nik_kk' && (
        <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900">Ubah NIK & No. KK</h3>
              <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor Induk Kependudukan (NIK)</label>
                <input
                  type="text"
                  value={draftNik}
                  onChange={(e) => setDraftNik(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs font-mono"
                  placeholder="16 digit NIK..."
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor Kartu Keluarga (KK)</label>
                <input
                  type="text"
                  value={draftNoKk}
                  onChange={(e) => setDraftNoKk(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs font-mono"
                  placeholder="16 digit Nomor KK..."
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button type="button" onClick={() => { 
                setEditNik(draftNik);
                setEditNoKk(draftNoKk);
                handleUpdate({ nik: draftNik, noKk: draftNoKk }); 
                setActiveEditModal(null); 
              }} className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* 5. EDIT ALAMAT */}
      {activeEditModal === 'alamat' && (
        <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900">Ubah Alamat Domisili</h3>
              <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <WilayahAddressFilter
                province={draftProvince}
                city={draftCity}
                kecamatan={draftKecamatan}
                desa={draftDesa}
                alamatLengkap={draftAlamatLengkap}
                coordinates={draftCoordinates}
                showAlamatLengkap={true}
                showLocationTag={true}
                onChange={({ province, city, kecamatan, desa, alamatLengkap, coordinates }) => {
                  setDraftProvince(province);
                  setDraftCity(city);
                  setDraftKecamatan(kecamatan);
                  setDraftDesa(desa);
                  if (alamatLengkap !== undefined) setDraftAlamatLengkap(alamatLengkap);
                  if (coordinates) setDraftCoordinates(coordinates);
                }}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button type="button" onClick={() => {
                setEditProvince(draftProvince);
                setEditCity(draftCity);
                setEditKecamatan(draftKecamatan);
                setEditDesa(draftDesa);
                setEditAlamatLengkap(draftAlamatLengkap);
                setEditCoordinates(draftCoordinates);
                handleUpdate({
                  province: draftProvince,
                  city: draftCity,
                  kecamatan: draftKecamatan,
                  desa: draftDesa,
                  alamatLengkap: draftAlamatLengkap,
                  coordinates: draftCoordinates || undefined
                });
                setActiveEditModal(null);
              }} className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* 6. EDIT KONTAK */}
      {activeEditModal === 'kontak' && (
        <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900">Ubah Kontak WhatsApp & Email</h3>
              <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor WhatsApp</label>
                <input
                  type="text"
                  value={draftPhone}
                  onChange={(e) => setDraftPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                  placeholder="08123456789"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alamat Email</label>
                <input
                  type="email"
                  value={draftEmail}
                  onChange={(e) => setDraftEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                  placeholder="alumni@attaroqqy.ac.id"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button type="button" onClick={() => { 
                setEditPhone(draftPhone);
                setEditEmail(draftEmail);
                handleUpdate({ phone: draftPhone, email: draftEmail }); 
                setActiveEditModal(null); 
              }} className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* 7. EDIT PEKERJAAN */}
      {activeEditModal === 'pekerjaan' && (
        <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
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
                  value={draftOccupation}
                  onChange={(e) => setDraftOccupation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                  placeholder="Profesi saat ini..."
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Instansi / Lembaga / Usaha</label>
                <input
                  type="text"
                  value={draftInstitution}
                  onChange={(e) => setDraftInstitution(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                  placeholder="Nama kantor, usaha, sekolah..."
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button type="button" onClick={() => { 
                setEditOccupation(draftOccupation);
                setEditInstitution(draftInstitution);
                handleUpdate({ occupation: draftOccupation, institution: draftInstitution }); 
                setActiveEditModal(null); 
              }} className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* 8. EDIT NIS */}
      {activeEditModal === 'nis' && (
        <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900">Ubah NIS (Nomor Induk Santri)</h3>
              <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1 text-xs">Nomor Induk Santri</label>
              <input
                type="text"
                value={draftNis}
                onChange={(e) => setDraftNis(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white text-xs"
                placeholder="NIS Santri..."
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button type="button" onClick={() => { 
                setEditNis(draftNis);
                handleUpdate({ nis: draftNis }); 
                setActiveEditModal(null); 
              }} className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* 9. EDIT NISM */}
      {activeEditModal === 'nism' && (
        <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900">Ubah NISM</h3>
              <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1 text-xs">Nomor Induk Santri Madrasah (NISM)</label>
              <input
                type="text"
                value={draftNism}
                onChange={(e) => setDraftNism(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white text-xs"
                placeholder="131233170001"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button type="button" onClick={() => { 
                setEditNism(draftNism);
                handleUpdate({ nism: draftNism }); 
                setActiveEditModal(null); 
              }} className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* 10. EDIT NISN */}
      {activeEditModal === 'nisn' && (
        <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900">Ubah NISN</h3>
              <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1 text-xs">Nomor Induk Siswa Nasional (NISN)</label>
              <input
                type="text"
                value={draftNisn}
                onChange={(e) => setDraftNisn(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white text-xs"
                placeholder="0012345678"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button type="button" onClick={() => { 
                setEditNisn(draftNisn);
                handleUpdate({ nisn: draftNisn }); 
                setActiveEditModal(null); 
              }} className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* 11. EDIT TANGGAL MASUK */}
      {activeEditModal === 'tanggal_masuk' && (
        <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900 text-center">Ubah Tanggal Masuk Pondok</h3>
              <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-2.5">
              <DateWheelPicker
                value={tempEntryDate || '2021-07-15'}
                onChange={(val) => setTempEntryDate(val)}
                minYear={1980}
                maxYear={2035}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer hover:bg-slate-50">Batal</button>
              <button type="button" onClick={() => {
                const year = tempEntryDate ? tempEntryDate.substring(0, 4) : '';
                const calculatedNis = tempEntryDate.trim()
                  ? generateNisFromEntryDate(tempEntryDate.trim(), existingAlumni, alumni.id)
                  : '';
                setEditEntryDate(tempEntryDate);
                setEditNis(calculatedNis);
                handleUpdate({ entryDate: tempEntryDate, entryYear: year, nis: calculatedNis });
                setActiveEditModal(null);
              }} className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer shadow-xs">Simpan Tanggal</button>
            </div>
          </div>
        </div>
      )}

      {/* 12. EDIT TANGGAL KELUAR */}
      {activeEditModal === 'tanggal_keluar' && (
        <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900 text-center">Ubah Tanggal Keluar (Boyong)</h3>
              <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-2.5">
              <DateWheelPicker
                value={tempGradDate || '2024-05-20'}
                onChange={(val) => setTempGradDate(val)}
                minYear={1980}
                maxYear={2035}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer hover:bg-slate-50">Batal</button>
              <button type="button" onClick={() => {
                const year = tempGradDate ? tempGradDate.substring(0, 4) : '';
                setEditGradDate(tempGradDate);
                handleUpdate({ gradDate: tempGradDate, gradYear: year });
                setActiveEditModal(null);
              }} className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer shadow-xs">Simpan Tanggal</button>
            </div>
          </div>
        </div>
      )}

      {/* 13. EDIT DATA ORANG TUA (AYAH) */}
      {activeEditModal === 'ayah' && (
        <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900">Ubah Data Ayah Kandung</h3>
              <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Ayah</label>
                <input
                  type="text"
                  value={draftNamaAyah}
                  onChange={(e) => setDraftNamaAyah(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                  placeholder="Nama lengkap ayah..."
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">NIK Ayah (16 digit)</label>
                <input
                  type="text"
                  maxLength={16}
                  value={draftNikAyah}
                  onChange={(e) => setDraftNikAyah(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white text-xs"
                  placeholder="NIK KTP Ayah..."
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pekerjaan Ayah</label>
                <input
                  type="text"
                  value={draftPekerjaanAyah}
                  onChange={(e) => setDraftPekerjaanAyah(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                  placeholder="Petani / Guru / Wiraswasta..."
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pendidikan Terakhir Ayah</label>
                <input
                  type="text"
                  value={draftPendidikanAyah}
                  onChange={(e) => setDraftPendidikanAyah(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                  placeholder="SMA / S1 / Pesantren..."
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button type="button" onClick={() => { 
                setEditNamaAyah(draftNamaAyah);
                setEditNikAyah(draftNikAyah);
                setEditPekerjaanAyah(draftPekerjaanAyah);
                setEditPendidikanAyah(draftPendidikanAyah);
                handleUpdate({ 
                  namaAyah: draftNamaAyah, 
                  nikAyah: draftNikAyah, 
                  pekerjaanAyah: draftPekerjaanAyah, 
                  pendidikanAyah: draftPendidikanAyah 
                }); 
                setActiveEditModal(null); 
              }} className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* 14. EDIT DATA ORANG TUA (IBU) */}
      {activeEditModal === 'ibu' && (
        <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900">Ubah Data Ibu Kandung</h3>
              <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Ibu</label>
                <input
                  type="text"
                  value={draftNamaIbu}
                  onChange={(e) => setDraftNamaIbu(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                  placeholder="Nama lengkap ibu..."
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">NIK Ibu (16 digit)</label>
                <input
                  type="text"
                  maxLength={16}
                  value={draftNikIbu}
                  onChange={(e) => setDraftNikIbu(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white text-xs"
                  placeholder="NIK KTP Ibu..."
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pekerjaan Ibu</label>
                <input
                  type="text"
                  value={draftPekerjaanIbu}
                  onChange={(e) => setDraftPekerjaanIbu(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                  placeholder="Ibu Rumah Tangga / Guru / Wiraswasta..."
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pendidikan Terakhir Ibu</label>
                <input
                  type="text"
                  value={draftPendidikanIbu}
                  onChange={(e) => setDraftPendidikanIbu(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                  placeholder="SMA / S1 / Pesantren..."
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button type="button" onClick={() => { 
                setEditNamaIbu(draftNamaIbu);
                setEditNikIbu(draftNikIbu);
                setEditPekerjaanIbu(draftPekerjaanIbu);
                setEditPendidikanIbu(draftPendidikanIbu);
                handleUpdate({ 
                  namaIbu: draftNamaIbu, 
                  nikIbu: draftNikIbu, 
                  pekerjaanIbu: draftPekerjaanIbu, 
                  pendidikanIbu: draftPendidikanIbu 
                }); 
                setActiveEditModal(null); 
              }} className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
