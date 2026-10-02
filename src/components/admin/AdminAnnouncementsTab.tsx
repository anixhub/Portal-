import React, { useState } from 'react';
import { 
  Megaphone, 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Pin, 
  X, 
  Check, 
  Calendar, 
  Share2, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { AnnouncementItem, AdminUser } from '../../types';
import logoPonpesImg from '../../assets/images/logo_ponpes_attaroqqy_1790648746461.jpg';

interface AdminAnnouncementsTabProps {
  announcements: AnnouncementItem[];
  adminUser: AdminUser;
  onAddAnnouncement: (ann: AnnouncementItem) => void;
  onUpdateAnnouncement: (id: string, updated: Partial<AnnouncementItem>) => void;
  onDeleteAnnouncement: (id: string) => void;
  triggerToast: (msg: string) => void;
}

export const AdminAnnouncementsTab: React.FC<AdminAnnouncementsTabProps> = ({
  announcements,
  adminUser,
  onAddAnnouncement,
  onUpdateAnnouncement,
  onDeleteAnnouncement,
  triggerToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'semua' | 'maklumat' | 'kegiatan' | 'beasiswa' | 'umum'>('semua');
  
  // Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AnnouncementItem | null>(null);

  // Delete confirm modal state
  const [deleteCandidate, setDeleteCandidate] = useState<AnnouncementItem | null>(null);

  // Form input states
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<'maklumat' | 'kegiatan' | 'beasiswa' | 'umum'>('maklumat');
  const [formContent, setFormContent] = useState('');
  const [formIsImportant, setFormIsImportant] = useState(false);
  const [formAuthorName, setFormAuthorName] = useState('');
  const [formAuthorRole, setFormAuthorRole] = useState('');

  const openAddModal = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormCategory('maklumat');
    setFormContent('');
    setFormIsImportant(false);
    setFormAuthorName(adminUser.name || 'Pengurus Pondok At-taroqqy');
    setFormAuthorRole(adminUser.jabatan || 'Bidang Kesantrian & Alumni');
    setIsFormModalOpen(true);
  };

  const openEditModal = (item: AnnouncementItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormContent(item.content);
    setFormIsImportant(Boolean(item.isImportant));
    setFormAuthorName(item.authorName);
    setFormAuthorRole(item.authorRole || 'Pengurus');
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      triggerToast('Judul pengumuman wajib diisi');
      return;
    }
    if (!formContent.trim()) {
      triggerToast('Isi pengumuman wajib diisi');
      return;
    }

    if (editingItem) {
      // Update
      onUpdateAnnouncement(editingItem.id, {
        title: formTitle.trim(),
        category: formCategory,
        content: formContent.trim(),
        isImportant: formIsImportant,
        authorName: formAuthorName.trim() || adminUser.name,
        authorRole: formAuthorRole.trim() || 'Pengurus',
      });
      triggerToast('Pengumuman berhasil diperbarui');
    } else {
      // Create new
      const today = new Date();
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const dateStr = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;

      const newAnnouncement: AnnouncementItem = {
        id: 'ann-' + Date.now(),
        title: formTitle.trim(),
        date: dateStr,
        category: formCategory,
        content: formContent.trim(),
        authorName: formAuthorName.trim() || adminUser.name,
        authorHandle: 'admin_pusat',
        authorAvatar: logoPonpesImg,
        authorRole: formAuthorRole.trim() || 'Pengurus Pondok At-taroqqy',
        isImportant: formIsImportant,
      };

      onAddAnnouncement(newAnnouncement);
      triggerToast('Pengumuman baru berhasil dipublikasikan');
    }

    setIsFormModalOpen(false);
    setEditingItem(null);
  };

  const confirmDelete = () => {
    if (!deleteCandidate) return;
    onDeleteAnnouncement(deleteCandidate.id);
    triggerToast('Pengumuman berhasil dihapus');
    setDeleteCandidate(null);
  };

  // Filter announcements
  const filteredAnnouncements = announcements.filter((item) => {
    if (selectedCategory !== 'semua' && item.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchContent = item.content.toLowerCase().includes(q);
      const matchAuthor = item.authorName.toLowerCase().includes(q);
      return matchTitle || matchContent || matchAuthor;
    }
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 max-w-2xl mx-auto w-full space-y-4 pb-28">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-display font-extrabold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-sky-600" />
            <span>Pengumuman & Maklumat</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {announcements.length} informasi diterbitkan
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Pengumuman</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari judul atau isi pengumuman..."
          className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {(['semua', 'maklumat', 'kegiatan', 'beasiswa', 'umum'] as const).map((cat) => {
          const count = cat === 'semua' 
            ? announcements.length 
            : announcements.filter(a => a.category === cat).length;
          const isActive = selectedCategory === cat;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all border flex items-center gap-1.5 ${
                isActive
                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="capitalize">{cat}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Announcement Cards List */}
      <div className="space-y-3 pt-1">
        {filteredAnnouncements.map((ann) => {
          return (
            <div
              key={ann.id}
              className={`bg-white rounded-2xl border p-4 shadow-2xs transition-all space-y-2.5 ${
                ann.isImportant 
                  ? 'border-amber-300 ring-1 ring-amber-200/60' 
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              {/* Badges & Date Header */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Category Badge */}
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${
                    ann.category === 'maklumat'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : ann.category === 'kegiatan'
                      ? 'bg-sky-50 text-sky-800 border-sky-200'
                      : ann.category === 'beasiswa'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-800 border-slate-200'
                  }`}>
                    {ann.category}
                  </span>

                  {/* Important Pin Badge */}
                  {ann.isImportant && (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <Pin className="w-3 h-3 text-rose-600 fill-rose-600" />
                      <span>Penting</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{ann.date}</span>
                </div>
              </div>

              {/* Title */}
              <h3 className="font-display font-bold text-slate-900 text-sm sm:text-base leading-snug">
                {ann.title}
              </h3>

              {/* Content */}
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {ann.content}
              </p>

              {/* Footer Author & Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="text-[11px] text-slate-500 font-medium truncate">
                  <span>Diterbitkan oleh: </span>
                  <span className="font-semibold text-slate-700">{ann.authorName}</span>
                  {ann.authorRole && (
                    <span className="text-slate-400"> ({ann.authorRole})</span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(ann)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                    title="Edit Pengumuman"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteCandidate(ann)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Hapus Pengumuman"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredAnnouncements.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">Tidak ada pengumuman</p>
            <p className="text-slate-400 text-[11px]">
              Belum ada informasi pada kategori ini atau kata kunci yang dicari.
            </p>
          </div>
        )}
      </div>

      {/* ================= MODAL TAMBAH / EDIT PENGUMUMAN ================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in select-none">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900 leading-tight">
                    {editingItem ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Informasi resmi untuk seluruh santri & alumni
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
              {/* Judul Pengumuman */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Pengumuman <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Maklumat Reuni Akbar & KTA Digital 2026"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:bg-white"
                />
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kategori
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:bg-white cursor-pointer"
                >
                  <option value="maklumat">Maklumat Penting</option>
                  <option value="kegiatan">Agenda / Kegiatan</option>
                  <option value="beasiswa">Beasiswa Santri</option>
                  <option value="umum">Informasi Umum</option>
                </select>
              </div>

              {/* Isi Pengumuman */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Isi Pengumuman <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Tuliskan isi pengumuman atau instruksi untuk alumni..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:bg-white leading-relaxed"
                />
              </div>

              {/* Checkbox Penting */}
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="formIsImportant"
                  checked={formIsImportant}
                  onChange={(e) => setFormIsImportant(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded cursor-pointer"
                />
                <label htmlFor="formIsImportant" className="text-xs font-medium text-slate-700 cursor-pointer flex items-center gap-1.5">
                  <Pin className="w-3.5 h-3.5 text-rose-500" />
                  <span>Sematkan sebagai pengumuman penting (Highlighted)</span>
                </label>
              </div>

              {/* Penulis / Lembaga */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Nama Penulis
                  </label>
                  <input
                    type="text"
                    value={formAuthorName}
                    onChange={(e) => setFormAuthorName(e.target.value)}
                    placeholder="Nama Admin / Instansi"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Jabatan / Lembaga
                  </label>
                  <input
                    type="text"
                    value={formAuthorRole}
                    onChange={(e) => setFormAuthorRole(e.target.value)}
                    placeholder="Contoh: Kesantrian"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Tombol Aksi */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-sky-600/20"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Terbitkan Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI HAPUS ================= */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in select-none">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3.5 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-900">
                Hapus Pengumuman?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Pengumuman <b>"{deleteCandidate.title}"</b> akan dihapus dari portal alumni.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-rose-600/20"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
