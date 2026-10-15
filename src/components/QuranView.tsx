import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ArrowLeft, 
  BookOpen, 
  Sliders, 
  Settings,
  Play, 
  Pause, 
  X, 
  Search, 
  Check, 
  Copy, 
  Clock, 
  Bookmark, 
  MoreHorizontal,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  FileText,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  Share2
} from 'lucide-react';
import { useBackHandler } from '../utils/navigationHistory';
import { BismillahCalligraphy } from './BismillahCalligraphy';

const API = 'https://api.quran.com/api/v4';
const TRANSLATION_ID: Record<string, number> = { en: 20, id: 33 }; // 33 = Kemenag RI, 20 = Saheeh Int
const AUDIO_VERSE = 'https://verses.quran.com/Alafasy/mp3/';
const AUDIO_WORD = 'https://audio.qurancdn.com/';
const SIZES = [24, 28, 32, 36, 40];

const T_LANG = {
  en: { 
    ayahs: 'Ayahs', juz: 'Juz', page: 'Page', surahs: 'Surahs', search: 'Search surah...', settings: 'Settings',
    arSize: 'Arabic size', showTr: 'Show translation', showWord: 'Show word meaning', lang: 'Language',
    bm: 'Bookmark', last: 'Mark as last read', copy: 'Copy verse', play: 'Play from this verse', copied: 'Copied to clipboard',
    loading: 'Loading Al-Qur\'an...', err: 'Could not load data. Check your connection.', retry: 'Try again',
    noAudio: 'Audio could not be played', bmRed: 'Red', bmGreen: 'Green', bmBlue: 'Blue', close: 'Close',
    reading: 'Reading mode', wbw: 'Word by word', verse: 'Verse', size: 'Size', backToPortal: 'Back to Portal'
  },
  id: { 
    ayahs: 'Ayat', juz: 'Juz', page: 'Halaman', surahs: 'Daftar Surah', search: 'Cari surah (nama / nomor)...', settings: 'Pengaturan Al-Qur\'an',
    arSize: 'Ukuran huruf Arab', showTr: 'Tampilkan terjemahan', showWord: 'Tampilkan makna per kata', lang: 'Bahasa',
    bm: 'Penanda', last: 'Tandai terakhir dibaca', copy: 'Salin ayat', play: 'Putar dari ayat ini', copied: 'Ayat berhasil disalin',
    loading: 'Memuat ayat suci Al-Qur\'an...', err: 'Data gagal dimuat. Periksa koneksi internet.', retry: 'Coba lagi',
    noAudio: 'Audio tidak dapat diputar', bmRed: 'Merah', bmGreen: 'Hijau', bmBlue: 'Biru', close: 'Tutup',
    reading: 'Mode Baca Mushaf', wbw: 'Mode Kata per Kata', verse: 'Ayat', size: 'Ukuran Font', backToPortal: 'Kembali ke Portal Alumni'
  }
};

const COLORS: Record<string, string> = {
  red: '#e53935',
  green: '#2e9e45',
  blue: '#1e88e5'
};

export type QuranArabicFont = 'lpmq' | 'amiri' | 'scheherazade';

export interface QuranFontOption {
  id: QuranArabicFont;
  name: string;
  badge?: string;
  subtitle: string;
  css: string;
}

export const QURAN_FONTS: QuranFontOption[] = [
  {
    id: 'lpmq',
    name: 'LPMQ Isep Misbah',
    badge: 'Standar Kemenag RI',
    subtitle: 'Mushaf Standar Indonesia karya H. Isep Misbah',
    css: "'LPMQ Isep Misbah', 'Amiri Quran', serif"
  },
  {
    id: 'amiri',
    name: 'Amiri Quran',
    badge: 'Standar Utsmani',
    subtitle: 'Khat Naskh percetakan Madinah Nabawiyah',
    css: "'Amiri Quran', 'LPMQ Isep Misbah', serif"
  },
  {
    id: 'scheherazade',
    name: 'Scheherazade New',
    badge: 'Naskh Klasik',
    subtitle: 'Khat Arab Naskh tradisional bersahaja',
    css: "'Scheherazade New', 'Amiri Quran', serif"
  }
];

export const CHAPTER_PAGE_RANGES: [number, number][] = [
  [1,1],[2,49],[50,76],[77,106],[106,127],[128,150],[151,176],[177,186],[187,207],[208,221],
  [221,235],[235,248],[249,255],[255,261],[262,267],[267,281],[282,293],[293,304],[305,312],[312,321],
  [322,331],[332,341],[342,349],[350,359],[359,366],[367,376],[377,385],[385,396],[396,404],[404,410],
  [411,414],[415,417],[418,427],[428,434],[434,440],[440,445],[446,452],[453,458],[458,467],[467,476],
  [477,482],[483,489],[489,495],[496,498],[499,502],[502,506],[507,510],[511,515],[515,517],[518,520],
  [520,523],[523,525],[526,528],[528,531],[531,534],[534,537],[537,541],[542,545],[545,548],[549,551],
  [551,552],[553,554],[554,555],[556,557],[558,559],[560,561],[562,564],[564,566],[566,568],[568,570],
  [570,571],[572,573],[574,575],[575,577],[577,578],[578,580],[580,581],[582,583],[583,584],[585,585],
  [586,586],[587,587],[587,589],[589,589],[590,590],[591,591],[591,592],[592,592],[593,594],[594,594],
  [595,595],[595,596],[596,596],[596,596],[597,597],[597,597],[598,598],[598,599],[599,599],[599,600],
  [600,600],[600,600],[601,601],[601,601],[601,601],[602,602],[602,602],[602,602],[603,603],[603,603],
  [603,603],[604,604],[604,604],[604,604]
];

export const JUZ_START_PAGES = [
  1, 22, 42, 62, 82, 102, 121, 142, 162, 182, 
  201, 222, 242, 262, 282, 302, 322, 342, 362, 382, 
  402, 422, 442, 462, 482, 502, 522, 542, 562, 582
];

export function getJuzFromPage(page: number): number {
  for (let i = JUZ_START_PAGES.length - 1; i >= 0; i--) {
    if (page >= JUZ_START_PAGES[i]) return i + 1;
  }
  return 1;
}

export function getChapterIdFromPage(page: number): number {
  for (let i = 0; i < CHAPTER_PAGE_RANGES.length; i++) {
    const [start, end] = CHAPTER_PAGE_RANGES[i];
    if (page >= start && page <= end) {
      return i + 1;
    }
  }
  return 1;
}

export function getPageImageUrl(page: number, style: 'classic' | 'vector' = 'classic'): string {
  const safePage = Math.max(1, Math.min(604, page));
  if (style === 'vector') {
    return `https://cdn.quran.ws/svg/pages/v1.1.1/hafs-kfqc/${pad(safePage, 3)}.svg`;
  }
  return `https://cdn.jsdelivr.net/gh/QuranHub/quran-pages-images@main/kfgqpc/hafs-wasat/${safePage}.jpg`;
}

export interface ChapterItem {
  id: number;
  name: string;
  ar: string;
  tn: string;
  count: number;
  place: string;
  bis: boolean;
  pages?: [number, number];
}

export interface CompactVerse {
  n: number;
  p: number;
  j: number;
  w: [string, string, string][]; // [uthmani, translation, audio_url]
  t: string; // full translation
}

export interface PageVerseItem {
  id: number;
  surahId: number;
  verseNum: number;
  verseKey: string;
  arabicText: string;
  translation: string;
  words: [string, string, string][]; // [uthmani, translation, audio_url]
}

interface QuranSettings {
  lang: 'id' | 'en';
  size: number; // index in SIZES
  fontFamily: QuranArabicFont;
  showTr: boolean;
  showWord: boolean;
  mode: 'wbw' | 'read';
  cur: number; // current surah id (1..114)
  curPage: number; // current mushaf pojok page (1..604)
  mushafStyle: 'classic' | 'vector';
  bm: Record<string, string[]>;
  lr: { s: number; v: number } | null;
  follow: boolean;
}

function loadSettings(): QuranSettings {
  const defaults: QuranSettings = {
    lang: 'id',
    size: 1, // 28px
    fontFamily: 'lpmq',
    showTr: true,
    showWord: true,
    mode: 'read', // Default to Mushaf Pojok as preferred
    cur: 1, // Default Al-Fatihah (Surah 1)
    curPage: 1, // Default Page 1
    mushafStyle: 'classic',
    bm: {},
    lr: null,
    follow: true,
  };
  try {
    const raw = localStorage.getItem('qwbw:settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      return { 
        ...defaults, 
        ...parsed,
        fontFamily: parsed.fontFamily || 'lpmq',
        curPage: Number(parsed.curPage) || 1,
        mushafStyle: parsed.mushafStyle || 'classic',
        cur: parsed.lr?.s ? Number(parsed.lr.s) : (Number(parsed.cur) || 1)
      };
    }
  } catch (e) {}
  return defaults;
}

function saveSettings(s: QuranSettings) {
  try {
    localStorage.setItem('qwbw:settings', JSON.stringify(s));
  } catch (e) {}
}

function pad(n: number, l: number): string {
  return String(n).padStart(l, '0');
}

function arDigits(n: number): string {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d, 10)]);
}

