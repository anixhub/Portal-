import React, { useState, useRef } from 'react';
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
  FileCheck
} from 'lucide-react';
import { AlumniRecord } from '../../types';
import { WilayahAddressFilter } from '../common/WilayahAddressFilter';
import { FullscreenPhotoViewerModal } from '../common/FullscreenPhotoViewerModal';

interface AlumniDetailAdminModalProps {
  isOpen: boolean;
  alumni: AlumniRecord | null;
  onClose: () => void;
  onResetPassword: (id: string) => void;
  onSave?: (id: string, updated: Partial<AlumniRecord>) => void;
}

export const AlumniDetailAdminModal: React.FC<AlumniDetailAdminModalProps> = ({
  isOpen,
  alumni,
  onClose,
  onResetPassword,
  onSave,
}) => {
  if (!isOpen || !alumni) return null;

  // Active edit modal state for individual sections
  const [activeEditModal, setActiveEditModal] = useState<string | null>(null);
  const [showFullscreenPhoto, setShowFullscreenPhoto] = useState(false);

  // Form edit states
  const [editPhotoUrl, setEditPhotoUrl] = useState(alumni.photoUrl || '');
  const [editName, setEditName] = useState(alumni.name);
  const [editTempatLahir, setEditTempatLahir] = useState(alumni.tempatLahir || 'Rembang');
  const [editTanggalLahir, setEditTanggalLahir] = useState(alumni.tanggalLahir || '2000-01-01');
  const [editGender, setEditGender] = useState(alumni.gender || 'L');
  const [editUrutanAnak, setEditUrutanAnak] = useState(alumni.urutanAnak || 2);
  const [editJumlahSaudara, setEditJumlahSaudara] = useState(alumni.jumlahSaudara || 5);
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
  const [editNism, setEditNism] = useState(alumni.nism || '131233170001');
  const [editNisn, setEditNisn] = useState(alumni.nisn || '0012345678');
  const [editEntryDate, setEditEntryDate] = useState(alumni.entryDate || `${alumni.entryYear || '2014'}-07-15`);
  const [editGradDate, setEditGradDate] = useState(alumni.gradDate || `${alumni.gradYear || '2020'}-06-20`);

  // Parents
  const [editNamaAyah, setEditNamaAyah] = useState(alumni.namaAyah || 'H. Abdul Rasyid');
  const [editNikAyah, setEditNikAyah] = useState(alumni.nikAyah || '3507123456780001');
  const [editPekerjaanAyah, setEditPekerjaanAyah] = useState(alumni.pekerjaanAyah || 'Wiraswasta');
  const [editPendidikanAyah, setEditPendidikanAyah] = useState(alumni.pendidikanAyah || 'SMA / Aliyah');

  const [editNamaIbu, setEditNamaIbu] = useState(alumni.namaIbu || 'Hj. Siti Maryam');
  const [editNikIbu, setEditNikIbu] = useState(alumni.nikIbu || '3507123456780002');
  const [editPekerjaanIbu, setEditPekerjaanIbu] = useState(alumni.pekerjaanIbu || 'Ibu Rumah Tangga');
  const [editPendidikanIbu, setEditPendidikanIbu] = useState(alumni.pendidikanIbu || 'SMA / Aliyah');

  const photoFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUpdate = (updated: Partial<AlumniRecord>) => {
    if (onSave) {
      onSave(alumni.id, updated);
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
                  className="w-22 h-22 sm:w-24 sm:h-24 rounded-full ring-4 ring-white shadow-lg overflow-hidden bg-slate-200 flex items-center justify-center cursor-pointer group transition-transform active:scale-95"
                  title="Klik untuk melihat foto profil layar penuh"
                >
                  {editPhotoUrl ? (
                    <img
                      src={editPhotoUrl}
                      alt={editName || alumni.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold text-3xl flex items-center justify-center">
                      {(editName || alumni.name).charAt(0)}
                    </div>
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
                        {editName}
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
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">Tempat, Tanggal Lahir</p>
                      <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                        {editTempatLahir}, {editTanggalLahir}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* 3. Gender & Saudara */}
                <div
                  onClick={() => setActiveEditModal('gender_saudara')}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">Jenis Kelamin & Saudara</p>
                      <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                        {editGender === 'L' ? 'Laki-laki' : 'Perempuan'}, anak ke-{editUrutanAnak} dari {editJumlahSaudara} bersaudara
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
                        {editNik || '-'} · {editNoKk || '-'}
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
                  onClick={() => setActiveEditModal('kontak')}
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
                  onClick={() => setActiveEditModal('nis')}
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
                  onClick={() => setActiveEditModal('nism')}
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
                  onClick={() => setActiveEditModal('nisn')}
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
                  onClick={() => setActiveEditModal('tanggal_masuk')}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-sky-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">Tanggal Masuk</p>
                      <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                        {editEntryDate || 'Belum diisi'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* 5. Tanggal Keluar */}
                <div
                  onClick={() => setActiveEditModal('tanggal_keluar')}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-sky-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">Tanggal Keluar (Boyong)</p>
                      <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                        {editGradDate || 'Belum diisi'}
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
                  onClick={() => setActiveEditModal('ayah')}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">Data Ayah Kandung</p>
                      <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                        {editNamaAyah} · NIK: {editNikAyah} · {editPekerjaanAyah} · {editPendidikanAyah}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* 2. Ibu */}
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
                      <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                        {editNamaIbu} · NIK: {editNikIbu} · {editPekerjaanIbu} · {editPendidikanIbu}
                      </p>
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
                        Kembalikan kata sandi login alumni ini ke standar (1234)
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-xl">
                    Reset
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
              placeholder="Nama lengkap..."
            />
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button type="button" onClick={() => { handleUpdate({ name: editName }); setActiveEditModal(null); }} className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
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
                  value={editTempatLahir}
                  onChange={(e) => setEditTempatLahir(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                  placeholder="Kota/Kabupaten kelahiran..."
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Lahir</label>
                <input
                  type="date"
                  value={editTanggalLahir}
                  onChange={(e) => setEditTanggalLahir(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button type="button" onClick={() => { handleUpdate({ tempatLahir: editTempatLahir, tanggalLahir: editTanggalLahir }); setActiveEditModal(null); }} className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
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
                <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditGender('L')}
                    className={`p-2.5 rounded-xl border font-bold text-center transition-all ${
                      editGender === 'L' ? 'bg-sky-50 border-sky-600 text-sky-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Laki-laki
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditGender('P')}
                    className={`p-2.5 rounded-xl border font-bold text-center transition-all ${
                      editGender === 'P' ? 'bg-rose-50 border-rose-600 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Perempuan
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Anak Ke-</label>
                  <input
                    type="number"
                    value={editUrutanAnak}
                    onChange={(e) => setEditUrutanAnak(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dari Jumlah Saudara</label>
                  <input
                    type="number"
                    value={editJumlahSaudara}
                    onChange={(e) => setEditJumlahSaudara(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button type="button" onClick={() => { handleUpdate({ gender: editGender, urutanAnak: editUrutanAnak, jumlahSaudara: editJumlahSaudara }); setActiveEditModal(null); }} className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
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
                  value={editNik}
                  onChange={(e) => setEditNik(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs font-mono"
                  placeholder="16 digit NIK..."
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor Kartu Keluarga (KK)</label>
                <input
                  type="text"
                  value={editNoKk}
                  onChange={(e) => setEditNoKk(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs font-mono"
                  placeholder="16 digit Nomor KK..."
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button type="button" onClick={() => { handleUpdate({ nik: editNik, noKk: editNoKk }); setActiveEditModal(null); }} className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* 5. EDIT ALAMAT (KOTAK ALAMAT LENGKAP YANG DI BAWAHNYA ADA PETA TELAH DIHAPUS) */}
      {activeEditModal === 'alamat' && (
        <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900">Ubah Alamat Domisili</h3>
              <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <WilayahAddressFilter
                province={editProvince}
                city={editCity}
                kecamatan={editKecamatan}
                desa={editDesa}
                alamatLengkap={editAlamatLengkap}
                coordinates={editCoordinates}
                showAlamatLengkap={true}
                showLocationTag={true}
                onChange={({ province, city, kecamatan, desa, alamatLengkap, coordinates }) => {
                  setEditProvince(province);
                  setEditCity(city);
                  setEditKecamatan(kecamatan);
                  setEditDesa(desa);
                  if (alamatLengkap !== undefined) setEditAlamatLengkap(alamatLengkap);
                  if (coordinates) setEditCoordinates(coordinates);
                }}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button type="button" onClick={() => {
                handleUpdate({
                  province: editProvince,
                  city: editCity,
                  kecamatan: editKecamatan,
                  desa: editDesa,
                  coordinates: editCoordinates || undefined
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
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                  placeholder="08123456789"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alamat Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                  placeholder="alumni@attaroqqy.ac.id"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button type="button" onClick={() => { handleUpdate({ phone: editPhone, email: editEmail }); setActiveEditModal(null); }} className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
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
                  value={editOccupation}
                  onChange={(e) => setEditOccupation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                  placeholder="Profesi saat ini..."
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Instansi / Lembaga / Usaha</label>
                <input
                  type="text"
                  value={editInstitution}
                  onChange={(e) => setEditInstitution(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                  placeholder="Nama kantor, usaha, sekolah..."
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button type="button" onClick={() => { handleUpdate({ occupation: editOccupation, institution: editInstitution }); setActiveEditModal(null); }} className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
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
                value={editNis}
                onChange={(e) => setEditNis(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white text-xs"
                placeholder="NIS Santri..."
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button type="button" onClick={() => { handleUpdate({ nis: editNis }); setActiveEditModal(null); }} className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
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
                value={editNism}
                onChange={(e) => setEditNism(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white text-xs"
                placeholder="131233170001"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button type="button" onClick={() => { handleUpdate({ nism: editNism }); setActiveEditModal(null); }} className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
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
                value={editNisn}
                onChange={(e) => setEditNisn(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white text-xs"
                placeholder="0012345678"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button type="button" onClick={() => { handleUpdate({ nisn: editNisn }); setActiveEditModal(null); }} className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* 11. EDIT TANGGAL MASUK */}
      {activeEditModal === 'tanggal_masuk' && (
        <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900">Ubah Tanggal Masuk Pondok</h3>
              <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1 text-xs">Tanggal Masuk</label>
              <input
                type="date"
                value={editEntryDate}
                onChange={(e) => setEditEntryDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button type="button" onClick={() => {
                const year = editEntryDate ? editEntryDate.substring(0, 4) : alumni.entryYear;
                handleUpdate({ entryDate: editEntryDate, entryYear: year });
                setActiveEditModal(null);
              }} className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* 12. EDIT TANGGAL KELUAR */}
      {activeEditModal === 'tanggal_keluar' && (
        <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900">Ubah Tanggal Keluar (Boyong)</h3>
              <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1 text-xs">Tanggal Keluar (Boyong)</label>
              <input
                type="date"
                value={editGradDate}
                onChange={(e) => setEditGradDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button type="button" onClick={() => {
                const year = editGradDate ? editGradDate.substring(0, 4) : alumni.gradYear;
                handleUpdate({ gradDate: editGradDate, gradYear: year });
                setActiveEditModal(null);
              }} className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
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
                  value={editNamaAyah}
                  onChange={(e) => setEditNamaAyah(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                  placeholder="Nama lengkap ayah..."
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">NIK Ayah (16 digit)</label>
                <input
                  type="text"
                  maxLength={16}
                  value={editNikAyah}
                  onChange={(e) => setEditNikAyah(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white text-xs"
                  placeholder="NIK KTP Ayah..."
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pekerjaan Ayah</label>
                <input
                  type="text"
                  value={editPekerjaanAyah}
                  onChange={(e) => setEditPekerjaanAyah(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                  placeholder="Petani / Guru / Wiraswasta..."
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pendidikan Terakhir Ayah</label>
                <input
                  type="text"
                  value={editPendidikanAyah}
                  onChange={(e) => setEditPendidikanAyah(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                  placeholder="SMA / S1 / Pesantren..."
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button type="button" onClick={() => { 
                handleUpdate({ 
                  namaAyah: editNamaAyah, 
                  nikAyah: editNikAyah, 
                  pekerjaanAyah: editPekerjaanAyah, 
                  pendidikanAyah: editPendidikanAyah 
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
                  value={editNamaIbu}
                  onChange={(e) => setEditNamaIbu(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                  placeholder="Nama lengkap ibu..."
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">NIK Ibu (16 digit)</label>
                <input
                  type="text"
                  maxLength={16}
                  value={editNikIbu}
                  onChange={(e) => setEditNikIbu(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white text-xs"
                  placeholder="NIK KTP Ibu..."
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pekerjaan Ibu</label>
                <input
                  type="text"
                  value={editPekerjaanIbu}
                  onChange={(e) => setEditPekerjaanIbu(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                  placeholder="Ibu Rumah Tangga / Guru / Wiraswasta..."
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pendidikan Terakhir Ibu</label>
                <input
                  type="text"
                  value={editPendidikanIbu}
                  onChange={(e) => setEditPendidikanIbu(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                  placeholder="SMA / S1 / Pesantren..."
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button type="button" onClick={() => { 
                handleUpdate({ 
                  namaIbu: editNamaIbu, 
                  nikIbu: editNikIbu, 
                  pekerjaanIbu: editPekerjaanIbu, 
                  pendidikanIbu: editPendidikanIbu 
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
