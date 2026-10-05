import React, { useState } from 'react';
import { 
  Search, 
  Pencil, 
  Trash2, 
  X, 
  Share2, 
  FileText,
  Globe,
  MoreVertical,
  Heart,
  MessageSquare
} from 'lucide-react';
import { AnnouncementItem, AdminUser, AlumniRecord, EventComment, EventCommentReply } from '../../types';
import logoPonpesImg from '../../assets/images/logo_ponpes_attaroqqy_1790648746461.jpg';
import { shareMediaWithCaption } from '../../utils/shareUtils';
import { PostMediaCarousel } from '../common/PostMediaCarousel';
import { formatAudienceSummary } from '../common/AudienceTargetModal';
import { EventCommentsModal } from '../common/EventCommentsModal';
import { INITIAL_ANNOUNCEMENT_COMMENTS } from '../../data/mockData';
import { formatAuthorUsername, resolveAuthorAlumniRecord } from '../../utils/authorUtils';

interface AdminAnnouncementsTabProps {
  announcements: AnnouncementItem[];
  adminUser: AdminUser;
  alumniList?: AlumniRecord[];
  onAddAnnouncement: (ann: AnnouncementItem) => void;
  onUpdateAnnouncement: (id: string, updated: Partial<AnnouncementItem>) => void;
  onDeleteAnnouncement: (id: string) => void;
  triggerToast: (msg: string) => void;
  onOpenCreateModal?: () => void;
  onOpenEditModal?: (ann: AnnouncementItem) => void;
  onOpenAuthorProfile?: (authorRecord: AlumniRecord) => void;
}

