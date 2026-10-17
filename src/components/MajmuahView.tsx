import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ArrowLeft,
  Search,
  BookOpen
} from 'lucide-react';
import { AyahCircleMedallion, LpmqSvgDefs } from './lpmqAyahCirclePath';
import { useBackHandler } from '../utils/navigationHistory';

// Configure PDF.js worker using public asset
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

export interface MajmuahSection {
  page: number;
  arabic: string;
  title: string;
  category: 'surah' | 'wirid' | 'qasidah' | 'doa' | 'istighotsah' | 'nadhom';
}

export const MAJMUAH_SECTIONS: MajmuahSection[] = [
  { page: 1, arabic: 'مقروءات يومية وأسبوعية', title: 'Sampul & Biodata Santri', category: 'doa' },
  { page: 3, arabic: 'سورة يس', title: 'Surat Yasin', category: 'surah' },
  { page: 13, arabic: 'سورة الواقعة', title: 'Surat Al-Waqi’ah', category: 'surah' },
  { page: 21, arabic: 'سورة الملك', title: 'Surat Al-Mulk', category: 'surah' },
  { page: 25, arabic: 'سورة الكهف', title: 'Surat Al-Kahf', category: 'surah' },
  { page: 42, arabic: 'سورة الدخان', title: 'Surat Ad-Dukhan', category: 'surah' },
  { page: 46, arabic: 'سورة السجدة', title: 'Surat As-Sajdah', category: 'surah' },
  { page: 50, arabic: 'الأذكار بعد الصلاة', title: 'Dzikir & Doa Ba’da Shalat', category: 'wirid' },
  { page: 56, arabic: 'الورد اللطيف', title: 'Al-Wirdul Lathif (Al-Haddad)', category: 'wirid' },
  { page: 69, arabic: 'راتب الحداد', title: 'Ratib Al-Haddad', category: 'wirid' },
  { page: 86, arabic: 'القصيدة المضرية', title: 'Qasidah Al-Mudhariyyah', category: 'qasidah' },
  { page: 93, arabic: 'القصيدة المحمدية', title: 'Qasidah Al-Muhammadiyyah', category: 'qasidah' },
  { page: 98, arabic: 'الدعاء قبل الدرس', title: 'Doa Sebelum Belajar / Ngaji', category: 'doa' },
  { page: 101, arabic: 'الدعاء بعد الدرس', title: 'Doa Sesudah Belajar / Ngaji', category: 'doa' },
  { page: 103, arabic: 'الدعاء قبل المحاضرة', title: 'Doa Sebelum Muhadharah', category: 'doa' },
  { page: 105, arabic: 'الدعاء بعد صلاة الضحى', title: 'Doa Shalat Dhuha', category: 'doa' },
  { page: 107, arabic: 'الدعاء بعد صلاة التهجد', title: 'Doa Shalat Tahajjud', category: 'doa' },
  { page: 109, arabic: 'الذكر قبل صلاة الصبح', title: 'Dzikir Sebelum Shalat Shubuh', category: 'wirid' },
  { page: 110, arabic: 'دعاء الفجر', title: 'Doa Al-Fajr', category: 'doa' },
  { page: 114, arabic: 'عقيدة العوام', title: 'Nadhom Aqidatul Awwam', category: 'nadhom' },
  { page: 119, arabic: 'منظومة الأسماء الحسنى', title: 'Nadhom Asmaul Husna', category: 'nadhom' },
  { page: 128, arabic: 'راتب العطاس', title: 'Ratib Al-Attas', category: 'wirid' },
  { page: 134, arabic: 'القصيدة المنفرجة', title: 'Qasidah Al-Munfarijah', category: 'qasidah' },
  { page: 139, arabic: 'حضرة باسودان', title: 'Hadhrah Basudan', category: 'wirid' },
  { page: 175, arabic: 'بردة المديح', title: 'Qashidah Burdah Al-Madih', category: 'qasidah' },
  { page: 202, arabic: 'التهليل', title: 'Tahlil Lengkap & Doa Arwah', category: 'wirid' },
  { page: 211, arabic: 'دعاء أخير تاهون', title: 'Doa Akhir Tahun', category: 'doa' },
  { page: 212, arabic: 'دعاء أول تاهون', title: 'Doa Awal Tahun', category: 'doa' },
  { page: 218, arabic: 'الاستغاثة', title: 'Istighotsah Masyayikh At-Taroqqy', category: 'istighotsah' },
];

const PDF_URL = '/majmuah_putra.pdf';
const STORAGE_LAST_PAGE = 'majmuah_last_page';
const TOTAL_PAGES_COUNT = 223;

