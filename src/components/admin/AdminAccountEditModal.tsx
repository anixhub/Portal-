import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  User,
  KeyRound,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Building2,
  Info,
} from 'lucide-react';
import { AdminUser, AdminRegionLevel } from '../../types';
import { canAdminManage, formatAdminAuthorityLabel } from '../../utils/adminAuthorityUtils';
import { FALLBACK_PROVINCES, FALLBACK_REGENCIES, formatWilayahName } from '../../services/wilayahService';

interface AdminAccountEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminToEdit: AdminUser | null;
  currentAdmin: AdminUser;
  onSave: (adminData: AdminUser) => void;
  onDelete?: (adminId: string) => void;
}

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=256',
];

export const AdminAccountEditModal: React.FC<AdminAccountEditModalProps> = ({
  isOpen,
  onClose,
  adminToEdit,
  currentAdmin,
  onSave,
  onDelete,
}) => {
  const isEditing = Boolean(adminToEdit);
  const isReadOnly = isEditing && !canAdminManage(currentAdmin, adminToEdit!);

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [jabatan, setJabatan] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState(DEFAULT_AVATARS[0]);
  const [regionLevel, setRegionLevel] = useState<AdminRegionLevel>('provinsi');
  const [province, setProvince] = useState('Jawa Timur');
  const [city, setCity] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (adminToEdit) {
      setName(adminToEdit.name || '');
      setUsername(adminToEdit.username || '');
      setPassword(adminToEdit.password || '1234');
      setJabatan(adminToEdit.jabatan || '');
      setPhone(adminToEdit.phone || '');
      setEmail(adminToEdit.email || '');
      setAvatar(adminToEdit.avatar || DEFAULT_AVATARS[0]);
      setRegionLevel(adminToEdit.regionLevel || (adminToEdit.role === 'super_admin' ? 'pusat' : 'provinsi'));
      setProvince(adminToEdit.province || 'Jawa Timur');
      setCity(adminToEdit.city || '');
      setKecamatan(adminToEdit.kecamatan || '');
    } else {
      // New admin initialization based on creator
      setName('');
      setUsername('@admin_');
      setPassword('1234');
      setJabatan('Pengurus Korda Alumni');
      setPhone('');
      setEmail('');
      setAvatar(DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)]);
      
      if (currentAdmin.regionLevel === 'pusat' || currentAdmin.role === 'super_admin') {
        setRegionLevel('provinsi');
        setProvince('Jawa Timur');
        setCity('');
        setKecamatan('');
      } else if (currentAdmin.regionLevel === 'provinsi') {
        setRegionLevel('kota');
        setProvince(currentAdmin.province || 'Jawa Timur');
        setCity('');
        setKecamatan('');
      } else if (currentAdmin.regionLevel === 'kota') {
        setRegionLevel('kecamatan');
        setProvince(currentAdmin.province || 'Jawa Timur');
        setCity(currentAdmin.city || '');
        setKecamatan('');
      } else {
        setRegionLevel('kecamatan');
        setProvince(currentAdmin.province || 'Jawa Timur');
        setCity(currentAdmin.city || '');
        setKecamatan(currentAdmin.kecamatan || '');
      }
    }
    setErrorMessage(null);
    setShowDeleteConfirm(false);
  }, [adminToEdit, currentAdmin, isOpen]);

  if (!isOpen) return null;

  const isCurrentPusat = currentAdmin.regionLevel === 'pusat' || currentAdmin.role === 'super_admin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    if (!name.trim()) {
      setErrorMessage('Nama lengkap wajib diisi');
      return;
    }

    const cleanUsername = username.trim().startsWith('@')
      ? username.trim()
      : `@${username.trim()}`;

    if (cleanUsername.length < 3) {
      setErrorMessage('Username admin minimal 3 karakter');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Kata sandi wajib diisi');
      return;
    }

    if (regionLevel !== 'pusat' && !province.trim()) {
      setErrorMessage('Provinsi wajib dipilih untuk admin daerah');
      return;
    }

    if ((regionLevel === 'kota' || regionLevel === 'kecamatan') && !city.trim()) {
      setErrorMessage('Kabupaten / Kota wajib diisi untuk tingkat ini');
      return;
    }

    if (regionLevel === 'kecamatan' && !kecamatan.trim()) {
      setErrorMessage('Kecamatan wajib diisi untuk tingkat kecamatan');
      return;
    }

    const updatedAdmin: AdminUser = {
      id: adminToEdit ? adminToEdit.id : `adm-${Date.now()}`,
      name: name.trim(),
      username: cleanUsername,
      password: password.trim(),
      jabatan: jabatan.trim() || 'Pengurus Ikatan Alumni',
      role: regionLevel === 'pusat' ? 'super_admin' : 'pengurus_pondok',
      regionLevel,
      province: regionLevel === 'pusat' ? undefined : province.trim(),
      city: regionLevel === 'pusat' || regionLevel === 'provinsi' ? undefined : city.trim(),
      kecamatan: regionLevel === 'kecamatan' ? kecamatan.trim() : undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      avatar,
      createdAt: adminToEdit?.createdAt || new Date().toISOString().split('T')[0],
    };

    onSave(updatedAdmin);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100020] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                {isReadOnly
                  ? 'Detail Akun Admin (Hanya Lihat)'
                  : isEditing
                  ? 'Atur & Edit Akun Admin'
                  : 'Tambah Akun Admin Baru'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isReadOnly
                  ? 'Akun di luar daerah kewenangan Anda'
                  : 'Atur data akses dan wewenang daerah akun'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Read Only Alert Banner */}
          {isReadOnly && (
            <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 text-amber-800">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <p className="font-bold">Mode Hanya Lihat (Di Luar Wilayah)</p>
                <p className="text-amber-700 mt-0.5">
                  Akun admin ini berada di luar wilayah yang Anda bawahi. Anda hanya dapat melihat informasi akun dan tidak dapat melakukan perubahan atau penghapusan.
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

          {/* 1. Avatar Selection */}
          <div>
            <label className="font-bold text-slate-700 block mb-2">Foto Avatar Admin</label>
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
              {DEFAULT_AVATARS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => setAvatar(url)}
                  className={`relative w-12 h-12 rounded-2xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    avatar === url
                      ? 'border-sky-600 ring-2 ring-sky-200 scale-105'
                      : 'border-slate-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt="avatar" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* 2. Informasi Akun Pokok */}
          <div className="space-y-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nama Lengkap & Gelar *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  disabled={isReadOnly}
                  required
                  placeholder="Contoh: Ust. M. Ridwan Hakim, S.Ag."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-sky-600 disabled:opacity-75"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Username Login *</label>
                <div className="relative">
                  <span className="font-bold text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">@</span>
                  <input
                    type="text"
                    disabled={isReadOnly || (isEditing && adminToEdit?.username === '@admin_pusat')}
                    required
                    placeholder="admin_jatim"
                    value={username.replace(/^@/, '')}
                    onChange={(e) => setUsername('@' + e.target.value.replace(/^@/, ''))}
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-sky-600 disabled:opacity-75"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Kata Sandi *</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    disabled={isReadOnly}
                    required
                    placeholder="Minimal 4 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-sky-600 disabled:opacity-75"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Jabatan / Posisi *</label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  disabled={isReadOnly}
                  required
                  placeholder="Contoh: Pengurus Alumni Wilayah Jawa Timur"
                  value={jabatan}
                  onChange={(e) => setJabatan(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-sky-600 disabled:opacity-75"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">No. WhatsApp / Telepon</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    disabled={isReadOnly}
                    placeholder="Contoh: 081234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-sky-600 disabled:opacity-75"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Resmi (Opsional)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    disabled={isReadOnly}
                    placeholder="admin@attaroqqy.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-sky-600 disabled:opacity-75"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Wewenang & Wilayah Kekuasaan (Core Feature) */}
          <div className="p-4 bg-sky-50/70 border border-sky-100 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-900 flex items-center gap-1.5 text-xs">
                <Building2 className="w-4 h-4 text-sky-600" />
                Pengaturan Wewenang Daerah
              </span>
              <span className="text-[10px] bg-sky-200/80 text-sky-800 font-bold px-2 py-0.5 rounded-full">
                Otomatisasi Jangkauan
              </span>
            </div>

            <p className="text-[11px] text-sky-800 leading-relaxed">
              Postingan yang dibuat akun ini otomatis hanya dapat dilihat oleh alumni di daerah kewenangannya atau sub-wilayah di bawahnya. Akun ini juga hanya berwenang mengelola admin di areanya.
            </p>

            {/* Pilihan Level Wewenang */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Tingkat Wewenang Daerah</label>
              <div className="grid grid-cols-2 gap-2">
                {isCurrentPusat && (
                  <button
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => setRegionLevel('pusat')}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                      regionLevel === 'pusat'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-xs">Pusat (Nasional)</p>
                    <p className={`text-[10px] font-normal mt-0.5 ${regionLevel === 'pusat' ? 'text-sky-100' : 'text-slate-400'}`}>
                      Seluruh Indonesia
                    </p>
                  </button>
                )}

                <button
                  type="button"
                  disabled={isReadOnly || (!isCurrentPusat && currentAdmin.regionLevel !== 'provinsi')}
                  onClick={() => setRegionLevel('provinsi')}
                  className={`p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                    regionLevel === 'provinsi'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs">Provinsi</p>
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
              </div>
            </div>

            {/* Input Daerah Spesifik */}
            {regionLevel !== 'pusat' && (
              <div className="space-y-2.5 pt-1">
                {/* Provinsi */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pilih Provinsi *</label>
                  <select
                    disabled={isReadOnly || (!isCurrentPusat && Boolean(currentAdmin.province))}
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-600"
                  >
                    {FALLBACK_PROVINCES.map((p) => (
                      <option key={p.id} value={formatWilayahName(p.name)}>
                        {formatWilayahName(p.name)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kabupaten / Kota */}
                {(regionLevel === 'kota' || regionLevel === 'kecamatan') && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nama Kabupaten / Kota *</label>
                    <input
                      type="text"
                      disabled={isReadOnly || (currentAdmin.regionLevel === 'kota' && Boolean(currentAdmin.city))}
                      placeholder="Contoh: Kab. Malang atau Kota Surabaya"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-600"
                    />
                  </div>
                )}

                {/* Kecamatan */}
                {regionLevel === 'kecamatan' && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nama Kecamatan *</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder="Contoh: Dampit, Sumbermanjing, dll"
                      value={kecamatan}
                      onChange={(e) => setKecamatan(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-600"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Delete confirmation section */}
          {showDeleteConfirm && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2.5 animate-in fade-in">
              <p className="font-bold text-rose-800 text-xs">Konfirmasi Hapus Akun Admin</p>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                Apakah Anda yakin ingin menghapus akun admin <strong>{name}</strong> ({username})? Tindakan ini tidak dapat dibatalkan.
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
          <div className="pt-2 flex items-center justify-between gap-2.5 border-t border-slate-100">
            {isEditing && !isReadOnly && onDelete && !showDeleteConfirm && (
              <button
                type="button"
                disabled={adminToEdit?.username === '@admin_pusat'}
                onClick={() => setShowDeleteConfirm(true)}
                className="py-2.5 px-3.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200/60 font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
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
                  {isEditing ? 'Simpan Perubahan' : 'Buat Akun Admin'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
