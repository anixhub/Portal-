import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ArrowLeft,
  Search,
  BookOpen,
  List,
  X
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

// Daftar bab tanpa halaman sampul dan biodata santri (dimulai langsung dari Surat Yasin hal. 3)
export const MAJMUAH_SECTIONS: MajmuahSection[] = [
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
const TOTAL_PAGES_COUNT = 223;
const MIN_PAGE = 3; // Halaman awal Surat Yasin (halaman judul dan biodata sebelum Yasin dihapus)
const DEFAULT_FIRST_PAGE = 3; // Halaman awal surat Yasin

interface MajmuahViewProps {
  isOpen: boolean;
  onClose: () => void;
  initialPage?: number;
}

export const MajmuahView: React.FC<MajmuahViewProps> = ({ isOpen, onClose, initialPage }) => {
  // View mode: 'toc' (Daftar Isi) or 'read' (Tampilan Kitab)
  const [currentView, setCurrentView] = useState<'toc' | 'read'>('toc');
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(false);

  // Tidak ada fitur lanjutkan membaca (selalu mulai dari Surat Yasin hal. 3 atau yang dipilih)
  const [currentPage, setCurrentPage] = useState<number>(() => {
    try {
      localStorage.removeItem('majmuah_last_page');
    } catch {}
    return initialPage && initialPage >= MIN_PAGE ? initialPage : DEFAULT_FIRST_PAGE;
  });

  const [totalPages, setTotalPages] = useState<number>(TOTAL_PAGES_COUNT);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sidebarSearch, setSidebarSearch] = useState<string>('');

  // Interactive push-swipe gesture state
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isAnimatingPage, setIsAnimatingPage] = useState<boolean>(false);

  // Pre-rendered cached images for current, next, and previous page slots
  const [renderedPages, setRenderedPages] = useState<{
    current: string | null;
    next: string | null;
    prev: string | null;
  }>({ current: null, next: null, prev: null });

  // In-memory page image cache
  const pageImageCacheRef = useRef<Map<number, string>>(new Map());
  const pdfDocRef = useRef<any>(null);
  const pageContainerRef = useRef<HTMLDivElement | null>(null);
  const animationTimeoutRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const activeSidebarItemRef = useRef<HTMLButtonElement | null>(null);

  // Gesture coordinate tracking
  const dragOffsetRef = useRef<number>(0);
  const touchStartCoordRef = useRef<{ x: number; y: number } | null>(null);
  const dragDirectionRef = useRef<'horizontal' | 'vertical' | null>(null);
  const isDraggingPageRef = useRef<boolean>(false);

  // Back button handler
  useBackHandler(isOpen && isRightSidebarOpen, 'majmuah-sidebar-back', () => {
    setIsRightSidebarOpen(false);
  });

  useBackHandler(isOpen && !isRightSidebarOpen && currentView === 'read', 'majmuah-read-back', () => {
    setCurrentView('toc');
  });

  // When opening, reset view
  useEffect(() => {
    if (isOpen) {
      if (initialPage && initialPage >= 1) {
        setCurrentPage(initialPage);
        setCurrentView('read');
      } else {
        setCurrentView('toc');
      }
      setIsRightSidebarOpen(false);
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

  // Render a specific page to high-quality image URL with fit-width scaling
  const getOrRenderPageImage = useCallback(async (pageNum: number): Promise<string | null> => {
    if (pageNum < MIN_PAGE || pageNum > totalPages) return null;
    if (pageImageCacheRef.current.has(pageNum)) {
      return pageImageCacheRef.current.get(pageNum)!;
    }
    if (!pdfDocRef.current) return null;

    try {
      const page = await pdfDocRef.current.getPage(pageNum);
      const containerWidth = pageContainerRef.current?.clientWidth || window.innerWidth || 360;
      const unscaledViewport = page.getViewport({ scale: 1 });
      const fitWidthScale = containerWidth / unscaledViewport.width;

      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2.5);
      const viewport = page.getViewport({ scale: fitWidthScale * pixelRatio });

      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      await page.render({ canvasContext: ctx, viewport }).promise;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      pageImageCacheRef.current.set(pageNum, dataUrl);
      return dataUrl;
    } catch (err: any) {
      if (err.name !== 'RenderingCancelledException') {
        console.warn(`Render error on page ${pageNum}:`, err);
      }
      return null;
    }
  }, [totalPages]);

  // Synchronously set already cached image and fetch adjacent pages
  const updateVisiblePages = useCallback(async (activePage: number) => {
    // 1. Instant update if current page is already in cache
    const cachedCurrent = pageImageCacheRef.current.get(activePage) || null;
    const cachedNext = activePage < totalPages ? (pageImageCacheRef.current.get(activePage + 1) || null) : null;
    const cachedPrev = activePage > MIN_PAGE ? (pageImageCacheRef.current.get(activePage - 1) || null) : null;

    setRenderedPages({
      current: cachedCurrent,
      next: cachedNext,
      prev: cachedPrev,
    });

    // 2. Fetch/render current if not cached
    if (!cachedCurrent) {
      const currentUrl = await getOrRenderPageImage(activePage);
      setRenderedPages((prev) => ({ ...prev, current: currentUrl }));
    }

    // 3. Pre-render adjacent pages
    if (activePage < totalPages && !cachedNext) {
      getOrRenderPageImage(activePage + 1).then((nextUrl) => {
        setRenderedPages((prev) => ({ ...prev, next: nextUrl }));
      });
    }

    if (activePage > MIN_PAGE && !cachedPrev) {
      getOrRenderPageImage(activePage - 1).then((prevUrl) => {
        setRenderedPages((prev) => ({ ...prev, prev: prevUrl }));
      });
    }

    // Background pre-fetch next + 2 and prev - 2
    if (activePage + 2 <= totalPages && !pageImageCacheRef.current.has(activePage + 2)) {
      getOrRenderPageImage(activePage + 2);
    }
    if (activePage - 2 >= MIN_PAGE && !pageImageCacheRef.current.has(activePage - 2)) {
      getOrRenderPageImage(activePage - 2);
    }
  }, [getOrRenderPageImage, totalPages]);

  useEffect(() => {
    if (isOpen && currentView === 'read' && pdfDocRef.current) {
      updateVisiblePages(currentPage);
    }
  }, [isOpen, currentView, currentPage, updateVisiblePages]);

  // Window resize handler: clear cache and re-render with new fit-width
  useEffect(() => {
    if (!isOpen || currentView !== 'read') return;

    let resizeTimer: any = null;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        pageImageCacheRef.current.clear();
        updateVisiblePages(currentPage);
      }, 200);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [isOpen, currentView, currentPage, updateVisiblePages]);

  // Jump to page
  const goToPage = useCallback((pageNum: number) => {
    const valid = Math.max(MIN_PAGE, Math.min(totalPages, pageNum));
    setCurrentPage(valid);
    setIsRightSidebarOpen(false);
  }, [totalPages]);

  // Auto-scroll sidebar list to currently highlighted item when opening
  useEffect(() => {
    if (isRightSidebarOpen) {
      const timer = setTimeout(() => {
        if (activeSidebarItemRef.current) {
          activeSidebarItemRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isRightSidebarOpen]);

  // ================= PUSH SWIPE GESTURE (IDENTIK DENGAN AL-QUR'AN) =================
  // Arah halaman RTL: Nomor awal di KANAN, nomor berikutnya ke KIRI.
  // Geser ke kanan (dragOffset > 0): Halaman berikutnya (currentPage + 1) masuk dari kiri mendorong halaman saat ini.
  // Geser ke kiri (dragOffset < 0): Halaman sebelumnya (currentPage - 1) masuk dari kanan mendorong halaman saat ini.

  const finishPageDrag = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (!touchStartCoordRef.current) return;
    const currentOffset = dragOffsetRef.current;
    const wasDragging = isDraggingPageRef.current;
    touchStartCoordRef.current = null;
    dragDirectionRef.current = null;
    isDraggingPageRef.current = false;

    if (!wasDragging || Math.abs(currentOffset) < 3) {
      setDragOffset(0);
      dragOffsetRef.current = 0;
      return;
    }

    const containerWidth = pageContainerRef.current?.clientWidth || window.innerWidth || 360;
    const threshold = Math.min(85, Math.max(35, containerWidth * 0.14));

    if (currentOffset > threshold && currentPage < totalPages) {
      // Geser ke kanan past threshold -> Halaman berikutnya (currentPage + 1) masuk dari kiri
      setIsAnimatingPage(true);
      setDragOffset(containerWidth);
      dragOffsetRef.current = containerWidth;

      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = setTimeout(() => {
        const nextP = currentPage + 1;
        setRenderedPages((prev) => ({
          current: prev.next,
          next: pageImageCacheRef.current.get(nextP + 1) || null,
          prev: prev.current,
        }));
        setCurrentPage(nextP);
        setIsAnimatingPage(false);
        setDragOffset(0);
        dragOffsetRef.current = 0;
        animationTimeoutRef.current = null;
      }, 260);
    } else if (currentOffset < -threshold && currentPage > MIN_PAGE) {
      // Geser ke kiri past threshold -> Halaman sebelumnya (currentPage - 1) masuk dari kanan
      setIsAnimatingPage(true);
      setDragOffset(-containerWidth);
      dragOffsetRef.current = -containerWidth;

      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = setTimeout(() => {
        const prevP = currentPage - 1;
        setRenderedPages((prev) => ({
          current: prev.prev,
          next: prev.current,
          prev: pageImageCacheRef.current.get(prevP - 1) || null,
        }));
        setCurrentPage(prevP);
        setIsAnimatingPage(false);
        setDragOffset(0);
        dragOffsetRef.current = 0;
        animationTimeoutRef.current = null;
      }, 260);
    } else {
      // Snap kembali ke halaman saat ini
      setIsAnimatingPage(true);
      setDragOffset(0);
      dragOffsetRef.current = 0;
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = setTimeout(() => {
        setIsAnimatingPage(false);
        animationTimeoutRef.current = null;
      }, 260);
    }
  }, [currentPage, totalPages]);

  const handleTouchStart = (e: React.TouchEvent) => {
    // If user touches while animation is running, cancel it immediately so there is no jump
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsAnimatingPage(false);
    const touch = e.touches[0];
    touchStartCoordRef.current = { x: touch.clientX, y: touch.clientY };
    dragDirectionRef.current = null;
    isDraggingPageRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartCoordRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartCoordRef.current.x;
    const dy = touch.clientY - touchStartCoordRef.current.y;

    if (dragDirectionRef.current === null) {
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        if (Math.abs(dx) > Math.abs(dy) * 1.1) {
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
      } else if (currentPage <= MIN_PAGE && dx < 0) {
        adjustedDx = dx * 0.22;
      }
      dragOffsetRef.current = adjustedDx;
      
      // Sync frame smoothly via requestAnimationFrame to avoid initial jump
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          setDragOffset(dragOffsetRef.current);
          rafRef.current = null;
        });
      }
    }
  };

  const handleTouchEnd = () => {
    finishPageDrag();
  };

  // Mouse drag support for web/desktop testing
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsAnimatingPage(false);
    touchStartCoordRef.current = { x: e.clientX, y: e.clientY };
    dragDirectionRef.current = null;
    isDraggingPageRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!touchStartCoordRef.current) return;
    const dx = e.clientX - touchStartCoordRef.current.x;
    const dy = e.clientY - touchStartCoordRef.current.y;

    if (dragDirectionRef.current === null) {
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        if (Math.abs(dx) > Math.abs(dy) * 1.1) {
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
      } else if (currentPage <= MIN_PAGE && dx < 0) {
        adjustedDx = dx * 0.22;
      }
      dragOffsetRef.current = adjustedDx;
      
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          setDragOffset(dragOffsetRef.current);
          rafRef.current = null;
        });
      }
    }
  };

  const handleMouseUp = () => {
    finishPageDrag();
  };

  const openSection = (page: number) => {
    setCurrentPage(Math.max(MIN_PAGE, page));
    setCurrentView('read');
    setIsRightSidebarOpen(false);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen || currentView !== 'read') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        if (currentPage < totalPages) {
          goToPage(currentPage + 1);
        }
      } else if (e.key === 'ArrowRight') {
        if (currentPage > MIN_PAGE) {
          goToPage(currentPage - 1);
        }
      } else if (e.key === 'Escape') {
        if (isRightSidebarOpen) {
          setIsRightSidebarOpen(false);
        } else {
          setCurrentView('toc');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentView, currentPage, totalPages, goToPage, isRightSidebarOpen]);

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

  // Filter sections in Sidebar
  const filteredSidebarSections = MAJMUAH_SECTIONS.filter((s) => {
    if (!sidebarSearch.trim()) return true;
    const q = sidebarSearch.toLowerCase();
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
          {/* Header Warna Hijau Seperti di Al-Qur'an (#4f9a50) */}
          <header className="bg-[#4f9a50] text-white flex items-center justify-between px-3 h-14 shrink-0 shadow-sm z-20">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 active:bg-white/30 transition-colors cursor-pointer text-white"
              title="Kembali"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="text-center">
              <h1 className="font-bold text-base sm:text-lg text-white leading-tight">
                Kitab Majmu'ah At-Taroqqy
              </h1>
              <p className="text-[11px] text-emerald-100 font-medium tracking-wide">
                Revisi 2024
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

            {/* 3. Daftar Bab Kitab Majmu'ah: Nomor Urut Saja + Keterangan Halaman Saja */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs divide-y divide-slate-100 overflow-hidden">
              {filteredSections.map((sec, idx) => (
                <button
                  key={sec.page}
                  type="button"
                  onClick={() => openSection(sec.page)}
                  className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left transition-colors cursor-pointer group hover:bg-emerald-50/60 active:bg-emerald-100/60"
                >
                  {/* Sisi Kiri: Medallion Nomor Urut (1, 2, 3...) & Judul Bab */}
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <AyahCircleMedallion
                      num={idx + 1}
                      size={38}
                      circleColorClass="text-amber-900/75 group-hover:text-emerald-800"
                      textColorClass="text-slate-800 group-hover:text-emerald-950 font-extrabold"
                      title={`Bab ke-${idx + 1}`}
                    />
                    <div className="truncate">
                      <div className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-800 truncate leading-snug">
                        {sec.title}
                      </div>
                      {/* Keterangan hanya nomer halaman saja */}
                      <div className="text-[11px] text-emerald-700 font-medium group-hover:text-emerald-800 mt-0.5">
                        Hal. {sec.page}
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

      {/* ================= 2. TAMPILAN KITAB (READER VIEW - HEADER AL-QURAN & SEAMLESS PUSH SWIPE) ================= */}
      {currentView === 'read' && (
        <div className="flex-1 flex flex-col h-full bg-[#fbf9f2] overflow-hidden select-none">
          {/* Header Warna Hijau Seperti di Al-Qur'an (#4f9a50) */}
          <header className="bg-[#4f9a50] text-white flex items-center justify-between px-3 h-14 shrink-0 shadow-sm z-20">
            {/* Tombol Kembali ke Daftar Isi Utama */}
            <button
              type="button"
              onClick={() => setCurrentView('toc')}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 active:bg-white/30 transition-colors cursor-pointer text-white"
              title="Kembali ke Daftar Isi"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Judul Bab Bersih di Tengah (Keterangan Revisi 2024 dihapus di mode baca sesuai permintaan) */}
            <div className="text-center truncate px-2">
              <h2 className="font-bold text-sm sm:text-base text-white truncate max-w-[240px] sm:max-w-[300px]">
                {currentSection.title}
              </h2>
            </div>

            {/* Tombol Kanan Atas: Membuka Sidebar Kanan Daftar Isi */}
            <button
              type="button"
              onClick={() => setIsRightSidebarOpen(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 active:bg-white/30 transition-colors cursor-pointer text-white"
              title="Buka Daftar Isi"
            >
              <List className="w-5 h-5" />
            </button>
          </header>

          {/* Area Baca Kitab - Background #fbf9f2 & Center Vertical Layar Penuh dengan touchAction: none agar tidak ada lompatan awal */}
          <div
            ref={pageContainerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ touchAction: 'none' }}
            className="flex-1 relative w-full h-full overflow-hidden bg-[#fbf9f2] flex items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none"
          >
            {/* Indikator Memuat Awal */}
            {isLoading && !renderedPages.current && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#fbf9f2]/85 z-30">
                <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs text-slate-700 font-semibold">Memuat Kitab Majmu'ah At-Taroqqy...</p>
              </div>
            )}

            {/* 1. Next Page in RTL (currentPage + 1): Berada di sebelah KIRI, masuk mendorong halaman saat digeser ke kanan */}
            {(dragOffset > 0 || (isAnimatingPage && dragOffset > 0)) && currentPage < totalPages && (
              <div
                className="absolute inset-0 w-full h-full flex items-center justify-center overscroll-contain bg-[#fbf9f2] pointer-events-none select-none"
                style={{
                  left: '-100%',
                  transform: `translate3d(${dragOffset}px, 0, 0)`,
                  transition: isAnimatingPage ? 'transform 260ms cubic-bezier(0.2, 0.9, 0.3, 1)' : 'none',
                  willChange: 'transform'
                }}
              >
                {renderedPages.next && (
                  <img
                    src={renderedPages.next}
                    alt={`Halaman ${currentPage + 1}`}
                    className="w-full h-auto max-h-full object-contain my-auto block shadow-xs select-none pointer-events-none"
                  />
                )}
              </div>
            )}

            {/* 2. Current Active Page: Terpusat secara vertikal di tengah layar, terdorong halus saat digeser */}
            <div
              className="absolute inset-0 w-full h-full flex items-center justify-center overscroll-contain bg-[#fbf9f2] select-none"
              style={{
                left: '0%',
                transform: `translate3d(${dragOffset}px, 0, 0)`,
                transition: isAnimatingPage ? 'transform 260ms cubic-bezier(0.2, 0.9, 0.3, 1)' : 'none',
                willChange: 'transform'
              }}
            >
              {renderedPages.current ? (
                <img
                  src={renderedPages.current}
                  alt={`Halaman ${currentPage}`}
                  className="w-full h-auto max-h-full object-contain my-auto block shadow-xs select-none pointer-events-none"
                />
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* 3. Previous Page in RTL (currentPage - 1): Berada di sebelah KANAN, masuk mendorong halaman saat digeser ke kiri (hanya jika > MIN_PAGE / Yasin) */}
            {(dragOffset < 0 || (isAnimatingPage && dragOffset < 0)) && currentPage > MIN_PAGE && (
              <div
                className="absolute inset-0 w-full h-full flex items-center justify-center overscroll-contain bg-[#fbf9f2] pointer-events-none select-none"
                style={{
                  left: '100%',
                  transform: `translate3d(${dragOffset}px, 0, 0)`,
                  transition: isAnimatingPage ? 'transform 260ms cubic-bezier(0.2, 0.9, 0.3, 1)' : 'none',
                  willChange: 'transform'
                }}
              >
                {renderedPages.prev && (
                  <img
                    src={renderedPages.prev}
                    alt={`Halaman ${currentPage - 1}`}
                    className="w-full h-auto max-h-full object-contain my-auto block shadow-xs select-none pointer-events-none"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= 3. SIDEBAR KANAN DAFTAR ISI ================= */}
      {isRightSidebarOpen && (
        <div className="fixed inset-0 z-[100060] flex justify-end animate-in fade-in duration-200">
          {/* Backdrop gelap transparan */}
          <div
            onClick={() => setIsRightSidebarOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity cursor-pointer"
          />

          {/* Panel Laci Kanan */}
          <aside className="relative w-80 max-w-[85vw] h-full bg-[#fbf9f2] z-10 shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-250">
            {/* Header Sidebar Kanan (#4f9a50) */}
            <header className="bg-[#4f9a50] text-white flex items-center justify-between px-4 h-14 shrink-0 shadow-sm">
              <div className="flex items-center gap-2">
                <List className="w-5 h-5 text-emerald-100" />
                <div>
                  <h3 className="font-bold text-sm text-white leading-tight">Daftar Isi</h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRightSidebarOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 active:bg-white/30 text-white transition-colors cursor-pointer"
                title="Tutup Sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            {/* Kotak Cari di Sidebar */}
            <div className="p-3 border-b border-slate-200/80 bg-white">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari bab..."
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#4f9a50]"
                />
              </div>
            </div>

            {/* Daftar Bab di Sidebar */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
              {filteredSidebarSections.map((sec) => {
                const isActive = currentSection?.page === sec.page;
                return (
                  <button
                    key={sec.page}
                    ref={isActive ? activeSidebarItemRef : undefined}
                    type="button"
                    onClick={() => goToPage(sec.page)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                      isActive
                        ? 'bg-emerald-100/90 text-emerald-950 font-bold border border-emerald-300'
                        : 'hover:bg-emerald-50/70 text-slate-700 hover:text-slate-900 border border-transparent'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className={`text-xs leading-snug truncate ${isActive ? 'text-emerald-950 font-bold' : 'text-slate-800'}`}>
                        {sec.title}
                      </p>
                      <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                        Hal. {sec.page}
                      </p>
                    </div>

                    <span
                      className="font-arabic text-sm text-slate-700 group-hover:text-emerald-900 shrink-0 select-none"
                      style={{ fontFamily: "'Amiri Quran', serif" }}
                      dir="rtl"
                    >
                      {sec.arabic}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
