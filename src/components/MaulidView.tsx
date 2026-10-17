import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  ArrowLeft, 
  Moon, 
  Sun, 
  Menu,
  Search,
  X,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Check
} from 'lucide-react';
import { useBackHandler } from '../utils/navigationHistory';
import { 
  R, 
  buildMaulidBooks, 
  ordAr, 
  getHijriDate, 
  isSl, 
  MaulidBook, 
  ChapterItem 
} from '../data/maulidData';
import { AyahCircleMedallion, LpmqSvgDefs } from './lpmqAyahCirclePath';
import { BismillahCalligraphy } from './BismillahCalligraphy';
import { SholawatCartoucheFrame } from './SholawatCartoucheFrame';
import { getMaulidTextTranslation } from '../data/maulidTranslations';

interface MaulidViewProps {
  isOpen: boolean;
  onClose: () => void;
  initialBookId?: string; // 'b' | 's' | 'd' | 'a' | 'q'
  initialChapterIndex?: number;
}

interface MaulidBookMeta {
  id: string;
  indoTitle: string;
  author: string;
  shortAr: string;
  fullAr: string;
}

const MAULID_BOOKS_META: Record<string, MaulidBookMeta> = {
  b: {
    id: 'b',
    indoTitle: 'Maulid Al-Barzanji',
    author: "Syekh Ja'far al-Barzanji",
    shortAr: 'مَوْلِدُ الْبَرْزَنْجِيِّ',
    fullAr: 'مَوْلِدُ الْبَرْزَنْجِيِّ'
  },
  s: {
    id: 's',
    indoTitle: 'Simtud Duror',
    author: 'Habib Ali bin Muhammad al-Habsyi',
    shortAr: 'سِمْطُ الدُّرَرِ',
    fullAr: 'سِمْطُ الدُّرَرِ فِي أَخْبَارِ مَوْلِدِ خَيْرِ الْبَشَرِ'
  },
  d: {
    id: 'd',
    indoTitle: "Maulid Dliyaul Lami'",
    author: 'Habib Umar bin Hafidz',
    shortAr: 'الضِّيَاءُ اللَّامِعُ',
    fullAr: 'الضِّيَاءُ اللَّامِعُ بِذِكْرِ مَوْلِدِ النَّبِيِّ الشَّفِيعِ'
  },
  a: {
    id: 'a',
    indoTitle: "Maulid Ad-Diba'i",
    author: "Imam Abdurrahman ad-Diba'i",
    shortAr: 'مَوْلِدُ الدِّيبَعِيِّ',
    fullAr: 'مَوْلِدُ الدِّيبَعِيِّ'
  }
};

/**
 * Label untuk Tab Bar Horizontal di atas (Pill Bar)
 * Contoh pada Barzanji: 1. Laqod Jāakum, 2. Abtadiul Imlāa, 3. Waba'du Faaqūlu
 */
export function getChapterTabLabel(book: MaulidBook, idx: number): string {
  const ch = book.ch[idx];
  if (!ch) return '';
  if (book.id === 'b') {
    if (idx === 0) return 'Yā Robbi Sholli';
    if (idx === 1) return '1. Laqod Jāakum';
    if (idx === 2) return '2. Abtadiul Imlāa';
    if (idx === 3) return "3. Waba'du Faaqūlu";
    if (idx === 4) return '4. Walammā Arādallāh';
    if (idx === 5) return '5. Walammā Tamma';
    if (idx === 6) return '6. Mahalul Qiyam';
    if (idx === 7) return '7. Wabaraza ﷺ';
    if (idx === 8) return "8. Wa Zhahara 'Inda";
    if (idx === 9) return "9. Wa Ardha'at-hu";
    if (idx === 10) return '10. Wa Kāna Yasyubbu';
    if (idx === 11) return '11. Walammā Balagha';
    if (idx === 12) return '12. Walammā Balagha 25';
    if (idx === 13) return '13. Banat Quroisy';
    if (idx === 14) return '14. Ba\'atsahullāh';
    if (idx === 15) return '15. Awwalu Man Āmana';
    if (idx === 16) return '16. Tsumma Usriya';
    if (idx === 17) return '17. \'Ardhu Nafsihi';
    if (idx === 18) return '18. Doa Penutup';
    return `${idx}. ${ch.l || ch.t}`;
  }
  return `${idx + 1}. ${ch.l || ch.t}`;
}

/**
 * Judul Fasal di Header Atas (contoh: "Muqaddimah" pada Laqod Jāakum)
 */
export function getChapterHeaderTitle(book: MaulidBook, idx: number): string {
  const ch = book.ch[idx];
  if (!ch) return '';
  if (book.id === 'b' && idx === 1) return 'Muqaddimah';
  if (ch.lb0 === 'Sholawat' || ch.lb === 'Sholawat') return 'Sholawat Pembuka';
  if (ch.t.includes('الْقِيَامُ') || ch.lb === 'Qiyām') return 'Mahalul Qiyam';
  return ch.l || ch.t;
}

interface MaulidChapterContentProps {
  book: MaulidBook;
  chapterIndex: number;
  fontSize: number;
  showTranslation: boolean;
  openToggles: Record<string, boolean>;
  onToggleHeading: (key: string) => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  onGoPrev: () => void;
  onGoNext: () => void;
}

