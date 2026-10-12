import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  User,
  MapPin,
  Lock,
  Eye,
  Edit2,
  Trash2,
  Building2,
  CheckCircle2,
  Phone,
  Mail,
  AlertCircle,
  X,
} from 'lucide-react';
import { AdminUser, AdminRegionLevel } from '../../types';
import { canAdminManage, formatAdminAuthorityLabel } from '../../utils/adminAuthorityUtils';
import { AdminAccountEditModal } from './AdminAccountEditModal';

interface AdminAccountsTabProps {
  currentAdmin: AdminUser;
  adminList: AdminUser[];
  onAddAdmin: (newAdmin: AdminUser) => void;
  onUpdateAdmin: (updatedAdmin: AdminUser) => void;
  onDeleteAdmin: (adminId: string) => void;
  onToast: (msg: string) => void;
}

export const AdminAccountsTab: React.FC<AdminAccountsTabProps> = ({
  currentAdmin,
  adminList,
  onAddAdmin,
  onUpdateAdmin,
  onDeleteAdmin,
  onToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'semua' | AdminRegionLevel>('semua');
  const [selectedAdminForEdit, setSelectedAdminForEdit] = useState<AdminUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isCurrentPusat =
    currentAdmin.regionLevel === 'pusat' || currentAdmin.role === 'super_admin';

  // Filtered admin list
  const filteredAdmins = adminList.filter((adm) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      adm.name.toLowerCase().includes(q) ||
      adm.username.toLowerCase().includes(q) ||
      adm.jabatan.toLowerCase().includes(q) ||
      (adm.province && adm.province.toLowerCase().includes(q)) ||
      (adm.city && adm.city.toLowerCase().includes(q));

    const admLevel: AdminRegionLevel =
      adm.regionLevel || (adm.role === 'super_admin' ? 'pusat' : 'provinsi');

    const matchLevel = levelFilter === 'semua' || admLevel === levelFilter;

    return matchSearch && matchLevel;
  });

  const handleOpenAdd = () => {
    setSelectedAdminForEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (adm: AdminUser) => {
    setSelectedAdminForEdit(adm);
    setIsModalOpen(true);
  };

  const handleSaveAdmin = (saved: AdminUser) => {
    const exists = adminList.some((a) => a.id === saved.id);
    if (exists) {
      onUpdateAdmin(saved);
      onToast('Data akun admin berhasil diperbarui');
    } else {
      onAddAdmin(saved);
      onToast('Akun admin baru berhasil ditambahkan');
    }
  };

  const handleDeleteAdmin = (id: string) => {
    if (id === currentAdmin.id) {
      onToast('Anda tidak dapat menghapus akun Anda sendiri');
      return;
    }
    onDeleteAdmin(id);
    onToast('Akun admin berhasil dihapus');
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto px-4 py-3 max-w-xl mx-auto w-full pb-28 space-y-4">
      {/* 1. Header Banner & Info Kewenangan Akun Sendiri */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold shrink-0 border border-sky-100 shadow-2xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-extrabold text-sm sm:text-base text-slate-900 truncate">
                Kelola Akun Admin
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {isCurrentPusat
                  ? 'Akses Penuh Pusat: Lihat, tambah, atur & hapus akun'
                  : `Wewenang Wilayah: ${formatAdminAuthorityLabel(currentAdmin)}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="py-2 px-3.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah</span>
          </button>
        </div>

        {/* Ringkasan status wewenang */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed flex items-start gap-2">
          <Building2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-800">
              Hak Akses Anda: {formatAdminAuthorityLabel(currentAdmin)}
            </p>
            <p className="text-slate-500 mt-0.5">
              {isCurrentPusat
                ? 'Sebagai Admin Pusat, Anda dapat mengatur semua akun admin se-Indonesia dan menentukan cakupan wilayah wewenangnya.'
                : 'Anda hanya dapat menambah dan mengubah akun admin di area yang Anda bawahi. Untuk akun di luar area, Anda hanya dapat melihat datanya.'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Pencarian & Filter Tingkat Wewenang */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama admin, username, jabatan, atau daerah..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-sky-600 focus:outline-none shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Tingkat */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
          {[
            { id: 'semua', label: `Semua (${adminList.length})` },
            { id: 'pusat', label: 'Pusat' },
            { id: 'provinsi', label: 'Provinsi' },
            { id: 'kota', label: 'Kab / Kota' },
            { id: 'kecamatan', label: 'Kecamatan' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLevelFilter(item.id as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                levelFilter === item.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Daftar Kartu Akun Admin */}
      <div className="space-y-3">
        {filteredAdmins.map((adm) => {
          const isMe = adm.id === currentAdmin.id;
          const canManage = canAdminManage(currentAdmin, adm);
          const admLevel: AdminRegionLevel =
            adm.regionLevel || (adm.role === 'super_admin' ? 'pusat' : 'provinsi');

          return (
            <div
              key={adm.id}
              className={`bg-white rounded-3xl p-4 border transition-all ${
                isMe
                  ? 'border-sky-300 ring-2 ring-sky-100 shadow-sm'
                  : 'border-slate-200/90 shadow-2xs hover:border-slate-300'
              }`}
            >
              {/* Header Kartu: Avatar, Nama, Username, Badges */}
              <div className="flex items-start gap-3.5">
                <div className="relative shrink-0">
                  <img
                    src={
                      adm.avatar ||
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256'
                    }
                    alt={adm.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                  />
                  {admLevel === 'pusat' && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 text-white rounded-full flex items-center justify-center text-[9px] shadow-xs" title="Admin Pusat">
                      ★
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-display font-bold text-sm text-slate-900 truncate">
                      {adm.name}
                    </h4>
                    {isMe && (
                      <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.2 rounded-md">
                        Akun Anda
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-mono text-slate-500 mt-0.5">
                    {adm.username.startsWith('@') ? adm.username : `@${adm.username}`}
                  </p>

                  <p className="text-xs text-slate-600 font-medium mt-1">
                    {adm.jabatan || 'Pengurus Ikatan Alumni'}
                  </p>
                </div>
              </div>

              {/* Detail Wewenang & Wilayah */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                {/* Badge Wewenang Daerah */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      admLevel === 'pusat'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : admLevel === 'provinsi'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : admLevel === 'kota'
                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    <Building2 className="w-3 h-3" />
                    <span>{formatAdminAuthorityLabel(adm)}</span>
                  </span>

                  {!canManage && (
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1" title="Hanya bisa melihat, tidak bisa edit">
                      <Lock className="w-2.5 h-2.5" />
                      Luar Wilayah (Hanya Lihat)
                    </span>
                  )}
                </div>

                {/* Tombol Aksi */}
                <div className="flex items-center gap-1.5">
                  {canManage ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(adm)}
                        className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Atur</span>
                      </button>

                      {adm.username !== '@admin_pusat' && !isMe && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Hapus akun admin ${adm.name}?`)) {
                              handleDeleteAdmin(adm.id);
                            }
                          }}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus Akun"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(adm)}
                      className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Lihat Detail</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredAdmins.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 text-center text-slate-500 text-xs space-y-2">
            <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">Tidak ada akun admin ditemukan</p>
            <p className="text-slate-400 text-[11px]">
              Coba sesuaikan kata kunci pencarian atau filter tingkat wewenang.
            </p>
          </div>
        )}
      </div>

      {/* Modal Tambah / Edit / Detail Akun Admin */}
      {isModalOpen && (
        <AdminAccountEditModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          adminToEdit={selectedAdminForEdit}
          currentAdmin={currentAdmin}
          onSave={handleSaveAdmin}
          onDelete={handleDeleteAdmin}
        />
      )}
    </div>
  );
};
