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
  FileText
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
  const [activeVerseSheet, setActiveVerseSheet] = useState<{ surahId: number; verseNum: number } | null>(null);
  const [surahSearchQuery, setSurahSearchQuery] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  // Juz & Page tracking
  const [currentJuzInfo, setCurrentJuzInfo] = useState<{ juz: number | string; page: number | string }>({ juz: 1, page: 1 });
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const bottomSentinelRef = useRef<HTMLDivElement | null>(null);

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

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(null), 2000);
  }, []);

  // Stop audio on close
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingInfo(null);
  }, []);

  // Back handler for sheets
  useBackHandler(Boolean(isOpen && isSurahSheetOpen), 'quran-surah-sheet', () => setIsSurahSheetOpen(false));
  useBackHandler(Boolean(isOpen && isSettingsSheetOpen), 'quran-settings-sheet', () => setIsSettingsSheetOpen(false));
  useBackHandler(Boolean(isOpen && activeVerseSheet !== null), 'quran-verse-sheet', () => setActiveVerseSheet(null));
  useBackHandler(Boolean(isOpen && !isSurahSheetOpen && !isSettingsSheetOpen && activeVerseSheet === null), 'quran-main-page', () => {
    stopAudio();
    onClose();
  });

  useEffect(() => {
    if (!isOpen) {
      stopAudio();
    }
  }, [isOpen, stopAudio]);

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
          const targetId = initialSurah || (settings.lr?.s ? Number(settings.lr.s) : 1);
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

    const surahVerses = versesBySurah[surahId];
    const v = surahVerses?.find((x) => x.n === num);
    if (!v && surahVerses) {
      stopAudio();
      return;
    }

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
  }, [chapters, versesBySurah, settings.follow, stopAudio, showToast, t]);

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

  // Copy Verse Text
  const copyVerse = (v: CompactVerse, chapter: ChapterItem) => {
    const arabicWords = v.w.map((item) => item[0]).join(' ');
    const copyString = `${arabicWords}\n\n"${v.t}"\n\n(QS. ${chapter.name} [${chapter.id}]: Ayat ${v.n})`;
    
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
    setActiveVerseSheet(null);
  };

  // Surah Selection from Drawer
  const handleSelectSurah = (selectedId: number) => {
    setIsSurahSheetOpen(false);
    setActiveSurahId(selectedId);
    stopAudio();

    if (loadedSurahIds.includes(selectedId)) {
      // Already loaded, scroll straight to it
      const el = scrollerRef.current?.querySelector(`#surah-section-${selectedId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // Set stream starting from selected surah
      setLoadedSurahIds([selectedId]);
      if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
    }

    const c = chapters.find((x) => x.id === selectedId);
    if (c) {
      showToast(`Membuka QS. ${c.name} (${c.id})`);
    }
  };

  // Display mode switcher
  const toggleDisplayMode = () => {
    const nextMode: 'wbw' | 'read' = settings.mode === 'wbw' ? 'read' : 'wbw';
    setSettings((prev) => {
      const updated: QuranSettings = { ...prev, mode: nextMode };
      saveSettings(updated);
      return updated;
    });
    showToast(nextMode === 'wbw' ? 'Mode Kata per Kata' : 'Mode Baca Mushaf');
  };

  if (!isOpen) return null;

  const currentFontSize = SIZES[settings.size] || 28;
  const activeChapter = chapters.find((c) => c.id === activeSurahId) || chapters[0] || null;
  const minLoadedSurahId = Math.min(...loadedSurahIds);
  const maxLoadedSurahId = Math.max(...loadedSurahIds);
  const isPlaying = playingInfo !== null;

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

        {/* Surah Title Picker (Displays dynamically tracking currently visible surah) */}
        <button
          type="button"
          onClick={() => {
            setSurahSearchQuery('');
            setIsSurahSheetOpen(true);
          }}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-white/10 active:bg-white/20 transition-all cursor-pointer min-w-0 mx-2"
        >
          <span className="font-semibold text-sm sm:text-base truncate tracking-wide">
            {activeChapter ? `${activeChapter.id}. ${activeChapter.name}` : 'Al-Qur\'an'}
          </span>
          <ChevronDown className="w-4 h-4 shrink-0 opacity-80" />
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
      </header>

      {/* ================= 2. JUZ & PAGE STRIP ================= */}
      <div className="bg-[#c9e1c9] text-[#224422] text-xs font-semibold py-1.5 px-4 text-center shrink-0 tracking-wide shadow-2xs">
        {t('juz')} {currentJuzInfo.juz} : {t('page')} {currentJuzInfo.page}
      </div>

      {/* ================= 3. CONTINUOUS SCROLLABLE VERSES CONTENT ================= */}
      <main
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-white overscroll-contain pb-24 select-text"
        tabIndex={-1}
      >
        {/* SVG Definition for Surah Cartouche Pill */}
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
                            {activeBookmarks.map((color, bIdx) => (
                              <span key={`${verseKey}-bm-${color}-${bIdx}`} style={{ color: COLORS[color] }}>
                                <Bookmark className="w-4 h-4 fill-current" />
                              </span>
                            ))}
                          </div>

                          {/* Actions Button */}
                          <button
                            type="button"
                            onClick={() => setActiveVerseSheet({ surahId, verseNum: v.n })}
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

              {/* Verses for this Surah: Mushaf / Reading Mode */}
              {settings.mode === 'read' && surahVerses.length > 0 && (
                <div 
                  className="p-4 sm:p-5 text-right text-justify leading-[2.8] font-arabic text-slate-900 border-b border-slate-100"
                  dir="rtl"
                  style={{ 
                    fontSize: `${currentFontSize + 2}px`,
                    fontFamily: "'Amiri Quran', 'Scheherazade New', serif"
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
                        className={`inline rounded-md px-1 transition-colors ${
                          isVersePlaying ? 'bg-[#c9e1c9]' : ''
                        }`}
                      >
                        <span dir="rtl">{arabicText} </span>
                        <span
                          onClick={() => setActiveVerseSheet({ surahId, verseNum: v.n })}
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

      {/* ================= 4. BOTTOM ACTION CONTROL BAR ================= */}
      {/* Display mode button is located here at the bottom as requested */}
      <footer className="bg-[#4f9a50] text-white flex items-center justify-between px-4 sm:px-6 h-14 shrink-0 shadow-lg z-30 pb-safe">
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
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 active:bg-white/30 transition-colors cursor-pointer"
          title={t('arSize')}
        >
          <span className="font-bold text-base">A</span>
          <span className="text-[10px] font-semibold -mt-2">±</span>
        </button>

        {/* Display Mode Switcher (Mode Kata per Kata vs Mode Baca Mushaf) */}
        <button
          type="button"
          onClick={toggleDisplayMode}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/35 text-white font-medium text-xs transition-all cursor-pointer border border-white/25 shadow-2xs"
          title={settings.mode === 'wbw' ? 'Beralih ke Mode Baca Mushaf' : 'Beralih ke Mode Kata per Kata'}
        >
          {settings.mode === 'wbw' ? (
            <>
              <BookOpen className="w-4 h-4 text-white" />
              <span>Mode Mushaf</span>
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 text-white" />
              <span>Per Kata</span>
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
        if (!chapter) return null;

        return (
          <div
            className="fixed inset-0 z-[100060] bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in"
            onClick={() => setActiveVerseSheet(null)}
          >
            <div
              className="bg-white rounded-t-3xl max-h-[80vh] flex flex-col shadow-2xl border-t border-slate-100 animate-in slide-in-from-bottom duration-250 p-5 space-y-3 pb-safe"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    QS. {chapter.name} : {t('verse')} {activeVerseSheet.verseNum}
                  </h3>
                  <p className="text-[11px] text-slate-400">Pilih aksi untuk ayat ini</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveVerseSheet(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Bookmarks */}
              <div className="space-y-1 pt-1">
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
                  onClick={() => {
                    if (targetV) copyVerse(targetV, chapter);
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