const MaulidChapterContent: React.FC<MaulidChapterContentProps> = ({
  book,
  chapterIndex,
  fontSize,
  showTranslation,
  openToggles,
  onToggleHeading,
  canGoPrev,
  canGoNext,
  onGoPrev,
  onGoNext
}) => {
  const chapter = book.ch[chapterIndex];
  if (!chapter) return null;

  return (
    <div>
      {!chapter.b ? (
        <div className="text-center text-slate-500 py-16 px-4 leading-relaxed text-xs sm:text-sm bg-white rounded-2xl border border-slate-200/80 my-4 shadow-xs">
          <p className="font-semibold text-slate-700">Teks bab ini belum dimuat.</p>
          <p className="text-slate-400 mt-1">Teks berharakat dan terjemahan sedang disinkronkan.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {chapter.b.p.map((x: any, pIdx: number) => {
            // 1. Sholawat Pembuka: "اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَيْهِ"
            if ((typeof x === 'string' && isSl(x)) || (typeof x === 'string' && x.includes("اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَيْهِ"))) {
              const tr = getMaulidTextTranslation(x, book.id, chapterIndex, pIdx);
              return (
                <div key={`sholawat-cartouche-${pIdx}`} className="my-4 text-center">
                  <SholawatCartoucheFrame text="اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَيْهِ" />
                  {showTranslation && (
                    <p className="text-center text-xs sm:text-sm text-slate-600 mt-2 mb-6 font-normal max-w-md mx-auto leading-relaxed">
                      {tr || "Ya Allah, limpahkanlah rahmat, keselamatan, dan keberkahan kepada-Nya."}
                    </p>
                  )}
                </div>
              );
            }

            // 2. Basmalah Calligraphy: "بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيمِ"
            if (
              (x.c && (x.c.includes("بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيمِ") || x.c === "بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيمِ")) ||
              (typeof x === 'string' && (x.includes("بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيمِ") || x === "بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيمِ"))
            ) {
              const tr = getMaulidTextTranslation("بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيمِ", book.id, chapterIndex, pIdx);
              return (
                <div key={`basmalah-${pIdx}`} className="my-6 text-center">
                  <BismillahCalligraphy className="w-56 sm:w-64 max-w-[80vw] h-auto mx-auto my-2 text-slate-800" />
                  {showTranslation && (
                    <p className="text-center text-xs sm:text-sm text-slate-600 mt-2 mb-6 font-normal max-w-md mx-auto leading-relaxed">
                      {tr || "Dengan nama Allah Yang Maha Pengasih, Maha Penyayang."}
                    </p>
                  )}
                </div>
              );
            }

            // 3. Ayat / Fasal / Callout Khusus: x.c
            if (x.c) {
              const tr = getMaulidTextTranslation(x.c, book.id, chapterIndex, pIdx);
              return (
                <div key={`callout-${pIdx}`} className="my-5">
                  <div
                    className="font-arabic text-right text-[calc(var(--fs)*1.08)] leading-[2.4] text-slate-900 font-semibold my-2"
                    dir="rtl"
                    style={{ fontFamily: "'Amiri Quran', 'Scheherazade New', serif" }}
                    dangerouslySetInnerHTML={{
                      __html: x.c.replace(/۝/g, "<span class='inline-block text-amber-700 mx-1 font-normal'>۝</span>")
                    }}
                  />
                  {showTranslation && tr && (
                    <p className="text-left text-xs sm:text-sm text-slate-700 leading-relaxed font-normal mt-2.5 mb-2">
                      {tr}
                    </p>
                  )}
                  <div className="w-full border-t border-slate-200/80 my-5" />
                </div>
              );
            }

            // 4. Paragraf Rawi Narasi (string biasa)
            if (typeof x === 'string') {
              const tr = getMaulidTextTranslation(x, book.id, chapterIndex, pIdx);
              return (
                <div key={`rawi-p-${pIdx}`} className="my-5">
                  <p
                    className="font-arabic text-justify text-right text-[var(--fs)] leading-[2.3] mb-3 text-slate-900"
                    dir="rtl"
                    style={{ fontFamily: "'Scheherazade New', 'Amiri Quran', serif" }}
                    dangerouslySetInnerHTML={{
                      __html: x.replace(/❁/g, "<span class='inline-block text-amber-700 mx-1 font-normal'>❁</span>")
                    }}
                  />
                  {showTranslation && tr && (
                    <p className="text-left text-xs sm:text-sm text-slate-700 leading-relaxed font-normal mb-3">
                      {tr}
                    </p>
                  )}
                  <div className="w-full border-t border-slate-200/70 my-5" />
                </div>
              );
            }

            // 5. Bagian Syair / Nadhom Dua Kolom (x.v)
            if (x.v) {
              return (
                <div key={`couplets-${pIdx}`} className="border-y border-slate-200/80 py-3 my-5 space-y-3" dir="rtl">
                  {x.v.map((r: string[], vIdx: number) => (
                    <div
                      key={vIdx}
                      className="grid grid-cols-2 gap-4 font-arabic text-[calc(var(--fs)*0.95)] leading-loose text-center text-slate-900"
                      style={{ fontFamily: "'Amiri Quran', 'Scheherazade New', serif" }}
                    >
                      <span>{r[0]}</span>
                      <span>{r[1]}</span>
                    </div>
                  ))}
                </div>
              );
            }

            // 6. Bagian dengan Judul Lipat (x.h)
            if (x.h) {
              const toggleKey = `${book.id}-${chapterIndex}-${pIdx}`;
              const isOpened = !!openToggles[toggleKey];

              return (
                <div key={`heading-section-${pIdx}`} className="my-5">
                  <button
                    type="button"
                    onClick={() => onToggleHeading(toggleKey)}
                    className="w-full my-3 py-3 px-3.5 border border-amber-600/40 rounded-xl bg-amber-50/70 text-[#1b6837] font-arabic text-[calc(var(--fs)*0.95)] leading-relaxed text-center cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs hover:bg-amber-100/70 transition-colors"
                    dir="rtl"
                    style={{ fontFamily: "'Amiri Quran', serif" }}
                  >
                    <span>{x.h}</span>
                    <span className="font-sans text-xs text-[#b45309]">{isOpened ? '▲' : '▼'}</span>
                  </button>
                  {isOpened && x.v && (
                    <div className="border-y border-slate-200/80 py-2 my-4 space-y-2" dir="rtl">
                      {x.v.map((r: string[], vIdx: number) => (
                        <div
                          key={vIdx}
                          className="grid grid-cols-2 gap-4 font-arabic text-[calc(var(--fs)*0.95)] leading-loose text-center my-1.5 text-slate-900"
                          style={{ fontFamily: "'Amiri Quran', 'Scheherazade New', serif" }}
                        >
                          <span>{r[0]}</span>
                          <span>{r[1]}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return null;
          })}

          {/* Refrain / Sholawat Penutup Rawi: c.b.r */}
          {chapter.b.r && (
            <div className="my-6 text-center">
              <div 
                className="font-arabic text-center text-[calc(var(--fs)*0.95)] leading-loose text-[#1b6837] border-y border-emerald-300/80 bg-emerald-50/60 py-4 px-3 rounded-2xl shadow-2xs"
                dir="rtl"
                style={{ fontFamily: "'Amiri Quran', serif" }}
                dangerouslySetInnerHTML={{
                  __html: R.replace(/❁/g, "<span class='inline-block text-amber-700 mx-1 font-normal'>❁</span>")
                }}
              />
              {showTranslation && (
                <p className="text-center text-xs sm:text-sm text-slate-600 mt-2.5 font-normal max-w-md mx-auto leading-relaxed">
                  Ya Allah, harumkanlah kuburnya yang mulia dengan keharuman semerbak sholawat dan salam. Ya Allah, limpahkanlah sholawat, salam, dan keberkahan kepada beliau.
                </p>
              )}
            </div>
          )}

          {/* Navigasi Cepat Bab Bawah: RTL Standard (Kiri = Berikutnya, Kanan = Sebelumnya) */}
          <div className="pt-6 pb-4 flex items-center justify-between border-t border-slate-200/70 mt-8 text-xs text-slate-500 select-none">
            <button
              type="button"
              disabled={!canGoNext}
              onClick={onGoNext}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                canGoNext ? 'bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 active:bg-emerald-100 shadow-2xs' : 'opacity-30 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Bab Berikutnya</span>
            </button>

            <span className="text-[11px] text-slate-400 font-medium">
              Geser layar untuk pindah
            </span>

            <button
              type="button"
              disabled={!canGoPrev}
              onClick={onGoPrev}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                canGoPrev ? 'bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 active:bg-emerald-100 shadow-2xs' : 'opacity-30 cursor-not-allowed'
              }`}
            >
              <span>Bab Sebelumnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const MaulidView: React.FC<MaulidViewProps> = ({
  isOpen,
  onClose,
  initialBookId,
  initialChapterIndex
}) => {
  const books = useMemo<MaulidBook[]>(() => buildMaulidBooks(), []);

  // View state: 'home' | 'toc' | 'read'
  const [currentView, setCurrentView] = useState<'home' | 'toc' | 'read'>('home');
  const [activeBookIndex, setActiveBookIndex] = useState<number>(0);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Settings: font size, show translation, theme
  const [fontSize, setFontSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('maulid_fs');
      return saved ? Math.min(48, Math.max(18, parseInt(saved, 10))) : 26;
    } catch (e) {
      return 26;
    }
  });

  const [showTranslation, setShowTranslation] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('maulid_show_tr');
      return saved !== null ? saved === 'true' : true;
    } catch (e) {
      return true;
    }
  });

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [openToggles, setOpenToggles] = useState<Record<string, boolean>>({});

  // Horizontal Swipe gesture state for chapter navigation (seperti pada Al-Qur'an - RTL push)
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isAnimatingSwipe, setIsAnimatingSwipe] = useState<boolean>(false);
  const dragOffsetRef = useRef<number>(0);
  const touchStartCoordRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingHorizontalRef = useRef<boolean>(false);
  const readerViewportRef = useRef<HTMLDivElement | null>(null);
  const animationTimeoutRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);

  // Scroller refs
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const readerRef = useRef<HTMLDivElement | null>(null);
  const tabScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const tabButtonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // TOC scroll animation refs
  const headerBgRef = useRef<HTMLDivElement | null>(null);
  const floatingArabicTitleRef = useRef<HTMLSpanElement | null>(null);
  const heroSubtitleRef = useRef<HTMLDivElement | null>(null);

  // Back handling
  useBackHandler(Boolean(isOpen && currentView === 'read'), 'maulid-read-view', () => {
    setCurrentView('toc');
    setIsPlayingAudio(false);
  });

  useBackHandler(Boolean(isOpen && currentView === 'toc'), 'maulid-toc-view', () => {
    setCurrentView('home');
  });

  useBackHandler(Boolean(isOpen && currentView === 'home'), 'maulid-home-view', () => {
    onClose();
  });

  // Helpers for numbering & meta
  const currentBook = books[activeBookIndex] || books[0];
  const currentBookMeta = MAULID_BOOKS_META[currentBook.id] || {
    id: currentBook.id,
    indoTitle: currentBook.id_.split('·')[0]?.trim() || currentBook.ar,
    author: currentBook.id_.split('·')[1]?.trim() || '',
    shortAr: currentBook.ar,
    fullAr: currentBook.ar
  };

  const numChaptersBefore = useCallback((j: number) => {
    return currentBook.ch.slice(0, j + 1).filter((c) => !c.i).length;
  }, [currentBook]);

  const chapterLabel = useCallback((t: number) => {
    const ch = currentBook.ch[t];
    if (!ch) return '';
    return ch.i ? (ch.lb || "مُقَدِّمَةٌ") : ordAr(numChaptersBefore(t));
  }, [currentBook, numChaptersBefore]);

  // Scroll effect on TOC header:
  // Judul arab yang awalnya besar di hero mengecil sembari bergeser menempati tempatnya di header
  const handleTocScroll = useCallback(() => {
    const sc = scrollerRef.current;
    if (!sc) return;
    const threshold = 75;
    const p = Math.min(1, Math.max(0, sc.scrollTop / threshold));

    if (headerBgRef.current) {
      headerBgRef.current.style.opacity = String(p);
    }
    if (heroSubtitleRef.current) {
      heroSubtitleRef.current.style.opacity = String(Math.max(0, 1 - p * 2.0));
    }
    if (floatingArabicTitleRef.current) {
      const y = (1 - p) * 58;
      const scale = 0.92 + (1 - p) * 0.43;
      floatingArabicTitleRef.current.style.transform = `translate3d(0, ${y}px, 0) scale(${scale})`;
    }
  }, []);

  // Open book handler
  const openBook = useCallback((idx: number) => {
    setActiveBookIndex(idx);
    setCurrentView('toc');
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
    requestAnimationFrame(() => {
      if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
      handleTocScroll();
    });
  }, [handleTocScroll]);

  // Open chapter handler
  const openChapter = useCallback((chapterIdx: number) => {
    setActiveChapterIndex(chapterIdx);
    setCurrentView('read');
    setOpenToggles({});
    dragOffsetRef.current = 0;
    setDragOffset(0);
    if (readerRef.current) readerRef.current.scrollTop = 0;
  }, []);

  // Set initial book / chapter if provided
  useEffect(() => {
    if (isOpen) {
      if (initialBookId) {
        const foundIdx = books.findIndex((b) => b.id === initialBookId);
        if (foundIdx >= 0) {
          setActiveBookIndex(foundIdx);
          if (initialChapterIndex !== undefined && initialChapterIndex >= 0) {
            setActiveChapterIndex(initialChapterIndex);
            setCurrentView('read');
          } else {
            setCurrentView('toc');
          }
          return;
        }
      }
      setCurrentView('home');
    }
  }, [isOpen, initialBookId, initialChapterIndex, books]);

  // Adjust font size
  const adjustFontSize = useCallback((delta: number) => {
    setFontSize((prev) => {
      const next = Math.min(48, Math.max(18, prev + delta));
      try {
        localStorage.setItem('maulid_fs', String(next));
      } catch (e) {}
      return next;
    });
  }, []);

  // Toggle Translation
  const toggleTranslation = useCallback(() => {
    setShowTranslation((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('maulid_show_tr', String(next));
      } catch (e) {}
      return next;
    });
  }, []);

  // Toggle Theme
  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Reset scroll and update title position when entering TOC view
  useEffect(() => {
    if (currentView === 'toc') {
      requestAnimationFrame(() => {
        if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
        handleTocScroll();
      });
    }
  }, [currentView, activeBookIndex, handleTocScroll]);

  // Auto-scroll active tab into view in Reader View (seperti pada Al-Qur'an)
  useEffect(() => {
    if (currentView === 'read') {
      const activeBtn = tabButtonsRef.current[activeChapterIndex];
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [currentView, activeChapterIndex]);

  // ================= SWIPE GESTURE HANDLERS (SEPERTI AL-QUR'AN - RTL CONTINUOUS PUSH) =================
  const canGoPrev = activeChapterIndex > 0;
  const canGoNext = activeChapterIndex < currentBook.ch.length - 1;

  const goToPrevChapter = useCallback(() => {
    if (canGoPrev) {
      openChapter(activeChapterIndex - 1);
    }
  }, [canGoPrev, activeChapterIndex, openChapter]);

  const goToNextChapter = useCallback(() => {
    if (canGoNext) {
      openChapter(activeChapterIndex + 1);
    }
  }, [canGoNext, activeChapterIndex, openChapter]);

  const finishSwipe = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (!touchStartCoordRef.current) return;
    const offset = dragOffsetRef.current;
    const wasDragging = isDraggingHorizontalRef.current;
    touchStartCoordRef.current = null;
    isDraggingHorizontalRef.current = false;

    if (!wasDragging || Math.abs(offset) < 4) {
      setDragOffset(0);
      dragOffsetRef.current = 0;
      return;
    }

    const containerWidth = readerViewportRef.current?.clientWidth || window.innerWidth || 360;
    const threshold = Math.min(85, Math.max(35, containerWidth * 0.14));

    if (offset > threshold && canGoNext) {
      // Geser ke KANAN -> Bab Berikutnya masuk dari KIRI (RTL persis Al-Qur'an)
      setIsAnimatingSwipe(true);
      setDragOffset(containerWidth);
      dragOffsetRef.current = containerWidth;
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = setTimeout(() => {
        openChapter(activeChapterIndex + 1);
        setIsAnimatingSwipe(false);
        setDragOffset(0);
        dragOffsetRef.current = 0;
        animationTimeoutRef.current = null;
      }, 260);
    } else if (offset < -threshold && canGoPrev) {
      // Geser ke KIRI -> Bab Sebelumnya masuk dari KANAN (RTL persis Al-Qur'an)
      setIsAnimatingSwipe(true);
      setDragOffset(-containerWidth);
      dragOffsetRef.current = -containerWidth;
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = setTimeout(() => {
        openChapter(activeChapterIndex - 1);
        setIsAnimatingSwipe(false);
        setDragOffset(0);
        dragOffsetRef.current = 0;
        animationTimeoutRef.current = null;
      }, 260);
    } else {
      // Balik ke tengah jika tidak melewati batas
      setIsAnimatingSwipe(true);
      setDragOffset(0);
      dragOffsetRef.current = 0;
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = setTimeout(() => {
        setIsAnimatingSwipe(false);
        animationTimeoutRef.current = null;
      }, 260);
    }
  }, [activeChapterIndex, canGoNext, canGoPrev, openChapter]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsAnimatingSwipe(false);
    const touch = e.touches[0];
    touchStartCoordRef.current = { x: touch.clientX, y: touch.clientY };
    isDraggingHorizontalRef.current = false;
    dragOffsetRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartCoordRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartCoordRef.current.x;
    const dy = touch.clientY - touchStartCoordRef.current.y;

    if (!isDraggingHorizontalRef.current) {
      if (Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy) * 1.15) {
        isDraggingHorizontalRef.current = true;
        touchStartCoordRef.current = { x: touch.clientX, y: touch.clientY };
        return;
      } else if (Math.abs(dy) > 8) {
        touchStartCoordRef.current = null;
        return;
      }
    }

    if (isDraggingHorizontalRef.current) {
      let effectiveDx = dx;
      if ((dx > 0 && !canGoNext) || (dx < 0 && !canGoPrev)) {
        effectiveDx = dx * 0.22;
      }
      dragOffsetRef.current = effectiveDx;
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          setDragOffset(dragOffsetRef.current);
          rafRef.current = null;
        });
      }
    }
  };

  const handleTouchEnd = () => {
    finishSwipe();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsAnimatingSwipe(false);
    touchStartCoordRef.current = { x: e.clientX, y: e.clientY };
    isDraggingHorizontalRef.current = false;
    dragOffsetRef.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!touchStartCoordRef.current) return;
    const dx = e.clientX - touchStartCoordRef.current.x;
    const dy = e.clientY - touchStartCoordRef.current.y;

    if (!isDraggingHorizontalRef.current) {
      if (Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy) * 1.15) {
        isDraggingHorizontalRef.current = true;
        touchStartCoordRef.current = { x: e.clientX, y: e.clientY };
        return;
      } else if (Math.abs(dy) > 8) {
        touchStartCoordRef.current = null;
        return;
      }
    }

    if (isDraggingHorizontalRef.current) {
      let effectiveDx = dx;
      if ((dx > 0 && !canGoNext) || (dx < 0 && !canGoPrev)) {
        effectiveDx = dx * 0.22;
      }
      dragOffsetRef.current = effectiveDx;
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          setDragOffset(dragOffsetRef.current);
          rafRef.current = null;
        });
      }
    }
  };

  const handleMouseUp = () => {
    finishSwipe();
  };

  // Enriched books list with structured Indonesian name, author, Arabic title
  const enrichedBooks = useMemo(() => {
    return books.map((b, idx) => {
      const meta = MAULID_BOOKS_META[b.id] || {
        id: b.id,
        indoTitle: b.id_.split('·')[0]?.trim() || b.ar,
        author: b.id_.split('·')[1]?.trim() || '',
        shortAr: b.ar,
        fullAr: b.ar
      };
      return {
        ...b,
        originalIndex: idx,
        indoTitle: meta.indoTitle,
        author: meta.author,
        shortAr: meta.shortAr,
        fullAr: meta.fullAr,
      };
    });
  }, [books]);

  // Filtered books by search query
  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return enrichedBooks;
    const q = searchQuery.trim().toLowerCase();
    return enrichedBooks.filter((b) => 
      b.indoTitle.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.shortAr.includes(q) ||
      b.fullAr.includes(q) ||
      b.ch.some((ch) => (ch.t || '').toLowerCase().includes(q) || (ch.l || '').toLowerCase().includes(q))
    );
  }, [enrichedBooks, searchQuery]);

  if (!isOpen) return null;

  const currentChapter = currentBook.ch[activeChapterIndex] || currentBook.ch[0];

  return (
    <div
      data-theme={theme}
      style={{
        '--bg': theme === 'dark' ? '#14120d' : '#fbf9f2',
        '--sf': theme === 'dark' ? '#1d1a12' : '#ffffff',
        '--tx': theme === 'dark' ? '#eee6d0' : '#1e293b',
        '--mu': theme === 'dark' ? '#a09676' : '#64748b',
        '--ac': theme === 'dark' ? '#5cc4a0' : '#1b6837',
        '--ln': theme === 'dark' ? '#332e20' : '#e2e8f0',
        '--gd': theme === 'dark' ? '#d4b25a' : '#b45309',
        '--fs': `${fontSize}px`,
      } as React.CSSProperties}
      className="fixed inset-0 z-[100050] bg-[#fbf9f2] text-slate-800 font-sans flex flex-col select-none overflow-hidden max-w-lg mx-auto shadow-2xl border-x border-slate-200"
    >
      <LpmqSvgDefs />

      {/* ================= 1. HOME VIEW: KUMPULAN KITAB MAULID ================= */}
      {currentView === 'home' && (
        <div className="flex-1 flex flex-col h-full bg-[#fbf9f2] overflow-hidden">
          {/* Header Beranda Kitab Maulid: Identik dengan Header Al-Qur'an (#4f9a50) */}
          <header className="bg-[#4f9a50] text-white flex items-center justify-between px-3 h-14 pt-safe shrink-0 shadow-sm z-20">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 active:bg-white/30 transition-colors cursor-pointer text-white"
              title="Kembali ke Portal Alumni"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <h1 className="font-bold text-base sm:text-lg text-white tracking-wide">
              Kitab Maulid Nabi ﷺ
            </h1>

            <button
              type="button"
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 active:bg-white/30 transition-colors cursor-pointer text-white"
              title="Ganti Mode Tampilan"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5" />}
            </button>
          </header>

          {/* Konten Scrollable: Paling atas kotak cari, bawahnya daftar kitab maulid */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4">
            {/* 1. KOTAK CARI PALING ATAS */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                placeholder="Cari kitab maulid atau nama pengarang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9.5 pr-8 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4f9a50] focus:border-transparent shadow-xs transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Hapus pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 2. DAFTAR KITAB MAULID - MODEL KARTU 2 GRID PER BARIS */}
            <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
              {filteredBooks.map((book) => (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => openBook(book.originalIndex)}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500/60 p-3.5 sm:p-4 text-left shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden active:scale-[0.98] min-h-[155px]"
                >
                  {/* Sisi Atas: Nomor Medali & Tulisan Arab */}
                  <div className="flex items-start justify-between gap-2 w-full">
                    <AyahCircleMedallion
                      num={book.originalIndex + 1}
                      size={34}
                      circleColorClass="text-amber-900/75 group-hover:text-emerald-800"
                      textColorClass="text-slate-800 group-hover:text-emerald-950 font-extrabold"
                      title={`Kitab ke-${book.originalIndex + 1}`}
                    />
                    <span
                      className="font-arabic text-right text-slate-800 group-hover:text-emerald-900 text-xl sm:text-2xl leading-none select-none transition-colors shrink-0"
                      style={{ fontFamily: "'Amiri Quran', 'Scheherazade New', serif" }}
                      dir="rtl"
                    >
                      {book.shortAr}
                    </span>
                  </div>

                  {/* Sisi Bawah: Judul Indonesia, Pengarang, dan Jumlah Fasal */}
                  <div className="mt-3 w-full">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors leading-snug line-clamp-2">
                      {book.indoTitle}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 group-hover:text-emerald-900/80 truncate mt-1 font-normal">
                      {book.author}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="inline-flex items-center text-[10px] font-semibold text-emerald-800 bg-emerald-50 group-hover:bg-emerald-100/90 px-2 py-0.5 rounded-full">
                        {book.ch.length} Fasal
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Pesan Jika Pencarian Tidak Ditemukan */}
            {filteredBooks.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-2.5 shadow-xs">
                <Search className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">Kitab maulid tidak ditemukan</p>
                <p className="text-[11px] text-slate-400">
                  Tidak ada kitab atau pengarang yang cocok dengan "{searchQuery}"
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  Hapus Pencarian
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= 2. TOC VIEW: DAFTAR FASAL / BAB ================= */}
      {currentView === 'toc' && (
        <div className="relative flex-1 flex flex-col h-full bg-[#fbf9f2] overflow-hidden">
          <div 
            ref={scrollerRef}
            onScroll={handleTocScroll}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-6"
          >
            {/* Sticky Header Bar: Identik dengan Warna Al-Qur'an (#4f9a50) */}
            <div className="sticky top-0 z-20 h-14 flex items-center justify-between gap-2 px-3 text-white">
              <div 
                ref={headerBgRef} 
                className="absolute inset-0 bg-[#4f9a50] opacity-0 shadow-md transition-opacity duration-150 -z-10" 
              />
              {/* Tombol Kembali (Kiri) - Tombol pengaturan telah dihapus */}
              <div className="flex items-center min-w-[40px]">
                <button
                  type="button"
                  onClick={() => setCurrentView('home')}
                  className="w-9 h-9 rounded-full bg-white/20 border-0 flex items-center justify-center text-white hover:bg-white/30 active:bg-white/40 transition-colors cursor-pointer"
                  title="Kembali ke Daftar Kitab"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>

              {/* Tempat Judul Arab di Header:
                  Teks Latin dihapus (dibuat kosong).
                  Saat daftar isi di-scroll ke atas, judul Arab yang awalnya besar di hero akan mengecil sembari bergeser menempati tempat ini */}
              <div className="relative flex-1 h-full flex items-center justify-center text-center overflow-visible pointer-events-none px-1">
                <span 
                  ref={floatingArabicTitleRef}
                  className="font-arabic text-white select-none whitespace-nowrap will-change-transform drop-shadow-xs text-xl sm:text-2xl"
                  style={{ 
                    fontFamily: "'Amiri Quran', 'Scheherazade New', serif",
                    transformOrigin: 'center center',
                    transform: 'translate3d(0, 58px, 0) scale(1.35)'
                  }}
                  dir="rtl"
                >
                  {currentBookMeta.shortAr}
                </span>
              </div>

              {/* Mode Tampilan (Kanan) */}
              <div className="flex items-center justify-end min-w-[40px]">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-9 h-9 rounded-full bg-white/20 border-0 flex items-center justify-center text-white hover:bg-white/30 active:bg-white/40 transition-colors cursor-pointer"
                  title="Ganti Mode Tampilan"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Big Quranic Green Header Hero */}
            <div 
              className="-mt-14 pt-14 pb-7 px-4 text-white text-center bg-linear-to-b from-[#4f9a50] to-[#388e3c]"
            >
              {/* Spacer penampung posisi awal judul arab besar */}
              <div className="h-14 flex items-center justify-center" aria-hidden="true" />
              <div 
                ref={heroSubtitleRef}
                className="text-emerald-100 font-medium text-xs mt-1 transition-opacity duration-150"
              >
                {currentBookMeta.indoTitle} • {currentBookMeta.author}
              </div>
            </div>

            {/* Card Content with Chapter List */}
            <div 
              className="relative z-1 -mt-4 mx-3 mb-3 bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden divide-y divide-slate-100"
              style={{ minHeight: 'calc(100vh - 180px)' }}
            >
              {currentBook.ch.map((c, j) => {
                const lat = c.l || c.t;
                const sub = c.i 
                  ? (c.lb0 === 'Sholawat' ? 'Pembuka' : (c.lb0 || 'Pengantar'))
                  : `Fasal ${numChaptersBefore(j)}`;
                const right = c.i ? c.t : ordAr(numChaptersBefore(j));

                return (
                  <button
                    key={j}
                    type="button"
                    onClick={() => openChapter(j)}
                    className={`w-full flex items-center gap-3.5 p-3.5 text-left border-0 bg-transparent text-slate-800 hover:bg-emerald-50/50 transition-colors cursor-pointer group ${
                      c.b ? '' : 'opacity-55'
                    }`}
                  >
                    <AyahCircleMedallion
                      num={c.i ? '✦' : numChaptersBefore(j)}
                      size={36}
                      circleColorClass="text-amber-900/70 group-hover:text-emerald-800"
                      textColorClass="text-slate-800 group-hover:text-emerald-950 font-bold"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="block text-sm sm:text-base leading-snug truncate font-bold text-slate-900 group-hover:text-emerald-800">
                        {lat}
                      </span>
                      <span className="block text-slate-500 text-xs mt-0.5 font-normal">
                        {sub}{c.b ? '' : ' · belum dimuat'}
                      </span>
                    </div>
                    <span 
                      className="font-arabic text-right text-base sm:text-lg leading-relaxed text-slate-800 group-hover:text-emerald-900 shrink-0 max-w-[48%]"
                      dir="rtl"
                      style={{ fontFamily: "'Amiri Quran', serif" }}
                    >
                      {right}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= 3. READ VIEW: BACA FASAL MAULID (UI PERSIS SCREENSHOT + GESER PINDAH BAB) ================= */}
      {currentView === 'read' && (
        <div className="flex-1 flex flex-col h-full bg-[#fbf9f2] overflow-hidden">
          {/* Top Navbar: Header Hijau Presisi seperti Screenshot */}
          <header className="bg-[#1b6837] text-white flex items-center justify-between px-3 h-14 pt-safe shrink-0 shadow-sm z-30">
            {/* Tombol Kembali ke Daftar Fasal (<) */}
            <button
              type="button"
              onClick={() => {
                setCurrentView('toc');
                setIsPlayingAudio(false);
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 active:bg-white/30 transition-colors cursor-pointer text-white shrink-0"
              title="Kembali ke Daftar Fasal"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Judul Fasal di Header (Contoh: "Muqaddimah" pada Laqod Jāakum) */}
            <h1 className="font-bold text-base sm:text-lg text-white truncate px-2 text-center flex-1 min-w-0 tracking-tight">
              {getChapterHeaderTitle(currentBook, activeChapterIndex)}
            </h1>

            {/* Aksi Kanan: Tombol Putar Audio (▶) dan Tombol Huruf (AA) */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer text-white ${
                  isPlayingAudio ? 'bg-amber-400 text-slate-900 shadow-sm animate-pulse' : 'hover:bg-white/20 active:bg-white/30'
                }`}
                title={isPlayingAudio ? 'Jeda Audio Qiraah' : 'Putar Audio Qiraah'}
              >
                {isPlayingAudio ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm hover:bg-white/20 active:bg-white/30 transition-colors cursor-pointer text-white tracking-tighter"
                title="Pengaturan Huruf & Terjemahan"
              >
                AA
              </button>
            </div>
          </header>

          {/* Sub-header: Bar Tab Fasal Horizontal (Pill Bar persis Screenshot) */}
          <div className="bg-[#1b6837] border-t border-emerald-600/30 px-2 py-2 shrink-0 z-20 shadow-xs">
            <div 
              ref={tabScrollContainerRef}
              className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth select-none"
            >
              {currentBook.ch.map((c, idx) => {
                const isActive = idx === activeChapterIndex;
                const label = getChapterTabLabel(currentBook, idx);
                return (
                  <button
                    key={idx}
                    ref={(el) => { tabButtonsRef.current[idx] = el; }}
                    type="button"
                    onClick={() => {
                      if (activeChapterIndex !== idx) {
                        openChapter(idx);
                      }
                    }}
                    className={`shrink-0 text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-white text-[#1b6837] font-bold rounded-full px-4 py-1.5 shadow-xs'
                        : 'text-white/85 hover:text-white font-medium px-3 py-1.5 rounded-full hover:bg-white/10'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reader Viewport dengan Seamless Push Carousel (Identik Al-Qur'an: RTL Push Kanan ke Kiri) */}
          <div
            ref={readerViewportRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ touchAction: 'pan-y' }}
            className="flex-1 relative w-full h-full overflow-hidden bg-[#fbf9f2] select-none"
          >
            {/* 1. Next Chapter in RTL (activeChapterIndex + 1): Berada di sebelah KIRI, masuk mendorong saat digeser ke kanan */}
            {(dragOffset > 0 || (isAnimatingSwipe && dragOffset > 0)) && canGoNext && (
              <div
                className="absolute inset-0 w-full h-full overflow-y-auto px-4 sm:px-6 py-6 pb-28 overscroll-contain bg-[#fbf9f2] pointer-events-none select-none"
                style={{
                  left: '-100%',
                  transform: `translate3d(${dragOffset}px, 0, 0)`,
                  transition: isAnimatingSwipe ? 'transform 260ms cubic-bezier(0.2, 0.9, 0.3, 1)' : 'none',
                  willChange: 'transform'
                }}
              >
                <div className="max-w-[620px] mx-auto">
                  <MaulidChapterContent
                    book={currentBook}
                    chapterIndex={activeChapterIndex + 1}
                    fontSize={fontSize}
                    showTranslation={showTranslation}
                    openToggles={openToggles}
                    onToggleHeading={() => {}}
                    canGoPrev={true}
                    canGoNext={activeChapterIndex + 1 < currentBook.ch.length - 1}
                    onGoPrev={goToPrevChapter}
                    onGoNext={goToNextChapter}
                  />
                </div>
              </div>
            )}

            {/* 2. Current Active Chapter: Posisi 0%, terdorong saat digeser */}
            <div
              ref={readerRef}
              className="absolute inset-0 w-full h-full overflow-y-auto px-4 sm:px-6 py-6 pb-28 overscroll-contain select-text bg-[#fbf9f2]"
              style={{
                left: '0%',
                transform: `translate3d(${dragOffset}px, 0, 0)`,
                transition: isAnimatingSwipe ? 'transform 260ms cubic-bezier(0.2, 0.9, 0.3, 1)' : 'none',
                willChange: 'transform'
              }}
            >
              <div className="max-w-[620px] mx-auto">
                <MaulidChapterContent
                  book={currentBook}
                  chapterIndex={activeChapterIndex}
                  fontSize={fontSize}
                  showTranslation={showTranslation}
                  openToggles={openToggles}
                  onToggleHeading={(key) => setOpenToggles((prev) => ({ ...prev, [key]: !prev[key] }))}
                  canGoPrev={canGoPrev}
                  canGoNext={canGoNext}
                  onGoPrev={goToPrevChapter}
                  onGoNext={goToNextChapter}
                />
              </div>
            </div>

            {/* 3. Previous Chapter in RTL (activeChapterIndex - 1): Berada di sebelah KANAN, masuk mendorong saat digeser ke kiri */}
            {(dragOffset < 0 || (isAnimatingSwipe && dragOffset < 0)) && canGoPrev && (
              <div
                className="absolute inset-0 w-full h-full overflow-y-auto px-4 sm:px-6 py-6 pb-28 overscroll-contain bg-[#fbf9f2] pointer-events-none select-none"
                style={{
                  left: '100%',
                  transform: `translate3d(${dragOffset}px, 0, 0)`,
                  transition: isAnimatingSwipe ? 'transform 260ms cubic-bezier(0.2, 0.9, 0.3, 1)' : 'none',
                  willChange: 'transform'
                }}
              >
                <div className="max-w-[620px] mx-auto">
                  <MaulidChapterContent
                    book={currentBook}
                    chapterIndex={activeChapterIndex - 1}
                    fontSize={fontSize}
                    showTranslation={showTranslation}
                    openToggles={openToggles}
                    onToggleHeading={() => {}}
                    canGoPrev={activeChapterIndex - 1 > 0}
                    canGoNext={true}
                    onGoPrev={goToPrevChapter}
                    onGoNext={goToNextChapter}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Floating Mini Audio Bar ketika Audio Aktif */}
          {isPlayingAudio && (
            <div className="fixed bottom-4 left-3 right-3 max-w-md mx-auto bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3 px-4 shadow-2xl flex items-center justify-between border border-white/10 z-40 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setIsPlayingAudio(false)}
                  className="w-8 h-8 rounded-full bg-emerald-500 text-slate-900 flex items-center justify-center shrink-0 cursor-pointer"
                  title="Jeda"
                >
                  <Pause className="w-4 h-4 fill-current" />
                </button>
                <div className="truncate">
                  <div className="text-xs font-bold text-white truncate">
                    Memutar Qira'ah: {getChapterHeaderTitle(currentBook, activeChapterIndex)}
                  </div>
                  <div className="text-[10px] text-emerald-300 truncate">
                    {currentBookMeta.indoTitle}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPlayingAudio(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          )}

          {/* ================= MODAL / BOTTOM SHEET PENGATURAN BACAAN (AA) ================= */}
          {isSettingsModalOpen && (
            <div 
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
              onClick={() => setIsSettingsModalOpen(false)}
            >
              <div 
                className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-200 animate-in slide-in-from-bottom-4 space-y-5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-700" />
                    <h3 className="font-bold text-sm sm:text-base text-slate-800">
                      Pengaturan Bacaan Maulid
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSettingsModalOpen(false)}
                    className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* 1. Pengaturan Ukuran Huruf Arab */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                    <span>Ukuran Teks Arab</span>
                    <span className="text-emerald-700 font-bold">{fontSize}px</span>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => adjustFontSize(-2)}
                      className="w-10 h-10 rounded-xl bg-white border border-slate-200 font-bold text-sm text-slate-700 hover:bg-emerald-50 active:bg-emerald-100 flex items-center justify-center cursor-pointer shadow-2xs"
                    >
                      A−
                    </button>
                    <input
                      type="range"
                      min={18}
                      max={44}
                      step={2}
                      value={fontSize}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setFontSize(val);
                        try {
                          localStorage.setItem('maulid_fs', String(val));
                        } catch (err) {}
                      }}
                      className="flex-1 accent-[#1b6837] cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => adjustFontSize(2)}
                      className="w-10 h-10 rounded-xl bg-white border border-slate-200 font-bold text-sm text-slate-700 hover:bg-emerald-50 active:bg-emerald-100 flex items-center justify-center cursor-pointer shadow-2xs"
                    >
                      A+
                    </button>
                  </div>
                </div>

                {/* 2. Switch Terjemahan Bahasa Indonesia */}
                <div className="flex items-center justify-between py-2 border-y border-slate-100">
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-800">
                      Tampilkan Terjemahan
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Tampilkan terjemahan bahasa Indonesia di bawah teks Arab
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleTranslation}
                    className={`w-12 h-6.5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                      showTranslation ? 'bg-[#1b6837] justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <span className="w-5.5 h-5.5 bg-white rounded-full shadow-md transform transition-transform" />
                  </button>
                </div>

                {/* 3. Mode Tampilan (Terang / Gelap) */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-800">
                      Mode Tampilan
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Pilih warna latar bacaan yang nyaman di mata
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold cursor-pointer text-slate-700"
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
                    <span>{theme === 'dark' ? 'Mode Gelap' : 'Mode Terang'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-[#1b6837] text-white font-bold text-xs sm:text-sm hover:bg-[#15542c] transition-colors cursor-pointer shadow-sm"
                >
                  Selesai
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
