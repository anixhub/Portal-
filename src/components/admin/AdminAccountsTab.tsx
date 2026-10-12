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
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto px-4 py-3 max-w-xl mx-auto w-full pb-28 space-y-3 relative">
      {/* 1. Pencarian Minimalis & Bersih */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Cari nama admin, username, atau daerah..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-sky-600 focus:outline-none shadow-2xs placeholder:text-slate-400"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
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
              {/* Header Kartu: Avatar, Nama, Username */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={
                        adm.avatar ||
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256'
                      }
                      alt={adm.name}
                      className="w-11 h-11 rounded-2xl object-cover border border-slate-200"
                    />
                    {admLevel === 'pusat' && (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 text-white rounded-full flex items-center justify-center text-[9px] shadow-xs font-bold" title="Admin Pusat">
                        ★
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-display font-bold text-sm text-slate-900 truncate">
                        {adm.name}
                      </h4>
                      {isMe && (
                        <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.2 rounded-md">
                          Anda
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-mono text-slate-500">
                      {adm.username.startsWith('@') ? adm.username : `@${adm.username}`}
                    </p>
                    {adm.jabatan && (
                      <p className="text-[11px] text-slate-600 font-medium truncate mt-0.5">
                        {adm.jabatan}
                      </p>
                    )}
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {canManage ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(adm)}
                        className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
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
                      <span>Lihat</span>
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
              Coba sesuaikan kata kunci pencarian.
            </p>
          </div>
        )}
      </div>

      {/* Tombol Plus Melayang (Floating Action Button) */}
      <button
        type="button"
        onClick={handleOpenAdd}
        aria-label="Tambah Akun Admin"
        className="fixed bottom-24 right-5 sm:right-8 z-40 w-14 h-14 rounded-full bg-linear-to-tr from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 text-white shadow-xl shadow-sky-600/35 flex items-center justify-center transition-all duration-200 active:scale-90 hover:scale-105 cursor-pointer ring-4 ring-white"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

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