interface MajmuahViewProps {
  isOpen: boolean;
  onClose: () => void;
  initialPage?: number;
}

export const MajmuahView: React.FC<MajmuahViewProps> = ({ isOpen, onClose, initialPage }) => {
  // View mode: 'toc' (Daftar Isi) or 'read' (Tampilan Kitab)
  const [currentView, setCurrentView] = useState<'toc' | 'read'>('toc');

  const [currentPage, setCurrentPage] = useState<number>(() => {
    if (initialPage && initialPage > 0) return initialPage;
    try {
      const saved = localStorage.getItem(STORAGE_LAST_PAGE);
      if (saved) {
        const p = parseInt(saved, 10);
        if (!isNaN(p) && p >= 1 && p <= TOTAL_PAGES_COUNT) return p;
      }
    } catch {
      // ignore
    }
    return 1;
  });

  const [totalPages, setTotalPages] = useState<number>(TOTAL_PAGES_COUNT);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Interactive push-swipe gesture state (Identik dengan Al-Qur'an Mushaf)
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isAnimatingPage, setIsAnimatingPage] = useState<boolean>(false);

  // References for multi-page canvas rendering
  const currentCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const pdfDocRef = useRef<any>(null);
  const pageContainerRef = useRef<HTMLDivElement | null>(null);

  // Gesture coordinate tracking
  const dragOffsetRef = useRef<number>(0);
  const touchStartCoordRef = useRef<{ x: number; y: number } | null>(null);
  const dragDirectionRef = useRef<'horizontal' | 'vertical' | null>(null);
  const isDraggingPageRef = useRef<boolean>(false);

  // Back button handler: in 'read' goes back to 'toc', in 'toc' closes modal
  useBackHandler(isOpen && currentView === 'read', 'majmuah-read-back', () => {
    setCurrentView('toc');
  });

  // When opening, reset view to 'toc' unless initialPage was passed
  useEffect(() => {
    if (isOpen) {
      if (initialPage && initialPage >= 1) {
        setCurrentPage(initialPage);
        setCurrentView('read');
      } else {
        setCurrentView('toc');
      }
    }
  }, [isOpen, initialPage]);

  // Load PDF Document
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);

    const loadingTask = pdfjsLib.getDocument({
      url: PDF_URL,
      cMapUrl: '/cmaps/',
      cMapPacked: true,
    });

    loadingTask.promise
      .then((doc) => {
        if (!isMounted) return;
        pdfDocRef.current = doc;
        setTotalPages(doc.numPages);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error loading PDF document:', err);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
      if (loadingTask) {
        try {
          loadingTask.destroy();
        } catch {
          // ignore
        }
      }
    };
  }, [isOpen]);

  // Render a specific page onto a designated canvas with fit-width scaling
  const renderSinglePage = useCallback(async (pageNum: number, targetCanvas: HTMLCanvasElement | null) => {
    if (!pdfDocRef.current || !targetCanvas || pageNum < 1 || pageNum > totalPages) return;

    try {
      const page = await pdfDocRef.current.getPage(pageNum);
      const context = targetCanvas.getContext('2d');
      if (!context) return;

      const containerWidth = pageContainerRef.current?.clientWidth || window.innerWidth || 360;
      const unscaledViewport = page.getViewport({ scale: 1 });
      const fitWidthScale = containerWidth / unscaledViewport.width;

      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2.5);
      const viewport = page.getViewport({ scale: fitWidthScale });

      targetCanvas.width = Math.floor(viewport.width * pixelRatio);
      targetCanvas.height = Math.floor(viewport.height * pixelRatio);
      targetCanvas.style.width = '100%';
      targetCanvas.style.height = 'auto';

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
    } catch (err: any) {
      if (err.name !== 'RenderingCancelledException') {
        console.warn(`Render error on page ${pageNum}:`, err);
      }
    }
  }, [totalPages]);

  // Render active page and pre-render adjacent pages for instantaneous swipe transitions
  const renderAllVisiblePages = useCallback((activePageNum: number) => {
    if (!pdfDocRef.current) return;
    renderSinglePage(activePageNum, currentCanvasRef.current);
    if (activePageNum < totalPages) {
      renderSinglePage(activePageNum + 1, nextCanvasRef.current);
    }
    if (activePageNum > 1) {
      renderSinglePage(activePageNum - 1, prevCanvasRef.current);
    }
  }, [renderSinglePage, totalPages]);

  useEffect(() => {
    if (isOpen && currentView === 'read' && pdfDocRef.current) {
      renderAllVisiblePages(currentPage);
      try {
        localStorage.setItem(STORAGE_LAST_PAGE, String(currentPage));
      } catch {
        // ignore
      }
    }
  }, [isOpen, currentView, currentPage, renderAllVisiblePages]);

  // Handle window resize for fit-width recalculation
  useEffect(() => {
    if (!isOpen || currentView !== 'read') return;

    let resizeTimer: any = null;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        renderAllVisiblePages(currentPage);
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [isOpen, currentView, currentPage, renderAllVisiblePages]);

  // Jump to page
  const goToPage = useCallback((pageNum: number) => {
    const valid = Math.max(1, Math.min(totalPages, pageNum));
    setCurrentPage(valid);
  }, [totalPages]);

  // ================= PUSH SWIPE GESTURE (IDENTIK DENGAN AL-QUR'AN) =================
  // Arah halaman RTL: Nomor 1 di KANAN, nomor berikutnya ke KIRI.
  // Saat digeser ke kanan (dragOffset > 0): Halaman berikutnya (currentPage + 1) masuk dari kiri mendorong halaman saat ini.
  // Saat digeser ke kiri (dragOffset < 0): Halaman sebelumnya (currentPage - 1) masuk dari kanan mendorong halaman saat ini.

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
    const threshold = Math.min(90, Math.max(40, containerWidth * 0.15));

    if (currentOffset > threshold && currentPage < totalPages) {
      // Geser ke kanan past threshold -> Halaman berikutnya (currentPage + 1) masuk dari kiri
      setIsAnimatingPage(true);
      setDragOffset(containerWidth);
      dragOffsetRef.current = containerWidth;
      setTimeout(() => {
        goToPage(currentPage + 1);
        setIsAnimatingPage(false);
        setDragOffset(0);
        dragOffsetRef.current = 0;
      }, 260);
    } else if (currentOffset < -threshold && currentPage > 1) {
      // Geser ke kiri past threshold -> Halaman sebelumnya (currentPage - 1) masuk dari kanan
      setIsAnimatingPage(true);
      setDragOffset(-containerWidth);
      dragOffsetRef.current = -containerWidth;
      setTimeout(() => {
        goToPage(currentPage - 1);
        setIsAnimatingPage(false);
        setDragOffset(0);
        dragOffsetRef.current = 0;
      }, 260);
    } else {
      // Snap kembali ke halaman saat ini
      setIsAnimatingPage(true);
      setDragOffset(0);
      dragOffsetRef.current = 0;
      setTimeout(() => {
        setIsAnimatingPage(false);
      }, 260);
    }
  }, [currentPage, totalPages, goToPage]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAnimatingPage) return;
    const touch = e.touches[0];
    touchStartCoordRef.current = { x: touch.clientX, y: touch.clientY };
    dragDirectionRef.current = null;
    isDraggingPageRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartCoordRef.current || isAnimatingPage) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartCoordRef.current.x;
    const dy = touch.clientY - touchStartCoordRef.current.y;

    if (dragDirectionRef.current === null) {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        if (Math.abs(dx) > Math.abs(dy)) {
          dragDirectionRef.current = 'horizontal';
          isDraggingPageRef.current = true;
        } else {
          dragDirectionRef.current = 'vertical';
        }
      }
    }

    if (dragDirectionRef.current === 'horizontal') {
      let adjustedDx = dx;
      if (currentPage >= totalPages && dx > 0) {
        adjustedDx = dx * 0.22;
      } else if (currentPage <= 1 && dx < 0) {
        adjustedDx = dx * 0.22;
      }
      dragOffsetRef.current = adjustedDx;
      setDragOffset(adjustedDx);
    }
  };

  const handleTouchEnd = () => {
    finishPageDrag();
  };

  // Mouse drag support for web/desktop testing
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAnimatingPage || e.button !== 0) return;
    touchStartCoordRef.current = { x: e.clientX, y: e.clientY };
    dragDirectionRef.current = null;
    isDraggingPageRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!touchStartCoordRef.current || isAnimatingPage) return;
    const dx = e.clientX - touchStartCoordRef.current.x;
    const dy = e.clientY - touchStartCoordRef.current.y;

    if (dragDirectionRef.current === null) {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        if (Math.abs(dx) > Math.abs(dy)) {
          dragDirectionRef.current = 'horizontal';
          isDraggingPageRef.current = true;
        } else {
          dragDirectionRef.current = 'vertical';
        }
      }
    }

    if (dragDirectionRef.current === 'horizontal') {
      let adjustedDx = dx;
      if (currentPage >= totalPages && dx > 0) {
        adjustedDx = dx * 0.22;
      } else if (currentPage <= 1 && dx < 0) {
        adjustedDx = dx * 0.22;
      }
      dragOffsetRef.current = adjustedDx;
      setDragOffset(adjustedDx);
    }
  };

  const handleMouseUp = () => {
    finishPageDrag();
  };

  const openSection = (page: number) => {
    setCurrentPage(page);
    setCurrentView('read');
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen || currentView !== 'read') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        // In RTL mushaf: arrow left moves to next page (curPage + 1)
        if (currentPage < totalPages) {
          goToPage(currentPage + 1);
        }
      } else if (e.key === 'ArrowRight') {
        // In RTL mushaf: arrow right moves to previous page (curPage - 1)
        if (currentPage > 1) {
          goToPage(currentPage - 1);
        }
      } else if (e.key === 'Escape') {
        setCurrentView('toc');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentView, currentPage, totalPages, goToPage]);

  // Filter sections in TOC
  const filteredSections = MAJMUAH_SECTIONS.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.arabic.toLowerCase().includes(q) ||
      String(s.page).includes(q)
    );
  });

  // Current active section based on current page
  const currentSection = [...MAJMUAH_SECTIONS]
    .reverse()
    .find((s) => currentPage >= s.page) || MAJMUAH_SECTIONS[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100050] bg-[#fbf9f2] text-slate-800 font-sans flex flex-col select-none overflow-hidden max-w-lg mx-auto shadow-2xl border-x border-slate-200">
      <LpmqSvgDefs />

      {/* ================= 1. DAFTAR ISI VIEW (SEPERTI DI MAULID) ================= */}
      {currentView === 'toc' && (
        <div className="flex-1 flex flex-col h-full bg-[#fbf9f2] overflow-hidden">
          {/* Header Bersih Warna Putih (Tanpa tombol X) */}
          <header className="bg-white text-slate-800 border-b border-slate-200/90 flex items-center justify-between px-3 h-14 shrink-0 shadow-2xs z-20">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer text-slate-700"
              title="Kembali"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="text-center">
              <h1 className="font-bold text-base sm:text-lg text-slate-900 leading-tight">
                Kitab Majmu'ah Putra
              </h1>
              <p className="text-[11px] text-emerald-800 font-semibold tracking-wide">
                Revisi 2024 • Ponpes At-Taroqqy
              </p>
            </div>

            {/* Spacer penyeimbang tombol kiri agar judul tetap presisi di tengah */}
            <div className="w-10 h-10" />
          </header>

          {/* Konten Scrollable: Kotak cari & daftar bab */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3.5 no-scrollbar">
            {/* 1. Kotak Pencarian Bab */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                placeholder="Cari surat, doa, wirid, hal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9.5 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#4f9a50] focus:border-transparent shadow-2xs transition-all"
              />
            </div>

            {/* 2. Banner Lanjutkan Terakhir Dibaca (Jika ada) */}
            {currentPage > 1 && !searchQuery && (
              <button
                type="button"
                onClick={() => openSection(currentPage)}
                className="w-full bg-linear-to-r from-emerald-700 via-teal-800 to-emerald-900 text-white rounded-2xl p-3.5 text-left shadow-xs flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-200 tracking-wider">
                      Lanjutkan Membaca
                    </span>
                    <p className="font-bold text-xs sm:text-sm text-white truncate leading-snug">
                      {currentSection.title}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-lg">
                  Buka
                </span>
              </button>
            )}

            {/* 3. Daftar Bab / Pasal Kitab Majmu'ah */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs divide-y divide-slate-100 overflow-hidden">
              {filteredSections.map((sec, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => openSection(sec.page)}
                  className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left transition-colors cursor-pointer group hover:bg-emerald-50/60 active:bg-emerald-100/60"
                >
                  {/* Sisi Kiri: Medallion Nomor Halaman & Judul Bab */}
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <AyahCircleMedallion
                      num={sec.page}
                      size={38}
                      circleColorClass="text-amber-900/75 group-hover:text-emerald-800"
                      textColorClass="text-slate-800 group-hover:text-emerald-950 font-extrabold"
                      title={`Halaman ${sec.page}`}
                    />
                    <div className="truncate">
                      <div className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-800 truncate leading-snug">
                        {sec.title}
                      </div>
                      <div className="text-[11px] text-slate-400 group-hover:text-emerald-800/80 truncate mt-0.5 font-normal">
                        Majmu'ah Putra 2024
                      </div>
                    </div>
                  </div>

                  {/* Sisi Kanan: Tulisan Arab Bab */}
                  <span
                    className="font-arabic shrink-0 ml-2 text-slate-800 group-hover:text-emerald-900 text-lg sm:text-xl leading-none select-none transition-colors text-right"
                    style={{ fontFamily: "'Amiri Quran', 'Scheherazade New', serif" }}
                    dir="rtl"
                  >
                    {sec.arabic}
                  </span>
                </button>
              ))}
            </div>

            {/* State Pencarian Tidak Ditemukan */}
            {filteredSections.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-2.5 shadow-2xs">
                <Search className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">Bab tidak ditemukan</p>
                <p className="text-[11px] text-slate-400">
                  Tidak ada bab yang cocok dengan "{searchQuery}"
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

      {/* ================= 2. TAMPILAN KITAB (READER VIEW - CENTER VERTICAL & PUSH SWIPE) ================= */}
      {currentView === 'read' && (
        <div className="flex-1 flex flex-col h-full bg-[#fbf9f2] overflow-hidden select-none">
          {/* Header Bersih Warna Putih (Tanpa tombol X) */}
          <header className="bg-white text-slate-800 border-b border-slate-200/90 flex items-center justify-between px-3 h-14 shrink-0 shadow-2xs z-20">
            {/* Tombol Kembali ke Daftar Isi */}
            <button
              type="button"
              onClick={() => setCurrentView('toc')}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer text-slate-700"
              title="Kembali ke Daftar Isi"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Judul Bab Bersih di Tengah */}
            <h2 className="font-bold text-sm sm:text-base text-slate-900 truncate max-w-[260px] sm:max-w-[320px] text-center">
              {currentSection.title}
            </h2>

            {/* Spacer penyeimbang tombol kiri */}
            <div className="w-10 h-10" />
          </header>

          {/* Area Baca Kitab - Background #fbf9f2 & Center Vertical Layar Penuh */}
          <div
            ref={pageContainerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="flex-1 relative w-full h-full overflow-hidden bg-[#fbf9f2] flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
          >
            {/* Indikator Memuat Awal */}
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#fbf9f2]/85 z-30">
                <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs text-slate-700 font-semibold">Memuat Kitab Majmu'ah...</p>
              </div>
            )}

            {/* 1. Next Page in RTL (currentPage + 1): Berada di sebelah KIRI, masuk mendorong halaman saat digeser ke kanan */}
            {currentPage < totalPages && (
              <div
                className="absolute inset-0 w-full h-full flex items-center justify-center overscroll-contain bg-[#fbf9f2] pointer-events-none"
                style={{
                  left: '-100%',
                  transform: `translateX(${dragOffset}px)`,
                  transition: isAnimatingPage ? 'transform 260ms cubic-bezier(0.2, 0.9, 0.3, 1)' : 'none',
                  willChange: 'transform'
                }}
              >
                <div className="w-full max-h-full my-auto flex items-center justify-center">
                  <canvas
                    ref={nextCanvasRef}
                    className="w-full max-w-full block shadow-xs bg-[#fbf9f2]"
                  />
                </div>
              </div>
            )}

            {/* 2. Current Active Page: Terpusat secara vertikal di tengah layar, terdorong halus saat digeser */}
            <div
              className="absolute inset-0 w-full h-full flex items-center justify-center overscroll-contain bg-[#fbf9f2]"
              style={{
                left: '0%',
                transform: `translateX(${dragOffset}px)`,
                transition: isAnimatingPage ? 'transform 260ms cubic-bezier(0.2, 0.9, 0.3, 1)' : 'none',
                willChange: 'transform'
              }}
            >
              <div className="w-full max-h-full my-auto flex items-center justify-center">
                <canvas
                  ref={currentCanvasRef}
                  className="w-full max-w-full block shadow-xs bg-[#fbf9f2]"
                />
              </div>
            </div>

            {/* 3. Previous Page in RTL (currentPage - 1): Berada di sebelah KANAN, masuk mendorong halaman saat digeser ke kiri */}
            {currentPage > 1 && (
              <div
                className="absolute inset-0 w-full h-full flex items-center justify-center overscroll-contain bg-[#fbf9f2] pointer-events-none"
                style={{
                  left: '100%',
                  transform: `translateX(${dragOffset}px)`,
                  transition: isAnimatingPage ? 'transform 260ms cubic-bezier(0.2, 0.9, 0.3, 1)' : 'none',
                  willChange: 'transform'
                }}
              >
                <div className="w-full max-h-full my-auto flex items-center justify-center">
                  <canvas
                    ref={prevCanvasRef}
                    className="w-full max-w-full block shadow-xs bg-[#fbf9f2]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
