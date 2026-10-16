import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ArrowLeft, 
  BookOpen, 
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
  Share2,
  Languages,
  WholeWord,
  Trash2,
  ArrowRight,
  ListOrdered
} from 'lucide-react';
import { useBackHandler } from '../utils/navigationHistory';
import { BismillahCalligraphy } from './BismillahCalligraphy';
import { LPMQ_AYAH_CIRCLE_PATH } from './lpmqAyahCirclePath';

const API = 'https://api.quran.com/api/v4';
const TRANSLATION_ID: Record<string, number> = { en: 20, id: 33 }; // 33 = Kemenag RI, 20 = Saheeh Int
const AUDIO_VERSE = 'https://verses.quran.com/Alafasy/mp3/';
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

export const JUZ_START_VERSES: [number, number][] = [
  [1, 1],   // Juz 1: QS. Al-Fatihah 1
  [2, 142], // Juz 2: QS. Al-Baqarah 142
  [2, 253], // Juz 3: QS. Al-Baqarah 253
  [3, 93],  // Juz 4: QS. Ali 'Imran 93
  [4, 24],  // Juz 5: QS. An-Nisa 24
  [4, 148], // Juz 6: QS. An-Nisa 148
  [5, 82],  // Juz 7: QS. Al-Ma'idah 82
  [6, 111], // Juz 8: QS. Al-An'am 111
  [7, 88],  // Juz 9: QS. Al-A'raf 88
  [8, 41],  // Juz 10: QS. Al-Anfal 41
  [9, 93],  // Juz 11: QS. At-Tawbah 93
  [11, 6],  // Juz 12: QS. Hud 6
  [12, 53], // Juz 13: QS. Yusuf 53
  [15, 1],  // Juz 14: QS. Al-Hijr 1
  [17, 1],  // Juz 15: QS. Al-Isra 1
  [18, 75], // Juz 16: QS. Al-Kahf 75
  [21, 1],  // Juz 17: QS. Al-Anbiya 1
  [23, 1],  // Juz 18: QS. Al-Mu'minun 1
  [25, 21], // Juz 19: QS. Al-Furqan 21
  [27, 56], // Juz 20: QS. An-Naml 56
  [29, 46], // Juz 21: QS. Al-'Ankabut 46
  [33, 31], // Juz 22: QS. Al-Ahzab 31
  [36, 28], // Juz 23: QS. Ya-Sin 28
  [39, 32], // Juz 24: QS. Az-Zumar 32
  [41, 47], // Juz 25: QS. Fussilat 47
  [46, 1],  // Juz 26: QS. Al-Ahqaf 1
  [51, 31], // Juz 27: QS. Adh-Dhariyat 31
  [58, 1],  // Juz 28: QS. Al-Mujadila 1
  [67, 1],  // Juz 29: QS. Al-Mulk 1
  [78, 1]   // Juz 30: QS. An-Naba 1
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
  fontSize?: number;
  isLastRead?: boolean;
  isBookmarked?: boolean;
  bookmarkColor?: string;
  className?: string;
}> = ({ num, fontSize, isLastRead, isBookmarked, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center justify-center relative select-none shrink-0 whitespace-nowrap mx-1 align-baseline ${className}`}
      dir="rtl"
      style={{ 
        width: '1.24em',
        height: '1.24em',
        verticalAlign: '-0.52em',
        lineHeight: 1,
        unicodeBidi: 'isolate',
        ...(fontSize ? { fontSize: `${fontSize}px` } : {})
      }}
      role="img"
      aria-label={`Ayat ${num}`}
    >
      {/* Authentic U+06DD End of Ayah Rosette Medallion with font LPMQ Isep Misbah */}
      <svg 
        viewBox="0 0 2000 2000" 
        className="w-full h-full text-amber-950/85 pointer-events-none select-none overflow-visible"
        aria-hidden="true"
      >
        <use href="#lpmq-ayah-circle-glyph" fill="currentColor" />
      </svg>

      {/* Centered Arabic Numeral strictly inside the middle of the LPMQ circle */}
      <span
        className="absolute inset-0 flex items-center justify-center font-bold text-slate-950 pointer-events-none select-none"
        style={{
          fontFamily: "'LPMQ Isep Misbah', sans-serif",
          fontSize: num > 99 ? '0.38em' : num > 9 ? '0.46em' : '0.52em',
          lineHeight: 1,
          transform: 'translateY(0.01em)',
        }}
      >
        {arDigits(num)}
      </span>

      {/* Small Bookmark Icon badge above the circle */}
      {isBookmarked && (
        <span
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center pointer-events-none"
          title="Ayat Ditandai"
        >
          <Bookmark className="w-3.5 h-3.5 fill-amber-500 text-amber-600 drop-shadow-xs" />
        </span>
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
  activeVerseSheet?: { surahId: number; verseNum: number } | null;
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
  activeVerseSheet,
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
                <div className="pt-1 pb-2 select-none px-1 w-full">
                  <div className="banner select-none my-1 w-full">
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
                    <div 
                      className={`py-1 my-1 transition-all rounded-none ${
                        playingInfo?.surahId === section.surahId && playingInfo?.verseNum === 0
                          ? 'bg-[#bbf7d0]/80 border border-dashed border-emerald-500'
                          : ''
                      }`}
                      data-verse-key={`${section.surahId}:0`}
                    >
                      <BismillahCalligraphy />
                    </div>
                  )}
                </div>
              )}

              {/* Verses Flow in Mushaf Mode */}
              {settings.showWord ? (
                /* Mode Mushaf dengan Tampilan Terjemah Per Kata (Tetap Justify & Baris Bawah Rata Kanan, Center Tengah Seperti Mode Daftar) */
                <div 
                  className="font-arabic text-slate-900 quran-mushaf-page-text leading-normal tracking-normal quran-interactive-text select-none px-1" 
                  dir="rtl"
                  onContextMenu={(e) => e.preventDefault()}
                  style={{ 
                    fontSize: `${currentFontSize}px`,
                    fontFamily: activeFontConfig.css,
                    direction: 'rtl',
                    textAlign: 'justify',
                    textJustify: 'inter-word',
                    textAlignLast: 'right',
                  }}
                >
                  {section.verses.map((v) => {
                    const isVersePlaying = playingInfo?.surahId === v.surahId && playingInfo?.verseNum === v.verseNum;
                    const isSelected = Boolean(activeVerseSheet && selectedVerseKey === v.verseKey);
                    const isLastRead = settings.lr?.s === v.surahId && settings.lr?.v === v.verseNum;
                    const isBookmarked = Boolean(settings.bm[v.verseKey]?.length);

                    return (
                      <span 
                        key={`mushaf-wbw-${page}-${v.verseKey}`}
                        data-verse-key={v.verseKey}
                        dir="rtl"
                        onClick={isInteractive ? onVerseClick : undefined}
                        onContextMenu={isInteractive && onVerseContextMenu ? (e) => onVerseContextMenu(v.surahId, v.verseNum, v.verseKey, e) : undefined}
                        onTouchStart={isInteractive && onVerseTouchStart ? (e) => onVerseTouchStart(v.surahId, v.verseNum, v.verseKey, e) : undefined}
                        onTouchMove={isInteractive && onVerseTouchMove ? onVerseTouchMove : undefined}
                        onTouchEnd={isInteractive && onVerseTouchEnd ? onVerseTouchEnd : undefined}
                        onTouchCancel={isInteractive && onVerseTouchEnd ? onVerseTouchEnd : undefined}
                        onMouseDown={isInteractive && onVerseMouseDown ? (e) => onVerseMouseDown(v.surahId, v.verseNum, v.verseKey, e) : undefined}
                        onMouseMove={isInteractive && onVerseMouseMove ? onVerseMouseMove : undefined}
                        onMouseUp={isInteractive && onVerseMouseUp ? onVerseMouseUp : undefined}
                        className={`inline transition-all rounded-none py-1 px-1 my-0.5 [box-decoration-break:clone] [-webkit-box-decoration-break:clone] ${
                          isInteractive ? 'cursor-pointer' : 'cursor-default pointer-events-none'
                        } ${
                          isVersePlaying
                            ? 'bg-[#bbf7d0]/80 border border-emerald-400'
                            : isSelected
                            ? 'bg-[#fef08a] border border-dashed border-amber-500'
                            : isLastRead
                            ? 'bg-[#dcfce7]/90 border border-dashed border-emerald-500'
                            : 'border border-transparent'
                        }`}
                      >
                        {v.words.map((w, wIdx) => {
                          const wordKey = `${v.surahId}:${v.verseNum}:${wIdx}`;

                          return (
                            <React.Fragment key={wordKey}>
                              <span
                                className="quran-wbw-word-card inline-flex flex-col items-center justify-start gap-1 bg-transparent border-0 shadow-none my-1 mx-0.5 align-top text-center"
                                style={{
                                  textAlign: 'center',
                                  textAlignLast: 'center',
                                }}
                              >
                                {/* Arabic word - sejajar lurus */}
                                <span
                                  className="font-arabic leading-tight whitespace-nowrap text-slate-900 text-center flex items-center justify-center min-h-[1.5em]"
                                  dir="rtl"
                                  style={{ 
                                    fontSize: `${currentFontSize}px`,
                                    fontFamily: activeFontConfig.css,
                                    textAlign: 'center',
                                    textAlignLast: 'center',
                                  }}
                                >
                                  {w[0]}
                                </span>

                                {/* Word-by-word meaning (LTR) - center vertical & center horizontal if multiple lines */}
                                <span 
                                  className="quran-wbw-word-meaning text-[11px] leading-tight text-slate-600 text-center w-full max-w-[96px] min-h-[28px] break-words font-medium flex items-center justify-center self-center"
                                  dir="ltr"
                                  style={{ 
                                    textAlign: 'center',
                                    textAlignLast: 'center',
                                    textJustify: 'none',
                                    wordBreak: 'normal',
                                    overflowWrap: 'break-word',
                                  }}
                                >
                                  {w[1]}
                                </span>
                              </span>
                              {' '}
                            </React.Fragment>
                          );
                        })}

                        {/* Medallion Nomor Ayat - Hanya keluar opsi jika diklik lama, klik biasa tidak memunculkan opsi */}
                        <span 
                          className="inline-flex items-center justify-center align-middle my-1 mx-0.5 cursor-pointer select-none"
                          onTouchStart={(e) => isInteractive && onVerseTouchStart && onVerseTouchStart(v.surahId, v.verseNum, v.verseKey, e)}
                          onTouchMove={isInteractive && onVerseTouchMove ? onVerseTouchMove : undefined}
                          onTouchEnd={isInteractive && onVerseTouchEnd ? onVerseTouchEnd : undefined}
                          onTouchCancel={isInteractive && onVerseTouchEnd ? onVerseTouchEnd : undefined}
                          onMouseDown={(e) => isInteractive && onVerseMouseDown && onVerseMouseDown(v.surahId, v.verseNum, v.verseKey, e)}
                          onMouseMove={isInteractive && onVerseMouseMove ? onVerseMouseMove : undefined}
                          onMouseUp={isInteractive && onVerseMouseUp ? onVerseMouseUp : undefined}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (isInteractive && onVerseContextMenu) {
                              onVerseContextMenu(v.surahId, v.verseNum, v.verseKey, e);
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isInteractive && onVerseClick) {
                              onVerseClick(e);
                            }
                          }}
                          title={`Ayat ${v.verseNum} • Sentuh lama untuk opsi ayat`}
                        >
                          <AyahEndCircle 
                            num={v.verseNum} 
                            fontSize={currentFontSize} 
                            isLastRead={isLastRead}
                            isBookmarked={isBookmarked}
                          />
                        </span>
                        {' '}
                      </span>
                    );
                  })}
                </div>
              ) : (
                /* Verses in Digital Arabic Text - Justify with last line aligned to right */
                <div 
                  className="font-arabic text-slate-900 quran-mushaf-page-text leading-[2.6] sm:leading-[2.85] tracking-normal quran-interactive-text select-none px-1"
                  dir="rtl"
                  onContextMenu={(e) => e.preventDefault()}
                  style={{ 
                    fontSize: `${currentFontSize}px`,
                    fontFamily: activeFontConfig.css,
                    direction: 'rtl',
                    textAlign: 'justify',
                    textAlignLast: 'right',
                  }}
                >
                  {section.verses.map((v) => {
                    const isVersePlaying = playingInfo?.surahId === v.surahId && playingInfo?.verseNum === v.verseNum;
                    const isSelected = Boolean(activeVerseSheet && selectedVerseKey === v.verseKey);
                    const isLastRead = settings.lr?.s === v.surahId && settings.lr?.v === v.verseNum;
                    const isBookmarked = Boolean(settings.bm[v.verseKey]?.length);

                    return (
                      <span
                        key={`mushaf-${page}-${v.verseKey}`}
                        data-verse-key={v.verseKey}
                        dir="rtl"
                        style={{ unicodeBidi: 'isolate' }}
                        onClick={isInteractive ? onVerseClick : undefined}
                        onContextMenu={isInteractive && onVerseContextMenu ? (e) => onVerseContextMenu(v.surahId, v.verseNum, v.verseKey, e) : undefined}
                        onTouchStart={isInteractive && onVerseTouchStart ? (e) => onVerseTouchStart(v.surahId, v.verseNum, v.verseKey, e) : undefined}
                        onTouchMove={isInteractive && onVerseTouchMove ? onVerseTouchMove : undefined}
                        onTouchEnd={isInteractive && onVerseTouchEnd ? onVerseTouchEnd : undefined}
                        onTouchCancel={isInteractive && onVerseTouchEnd ? onVerseTouchEnd : undefined}
                        onMouseDown={isInteractive && onVerseMouseDown ? (e) => onVerseMouseDown(v.surahId, v.verseNum, v.verseKey, e) : undefined}
                        onMouseMove={isInteractive && onVerseMouseMove ? onVerseMouseMove : undefined}
                        onMouseUp={isInteractive && onVerseMouseUp ? onVerseMouseUp : undefined}
                        className={`inline rounded-none px-1 py-0.5 mx-0 transition-colors duration-150 ${isInteractive ? 'cursor-pointer' : 'cursor-default pointer-events-none'} select-none quran-interactive-text outline-none ring-0 [box-decoration-break:clone] [-webkit-box-decoration-break:clone] ${
                          isVersePlaying
                            ? 'bg-[#bbf7d0] text-slate-950 font-normal border border-emerald-400'
                            : isSelected
                            ? 'bg-[#fef08a] border border-dashed border-amber-500 text-slate-950 font-normal'
                            : isLastRead
                            ? 'bg-[#dcfce7]/90 border border-dashed border-emerald-500 text-slate-950'
                            : 'hover:bg-yellow-100/40 text-slate-900 border border-transparent'
                        }`}
                        title={isInteractive ? `QS. ${section.chapter?.name || v.surahId} : ${v.verseNum} • Sentuh lama untuk opsi ayat` : undefined}
                      >
                        <span dir="rtl">{v.arabicText}</span>
                        <AyahEndCircle
                          num={v.verseNum}
                          fontSize={currentFontSize}
                          isLastRead={isLastRead}
                          isBookmarked={isBookmarked}
                        />
                        {' '}
                      </span>
                    );
                  })}
                </div>
              )}

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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sheets & Views state
  const [isSurahSheetOpen, setIsSurahSheetOpen] = useState(false);
  const [isBookmarksViewOpen, setIsBookmarksViewOpen] = useState(false);
  const [bookmarkSearchQuery, setBookmarkSearchQuery] = useState('');
  const [bookmarkedVersesData, setBookmarkedVersesData] = useState<Record<string, { arabic: string; trans: string; page: number; juz: number }>>({});
  const [isFontSizeSliderOpen, setIsFontSizeSliderOpen] = useState(false);
  const [confirmLastReadData, setConfirmLastReadData] = useState<{ surahId: number; verseNum: number } | null>(null);
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
  const curPageRef = useRef<number>(curPage);
  useEffect(() => {
    curPageRef.current = curPage;
  }, [curPage]);
  const playVerseRef = useRef<(surahId: number, num: number) => void>(() => {});
  const [isPageLoading, setIsPageLoading] = useState(false);

  // Screen State: Tampilan Awal (Index/Beranda) vs Mode Bacaan
  const [isReadingActive, setIsReadingActive] = useState<boolean>(() => Boolean(initialSurah));
  const [homeSurahSearch, setHomeSurahSearch] = useState<string>('');
  const [isHomeJuzModalOpen, setIsHomeJuzModalOpen] = useState<boolean>(false);
  const [homeJuzInput, setHomeJuzInput] = useState<string>('');

  // Fullscreen Surah Picker from Go To Modal
  const [isFullscreenSurahPickerOpen, setIsFullscreenSurahPickerOpen] = useState<boolean>(false);
  const [fullscreenSurahSearch, setFullscreenSurahSearch] = useState<string>('');

  const [isJumpModalOpen, setIsJumpModalOpen] = useState(false);
  const [jumpPageInput, setJumpPageInput] = useState<string>('');
  const [jumpJuzInput, setJumpJuzInput] = useState<string>('');
  const [jumpModalTab, setJumpModalTab] = useState<'surah' | 'juz' | 'page'>('surah');
  const [selectedJumpSurahId, setSelectedJumpSurahId] = useState<number>(1);
  const [selectedJumpJuz, setSelectedJumpJuz] = useState<number>(1);
  const [jumpAyahInput, setJumpAyahInput] = useState<string>('');
  const [surahPickerSearch, setSurahPickerSearch] = useState<string>('');
  const [isSurahPickerOpen, setIsSurahPickerOpen] = useState<boolean>(false);
  const surahPickerRef = useRef<HTMLDivElement | null>(null);
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
  const activePageScrollerRef = useRef<HTMLDivElement | null>(null);
  const nextPageScrollerRef = useRef<HTMLDivElement | null>(null);
  const prevPageScrollerRef = useRef<HTMLDivElement | null>(null);

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
    curPageRef.current = safeTarget;
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

    // Reset posisi scroll halaman ke paling atas sedari awal
    if (activePageScrollerRef.current) {
      activePageScrollerRef.current.scrollTop = 0;
    }
  }, [curPage, fetchPageVerses]);

  // Target page when auto-flipping with slide animation
  const [animatingTargetPage, setAnimatingTargetPage] = useState<number | null>(null);

  // Smooth sliding transition to target page (auto-geser halaman saat audio berganti)
  const slideToPage = useCallback((targetPage: number) => {
    const currentP = curPageRef.current;
    const safeTarget = Math.max(1, Math.min(604, targetPage));
    if (safeTarget === currentP) return;

    fetchPageVerses(safeTarget);
    setAnimatingTargetPage(safeTarget);

    const containerWidth = pageContainerRef.current?.clientWidth || window.innerWidth || 360;
    // In RTL Mushaf: next page (higher number) is to the right (dragOffset > 0), previous page is to the left (dragOffset < 0)
    const isNext = safeTarget > currentP;
    const targetOffset = isNext ? containerWidth : -containerWidth;

    setIsAnimatingPage(true);
    setDragOffset(targetOffset);
    dragOffsetRef.current = targetOffset;

    setTimeout(() => {
      goToPage(safeTarget);
      setIsAnimatingPage(false);
      setDragOffset(0);
      dragOffsetRef.current = 0;
      setAnimatingTargetPage(null);
    }, 280);
  }, [goToPage, fetchPageVerses]);

  // Pastikan posisi scroll halaman mushaf selalu mulai dari paling atas saat halaman berganti
  useEffect(() => {
    if (activePageScrollerRef.current) {
      activePageScrollerRef.current.scrollTop = 0;
    }
  }, [curPage]);

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

    if (currentOffset > threshold && curPage < 604) {
      // Dragged to the RIGHT past threshold -> Slide over to Next Page (curPage + 1) in RTL Mushaf (Hal. 1 kanan -> Hal. 2 kiri)
      setIsAnimatingPage(true);
      setDragOffset(containerWidth);
      dragOffsetRef.current = containerWidth;
      setTimeout(() => {
        goToPage(curPage + 1);
        setIsAnimatingPage(false);
        setDragOffset(0);
        dragOffsetRef.current = 0;
      }, 260);
    } else if (currentOffset < -threshold && curPage > 1) {
      // Dragged to the LEFT past threshold -> Slide over to Prev Page (curPage - 1) in RTL Mushaf (Hal. 2 kiri -> Hal. 1 kanan)
      setIsAnimatingPage(true);
      setDragOffset(-containerWidth);
      dragOffsetRef.current = -containerWidth;
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
      if (curPage >= 604 && dx > 0) {
        // Halaman 604 berada paling kiri, tahan geser ke kanan
        adjustedDx = dx * 0.22;
      } else if (curPage <= 1 && dx < 0) {
        // Halaman 1 berada paling kanan, tahan geser ke kiri
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
      if (curPage >= 604 && dx > 0) {
        adjustedDx = dx * 0.22;
      } else if (curPage <= 1 && dx < 0) {
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

  // Close verse options sheet & un-highlight selected verse
  const closeVerseSheet = useCallback(() => {
    setActiveVerseSheet(null);
    setSelectedVerseKey(null);
  }, []);

  // Stop audio and pause mediaSession
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'paused';
      } catch (_) {}
    }
    setPlayingInfo(null);
  }, []);

  // Back handlers for sheets, modals, and screens
  useBackHandler(Boolean(isOpen && isFullscreenSurahPickerOpen), 'quran-fullscreen-surah-picker', () => setIsFullscreenSurahPickerOpen(false));
  useBackHandler(Boolean(isOpen && isHomeJuzModalOpen), 'quran-home-juz-modal', () => setIsHomeJuzModalOpen(false));
  useBackHandler(Boolean(isOpen && isBookmarksViewOpen), 'quran-bookmarks-view', () => setIsBookmarksViewOpen(false));
  useBackHandler(Boolean(isOpen && isJumpModalOpen && !isFullscreenSurahPickerOpen), 'quran-jump-modal', () => setIsJumpModalOpen(false));
  useBackHandler(Boolean(isOpen && isSurahSheetOpen), 'quran-surah-sheet', () => setIsSurahSheetOpen(false));
  useBackHandler(Boolean(isOpen && isFontSizeSliderOpen), 'quran-font-size-slider', () => setIsFontSizeSliderOpen(false));
  useBackHandler(Boolean(isOpen && confirmLastReadData !== null), 'quran-confirm-last-read', () => setConfirmLastReadData(null));
  useBackHandler(Boolean(isOpen && activeVerseSheet !== null), 'quran-verse-sheet', closeVerseSheet);
  useBackHandler(
    Boolean(
      isOpen &&
      isReadingActive &&
      !isBookmarksViewOpen &&
      !isJumpModalOpen &&
      !isSurahSheetOpen &&
      !isFontSizeSliderOpen &&
      confirmLastReadData === null &&
      activeVerseSheet === null &&
      !isFullscreenSurahPickerOpen &&
      !isHomeJuzModalOpen
    ),
    'quran-reading-view',
    () => {
      stopAudio();
      setIsReadingActive(false);
    }
  );
  useBackHandler(
    Boolean(
      isOpen &&
      !isReadingActive &&
      !isBookmarksViewOpen &&
      !isHomeJuzModalOpen &&
      !isFontSizeSliderOpen
    ),
    'quran-main-page',
    () => {
      stopAudio();
      onClose();
    }
  );

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
      setIsReadingActive(true);
    }
  }, [initialSurah, isOpen]);

  // Fetch current page verses and preload adjacent pages for smooth instant page flipping
  useEffect(() => {
    if (!isOpen || settings.mode !== 'read') return;
    fetchPageVerses(curPage);
    if (curPage + 1 <= 604) fetchPageVerses(curPage + 1);
    if (curPage - 1 >= 1) fetchPageVerses(curPage - 1);
  }, [isOpen, curPage, settings.mode, fetchPageVerses]);

  // Target verse to scroll to (for resuming last read)
  const [targetScrollVerse, setTargetScrollVerse] = useState<{ s: number; v: number; instant?: boolean } | null>(() => {
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

  // Auto scroll to target verse (last read / mode switch)
  useEffect(() => {
    if (targetScrollVerse && !isLoadingInitial && versesBySurah[targetScrollVerse.s]) {
      const { s, v, instant } = targetScrollVerse;
      setTargetScrollVerse(null);
      const timer = window.setTimeout(() => {
        const el = scrollerRef.current?.querySelector(`[data-verse-key="${s}:${v}"]`);
        if (el) {
          el.scrollIntoView({ behavior: instant ? 'instant' : 'smooth', block: 'center' });
          if (!instant) {
            showToast(`Melanjutkan ayat terakhir dibaca: QS. ${s} Ayat ${v}`);
          }
        }
      }, instant ? 10 : 350);
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

    const isBismillah = num === 0;

    // Safety: Surah 9 (At-Tawbah) has no Bismillah; in Surah 1, Ayah 1 is already Bismillah
    if (isBismillah && (surahId === 9 || surahId === 1)) {
      playVerse(surahId, 1);
      return;
    }

    setPlayingInfo({ surahId, verseNum: num });

    // Audio URL: for Bismillah, use Surah 1 Ayah 1 (001001.mp3)
    const surahPadded = isBismillah ? '001' : pad(surahId, 3);
    const versePadded = isBismillah ? '001' : pad(num, 3);
    const audioUrl = `${AUDIO_VERSE}${surahPadded}${versePadded}.mp3`;

    // Reuse persistent audio element so background tab / lock screen playback continues uninterrupted
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio();
      audioRef.current = audio;
    } else {
      audio.pause();
    }

    audio.src = audioUrl;
    audio.preload = 'auto';

    audio.onended = () => {
      if (isBismillah) {
        // After Bismillah finishes, play Ayah 1
        playVerseRef.current(surahId, 1);
      } else if (num < chapter.count) {
        // Next verse in same surah
        playVerseRef.current(surahId, num + 1);
      } else if (surahId < 114) {
        // Automatically progress to next surah
        const nextSurahId = surahId + 1;
        setLoadedSurahIds((prev) => (prev.includes(nextSurahId) ? prev : [...prev, nextSurahId]));
        if (nextSurahId !== 9 && nextSurahId !== 1) {
          playVerseRef.current(nextSurahId, 0); // Play Bismillah for next surah
        } else {
          playVerseRef.current(nextSurahId, 1);
        }
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

    // MediaSession for background lock-screen controls & preventing sleep
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: isBismillah
            ? `Bismillah - ${chapter.name}`
            : `${chapter.name} : Ayat ${num}`,
          artist: 'Misyari Rasyid Al-Afasy',
          album: "Al-Qur'an Al-Karim (Ponpes Attaroqqy)",
          artwork: [
            { src: '/src/assets/images/logo_ponpes_attaroqqy_1790648746461.jpg', sizes: '192x192', type: 'image/jpeg' },
            { src: '/src/assets/images/logo_ponpes_attaroqqy_1790648746461.jpg', sizes: '512x512', type: 'image/jpeg' },
          ],
        });
        navigator.mediaSession.playbackState = 'playing';

        navigator.mediaSession.setActionHandler('play', () => {
          audioRef.current?.play().catch(() => {});
          if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          audioRef.current?.pause();
          if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
        });
        navigator.mediaSession.setActionHandler('stop', () => {
          stopAudio();
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => {
          if (num > 1) {
            playVerseRef.current(surahId, num - 1);
          } else if (surahId > 1) {
            const prevCh = chapters.find((c) => c.id === surahId - 1);
            if (prevCh) playVerseRef.current(surahId - 1, prevCh.count);
          }
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
          if (isBismillah) {
            playVerseRef.current(surahId, 1);
          } else if (num < chapter.count) {
            playVerseRef.current(surahId, num + 1);
          } else if (surahId < 114) {
            const nextSurahId = surahId + 1;
            playVerseRef.current(nextSurahId, nextSurahId !== 9 && nextSurahId !== 1 ? 0 : 1);
          }
        });
      } catch (_) {}
    }

    // In mushaf mode: auto-geser (smooth slide) page ONLY if the playing verse is on another page
    if (settings.mode === 'read') {
      const targetVerseNum = isBismillah ? 1 : num;
      const currentActivePage = curPageRef.current;

      // 1. Cek apakah ayat ini sudah ada di halaman yang sedang aktif saat ini
      const activePageVerses = pageVersesCacheRef.current[currentActivePage] || [];
      const isOnActivePage = activePageVerses.some(
        (pv) => pv.surahId === surahId && pv.verseNum === targetVerseNum
      );

      if (isOnActivePage) {
        // Ayat SUDAH ada di halaman aktif, jangan geser halaman!
        return;
      }

      // 2. Jika tidak ada di halaman aktif saat ini, cari halaman tujuannya
      let versePage: number | undefined;

      // Prioritas 1: Cek halaman berikutnya (paling sering saat audio lanjut dari ayat terakhir di halaman)
      const nextPageVerses = pageVersesCacheRef.current[currentActivePage + 1] || [];
      if (nextPageVerses.some((pv) => pv.surahId === surahId && pv.verseNum === targetVerseNum)) {
        versePage = currentActivePage + 1;
      }

      // Prioritas 2: Cek di seluruh cache halaman
      if (!versePage) {
        for (const pStr in pageVersesCacheRef.current) {
          const pNum = Number(pStr);
          const found = pageVersesCacheRef.current[pNum]?.some(
            (pv) => pv.surahId === surahId && pv.verseNum === targetVerseNum
          );
          if (found) {
            versePage = pNum;
            break;
          }
        }
      }

      // Prioritas 3: Cek di versesBySurah jika ada
      if (!versePage) {
        versePage = versesBySurah[surahId]?.find((v) => v.n === targetVerseNum)?.p;
      }

      // Prioritas 4: Fallback ke range awal surah jika targetVerseNum === 1
      if (!versePage && targetVerseNum === 1) {
        versePage = CHAPTER_PAGE_RANGES[surahId - 1]?.[0];
      }

      if (versePage && versePage !== currentActivePage) {
        slideToPage(versePage);
      } else if (!versePage) {
        fetch(`${API}/verses/by_key/${surahId}:${targetVerseNum}?fields=page_number`)
          .then((r) => r.json())
          .then((d) => {
            const p = d.verse?.page_number;
            if (p && p !== curPageRef.current) {
              slideToPage(p);
            }
          })
          .catch(() => {});
      }
    }
  }, [chapters, settings.mode, versesBySurah, slideToPage, stopAudio, showToast, t]);

  // Always keep playVerseRef current
  playVerseRef.current = playVerse;

  // Auto-center playing verse on screen in both mushaf and daftar mode (Stabilo mengikuti dan memusatkan layar)
  useEffect(() => {
    if (!playingInfo) return;
    const { surahId, verseNum } = playingInfo;
    const targetKey = `${surahId}:${verseNum}`;

    const centerElement = () => {
      if (settings.mode === 'read') {
        const scroller = activePageScrollerRef.current;
        if (!scroller) return false;
        const targetEl = scroller.querySelector<HTMLElement>(`[data-verse-key="${targetKey}"]`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return true;
        }
        return false;
      } else {
        const scroller = scrollerRef.current;
        if (!scroller) return false;
        const targetEl = scroller.querySelector<HTMLElement>(`[data-verse-key="${targetKey}"]`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return true;
        }
        return false;
      }
    };

    // Staggered attempts to ensure it centers reliably after DOM paint & page loads
    const t0 = setTimeout(centerElement, 60);
    const t1 = setTimeout(centerElement, 220);
    const t2 = setTimeout(centerElement, 500);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [playingInfo, curPage, pageVersesCache[curPage], settings.mode]);

  const togglePlay = () => {
    if (!playingInfo) {
      const startSurahId = activeSurahId;
      if (startSurahId !== 1 && startSurahId !== 9) {
        playVerse(startSurahId, 0); // Start with Bismillah
      } else {
        playVerse(startSurahId, 1);
      }
    } else {
      stopAudio();
    }
  };

  // Bookmark Toggle - Single bookmark
  const toggleBookmark = (surahId: number, verseNum: number) => {
    const key = `${surahId}:${verseNum}`;
    const wasBookmarked = Boolean(settings.bm[key]?.length);
    setSettings((prev) => {
      const isBookmarked = Boolean(prev.bm[key]?.length);
      const newBm = { ...prev.bm };
      if (isBookmarked) {
        delete newBm[key];
      } else {
        newBm[key] = ['marked'];
      }

      const nextSettings = { ...prev, bm: newBm };
      saveSettings(nextSettings);
      return nextSettings;
    });
    showToast(!wasBookmarked ? 'Ayat ditandai' : 'Penanda ayat dihapus');
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
    setIsReadingActive(true);

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

  // Fetch / Resolve Bookmarked Verses Details
  useEffect(() => {
    if (!isBookmarksViewOpen || !isOpen) return;

    const keys = Object.keys(settings.bm).filter((k) => (settings.bm[k] || []).length > 0);
    if (keys.length === 0) return;

    const missingKeys = keys.filter((k) => !bookmarkedVersesData[k]);
    if (missingKeys.length === 0) return;

    let isMounted = true;
    const updates: Record<string, { arabic: string; trans: string; page: number; juz: number }> = {};
    const toFetch: string[] = [];

    for (const key of missingKeys) {
      const [sStr, vStr] = key.split(':');
      const sId = parseInt(sStr, 10);
      const vNum = parseInt(vStr, 10);

      // 1. Check in localStorage
      try {
        const cached = localStorage.getItem(`qwbw:v_detail:${key}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.arabic) {
            updates[key] = parsed;
            continue;
          }
        }
      } catch (_) {}

      // 2. Check in versesBySurah
      const inSurah = versesBySurah[sId]?.find((x) => x.n === vNum);
      if (inSurah) {
        const item = {
          arabic: inSurah.w.map((w) => w[0]).join(' '),
          trans: inSurah.t,
          page: inSurah.p,
          juz: inSurah.j
        };
        updates[key] = item;
        try { localStorage.setItem(`qwbw:v_detail:${key}`, JSON.stringify(item)); } catch (_) {}
        continue;
      }

      // 3. Check in pageVersesCache
      const inPage = Object.values(pageVersesCacheRef.current)
        .flatMap((pv) => pv)
        .find((x) => x.surahId === sId && x.verseNum === vNum);
      if (inPage) {
        const chapPages = CHAPTER_PAGE_RANGES[sId - 1] || [1, 1];
        const item = {
          arabic: inPage.arabicText,
          trans: inPage.translation,
          page: chapPages[0] || 1,
          juz: getJuzFromPage(chapPages[0] || 1)
        };
        updates[key] = item;
        try { localStorage.setItem(`qwbw:v_detail:${key}`, JSON.stringify(item)); } catch (_) {}
        continue;
      }

      toFetch.push(key);
    }

    if (Object.keys(updates).length > 0) {
      setBookmarkedVersesData((prev) => ({ ...prev, ...updates }));
    }

    if (toFetch.length === 0) return;

    Promise.all(
      toFetch.map(async (key) => {
        try {
          const res = await fetch(`${API}/verses/by_key/${key}?language=id&words=false&translations=33&fields=text_uthmani`);
          if (!res.ok) return null;
          const d = await res.json();
          const v = d.verse;
          if (!v) return null;
          const item = {
            arabic: v.text_uthmani || '',
            trans: cleanHtml(v.translations?.[0]?.text || ''),
            page: v.page_number || 1,
            juz: v.juz_number || 1
          };
          try { localStorage.setItem(`qwbw:v_detail:${key}`, JSON.stringify(item)); } catch (_) {}
          return { key, item };
        } catch (_) {
          return null;
        }
      })
    ).then((results) => {
      if (!isMounted) return;
      const remoteUpdates: Record<string, any> = {};
      results.forEach((r) => {
        if (r && r.item) {
          remoteUpdates[r.key] = r.item;
        }
      });
      if (Object.keys(remoteUpdates).length > 0) {
        setBookmarkedVersesData((prev) => ({ ...prev, ...remoteUpdates }));
      }
    });

    return () => { isMounted = false; };
  }, [isBookmarksViewOpen, isOpen, settings.bm, versesBySurah]);

  // Jump to Bookmarked Verse
  const handleJumpToBookmark = (surahId: number, verseNum: number, pageNum?: number) => {
    setIsBookmarksViewOpen(false);
    setIsReadingActive(true);
    const targetPage = pageNum || CHAPTER_PAGE_RANGES[surahId - 1]?.[0] || 1;
    if (settings.mode === 'read') {
      goToPage(targetPage);
      setSelectedVerseKey(`${surahId}:${verseNum}`);
    } else {
      handleSelectSurah(surahId);
      setTargetScrollVerse({ s: surahId, v: verseNum });
    }
    const c = chapters.find((x) => x.id === surahId);
    showToast(`Membuka QS. ${c?.name || surahId} : ${verseNum}`);
  };

  // Handle Jump Confirmation from "Pergi ke" Modal (Surah, Juz, Halaman)
  const handleConfirmJumpSurah = async () => {
    const targetSurahId = selectedJumpSurahId;
    const targetChapter = chapters.find((c) => c.id === targetSurahId);
    const maxAyah = targetChapter?.count || 1;
    let targetAyah = parseInt(jumpAyahInput.trim(), 10);
    if (isNaN(targetAyah) || targetAyah < 1) {
      targetAyah = 1;
    } else if (targetAyah > maxAyah) {
      targetAyah = maxAyah;
    }

    setIsJumpModalOpen(false);
    setIsReadingActive(true);

    if (settings.mode === 'read') {
      let targetPage = CHAPTER_PAGE_RANGES[targetSurahId - 1]?.[0] || 1;
      if (targetAyah > 1) {
        const inVerses = versesBySurah[targetSurahId]?.find((v) => v.n === targetAyah);
        if (inVerses?.p) {
          targetPage = inVerses.p;
        } else {
          try {
            const cacheKey = `qwbw:verses:${targetSurahId}:${settings.lang}`;
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
              const list: CompactVerse[] = JSON.parse(cached);
              const found = list.find((v) => v.n === targetAyah);
              if (found?.p) targetPage = found.p;
            }
          } catch (_) {}

          if (targetPage === CHAPTER_PAGE_RANGES[targetSurahId - 1]?.[0]) {
            try {
              const res = await fetch(`${API}/verses/by_key/${targetSurahId}:${targetAyah}?fields=page_number`);
              if (res.ok) {
                const data = await res.json();
                if (data?.verse?.page_number) {
                  targetPage = data.verse.page_number;
                }
              }
            } catch (_) {}
          }
        }
      }

      goToPage(targetPage);
      setSelectedVerseKey(`${targetSurahId}:${targetAyah}`);
      showToast(`Menuju QS. ${targetChapter?.name || targetSurahId} : ${targetAyah} (Hal. ${targetPage})`);
    } else {
      setActiveSurahId(targetSurahId);
      if (!loadedSurahIds.includes(targetSurahId)) {
        setLoadedSurahIds([targetSurahId]);
      }
      setTargetScrollVerse({ s: targetSurahId, v: targetAyah });
      if (versesBySurah[targetSurahId]) {
        setTimeout(() => {
          const el = scrollerRef.current?.querySelector(`[data-verse-key="${targetSurahId}:${targetAyah}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
      }
      showToast(`Menuju QS. ${targetChapter?.name || targetSurahId} : ${targetAyah}`);
    }
  };

  const handleConfirmJumpJuz = (juzNum?: number) => {
    const rawVal = juzNum !== undefined ? juzNum : parseInt(jumpJuzInput.trim(), 10);
    if (isNaN(rawVal) || rawVal < 1 || rawVal > 30) {
      showToast('Masukkan nomor juz antara 1 s/d 30');
      return;
    }
    setIsJumpModalOpen(false);
    setIsReadingActive(true);
    const safeJuz = Math.max(1, Math.min(30, rawVal));
    const startPage = JUZ_START_PAGES[safeJuz - 1] || 1;
    const [startSurahId, startVerseNum] = JUZ_START_VERSES[safeJuz - 1] || [1, 1];
    const chapter = chapters.find((c) => c.id === startSurahId);

    if (settings.mode === 'read') {
      goToPage(startPage);
      setSelectedVerseKey(`${startSurahId}:${startVerseNum}`);
      showToast(`Membuka Juz ${safeJuz} (Hal. ${startPage})`);
    } else {
      setActiveSurahId(startSurahId);
      if (!loadedSurahIds.includes(startSurahId)) {
        setLoadedSurahIds([startSurahId]);
      }
      setCurrentJuzInfo({ juz: safeJuz, page: startPage });
      setTargetScrollVerse({ s: startSurahId, v: startVerseNum });
      setSelectedVerseKey(`${startSurahId}:${startVerseNum}`);
      if (versesBySurah[startSurahId]) {
        setTimeout(() => {
          const el = scrollerRef.current?.querySelector(`[data-verse-key="${startSurahId}:${startVerseNum}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
      }
      showToast(`Membuka Juz ${safeJuz} • QS. ${chapter?.name || startSurahId} : ${startVerseNum}`);
    }
  };

  const handleConfirmJumpPage = () => {
    const pageNum = parseInt(jumpPageInput.trim(), 10);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > 604) {
      showToast('Masukkan nomor halaman antara 1 s/d 604');
      return;
    }
    setIsJumpModalOpen(false);
    setIsReadingActive(true);
    const sId = getChapterIdFromPage(pageNum);
    const chapter = chapters.find((c) => c.id === sId);

    if (settings.mode === 'read') {
      goToPage(pageNum);
      showToast(`Membuka Halaman ${pageNum} (Juz ${getJuzFromPage(pageNum)})`);
    } else {
      setActiveSurahId(sId);
      if (!loadedSurahIds.includes(sId)) {
        setLoadedSurahIds([sId]);
      }
      setCurrentJuzInfo({ juz: getJuzFromPage(pageNum), page: pageNum });
      if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
      showToast(`Membuka Hal. ${pageNum} • QS. ${chapter?.name || sId}`);
    }
  };

  // Input clamp helpers for "Pergi ke" Modal (mencegah input di luar interval yang valid)
  const handleAyahInputChange = (val: string, maxAyat: number) => {
    const clean = val.replace(/[^0-9]/g, '');
    if (!clean) {
      setJumpAyahInput('');
      return;
    }
    let num = parseInt(clean, 10);
    if (num <= 0) {
      num = 1;
    } else if (num > maxAyat) {
      num = maxAyat;
    }
    setJumpAyahInput(String(num));
  };

  const handleJuzInputChange = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    if (!clean) {
      setJumpJuzInput('');
      return;
    }
    let num = parseInt(clean, 10);
    if (num <= 0) {
      num = 1;
    } else if (num > 30) {
      num = 30;
    }
    setJumpJuzInput(String(num));
  };

  const handlePageInputChange = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    if (!clean) {
      setJumpPageInput('');
      return;
    }
    let num = parseInt(clean, 10);
    if (num <= 0) {
      num = 1;
    } else if (num > 604) {
      num = 604;
    }
    setJumpPageInput(String(num));
  };

  // Helper to get currently visible verse in viewport for seamless mode switching
  const getCurrentVisibleVerse = useCallback((): { surahId: number; verseNum: number; page: number } => {
    if (settings.mode === 'read') {
      const scroller = activePageScrollerRef.current;
      if (scroller) {
        const containerTop = scroller.getBoundingClientRect().top;
        const verseEls = scroller.querySelectorAll<HTMLElement>('[data-verse-key]');
        for (let i = 0; i < verseEls.length; i++) {
          const el = verseEls[i];
          const rect = el.getBoundingClientRect();
          if (rect.bottom > containerTop + 30) {
            const key = el.dataset.verseKey;
            if (key) {
              const [sId, vNum] = key.split(':').map((x) => parseInt(x, 10));
              return { surahId: sId, verseNum: vNum, page: curPage };
            }
          }
        }
      }
      const pageVerses = pageVersesCache[curPage] || [];
      if (pageVerses.length > 0) {
        return { surahId: pageVerses[0].surahId, verseNum: pageVerses[0].verseNum, page: curPage };
      }
      const sId = getChapterIdFromPage(curPage);
      return { surahId: sId, verseNum: 1, page: curPage };
    } else {
      const scroller = scrollerRef.current;
      if (scroller) {
        const containerTop = scroller.getBoundingClientRect().top;
        const verseEls = scroller.querySelectorAll<HTMLElement>('[data-verse-key]');
        for (let i = 0; i < verseEls.length; i++) {
          const el = verseEls[i];
          const rect = el.getBoundingClientRect();
          if (rect.bottom > containerTop + 30) {
            const key = el.dataset.verseKey;
            if (key) {
              const [sId, vNum] = key.split(':').map((x) => parseInt(x, 10));
              const v = versesBySurah[sId]?.find((x) => x.n === vNum);
              const pNum = v?.p || CHAPTER_PAGE_RANGES[sId - 1]?.[0] || 1;
              return { surahId: sId, verseNum: vNum, page: pNum };
            }
          }
        }
      }
      return { 
        surahId: activeSurahId, 
        verseNum: 1, 
        page: CHAPTER_PAGE_RANGES[activeSurahId - 1]?.[0] || 1 
      };
    }
  }, [settings.mode, curPage, pageVersesCache, versesBySurah, activeSurahId]);

  // Display mode switcher with auto-sync location
  const toggleDisplayMode = () => {
    const nextMode: 'wbw' | 'read' = settings.mode === 'wbw' ? 'read' : 'wbw';
    const loc = getCurrentVisibleVerse();

    if (nextMode === 'read') {
      let targetP = loc.page;
      if (!targetP || targetP < 1) {
        targetP = CHAPTER_PAGE_RANGES[loc.surahId - 1]?.[0] || 1;
      }
      goToPage(targetP);
      setSelectedVerseKey(`${loc.surahId}:${loc.verseNum}`);
      setTimeout(() => {
        const el = activePageScrollerRef.current?.querySelector<HTMLElement>(`[data-verse-key="${loc.surahId}:${loc.verseNum}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
      }, 50);
    } else {
      setActiveSurahId(loc.surahId);
      if (!loadedSurahIds.includes(loc.surahId)) {
        setLoadedSurahIds([loc.surahId]);
      }
      setTargetScrollVerse({ s: loc.surahId, v: loc.verseNum, instant: true });
      setSelectedVerseKey(`${loc.surahId}:${loc.verseNum}`);
      setTimeout(() => {
        const el = scrollerRef.current?.querySelector<HTMLElement>(`[data-verse-key="${loc.surahId}:${loc.verseNum}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
      }, 50);
    }

    setSettings((prev) => {
      const updated: QuranSettings = { ...prev, mode: nextMode };
      saveSettings(updated);
      return updated;
    });
    showToast(nextMode === 'read' ? 'Mode Mushaf Pojok' : 'Mode Daftar Ayat');
  };

  if (!isOpen) return null;

  const currentFontSize = typeof settings.size === 'number' && settings.size >= 16 
    ? settings.size 
    : (SIZES[settings.size] || 28);
  const activeFontConfig = QURAN_FONTS.find((f) => f.id === settings.fontFamily) || QURAN_FONTS[0];
  const activeChapter = chapters.find((c) => c.id === activeSurahId) || chapters[0] || null;
  const minLoadedSurahId = Math.min(...loadedSurahIds);
  const maxLoadedSurahId = Math.max(...loadedSurahIds);
  const isPlaying = playingInfo !== null;

  return (
    <div className="fixed inset-0 z-[100050] bg-[#fbf9f2] text-slate-800 flex flex-col font-sans select-none overflow-hidden max-w-lg mx-auto shadow-2xl border-x border-slate-200">
      {!isReadingActive ? (
        /* ================= TAMPILAN AWAL (BERANDA AL-QUR'AN) ================= */
        <div className="flex-1 flex flex-col bg-[#fbf9f2] overflow-hidden">
          {/* Header Beranda Al-Qur'an */}
          <header className="bg-[#4f9a50] text-white flex items-center justify-between px-3 h-14 pt-safe shrink-0 shadow-sm z-20">
            <button
              type="button"
              onClick={() => {
                stopAudio();
                onClose();
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 active:bg-white/30 transition-colors cursor-pointer"
              title="Kembali ke Portal"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <h1 className="font-bold text-base sm:text-lg text-white tracking-wide">
              Al-Qur'an Al-Karim
            </h1>

            <button
              type="button"
              onClick={() => {
                setBookmarkSearchQuery('');
                setIsBookmarksViewOpen(true);
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 active:bg-white/30 transition-colors cursor-pointer text-white"
              title="Buka Ayat Ditandai (Bookmark)"
            >
              <Bookmark className="w-5 h-5 fill-white/20" />
            </button>
          </header>

          {/* Konten Scrollable Beranda Al-Qur'an */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4">
            {/* Baris Paling Atas: Grid 2 Kolom (Kiri: Terakhir Dibaca, Kanan: Pilih Juz) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Grid Kiri: Terakhir Dibaca */}
              {(() => {
                const lrSurahId = settings.lr?.s || 1;
                const lrVerseNum = settings.lr?.v || 1;
                const lrChapter = chapters.find((c) => c.id === lrSurahId) || chapters[0];
                const lrPage = CHAPTER_PAGE_RANGES[lrSurahId - 1]?.[0] || 1;
                const lrJuz = getJuzFromPage(lrPage);

                return (
                  <button
                    type="button"
                    onClick={() => {
                      if (settings.mode === 'read') {
                        goToPage(lrPage);
                        setSelectedVerseKey(`${lrSurahId}:${lrVerseNum}`);
                      } else {
                        handleSelectSurah(lrSurahId);
                        setTargetScrollVerse({ s: lrSurahId, v: lrVerseNum });
                        setSelectedVerseKey(`${lrSurahId}:${lrVerseNum}`);
                      }
                      setIsReadingActive(true);
                      showToast(`Melanjutkan QS. ${lrChapter?.name || lrSurahId} : ${lrVerseNum}`);
                    }}
                    className="group relative bg-linear-to-br from-[#e8f5e9] to-[#c8e6c9]/70 hover:to-[#c8e6c9] border border-emerald-300/80 rounded-2xl p-3.5 text-left shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[114px]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 tracking-wide uppercase">
                          <Bookmark className="w-3.5 h-3.5 fill-emerald-600 text-emerald-700" />
                          Terakhir Dibaca
                        </span>
                      </div>
                      <div className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-emerald-900 leading-snug truncate">
                        QS. {lrChapter ? lrChapter.name : 'Al-Fatihah'}
                      </div>
                      <div className="text-xs font-semibold text-emerald-800 mt-0.5">
                        Ayat {lrVerseNum}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-emerald-200/60 text-[10px] text-emerald-700 font-medium">
                      <span>Juz {lrJuz} • Hal. {lrPage}</span>
                      <span className="group-hover:translate-x-0.5 transition-transform font-bold">Lanjut →</span>
                    </div>
                  </button>
                );
              })()}

              {/* Grid Kanan: Pilih Juz (membuka modal ketik nomor juz) */}
              <button
                type="button"
                onClick={() => {
                  const currentJuzNum = settings.mode === 'read'
                    ? getJuzFromPage(curPage)
                    : Number(currentJuzInfo.juz) || 1;
                  setHomeJuzInput(String(currentJuzNum));
                  setIsHomeJuzModalOpen(true);
                }}
                className="group relative bg-linear-to-br from-[#e0f2f1] to-[#b2dfdb]/70 hover:to-[#b2dfdb] border border-teal-300/80 rounded-2xl p-3.5 text-left shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[114px]"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-teal-800 tracking-wide uppercase">
                      <ListOrdered className="w-3.5 h-3.5 text-teal-700" />
                      Pilih Juz
                    </span>
                  </div>
                  <div className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-teal-900 leading-snug">
                    Juz 1 s/d 30
                  </div>
                  <div className="text-xs font-medium text-teal-800/90 mt-0.5 truncate">
                    Lompat ke awal juz
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-teal-200/60 text-[10px] text-teal-700 font-medium">
                  <span>Ketik nomor juz</span>
                  <span className="group-hover:translate-x-0.5 transition-transform font-bold">Pilih →</span>
                </div>
              </button>
            </div>

            {/* Kotak Cari (Search Input) */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                placeholder="Cari surat (contoh: Yasin, Al-Mulk, 36)..."
                value={homeSurahSearch}
                onChange={(e) => setHomeSurahSearch(e.target.value)}
                className="w-full pl-9.5 pr-8 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4f9a50] focus:border-transparent shadow-xs"
              />
              {homeSurahSearch && (
                <button
                  type="button"
                  onClick={() => setHomeSurahSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Daftar Nama-Nama Surat (Transliterasi Indo di Kiri, Kaligrafi Arab di Kanan) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
              {chapters
                .filter((c) => {
                  if (!homeSurahSearch.trim()) return true;
                  const q = homeSurahSearch.trim().toLowerCase();
                  return (
                    c.name.toLowerCase().includes(q) ||
                    c.tn.toLowerCase().includes(q) ||
                    String(c.id) === q ||
                    String(c.id).startsWith(q) ||
                    (c.ar || '').includes(q)
                  );
                })
                .map((c) => {
                  const isLastReadSurah = settings.lr?.s === c.id;
                  return (
                    <button
                      key={`home-surah-${c.id}`}
                      type="button"
                      onClick={() => {
                        handleSelectSurah(c.id);
                        setIsReadingActive(true);
                      }}
                      className={`w-full flex items-center justify-between p-3.5 sm:p-4 text-left transition-colors cursor-pointer group ${
                        isLastReadSurah ? 'bg-emerald-50/70 hover:bg-emerald-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Sisi Kiri: Nomor, Nama Transliterasi Indo, Arti & Info Ayat */}
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                          isLastReadSurah 
                            ? 'bg-[#4f9a50] text-white shadow-xs' 
                            : 'bg-slate-100 text-slate-700 group-hover:bg-emerald-100 group-hover:text-emerald-800'
                        }`}>
                          {c.id}
                        </span>
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 truncate">
                              {c.name}
                            </span>
                            {isLastReadSurah && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">
                                Terakhir
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {c.tn} • {c.count} Ayat • {c.place === 'madinah' ? 'Madaniyah' : 'Makkiyah'}
                          </div>
                        </div>
                      </div>

                      {/* Sisi Kanan: Teks Kaligrafi Arab Nama Surat */}
                      <span
                        className="surah-toc-name shrink-0 ml-2 text-slate-800 group-hover:text-emerald-900 text-2xl sm:text-3xl leading-none select-none transition-colors"
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
      ) : (
        /* ================= TAMPILAN BACAAN (HEADER + MUSHAF/BARIS + FOOTER) ================= */
        <>
          {/* ================= 1. TOP GREEN HEADER ================= */}
          <header className={`bg-[#4f9a50] text-white flex items-center justify-between px-3 shrink-0 shadow-sm z-30 transition-all duration-300 ease-in-out ${
            isCleanReading 
              ? 'h-0 py-0 opacity-0 pointer-events-none overflow-hidden' 
              : 'h-14 pt-safe opacity-100'
          }`}>
            {/* Back Button to Tampilan Awal Al-Qur'an */}
            <button
              type="button"
              onClick={() => {
                stopAudio();
                setIsReadingActive(false);
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 active:bg-white/30 transition-colors cursor-pointer"
              title="Kembali ke Daftar Surat"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

        {/* Surah Title Picker & Quick Jump Button (Mode Baris: Nama Surat & Keterangan Juz di Bawahnya) */}
        <button
          type="button"
          onClick={() => {
            const currentJuzNum = settings.mode === 'read'
              ? getJuzFromPage(curPage)
              : Number(currentJuzInfo.juz) || getJuzFromPage(CHAPTER_PAGE_RANGES[activeSurahId - 1]?.[0] || 1);
            setSelectedJumpSurahId(activeSurahId);
            const activeCh = chapters.find((c) => c.id === activeSurahId);
            setSurahPickerSearch(activeCh ? `${activeCh.id}. ${activeCh.name}` : '');
            setIsSurahPickerOpen(false);
            setSelectedJumpJuz(currentJuzNum);
            setJumpJuzInput(String(currentJuzNum));
            setJumpAyahInput('');
            setJumpPageInput('');
            setJumpModalTab('surah');
            setIsJumpModalOpen(true);
          }}
          className="flex-1 flex items-center justify-between gap-1.5 px-3 py-1 bg-black/15 hover:bg-black/25 border border-white/20 rounded-xl transition-all cursor-pointer min-w-0 mx-2 text-left"
          title="Pergi ke"
        >
          <div className="flex flex-col min-w-0 leading-tight">
            {settings.mode === 'read' ? (
              <>
                <span className="text-[11px] text-emerald-100/90 font-medium truncate">
                  Halaman {curPage}, Juz {getJuzFromPage(curPage)}
                </span>
                <span className="font-bold text-sm sm:text-base text-white truncate tracking-wide">
                  {activeChapter ? activeChapter.name : 'Al-Qur\'an'}
                </span>
              </>
            ) : (
              <>
                <span className="font-bold text-sm sm:text-base text-white truncate tracking-wide">
                  {activeChapter ? activeChapter.name : 'Al-Qur\'an'}
                </span>
                <span className="text-[11px] text-emerald-100/90 font-medium truncate">
                  Juz {currentJuzInfo.juz || getJuzFromPage(CHAPTER_PAGE_RANGES[activeSurahId - 1]?.[0] || 1)}
                </span>
              </>
            )}
          </div>
          <ChevronDown className="w-4 h-4 shrink-0 text-white/80 ml-1.5" />
        </button>

        {/* Tombol Kumpulan Ayat Ditandai (Bookmark) di Kanan Atas */}
        <button
          type="button"
          onClick={() => {
            setBookmarkSearchQuery('');
            setIsBookmarksViewOpen(true);
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 active:bg-white/30 transition-colors cursor-pointer text-white"
          title="Buka Kumpulan Ayat Ditandai (Bookmark)"
          aria-label="Ayat Ditandai"
        >
          <Bookmark className="w-5 h-5 fill-white/20" />
        </button>
      </header>

      {/* SVG Definition for Surah Cartouche Pill & LPMQ Ayah Circle Rosette */}
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
          <symbol id="lpmq-ayah-circle-glyph" viewBox="0 0 2000 2000">
            <path d={LPMQ_AYAH_CIRCLE_PATH} />
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
          {/* Main Digital Mushaf Viewport (1 Layar = Tepat 1 Halaman Baku Mushaf Pojok) */}
          <div
            className="relative w-full flex-1 overflow-hidden select-none bg-[#fbf9f2]"
            onClick={() => {
              if (!isDraggingPageRef.current && Math.abs(dragOffsetRef.current) < 5) {
                toggleCleanMode();
              }
            }}
          >
            {/* 1. Next Page in RTL (curPage + 1 atau animatingTargetPage berada di sebelah KIRI, ditarik saat digeser ke kanan) */}
            {(dragOffset > 0 || (isAnimatingPage && dragOffset > 0)) && curPage < 604 && (() => {
              const displayPage = animatingTargetPage && animatingTargetPage > curPage ? animatingTargetPage : curPage + 1;
              return (
                <div
                  key={`mushaf-next-page-${displayPage}`}
                  ref={nextPageScrollerRef}
                  className="absolute inset-y-0 w-full overflow-y-auto flex flex-col items-center justify-start overscroll-contain bg-[#fbf9f2] pointer-events-none"
                  style={{
                    left: '-100%',
                    transform: `translateX(${dragOffset}px)`,
                    transition: isAnimatingPage ? 'transform 260ms cubic-bezier(0.2, 0.9, 0.3, 1)' : 'none',
                    willChange: 'transform'
                  }}
                >
                  <MushafPageContent
                    page={displayPage}
                    verses={pageVersesCache[displayPage] || []}
                    isLoading={isPageLoading && !(pageVersesCache[displayPage]?.length)}
                    chapters={chapters}
                    isSurahFontLoaded={isSurahFontLoaded}
                    currentFontSize={currentFontSize}
                    activeFontConfig={activeFontConfig}
                    playingInfo={playingInfo}
                    selectedVerseKey={null}
                    activeVerseSheet={null}
                    settings={settings}
                    isCleanReading={isCleanReading}
                    isInteractive={false}
                  />
                </div>
              );
            })()}

            {/* 2. Current Active Page (1 Layar Penuh = 1 Halaman Baku, terdorong halus saat digeser) */}
            <div
              key={`mushaf-active-page-${curPage}`}
              ref={activePageScrollerRef}
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
                activeVerseSheet={activeVerseSheet}
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

            {/* 3. Previous Page in RTL (curPage - 1 atau animatingTargetPage berada di sebelah KANAN, ditarik saat digeser ke kiri) */}
            {(dragOffset < 0 || (isAnimatingPage && dragOffset < 0)) && curPage > 1 && (() => {
              const displayPage = animatingTargetPage && animatingTargetPage < curPage ? animatingTargetPage : curPage - 1;
              return (
                <div
                  key={`mushaf-prev-page-${displayPage}`}
                  ref={prevPageScrollerRef}
                  className="absolute inset-y-0 w-full overflow-y-auto flex flex-col items-center justify-start overscroll-contain bg-[#fbf9f2] pointer-events-none"
                  style={{
                    left: '100%',
                    transform: `translateX(${dragOffset}px)`,
                    transition: isAnimatingPage ? 'transform 260ms cubic-bezier(0.2, 0.9, 0.3, 1)' : 'none',
                    willChange: 'transform'
                  }}
                >
                  <MushafPageContent
                    page={displayPage}
                    verses={pageVersesCache[displayPage] || []}
                    isLoading={isPageLoading && !(pageVersesCache[displayPage]?.length)}
                    chapters={chapters}
                    isSurahFontLoaded={isSurahFontLoaded}
                    currentFontSize={currentFontSize}
                    activeFontConfig={activeFontConfig}
                    playingInfo={playingInfo}
                    selectedVerseKey={null}
                    activeVerseSheet={null}
                    settings={settings}
                    isCleanReading={isCleanReading}
                    isInteractive={false}
                  />
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ================= 3B. CONTINUOUS SCROLLABLE VERSES CONTENT (MODE KATA PER KATA) ================= */}
      {settings.mode === 'wbw' && (
      <main
        ref={scrollerRef}
        onScroll={handleScroll}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          if (!isLongPressActiveRef.current) {
            toggleCleanMode();
          }
        }}
        className="flex-1 overflow-y-auto bg-[#fbf9f2] overscroll-contain pb-24 select-none"
        tabIndex={-1}
      >

        {/* Button to load previous surah upwards if user jumped into later surahs */}
        {minLoadedSurahId > 1 && (
          <div className="py-2.5 px-4 text-center border-b border-amber-900/10 bg-[#fbf9f2]">
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
              className="surah-section relative bg-[#fbf9f2]"
            >
              {/* Surah Cartouche Banner */}
              <div className="pt-4 pb-1 px-4 w-full">
                <div className="banner select-none w-full">
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

                {/* Authentic Quranic Bismillah Calligraphy Vector (unless Surah 1 Al-Fatihah or Surah 9 At-Tawbah) */}
                {chapter.bis && surahId !== 1 && surahId !== 9 && (
                  <div 
                    className={`py-2 px-3 my-2 transition-all rounded-none ${
                      playingInfo?.surahId === surahId && playingInfo?.verseNum === 0
                        ? 'bg-[#bbf7d0]/80 border border-dashed border-emerald-500'
                        : ''
                    }`}
                    data-verse-key={`${surahId}:0`}
                  >
                    <BismillahCalligraphy />
                  </div>
                )}
              </div>

              {/* Verses for this Surah: Word by Word Mode */}
              {settings.mode === 'wbw' && surahVerses.length > 0 && (
                <div className="divide-y divide-amber-900/10">
                  {surahVerses.map((v) => {
                    const isVersePlaying = playingInfo?.surahId === surahId && playingInfo?.verseNum === v.n;
                    const verseKey = `${surahId}:${v.n}`;
                    const isSelected = Boolean(activeVerseSheet && selectedVerseKey === verseKey);
                    const activeBookmarks = settings.bm[verseKey] || [];
                    const isLastRead = settings.lr?.s === surahId && settings.lr?.v === v.n;

                    return (
                      <article
                        key={verseKey}
                        data-surah-id={surahId}
                        data-verse-num={v.n}
                        data-verse-key={verseKey}
                        className={`p-4 transition-all select-none quran-interactive-text cursor-pointer rounded-none mx-0 my-1.5 ${
                          isVersePlaying 
                            ? 'bg-[#bbf7d0]/80 border border-emerald-400' 
                            : isSelected
                            ? 'bg-[#fef08a] border border-dashed border-amber-500'
                            : isLastRead
                            ? 'bg-[#dcfce7]/90 border border-dashed border-emerald-500'
                            : 'bg-[#fbf9f2] hover:bg-amber-50/40'
                        }`}
                      >
                        {/* Verse Header: Titik Tiga Vertikal di Kiri Atas (Satu-satunya cara membuka opsi ayat di mode daftar) */}
                        <div className="flex items-center justify-between gap-2 min-h-7 mb-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openVerseMenu(surahId, v.n, verseKey);
                              }}
                              className="w-7 h-7 -ml-1 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
                              title={`Menu Opsi Ayat ${v.n}`}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Words Flow (RTL - flows naturally from Right to Left) */}
                        <div 
                          className="flex flex-wrap items-center justify-start gap-x-2 gap-y-3.5 my-3"
                          dir="rtl"
                          style={{ fontSize: `${currentFontSize}px` }}
                        >
                          {v.w.map((w, idx) => {
                            const wordKey = `${surahId}:${v.n}:${idx}`;

                            return (
                              <div
                                key={wordKey}
                                className="quran-wbw-word-card inline-flex flex-col items-center justify-start gap-1 bg-transparent border-0 shadow-none my-1 mx-0.5 align-top text-center"
                                style={{
                                  textAlign: 'center',
                                  textAlignLast: 'center',
                                }}
                              >
                                {/* Arabic word - sejajar lurus */}
                                <span
                                  className="font-arabic leading-tight whitespace-nowrap text-slate-900 text-center flex items-center justify-center min-h-[1.5em]"
                                  dir="rtl"
                                  style={{ 
                                    fontSize: `${currentFontSize}px`,
                                    fontFamily: activeFontConfig.css,
                                    textAlign: 'center',
                                    textAlignLast: 'center',
                                  }}
                                >
                                  {w[0]}
                                </span>

                                {/* Word-by-word meaning (LTR) - center vertical & center horizontal if multiple lines */}
                                {settings.showWord && (
                                  <span 
                                    className="quran-wbw-word-meaning text-[11px] leading-tight text-slate-600 text-center w-full max-w-[96px] min-h-[28px] break-words font-medium flex items-center justify-center self-center"
                                    dir="ltr"
                                    style={{ 
                                      textAlign: 'center',
                                      textAlignLast: 'center',
                                      textJustify: 'none',
                                      wordBreak: 'normal',
                                      overflowWrap: 'break-word',
                                    }}
                                  >
                                    {w[1]}
                                  </span>
                                )}
                              </div>
                            );
                          })}

                          {/* Lingkaran Ayat di Mode Daftar (Penanda bookmark ada di atas lingkaran ayat) */}
                          <div 
                            className={`inline-flex items-center justify-center select-none ${
                              settings.showWord ? 'self-start pt-1' : 'self-center my-0.5'
                            }`}
                            style={{ fontSize: `${currentFontSize}px` }}
                          >
                            <AyahEndCircle
                              num={v.n}
                              fontSize={currentFontSize}
                              isLastRead={isLastRead}
                              isBookmarked={activeBookmarks.length > 0}
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
                  className="p-4 sm:p-5 quran-mushaf-page-text leading-[2.8] font-arabic text-slate-900 border-b border-slate-100"
                  dir="rtl"
                  style={{ 
                    fontSize: `${currentFontSize + 2}px`,
                    fontFamily: activeFontConfig.css,
                    textAlign: 'justify',
                    textJustify: 'inter-word',
                    textAlignLast: 'right',
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
                          style={{ fontSize: `${currentFontSize}px` }}
                        >
                          <AyahEndCircle 
                            num={v.n} 
                            fontSize={currentFontSize} 
                            isLastRead={settings.lr?.s === surahId && settings.lr?.v === v.n}
                            isBookmarked={Boolean(settings.bm[verseKey]?.length)}
                          />
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
      {/* Terdiri dari strip pengatur bacaan (aA, Terjemah, Per Kata di bawah semua) & strip aksi (Mode, Gir Pengaturan, Murottal) */}
      <footer className={`bg-[#458e46] text-white shrink-0 shadow-lg z-30 transition-all duration-300 ease-in-out border-t border-emerald-600/50 ${
        isCleanReading 
          ? 'h-0 py-0 opacity-0 pointer-events-none overflow-hidden' 
          : 'opacity-100 pb-safe'
      }`}>
        {/* Slider Ukuran Huruf Mulus (Muncul di batas bilah bawah tanpa modal) */}
        {isFontSizeSliderOpen && (
          <div className="bg-[#387839] text-white px-4 py-2 border-b border-emerald-500/50 flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-150">
            <span className="text-emerald-100 font-serif font-bold text-xs select-none shrink-0">
              A-
            </span>
            <div className="flex-1 flex items-center gap-2.5">
              <input
                type="range"
                min="18"
                max="46"
                step="1"
                value={currentFontSize}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSettings((prev) => {
                    const next = { ...prev, size: val };
                    saveSettings(next);
                    return next;
                  });
                }}
                className="w-full h-1.5 bg-emerald-950/40 rounded-lg appearance-none cursor-pointer accent-white"
                title={`Ukuran: ${currentFontSize}px`}
              />
            </div>
            <span className="text-emerald-100 font-serif font-black text-sm select-none shrink-0">
              A+
            </span>
            <span className="bg-emerald-950/50 text-emerald-100 font-mono font-bold text-[11px] px-2 py-0.5 rounded-full border border-emerald-400/30 shrink-0 min-w-[44px] text-center">
              {currentFontSize}px
            </span>
            <button
              type="button"
              onClick={() => setIsFontSizeSliderOpen(false)}
              className="w-6 h-6 rounded-full flex items-center justify-center text-emerald-200 hover:text-white hover:bg-white/20 transition-colors cursor-pointer shrink-0"
              title="Tutup slider"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Item lingkaran sempurna & tombol play panjang curve sempurna */}
        <div className="flex items-center justify-between gap-2 px-3 sm:px-4 h-14 max-w-lg mx-auto w-full">
          {/* 1. Mode Baca (Lingkaran Sempurna) */}
          <button
            type="button"
            onClick={toggleDisplayMode}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer border shrink-0 ${
              settings.mode === 'read'
                ? 'bg-white text-emerald-800 border-white shadow-xs'
                : 'bg-white/15 text-white/90 hover:text-white border-white/20 hover:bg-white/25'
            }`}
            title={settings.mode === 'read' ? 'Beralih ke Mode Daftar Ayat' : 'Beralih ke Mode Mushaf'}
            aria-label="Mode Baca"
          >
            {settings.mode === 'read' ? <BookOpen className="w-4.5 h-4.5" /> : <FileText className="w-4.5 h-4.5" />}
          </button>

          {/* 2. Ukuran Font 'aA' (Lingkaran Sempurna) */}
          <button
            type="button"
            onClick={() => setIsFontSizeSliderOpen((prev) => !prev)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer border shadow-xs shrink-0 ${
              isFontSizeSliderOpen
                ? 'bg-white text-emerald-800 border-white shadow-md'
                : 'bg-white/15 hover:bg-white/25 active:bg-white/35 text-white border-white/20'
            }`}
            title="Atur Ukuran Huruf (aA)"
            aria-label="Ukuran Huruf"
          >
            <span className="font-serif font-black tracking-tight text-sm select-none">
              aA
            </span>
          </button>

          {/* 3. Terjemahan (Lingkaran Sempurna) - Nonaktif di Mode Mushaf */}
          <button
            type="button"
            disabled={settings.mode === 'read'}
            onClick={() => {
              if (settings.mode === 'read') return;
              const nextVal = !settings.showTr;
              setSettings((prev) => {
                const next = { 
                  ...prev, 
                  showTr: nextVal
                };
                saveSettings(next);
                return next;
              });
              showToast(nextVal ? 'Terjemahan diaktifkan' : 'Terjemahan disembunyikan');
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border shrink-0 ${
              settings.mode === 'read'
                ? 'opacity-30 cursor-not-allowed bg-white/10 text-white/50 border-white/10'
                : settings.showTr
                ? 'bg-white text-emerald-800 border-white shadow-xs cursor-pointer'
                : 'bg-white/15 text-white/90 hover:text-white border-white/20 hover:bg-white/25 cursor-pointer'
            }`}
            title={
              settings.mode === 'read'
                ? 'Terjemahan tidak aktif di Mode Mushaf (Gunakan tombol Per Kata untuk terjemahan)'
                : settings.showTr
                ? 'Sembunyikan Terjemahan (Kemenag RI)'
                : 'Tampilkan Terjemahan (Kemenag RI)'
            }
            aria-label="Terjemahan"
          >
            <Languages className="w-4.5 h-4.5" />
          </button>

          {/* 4. Per Kata (Lingkaran Sempurna) - Berfungsi di Mode Mushaf & Mode Daftar */}
          <button
            type="button"
            onClick={() => {
              const nextVal = !settings.showWord;
              setSettings((prev) => {
                const next = { 
                  ...prev, 
                  showWord: nextVal
                };
                saveSettings(next);
                return next;
              });
              showToast(nextVal ? 'Terjemah per kata diaktifkan' : 'Terjemah per kata disembunyikan');
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer border shrink-0 ${
              settings.showWord
                ? 'bg-white text-emerald-800 border-white shadow-xs'
                : 'bg-white/15 text-white/90 hover:text-white border-white/20 hover:bg-white/25'
            }`}
            title={settings.showWord ? 'Sembunyikan Makna Per Kata' : 'Tampilkan Makna Per Kata'}
            aria-label="Per Kata"
          >
            <WholeWord className="w-4.5 h-4.5" />
          </button>

          {/* 5. Tombol Play Panjang Berbentuk Kapsul Melengkung Sempurna */}
          {(() => {
            const isCurrentPlaying = isPlaying && playingInfo !== null;
            const playingChapter = isCurrentPlaying ? chapters.find((c) => c.id === playingInfo.surahId) : null;
            const labelText = isCurrentPlaying
              ? playingInfo?.verseNum === 0
                ? `${playingChapter?.name || 'Surah'} : Bismillah`
                : `${playingChapter?.name || 'Surah'} : Ayat ${playingInfo?.verseNum || 1}`
              : `Putar QS. ${activeChapter?.name || 'Al-Qur\'an'}`;

            return (
              <button
                type="button"
                onClick={togglePlay}
                className={`flex-1 h-10 rounded-full px-3.5 flex items-center justify-center gap-2 text-xs font-semibold shadow-xs transition-all cursor-pointer border min-w-0 ${
                  isCurrentPlaying
                    ? 'bg-emerald-950 text-white border-emerald-400 shadow-md ring-2 ring-white/50 animate-pulse'
                    : 'bg-white text-emerald-800 border-white hover:bg-slate-50 active:scale-[0.98]'
                }`}
                title={isCurrentPlaying ? 'Jeda Audio Murottal' : labelText}
                aria-label="Audio Murottal"
              >
                {isCurrentPlaying ? (
                  <Pause className="w-4 h-4 fill-current shrink-0 text-emerald-300" />
                ) : (
                  <Play className="w-4 h-4 fill-current shrink-0 text-emerald-700 ml-0.5" />
                )}
                <span className="truncate tracking-tight font-bold">
                  {labelText}
                </span>
              </button>
            );
          })()}
        </div>
      </footer>
    </>
  )}

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
            onClick={closeVerseSheet}
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
                  onClick={closeVerseSheet}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="space-y-1 pt-1">
                {/* Single Bookmark Button */}
                {(() => {
                  const verseKey = `${activeVerseSheet.surahId}:${activeVerseSheet.verseNum}`;
                  const isBookmarked = Boolean(settings.bm[verseKey]?.length);
                  return (
                    <button
                      type="button"
                      onClick={() => toggleBookmark(activeVerseSheet.surahId, activeVerseSheet.verseNum)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-xs font-semibold text-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <Bookmark className={`w-4 h-4 ${isBookmarked ? 'text-amber-500 fill-amber-500' : 'text-slate-500'}`} />
                        <span>{isBookmarked ? 'Hapus Penanda' : 'Tandai Ayat'}</span>
                      </div>
                      {isBookmarked && <Check className="w-4 h-4 text-[#4f9a50]" />}
                    </button>
                  );
                })()}

                {/* Mark Last Read with Confirmation Popup */}
                <button
                  type="button"
                  onClick={() => {
                    const sId = activeVerseSheet.surahId;
                    const vNum = activeVerseSheet.verseNum;
                    closeVerseSheet();
                    if (settings.lr?.s === sId && settings.lr?.v === vNum) {
                      showToast('Ayat ini sudah ditandai sebagai terakhir dibaca');
                    } else {
                      setConfirmLastReadData({ surahId: sId, verseNum: vNum });
                    }
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-xs font-semibold text-slate-700"
                >
                  <Clock className="w-4 h-4 text-[#2e9e45]" />
                  <span>{t('last')}</span>
                </button>

                {/* Copy Verse */}
                <button
                  type="button"
                  onClick={() => {
                    copyVerseText(arabicText, translationText, chapter, activeVerseSheet.verseNum);
                    closeVerseSheet();
                  }}
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
                    closeVerseSheet();
                    if (vNum === 1 && sId !== 1 && sId !== 9) {
                      playVerse(sId, 0); // Plays Bismillah first
                    } else {
                      playVerse(sId, vNum);
                    }
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

      {/* ================= 7. FULLSCREEN VIEW: KUMPULAN AYAT DITANDAI (BOOKMARK) ================= */}
      {isBookmarksViewOpen && (() => {
        const bookmarkedEntries = Object.keys(settings.bm).filter((k) => Boolean(settings.bm[k]?.length));

        // Format and prepare bookmarked items
        const bookmarkList = bookmarkedEntries.map((key) => {
          const [sStr, vStr] = key.split(':');
          const surahId = parseInt(sStr, 10);
          const verseNum = parseInt(vStr, 10);
          const chapter = chapters.find((c) => c.id === surahId);
          
          // Try to get verse from loaded chapters
          const surahVerses = versesBySurah[surahId] || [];
          const matchedCompactVerse = surahVerses.find((x) => x.n === verseNum);

          // Try to get verse from page cache
          const matchedPageVerse = Object.values(pageVersesCache)
            .flatMap((p) => p)
            .find((x) => x.surahId === surahId && x.verseNum === verseNum);

          // Remote fetched data
          const remoteDetail = bookmarkedVersesData[key];

          const arabicText = matchedCompactVerse 
            ? matchedCompactVerse.w.map((w) => w[0]).join(' ') 
            : (matchedPageVerse?.arabicText || remoteDetail?.arabic || '');

          const translation = matchedCompactVerse 
            ? matchedCompactVerse.t 
            : (matchedPageVerse?.translation || remoteDetail?.trans || '');

          const pageNum = matchedCompactVerse?.p || (matchedPageVerse ? curPage : (remoteDetail?.page || CHAPTER_PAGE_RANGES[surahId - 1]?.[0] || 1));
          const juzNum = matchedCompactVerse?.j || remoteDetail?.juz || getJuzFromPage(pageNum);

          return {
            key,
            surahId,
            verseNum,
            chapter,
            arabicText,
            translation,
            pageNum,
            juzNum,
          };
        });

        // Filter by search query
        const filteredList = bookmarkList.filter((item) => {
          if (!bookmarkSearchQuery.trim()) return true;
          const q = bookmarkSearchQuery.toLowerCase();
          const chName = item.chapter?.name?.toLowerCase() || '';
          const chTn = item.chapter?.tn?.toLowerCase() || '';
          const sNum = String(item.surahId);
          const vNum = String(item.verseNum);
          const fullRef = `${sNum}:${vNum}`;
          const trans = item.translation.toLowerCase();
          const arabic = item.arabicText;

          return (
            chName.includes(q) ||
            chTn.includes(q) ||
            sNum === q ||
            vNum === q ||
            fullRef === q ||
            trans.includes(q) ||
            arabic.includes(q)
          );
        });

        return (
          <div
            className="fixed inset-0 z-[100060] bg-[#fbf9f2] text-slate-800 flex flex-col font-sans select-none overflow-hidden max-w-lg mx-auto shadow-2xl animate-in fade-in duration-200"
          >
            {/* Header: Bersih, Fullscreen, Hijau Islami */}
            <header className="bg-[#4f9a50] text-white px-4 h-14 pt-safe flex items-center justify-between shrink-0 shadow-sm z-10">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsBookmarksViewOpen(false)}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/20 active:bg-white/30 transition-colors cursor-pointer"
                  title="Kembali ke Al-Qur'an"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div>
                  <h2 className="font-bold text-base leading-tight flex items-center gap-2">
                    <span>Ayat Ditandai</span>
                    <span className="text-[11px] font-semibold bg-white/20 px-2 py-0.5 rounded-full text-emerald-50">
                      {bookmarkedEntries.length}
                    </span>
                  </h2>
                  <p className="text-[11px] text-emerald-100/80 leading-none mt-0.5">Kumpulan ayat suci yang Anda tandai</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBookmarksViewOpen(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/20 active:bg-white/30 text-emerald-100 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            {/* Fitur Pencarian Ayat Bookmark */}
            <div className="p-3 bg-white border-b border-slate-200/80 shrink-0 shadow-xs">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  placeholder="Cari nama surat, ayat, terjemahan..."
                  value={bookmarkSearchQuery}
                  onChange={(e) => setBookmarkSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4f9a50] focus:bg-white transition-all"
                />
                {bookmarkSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setBookmarkSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Konten Daftar Ayat Ditandai */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 pb-safe">
              {bookmarkedEntries.length === 0 ? (
                <div className="py-20 px-6 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600 shadow-xs">
                    <Bookmark className="w-8 h-8 text-emerald-600/70" />
                  </div>
                  <h3 className="font-bold text-base text-slate-800">Belum Ada Ayat Ditandai</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Tandai ayat Al-Qur'an dengan mengetuk nomor ayat saat membaca, lalu pilih "Tandai Ayat" untuk menyimpannya di sini.
                  </p>
                </div>
              ) : filteredList.length === 0 ? (
                <div className="py-16 px-6 text-center space-y-2">
                  <Search className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">Tidak ada ayat yang cocok</p>
                  <p className="text-[11px] text-slate-400">Kata kunci "{bookmarkSearchQuery}" tidak ditemukan pada ayat yang ditandai.</p>
                  <button
                    type="button"
                    onClick={() => setBookmarkSearchQuery('')}
                    className="mt-2 text-xs font-bold text-emerald-700 hover:underline"
                  >
                    Hapus Pencarian
                  </button>
                </div>
              ) : (
                filteredList.map((item) => {
                  return (
                    <article
                      key={`bm-${item.key}`}
                      className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:border-emerald-300 transition-all space-y-3"
                    >
                      {/* Kartu Header: Nama Surat, Ayat, Juz & Halaman */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold text-xs">
                            {item.surahId}
                          </span>
                          <div>
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                              QS. {item.chapter?.name || `Surat ${item.surahId}`} : {item.verseNum}
                            </h4>
                            <p className="text-[10px] text-slate-400">
                              {item.chapter?.tn || ''} • Juz {item.juzNum} • Hal. {item.pageNum}
                            </p>
                          </div>
                        </div>

                        {/* Hapus Bookmark Button */}
                        <button
                          type="button"
                          onClick={() => toggleBookmark(item.surahId, item.verseNum)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-amber-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Hapus dari daftar ditandai"
                        >
                          <Bookmark className="w-4 h-4 fill-amber-500" />
                        </button>
                      </div>

                      {/* Teks Arab Utsmani */}
                      {item.arabicText ? (
                        <div 
                          className="font-arabic text-slate-900 leading-[2.6] text-right py-1 select-none"
                          dir="rtl"
                          style={{ 
                            fontSize: `${currentFontSize}px`,
                            fontFamily: activeFontConfig.css
                          }}
                        >
                          {item.arabicText}
                          <AyahEndCircle num={item.verseNum} fontSize={currentFontSize} />
                        </div>
                      ) : (
                        <div className="py-3 text-center text-xs text-slate-400 italic">
                          Memuat lafadz ayat...
                        </div>
                      )}

                      {/* Terjemahan Bahasa Indonesia */}
                      {item.translation && (
                        <p className="text-xs leading-relaxed text-slate-600 font-normal pt-1 border-t border-slate-50">
                          {item.translation}
                        </p>
                      )}

                      {/* Bilah Aksi Cepat */}
                      <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100">
                        {/* Tombol Salin */}
                        <button
                          type="button"
                          onClick={() => copyVerseText(item.arabicText, item.translation, item.chapter || chapters[0], item.verseNum)}
                          className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 active:bg-slate-200 text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Salin ayat dan terjemahan"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin</span>
                        </button>

                        {/* Tombol Putar Audio */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsBookmarksViewOpen(false);
                            playVerse(item.surahId, item.verseNum);
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100 text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Putar audio ayat ini"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Putar</span>
                        </button>

                        {/* Tombol Buka / Lompat Langsung ke Ayat */}
                        <button
                          type="button"
                          onClick={() => handleJumpToBookmark(item.surahId, item.verseNum, item.pageNum)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ml-1"
                        >
                          <span>Buka Ayat</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        );
      })()}

      {/* ================= POPUP KONFIRMASI PEMINDAHAN TERAKHIR DIBACA ================= */}
      {confirmLastReadData && (() => {
        const targetChapter = chapters.find((c) => c.id === confirmLastReadData.surahId);
        const oldChapter = settings.lr ? chapters.find((c) => c.id === settings.lr?.s) : null;

        return (
          <div 
            className="fixed inset-0 z-[100075] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
            onClick={() => setConfirmLastReadData(null)}
          >
            <div 
              className="bg-white rounded-3xl w-full max-w-sm flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 p-5 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-tight">
                    Pindahkan Terakhir Dibaca?
                  </h3>
                  <p className="text-[11px] text-slate-400">Konfirmasi pemindahan penanda bacaan</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-2 text-xs">
                {settings.lr ? (
                  <>
                    <div className="text-slate-500">
                      Penanda saat ini: <span className="font-bold text-slate-700">QS. {oldChapter?.name || settings.lr.s} : Ayat {settings.lr.v}</span>
                    </div>
                    <div className="text-slate-800">
                      Pindahkan ke: <span className="font-bold text-emerald-700">QS. {targetChapter?.name || confirmLastReadData.surahId} : Ayat {confirmLastReadData.verseNum}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-800">
                    Tandai <span className="font-bold text-emerald-700">QS. {targetChapter?.name || confirmLastReadData.surahId} : Ayat {confirmLastReadData.verseNum}</span> sebagai terakhir dibaca?
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmLastReadData(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer text-center"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const { surahId, verseNum } = confirmLastReadData;
                    setConfirmLastReadData(null);
                    setSettings((prev) => {
                      const next = { ...prev, lr: { s: surahId, v: verseNum } };
                      saveSettings(next);
                      return next;
                    });
                    const ch = chapters.find((c) => c.id === surahId);
                    showToast(`Terakhir dibaca: QS. ${ch?.name || surahId} : ${verseNum}`);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer text-center"
                >
                  Ya, Pindahkan
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ================= 8. MODAL PERGI KE (SURAH, JUZ, HALAMAN) PERSIS SESUAI SCREENSHOT ================= */}
      {isJumpModalOpen && (
        <div 
          className="fixed inset-0 z-[100065] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsJumpModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-sm flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Judul: "Pergi ke" */}
            <h3 className="font-bold text-lg text-slate-900 leading-tight">
              Pergi ke
            </h3>

            {/* Navigasi Tab: Surah | Juz (Mode Daftar) atau Surah | Juz | Halaman (Mode Mushaf) */}
            <div className="flex border-b border-slate-200/90 -mt-1">
              {(settings.mode === 'wbw' ? (['surah', 'juz'] as const) : (['surah', 'juz', 'page'] as const)).map((tab) => {
                const label = tab === 'surah' ? 'Surah' : tab === 'juz' ? 'Juz' : 'Halaman';
                const effectiveTab = jumpModalTab === 'page' && settings.mode === 'wbw' ? 'surah' : jumpModalTab;
                const isActive = effectiveTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setJumpModalTab(tab)}
                    className={`flex-1 pb-2 text-center text-sm font-semibold transition-colors relative cursor-pointer ${
                      isActive ? 'text-[#009688] font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {label}
                    {isActive && (
                      <span className="absolute bottom-0 inset-x-4 h-0.5 bg-[#009688] rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* TAB 1: SURAH (PENCARI SURAH DENGAN DROPDOWN SENDIRI & NOMOR AYAT) */}
            {(jumpModalTab === 'surah' || (jumpModalTab === 'page' && settings.mode === 'wbw')) && (() => {
              const selectedCh = chapters.find((c) => c.id === selectedJumpSurahId) || chapters[0];
              const totalAyat = selectedCh?.count || 286;

              const filteredSurahs = chapters.filter((c) => {
                if (!surahPickerSearch.trim()) return true;
                const q = surahPickerSearch.trim().toLowerCase();
                const nameMatch = c.name.toLowerCase().includes(q);
                const idMatch = String(c.id) === q || String(c.id).startsWith(q);
                const arabicMatch = (c.ar || '').includes(q);
                const transMatch = (c.tn || '').toLowerCase().includes(q);
                return nameMatch || idMatch || arabicMatch || transMatch;
              });

              return (
                <div className="space-y-4 pt-1 relative">
                  {/* Pilihan Surah - Membuka Halaman Penuh Daftar Surat */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-600">
                      Pilih Surah
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setFullscreenSurahSearch('');
                        setIsFullscreenSurahPickerOpen(true);
                      }}
                      className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl px-3.5 py-2.5 text-left transition-colors cursor-pointer group shadow-2xs"
                      title="Buka Halaman Penuh Pilih Surat"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span className="w-6 h-6 rounded-md bg-[#009688] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {selectedJumpSurahId}
                        </span>
                        <div className="truncate">
                          <span className="font-semibold text-sm text-slate-800">
                            {selectedCh?.name}
                          </span>
                          <span className="text-[11px] text-slate-500 ml-1.5 hidden sm:inline">
                            ({totalAyat} Ayat)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span 
                          className="surah-toc-name text-slate-700 text-xl leading-none"
                          style={{
                            fontFamily: isSurahFontLoaded 
                              ? "'surah-name-v4-icon', 'Aref Ruqaa', serif" 
                              : "'Aref Ruqaa', 'Amiri Quran', serif"
                          }}
                          translate="no"
                        >
                          {isSurahFontLoaded ? `surah${pad(selectedJumpSurahId, 3)}` : selectedCh?.ar}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                      </div>
                    </button>
                  </div>

                  {/* Input Nomor Ayat */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-600">
                      Masukkan nomor ayat antara 1 - {totalAyat}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={totalAyat}
                      placeholder={`1 - ${totalAyat}`}
                      value={jumpAyahInput}
                      onFocus={(e) => e.currentTarget.select()}
                      onClick={(e) => e.currentTarget.select()}
                      onChange={(e) => handleAyahInputChange(e.target.value, totalAyat)}
                      onKeyDown={(e) => {
                        if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                          e.preventDefault();
                        }
                        if (e.key === 'Enter') {
                          handleConfirmJumpSurah();
                        }
                      }}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#009688] focus:border-transparent"
                    />
                  </div>

                  {/* Tombol Aksi Batal & Oke */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsJumpModalOpen(false)}
                      className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer text-center"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmJumpSurah}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-[#009688] hover:bg-[#00897b] active:bg-[#00796b] text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer text-center"
                    >
                      Oke
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* TAB 2: JUZ (KOTAK INPUT NOMOR JUZ TANPA DROPDOWN & TANPA PILIHAN DI BAWAHNYA) */}
            {jumpModalTab === 'juz' && (
              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-600">
                    Masukkan nomor juz antara 1 - 30
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    placeholder="1 - 30"
                    value={jumpJuzInput}
                    onFocus={(e) => e.currentTarget.select()}
                    onClick={(e) => e.currentTarget.select()}
                    onChange={(e) => handleJuzInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                        e.preventDefault();
                      }
                      if (e.key === 'Enter') {
                        handleConfirmJumpJuz();
                      }
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#009688] focus:border-transparent"
                  />
                </div>

                {/* Tombol Aksi Batal & Oke */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsJumpModalOpen(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer text-center"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmJumpJuz()}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#009688] hover:bg-[#00897b] active:bg-[#00796b] text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer text-center"
                  >
                    Oke
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: HALAMAN (HANYA MUNCUL DI MODE MUSHAF, TANPA PILIHAN SURAT DI BAWAHNYA) */}
            {jumpModalTab === 'page' && settings.mode === 'read' && (
              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-600">
                    Masukkan nomor halaman antara 1 - 604
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="604"
                    placeholder={`1 - 604 (saat ini Hal. ${curPage})`}
                    value={jumpPageInput}
                    onFocus={(e) => e.currentTarget.select()}
                    onClick={(e) => e.currentTarget.select()}
                    onChange={(e) => handlePageInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                        e.preventDefault();
                      }
                      if (e.key === 'Enter') {
                        handleConfirmJumpPage();
                      }
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#009688] focus:border-transparent"
                  />
                </div>

                {/* Tombol Aksi Batal & Oke */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsJumpModalOpen(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer text-center"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmJumpPage}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#009688] hover:bg-[#00897b] active:bg-[#00796b] text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer text-center"
                  >
                    Oke
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= 9. HALAMAN PENUH PILIH SURAH (DARI MODAL PERGI KE) ================= */}
      {isFullscreenSurahPickerOpen && (
        <div className="fixed inset-0 z-[100085] bg-white text-slate-800 flex flex-col font-sans select-none overflow-hidden max-w-lg mx-auto shadow-2xl border-x border-slate-200 animate-in fade-in zoom-in-98 duration-150">
          {/* Header Bersih */}
          <header className="bg-[#4f9a50] text-white flex items-center justify-between px-3 h-14 pt-safe shrink-0 shadow-sm z-10">
            <button
              type="button"
              onClick={() => setIsFullscreenSurahPickerOpen(false)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 active:bg-white/30 transition-colors cursor-pointer"
              title="Kembali ke Pergi ke"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-base sm:text-lg text-white tracking-wide">
              Pilih Surah
            </h3>

            <div className="w-10 h-10" />
          </header>

          {/* Kolom Pencari di Atas */}
          <div className="p-3.5 border-b border-slate-200/80 bg-slate-50/80 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                placeholder="Cari nama atau nomor surat..."
                value={fullscreenSurahSearch}
                onChange={(e) => setFullscreenSurahSearch(e.target.value)}
                autoFocus
                className="w-full pl-9.5 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#009688] focus:border-transparent shadow-xs"
              />
              {fullscreenSurahSearch && (
                <button
                  type="button"
                  onClick={() => setFullscreenSurahSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Daftar 114 Surat */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {chapters
              .filter((c) => {
                if (!fullscreenSurahSearch.trim()) return true;
                const q = fullscreenSurahSearch.trim().toLowerCase();
                return (
                  c.name.toLowerCase().includes(q) ||
                  c.tn.toLowerCase().includes(q) ||
                  String(c.id) === q ||
                  String(c.id).startsWith(q) ||
                  (c.ar || '').includes(q)
                );
              })
              .map((c) => {
                const isSelected = selectedJumpSurahId === c.id;
                return (
                  <button
                    key={`fs-surah-${c.id}`}
                    type="button"
                    onClick={() => {
                      setSelectedJumpSurahId(c.id);
                      setJumpAyahInput('');
                      setIsFullscreenSurahPickerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3.5 sm:p-4 text-left transition-colors cursor-pointer group ${
                      isSelected ? 'bg-emerald-50/85 font-bold' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Sisi Kiri: Transliterasi Indo */}
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                        isSelected 
                          ? 'bg-[#009688] text-white shadow-xs' 
                          : 'bg-slate-100 text-slate-700 group-hover:bg-emerald-100'
                      }`}>
                        {c.id}
                      </span>
                      <div className="truncate">
                        <div className="text-sm font-semibold text-slate-900 group-hover:text-emerald-800 truncate">
                          {c.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5 font-normal">
                          {c.tn} • {c.count} Ayat
                        </div>
                      </div>
                    </div>

                    {/* Sisi Kanan: Kaligrafi Arab Nama Surat */}
                    <span
                      className="surah-toc-name shrink-0 ml-2 text-slate-800 group-hover:text-emerald-900 text-2xl sm:text-3xl leading-none select-none transition-colors"
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
      )}

      {/* ================= 10. MODAL KETIK NOMOR JUZ (DARI TAMPILAN AWAL BERANDA) ================= */}
      {isHomeJuzModalOpen && (
        <div
          className="fixed inset-0 z-[100065] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsHomeJuzModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-base text-slate-900">
                Pilih Juz
              </h3>
              <button
                type="button"
                onClick={() => setIsHomeJuzModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-600">
                Masukkan nomor juz antara 1 - 30
              </label>
              <input
                type="number"
                min="1"
                max="30"
                placeholder="1 - 30"
                value={homeJuzInput}
                autoFocus
                onFocus={(e) => e.currentTarget.select()}
                onKeyDown={(e) => {
                  if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                    e.preventDefault();
                  }
                  if (e.key === 'Enter') {
                    const val = parseInt(homeJuzInput.trim(), 10);
                    if (!isNaN(val) && val >= 1 && val <= 30) {
                      setIsHomeJuzModalOpen(false);
                      handleConfirmJumpJuz(val);
                      setIsReadingActive(true);
                    } else {
                      showToast('Masukkan nomor juz antara 1 s/d 30');
                    }
                  }
                }}
                onChange={(e) => {
                  const clean = e.target.value.replace(/[^0-9]/g, '');
                  if (!clean) {
                    setHomeJuzInput('');
                    return;
                  }
                  let num = parseInt(clean, 10);
                  if (num <= 0) num = 1;
                  else if (num > 30) num = 30;
                  setHomeJuzInput(String(num));
                }}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#009688] focus:border-transparent text-center"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsHomeJuzModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = parseInt(homeJuzInput.trim(), 10);
                  if (!isNaN(val) && val >= 1 && val <= 30) {
                    setIsHomeJuzModalOpen(false);
                    handleConfirmJumpJuz(val);
                    setIsReadingActive(true);
                  } else {
                    showToast('Masukkan nomor juz antara 1 s/d 30');
                  }
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#009688] text-white hover:bg-[#00796b] shadow-xs transition-colors cursor-pointer"
              >
                Buka Juz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

