import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  KeyRound,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { AdminUser, AdminRegionLevel } from '../../types';
import { canAdminManage, formatAdminAuthorityLabel } from '../../utils/adminAuthorityUtils';
import { FALLBACK_PROVINCES, formatWilayahName } from '../../services/wilayahService';

interface AdminAccountEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminToEdit: AdminUser | null;
  currentAdmin: AdminUser;
  onSave: (adminData: AdminUser) => void;
  onDelete?: (adminId: string) => void;
}

const DEFAULT_ADMIN_AVATAR =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256';

export const AdminAccountEditModal: React.FC<AdminAccountEditModalProps> = ({
  isOpen,
  onClose,
  adminToEdit,
  currentAdmin,
  onSave,
  onDelete,
}) => {
  const isEditing = Boolean(adminToEdit);
  const isPusatAccount =
    adminToEdit?.username === '@admin_pusat' ||
    adminToEdit?.role === 'super_admin' ||
    adminToEdit?.regionLevel === 'pusat';

  const isReadOnly = isEditing && !canAdminManage(currentAdmin, adminToEdit!);

  // Clean Form States: HANYA Username, Kata Sandi, dan Wewenang
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [regionLevel, setRegionLevel] = useState<AdminRegionLevel>('provinsi');
  const [province, setProvince] = useState('Jawa Timur');
  const [city, setCity] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [desa, setDesa] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (adminToEdit) {
      setUsername(adminToEdit.username || '');
      setPassword(adminToEdit.password || '1234');
      setRegionLevel(adminToEdit.regionLevel || (adminToEdit.role === 'super_admin' ? 'pusat' : 'provinsi'));
      setProvince(adminToEdit.province || 'Jawa Timur');
      setCity(adminToEdit.city || '');
      setKecamatan(adminToEdit.kecamatan || '');
      setDesa(adminToEdit.desa || '');
    } else {
      // Akun admin baru selalu berwewenang daerah (Pusat hanya ada satu dan tidak bisa dibuat lagi)
      setUsername('@admin_');
      setPassword('1234');
      setRegionLevel('provinsi');
      setProvince('Jawa Timur');
      setCity('');
      setKecamatan('');
      setDesa('');
    }
    setErrorMessage(null);
    setShowDeleteConfirm(false);
  }, [adminToEdit, currentAdmin, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    const rawUsername = username.trim().replace(/^@+/, '');
    if (!rawUsername || rawUsername.length < 3) {
      setErrorMessage('Username admin minimal 3 karakter');
      return;
    }
    const cleanUsername = `@${rawUsername.toLowerCase()}`;

    if (!password.trim()) {
      setErrorMessage('Kata sandi wajib diisi');
      return;
    }

    if (regionLevel !== 'pusat' && !province.trim()) {
      setErrorMessage('Provinsi wewenang wajib dipilih');
      return;
    }

    if ((regionLevel === 'kota' || regionLevel === 'kecamatan' || regionLevel === 'desa') && !city.trim()) {
      setErrorMessage('Kabupaten / Kota wajib diisi');
      return;
    }

    if ((regionLevel === 'kecamatan' || regionLevel === 'desa') && !kecamatan.trim()) {
      setErrorMessage('Kecamatan wajib diisi');
      return;
    }

    if (regionLevel === 'desa' && !desa.trim()) {
      setErrorMessage('Desa / Kelurahan wajib diisi');
      return;
    }

    // Nama dan Jabatan dibentuk otomatis secara rapi berdasarkan wewenang daerah
    let generatedName = 'Admin Pusat';
    let generatedJabatan = 'Super Admin Ponpes At-Taroqqy';

    if (regionLevel === 'provinsi') {
      generatedName = `Admin Wilayah ${formatWilayahName(province)}`;
      generatedJabatan = `Pengurus Alumni Korda Prov. ${formatWilayahName(province)}`;
    } else if (regionLevel === 'kota') {
      generatedName = `Admin ${formatWilayahName(city)}`;
      generatedJabatan = `Pengurus Alumni ${formatWilayahName(city)}`;
    } else if (regionLevel === 'kecamatan') {
      generatedName = `Admin Kec. ${formatWilayahName(kecamatan)}`;
      generatedJabatan = `Pengurus Alumni Kec. ${formatWilayahName(kecamatan)}`;
    } else if (regionLevel === 'desa') {
      generatedName = `Admin Desa ${formatWilayahName(desa)}`;
      generatedJabatan = `Pengurus Alumni Desa ${formatWilayahName(desa)}`;
    }

    const updatedAdmin: AdminUser = {
      id: adminToEdit ? adminToEdit.id : `adm-${Date.now()}`,
      name: adminToEdit?.name && isPusatAccount ? adminToEdit.name : generatedName,
      username: cleanUsername,
      password: password.trim(),
      jabatan: adminToEdit?.jabatan && isPusatAccount ? adminToEdit.jabatan : generatedJabatan,
      role: regionLevel === 'pusat' ? 'super_admin' : 'pengurus_pondok',
      regionLevel,
      province: regionLevel === 'pusat' ? undefined : province.trim(),
      city: regionLevel === 'pusat' || regionLevel === 'provinsi' ? undefined : city.trim(),
      kecamatan: regionLevel === 'kecamatan' || regionLevel === 'desa' ? kecamatan.trim() : undefined,
      desa: regionLevel === 'desa' ? desa.trim() : undefined,
      avatar: adminToEdit?.avatar || DEFAULT_ADMIN_AVATAR,
      createdAt: adminToEdit?.createdAt || new Date().toISOString().split('T')[0],
    };

    onSave(updatedAdmin);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in select-none"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bersih */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-900 leading-tight">
                {isEditing ? (isPusatAccount ? 'Akun Admin Pusat' : 'Edit Akun Admin') : 'Tambah Akun Admin'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isPusatAccount
                  ? 'Admin Pusat (Hanya ada satu & tidak dapat dihapus)'
                  : 'Formulir akun admin & batas wewenang wilayah'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body: HANYA Username, Kata Sandi, dan Wewenang */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {isReadOnly && (
            <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 text-amber-800">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <p className="font-bold">Mode Hanya Lihat</p>
                <p className="text-amber-700 mt-0.5">
                  Akun admin ini berada di luar wilayah yang Anda bawahi.
                </p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. USERNAME LOGIN */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">
              Username Admin <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="font-bold text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 text-sm">@</span>
              <input
                type="text"
                disabled={isReadOnly || isPusatAccount}
                required
                placeholder="admin_jatim"
                value={username.replace(/^@/, '')}
                onChange={(e) => setUsername('@' + e.target.value.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-600 focus:outline-none disabled:opacity-75 disabled:bg-slate-100"
              />
            </div>
            {isPusatAccount && (
              <p className="text-[10px] text-slate-400 mt-1">Username Admin Pusat dilindungi dan permanen.</p>
            )}
          </div>

          {/* 2. KATA SANDI */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">
              Kata Sandi <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                disabled={isReadOnly}
                required
                placeholder="Masukkan kata sandi..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-600 focus:outline-none disabled:opacity-75"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 3. WEWENANG WILAYAH */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Building2 className="w-4 h-4 text-sky-600" />
                <span>Wewenang Wilayah <span className="text-rose-500">*</span></span>
              </label>
              {isPusatAccount && (
                <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                  Pusat (Nasional)
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Admin berwenang memposting agenda / pengumuman dan mengelola data alumni di wilayahnya atau wilayah bawahnya.
            </p>

            {/* Pilihan Tingkat Wewenang (Provinsi, Kota/Kabupaten, Kecamatan, Desa) */}
            {!isPusatAccount && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => setRegionLevel('provinsi')}
                  className={`p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                    regionLevel === 'provinsi'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs">Tingkat Provinsi</p>
                  <p className={`text-[10px] font-normal mt-0.5 ${regionLevel === 'provinsi' ? 'text-sky-100' : 'text-slate-400'}`}>
                    1 Wilayah Provinsi
                  </p>
                </button>

                <button
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => setRegionLevel('kota')}
                  className={`p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                    regionLevel === 'kota'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs">Kabupaten / Kota</p>
                  <p className={`text-[10px] font-normal mt-0.5 ${regionLevel === 'kota' ? 'text-sky-100' : 'text-slate-400'}`}>
                    1 Kab / Kota
                  </p>
                </button>

                <button
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => setRegionLevel('kecamatan')}
                  className={`p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                    regionLevel === 'kecamatan'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs">Kecamatan</p>
                  <p className={`text-[10px] font-normal mt-0.5 ${regionLevel === 'kecamatan' ? 'text-sky-100' : 'text-slate-400'}`}>
                    1 Kecamatan
                  </p>
                </button>

                <button
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => setRegionLevel('desa')}
                  className={`p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                    regionLevel === 'desa'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs">Desa / Kelurahan</p>
                  <p className={`text-[10px] font-normal mt-0.5 ${regionLevel === 'desa' ? 'text-sky-100' : 'text-slate-400'}`}>
                    1 Desa / Kelurahan
                  </p>
                </button>
              </div>
            )}

            {/* Input Wilayah Berdasarkan Tingkat */}
            {regionLevel !== 'pusat' && (
              <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3">
                {/* 1. Provinsi */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Provinsi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    disabled={isReadOnly}
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-600 focus:outline-none"
                  >
                    {FALLBACK_PROVINCES.map((p) => (
                      <option key={p.id} value={formatWilayahName(p.name)}>
                        {formatWilayahName(p.name)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Kabupaten / Kota */}
                {(regionLevel === 'kota' || regionLevel === 'kecamatan' || regionLevel === 'desa') && (
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Kabupaten / Kota <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder="Contoh: Kab. Rembang atau Kab. Malang"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-600 focus:outline-none"
                    />
                  </div>
                )}

                {/* 3. Kecamatan */}
                {(regionLevel === 'kecamatan' || regionLevel === 'desa') && (
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Kecamatan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder="Contoh: Sedan, Sarang, Lasem, Dampit"
                      value={kecamatan}
                      onChange={(e) => setKecamatan(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-600 focus:outline-none"
                    />
                  </div>
                )}

                {/* 4. Desa / Kelurahan */}
                {regionLevel === 'desa' && (
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Desa / Kelurahan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder="Contoh: Warusedan, Soditan, dll"
                      value={desa}
                      onChange={(e) => setDesa(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-600 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Delete confirmation section */}
          {showDeleteConfirm && !isPusatAccount && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2.5 animate-in fade-in">
              <p className="font-bold text-rose-800 text-xs">Konfirmasi Hapus Akun Admin</p>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                Apakah Anda yakin ingin menghapus akun admin <strong>{username}</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs cursor-pointer hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (adminToEdit && onDelete) {
                      onDelete(adminToEdit.id);
                      onClose();
                    }
                  }}
                  className="flex-1 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs cursor-pointer hover:bg-rose-700 shadow-xs"
                >
                  Ya, Hapus Akun
                </button>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-between gap-2.5 border-t border-slate-100">
            {isEditing && !isReadOnly && onDelete && !showDeleteConfirm && !isPusatAccount && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="py-2.5 px-3.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200/60 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                title="Hapus Akun Admin"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            )}

            <div className="flex-1 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer hover:bg-slate-50"
              >
                {isReadOnly ? 'Tutup' : 'Batal'}
              </button>

              {!isReadOnly && (
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer shadow-xs active:scale-95 transition-all"
                >
                  {isEditing ? 'Simpan' : 'Simpan Akun'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