// Item Kartu Pengumuman
const AnnouncementCardItem: React.FC<{
  ann: AnnouncementItem;
  onPreview: (url: string) => void;
  onOpenMenu: (ann: AnnouncementItem) => void;
  onToggleLike: (id: string) => void;
  onOpenComments: (ann: AnnouncementItem) => void;
  onOpenAuthorProfile: (ann: AnnouncementItem) => void;
  triggerToast: (msg: string) => void;
}> = ({ ann, onPreview, onOpenMenu, onToggleLike, onOpenComments, onOpenAuthorProfile, triggerToast }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleShare = async () => {
    const imageToShare = ann.images && ann.images.length > 0
      ? ann.images[activeSlide] || ann.images[0]
      : null;

    const captionText = `*${ann.title}*

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
      {/* 1. HEADER KARTU PENGUMUMAN: USERNAME PENULIS + JANGKAUAN + TITIK TIGA KANAN ATAS */}
      <div className="p-4 flex items-center justify-between gap-3">
        <div 
          onClick={() => onOpenAuthorProfile(ann)}
          className="flex items-center gap-3 min-w-0 cursor-pointer group select-none"
          title="Lihat profil"
        >
          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center group-hover:ring-2 group-hover:ring-sky-400 transition-all">
            <img
              src={ann.authorAvatar || logoPonpesImg}
              alt={ann.authorHandle || ann.authorName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <h4 className="font-display font-bold text-xs sm:text-sm text-slate-900 truncate leading-tight group-hover:text-sky-600 transition-colors">
              {formatAuthorUsername(ann.authorHandle || ann.authorName)}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-[11px] text-slate-400">
                {ann.date}
              </span>
              <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Globe className="w-2.5 h-2.5 text-sky-600" />
                <span>{formatAudienceSummary(ann.targetAudience)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Titik 3 Kanan Atas */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onOpenMenu(ann)}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
            title="Menu Opsi Pengumuman"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. MEDIA SLIDER FOTO */}
      {ann.images && ann.images.length > 0 && (
        <PostMediaCarousel
          images={ann.images}
          title={ann.title}
          onPreview={onPreview}
          onSlideChange={setActiveSlide}
        />
      )}

      {/* 3. CAPTION & DETAIL INFORMASI PENGUMUMAN (TANPA USERNAME @) */}
      <div className="px-4 py-3 space-y-2 text-xs">
        <div className="text-slate-800 text-xs">
          <p 
            onClick={() => setIsExpanded(!isExpanded)}
            className={`leading-relaxed cursor-pointer select-none ${isExpanded ? '' : 'line-clamp-2'}`}
            title={isExpanded ? "Klik untuk menyembunyikan" : "Klik untuk membaca selengkapnya"}
          >
            <span className="font-bold text-slate-900 mr-1.5">{ann.title}</span>
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

      {/* 4. FOOTER 3 TOMBOL: SUKA (IKON + JUMLAH), KOMENTAR (IKON + JUMLAH), BAGIKAN (HANYA IKON) */}
      <div className="border-t border-slate-100 grid grid-cols-3 divide-x divide-slate-100 bg-white">
        {/* Tombol Suka */}
        <button
          type="button"
          onClick={() => onToggleLike(ann.id)}
          className={`py-2.5 px-2 flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer active:scale-95 ${
            ann.isLiked
              ? 'text-rose-600 hover:text-rose-700 bg-rose-50/40'
              : 'text-slate-600 hover:text-rose-600 hover:bg-slate-50'
          }`}
          title="Sukai Pengumuman"
        >
          <Heart className={`w-4 h-4 transition-transform active:scale-125 ${ann.isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`} />
          <span>{ann.likesCount || 0}</span>
        </button>

        {/* Tombol Komentar */}
        <button
          type="button"
          onClick={() => onOpenComments(ann)}
          className="py-2.5 px-2 flex items-center justify-center gap-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50/50 text-xs font-semibold transition-colors cursor-pointer active:scale-95"
          title="Buka Komentar"
        >
          <MessageSquare className="w-4 h-4 text-slate-500" />
          <span>{ann.commentsCount || 0}</span>
        </button>

        {/* Tombol Bagikan (Hanya Ikon) */}
        <button
          type="button"
          onClick={handleShare}
          className="py-2.5 px-2 flex items-center justify-center text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/50 text-xs font-semibold transition-colors cursor-pointer active:scale-95"
          title="Bagikan Pengumuman"
        >
          <Share2 className="w-4 h-4 text-slate-500" />
        </button>
      </div>
    </div>
  );
};

export const AdminAnnouncementsTab: React.FC<AdminAnnouncementsTabProps> = ({
  announcements,
  adminUser,
  alumniList = [],
  onAddAnnouncement: _onAddAnnouncement,
  onUpdateAnnouncement,
  onDeleteAnnouncement,
  triggerToast,
  onOpenCreateModal: _onOpenCreateModal,
  onOpenEditModal,
  onOpenAuthorProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScope, setSelectedScope] = useState<'Semua' | 'Umum' | 'Provinsi' | 'Kabupaten' | 'Kecamatan' | 'Desa'>('Semua');
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Bottom sheet opsi titik tiga pengumuman
  const [activeMenuAnnouncement, setActiveMenuAnnouncement] = useState<AnnouncementItem | null>(null);

  // Delete confirm modal state
  const [deleteCandidate, setDeleteCandidate] = useState<AnnouncementItem | null>(null);

  // Comments modal state
  const [activeCommentsAnnouncement, setActiveCommentsAnnouncement] = useState<AnnouncementItem | null>(null);
  const [commentsList, setCommentsList] = useState<EventComment[]>(INITIAL_ANNOUNCEMENT_COMMENTS);

  const confirmDelete = () => {
    if (!deleteCandidate) return;
    onDeleteAnnouncement(deleteCandidate.id);
    triggerToast('Pengumuman berhasil dihapus');
    setDeleteCandidate(null);
  };

  // Toggle Like on announcement post
  const handleToggleLike = (id: string) => {
    const ann = announcements.find((a) => a.id === id);
    if (!ann) return;
    const isNowLiked = !ann.isLiked;
    const newLikesCount = Math.max(0, (ann.likesCount || 0) + (isNowLiked ? 1 : -1));
    onUpdateAnnouncement(id, {
      isLiked: isNowLiked,
      likesCount: newLikesCount,
    });
  };

  // Handle add comment to announcement
  const handleAddComment = (targetId: string, text: string, replyToCommentId?: string) => {
    if (!text.trim()) return;

    if (replyToCommentId) {
      const newReply: EventCommentReply = {
        id: `ann-rep-${Date.now()}`,
        commentId: replyToCommentId,
        authorName: adminUser.name,
        authorAvatar: adminUser.avatar,
        avatarRing: true,
        content: text.trim(),
        timeAgo: 'Baru saja',
        likesCount: 0,
        isLiked: false,
      };

      setCommentsList((prev) =>
        prev.map((c) => {
          if (c.id === replyToCommentId) {
            const replies = c.replies || [];
            return {
              ...c,
              repliesCount: (c.repliesCount || replies.length) + 1,
              replies: [...replies, newReply],
            };
          }
          return c;
        })
      );
    } else {
      const newComment: EventComment = {
        id: `ann-comm-${Date.now()}`,
        eventId: targetId,
        authorName: adminUser.name,
        authorAvatar: adminUser.avatar,
        avatarRing: true,
        content: text.trim(),
        timeAgo: 'Baru saja',
        likesCount: 0,
        isLiked: false,
        repliesCount: 0,
        replies: [],
      };

      setCommentsList((prev) => [newComment, ...prev]);

      // Update commentsCount on the announcement item
      const ann = announcements.find((a) => a.id === targetId);
      if (ann) {
        onUpdateAnnouncement(targetId, {
          commentsCount: (ann.commentsCount || 0) + 1,
        });
      }
    }
  };

  // Handle toggle like on comment/reply
  const handleToggleLikeComment = (commentId: string, replyId?: string) => {
    setCommentsList((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          if (replyId && c.replies) {
            const updatedReplies = c.replies.map((r) => {
              if (r.id === replyId) {
                const nextLiked = !r.isLiked;
                return {
                  ...r,
                  isLiked: nextLiked,
                  likesCount: (r.likesCount || 0) + (nextLiked ? 1 : -1),
                };
              }
              return r;
            });
            return { ...c, replies: updatedReplies };
          } else {
            const nextLiked = !c.isLiked;
            return {
              ...c,
              isLiked: nextLiked,
              likesCount: (c.likesCount || 0) + (nextLiked ? 1 : -1),
            };
          }
        }
        return c;
      })
    );
  };

  // Filter announcements by reach/scope & search
  const filteredAnnouncements = announcements.filter((item) => {
    if (selectedScope !== 'Semua') {
      if (selectedScope === 'Umum') {
        const isUmum =
          !item.targetAudience ||
          item.targetAudience.regionScope === 'semua' ||
          (!item.targetAudience.provinceId &&
            !item.targetAudience.regencyId &&
            !item.targetAudience.districtId &&
            !item.targetAudience.villageId);
        if (!isUmum) return false;
      } else if (selectedScope === 'Provinsi') {
        if (!item.targetAudience?.provinceId || item.targetAudience?.regencyId) return false;
      } else if (selectedScope === 'Kabupaten') {
        if (!item.targetAudience?.regencyId || item.targetAudience?.districtId) return false;
      } else if (selectedScope === 'Kecamatan') {
        if (!item.targetAudience?.districtId || item.targetAudience?.villageId) return false;
      } else if (selectedScope === 'Desa') {
        if (!item.targetAudience?.villageId && !item.targetAudience?.villageName) return false;
      }
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

      {/* ================= 2. FILTER JANGKAUAN: SEMUA, UMUM, PROVINSI, KABUPATEN, KECAMATAN, DESA ================= */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-3 shrink-0">
        {(['Semua', 'Umum', 'Provinsi', 'Kabupaten', 'Kecamatan', 'Desa'] as const).map((tag) => {
          const isActive = selectedScope === tag;
          return (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedScope(tag)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all border ${
                isActive
                  ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50'
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* ================= 3. DAFTAR PENGUMUMAN ================= */}
      <div className="space-y-5">
        {filteredAnnouncements.map((ann) => (
          <AnnouncementCardItem
            key={ann.id}
            ann={ann}
            onPreview={(url) => setPreviewPhotoUrl(url)}
            onOpenMenu={(item) => setActiveMenuAnnouncement(item)}
            onToggleLike={handleToggleLike}
            onOpenComments={(item) => setActiveCommentsAnnouncement(item)}
            onOpenAuthorProfile={(item) => {
              const record = resolveAuthorAlumniRecord(item.authorName, item.authorHandle, item.authorAvatar, alumniList, adminUser);
              onOpenAuthorProfile?.(record);
            }}
            triggerToast={triggerToast}
          />
        ))}

        {filteredAnnouncements.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 text-center text-slate-500 text-xs space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">Tidak ada pengumuman</p>
            <p className="text-slate-400 text-[11px]">
              Belum ada informasi pada filter ini atau kata kunci yang dicari.
            </p>
          </div>
        )}
      </div>

      {/* ================= BOTTOM SHEET MENU TITIK 3 PENGUMUMAN (EDIT, BAGIKAN, HAPUS) ================= */}
      {activeMenuAnnouncement && (
        <div 
          className="fixed inset-0 z-[100020] bg-black/60 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-150"
          onClick={() => setActiveMenuAnnouncement(null)}
        >
          <div 
            className="bg-white rounded-t-3xl w-full max-w-lg p-5 pb-6 space-y-2 shadow-2xl border-t border-slate-200 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Drag Handle */}
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-2" />

            <div className="space-y-1">
              {/* 1. Edit */}
              <button
                type="button"
                onClick={() => {
                  const annToEdit = activeMenuAnnouncement;
                  setActiveMenuAnnouncement(null);
                  if (onOpenEditModal) onOpenEditModal(annToEdit);
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-colors cursor-pointer text-left"
              >
                <Pencil className="w-5 h-5 text-slate-700 shrink-0" />
                <span>Edit</span>
              </button>

              {/* 2. Bagikan */}
              <button
                type="button"
                onClick={async () => {
                  const annToShare = activeMenuAnnouncement;
                  setActiveMenuAnnouncement(null);
                  const imageToShare = annToShare.images && annToShare.images.length > 0 ? annToShare.images[0] : null;
                  await shareMediaWithCaption({
                    imageUrl: imageToShare,
                    title: annToShare.title,
                    text: `*${annToShare.title}*\n\n${annToShare.content}\n\n📅 Tanggal: ${annToShare.date}\nDiterbitkan oleh: ${annToShare.authorName || 'Pondok Pesantren At-taroqqy'}`,
                    onToast: triggerToast,
                  });
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-colors cursor-pointer text-left"
              >
                <Share2 className="w-5 h-5 text-slate-700 shrink-0" />
                <span>Bagikan</span>
              </button>

              {/* 3. Hapus */}
              <button
                type="button"
                onClick={() => {
                  const annToDelete = activeMenuAnnouncement;
                  setActiveMenuAnnouncement(null);
                  setDeleteCandidate(annToDelete);
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl hover:bg-rose-50 text-rose-600 font-semibold text-sm transition-colors cursor-pointer text-left"
              >
                <Trash2 className="w-5 h-5 text-rose-600 shrink-0" />
                <span>Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL KOMENTAR PENGUMUMAN ================= */}
      {activeCommentsAnnouncement && (
        <EventCommentsModal
          targetId={activeCommentsAnnouncement.id}
          modalTitle="Komentar"
          hideAttendanceSummary={true}
          comments={commentsList}
          currentUser={{
            name: adminUser.name,
            photoUrl: adminUser.avatar,
          }}
          onClose={() => setActiveCommentsAnnouncement(null)}
          onAddComment={handleAddComment}
          onToggleLike={handleToggleLikeComment}
        />
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
