import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  ArrowLeft, 
  Settings, 
  Moon, 
  Sun, 
  Menu
} from 'lucide-react';
import { useBackHandler } from '../utils/navigationHistory';
import { 
  R, 
  buildMaulidBooks, 
  ordAr, 
  getHijriDate, 
  ad, 
  isSl, 
  MaulidBook, 
  ChapterItem 
} from '../data/maulidData';

interface MaulidViewProps {
  isOpen: boolean;
  onClose: () => void;
  initialBookId?: string; // 'b' | 's' | 'd' | 'a'
  initialChapterIndex?: number;
}

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

  // Settings: font size & theme
  const [fontSize, setFontSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('fs');
      return saved ? Math.min(48, Math.max(18, parseInt(saved, 10))) : 26;
    } catch (e) {
      return 26;
    }
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('maulid_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (e) {
      return 'light';
    }
  });

  const [isFontSettingOpen, setIsFontSettingOpen] = useState(false);
  const [openToggles, setOpenToggles] = useState<Record<string, boolean>>({});

  // Hint / Pull to next/prev chapter state
  const [hintVisible, setHintVisible] = useState(false);
  const [hintType, setHintType] = useState<'top' | 'bottom'>('top');
  const [hintText, setHintText] = useState('');
  const [hintProgress, setHintProgress] = useState(0);

  // Touch and wheel pull tracking refs
  const baseTouchYRef = useRef<number | null>(null);
  const pullDirRef = useRef<number>(0);
  const pullAmountRef = useRef<number>(0);
  const wheelTimerRef = useRef<number | null>(null);

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const readerRef = useRef<HTMLDivElement | null>(null);
  const headerBgRef = useRef<HTMLDivElement | null>(null);
  const titleHeaderRef = useRef<HTMLSpanElement | null>(null);
  const subTitleHeaderRef = useRef<HTMLSpanElement | null>(null);
  const bigTitleRef = useRef<HTMLDivElement | null>(null);
  const heroHeaderRef = useRef<HTMLDivElement | null>(null);

  // Back handling
  useBackHandler(Boolean(isOpen && currentView === 'read'), 'maulid-read-view', () => {
    setCurrentView('toc');
  });

  useBackHandler(Boolean(isOpen && currentView === 'toc'), 'maulid-toc-view', () => {
    setCurrentView('home');
  });

  useBackHandler(Boolean(isOpen && currentView === 'home'), 'maulid-home-view', () => {
    onClose();
  });

  // Open book handler
  const openBook = useCallback((idx: number) => {
    setActiveBookIndex(idx);
    setCurrentView('toc');
    setIsFontSettingOpen(false);
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
  }, []);

  // Open chapter handler
  const openChapter = useCallback((chapterIdx: number) => {
    setActiveChapterIndex(chapterIdx);
    setCurrentView('read');
    setIsFontSettingOpen(false);
    setOpenToggles({});
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
        localStorage.setItem('fs', String(next));
      } catch (e) {}
      return next;
    });
  }, []);

  // Toggle Theme
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('maulid_theme', next);
      } catch (e) {}
      return next;
    });
  }, []);

  // Helpers for numbering
  const currentBook = books[activeBookIndex] || books[0];
  const numChaptersBefore = useCallback((j: number) => {
    return currentBook.ch.slice(0, j + 1).filter((c) => !c.i).length;
  }, [currentBook]);

  const chapterLabel = useCallback((t: number) => {
    const ch = currentBook.ch[t];
    if (!ch) return '';
    return ch.i ? (ch.lb || "مُقَدِّمَةٌ") : ordAr(numChaptersBefore(t));
  }, [currentBook, numChaptersBefore]);

  // Scroll effect on TOC header
  const handleTocScroll = useCallback(() => {
    const sc = scrollerRef.current;
    const hh = heroHeaderRef.current;
    if (!sc || !hh) return;
    const r = Math.max(1, hh.offsetHeight - 56 - 18);
    const p = Math.min(1, Math.max(0, sc.scrollTop / r));

    if (headerBgRef.current) headerBgRef.current.style.opacity = String(p);
    if (titleHeaderRef.current) titleHeaderRef.current.style.opacity = String(Math.max(0, 1 - p * 2.2));
    if (subTitleHeaderRef.current) subTitleHeaderRef.current.style.opacity = String(Math.min(1, Math.max(0, (p - 0.45) * 2.2)));
    if (bigTitleRef.current) {
      bigTitleRef.current.style.opacity = String(Math.max(0, 1 - p * 1.15));
      bigTitleRef.current.style.transform = `scale(${1 - 0.3 * p})`;
    }
  }, []);

  // Edge detection in Reader for pull-to-change chapter
  const checkEdge = useCallback(() => {
    const rd = readerRef.current;
    if (!rd) return 0;
    if (rd.scrollTop <= 1) return -1;
    if (rd.scrollTop + rd.clientHeight >= rd.scrollHeight - 1) return 1;
    return 0;
  }, []);

  const getTargetChapter = useCallback((dir: number) => {
    const n = activeChapterIndex + dir;
    const list = currentBook.ch;
    return n >= 0 && n < list.length ? n : null;
  }, [activeChapterIndex, currentBook]);

  const updateHintUi = useCallback((dir: number, pull: number) => {
    const TH = 110;
    const target = getTargetChapter(dir);
    setHintType(dir < 0 ? 'top' : 'bottom');
    setHintVisible(true);

    if (target === null) {
      setHintText(dir < 0 ? "Awal kitab" : "Akhir kitab");
    } else {
      const prefix = pull >= TH 
        ? "Lepas untuk membuka: " 
        : (dir < 0 ? "Tarik terus ke bab sebelumnya: " : "Tarik terus ke bab berikutnya: ");
      const label = chapterLabel(target) + " · " + currentBook.ch[target].t;
      setHintText(prefix + label);
    }
    setHintProgress(Math.min(100, (pull / TH) * 100));
  }, [chapterLabel, currentBook, getTargetChapter]);

  const finishPull = useCallback(() => {
    const TH = 110;
    if (pullDirRef.current && pullAmountRef.current >= TH) {
      const target = getTargetChapter(pullDirRef.current);
      if (target !== null) {
        openChapter(target);
      }
    }
    setHintVisible(false);
    baseTouchYRef.current = null;
    pullDirRef.current = 0;
    pullAmountRef.current = 0;
  }, [getTargetChapter, openChapter]);

  // Touch handlers in reader
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    baseTouchYRef.current = null;
    pullDirRef.current = 0;
    pullAmountRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const y = e.touches[0].clientY;
    const ed = checkEdge();
    if (!ed) {
      baseTouchYRef.current = null;
      pullDirRef.current = 0;
      pullAmountRef.current = 0;
      setHintVisible(false);
      return;
    }

    if (baseTouchYRef.current === null) {
      baseTouchYRef.current = y;
      pullDirRef.current = ed;
    }

    const dy = (y - baseTouchYRef.current) * (pullDirRef.current < 0 ? 1 : -1);
    const pull = Math.max(0, dy);
    pullAmountRef.current = pull;

    if (pull > 6) {
      updateHintUi(pullDirRef.current, pull);
    } else {
      setHintVisible(false);
    }
  };

  const handleTouchEnd = () => {
    finishPull();
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const ed = checkEdge();
    if (!ed || (ed < 0 && e.deltaY > 0) || (ed > 0 && e.deltaY < 0)) return;

    pullDirRef.current = ed;
    pullAmountRef.current += Math.abs(e.deltaY);
    updateHintUi(pullDirRef.current, pullAmountRef.current);

    if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
    wheelTimerRef.current = window.setTimeout(finishPull, 350);
  };

  const hijriText = useMemo(() => getHijriDate(), []);

  if (!isOpen) return null;

  const currentChapter = currentBook.ch[activeChapterIndex] || currentBook.ch[0];

  return (
    <div
      data-theme={theme}
      style={{
        '--bg': theme === 'dark' ? '#14120d' : '#f7f2e7',
        '--sf': theme === 'dark' ? '#1d1a12' : '#fffdf7',
        '--tx': theme === 'dark' ? '#eee6d0' : '#2a2418',
        '--mu': theme === 'dark' ? '#a09676' : '#8a7d62',
        '--ac': theme === 'dark' ? '#5cc4a0' : '#1f6b53',
        '--ln': theme === 'dark' ? '#332e20' : '#e3d9bf',
        '--gd': theme === 'dark' ? '#d4b25a' : '#b08a2e',
        '--fs': `${fontSize}px`,
      } as React.CSSProperties}
      className="fixed inset-0 z-[100050] bg-[var(--bg)] text-[var(--tx)] font-sans flex flex-col select-none overflow-hidden max-w-lg mx-auto shadow-2xl border-x border-[var(--ln)]"
    >
      {/* ================= 1. HOME VIEW: LIST OF MAULID BOOKS ================= */}
      {currentView === 'home' && (
        <div className="flex-1 flex flex-col h-full bg-[var(--bg)]">
          {/* Header */}
          <div className="flex items-center justify-between px-3 h-14 border-b border-[var(--ln)] bg-[var(--sf)] shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="text-[var(--ac)] border border-[var(--ln)] rounded-[10px] px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 hover:bg-[var(--bg)] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
            <h2 className="font-arabic text-base font-semibold text-[var(--tx)] m-0">
              مَجْمُوعُ الْمَوَالِدِ
            </h2>
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 rounded-[10px] border border-[var(--ln)] text-[var(--ac)] flex items-center justify-center hover:bg-[var(--bg)] transition-colors cursor-pointer"
              title="Ganti Tema"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* Book List Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            <div className="text-center pt-4 pb-2">
              <div 
                className="text-[34px] text-[var(--gd)] font-arabic leading-relaxed"
                style={{ fontFamily: "'Amiri Quran', serif" }}
              >
                مَجْمُوعُ الْمَوَالِدِ
              </div>
              <p className="text-[var(--mu)] text-xs font-medium mt-1">
                مَجْمُوعُ كُتُبِ الْمَوَالِدِ الشَّرِيفَةِ
              </p>
            </div>

            {/* Book Cards */}
            {books.map((book, idx) => (
              <button
                key={book.id}
                type="button"
                onClick={() => openBook(idx)}
                className="w-full block text-center bg-[var(--sf)] border border-[var(--ln)] rounded-[16px] p-5 my-3 hover:border-[var(--ac)] transition-all active:scale-[0.99] cursor-pointer shadow-2xs group"
              >
                <div 
                  className="font-arabic text-[27px] leading-[2] text-[var(--ac)] group-hover:text-[var(--gd)] transition-colors"
                  style={{ fontFamily: "'Amiri Quran', serif" }}
                >
                  {book.ar}
                </div>
                <small className="block text-[var(--mu)] text-xs mt-1 font-sans">
                  {book.id_}
                </small>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ================= 2. TOC VIEW: TABLE OF CONTENTS ================= */}
      {currentView === 'toc' && (
        <div className="relative flex-1 flex flex-col h-full bg-[var(--bg)] overflow-hidden">
          <div 
            ref={scrollerRef}
            onScroll={handleTocScroll}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-6"
          >
            {/* Sticky Header Bar */}
            <div className="sticky top-0 z-10 h-14 flex items-center justify-between gap-2 px-3 text-white">
              <div 
                ref={headerBgRef} 
                className="absolute inset-0 bg-[#1b5e20] opacity-0 shadow-md transition-opacity duration-150 -z-10" 
              />
              <div className="flex items-center gap-1.5 min-w-[82px]">
                <button
                  type="button"
                  onClick={() => setCurrentView('home')}
                  className="w-9 h-9 rounded-full bg-white/15 border-0 flex items-center justify-center text-white hover:bg-white/25 active:bg-white/30 transition-colors cursor-pointer"
                  title="Kembali ke Daftar Kitab"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsFontSettingOpen(!isFontSettingOpen)}
                  className="w-9 h-9 rounded-full bg-white/15 border-0 flex items-center justify-center text-white hover:bg-white/25 active:bg-white/30 transition-colors cursor-pointer text-base"
                  title="Pengaturan Huruf"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>

              {/* Title & Hijri in Topbar */}
              <div className="relative flex-1 h-full flex items-center justify-center text-center overflow-hidden">
                <span 
                  ref={titleHeaderRef}
                  className="text-xs font-medium text-white/90 truncate max-w-full"
                >
                  {hijriText}
                </span>
                <span 
                  ref={subTitleHeaderRef}
                  className="absolute inset-0 flex items-center justify-center font-arabic text-lg text-white truncate opacity-0"
                  style={{ fontFamily: "'Amiri Quran', serif" }}
                >
                  {currentBook.ar}
                </span>
              </div>

              {/* Theme toggle */}
              <div className="flex items-center justify-end min-w-[82px]">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-9 h-9 rounded-full bg-white/15 border-0 flex items-center justify-center text-white hover:bg-white/25 active:bg-white/30 transition-colors cursor-pointer"
                  title="Ganti Tema"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Big Green Header Hero */}
            <div 
              ref={heroHeaderRef}
              className="-mt-14 pt-14 pb-8 px-3.5 text-white text-center bg-gradient-to-b from-[#1b5e20] to-[#2e7d32]"
            >
              <div 
                ref={bigTitleRef}
                className="font-arabic text-[clamp(28px,9vw,50px)] leading-[1.7] mt-5 drop-shadow-md transition-transform duration-100"
                style={{ fontFamily: "'Amiri Quran', serif" }}
              >
                {currentBook.ar}
              </div>
            </div>

            {/* Card Content with Chapter List */}
            <div 
              className="relative z-1 -mt-4 mx-3 mb-3 bg-[var(--sf)] rounded-[18px] shadow-lg border border-[var(--ln)] overflow-hidden divide-y divide-[var(--ln)]"
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
                    className={`w-full flex items-center gap-3.5 p-3.5 text-left border-0 bg-transparent text-[var(--tx)] hover:bg-[var(--bg)] transition-colors cursor-pointer group ${
                      c.b ? '' : 'opacity-55'
                    }`}
                  >
                    <span className="flex-none min-w-[46px] h-[46px] rounded-[6px] bg-[#2e7d32] text-white flex items-center justify-center font-bold text-lg p-1 shrink-0 shadow-2xs">
                      {c.i ? '✦' : numChaptersBefore(j)}
                    </span>
                    <span className="flex-1 min-w-0">
                      <b className="block text-sm sm:text-base leading-snug truncate font-bold text-[var(--tx)]">
                        {lat}
                      </b>
                      <small className="block text-[var(--mu)] text-xs mt-0.5">
                        {sub}{c.b ? '' : ' · belum dimuat'}
                      </small>
                    </span>
                    <span 
                      className="font-arabic text-right text-lg leading-relaxed text-[var(--tx)] shrink-0 max-w-[48%]"
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

          {/* Floating Font Size Popup (#sp) */}
          {isFontSettingOpen && (
            <div className="absolute top-[58px] left-3 z-30 flex items-center gap-3 py-2 px-3 rounded-[12px] bg-[#143d18] text-white text-xs shadow-xl border border-white/20 animate-in fade-in">
              <button
                type="button"
                onClick={() => adjustFontSize(-2)}
                className="text-white border border-white/30 rounded-[8px] py-1 px-2.5 bg-transparent hover:bg-white/20 cursor-pointer font-bold"
              >
                A−
              </button>
              <span className="font-medium text-xs">Ukuran ({fontSize}px)</span>
              <button
                type="button"
                onClick={() => adjustFontSize(2)}
                className="text-white border border-white/30 rounded-[8px] py-1 px-2.5 bg-transparent hover:bg-white/20 cursor-pointer font-bold"
              >
                A+
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= 3. READ VIEW: CHAPTER READER ================= */}
      {currentView === 'read' && (
        <div className="flex-1 flex flex-col h-full bg-[var(--bg)] overflow-hidden">
          {/* Top Navbar */}
          <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-[var(--ln)] bg-[var(--sf)] shrink-0 shadow-2xs">
            <button
              type="button"
              onClick={() => setCurrentView('toc')}
              className="text-[var(--ac)] border border-[var(--ln)] rounded-[10px] p-2 hover:bg-[var(--bg)] transition-colors cursor-pointer flex items-center justify-center shrink-0"
              title="Daftar Bab"
            >
              <Menu className="w-4 h-4" />
            </button>
            <h2 
              className="flex-1 m-0 text-center text-sm font-semibold truncate text-[var(--tx)] font-arabic"
              style={{ fontFamily: "'Amiri Quran', serif" }}
            >
              {currentChapter.i ? '' : `${ad(numChaptersBefore(activeChapterIndex))}. `}{currentChapter.t}
            </h2>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => adjustFontSize(-2)}
                className="text-[var(--ac)] border border-[var(--ln)] rounded-[10px] px-2.5 py-1 text-xs font-bold hover:bg-[var(--bg)] transition-colors cursor-pointer"
              >
                A−
              </button>
              <button
                type="button"
                onClick={() => adjustFontSize(2)}
                className="text-[var(--ac)] border border-[var(--ln)] rounded-[10px] px-2.5 py-1 text-xs font-bold hover:bg-[var(--bg)] transition-colors cursor-pointer"
              >
                A+
              </button>
            </div>
          </div>

          {/* Reader Scrollable Content */}
          <div
            ref={readerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
            className="flex-1 overflow-y-auto px-4.5 py-5 pb-24 overscroll-contain select-text"
          >
            <div className="max-w-[640px] mx-auto">
              {/* Chapter Header Badge & Title */}
              <div className="text-center text-[var(--mu)] text-xs mb-4 font-sans font-medium">
                {currentChapter.i ? (currentChapter.lb || 'مُقَدِّمَةٌ') : ordAr(numChaptersBefore(activeChapterIndex))}
              </div>
              <div 
                className="text-center font-arabic text-[calc(var(--fs)*1.25)] text-[var(--gd)] mt-1.5 mb-1 leading-loose"
                style={{ fontFamily: "'Amiri Quran', serif" }}
              >
                {currentChapter.t}
              </div>

              {/* Body Content */}
              {!currentChapter.b ? (
                <div className="text-center text-[var(--mu)] py-10 px-2.5 leading-relaxed text-xs">
                  Teks bab ini belum dimuat.<br />Teks berharakat harus dimasukkan dari sumber yang terverifikasi.
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  {currentChapter.b.p.map((x: any, pIdx: number) => {
                    // String paragraph
                    if (typeof x === 'string') {
                      if (isSl(x)) {
                        return (
                          <div 
                            key={pIdx}
                            className="relative text-center font-arabic text-[calc(var(--fs)*0.95)] leading-loose text-[var(--ac)] my-9 mx-0.5 py-7 px-3.5 border-2 border-[var(--gd)] rounded-tr-[24px] rounded-bl-[24px] rounded-tl-[6px] rounded-br-[6px] bg-[repeating-linear-gradient(45deg,transparent_0_10px,rgba(176,138,46,0.07)_10px_11px)] [box-shadow:inset_0_0_0_5px_var(--sf),inset_0_0_0_6px_var(--gd)] before:content-['✦_❁_✦'] before:absolute before:left-1/2 before:-translate-x-1/2 before:bg-[var(--bg)] before:text-[var(--gd)] before:px-2.5 before:text-xs before:leading-none before:-top-2 after:content-['✦_❁_✦'] after:absolute after:left-1/2 after:-translate-x-1/2 after:bg-[var(--bg)] after:text-[var(--gd)] after:px-2.5 after:text-xs after:leading-none after:-bottom-2"
                            dir="rtl"
                            style={{ fontFamily: "'Amiri Quran', serif" }}
                          >
                            {x}
                          </div>
                        );
                      }
                      return (
                        <p
                          key={pIdx}
                          className="font-arabic text-justify text-right text-[var(--fs)] leading-[2.15] mb-5 text-[var(--tx)]"
                          dir="rtl"
                          style={{ fontFamily: "'Scheherazade New', 'Amiri Quran', serif" }}
                          dangerouslySetInnerHTML={{
                            __html: x.replace(/❁/g, "<em style='font-style:normal;color:var(--gd);margin:0 .15em;'>❁</em>")
                          }}
                        />
                      );
                    }

                    // Center callout: x.c
                    if (x.c) {
                      return (
                        <div
                          key={pIdx}
                          className="font-arabic text-center text-[calc(var(--fs)*1.1)] leading-loose my-4 text-[var(--tx)]"
                          dir="rtl"
                          style={{ fontFamily: "'Amiri Quran', 'Scheherazade New', serif" }}
                        >
                          {x.c}
                        </div>
                      );
                    }

                    // Collapsible section with toggle button: x.h
                    if (x.h) {
                      const toggleKey = `${activeBookIndex}-${activeChapterIndex}-${pIdx}`;
                      const isOpened = !!openToggles[toggleKey];

                      return (
                        <div key={pIdx} className="my-4">
                          <button
                            type="button"
                            onClick={() => {
                              setOpenToggles((prev) => ({ ...prev, [toggleKey]: !prev[toggleKey] }));
                            }}
                            className="w-full my-4 py-3 px-3.5 border-2 border-[var(--gd)] rounded-[14px] bg-[var(--sf)] text-[var(--ac)] font-arabic text-[calc(var(--fs)*0.95)] leading-relaxed text-center cursor-pointer flex items-center justify-center gap-1.5"
                            dir="rtl"
                            style={{ fontFamily: "'Amiri Quran', serif" }}
                          >
                            <span>{x.h}</span>
                            <span className="font-sans text-xs text-[var(--gd)]">{isOpened ? '▲' : '▼'}</span>
                          </button>
                          {isOpened && (
                            <div className="border-y border-[var(--ln)] py-1.5 my-5 space-y-1.5" dir="rtl">
                              {x.v.map((r: string[], vIdx: number) => (
                                <div
                                  key={vIdx}
                                  className="grid grid-cols-2 gap-4 font-arabic text-[calc(var(--fs)*0.95)] leading-loose text-center my-1.5 text-[var(--tx)]"
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

                    // Verses block: x.v
                    if (x.v) {
                      return (
                        <div 
                          key={pIdx}
                          className="border-y border-[var(--ln)] py-1.5 my-5 space-y-1.5" 
                          dir="rtl"
                        >
                          {x.v.map((r: string[], vIdx: number) => (
                            <div
                              key={vIdx}
                              className="grid grid-cols-2 gap-4 font-arabic text-[calc(var(--fs)*0.95)] leading-loose text-center my-1.5 text-[var(--tx)]"
                              style={{ fontFamily: "'Amiri Quran', 'Scheherazade New', serif" }}
                            >
                              <span>{r[0]}</span>
                              <span>{r[1]}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }

                    return null;
                  })}

                  {/* Refrain / Closing Sholawat: c.b.r */}
                  {currentChapter.b.r && (
                    <div 
                      className="font-arabic text-center text-[calc(var(--fs)*0.95)] leading-loose text-[var(--ac)] border-y border-[var(--ln)] py-3 px-1 my-6"
                      dir="rtl"
                      style={{ fontFamily: "'Amiri Quran', serif" }}
                      dangerouslySetInnerHTML={{
                        __html: R.replace(/❁/g, "<em style='font-style:normal;color:var(--gd);margin:0 .15em;'>❁</em>")
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Overscroll Pull-to-change Hint (#hint) */}
          <div
            className={`fixed left-0 right-0 z-40 text-center p-2.5 text-xs bg-[var(--ac)] text-[var(--bg)] transition-opacity duration-150 pointer-events-none max-w-lg mx-auto ${
              hintType === 'top' ? 'top-14' : 'bottom-0'
            } ${hintVisible ? 'opacity-100' : 'opacity-0'}`}
          >
            <div>{hintText}</div>
            <div 
              className="h-0.5 bg-[var(--bg)] opacity-60 mt-1.5 mx-auto transition-all"
              style={{ width: `${hintProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
