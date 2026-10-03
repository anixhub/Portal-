import React, { useState } from 'react';
import { 
  Search, 
  Pencil, 
  Trash2, 
  Pin, 
  X, 
  Share2, 
  FileText,
  Users
} from 'lucide-react';
import { AnnouncementItem, AdminUser } from '../../types';
import logoPonpesImg from '../../assets/images/logo_ponpes_attaroqqy_1790648746461.jpg';
import { shareMediaWithCaption } from '../../utils/shareUtils';
import { PostMediaCarousel } from '../common/PostMediaCarousel';
import { formatAudienceSummary } from '../common/AudienceTargetModal';

interface AdminAnnouncementsTabProps {
  announcements: AnnouncementItem[];
  adminUser: AdminUser;
  onAddAnnouncement: (ann: AnnouncementItem) => void;
  onUpdateAnnouncement: (id: string, updated: Partial<AnnouncementItem>) => void;
  onDeleteAnnouncement: (id: string) => void;
  triggerToast: (msg: string) => void;
  onOpenCreateModal?: () => void;
  onOpenEditModal?: (ann: AnnouncementItem) => void;
}

// Item Kartu Pengumuman dengan tracking slide aktif untuk keperluan share gambar yang sedang disorot
const AnnouncementCardItem: React.FC<{
  ann: AnnouncementItem;
  onPreview: (url: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  triggerToast: (msg: string) => void;
}> = ({ ann, onPreview, onEdit, onDelete, triggerToast }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleShare = async () => {
    const imageToShare = ann.images && ann.images.length > 0
      ? ann.images[activeSlide] || ann.images[0]
      : null;

    const captionText = `*[${ann.category.toUpperCase()}] ${ann.title}*

${ann.content}

📅 Tanggal: ${ann.date}
Diterbitkan oleh: ${ann.authorName || 'Pondok Pesantren At-taroqqy'}`;

    await shareMediaWithCaption({
      imageUrl: imageToShare,
      title: ann.title,
      text: captionText,
      onToast: triggerToast,
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* 1. HEADER KARTU PENGUMUMAN: PROFIL PENULIS + LABEL KATEGORI DI SEBELAH KIRI TANGGAL (TEPAT DI BAWAH NAMA) */}
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
            <img
              src={ann.authorAvatar || logoPonpesImg}
              alt={ann.authorName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <h4 className="font-display font-bold text-xs sm:text-sm text-slate-900 truncate leading-tight">
              {ann.authorName || 'Pondok Pesantren At-taroqqy'}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {ann.authorHandle && (
                <span className="text-[11px] text-slate-500 font-medium">
                  {ann.authorHandle.startsWith('@') ? ann.authorHandle : `@${ann.authorHandle}`}
                </span>
              )}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md capitalize border leading-none ${
                ann.category === 'maklumat'
                  ? 'text-amber-800 bg-amber-50 border-amber-200'
                  : ann.category === 'kegiatan'
                  ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                  : 'text-sky-800 bg-sky-50 border-sky-200'
              }`}>
                {ann.category}
              </span>
              {ann.isImportant && (
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 leading-none">
                  <Pin className="w-2.5 h-2.5 text-rose-600 fill-rose-600" />
                  <span>Penting</span>
                </span>
              )}
              <span className="text-[11px] text-slate-400">
                {ann.date}
              </span>
              {ann.targetAudience && (
                <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Users className="w-2.5 h-2.5 text-sky-600" />
                  <span>{formatAudienceSummary(ann.targetAudience)}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. MEDIA SLIDER FOTO (BISA LEBIH DARI SATU FOTO & BISA DIGESER) */}
      {ann.images && ann.images.length > 0 && (
        <PostMediaCarousel
          images={ann.images}
          title={ann.title}
          onPreview={onPreview}
          onSlideChange={setActiveSlide}
        />
      )}

      {/* 3. CAPTION & DETAIL INFORMASI PENGUMUMAN */}
      <div className="px-4 py-3 space-y-2 text-xs">
        <div className="text-slate-800 text-xs">
          <p 
            onClick={() => setIsExpanded(!isExpanded)}
            className={`leading-relaxed cursor-pointer select-none ${isExpanded ? '' : 'line-clamp-2'}`}
            title={isExpanded ? "Klik untuk menyembunyikan" : "Klik untuk membaca selengkapnya"}
          >
            <span className="font-bold text-slate-900 mr-1.5 font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
              @{ann.authorHandle || 'attaroqqy_official'}
            </span>
            <span className="font-bold text-slate-900 mr-1">{ann.title}</span>
            <span className="text-slate-600 whitespace-pre-line">{ann.content}</span>
          </p>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-slate-600 text-xs font-normal mt-1 cursor-pointer block select-none"
          >
            {isExpanded ? 'sembunyikan' : 'selengkapnya'}
          </button>
        </div>
      </div>

      {/* 4. FOOTER 3 AREA DENGAN GARIS TIPIS: TOMBOL EDIT, BAGIKAN, DAN HAPUS */}
      <div className="border-t border-slate-100 grid grid-cols-3 divide-x divide-slate-100 bg-white">
        <button
          type="button"
          onClick={onEdit}
          className="py-2.5 px-2 flex items-center justify-center gap-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50/50 text-xs font-semibold transition-colors cursor-pointer active:scale-95"
          title="Edit Pengumuman"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>Edit</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="py-2.5 px-2 flex items-center justify-center gap-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/50 text-xs font-semibold transition-colors cursor-pointer active:scale-95"
          title="Bagikan Foto yang Sedang Disorot & Teks ke WhatsApp"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Bagikan</span>
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="py-2.5 px-2 flex items-center justify-center gap-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50/50 text-xs font-semibold transition-colors cursor-pointer active:scale-95"
          title="Hapus Pengumuman"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Hapus</span>
        </button>
      </div>
    </div>
  );
};

export const AdminAnnouncementsTab: React.FC<AdminAnnouncementsTabProps> = ({
  announcements,
  adminUser: _adminUser,
  onAddAnnouncement: _onAddAnnouncement,
  onUpdateAnnouncement: _onUpdateAnnouncement,
  onDeleteAnnouncement,
  triggerToast,
  onOpenCreateModal: _onOpenCreateModal,
  onOpenEditModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'semua' | 'maklumat' | 'umum' | 'kegiatan' | 'beasiswa'>('semua');
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Delete confirm modal state
  const [deleteCandidate, setDeleteCandidate] = useState<AnnouncementItem | null>(null);

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
    <div className="flex-1 overflow-y-auto px-4 py-3 max-w-lg mx-auto w-full flex flex-col pb-28">
      {/* ================= HEADER SUDAH DIHAPUS ================= */}

      {/* ================= 1. SEARCH INPUT ================= */}
      <div className="relative mb-3 shrink-0">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari pengumuman atau informasi..."
          className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
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

      {/* ================= 2. FILTER KATEGORI: MAKLUMAT, UMUM, KEGIATAN ================= */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-3 shrink-0">
        {(['semua', 'maklumat', 'umum', 'kegiatan'] as const).map((cat) => {
          const count = cat === 'semua' 
            ? announcements.length 
            : announcements.filter(a => a.category === cat).length;
          const isActive = selectedCategory === cat;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all border flex items-center gap-1.5 ${
                isActive
                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50'
              }`}
            >
              <span className="capitalize">{cat}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ================= 3. DAFTAR PEMBERITAHUAN (PERSIS TAMPILAN AGENDA) ================= */}
      <div className="space-y-5">
        {filteredAnnouncements.map((ann) => (
          <AnnouncementCardItem
            key={ann.id}
            ann={ann}
            onPreview={(url) => setPreviewPhotoUrl(url)}
            onEdit={() => {
              if (onOpenEditModal) {
                onOpenEditModal(ann);
              }
            }}
            onDelete={() => setDeleteCandidate(ann)}
            triggerToast={triggerToast}
          />
        ))}

        {filteredAnnouncements.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 text-center text-slate-500 text-xs space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">Tidak ada pengumuman</p>
            <p className="text-slate-400 text-[11px]">
              Belum ada informasi pada kategori ini atau kata kunci yang dicari.
            </p>
          </div>
        )}
      </div>

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

      {/* ================= PREVIEW FOTO FULLSCREEN ================= */}
      {previewPhotoUrl && (
        <div 
          onClick={() => setPreviewPhotoUrl(null)}
          className="fixed inset-0 z-[100070] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in cursor-zoom-out"
        >
          <div className="relative max-w-3xl max-h-[90vh] w-full flex items-center justify-center">
            <img
              src={previewPhotoUrl}
              alt="Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute -top-10 right-0 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
