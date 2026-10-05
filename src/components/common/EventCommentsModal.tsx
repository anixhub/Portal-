import React, { useState, useRef } from 'react';
import { Heart, Send } from 'lucide-react';
import { EventAgenda, EventComment } from '../../types';

interface EventCommentsModalProps {
  event?: EventAgenda | { id: string; title?: string; attendeesCount?: number; absentCount?: number };
  targetId?: string;
  modalTitle?: string;
  hideAttendanceSummary?: boolean;
  comments: EventComment[];
  currentUser: {
    name: string;
    username?: string;
    photoUrl?: string;
  };
  onClose: () => void;
  onAddComment: (targetId: string, text: string, replyToCommentId?: string) => void;
  onToggleLike: (commentId: string, replyId?: string) => void;
}

const QUICK_EMOJIS = ['🤣', '🙌', '🔥', '👏', '😢', '🗿', '😭', '😂'];

export const EventCommentsModal: React.FC<EventCommentsModalProps> = ({
  event,
  targetId,
  modalTitle = 'Tanggapan',
  hideAttendanceSummary = false,
  comments,
  currentUser,
  onClose,
  onAddComment,
  onToggleLike,
}) => {
  const [inputText, setInputText] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);

  const touchStartY = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const effectiveId = targetId || event?.id || '';
  const eventComments = comments.filter((c) => c.eventId === effectiveId);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onAddComment(effectiveId, inputText.trim(), replyingToCommentId || undefined);
    setInputText('');
    setReplyingToCommentId(null);
  };

  const handleEmojiClick = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  // Saat kita klik balas otomatis akan tag orang yang kita balas & fokus ke input
  const handleReplyClick = (commentId: string, authorHandleOrName: string) => {
    const handle = authorHandleOrName.toLowerCase().replace(/\s+/g, '_');
    setInputText(`@${handle} `);
    setReplyingToCommentId(commentId);
    setExpandedReplies((prev) => ({ ...prev, [commentId]: true }));
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  // Touch gesture handlers: geser ke atas jadi full screen, geser ke bawah perkecil/tutup
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const endY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - endY; // Positif jika digeser ke atas

    if (diff > 45 && !isFullScreen) {
      setIsFullScreen(true);
    } else if (diff < -50) {
      if (isFullScreen) {
        setIsFullScreen(false);
      } else {
        onClose();
      }
    }
    touchStartY.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex flex-col justify-end animate-in fade-in select-none"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-lg mx-auto bg-white shadow-2xl flex flex-col transition-all duration-300 ease-out border-t border-slate-200 ${
          isFullScreen
            ? 'h-[100dvh] max-h-screen rounded-none sm:rounded-3xl'
            : 'h-[75vh] max-h-[85vh] rounded-t-[32px] sm:rounded-3xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle Bar di bagian atas (Tanpa garis tipis di atas kata tanggapan, Tanpa ikon perbesar dan Tanpa icon X) */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="pt-3 pb-1 px-4 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing"
          title="Geser ke atas untuk layar penuh"
        >
          <div className="w-10 h-1.5 bg-slate-300 hover:bg-slate-400 rounded-full transition-colors mb-2" />
          <h3 className="text-sm font-bold text-slate-900">{modalTitle}</h3>
        </div>

        {/* Keterangan Jumlah Hadir & Tidak Hadir di Bagian Atas Kotak Tanggapan jika ada dan tidak di-hide */}
        {!hideAttendanceSummary && event && ('attendeesCount' in event || 'absentCount' in event) && (
          <div className="px-4 py-2 bg-slate-50 border-y border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                <strong className="font-bold text-slate-900">{event.attendeesCount || 0}</strong> Hadir
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>
                <strong className="font-bold text-slate-900">{event.absentCount || 0}</strong> Tidak Hadir
              </span>
            </div>
          </div>
        )}

        {/* List of Comments & Replies */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-white">
          {eventComments.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs">
              Belum ada tanggapan. Jadilah yang pertama memberikan tanggapan!
            </div>
          ) : (
            eventComments.map((c) => {
              const replies = c.replies || [];
              const isRepliesOpen = expandedReplies[c.id];
              const displayRepliesCount = replies.length || c.repliesCount || 0;

              return (
                <div key={c.id} className="space-y-2">
                  {/* Induk Tanggapan */}
                  <div className="flex items-start justify-between gap-3 text-xs">
                    {/* Left: Avatar with optional Instagram gradient ring */}
                    <div className="shrink-0">
                      {c.avatarRing ? (
                        <div className="p-[2px] bg-gradient-to-tr from-amber-500 via-rose-500 to-fuchsia-600 rounded-full">
                          {c.authorAvatar ? (
                            <img
                              src={c.authorAvatar}
                              alt={c.authorName}
                              className="w-8 h-8 rounded-full object-cover border-2 border-white"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-[11px] border-2 border-white">
                              {c.authorName.charAt(0)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          {c.authorAvatar ? (
                            <img
                              src={c.authorAvatar}
                              alt={c.authorName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-[11px]">
                              {c.authorName.charAt(0)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Center: Author, Time, Response & Replies */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs">
                          {c.authorName}
                        </span>
                        <span className="text-[11px] text-slate-400">{c.timeAgo}</span>
                        {c.status && (
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              c.status === 'hadir'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {c.status === 'hadir' ? 'Hadir' : 'Tidak Hadir'}
                          </span>
                        )}
                      </div>

                      <p className="text-slate-700 text-xs mt-1 leading-snug break-words">
                        {c.content}
                      </p>

                      <div className="mt-1 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleReplyClick(c.id, c.authorHandle || c.authorName)}
                          className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          Balas
                        </button>
                      </div>

                      {/* Tombol Lihat Balasan Lainnya */}
                      {displayRepliesCount > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleReplies(c.id)}
                          className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 mt-2 cursor-pointer select-none"
                        >
                          <span className="w-5 h-px bg-slate-400 inline-block" />
                          <span>
                            {isRepliesOpen
                              ? 'Sembunyikan balasan'
                              : `Lihat ${displayRepliesCount} balasan lainnya`}
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Right: Heart Like Button & Count */}
                    <button
                      type="button"
                      onClick={() => onToggleLike(c.id)}
                      className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-rose-500 cursor-pointer pt-0.5 shrink-0"
                      title="Sukai tanggapan"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 transition-colors ${
                          c.isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
                        }`}
                      />
                      <span className="text-[10px] text-slate-400">{c.likesCount || 0}</span>
                    </button>
                  </div>

                  {/* DAFTAR BALASAN (MUNCUL SAAT KLIK LIHAT BALASAN) */}
                  {isRepliesOpen && replies.length > 0 && (
                    <div className="pl-10 space-y-3 pt-1 border-l-2 border-slate-100 ml-4 animate-in fade-in duration-150">
                      {replies.map((rep) => (
                        <div key={rep.id} className="flex items-start justify-between gap-2.5 text-xs">
                          {/* Avatar Balasan */}
                          <div className="shrink-0">
                            {rep.authorAvatar ? (
                              <img
                                src={rep.authorAvatar}
                                alt={rep.authorName}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-[10px]">
                                {rep.authorName.charAt(0)}
                              </div>
                            )}
                          </div>

                          {/* Isi Balasan */}
                          <div className="flex-1 min-w-0 pr-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs">
                                {rep.authorName}
                              </span>
                              <span className="text-[10px] text-slate-400">{rep.timeAgo}</span>
                            </div>

                            <p className="text-slate-700 text-xs mt-0.5 leading-snug break-words">
                              {rep.content}
                            </p>

                            <div className="mt-0.5 flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleReplyClick(c.id, rep.authorName)}
                                className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                              >
                                Balas
                              </button>
                            </div>
                          </div>

                          {/* Like Balasan */}
                          <button
                            type="button"
                            onClick={() => onToggleLike(c.id, rep.id)}
                            className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-rose-500 cursor-pointer pt-0.5 shrink-0"
                            title="Sukai balasan"
                          >
                            <Heart
                              className={`w-3 h-3 transition-colors ${
                                rep.isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
                              }`}
                            />
                            <span className="text-[9px] text-slate-400">{rep.likesCount || 0}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Reaction Bar: Emoji Carousel + Input Row */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2">
          {/* Quick Emoji Bar */}
          <div className="flex items-center justify-between px-1 select-none text-lg">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleEmojiClick(emoji)}
                className="hover:scale-125 transition-transform active:scale-95 cursor-pointer p-0.5"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Comment Input Row */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1">
            {/* User Avatar */}
            <div className="shrink-0">
              {currentUser.photoUrl ? (
                <img
                  src={currentUser.photoUrl}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
                  {currentUser.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Input Field (otomatis ter-tag saat klik Balas) */}
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Bergabung dengan percakapan..."
              className="flex-1 bg-white text-slate-900 placeholder-slate-400 text-xs px-3.5 py-2 rounded-full focus:outline-none focus:ring-1 focus:ring-sky-500 border border-slate-300 shadow-2xs"
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!inputText.trim()}
              className={`p-2 rounded-full transition-colors cursor-pointer shrink-0 ${
                inputText.trim()
                  ? 'text-sky-600 hover:text-sky-700 active:scale-95'
                  : 'text-slate-300 cursor-not-allowed'
              }`}
              title="Kirim Tanggapan"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
