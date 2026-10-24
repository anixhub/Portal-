import React, { useState, useRef } from 'react';
import { Maximize2, ImageIcon } from 'lucide-react';
import { getAlumniPhotoUrl, handleImageFallbackError } from '../../utils/photoUtils';

interface PostMediaCarouselProps {
  images?: string[];
  fallbackImage?: string;
  title: string;
  onPreview: (url: string) => void;
  onSlideChange?: (index: number) => void;
}

export const PostMediaCarousel: React.FC<PostMediaCarouselProps> = ({
  images,
  fallbackImage,
  title,
  onPreview,
  onSlideChange,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const rawList = images && images.length > 0 ? images : fallbackImage ? [fallbackImage] : [];
  const mediaList = rawList.filter((item) => typeof item === 'string' && item.trim() !== '');

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    if (clientWidth > 0) {
      const idx = Math.round(scrollLeft / clientWidth);
      if (idx !== currentSlide) {
        setCurrentSlide(idx);
        onSlideChange?.(idx);
      }
    }
  };

  const scrollToSlide = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!scrollRef.current) return;
    const clamped = Math.max(0, Math.min(mediaList.length - 1, idx));
    scrollRef.current.scrollTo({
      left: clamped * scrollRef.current.clientWidth,
      behavior: 'smooth',
    });
    setCurrentSlide(clamped);
    onSlideChange?.(clamped);
  };

  if (mediaList.length === 0) return null;

  if (mediaList.length === 1) {
    const resolvedUrl = getAlumniPhotoUrl(mediaList[0]);
    return (
      <div
        onClick={() => onPreview(resolvedUrl)}
        className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-slate-900 overflow-hidden cursor-pointer select-none group"
        title="Ketuk untuk melihat foto layar penuh"
      >
        {/* Fallback decorative container jika foto gagal dimuat */}
        <div
          data-img-fallback
          className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 flex flex-col items-center justify-center gap-2 text-slate-400 p-4 select-none pointer-events-none"
        >
          <div className="w-12 h-12 rounded-full bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-slate-300 shadow-inner">
            <ImageIcon className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-slate-200 text-center line-clamp-1 max-w-[85%]">{title}</p>
          <span className="text-[10px] text-slate-400 font-medium tracking-wide">Lampiran Dokumentasi</span>
        </div>

        <img
          src={resolvedUrl}
          onError={handleImageFallbackError}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-200 relative z-10"
        />
        <div className="absolute bottom-2.5 right-2.5 z-20 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs">
          <Maximize2 className="w-3.5 h-3.5" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-slate-900 overflow-hidden select-none group">
      {/* Slider Kontainer Geser Horizontal */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
      >
        {mediaList.map((rawSrc, idx) => {
          const resolvedSrc = getAlumniPhotoUrl(rawSrc);
          return (
            <div
              key={idx}
              onClick={() => onPreview(resolvedSrc)}
              className="min-w-full w-full h-full flex-shrink-0 snap-center relative bg-slate-900 flex items-center justify-center cursor-pointer"
              title="Ketuk untuk melihat foto layar penuh"
            >
              {/* Fallback decorative container jika foto gagal dimuat */}
              <div
                data-img-fallback
                className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 flex flex-col items-center justify-center gap-2 text-slate-400 p-4 select-none pointer-events-none"
              >
                <div className="w-12 h-12 rounded-full bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-slate-300 shadow-inner">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-200 text-center line-clamp-1 max-w-[85%]">{title}</p>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                  Foto {idx + 1} dari {mediaList.length}
                </span>
              </div>

              <img
                src={resolvedSrc}
                onError={handleImageFallbackError}
                alt={`${title} - foto ${idx + 1}`}
                className="w-full h-full object-cover relative z-10"
              />
            </div>
          );
        })}
      </div>

      {/* Dot Indicators Lingkaran Kecil di Bawah */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-none z-20">
        {mediaList.map((_, i) => (
          <span
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i === currentSlide
                ? 'w-2 h-2 bg-white ring-2 ring-white/40'
                : 'w-1.5 h-1.5 bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
