import React, { useState, useRef } from 'react';
import { Heart, Send } from 'lucide-react';
import { AnnouncementItem, EventComment } from '../../types';

interface AnnouncementCommentsModalProps {
  announcement: AnnouncementItem;
  comments: EventComment[];
  currentUser: {
    name: string;
    username?: string;
    photoUrl?: string;
  };
  onClose: () => void;
  onAddComment: (announcementId: string, text: string, replyToCommentId?: string) => void;
  onToggleLike: (commentId: string, replyId?: string) => void;
}

const QUICK_EMOJIS = ['👍', '🤲', '🔥', '👏', '❤️', '🙏', '✨', '😊'];

export const AnnouncementCommentsModal: React.FC<AnnouncementCommentsModalProps> = ({
  announcement,
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

  const announcementComments = comments.filter((c) => c.eventId === announcement.id);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onAddComment(announcement.id, inputText.trim(), replyingToCommentId || undefined);
    setInputText('');
    setReplyingToCommentId(null);
  };

  const handleEmojiClick = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const handleReplyClick = (commentId: string, authorName: string) => {
    setInputText(`@${authorName} `);
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

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const endY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - endY;

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
        {/* Drag Handle Bar di bagian atas */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="pt-3 pb-2 px-4 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing border-b border-slate-100"
        >
          <div className="w-10 h-1.5 bg-slate-300 hover:bg-slate-400 rounded-full transition-colors mb-2" />
          <h3 className="text-sm font-bold text-slate-900 leading-tight">Komentar</h3>
          <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5 font-medium">
            {announcement.title}
          </p>
        </div>

        {/* List of Comments & Replies */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-white">
          {announcementComments.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs">
              Belum ada komentar. Jadilah yang pertama memberikan komentar!
            </div>
          ) : (
            announcementComments.map((c) => {
              const replies = c.replies || [];
              const isRepliesOpen = expandedReplies[c.id];
              const displayRepliesCount = replies.length || c.repliesCount || 0;

              return (
                <div key={c.id} className="space-y-2">
                  {/* Induk Komentar */}
                  <div className="flex items-start justify-between gap-3 text-xs">
                    <div className="shrink-0">
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

                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs">
                          {c.authorName}
                        </span>
                        <span className="text-[11px] text-slate-400">{c.timeAgo}</span>
                      </div>

                      <p className="text-slate-700 text-xs mt-1 leading-snug break-words">
                        {c.content}
                      </p>

                      <div className="mt-1 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleReplyClick(c.id, c.authorName)}
                          className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          Balas
                        </button>
                      </div>

                      {displayRepliesCount > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleReplies(c.id)}
                          className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 mt-2 cursor-pointer select-none"
                        >
                          <span className="w-4 h-[1px] bg-slate-400 inline-block" />
                          <span>
                            {isRepliesOpen
                              ? 'Sembunyikan balasan'
                              : `Lihat ${displayRepliesCount} balasan`}
                          </span>
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleLike(c.id)}
                      className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-rose-500 pt-1 cursor-pointer"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 transition-colors ${
                          c.isLiked ? 'text-rose-500 fill-rose-500' : ''
                        }`}
                      />
                      {(c.likesCount || 0) > 0 && (
                        <span className="text-[9px] font-medium text-slate-400">
                          {c.likesCount}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* List Balasan Bertingkat */}
                  {isRepliesOpen && replies.length > 0 && (
                    <div className="pl-10 space-y-3 pt-1 border-l-2 border-slate-100 ml-4">
                      {replies.map((rep) => (
                        <div key={rep.id} className="flex items-start justify-between gap-2.5 text-xs">
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

                          <button
                            type="button"
                            onClick={() => onToggleLike(c.id, rep.id)}
                            className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-rose-500 pt-0.5 cursor-pointer"
                          >
                            <Heart
                              className={`w-3 h-3 transition-colors ${
                                rep.isLiked ? 'text-rose-500 fill-rose-500' : ''
                              }`}
                            />
                            {(rep.likesCount || 0) > 0 && (
                              <span className="text-[9px] font-medium text-slate-400">
                                {rep.likesCount}
                              </span>
                            )}
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

        {/* Quick Emoji Bar di atas form input */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar shrink-0">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleEmojiClick(emoji)}
              className="text-lg hover:scale-125 transition-transform active:scale-95 p-1 cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Form Input Komentar di Bagian Bawah */}
        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
          {replyingToCommentId && (
            <div className="flex items-center justify-between text-[11px] text-sky-600 bg-sky-50 px-3 py-1 rounded-lg mb-2">
              <span>Membalas komentar...</span>
              <button
                type="button"
                onClick={() => {
                  setReplyingToCommentId(null);
                  setInputText('');
                }}
                className="font-bold text-sky-800 hover:underline cursor-pointer"
              >
                Batal
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
              {currentUser.photoUrl ? (
                <img
                  src={currentUser.photoUrl}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-xs text-slate-600">
                  {currentUser.name.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Tulis komentar sebagai ${currentUser.name.split(' ')[0]}...`}
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-100 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all font-medium"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="absolute right-1.5 p-1.5 rounded-full text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-40 disabled:hover:bg-sky-600 transition-all cursor-pointer disabled:cursor-not-allowed"
                title="Kirim Komentar"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
