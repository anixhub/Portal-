import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ArrowLeft, 
  BookOpen, 
  Sliders, 
  Play, 
  Pause, 
  X, 
  Search, 
  Check, 
  Copy, 
  Clock, 
  Bookmark, 
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  FileText
} from 'lucide-react';
import { useBackHandler } from '../utils/navigationHistory';

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

export interface ChapterItem {
  id: number;
  name: string;
  ar: string;
  tn: string;
  count: number;
  place: string;
  bis: boolean;
}

export interface CompactVerse {
  n: number;
  p: number;
  j: number;
  w: [string, string, string][]; // [uthmani, translation, audio_url]
  t: string; // full translation
}

interface QuranSettings {
  lang: 'id' | 'en';
  size: number; // index in SIZES
  showTr: boolean;
  showWord: boolean;
  mode: 'wbw' | 'read';
  cur: number;
  bm: Record<string, string[]>;
  lr: { s: number; v: number } | null;
  follow: boolean;
}

function loadSettings(): QuranSettings {
  const defaults: QuranSettings = {
    lang: 'id',
    size: 1, // 28px
    showTr: true,
    showWord: true,
    mode: 'wbw',
    cur: 1, // Default Al-Fatihah (Surah 1)
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
        // First time opened is Al-Fatihah (1), or if last read exists use last read surah
        cur: parsed.lr?.s ? Number(parsed.lr.s) : 1
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

interface QuranViewProps {
  isOpen: boolean;
  onClose: () => void;
  initialSurah?: number;
}

export const QuranView: React.FC<QuranViewProps> = ({ isOpen, onClose, initialSurah }) => {
  const [settings, setSettings] = useState<QuranSettings>(loadSettings);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [currentChapter, setCurrentChapter] = useState<ChapterItem | null>(null);
  const [verses, setVerses] = useState<CompactVerse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingVerseNum, setPlayingVerseNum] = useState<number>(0);
  const [playingWordKey, setPlayingWordKey] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wordAudioRef = useRef<HTMLAudioElement | null>(null);

  // Sheets state
  const [isSurahSheetOpen, setIsSurahSheetOpen] = useState(false);
  const [isSettingsSheetOpen, setIsSettingsSheetOpen] = useState(false);
  const [activeVerseSheetNum, setActiveVerseSheetNum] = useState<number | null>(null);
  const [surahSearchQuery, setSurahSearchQuery] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  // Juz & Page tracking
  const [currentJuzInfo, setCurrentJuzInfo] = useState<{ juz: number | string; page: number | string }>({ juz: 29, page: 562 });
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const t = useCallback((key: keyof typeof T_LANG['id']) => {
    return (T_LANG[settings.lang] || T_LANG.id)[key] || key;
  }, [settings.lang]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(null), 2000);
  }, []);

  // Back handler for sheets
  useBackHandler(Boolean(isOpen && isSurahSheetOpen), 'quran-surah-sheet', () => setIsSurahSheetOpen(false));
  useBackHandler(Boolean(isOpen && isSettingsSheetOpen), 'quran-settings-sheet', () => setIsSettingsSheetOpen(false));
  useBackHandler(Boolean(isOpen && activeVerseSheetNum !== null), 'quran-verse-sheet', () => setActiveVerseSheetNum(null));
  useBackHandler(Boolean(isOpen && !isSurahSheetOpen && !isSettingsSheetOpen && activeVerseSheetNum === null), 'quran-main-page', () => {
    stopAudio();
    onClose();
  });

  // Stop audio on close
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setPlayingVerseNum(0);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopAudio();
    }
  }, [isOpen, stopAudio]);

  // Target verse to scroll to (for resuming last read)
  const [targetScrollVerse, setTargetScrollVerse] = useState<number | null>(() => {
    const s = loadSettings();
    return s.lr?.v || null;
  });

  // Pull to next / previous surah state
  const [pullDirection, setPullDirection] = useState<'none' | 'top' | 'bottom'>('none');
  const [pullDistance, setPullDistance] = useState<number>(0);
  const touchStartYRef = useRef<number | null>(null);
  const wheelTimerRef = useRef<number | null>(null);
  const wheelDistanceRef = useRef<number>(0);

  // Previous & Next Surah references
  const prevSurah = currentChapter && currentChapter.id > 1 
    ? (chapters.find((c) => c.id === currentChapter.id - 1) || null)
    : null;

  const nextSurah = currentChapter && currentChapter.id < 114 
    ? (chapters.find((c) => c.id === currentChapter.id + 1) || null)
    : null;

  const goToNextSurah = useCallback(() => {
    if (!currentChapter) return;
    const next = chapters.find((c) => c.id === currentChapter.id + 1);
    if (!next) return;
    stopAudio();
    setCurrentChapter(next);
    showToast(`Membuka QS. ${next.name} (${next.id})`);
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
  }, [chapters, currentChapter, stopAudio, showToast]);

  const goToPrevSurah = useCallback(() => {
    if (!currentChapter) return;
    const prev = chapters.find((c) => c.id === currentChapter.id - 1);
    if (!prev) return;
    stopAudio();
    setCurrentChapter(prev);
    showToast(`Membuka QS. ${prev.name} (${prev.id})`);
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
  }, [chapters, currentChapter, stopAudio, showToast]);

  // Touch handlers for overscroll pull-to-next/prev surah
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!scrollerRef.current) return;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartYRef.current === null || !scrollerRef.current) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartYRef.current;
    const { scrollTop, scrollHeight, clientHeight } = scrollerRef.current;

    // Pulling down at top (to open previous surah)
    if (scrollTop <= 2 && deltaY > 0) {
      const dist = Math.min(100, deltaY * 0.45);
      setPullDirection('top');
      setPullDistance(dist);
      return;
    }

    // Pulling up at bottom (to open next surah)
    if (scrollTop + clientHeight >= scrollHeight - 6 && deltaY < 0) {
      const dist = Math.min(100, -deltaY * 0.45);
      setPullDirection('bottom');
      setPullDistance(dist);
      return;
    }

    if (pullDirection !== 'none') {
      setPullDirection('none');
      setPullDistance(0);
    }
  };

  const handleTouchEnd = () => {
    touchStartYRef.current = null;
    if (pullDistance >= 60) {
      if (pullDirection === 'top' && prevSurah) {
        goToPrevSurah();
      } else if (pullDirection === 'bottom' && nextSurah) {
        goToNextSurah();
      }
    }
    setPullDirection('none');
    setPullDistance(0);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!scrollerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollerRef.current;

    // Overscroll downwards at bottom
    if (scrollTop + clientHeight >= scrollHeight - 6 && e.deltaY > 0) {
      wheelDistanceRef.current += Math.abs(e.deltaY) * 0.4;
      const dist = Math.min(100, wheelDistanceRef.current);
      setPullDirection('bottom');
      setPullDistance(dist);

      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = window.setTimeout(() => {
        if (wheelDistanceRef.current >= 60 && nextSurah) {
          goToNextSurah();
        }
        wheelDistanceRef.current = 0;
        setPullDirection('none');
        setPullDistance(0);
      }, 320);
      return;
    }

    // Overscroll upwards at top
    if (scrollTop <= 2 && e.deltaY < 0) {
      wheelDistanceRef.current += Math.abs(e.deltaY) * 0.4;
      const dist = Math.min(100, wheelDistanceRef.current);
      setPullDirection('top');
      setPullDistance(dist);

      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = window.setTimeout(() => {
        if (wheelDistanceRef.current >= 60 && prevSurah) {
          goToPrevSurah();
        }
        wheelDistanceRef.current = 0;
        setPullDirection('none');
        setPullDistance(0);
      }, 320);
      return;
    }
  };

  // Re-sync when modal opens: first time is Al-Fatihah (1), or last read if present
  useEffect(() => {
    if (isOpen) {
      const s = loadSettings();
      setSettings(s);
      const targetId = initialSurah || (s.lr?.s ? Number(s.lr.s) : 1);
      if (!initialSurah && s.lr?.s) {
        setTargetScrollVerse(Number(s.lr.v));
      } else {
        setTargetScrollVerse(null);
      }
      if (chapters.length > 0) {
        const found = chapters.find((c) => c.id === targetId) || chapters[0];
        setCurrentChapter(found);
      }
    }
  }, [isOpen, initialSurah, chapters]);

  // Load all 114 Chapters once
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
          const targetId = initialSurah || (settings.lr?.s ? Number(settings.lr.s) : 1);
          const found = parsed.find((c: ChapterItem) => c.id === targetId) || parsed[0];
          setCurrentChapter(found);
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
        const list: ChapterItem[] = d.chapters.map((x: any) => ({
          id: x.id,
          name: x.name_simple,
          ar: x.name_arabic,
          tn: x.translated_name?.name || '',
          count: x.verses_count,
          place: x.revelation_place,
          bis: x.bismillah_pre,
        }));
        setChapters(list);
        try {
          localStorage.setItem(cacheKey, JSON.stringify(list));
        } catch (e) {}
        const targetId = initialSurah || (settings.lr?.s ? Number(settings.lr.s) : 1);
        const found = list.find((c) => c.id === targetId) || list[0];
        setCurrentChapter(found);
      })
      .catch((err) => {
        if (!isMounted) return;
        setErrorMessage(t('err'));
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, settings.lang, initialSurah, settings.lr, t]);

  // Switch surah immediately when initialSurah prop is passed or changed
  useEffect(() => {
    if (isOpen && initialSurah && chapters.length > 0) {
      const found = chapters.find((c) => c.id === initialSurah);
      if (found && (!currentChapter || currentChapter.id !== initialSurah)) {
        setCurrentChapter(found);
      }
    }
  }, [isOpen, initialSurah, chapters, currentChapter]);

  // Load Verses of Current Chapter
  const loadChapterVerses = useCallback(async (chapterId: number) => {
    stopAudio();
    setIsLoading(true);
    setErrorMessage(null);

    const cacheKey = `qwbw:s:${settings.lang}:${chapterId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVerses(parsed);
          setIsLoading(false);
          if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
          return;
        }
      } catch (e) {}
    }

    try {
      // Fetch Page 1 first
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

      setVerses(allCompact);
      try {
        localStorage.setItem(cacheKey, JSON.stringify(allCompact));
      } catch (e) {}
      if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
    } catch (err: any) {
      setErrorMessage(t('err'));
    } finally {
      setIsLoading(false);
    }
  }, [settings.lang, stopAudio, t]);

  useEffect(() => {
    if (currentChapter) {
      loadChapterVerses(currentChapter.id);
      setSettings((prev) => {
        const next = { ...prev, cur: currentChapter.id };
        saveSettings(next);
        return next;
      });
    }
  }, [currentChapter, loadChapterVerses]);

  // Auto scroll to target verse (last read) when verses load
  useEffect(() => {
    if (targetScrollVerse && currentChapter && !isLoading && verses.length > 0) {
      const vNum = targetScrollVerse;
      setTargetScrollVerse(null);
      const timer = window.setTimeout(() => {
        const el = scrollerRef.current?.querySelector(`[data-verse-num="${vNum}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          showToast(`Melanjutkan ayat terakhir dibaca: Ayat ${vNum}`);
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [targetScrollVerse, currentChapter, isLoading, verses, showToast]);

  // Handle Scroll to update Juz & Page
  const handleScroll = useCallback(() => {
    if (!scrollerRef.current || verses.length === 0) return;
    const containerTop = scrollerRef.current.getBoundingClientRect().top + 16;
    const verseElements = scrollerRef.current.querySelectorAll<HTMLElement>('[data-verse-num]');
    
    for (let i = 0; i < verseElements.length; i++) {
      const el = verseElements[i];
      const rect = el.getBoundingClientRect();
      if (rect.bottom > containerTop) {
        const n = parseInt(el.dataset.verseNum || '1', 10);
        const v = verses.find((x) => x.n === n);
        if (v) {
          setCurrentJuzInfo({ juz: v.j, page: v.p });
        }
        break;
      }
    }
  }, [verses]);

  // Audio Play Verse
  const playVerse = useCallback((num: number) => {
    if (!currentChapter) return;
    const v = verses.find((x) => x.n === num);
    if (!v) {
      stopAudio();
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    setPlayingVerseNum(num);
    setIsPlaying(true);

    const surahPadded = pad(currentChapter.id, 3);
    const versePadded = pad(num, 3);
    const audioUrl = `${AUDIO_VERSE}${surahPadded}${versePadded}.mp3`;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onended = () => {
      if (num < currentChapter.count) {
        playVerse(num + 1);
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
      const targetEl = scrollerRef.current.querySelector(`[data-verse-num="${num}"]`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [currentChapter, verses, settings.follow, stopAudio, showToast, t]);

  const togglePlay = () => {
    if (!isPlaying) {
      const startNum = playingVerseNum > 0 ? playingVerseNum : (verses[0]?.n || 1);
      playVerse(startNum);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
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
    setActiveVerseSheetNum(null);
  };

  // Copy Verse Text
  const copyVerse = (v: CompactVerse) => {
    if (!currentChapter) return;
    const arabicWords = v.w.map((item) => item[0]).join(' ');
    const copyString = `${arabicWords}\n\n"${v.t}"\n\n(QS. ${currentChapter.name} [${currentChapter.id}]: Ayat ${v.n})`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(copyString).then(() => showToast(t('copied')));
    } else {
      const ta = document.createElement('textarea');
      ta.value = copyString;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        showToast(t('copied'));
      } catch (e) {}
      document.body.removeChild(ta);
    }
    setActiveVerseSheetNum(null);
  };

  if (!isOpen) return null;

  const currentFontSize = SIZES[settings.size] || 28;

  return (
    <div className="fixed inset-0 z-[100050] bg-white text-slate-800 flex flex-col font-sans select-none overflow-hidden max-w-lg mx-auto shadow-2xl border-x border-slate-200">
      {/* ================= 1. TOP GREEN HEADER ================= */}
      <header className="bg-[#4f9a50] text-white flex items-center justify-between px-3 h-14 shrink-0 shadow-sm z-30 pt-safe">
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

        {/* Surah Title Picker */}
        <button
          type="button"
          onClick={() => {
            setSurahSearchQuery('');
            setIsSurahSheetOpen(true);
          }}
          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl hover:bg-white/10 active:bg-white/20 transition-all cursor-pointer min-w-0"
        >
          <span className="font-semibold text-sm sm:text-base truncate tracking-wide">
            {currentChapter ? `${currentChapter.id}. ${currentChapter.name}` : 'Al-Qur\'an'}
          </span>
          <ChevronDown className="w-4 h-4 shrink-0 opacity-80" />
        </button>

        <div className="flex items-center gap-0.5">
          {/* Mode Switcher: Per Kata vs Mode Baca */}
          <button
            type="button"
            onClick={() => {
              const nextMode: 'wbw' | 'read' = settings.mode === 'wbw' ? 'read' : 'wbw';
              setSettings((prev) => {
                const updated: QuranSettings = { ...prev, mode: nextMode };
                saveSettings(updated);
                return updated;
              });
              showToast(nextMode === 'wbw' ? t('wbw') : t('reading'));
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 active:bg-white/30 transition-colors cursor-pointer"
            title={settings.mode === 'wbw' ? t('reading') : t('wbw')}
          >
            {settings.mode === 'wbw' ? (
              <BookOpen className="w-5 h-5" />
            ) : (
              <FileText className="w-5 h-5" />
            )}
          </button>

          {/* Settings Button */}
          <button
            type="button"
            onClick={() => setIsSettingsSheetOpen(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 active:bg-white/30 transition-colors cursor-pointer"
            title={t('settings')}
          >
            <Sliders className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ================= 2. JUZ & PAGE STRIP ================= */}
      <div className="bg-[#c9e1c9] text-[#224422] text-xs font-semibold py-1.5 px-4 text-center shrink-0 tracking-wide shadow-2xs">
        {t('juz')} {currentJuzInfo.juz} : {t('page')} {currentJuzInfo.page}
      </div>

      {/* ================= 3. SCROLLABLE VERSES CONTENT ================= */}
      <main
        ref={scrollerRef}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        className="flex-1 overflow-y-auto bg-white overscroll-contain pb-20 select-text"
        tabIndex={-1}
      >
        {/* PULL DOWN FOR PREVIOUS SURAH INDICATOR */}
        <div 
          className={`overflow-hidden transition-all duration-200 bg-gradient-to-b from-emerald-50 to-white border-b border-emerald-100 flex flex-col items-center justify-center text-center px-4 ${
            pullDirection === 'top' && pullDistance > 0 ? 'py-3 opacity-100' : 'h-0 py-0 opacity-0 border-none'
          }`}
          style={{ minHeight: pullDirection === 'top' && pullDistance > 0 ? `${Math.max(52, pullDistance)}px` : '0px' }}
        >
          {prevSurah ? (
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                pullDistance >= 60 ? 'bg-[#4f9a50] text-white rotate-180 shadow-md scale-110' : 'bg-emerald-100 text-[#4f9a50]'
              }`}>
                <ArrowDown className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                {pullDistance >= 60 ? (
                  <span className="text-[#2e9e45]">Lepaskan untuk membuka surat sebelumnya:</span>
                ) : (
                  <span>Tarik terus ke bawah untuk membuka surat sebelumnya:</span>
                )}
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-emerald-200 rounded-full shadow-2xs text-[11px] font-bold text-emerald-800">
                <span>QS. {prevSurah.id}. {prevSurah.name}</span>
                <span className="text-slate-400 font-normal">({prevSurah.count} ayat)</span>
                <span className="font-arabic font-normal text-xs ml-1">{prevSurah.ar}</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 font-medium py-1">
              Ini adalah surat pertama (QS. Al-Fatihah)
            </div>
          )}
        </div>

        {/* Intro Card */}
        {currentChapter && (
          <div className="text-center pt-5 pb-3 px-4 border-b border-slate-100 bg-slate-50/50">
            <h1 className="text-xl font-bold font-display text-slate-900">
              {currentChapter.tn || currentChapter.name}
            </h1>
            <div className="flex items-center justify-center gap-4 text-xs text-slate-500 font-medium mt-1">
              <span className="capitalize">{currentChapter.place === 'madinah' ? 'Madaniyah' : 'Makkiyah'}</span>
              <span>•</span>
              <span>{t('ayahs')}: {currentChapter.count}</span>
            </div>

            {/* Bismillah */}
            {currentChapter.bis && (
              <div 
                className="font-arabic text-3xl sm:text-4xl text-slate-900 mt-4 mb-2 leading-relaxed tracking-wide text-center"
                dir="rtl"
                style={{ fontFamily: "'Amiri Quran', 'Scheherazade New', serif" }}
              >
                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
              </div>
            )}
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 text-xs gap-3">
            <div className="w-8 h-8 rounded-full border-3 border-slate-200 border-t-[#4f9a50] animate-spin" />
            <span>{t('loading')}</span>
          </div>
        )}

        {/* Error State */}
        {errorMessage && !isLoading && (
          <div className="py-20 px-6 text-center text-slate-500 space-y-3">
            <p className="text-xs">{errorMessage}</p>
            <button
              type="button"
              onClick={() => currentChapter && loadChapterVerses(currentChapter.id)}
              className="bg-[#4f9a50] text-white px-5 py-2 rounded-full text-xs font-semibold cursor-pointer shadow-md hover:bg-[#438344]"
            >
              {t('retry')}
            </button>
          </div>
        )}

        {/* ================= VERSES: WORD BY WORD MODE ================= */}
        {!isLoading && !errorMessage && settings.mode === 'wbw' && (
          <div className="divide-y divide-slate-100">
            {verses.map((v) => {
              const isVersePlaying = isPlaying && playingVerseNum === v.n;
              const verseKey = `${currentChapter?.id}:${v.n}`;
              const activeBookmarks = settings.bm[verseKey] || [];
              const isLastRead = settings.lr?.s === currentChapter?.id && settings.lr?.v === v.n;

              return (
                <article
                  key={v.n}
                  data-verse-num={v.n}
                  className={`p-4 transition-colors ${
                    isVersePlaying ? 'bg-[#e6f3e3]' : v.n % 2 === 0 ? 'bg-slate-50/60' : 'bg-white'
                  }`}
                >
                  {/* Verse Header */}
                  <div className="flex items-center justify-between gap-2 min-h-7 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                        {v.n}
                      </span>

                      {/* Active Bookmarks & Last Read */}
                      {isLastRead && (
                        <span className="text-[#2e9e45] flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px] font-bold" title={t('last')}>
                          <Clock className="w-3.5 h-3.5" />
                          <span>Terakhir Dibaca</span>
                        </span>
                      )}
                      {activeBookmarks.map((color) => (
                        <span key={color} style={{ color: COLORS[color] }}>
                          <Bookmark className="w-4 h-4 fill-current" />
                        </span>
                      ))}
                    </div>

                    {/* Actions Button */}
                    <button
                      type="button"
                      onClick={() => setActiveVerseSheetNum(v.n)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      title={`${t('verse')} ${v.n}`}
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Words Flow (RTL - flows naturally from Right to Left) */}
                  <div 
                    className="flex flex-wrap justify-start gap-x-2.5 gap-y-3.5 my-3"
                    dir="rtl"
                  >
                    {v.w.map((w, idx) => {
                      const wordKey = `${v.n}-${idx}`;
                      const isWordPlaying = playingWordKey === wordKey;

                      return (
                        <div
                          key={idx}
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
                              fontFamily: "'Amiri Quran', 'Scheherazade New', serif"
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

        {/* ================= VERSES: MUSHAF / READING MODE ================= */}
        {!isLoading && !errorMessage && settings.mode === 'read' && (
          <div 
            className="p-5 text-right text-justify leading-[2.8] font-arabic text-slate-900"
            dir="rtl"
            style={{ 
              fontSize: `${currentFontSize + 2}px`,
              fontFamily: "'Amiri Quran', 'Scheherazade New', serif"
            }}
          >
            {verses.map((v) => {
              const isVersePlaying = isPlaying && playingVerseNum === v.n;
              const arabicText = v.w.map((w) => w[0]).join(' ');

              return (
                <span
                  key={v.n}
                  data-verse-num={v.n}
                  className={`inline rounded-md px-1 transition-colors ${
                    isVersePlaying ? 'bg-[#c9e1c9]' : ''
                  }`}
                >
                  <span dir="rtl">{arabicText} </span>
                  <span
                    onClick={() => setActiveVerseSheetNum(v.n)}
                    className="inline-flex items-center text-[#4f9a50] text-[0.78em] font-sans font-bold cursor-pointer mx-1 hover:underline select-none"
                    title={`Menu Ayat ${v.n}`}
                    dir="ltr"
                  >
                    ۝{arDigits(v.n)}
                  </span>
                  {' '}
                </span>
              );
            })}
          </div>
        )}

        {/* End of Surah Navigation Card */}
        {!isLoading && !errorMessage && currentChapter && (
          <div className="p-4 mx-4 my-6 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center space-y-3">
            <div className="text-xs text-slate-500 font-medium">
              Akhir dari QS. {currentChapter.name} ({currentChapter.count} Ayat)
            </div>
            {nextSurah ? (
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={goToNextSurah}
                  className="w-full py-2.5 px-4 bg-[#4f9a50] hover:bg-[#438344] active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Lanjut ke Surat Berikutnya: QS. {nextSurah.name} ({nextSurah.id})</span>
                  <ChevronDown className="w-4 h-4 -rotate-90" />
                </button>
                <p className="text-[11px] text-slate-400">
                  Atau tarik / scroll terus ke atas untuk langsung membuka surat berikutnya
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-medium">
                Shadaqallahul 'Adzim • Telah sampai di akhir Al-Qur'an (QS. An-Nas)
              </p>
            )}
          </div>
        )}

        {/* PULL UP FOR NEXT SURAH INDICATOR */}
        <div 
          className={`overflow-hidden transition-all duration-200 bg-gradient-to-t from-emerald-50 to-white border-t border-emerald-100 flex flex-col items-center justify-center text-center px-4 mb-2 ${
            pullDirection === 'bottom' && pullDistance > 0 ? 'py-4 opacity-100' : 'h-0 py-0 opacity-0 border-none'
          }`}
          style={{ minHeight: pullDirection === 'bottom' && pullDistance > 0 ? `${Math.max(52, pullDistance)}px` : '0px' }}
        >
          {nextSurah ? (
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                pullDistance >= 60 ? 'bg-[#4f9a50] text-white rotate-180 shadow-md scale-110' : 'bg-emerald-100 text-[#4f9a50]'
              }`}>
                <ArrowUp className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                {pullDistance >= 60 ? (
                  <span className="text-[#2e9e45]">Lepaskan untuk membuka surat berikutnya:</span>
                ) : (
                  <span>Tarik terus ke atas untuk membuka surat berikutnya:</span>
                )}
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-emerald-200 rounded-full shadow-2xs text-[11px] font-bold text-emerald-800">
                <span>QS. {nextSurah.id}. {nextSurah.name}</span>
                <span className="text-slate-400 font-normal">({nextSurah.count} ayat)</span>
                <span className="font-arabic font-normal text-xs ml-1">{nextSurah.ar}</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 font-medium py-1">
              Ini adalah surat terakhir (QS. An-Nas)
            </div>
          )}
        </div>
      </main>

      {/* ================= 4. BOTTOM ACTION CONTROL BAR ================= */}
      <footer className="bg-[#4f9a50] text-white flex items-center justify-between px-6 h-14 shrink-0 shadow-lg z-30 pb-safe">
        {/* Font size cycler */}
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
          className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-white/20 active:bg-white/30 transition-colors cursor-pointer"
          title={t('arSize')}
        >
          <span className="font-bold text-base">A</span>
          <span className="text-[10px] font-semibold -mt-2">±</span>
        </button>

        {/* Play / Pause Reciter Audio */}
        <button
          type="button"
          onClick={togglePlay}
          className="flex items-center gap-2 px-5 h-10 rounded-full bg-white text-[#4f9a50] font-bold text-xs shadow-md hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
          title={isPlaying ? 'Jeda Audio Murottal' : 'Putar Audio Murottal'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          <span>{isPlaying ? 'Jeda Audio' : 'Putar Murottal'}</span>
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
                  const q = surahSearchQuery.toLowerCase().trim();
                  return (
                    String(c.id) === q ||
                    c.name.toLowerCase().includes(q) ||
                    c.tn.toLowerCase().includes(q) ||
                    c.ar.includes(q)
                  );
                })
                .map((c) => {
                  const isCurrent = currentChapter?.id === c.id;

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setCurrentChapter(c);
                        setIsSurahSheetOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors text-left cursor-pointer ${
                        isCurrent ? 'bg-[#e6f3e3]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#4f9a50] border border-[#4f9a50]/30 font-bold text-xs flex items-center justify-center shrink-0">
                          {c.id}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {c.name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {c.tn} • {c.count} {t('ayahs').toLowerCase()}
                          </p>
                        </div>
                      </div>

                      <span 
                        className="font-arabic text-xl text-slate-700 shrink-0 ml-3"
                        style={{ fontFamily: "'Amiri Quran', 'Scheherazade New', serif" }}
                      >
                        {c.ar}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ================= 6. DRAWER / SHEET: MENU AYAT ================= */}
      {activeVerseSheetNum !== null && currentChapter && (
        <div
          className="fixed inset-0 z-[100060] bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in"
          onClick={() => setActiveVerseSheetNum(null)}
        >
          <div
            className="bg-white rounded-t-3xl max-h-[70vh] flex flex-col shadow-2xl border-t border-slate-100 animate-in slide-in-from-bottom duration-250 p-5 space-y-2 pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                QS. {currentChapter.name} • {t('verse')} {activeVerseSheetNum}
              </h3>
              <button
                type="button"
                onClick={() => setActiveVerseSheetNum(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bookmarks */}
            <div className="space-y-1 pt-1">
              {['blue', 'red', 'green'].map((colorKey) => {
                const verseKey = `${currentChapter.id}:${activeVerseSheetNum}`;
                const hasColor = (settings.bm[verseKey] || []).includes(colorKey);

                return (
                  <button
                    key={colorKey}
                    type="button"
                    onClick={() => toggleBookmark(currentChapter.id, activeVerseSheetNum, colorKey)}
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
                onClick={() => markLastRead(currentChapter.id, activeVerseSheetNum)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-xs font-semibold text-slate-700"
              >
                <Clock className="w-4 h-4 text-[#2e9e45]" />
                <span>{t('last')}</span>
              </button>

              {/* Copy Verse */}
              <button
                type="button"
                onClick={() => {
                  const targetV = verses.find((x) => x.n === activeVerseSheetNum);
                  if (targetV) copyVerse(targetV);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-xs font-semibold text-slate-700"
              >
                <Copy className="w-4 h-4 text-slate-600" />
                <span>{t('copy')}</span>
              </button>

              {/* Play from this verse */}
              <button
                type="button"
                onClick={() => {
                  setActiveVerseSheetNum(null);
                  playVerse(activeVerseSheetNum);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-xs font-semibold text-slate-700"
              >
                <Play className="w-4 h-4 text-slate-600 fill-current" />
                <span>{t('play')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 7. DRAWER / SHEET: PENGATURAN AL-QUR'AN ================= */}
      {isSettingsSheetOpen && (
        <div
          className="fixed inset-0 z-[100060] bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in"
          onClick={() => setIsSettingsSheetOpen(false)}
        >
          <div
            className="bg-white rounded-t-3xl max-h-[80vh] flex flex-col shadow-2xl border-t border-slate-100 animate-in slide-in-from-bottom duration-250 p-5 space-y-4 pb-safe"
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

            {/* Live Arabic Font Size Preview */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-center">
              <p className="text-[11px] text-slate-400 font-semibold mb-1">Pratinjau Font Arab ({currentFontSize}px)</p>
              <div 
                className="font-arabic text-slate-900 leading-relaxed text-center"
                dir="rtl"
                style={{ 
                  fontSize: `${currentFontSize}px`,
                  fontFamily: "'Amiri Quran', 'Scheherazade New', serif"
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
    </div>
  );
};
