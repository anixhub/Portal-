import React, { useState, useRef } from 'react';
import { Maximize2 } from 'lucide-react';

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

  const mediaList = images && images.length > 0 ? images : fallbackImage ? [fallbackImage] : [];

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
    return (
      <div
        onClick={() => onPreview(mediaList[0])}
        className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-slate-950 overflow-hidden cursor-pointer select-none group"
        title="Ketuk untuk melihat foto layar penuh"
      >
        <img
          src={mediaList[0]}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-200"
        />
        <div className="absolute bottom-2.5 right-2.5 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs">
          <Maximize2 className="w-3.5 h-3.5" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-slate-950 overflow-hidden select-none group">
      {/* Slider Kontainer Geser Horizontal */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
      >
        {mediaList.map((imgSrc, idx) => (
          <div
            key={idx}
            onClick={() => onPreview(imgSrc)}
            className="min-w-full w-full h-full flex-shrink-0 snap-center relative bg-slate-950 flex items-center justify-center cursor-pointer"
            title="Ketuk untuk melihat foto layar penuh"
          >
            <img
              src={imgSrc}
              alt={`${title} - foto ${idx + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Dot Indicators Hanya Lingkaran-lingkaran Kecil di Bawah Saja */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-none z-10">
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