function cleanHtml(s: string): string {
  return String(s || '')
    .replace(/<sup[^>]*>.*?<\/sup>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

export const AyahEndCircle: React.FC<{
  num: number;
  isLastRead?: boolean;
  bookmarkColor?: string;
}> = ({ num, isLastRead, bookmarkColor }) => {
  return (
    <span
      className="inline-flex items-center justify-center relative align-middle mx-1 select-none shrink-0"
      dir="ltr"
      style={{ verticalAlign: 'middle', lineHeight: 1 }}
      role="img"
      aria-label={`Ayat ${num}`}
    >
      {/* Authentic U+06DD (۝) End of Ayah Glyph with font LPMQ Isep Misbah */}
      <span
        className="font-arabic leading-none select-none pointer-events-none inline-block text-amber-950/85"
        style={{
          fontFamily: "'LPMQ Isep Misbah', 'Amiri Quran', serif",
          fontSize: '1.45em',
          lineHeight: 1,
        }}
      >
        &#x06DD;
      </span>

      {/* Centered Arabic Numeral strictly inside the U+06DD circle */}
      <span
        className="absolute inset-0 flex items-center justify-center font-arabic font-bold text-slate-950 pointer-events-none select-none"
        style={{
          fontSize: num > 99 ? '0.40em' : num > 9 ? '0.48em' : '0.56em',
          transform: 'translateY(-0.5px)',
          fontFamily: "'LPMQ Isep Misbah', 'Amiri Quran', serif",
          lineHeight: 1,
        }}
      >
        {arDigits(num)}
      </span>

      {/* Last read badge dot */}
      {isLastRead && (
        <span
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-600 ring-1 ring-white shadow-xs z-10"
          title="Terakhir dibaca"
        />
      )}
      {/* Bookmark badge dot */}
      {bookmarkColor && (
        <span
          className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-1 ring-white shadow-xs z-10"
          style={{ backgroundColor: bookmarkColor }}
          title="Penanda"
        />
      )}
    </span>
  );
};

interface MushafPageContentProps {
  page: number;
  verses: PageVerseItem[];
  isLoading: boolean;
  chapters: ChapterItem[];
  isSurahFontLoaded: boolean;
  currentFontSize: number;
  activeFontConfig: any;
  playingInfo: { surahId: number; verseNum: number } | null;
  selectedVerseKey: string | null;
  settings: QuranSettings;
  isCleanReading: boolean;
  isInteractive?: boolean;
  onVerseClick?: (e: React.MouseEvent) => void;
  onVerseContextMenu?: (surahId: number, verseNum: number, verseKey: string, e: React.MouseEvent) => void;
  onVerseTouchStart?: (surahId: number, verseNum: number, verseKey: string, e: React.TouchEvent) => void;
  onVerseTouchMove?: (e: React.TouchEvent) => void;
  onVerseTouchEnd?: () => void;
  onVerseMouseDown?: (surahId: number, verseNum: number, verseKey: string, e: React.MouseEvent) => void;
  onVerseMouseMove?: (e: React.MouseEvent) => void;
  onVerseMouseUp?: () => void;
  onRetry?: () => void;
}

const MushafPageContent: React.FC<MushafPageContentProps> = ({
  page,
  verses,
  isLoading,
  chapters,
  isSurahFontLoaded,
  currentFontSize,
  activeFontConfig,
  playingInfo,
  selectedVerseKey,
  settings,
  isCleanReading,
  isInteractive = true,
  onVerseClick,
  onVerseContextMenu,
  onVerseTouchStart,
  onVerseTouchMove,
  onVerseTouchEnd,
  onVerseMouseDown,
  onVerseMouseMove,
  onVerseMouseUp,
  onRetry,
}) => {
  // Group verses by continuous surahId chunks
  const pageSections: { surahId: number; chapter?: ChapterItem; isStartOfSurah: boolean; verses: PageVerseItem[] }[] = [];
  verses.forEach((v) => {
    const last = pageSections[pageSections.length - 1];
    if (last && last.surahId === v.surahId) {
      last.verses.push(v);
    } else {
      pageSections.push({
        surahId: v.surahId,
        chapter: chapters.find((c) => c.id === v.surahId),
        isStartOfSurah: v.verseNum === 1,
        verses: [v],
      });
    }
  });

  return (
    <div className={`w-full max-w-lg bg-[#fbf9f2] px-5 sm:px-8 flex flex-col min-h-full transition-all border-0 shadow-none rounded-none ${
      isCleanReading 
        ? 'pt-safe pt-8 pb-safe pb-14' 
        : 'pt-4 pb-8'
    }`}>
      {/* 1. Loading State */}
      {isLoading && verses.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-24 text-emerald-800 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-200 border-t-emerald-700 animate-spin" />
          <span className="text-xs font-medium text-slate-500">Memuat teks Halaman {page}...</span>
        </div>
      )}

      {/* 2. Empty / Retry State */}
      {!isLoading && verses.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-500 gap-3 text-center">
          <p className="text-xs">Data ayat Halaman {page} belum dapat dimuat.</p>
          {onRetry && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRetry();
              }}
              className="px-4 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 cursor-pointer shadow-sm"
            >
              Muat Ulang Halaman
            </button>
          )}
        </div>
      )}

      {/* 3. Digital Verses Flow */}
      {verses.length > 0 && (
        <div className="flex-1 flex flex-col justify-start">
          {pageSections.map((section, sIdx) => (
            <div key={`section-${page}-${section.surahId}-${sIdx}`} className="space-y-2 mb-3">
              {/* Surah Cartouche Banner if this section begins at verse 1 */}
              {section.isStartOfSurah && section.chapter && (
                <div className="pt-1 pb-2 select-none">
                  <div className="banner select-none my-1">
                    <span className="capitalize font-medium text-[11px]">
                      {section.chapter.place === 'madinah' ? 'Madaniyah' : 'Makkiyah'}
                    </span>
                    <div className="cart">
                      <svg aria-hidden="true">
                        <use href="#surah-cartouche-symbol" />
                      </svg>
                      <div 
                        className="name" 
                        translate="no"
                        style={{ 
                          fontFamily: isSurahFontLoaded 
                            ? "'surah-name-v4-icon', 'Aref Ruqaa', serif" 
                            : "'Aref Ruqaa', 'Amiri Quran', serif" 
                        }}
                      >
                        {isSurahFontLoaded 
                          ? `surah${pad(section.surahId, 3)}` 
                          : `سورة ${section.chapter.ar || section.chapter.name}`}
                      </div>
                    </div>
                    <span className="font-medium text-[11px]">
                      {section.chapter.count} Ayat
                    </span>
                  </div>

                  {/* Authentic Quranic Bismillah Calligraphy Vector (unless Surah 1 Al-Fatihah or Surah 9 At-Tawbah) */}
                  {section.chapter.bis && section.surahId !== 1 && section.surahId !== 9 && (
                    <div className="py-1">
                      <BismillahCalligraphy />
                    </div>
                  )}
                </div>
              )}

              {/* Verses in Digital Arabic Text - Justify */}
              <div 
                className="font-arabic text-slate-900 text-justify [text-align:justify] [text-justify:inter-word] [text-align-last:center] leading-[2.6] sm:leading-[2.85] tracking-normal quran-interactive-text select-none px-1"
                dir="rtl"
                onContextMenu={(e) => e.preventDefault()}
                style={{ 
                  fontSize: `${currentFontSize}px`,
                  fontFamily: activeFontConfig.css
                }}
              >
                {section.verses.map((v) => {
                  const isVersePlaying = playingInfo?.surahId === v.surahId && playingInfo?.verseNum === v.verseNum;
                  const isSelected = selectedVerseKey === v.verseKey;
                  const activeBookmarks = settings.bm[v.verseKey] || [];
                  const isLastRead = settings.lr?.s === v.surahId && settings.lr?.v === v.verseNum;

                  return (
                    <span
                      key={`mushaf-${page}-${v.verseKey}`}
                      data-verse-key={v.verseKey}
                      onClick={isInteractive ? onVerseClick : undefined}
                      onContextMenu={isInteractive && onVerseContextMenu ? (e) => onVerseContextMenu(v.surahId, v.verseNum, v.verseKey, e) : undefined}
                      onTouchStart={isInteractive && onVerseTouchStart ? (e) => onVerseTouchStart(v.surahId, v.verseNum, v.verseKey, e) : undefined}
                      onTouchMove={isInteractive && onVerseTouchMove ? onVerseTouchMove : undefined}
                      onTouchEnd={isInteractive && onVerseTouchEnd ? onVerseTouchEnd : undefined}
                      onTouchCancel={isInteractive && onVerseTouchEnd ? onVerseTouchEnd : undefined}
                      onMouseDown={isInteractive && onVerseMouseDown ? (e) => onVerseMouseDown(v.surahId, v.verseNum, v.verseKey, e) : undefined}
                      onMouseMove={isInteractive && onVerseMouseMove ? onVerseMouseMove : undefined}
                      onMouseUp={isInteractive && onVerseMouseUp ? onVerseMouseUp : undefined}
                      className={`inline rounded-none px-1 py-0.5 mx-0 transition-colors duration-150 ${isInteractive ? 'cursor-pointer' : 'cursor-default pointer-events-none'} select-none quran-interactive-text border-0 outline-none ring-0 [box-decoration-break:clone] [-webkit-box-decoration-break:clone] ${
                        isVersePlaying
                          ? 'bg-[#bbf7d0] text-slate-950 font-normal'
                          : isSelected
                          ? 'bg-[#fef08a] text-slate-950 font-normal'
                          : 'hover:bg-yellow-100/40 text-slate-900'
                      }`}
                      title={isInteractive ? `QS. ${section.chapter?.name || v.surahId} : ${v.verseNum} • Sentuh lama untuk opsi ayat` : undefined}
                    >
                      <span dir="rtl">{v.arabicText}</span>
                      {/* Ayah End Rosette Medallion Symbol */}
                      <AyahEndCircle
                        num={v.verseNum}
                        isLastRead={isLastRead}
                        bookmarkColor={activeBookmarks.length > 0 ? (COLORS[activeBookmarks[0]] || '#1e88e5') : undefined}
                      />
                      {' '}
                    </span>
                  );
                })}
              </div>

              {/* Divider between surahs if page contains multiple surahs */}
              {sIdx < pageSections.length - 1 && (
                <div className="my-3 border-t border-amber-900/10" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface QuranViewProps {
  isOpen: boolean;
  onClose: () => void;
  initialSurah?: number;
}

export const QuranView: React.FC<QuranViewProps> = ({ isOpen, onClose, initialSurah }) => {
  const [settings, setSettings] = useState<QuranSettings>(loadSettings);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  
  // Continuous pages: list of loaded surah IDs in order
  const [loadedSurahIds, setLoadedSurahIds] = useState<number[]>([1]);
  const [versesBySurah, setVersesBySurah] = useState<Record<number, CompactVerse[]>>({});
  const [activeSurahId, setActiveSurahId] = useState<number>(1);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingNextSurah, setIsLoadingNextSurah] = useState(false);
  const [isLoadingPrevSurah, setIsLoadingPrevSurah] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio state
  const [playingInfo, setPlayingInfo] = useState<{ surahId: number; verseNum: number } | null>(null);
  const [playingWordKey, setPlayingWordKey] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wordAudioRef = useRef<HTMLAudioElement | null>(null);

  // Sheets state
  const [isSurahSheetOpen, setIsSurahSheetOpen] = useState(false);
  const [isSettingsSheetOpen, setIsSettingsSheetOpen] = useState(false);
  const [isFontSizeModalOpen, setIsFontSizeModalOpen] = useState(false);
  const [activeVerseSheet, setActiveVerseSheet] = useState<{ surahId: number; verseNum: number } | null>(null);
  const [surahSearchQuery, setSurahSearchQuery] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(null), 2000);
  }, []);

  // Mode Tampilan Bersih: Sekali klik menutup header & footer, sekali klik lagi membukanya
  const [isCleanReading, setIsCleanReading] = useState(false);

  const toggleCleanMode = useCallback(() => {
    setIsCleanReading((prev) => {
      const next = !prev;
      if (next) {
        showToast('Tampilan Bersih: Sentuh layar untuk membuka kembali menu');
      }
      return next;
    });
  }, [showToast]);

  // Juz & Page tracking
  const [curPage, setCurPage] = useState<number>(() => {
    const s = loadSettings();
    if (initialSurah) {
      return CHAPTER_PAGE_RANGES[initialSurah - 1]?.[0] || 1;
    }
    return s.curPage || 1;
  });
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isJumpModalOpen, setIsJumpModalOpen] = useState(false);
  const [jumpPageInput, setJumpPageInput] = useState<string>('');
  const [jumpModalTab, setJumpModalTab] = useState<'page' | 'juz' | 'surah'>('page');
  const [currentJuzInfo, setCurrentJuzInfo] = useState<{ juz: number | string; page: number | string }>(() => ({
    juz: getJuzFromPage(loadSettings().curPage || 1),
    page: loadSettings().curPage || 1
  }));
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const bottomSentinelRef = useRef<HTMLDivElement | null>(null);

  // Continuous Page Drag / Interactive Swipe State
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isAnimatingPage, setIsAnimatingPage] = useState<boolean>(false);
  const dragOffsetRef = useRef<number>(0);
  const isDraggingPageRef = useRef<boolean>(false);
  const dragDirectionRef = useRef<'horizontal' | 'vertical' | null>(null);
  const touchStartCoordRef = useRef<{ x: number; y: number } | null>(null);
  const pageContainerRef = useRef<HTMLDivElement | null>(null);

  const [selectedVerseKey, setSelectedVerseKey] = useState<string | null>(null);
  const [pageVersesCache, setPageVersesCache] = useState<Record<number, PageVerseItem[]>>({});
  const pageVersesCacheRef = useRef<Record<number, PageVerseItem[]>>({});

  // Long-press vs Single Click gesture handling (klik lama -> opsi ayat, sekali klik -> buka/tutup header & footer)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const isLongPressActiveRef = useRef<boolean>(false);

  const openVerseMenu = useCallback((surahId: number, verseNum: number, verseKey: string) => {
    if (window.getSelection) {
      try {
        window.getSelection()?.removeAllRanges();
      } catch (_) {}
    }
    setSelectedVerseKey(verseKey);
    setActiveVerseSheet({ surahId, verseNum });
  }, []);

  const handleVerseTouchStart = useCallback((surahId: number, verseNum: number, verseKey: string, e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    isLongPressActiveRef.current = false;

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    longPressTimerRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      if (navigator.vibrate) {
        try {
          navigator.vibrate(40);
        } catch (_) {}
      }
      openVerseMenu(surahId, verseNum, verseKey);
    }, 420); // 420ms threshold for intentional long press
  }, [openVerseMenu]);

  const handleVerseTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartPosRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);
    if (dx > 8 || dy > 8) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  }, []);

  const handleVerseTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (window.getSelection) {
      try {
        window.getSelection()?.removeAllRanges();
      } catch (_) {}
    }
  }, []);

  // Mouse long press for desktop
  const handleVerseMouseDown = useCallback((surahId: number, verseNum: number, verseKey: string, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    touchStartPosRef.current = { x: e.clientX, y: e.clientY };
    isLongPressActiveRef.current = false;

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    longPressTimerRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      openVerseMenu(surahId, verseNum, verseKey);
    }, 420);
  }, [openVerseMenu]);

  const handleVerseMouseMove = useCallback((e: React.MouseEvent) => {
    if (!touchStartPosRef.current) return;
    const dx = Math.abs(e.clientX - touchStartPosRef.current.x);
    const dy = Math.abs(e.clientY - touchStartPosRef.current.y);
    if (dx > 8 || dy > 8) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  }, []);

  const handleVerseMouseUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Single click handler: toggle header and footer for clean view
  const handleVerseClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isDraggingPageRef.current || Math.abs(dragOffsetRef.current) > 5) {
      return;
    }

    if (isLongPressActiveRef.current) {
      isLongPressActiveRef.current = false;
      return;
    }

    toggleCleanMode();
  }, [toggleCleanMode]);

  // Context menu (right click) on desktop opens verse menu
  const handleVerseContextMenu = useCallback((surahId: number, verseNum: number, verseKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openVerseMenu(surahId, verseNum, verseKey);
  }, [openVerseMenu]);

  const fetchPageVerses = useCallback(async (pageNum: number) => {
    const safePage = Math.max(1, Math.min(604, pageNum));
    const cacheKey = `qwbw:page_verses:${safePage}`;

    if (pageVersesCacheRef.current[safePage]?.length) {
      return pageVersesCacheRef.current[safePage];
    }

    try {
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          pageVersesCacheRef.current[safePage] = parsed;
          setPageVersesCache((prev) => ({ ...prev, [safePage]: parsed }));
          return parsed;
        }
      }
    } catch (e) {}

    setIsPageLoading(true);
    try {
      const res = await fetch(`${API}/verses/by_page/${safePage}?language=id&words=true&translations=33&fields=text_uthmani&word_fields=text_uthmani,line_number,position`);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const items: PageVerseItem[] = (data.verses || []).map((v: any) => {
        const [sStr, vStr] = v.verse_key.split(':');
        const sId = parseInt(sStr, 10);
        const vNum = parseInt(vStr, 10);
        const nonEndWords = (v.words || []).filter((w: any) => w.char_type_name !== 'end');
        const arabicText = nonEndWords.map((w: any) => w.text_uthmani || '').join(' ') || v.text_uthmani || '';
        const words: [string, string, string][] = nonEndWords.map((w: any) => [
          w.text_uthmani || '',
          w.translation?.text || '',
          w.audio_url || ''
        ]);
        const translation = cleanHtml(v.translations?.[0]?.text || '');

        return {
          id: v.id,
          surahId: sId,
          verseNum: vNum,
          verseKey: v.verse_key,
          arabicText,
          translation,
          words
        };
      });

      pageVersesCacheRef.current[safePage] = items;
      setPageVersesCache((prev) => ({ ...prev, [safePage]: items }));
      try {
        localStorage.setItem(cacheKey, JSON.stringify(items));
      } catch (e) {}
      return items;
    } catch (err) {
      console.error('Error fetching page verses:', err);
      return [];
    } finally {
      setIsPageLoading(false);
    }
  }, []);

  const goToPage = useCallback((targetPage: number) => {
    const safeTarget = Math.max(1, Math.min(604, targetPage));
    if (safeTarget === curPage) return;
    setIsPageLoading(true);
    setCurPage(safeTarget);
    setSelectedVerseKey(null);
    const surahId = getChapterIdFromPage(safeTarget);
    setActiveSurahId(surahId);
    setCurrentJuzInfo({ juz: getJuzFromPage(safeTarget), page: safeTarget });
    fetchPageVerses(safeTarget);
    setSettings((prev) => {
      const next = { ...prev, curPage: safeTarget, cur: surahId };
      saveSettings(next);
      return next;
    });
  }, [curPage, fetchPageVerses]);

  const finishPageDrag = useCallback(() => {
    if (!touchStartCoordRef.current) return;
    const currentOffset = dragOffsetRef.current;
    const wasDragging = isDraggingPageRef.current;
    touchStartCoordRef.current = null;
    dragDirectionRef.current = null;
    isDraggingPageRef.current = false;

    if (!wasDragging || Math.abs(currentOffset) < 2) {
      setDragOffset(0);
      dragOffsetRef.current = 0;
      return;
    }

    const containerWidth = pageContainerRef.current?.clientWidth || window.innerWidth || 360;
    const threshold = Math.min(100, Math.max(45, containerWidth * 0.16));

    if (currentOffset < -threshold && curPage < 604) {
      // Dragged left past threshold -> Slide over to Next Page (curPage + 1)
      setIsAnimatingPage(true);
      setDragOffset(-containerWidth);
      dragOffsetRef.current = -containerWidth;
      setTimeout(() => {
        goToPage(curPage + 1);
        setIsAnimatingPage(false);
        setDragOffset(0);
        dragOffsetRef.current = 0;
      }, 260);
    } else if (currentOffset > threshold && curPage > 1) {
      // Dragged right past threshold -> Slide over to Prev Page (curPage - 1)
      setIsAnimatingPage(true);
      setDragOffset(containerWidth);
      dragOffsetRef.current = containerWidth;
      setTimeout(() => {
        goToPage(curPage - 1);
        setIsAnimatingPage(false);
        setDragOffset(0);
        dragOffsetRef.current = 0;
      }, 260);
    } else {
      // Snap back to current page
      setIsAnimatingPage(true);
      setDragOffset(0);
      dragOffsetRef.current = 0;
      setTimeout(() => {
        setIsAnimatingPage(false);
      }, 260);
    }
  }, [curPage, goToPage]);

  const handlePageTouchStart = useCallback((e: React.TouchEvent) => {
    if (isAnimatingPage) return;
    const touch = e.touches[0];
    touchStartCoordRef.current = { x: touch.clientX, y: touch.clientY };
    dragDirectionRef.current = null;
    isDraggingPageRef.current = false;
  }, [isAnimatingPage]);

  const handlePageTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartCoordRef.current || isAnimatingPage) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartCoordRef.current.x;
    const dy = touch.clientY - touchStartCoordRef.current.y;

    if (dragDirectionRef.current === null) {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        if (Math.abs(dx) > Math.abs(dy)) {
          dragDirectionRef.current = 'horizontal';
          isDraggingPageRef.current = true;
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
        } else {
          dragDirectionRef.current = 'vertical';
        }
      }
    }

    if (dragDirectionRef.current === 'horizontal') {
      let adjustedDx = dx;
      if (curPage <= 1 && dx > 0) {
        adjustedDx = dx * 0.22;
      } else if (curPage >= 604 && dx < 0) {
        adjustedDx = dx * 0.22;
      }
      dragOffsetRef.current = adjustedDx;
      setDragOffset(adjustedDx);
    }
  }, [isAnimatingPage, curPage]);

  const handlePageTouchEnd = useCallback(() => {
    finishPageDrag();
  }, [finishPageDrag]);

  const handlePageMouseDown = useCallback((e: React.MouseEvent) => {
    if (isAnimatingPage || e.button !== 0) return;
    touchStartCoordRef.current = { x: e.clientX, y: e.clientY };
    dragDirectionRef.current = null;
    isDraggingPageRef.current = false;
  }, [isAnimatingPage]);

  const handlePageMouseMove = useCallback((e: React.MouseEvent) => {
    if (!touchStartCoordRef.current || isAnimatingPage) return;
    const dx = e.clientX - touchStartCoordRef.current.x;
    const dy = e.clientY - touchStartCoordRef.current.y;

    if (dragDirectionRef.current === null) {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        if (Math.abs(dx) > Math.abs(dy)) {
          dragDirectionRef.current = 'horizontal';
          isDraggingPageRef.current = true;
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
        } else {
          dragDirectionRef.current = 'vertical';
        }
      }
    }

    if (dragDirectionRef.current === 'horizontal') {
      let adjustedDx = dx;
      if (curPage <= 1 && dx > 0) {
        adjustedDx = dx * 0.22;
      } else if (curPage >= 604 && dx < 0) {
        adjustedDx = dx * 0.22;
      }
      dragOffsetRef.current = adjustedDx;
      setDragOffset(adjustedDx);
    }
  }, [isAnimatingPage, curPage]);

  const handlePageMouseUp = useCallback(() => {
    finishPageDrag();
  }, [finishPageDrag]);

  // Surah font (Tarteel Surah Name V4) loaded detection
  const [isSurahFontLoaded, setIsSurahFontLoaded] = useState(() => {
    if (typeof document !== 'undefined' && document.fonts) {
      return document.fonts.check("24px 'surah-name-v4-icon'");
    }
    return false;
  });

  useEffect(() => {
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.load("24px 'surah-name-v4-icon'").then(() => {
        setIsSurahFontLoaded(true);
      }).catch(() => {});
    }
  }, []);

  const t = useCallback((key: keyof typeof T_LANG['id']) => {
    return (T_LANG[settings.lang] || T_LANG.id)[key] || key;
  }, [settings.lang]);

  // Stop audio on close
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingInfo(null);
  }, []);

  // Back handler for sheets
  useBackHandler(Boolean(isOpen && isJumpModalOpen), 'quran-jump-modal', () => setIsJumpModalOpen(false));
  useBackHandler(Boolean(isOpen && isSurahSheetOpen), 'quran-surah-sheet', () => setIsSurahSheetOpen(false));
  useBackHandler(Boolean(isOpen && isSettingsSheetOpen), 'quran-settings-sheet', () => setIsSettingsSheetOpen(false));
  useBackHandler(Boolean(isOpen && isFontSizeModalOpen), 'quran-font-size-modal', () => setIsFontSizeModalOpen(false));
  useBackHandler(Boolean(isOpen && activeVerseSheet !== null), 'quran-verse-sheet', () => setActiveVerseSheet(null));
  useBackHandler(Boolean(isOpen && !isJumpModalOpen && !isSurahSheetOpen && !isSettingsSheetOpen && !isFontSizeModalOpen && activeVerseSheet === null), 'quran-main-page', () => {
    stopAudio();
    onClose();
  });

  useEffect(() => {
    if (!isOpen) {
      stopAudio();
    }
  }, [isOpen, stopAudio]);

  // Sync initialSurah if provided
  useEffect(() => {
    if (initialSurah && isOpen) {
      const startP = CHAPTER_PAGE_RANGES[initialSurah - 1]?.[0] || 1;
      setCurPage(startP);
      setActiveSurahId(initialSurah);
      setCurrentJuzInfo({ juz: getJuzFromPage(startP), page: startP });
    }
  }, [initialSurah, isOpen]);

  // Fetch current page verses and preload adjacent pages for smooth instant page flipping
  useEffect(() => {
    if (!isOpen || settings.mode !== 'read') return;
    fetchPageVerses(curPage);
    if (curPage + 1 <= 604) fetchPageVerses(curPage + 1);
    if (curPage - 1 >= 1) fetchPageVerses(curPage - 1);
  }, [isOpen, curPage, settings.mode, fetchPageVerses]);

  // Desktop keyboard arrows navigation (Left = Next page, Right = Previous page in RTL Quran)
  useEffect(() => {
    if (!isOpen || settings.mode !== 'read') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isJumpModalOpen || isSurahSheetOpen || isSettingsSheetOpen || activeVerseSheet !== null) return;
      if (e.key === 'ArrowLeft') {
        goToPage(curPage + 1);
      } else if (e.key === 'ArrowRight') {
        goToPage(curPage - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, settings.mode, curPage, isJumpModalOpen, isSurahSheetOpen, isSettingsSheetOpen, activeVerseSheet, goToPage]);

  // Target verse to scroll to (for resuming last read)
  const [targetScrollVerse, setTargetScrollVerse] = useState<{ s: number; v: number } | null>(() => {
    const s = loadSettings();
    return s.lr ? { s: Number(s.lr.s), v: Number(s.lr.v) } : null;
  });

  // Load all 114 Chapters metadata once
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const cacheKey = `qwbw:chapters:${settings.lang}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length === 114) {
          setChapters(parsed);
          const targetId = initialSurah || (settings.lr?.s ? Number(settings.lr.s) : (settings.cur || 1));
          setActiveSurahId(targetId);
          setLoadedSurahIds([targetId]);
          return;
        }
      } catch (e) {}
    }

    fetch(`${API}/chapters?language=${settings.lang}`)
      .then((res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then((d) => {
        if (!isMounted) return;
        const list: ChapterItem[] = d.chapters.map((x: any, idx: number) => ({
          id: x.id,
          name: x.name_simple,
          ar: x.name_arabic,
          tn: x.translated_name?.name || '',
          count: x.verses_count,
          place: x.revelation_place,
          bis: x.bismillah_pre,
          pages: x.pages || CHAPTER_PAGE_RANGES[idx] || [1, 1],
        }));
        setChapters(list);
        try {
          localStorage.setItem(cacheKey, JSON.stringify(list));
        } catch (e) {}
        const targetId = initialSurah || (settings.lr?.s ? Number(settings.lr.s) : (settings.cur || 1));
        setActiveSurahId(targetId);
        setLoadedSurahIds([targetId]);
      })
      .catch(() => {
        if (!isMounted) return;
        setErrorMessage(t('err'));
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, settings.lang, initialSurah, settings.lr, t]);

  // Fetch Verses for a specific chapter
  const fetchChapterVerses = useCallback(async (chapterId: number): Promise<CompactVerse[]> => {
    const cacheKey = `qwbw:s:${settings.lang}:${chapterId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {}
    }

    const translationId = TRANSLATION_ID[settings.lang] || 33;
    const urlPage1 = `${API}/verses/by_chapter/${chapterId}?language=${settings.lang}&words=true&word_fields=text_uthmani&translations=${translationId}&fields=text_uthmani&per_page=50&page=1`;
    
    const res1 = await fetch(urlPage1);
    if (!res1.ok) throw new Error('HTTP ' + res1.status);
    const data1 = await res1.json();

    const compactify = (v: any): CompactVerse => ({
      n: v.verse_number,
      p: v.page_number,
      j: v.juz_number,
      w: (v.words || [])
        .filter((w: any) => w.char_type_name !== 'end')
        .map((w: any) => [
          w.text_uthmani || w.text || '',
          w.translation?.text || '',
          w.audio_url || '',
        ]),
      t: v.translations?.[0] ? cleanHtml(v.translations[0].text) : '',
    });

    let allCompact: CompactVerse[] = data1.verses.map(compactify);
    const totalPages = data1.pagination?.total_pages || 1;

    if (totalPages > 1) {
      const pageJobs = [];
      for (let p = 2; p <= totalPages; p++) {
        const u = `${API}/verses/by_chapter/${chapterId}?language=${settings.lang}&words=true&word_fields=text_uthmani&translations=${translationId}&fields=text_uthmani&per_page=50&page=${p}`;
        pageJobs.push(fetch(u).then((r) => r.json()));
      }
      const restResults = await Promise.all(pageJobs);
      for (const res of restResults) {
        if (res.verses) {
          allCompact = allCompact.concat(res.verses.map(compactify));
        }
      }
    }

    try {
      localStorage.setItem(cacheKey, JSON.stringify(allCompact));
    } catch (e) {}

    return allCompact;
  }, [settings.lang]);

  // Load verses whenever loadedSurahIds has surahs not yet in versesBySurah
  useEffect(() => {
    if (!isOpen || loadedSurahIds.length === 0) return;

    let isMounted = true;
    const missing = loadedSurahIds.filter((id) => !versesBySurah[id]);
    if (missing.length === 0) {
      setIsLoadingInitial(false);
      setIsLoadingNextSurah(false);
      setIsLoadingPrevSurah(false);
      return;
    }

    // If initial loading
    if (loadedSurahIds.length === 1 && !versesBySurah[loadedSurahIds[0]]) {
      setIsLoadingInitial(true);
    }

    Promise.all(
      missing.map((id) =>
        fetchChapterVerses(id).then((v) => ({ id, verses: v }))
      )
    )
      .then((results) => {
        if (!isMounted) return;
        setVersesBySurah((prev) => {
          const next = { ...prev };
          results.forEach((r) => {
            next[r.id] = r.verses;
          });
          return next;
        });
        setIsLoadingInitial(false);
        setIsLoadingNextSurah(false);
        setIsLoadingPrevSurah(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setIsLoadingInitial(false);
        setIsLoadingNextSurah(false);
        setIsLoadingPrevSurah(false);
        setErrorMessage(t('err'));
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, loadedSurahIds, versesBySurah, fetchChapterVerses, t]);

  // Switch surah when initialSurah prop changes
  useEffect(() => {
    if (isOpen && initialSurah && (!loadedSurahIds.includes(initialSurah) || activeSurahId !== initialSurah)) {
      setLoadedSurahIds([initialSurah]);
      setActiveSurahId(initialSurah);
      if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
    }
  }, [isOpen, initialSurah, loadedSurahIds, activeSurahId]);

  // Auto scroll to target verse (last read)
  useEffect(() => {
    if (targetScrollVerse && !isLoadingInitial && versesBySurah[targetScrollVerse.s]) {
      const { s, v } = targetScrollVerse;
      setTargetScrollVerse(null);
      const timer = window.setTimeout(() => {
        const el = scrollerRef.current?.querySelector(`[data-verse-key="${s}:${v}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          showToast(`Melanjutkan ayat terakhir dibaca: QS. ${s} Ayat ${v}`);
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [targetScrollVerse, isLoadingInitial, versesBySurah, showToast]);

  // Continuous auto-loader for the next surah
  const loadNextSurah = useCallback(() => {
    setLoadedSurahIds((prev) => {
      if (prev.length === 0) return [1];
      const maxLoadedId = Math.max(...prev);
      if (maxLoadedId >= 114) return prev;
      const nextId = maxLoadedId + 1;
      if (prev.includes(nextId)) return prev;
      setIsLoadingNextSurah(true);
      return [...prev, nextId];
    });
  }, []);

  // Continuous loader for previous surah
  const loadPreviousSurah = useCallback(() => {
    setLoadedSurahIds((prev) => {
      if (prev.length === 0) return [1];
      const minLoadedId = Math.min(...prev);
      if (minLoadedId <= 1) return prev;
      const prevId = minLoadedId - 1;
      if (prev.includes(prevId)) return prev;
      setIsLoadingPrevSurah(true);
      return [prevId, ...prev];
    });
  }, []);

  // Infinite scroll observer for bottom sentinel
  useEffect(() => {
    if (!bottomSentinelRef.current || isLoadingInitial) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadNextSurah();
        }
      },
      { root: scrollerRef.current, rootMargin: '600px 0px 600px 0px', threshold: 0.1 }
    );

    observer.observe(bottomSentinelRef.current);
    return () => observer.disconnect();
  }, [isLoadingInitial, loadNextSurah]);

  // Handle Scroll to update active Surah in header, Juz & Page indicators
  const handleScroll = useCallback(() => {
    if (!scrollerRef.current) return;
    const containerTop = scrollerRef.current.getBoundingClientRect().top;
    
    // Check if near bottom to trigger next surah seamlessly
    const { scrollTop, scrollHeight, clientHeight } = scrollerRef.current;
    if (scrollHeight - scrollTop - clientHeight < 700) {
      loadNextSurah();
    }

    // 1. Detect which Surah is currently visible in upper viewport
    const surahSections = scrollerRef.current.querySelectorAll<HTMLElement>('[data-surah-id]');
    let currentVisibleSurahId = activeSurahId;

    for (let i = 0; i < surahSections.length; i++) {
      const el = surahSections[i];
      const rect = el.getBoundingClientRect();
      // If the bottom of this surah section is still below top header
      if (rect.bottom > containerTop + 60) {
        const id = parseInt(el.dataset.surahId || '1', 10);
        currentVisibleSurahId = id;
        break;
      }
    }

    if (currentVisibleSurahId !== activeSurahId) {
      setActiveSurahId(currentVisibleSurahId);
      setSettings((prev) => {
        const next = { ...prev, cur: currentVisibleSurahId };
        saveSettings(next);
        return next;
      });
    }

    // 2. Detect which verse is at the top to update Juz & Page
    const verseElements = scrollerRef.current.querySelectorAll<HTMLElement>('[data-verse-key]');
    for (let i = 0; i < verseElements.length; i++) {
      const el = verseElements[i];
      const rect = el.getBoundingClientRect();
      if (rect.bottom > containerTop + 20) {
        const key = el.dataset.verseKey; // "surahId:verseNum"
        if (key) {
          const [sId, vNum] = key.split(':').map((x) => parseInt(x, 10));
          const surahVerses = versesBySurah[sId];
          const v = surahVerses?.find((x) => x.n === vNum);
          if (v) {
            setCurrentJuzInfo({ juz: v.j, page: v.p });
          }
        }
        break;
      }
    }
  }, [activeSurahId, versesBySurah, loadNextSurah]);

  // Audio Play Verse
  const playVerse = useCallback((surahId: number, num: number) => {
    const chapter = chapters.find((c) => c.id === surahId);
    if (!chapter) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    setPlayingInfo({ surahId, verseNum: num });

    const surahPadded = pad(surahId, 3);
    const versePadded = pad(num, 3);
    const audioUrl = `${AUDIO_VERSE}${surahPadded}${versePadded}.mp3`;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onended = () => {
      if (num < chapter.count) {
        playVerse(surahId, num + 1);
      } else if (surahId < 114) {
        // Automatically progress to next surah in continuous mode!
        setLoadedSurahIds((prev) => prev.includes(surahId + 1) ? prev : [...prev, surahId + 1]);
        playVerse(surahId + 1, 1);
      } else {
        stopAudio();
      }
    };

    audio.onerror = () => {
      stopAudio();
      showToast(t('noAudio'));
    };

    audio.play().catch(() => {
      stopAudio();
      showToast(t('noAudio'));
    });

    if (settings.follow && scrollerRef.current) {
      const targetEl = scrollerRef.current.querySelector(`[data-verse-key="${surahId}:${num}"]`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [chapters, settings.follow, stopAudio, showToast, t]);

  const togglePlay = () => {
    if (!playingInfo) {
      const startSurahId = activeSurahId;
      const startNum = 1;
      playVerse(startSurahId, startNum);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingInfo(null);
    }
  };

  // Play single word audio
  const playWordAudio = (audioPath: string, key: string) => {
    if (!audioPath) return;
    if (wordAudioRef.current) {
      wordAudioRef.current.pause();
    }
    setPlayingWordKey(key);
    const a = new Audio(`${AUDIO_WORD}${audioPath}`);
    wordAudioRef.current = a;
    a.onended = () => setPlayingWordKey(null);
    a.onerror = () => setPlayingWordKey(null);
    a.play().catch(() => setPlayingWordKey(null));
  };

  // Bookmark Toggle
  const toggleBookmark = (surahId: number, verseNum: number, colorKey: string) => {
    const key = `${surahId}:${verseNum}`;
    setSettings((prev) => {
      const currentList = prev.bm[key] || [];
      const hasColor = currentList.includes(colorKey);
      const updated = hasColor
        ? currentList.filter((c) => c !== colorKey)
        : [...currentList, colorKey];

      const newBm = { ...prev.bm };
      if (updated.length > 0) {
        newBm[key] = updated;
      } else {
        delete newBm[key];
      }

      const nextSettings = { ...prev, bm: newBm };
      saveSettings(nextSettings);
      return nextSettings;
    });
    showToast(`${t('bm')} ${colorKey}`);
  };

  // Mark Last Read
  const markLastRead = (surahId: number, verseNum: number) => {
    setSettings((prev) => {
      const nextSettings = { ...prev, lr: { s: surahId, v: verseNum } };
      saveSettings(nextSettings);
      return nextSettings;
    });
    showToast(t('last'));
    setActiveVerseSheet(null);
  };

  // Clipboard helper
  const copyToClipboard = (text: string, msg: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => showToast(msg));
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        showToast(msg);
      } catch (e) {}
      document.body.removeChild(ta);
    }
    setActiveVerseSheet(null);
  };

  // Universal Copy Verse Text (Arab + Terjemahan)
  const copyVerseText = (arabicText: string, translation: string, chapter: ChapterItem, verseNum: number) => {
    const cleanArabic = (arabicText || '').trim();
    const cleanTrans = (translation || '').trim();
    const copyString = `${cleanArabic}\n\n"${cleanTrans}"\n\n(QS. ${chapter.name} [${chapter.id}]: Ayat ${verseNum})`;
    copyToClipboard(copyString, 'Arab & Terjemahan berhasil disalin');
  };

  // Copy Only Arabic Text
  const copyArabicOnly = (arabicText: string, chapter: ChapterItem, verseNum: number) => {
    const cleanArabic = (arabicText || '').trim();
    const copyString = `${cleanArabic}\n(QS. ${chapter.name}: ${verseNum})`;
    copyToClipboard(copyString, 'Teks Arab berhasil disalin');
  };

  // Copy Only Indonesian Translation
  const copyTranslationOnly = (translation: string, chapter: ChapterItem, verseNum: number) => {
    const cleanTrans = (translation || '').trim();
    const copyString = `"${cleanTrans}"\n(QS. ${chapter.name}: Ayat ${verseNum})`;
    copyToClipboard(copyString, 'Terjemahan berhasil disalin');
  };

  // Share Verse
  const shareVerseText = (arabicText: string, translation: string, chapter: ChapterItem, verseNum: number) => {
    const cleanArabic = (arabicText || '').trim();
    const cleanTrans = (translation || '').trim();
    const shareContent = `${cleanArabic}\n\n"${cleanTrans}"\n\n(QS. ${chapter.name} [${chapter.id}]: Ayat ${verseNum})`;

    if (navigator.share) {
      navigator.share({
        title: `QS. ${chapter.name} : ${verseNum}`,
        text: shareContent,
      }).catch(() => {});
      setActiveVerseSheet(null);
    } else {
      copyVerseText(arabicText, translation, chapter, verseNum);
    }
  };

  // Copy Verse Text for CompactVerse
  const copyVerse = (v: CompactVerse, chapter: ChapterItem) => {
    const arabicWords = v.w.map((item) => item[0]).join(' ');
    copyVerseText(arabicWords, v.t, chapter, v.n);
  };

  // Surah Selection from Drawer
  const handleSelectSurah = (selectedId: number) => {
    setIsSurahSheetOpen(false);
    setActiveSurahId(selectedId);
    stopAudio();

    const targetPage = CHAPTER_PAGE_RANGES[selectedId - 1]?.[0] || 1;
    setCurPage(targetPage);
    setCurrentJuzInfo({ juz: getJuzFromPage(targetPage), page: targetPage });

    if (loadedSurahIds.includes(selectedId)) {
      // Already loaded, scroll straight to it if in wbw
      const el = scrollerRef.current?.querySelector(`#surah-section-${selectedId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // Set stream starting from selected surah
      setLoadedSurahIds([selectedId]);
      if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
    }

    setSettings((prev) => {
      const next = { ...prev, cur: selectedId, curPage: targetPage };
      saveSettings(next);
      return next;
    });

    const c = chapters.find((x) => x.id === selectedId);
    if (c) {
      showToast(`QS. ${c.name} (${c.id}) • Hal. ${targetPage}`);
    }
  };

  // Display mode switcher
  const toggleDisplayMode = () => {
    const nextMode: 'wbw' | 'read' = settings.mode === 'wbw' ? 'read' : 'wbw';
    
    if (nextMode === 'read') {
      const [startP, endP] = CHAPTER_PAGE_RANGES[activeSurahId - 1] || [1, 1];
      if (curPage < startP || curPage > endP) {
        goToPage(startP);
      }
    } else {
      const surahFromCurrentPage = getChapterIdFromPage(curPage);
      setActiveSurahId(surahFromCurrentPage);
      setLoadedSurahIds([surahFromCurrentPage]);
    }

    setSettings((prev) => {
      const updated: QuranSettings = { ...prev, mode: nextMode };
      saveSettings(updated);
      return updated;
    });
    showToast(nextMode === 'read' ? 'Mode Mushaf Pojok (1 Layar = 1 Halaman)' : 'Mode Kata per Kata');
  };

  if (!isOpen) return null;

  const currentFontSize = SIZES[settings.size] || 28;
  const activeFontConfig = QURAN_FONTS.find((f) => f.id === settings.fontFamily) || QURAN_FONTS[0];
  const activeChapter = chapters.find((c) => c.id === activeSurahId) || chapters[0] || null;
  const minLoadedSurahId = Math.min(...loadedSurahIds);
  const maxLoadedSurahId = Math.max(...loadedSurahIds);
  const isPlaying = playingInfo !== null;

  return (
    <div className="fixed inset-0 z-[100050] bg-[#fbf9f2] text-slate-800 flex flex-col font-sans select-none overflow-hidden max-w-lg mx-auto shadow-2xl border-x border-slate-200">
      {/* ================= 1. TOP GREEN HEADER ================= */}
      <header className={`bg-[#4f9a50] text-white flex items-center justify-between px-3 shrink-0 shadow-sm z-30 transition-all duration-300 ease-in-out ${
        isCleanReading 
          ? 'h-0 py-0 opacity-0 pointer-events-none overflow-hidden' 
          : 'h-14 pt-safe opacity-100'
      }`}>
        {/* Back Button to Portal Alumni */}
        <button
          type="button"
          onClick={() => {
            stopAudio();
            onClose();
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 active:bg-white/30 transition-colors cursor-pointer"
          title={t('backToPortal')}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Surah Title Picker & Quick Page Jump Button */}
        <button
          type="button"
          onClick={() => {
            if (settings.mode === 'read') {
              setIsJumpModalOpen(true);
            } else {
              setSurahSearchQuery('');
              setIsSurahSheetOpen(true);
            }
          }}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-white/10 active:bg-white/20 transition-all cursor-pointer min-w-0 mx-2"
        >
          <span className="font-semibold text-sm sm:text-base truncate tracking-wide">
            {activeChapter ? `${activeChapter.id}. ${activeChapter.name}` : 'Al-Qur\'an'}
            {settings.mode === 'read' ? ` • Hal. ${curPage} (Juz ${getJuzFromPage(curPage)})` : ''}
          </span>
          <ChevronDown className="w-4 h-4 shrink-0 opacity-80" />
        </button>

        {/* Quick Font Size 'aA' Button (Tersedia di semua mode) */}
        <button
          type="button"
          onClick={() => setIsFontSizeModalOpen(true)}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/20 active:bg-white/30 transition-colors cursor-pointer text-white"
          title="Atur Ukuran Huruf (aA)"
          aria-label="Atur Ukuran Huruf"
        >
          <span className="font-serif tracking-tighter select-none font-bold text-xs sm:text-sm border border-white/40 px-1.5 py-0.5 rounded-lg bg-white/10">
            aA
          </span>
        </button>

        {/* Settings (Gir) Button */}
        <button
          type="button"
          onClick={() => setIsSettingsSheetOpen(true)}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/20 active:bg-white/30 transition-colors cursor-pointer text-white ml-0.5"
          title={t('settings')}
          aria-label="Pengaturan"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* SVG Definition for Surah Cartouche Pill (Shared across both Mushaf & WBW modes) */}
      <svg width="0" height="0" className="absolute w-0 h-0 overflow-hidden" aria-hidden="true">
        <defs>
          <symbol id="surah-cartouche-symbol" viewBox="-2 -2 304 68">
            <path 
              d="M22.4,0 L277.6,0 L277.6,9.6 A22.4,22.4 0 0 1 277.6,54.4 L277.6,64 L22.4,64 L22.4,54.4 A22.4,22.4 0 0 1 22.4,9.6 Z" 
              fill="var(--pill, #ffffff)" 
              stroke="var(--line, #9fe3cc)" 
              strokeWidth="1.8" 
              strokeLinejoin="miter"
            />
          </symbol>
        </defs>
      </svg>

      {/* ================= 3A. MUSHAF POJOK STANDAR (TEKS DIGITAL BAKU, 1 LAYAR = 1 HALAMAN, GESER HALAMAN KONTINU INTERAKTIF) ================= */}
      {settings.mode === 'read' && (
        <div 
          ref={pageContainerRef}
          className="flex-1 relative flex flex-col items-center justify-between bg-[#fbf9f2] overflow-hidden select-none"
          onTouchStart={handlePageTouchStart}
          onTouchMove={handlePageTouchMove}
          onTouchEnd={handlePageTouchEnd}
          onTouchCancel={handlePageTouchEnd}
          onMouseDown={handlePageMouseDown}
          onMouseMove={handlePageMouseMove}
          onMouseUp={handlePageMouseUp}
          onMouseLeave={handlePageMouseUp}
        >
          {/* Left tap zone: Next Page in Quran RTL (Hal. +1) */}
          <button
            type="button"
            disabled={curPage >= 604}
            onClick={(e) => {
              e.stopPropagation();
              if (!isDraggingPageRef.current && Math.abs(dragOffsetRef.current) < 5) {
                goToPage(curPage + 1);
              }
            }}
            className="absolute left-0 top-0 bottom-0 w-8 z-20 opacity-0 cursor-pointer disabled:pointer-events-none"
            title={`Halaman Berikutnya (Hal. ${curPage + 1})`}
            aria-label="Halaman Berikutnya"
          />

          {/* Right tap zone: Previous Page in Quran RTL (Hal. -1) */}
          <button
            type="button"
            disabled={curPage <= 1}
            onClick={(e) => {
              e.stopPropagation();
              if (!isDraggingPageRef.current && Math.abs(dragOffsetRef.current) < 5) {
                goToPage(curPage - 1);
              }
            }}
            className="absolute right-0 top-0 bottom-0 w-8 z-20 opacity-0 cursor-pointer disabled:pointer-events-none"
            title={`Halaman Sebelumnya (Hal. ${curPage - 1})`}
            aria-label="Halaman Sebelumnya"
          />

          {/* Main Digital Mushaf Viewport (1 Layar = Tepat 1 Halaman Baku Mushaf Pojok) */}
          <div
            className="relative w-full flex-1 overflow-hidden select-none bg-[#fbf9f2]"
            onClick={() => {
              if (!isDraggingPageRef.current && Math.abs(dragOffsetRef.current) < 5) {
                toggleCleanMode();
              }
            }}
          >
            {/* 1. Previous Page (Rendered only during right-drag / backward push) */}
            {(dragOffset > 0 || (isAnimatingPage && dragOffset > 0)) && curPage > 1 && (
              <div
                className="absolute inset-y-0 w-full overflow-y-auto flex flex-col items-center justify-start overscroll-contain bg-[#fbf9f2] pointer-events-none"
                style={{
                  left: '-100%',
                  transform: `translateX(${dragOffset}px)`,
                  transition: isAnimatingPage ? 'transform 260ms cubic-bezier(0.2, 0.9, 0.3, 1)' : 'none',
                  willChange: 'transform'
                }}
              >
                <MushafPageContent
                  page={curPage - 1}
                  verses={pageVersesCache[curPage - 1] || []}
                  isLoading={isPageLoading && !(pageVersesCache[curPage - 1]?.length)}
                  chapters={chapters}
                  isSurahFontLoaded={isSurahFontLoaded}
                  currentFontSize={currentFontSize}
                  activeFontConfig={activeFontConfig}
                  playingInfo={playingInfo}
                  selectedVerseKey={null}
                  settings={settings}
                  isCleanReading={isCleanReading}
                  isInteractive={false}
                />
              </div>
            )}

            {/* 2. Current Active Page (1 Layar Penuh = 1 Halaman Baku, terdorong halus saat digeser) */}
            <div
              className="absolute inset-0 w-full h-full overflow-y-auto flex flex-col items-center justify-start overscroll-contain bg-[#fbf9f2]"
              style={{
                transform: `translateX(${dragOffset}px)`,
                transition: isAnimatingPage ? 'transform 260ms cubic-bezier(0.2, 0.9, 0.3, 1)' : 'none',
                willChange: 'transform'
              }}
            >
              <MushafPageContent
                page={curPage}
                verses={pageVersesCache[curPage] || []}
                isLoading={isPageLoading && !(pageVersesCache[curPage]?.length)}
                chapters={chapters}
                isSurahFontLoaded={isSurahFontLoaded}
                currentFontSize={currentFontSize}
                activeFontConfig={activeFontConfig}
                playingInfo={playingInfo}
                selectedVerseKey={selectedVerseKey}
                settings={settings}
                isCleanReading={isCleanReading}
                isInteractive={true}
                onVerseClick={handleVerseClick}
                onVerseContextMenu={handleVerseContextMenu}
                onVerseTouchStart={handleVerseTouchStart}
                onVerseTouchMove={handleVerseTouchMove}
                onVerseTouchEnd={handleVerseTouchEnd}
                onVerseMouseDown={handleVerseMouseDown}
                onVerseMouseMove={handleVerseMouseMove}
                onVerseMouseUp={handleVerseMouseUp}
                onRetry={() => fetchPageVerses(curPage)}
              />
            </div>

            {/* 3. Next Page (Rendered only during left-drag / forward push) */}
            {(dragOffset < 0 || (isAnimatingPage && dragOffset < 0)) && curPage < 604 && (
              <div
                className="absolute inset-y-0 w-full overflow-y-auto flex flex-col items-center justify-start overscroll-contain bg-[#fbf9f2] pointer-events-none"
                style={{
                  left: '100%',
                  transform: `translateX(${dragOffset}px)`,
                  transition: isAnimatingPage ? 'transform 260ms cubic-bezier(0.2, 0.9, 0.3, 1)' : 'none',
                  willChange: 'transform'
                }}
              >
                <MushafPageContent
                  page={curPage + 1}
                  verses={pageVersesCache[curPage + 1] || []}
                  isLoading={isPageLoading && !(pageVersesCache[curPage + 1]?.length)}
                  chapters={chapters}
                  isSurahFontLoaded={isSurahFontLoaded}
                  currentFontSize={currentFontSize}
                  activeFontConfig={activeFontConfig}
                  playingInfo={playingInfo}
                  selectedVerseKey={null}
                  settings={settings}
                  isCleanReading={isCleanReading}
                  isInteractive={false}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= 3B. CONTINUOUS SCROLLABLE VERSES CONTENT (MODE KATA PER KATA) ================= */}
      {settings.mode === 'wbw' && (
      <main
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-white overscroll-contain pb-24 select-text"
        tabIndex={-1}
      >

        {/* Button to load previous surah upwards if user jumped into later surahs */}
        {minLoadedSurahId > 1 && (
          <div className="py-2.5 px-4 text-center border-b border-slate-100 bg-slate-50/60">
            <button
              type="button"
              onClick={loadPreviousSurah}
              disabled={isLoadingPrevSurah}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoadingPrevSurah ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                  <span>Memuat...</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Muat QS. {chapters.find((c) => c.id === minLoadedSurahId - 1)?.name || 'Sebelumnya'}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Initial Loading Spinner */}
        {isLoadingInitial && (
          <div className="py-24 flex flex-col items-center justify-center text-slate-500 text-xs gap-3">
            <div className="w-8 h-8 rounded-full border-3 border-slate-200 border-t-[#4f9a50] animate-spin" />
            <span>{t('loading')}</span>
          </div>
        )}

        {/* Error State */}
        {errorMessage && !isLoadingInitial && (
          <div className="py-20 px-6 text-center text-slate-500 space-y-3">
            <p className="text-xs">{errorMessage}</p>
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setLoadedSurahIds([activeSurahId]);
              }}
              className="bg-[#4f9a50] text-white px-5 py-2 rounded-full text-xs font-semibold cursor-pointer shadow-md hover:bg-[#438344]"
            >
              {t('retry')}
            </button>
          </div>
        )}

        {/* CONTINUOUS SURAH STREAM */}
        {!errorMessage && Array.from(new Set(loadedSurahIds)).map((surahId) => {
          const chapter = chapters.find((c) => c.id === surahId);
          const surahVerses = versesBySurah[surahId] || [];
          if (!chapter) return null;

          return (
            <section
              key={`surah-section-${surahId}`}
              id={`surah-section-${surahId}`}
              data-surah-id={surahId}
              className="surah-section relative"
            >
              {/* Surah Cartouche Banner */}
              <div className="pt-4 pb-1">
                <div className="banner select-none">
                  <span className="capitalize font-medium">
                    {chapter.place === 'madinah' ? 'Madaniyah' : 'Makkiyah'}
                  </span>
                  <div className="cart">
                    <svg aria-hidden="true">
                      <use href="#surah-cartouche-symbol" />
                    </svg>
                    <div 
                      className="name" 
                      translate="no"
                      style={{ 
                        fontFamily: isSurahFontLoaded 
                            ? "'surah-name-v4-icon', 'Aref Ruqaa', serif" 
                          : "'Aref Ruqaa', 'Amiri Quran', serif" 
                      }}
                    >
                      {isSurahFontLoaded 
                        ? `surah${pad(chapter.id, 3)}` 
                        : `سورة ${chapter.ar || chapter.name}`}
                    </div>
                  </div>
                  <span className="font-medium">
                    {chapter.count} Ayat
                  </span>
                </div>

                {/* Authentic Quranic Bismillah Calligraphy Vector */}
                {chapter.bis && (
                  <BismillahCalligraphy />
                )}
              </div>

              {/* Verses for this Surah: Word by Word Mode */}
              {settings.mode === 'wbw' && surahVerses.length > 0 && (
                <div className="divide-y divide-slate-100">
                  {surahVerses.map((v) => {
                    const isVersePlaying = playingInfo?.surahId === surahId && playingInfo?.verseNum === v.n;
                    const verseKey = `${surahId}:${v.n}`;
                    const activeBookmarks = settings.bm[verseKey] || [];
                    const isLastRead = settings.lr?.s === surahId && settings.lr?.v === v.n;

                    return (
                      <article
                        key={verseKey}
                        data-surah-id={surahId}
                        data-verse-num={v.n}
                        data-verse-key={verseKey}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openVerseMenu(surahId, v.n, verseKey);
                        }}
                        onTouchStart={(e) => handleVerseTouchStart(surahId, v.n, verseKey, e)}
                        onTouchMove={handleVerseTouchMove}
                        onTouchEnd={handleVerseTouchEnd}
                        onTouchCancel={handleVerseTouchEnd}
                        className={`p-4 transition-colors select-none quran-interactive-text ${
                          isVersePlaying ? 'bg-[#e6f3e3]' : v.n % 2 === 0 ? 'bg-slate-50/60' : 'bg-white'
                        }`}
                      >
                        {/* Verse Header: Titik Tiga Vertikal di Kiri Atas (tanpa kotak angka) */}
                        <div className="flex items-center justify-between gap-2 min-h-7 mb-2">
                          <div className="flex items-center gap-1.5">
                            {/* Titik tiga vertikal di sebelah kiri atas */}
                            <button
                              type="button"
                              onClick={() => setActiveVerseSheet({ surahId, verseNum: v.n })}
                              className="w-7 h-7 -ml-1 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                              title={`Menu Ayat ${v.n}`}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Active Bookmarks & Last Read */}
                            {isLastRead && (
                              <span className="text-[#2e9e45] flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px] font-bold" title={t('last')}>
                                <Clock className="w-3.5 h-3.5" />
                                <span>Terakhir Dibaca</span>
                              </span>
                            )}
                            {activeBookmarks.map((color, bIdx) => (
                              <span key={`${verseKey}-bm-${color}-${bIdx}`} style={{ color: COLORS[color] }}>
                                <Bookmark className="w-3.5 h-3.5 fill-current" />
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Words Flow (RTL - flows naturally from Right to Left) */}
                        <div 
                          className="flex flex-wrap items-center justify-start gap-x-2.5 gap-y-3.5 my-3"
                          dir="rtl"
                        >
                          {v.w.map((w, idx) => {
                            const wordKey = `${surahId}:${v.n}:${idx}`;
                            const isWordPlaying = playingWordKey === wordKey;

                            return (
                              <div
                                key={wordKey}
                                onClick={() => w[2] && playWordAudio(w[2], wordKey)}
                                className={`flex flex-col items-center gap-1 px-1.5 py-1 rounded-lg border-b-2 transition-all cursor-pointer ${
                                  isWordPlaying
                                    ? 'bg-[#c9e1c9] border-[#4f9a50] shadow-xs'
                                    : 'border-slate-200/80 hover:bg-emerald-50/60'
                                }`}
                                title="Klik untuk mendengarkan lafadz kata"
                              >
                                {/* Arabic word */}
                                <span
                                  className="font-arabic leading-relaxed whitespace-nowrap text-slate-900"
                                  dir="rtl"
                                  style={{ 
                                    fontSize: `${currentFontSize}px`,
                                    fontFamily: activeFontConfig.css
                                  }}
                                >
                                  {w[0]}
                                </span>

                                {/* Word-by-word meaning (LTR) */}
                                {settings.showWord && (
                                  <span 
                                    className="text-[11px] leading-tight text-slate-500 text-center max-w-[96px] break-words"
                                    dir="ltr"
                                  >
                                    {w[1]}
                                  </span>
                                )}
                              </div>
                            );
                          })}

                          {/* Lingkaran Ayat di Mode Daftar sama seperti Mode Mushaf */}
                          <div 
                            className="inline-flex items-center justify-center self-center cursor-pointer my-1 select-none"
                            onClick={() => setActiveVerseSheet({ surahId, verseNum: v.n })}
                            title={`Menu Ayat ${v.n}`}
                          >
                            <AyahEndCircle
                              num={v.n}
                              isLastRead={isLastRead}
                              bookmarkColor={activeBookmarks.length > 0 ? (COLORS[activeBookmarks[0]] || '#1e88e5') : undefined}
                            />
                          </div>
                        </div>

                        {/* Full Verse Translation */}
                        {settings.showTr && (
                          <p className="text-[13px] leading-relaxed text-slate-700 mt-2 font-normal">
                            {v.t}
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}

              {/* Verses for this Surah: Mushaf / Reading Mode */}
              {settings.mode === 'read' && surahVerses.length > 0 && (
                <div 
                  className="p-4 sm:p-5 text-justify [text-align:justify] [text-justify:inter-word] [text-align-last:center] leading-[2.8] font-arabic text-slate-900 border-b border-slate-100"
                  dir="rtl"
                  style={{ 
                    fontSize: `${currentFontSize + 2}px`,
                    fontFamily: activeFontConfig.css
                  }}
                >
                  {surahVerses.map((v) => {
                    const isVersePlaying = playingInfo?.surahId === surahId && playingInfo?.verseNum === v.n;
                    const arabicText = v.w.map((w) => w[0]).join(' ');
                    const verseKey = `${surahId}:${v.n}`;

                    return (
                      <span
                        key={`mushaf-${verseKey}`}
                        data-surah-id={surahId}
                        data-verse-num={v.n}
                        data-verse-key={verseKey}
                        className={`inline rounded-none px-1 transition-colors border-0 outline-none ring-0 [box-decoration-break:clone] [-webkit-box-decoration-break:clone] ${
                          isVersePlaying ? 'bg-[#bbf7d0] text-slate-950 font-normal' : ''
                        }`}
                      >
                        <span dir="rtl">{arabicText} </span>
                        <span
                          onClick={() => setActiveVerseSheet({ surahId, verseNum: v.n })}
                          className="inline-flex items-center cursor-pointer mx-1 select-none"
                          title={`Menu Ayat ${v.n}`}
                          dir="ltr"
                        >
                          <AyahEndCircle num={v.n} />
                        </span>
                        {' '}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* In-between surahs: subtle divider */}
              <div className="h-6 bg-slate-50/50 border-y border-slate-100 my-2" />
            </section>
          );
        })}

        {/* BOTTOM INFINITE SCROLL SENTINEL */}
        <div ref={bottomSentinelRef} className="py-6 px-4 text-center">
          {isLoadingNextSurah && (
            <div className="flex items-center justify-center gap-2 text-xs text-emerald-800 font-medium py-3">
              <div className="w-5 h-5 rounded-full border-2 border-emerald-300 border-t-emerald-700 animate-spin" />
              <span>Memuat surat berikutnya...</span>
            </div>
          )}
          {maxLoadedSurahId >= 114 && (
            <div className="py-8 text-center text-slate-500 text-xs font-medium space-y-1">
              <p className="font-semibold text-emerald-800 text-sm">صَدَقَ اللَّهُ الْعَظِيمُ</p>
              <p>Telah sampai di akhir Al-Qur'an (QS. An-Nas)</p>
            </div>
          )}
        </div>
      </main>
      )}

      {/* ================= 4. BOTTOM ACTION CONTROL BAR ================= */}
      {/* Display mode button is located here at the bottom */}
      <footer className={`bg-[#4f9a50] text-white flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-lg z-30 transition-all duration-300 ease-in-out ${
        isCleanReading 
          ? 'h-0 py-0 opacity-0 pointer-events-none overflow-hidden' 
          : 'h-14 pb-safe opacity-100'
      }`}>
        {/* Left Action: Font size cycler in WBW mode, or empty spacer in read mode */}
        {settings.mode === 'wbw' ? (
          <button
            type="button"
            onClick={() => {
              const nextIdx = (settings.size + 1) % SIZES.length;
              setSettings((prev) => {
                const next = { ...prev, size: nextIdx };
                saveSettings(next);
                return next;
              });
              showToast(`${t('size')}: ${SIZES[nextIdx]}px`);
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 active:bg-white/30 transition-colors cursor-pointer"
            title={t('arSize')}
          >
            <span className="font-bold text-base">A</span>
            <span className="text-[10px] font-semibold -mt-2">±</span>
          </button>
        ) : (
          <div className="w-10" />
        )}

        {/* Display Mode Switcher (Mode Kata per Kata vs Mode Baca Mushaf Pojok) */}
        <button
          type="button"
          onClick={toggleDisplayMode}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/35 text-white font-medium text-xs transition-all cursor-pointer border border-white/25 shadow-2xs"
          title={settings.mode === 'wbw' ? 'Beralih ke Mode Mushaf Pojok' : 'Beralih ke Mode Kata per Kata'}
        >
          {settings.mode === 'wbw' ? (
            <>
              <BookOpen className="w-4 h-4 text-white" />
              <span>Mushaf Pojok</span>
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 text-white" />
              <span>Mode Per Kata</span>
            </>
          )}
        </button>

        {/* Play / Pause Reciter Audio */}
        <button
          type="button"
          onClick={togglePlay}
          className="flex items-center gap-1.5 px-4 h-9 rounded-full bg-white text-[#4f9a50] font-bold text-xs shadow-md hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
          title={isPlaying ? 'Jeda Audio Murottal' : 'Putar Audio Murottal'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          <span>{isPlaying ? 'Jeda' : 'Murottal'}</span>
        </button>
      </footer>

      {/* ================= TOAST NOTIFICATION ================= */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100070] bg-slate-900/90 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}

      {/* ================= 5. DRAWER / SHEET: DAFTAR 114 SURAH ================= */}
      {isSurahSheetOpen && (
        <div
          className="fixed inset-0 z-[100060] bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in"
          onClick={() => setIsSurahSheetOpen(false)}
        >
          <div
            className="bg-white rounded-t-3xl max-h-[82vh] flex flex-col shadow-2xl border-t border-slate-100 animate-in slide-in-from-bottom duration-250 pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">{t('surahs')}</h3>
              <button
                type="button"
                onClick={() => setIsSurahSheetOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  placeholder={t('search')}
                  value={surahSearchQuery}
                  onChange={(e) => setSurahSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4f9a50]"
                />
              </div>
            </div>

            {/* Surah List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {chapters
                .filter((c) => {
                  if (!surahSearchQuery.trim()) return true;
                  const q = surahSearchQuery.toLowerCase();
                  return (
                    c.name.toLowerCase().includes(q) ||
                    c.tn.toLowerCase().includes(q) ||
                    String(c.id) === q ||
                    c.ar.includes(q)
                  );
                })
                .map((c) => {
                  const isCurrent = activeSurahId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectSurah(c.id)}
                      className={`w-full flex items-center justify-between p-4 text-left transition-colors cursor-pointer ${
                        isCurrent ? 'bg-emerald-50/80 font-bold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                          isCurrent ? 'bg-[#4f9a50] text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {c.id}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                          <p className="text-[11px] text-slate-400 font-normal">
                            {c.place === 'madinah' ? 'Madaniyah' : 'Makkiyah'} • {c.count} {t('ayahs')}
                          </p>
                        </div>
                      </div>

                      {/* Surah Name Calligraphy in Daftar Isi */}
                      <span 
                        className="surah-toc-name shrink-0 ml-3 text-slate-800 text-2xl sm:text-3xl leading-none select-none"
                        style={{
                          fontFamily: isSurahFontLoaded 
                            ? "'surah-name-v4-icon', 'Aref Ruqaa', serif" 
                            : "'Aref Ruqaa', 'Amiri Quran', serif"
                        }}
                        translate="no"
                      >
                        {isSurahFontLoaded ? `surah${pad(c.id, 3)}` : c.ar}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ================= 6. DRAWER / SHEET: MENU AYAT (BOOKMARKS, LAST READ, COPY, PLAY) ================= */}
      {activeVerseSheet && (() => {
        const chapter = chapters.find((c) => c.id === activeVerseSheet.surahId);
        const surahVerses = versesBySurah[activeVerseSheet.surahId] || [];
        const targetV = surahVerses.find((x) => x.n === activeVerseSheet.verseNum);

        // Also search in pageVersesCache
        const pageVerse = Object.values(pageVersesCache)
          .flatMap((p) => p)
          .find((x) => x.surahId === activeVerseSheet.surahId && x.verseNum === activeVerseSheet.verseNum);

        const arabicText = targetV 
          ? targetV.w.map((item) => item[0]).join(' ') 
          : (pageVerse?.arabicText || '');
        const translationText = targetV ? targetV.t : (pageVerse?.translation || '');

        if (!chapter) return null;

        return (
          <div
            className="fixed inset-0 z-[100060] bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in"
            onClick={() => setActiveVerseSheet(null)}
          >
            <div
              className="bg-white rounded-t-3xl max-h-[82vh] flex flex-col shadow-2xl border-t border-slate-100 animate-in slide-in-from-bottom duration-250 p-5 space-y-3 pb-safe"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    QS. {chapter.name} : {t('verse')} {activeVerseSheet.verseNum}
                  </h3>
                  <p className="text-[11px] text-slate-400">Pilihan aksi untuk ayat suci ini</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveVerseSheet(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Translation Preview Box */}
              {translationText && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-100/90 rounded-2xl text-xs text-slate-700 leading-relaxed max-h-32 overflow-y-auto">
                  <p className="font-semibold text-emerald-900 mb-1 text-[11px] flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Terjemahan Kemenag RI:</span>
                  </p>
                  <p className="italic font-normal text-slate-700">"{translationText}"</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-1 pt-1">
                {/* Bookmarks */}
                {['blue', 'red', 'green'].map((colorKey) => {
                  const verseKey = `${activeVerseSheet.surahId}:${activeVerseSheet.verseNum}`;
                  const hasColor = (settings.bm[verseKey] || []).includes(colorKey);

                  return (
                    <button
                      key={colorKey}
                      type="button"
                      onClick={() => toggleBookmark(activeVerseSheet.surahId, activeVerseSheet.verseNum, colorKey)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-xs font-semibold text-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <Bookmark className="w-4 h-4 fill-current" style={{ color: COLORS[colorKey] }} />
                        <span>{t('bm')} ({colorKey === 'blue' ? t('bmBlue') : colorKey === 'red' ? t('bmRed') : t('bmGreen')})</span>
                      </div>
                      {hasColor && <Check className="w-4 h-4 text-[#4f9a50]" />}
                    </button>
                  );
                })}

                {/* Mark Last Read */}
                <button
                  type="button"
                  onClick={() => markLastRead(activeVerseSheet.surahId, activeVerseSheet.verseNum)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-xs font-semibold text-slate-700"
                >
                  <Clock className="w-4 h-4 text-[#2e9e45]" />
                  <span>{t('last')}</span>
                </button>

                {/* Copy Verse */}
                <button
                  type="button"
                  onClick={() => copyVerseText(arabicText, translationText, chapter, activeVerseSheet.verseNum)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-xs font-semibold text-slate-700"
                >
                  <Copy className="w-4 h-4 text-slate-600" />
                  <span>{t('copy')} (Arab + Terjemahan)</span>
                </button>

                {/* Play from this verse */}
                <button
                  type="button"
                  onClick={() => {
                    const sId = activeVerseSheet.surahId;
                    const vNum = activeVerseSheet.verseNum;
                    setActiveVerseSheet(null);
                    playVerse(sId, vNum);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-xs font-semibold text-slate-700"
                >
                  <Play className="w-4 h-4 text-slate-600 fill-current" />
                  <span>{t('play')}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ================= 7. DRAWER / SHEET: PENGATURAN AL-QUR'AN ================= */}
      {isSettingsSheetOpen && (
        <div
          className="fixed inset-0 z-[100060] bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in"
          onClick={() => setIsSettingsSheetOpen(false)}
        >
          <div
            className="bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto flex flex-col shadow-2xl border-t border-slate-100 animate-in slide-in-from-bottom duration-250 p-5 space-y-4 pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">{t('settings')}</h3>
              <button
                type="button"
                onClick={() => setIsSettingsSheetOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Banner Info */}
            <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-3.5 text-xs text-emerald-950 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                  <BookOpen className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Mode: {settings.mode === 'read' ? 'Mushaf Pojok Digital (604 Hal.)' : 'Kata per Kata'}</span>
                </div>
                <button
                  type="button"
                  onClick={toggleDisplayMode}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 transition-colors cursor-pointer shadow-2xs"
                >
                  Ganti Mode
                </button>
              </div>
              <p className="text-[11px] text-emerald-800/80 leading-relaxed">
                {settings.mode === 'read'
                  ? "Format teks digital baku per halaman 1-604 (titik awal & akhir ayat presisi seperti Qur'an Pojok). Sentuh/klik ayat manapun untuk memunculkan menu ayat."
                  : 'Menampilkan ayat suci beserta tafsir per kata dan terjemahan lengkap Kemenag RI.'}
              </p>
            </div>

            {/* Live Arabic Font Size Preview */}
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 text-center">
                  <div className="flex items-center justify-between mb-1 px-0.5">
                    <p className="text-[11px] text-slate-400 font-semibold">Pratinjau Font Arab ({currentFontSize}px)</p>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                      {activeFontConfig.name}
                    </span>
                  </div>
                  <div 
                    className="font-arabic text-slate-900 leading-relaxed text-center py-1"
                    dir="rtl"
                    style={{ 
                      fontSize: `${currentFontSize}px`,
                      fontFamily: activeFontConfig.css
                    }}
                  >
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                  </div>
                </div>

                {/* Slider Font Size */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{t('arSize')}</span>
                    <span>{currentFontSize} px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={SIZES.length - 1}
                    step="1"
                    value={settings.size}
                    onChange={(e) => {
                      const idx = parseInt(e.target.value, 10);
                      setSettings((prev) => {
                        const next = { ...prev, size: idx };
                        saveSettings(next);
                        return next;
                      });
                    }}
                    className="w-full accent-[#4f9a50]"
                  />
                </div>

                {/* Pilihan Jenis Font Al-Qur'an */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Pilihan Huruf / Font Al-Qur'an</span>
                    <span className="text-[10px] text-emerald-600 font-medium">Standar Kemenag</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {QURAN_FONTS.map((font) => {
                      const isSelected = (settings.fontFamily || 'lpmq') === font.id;
                      return (
                        <button
                          key={font.id}
                          type="button"
                          onClick={() => {
                            setSettings((prev) => {
                              const next = { ...prev, fontFamily: font.id };
                              saveSettings(next);
                              return next;
                            });
                            showToast(`Font diubah ke ${font.name}`);
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50/80 border-emerald-500 shadow-xs ring-1 ring-emerald-500/30'
                              : 'bg-white border-slate-200/90 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-[#4f9a50] bg-[#4f9a50]' : 'border-slate-300'
                            }`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-800">{font.name}</span>
                                {font.badge && (
                                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    {font.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{font.subtitle}</p>
                            </div>
                          </div>
                          <span 
                            className="text-base font-arabic text-slate-800 pl-2 shrink-0 select-none"
                            dir="rtl"
                            style={{ fontFamily: font.css }}
                          >
                            ٱلْقُرْءَانُ
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

            {/* Toggles */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="flex items-center justify-between text-xs font-semibold text-slate-700 cursor-pointer">
                <span>{t('showTr')}</span>
                <input
                  type="checkbox"
                  checked={settings.showTr}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setSettings((prev) => {
                      const next = { ...prev, showTr: val };
                      saveSettings(next);
                      return next;
                    });
                  }}
                  className="w-4 h-4 accent-[#4f9a50] rounded"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-semibold text-slate-700 cursor-pointer">
                <span>{t('showWord')}</span>
                <input
                  type="checkbox"
                  checked={settings.showWord}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setSettings((prev) => {
                      const next = { ...prev, showWord: val };
                      saveSettings(next);
                      return next;
                    });
                  }}
                  className="w-4 h-4 accent-[#4f9a50] rounded"
                />
              </label>

              {/* Language Switch */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-semibold text-slate-700">{t('lang')}</span>
                <div className="flex border border-slate-200 rounded-xl overflow-hidden p-0.5 bg-slate-100 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setSettings((prev) => {
                        const next = { ...prev, lang: 'id' as const };
                        saveSettings(next);
                        return next;
                      });
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      settings.lang === 'id' ? 'bg-[#4f9a50] text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Indonesia
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSettings((prev) => {
                        const next = { ...prev, lang: 'en' as const };
                        saveSettings(next);
                        return next;
                      });
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      settings.lang === 'en' ? 'bg-[#4f9a50] text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 8. MODAL LOMPAT KE HALAMAN / JUZ (MUSHAF POJOK) ================= */}
      {isJumpModalOpen && (
        <div 
          className="fixed inset-0 z-[100065] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsJumpModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-sm max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-800">Lompat Halaman / Juz</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsJumpModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-2 p-1.5 mx-4 mt-3 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setJumpModalTab('page')}
                className={`py-1.5 rounded-lg transition-all ${
                  jumpModalTab === 'page' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Nomor Halaman (1-604)
              </button>
              <button
                type="button"
                onClick={() => setJumpModalTab('juz')}
                className={`py-1.5 rounded-lg transition-all ${
                  jumpModalTab === 'juz' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Daftar Juz (1-30)
              </button>
            </div>

            {/* Tab 1: Input Page & Slider & Presets */}
            {jumpModalTab === 'page' && (
              <div className="p-5 space-y-4 overflow-y-auto">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const num = parseInt(jumpPageInput, 10);
                    if (!isNaN(num) && num >= 1 && num <= 604) {
                      goToPage(num);
                      setIsJumpModalOpen(false);
                      setJumpPageInput('');
                    } else {
                      showToast('Masukkan halaman antara 1 s/d 604');
                    }
                  }}
                  className="space-y-3"
                >
                  <label className="block text-xs font-semibold text-slate-600">
                    Ketik Nomor Halaman (1 - 604):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="604"
                      autoFocus
                      placeholder={`Contoh: ${curPage}`}
                      value={jumpPageInput}
                      onChange={(e) => setJumpPageInput(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-center text-lg text-slate-800"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md hover:bg-emerald-700 transition-colors cursor-pointer"
                    >
                      Buka
                    </button>
                  </div>
                </form>

                {/* Slider */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>Geser Cepat Halaman:</span>
                    <span className="text-emerald-700 font-bold">Hal. {curPage} / 604</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="604"
                    dir="rtl"
                    value={curPage}
                    onChange={(e) => goToPage(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                {/* Popular Shortcuts */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Pilihan Populer
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { name: 'Al-Fatihah', p: 1 },
                      { name: 'Al-Baqarah', p: 2 },
                      { name: 'Al-Kahf', p: 293 },
                      { name: 'Ya-Sin', p: 440 },
                      { name: 'Al-Waqi\'ah', p: 534 },
                      { name: 'Al-Mulk', p: 562 },
                      { name: 'Juz 30 (An-Naba)', p: 582 },
                      { name: 'Al-Ikhlas', p: 604 }
                    ].map((item) => (
                      <button
                        key={item.p}
                        type="button"
                        onClick={() => {
                          goToPage(item.p);
                          setIsJumpModalOpen(false);
                        }}
                        className={`px-3 py-2 rounded-xl text-left text-xs font-medium border transition-colors flex items-center justify-between cursor-pointer ${
                          curPage === item.p ? 'bg-emerald-50 border-emerald-400 text-emerald-800' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="truncate">{item.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Hal. {item.p}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Grid of 30 Juzs */}
            {jumpModalTab === 'juz' && (
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-3 gap-2">
                  {JUZ_START_PAGES.map((startPage, index) => {
                    const juzNum = index + 1;
                    const isCurrent = getJuzFromPage(curPage) === juzNum;
                    return (
                      <button
                        key={`juz-btn-${juzNum}`}
                        type="button"
                        onClick={() => {
                          goToPage(startPage);
                          setIsJumpModalOpen(false);
                          showToast(`Membuka Juz ${juzNum} (Hal. ${startPage})`);
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-bold ring-2 ring-emerald-300'
                            : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        <div className="text-xs font-bold">Juz {juzNum}</div>
                        <div className={`text-[10px] mt-0.5 ${isCurrent ? 'text-emerald-100' : 'text-slate-400'}`}>
                          Hal. {startPage}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
