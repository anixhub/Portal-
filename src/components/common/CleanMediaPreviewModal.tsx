import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface CleanMediaPreviewModalProps {
  isOpen: boolean;
  imageUrl?: string;
  fallbackInitial?: string;
  isFemale?: boolean;
  onClose: () => void;
}

export const CleanMediaPreviewModal: React.FC<CleanMediaPreviewModalProps> = ({
  isOpen,
  imageUrl,
  fallbackInitial = 'A',
  isFemale = false,
  onClose,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number }>({
    x: 0,
    y: 0,
    posX: 0,
    posY: 0,
  });
  const touchStartRef = useRef<{
    dist: number;
    scale: number;
    x: number;
    y: number;
    posX: number;
    posY: number;
  }>({
    dist: 0,
    scale: 1,
    x: 0,
    y: 0,
    posX: 0,
    posY: 0,
  });
  const lastTapRef = useRef<number>(0);

  // Reset scale and position when opened or image changes
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageUrl]);

  if (!isOpen) return null;

  const handleZoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale((prev) => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleResetZoom = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || scale <= 1) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPosition({
      x: dragStartRef.current.posX + dx,
      y: dragStartRef.current.posY + dy,
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Touch handlers (Pinch to zoom + Pan + Double tap)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartRef.current = {
        dist,
        scale,
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        posX: position.x,
        posY: position.y,
      };
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        // Double tap
        if (scale > 1) {
          setScale(1);
          setPosition({ x: 0, y: 0 });
        } else {
          setScale(2.5);
        }
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
      isDraggingRef.current = true;
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        posX: position.x,
        posY: position.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (touchStartRef.current.dist > 0) {
        const factor = dist / touchStartRef.current.dist;
        const newScale = Math.min(Math.max(touchStartRef.current.scale * factor, 1), 5);
        setScale(newScale);
        if (newScale === 1) {
          setPosition({ x: 0, y: 0 });
        }
      }
    } else if (e.touches.length === 1 && scale > 1 && isDraggingRef.current) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      setPosition({
        x: dragStartRef.current.posX + dx,
        y: dragStartRef.current.posY + dy,
      });
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    if (scale <= 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.002;
    const newScale = Math.min(Math.max(scale + delta, 1), 5);
    setScale(newScale);
    if (newScale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100010] bg-black flex items-center justify-center overflow-hidden touch-none select-none animate-in fade-in duration-200"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={() => {
        if (scale === 1) onClose();
      }}
    >
      {/* Kontrol di sudut kanan atas: Zoom Out, Zoom In, Reset, dan Tutup X */}
      <div
        className="absolute top-5 right-5 sm:top-6 sm:right-6 z-50 flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tombol Zoom Out */}
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={scale <= 1}
          className="w-10 h-10 rounded-full bg-black/60 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-black/60 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-90"
          title="Perkecil (-)"
        >
          <ZoomOut className="w-5 h-5 text-white" />
        </button>

        {/* Tombol Zoom In */}
        <button
          type="button"
          onClick={handleZoomIn}
          disabled={scale >= 5}
          className="w-10 h-10 rounded-full bg-black/60 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-black/60 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-90"
          title="Perbesar (+)"
        >
          <ZoomIn className="w-5 h-5 text-white" />
        </button>

        {/* Tombol Reset Zoom jika sedang dizoom */}
        {scale > 1 && (
          <button
            type="button"
            onClick={handleResetZoom}
            className="w-10 h-10 rounded-full bg-black/60 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-90"
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4 text-white" />
          </button>
        )}

        {/* Tombol Tutup X */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="w-10 h-10 rounded-full bg-black/60 hover:bg-rose-600/80 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-90"
          title="Tutup"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Konten Gambar Layar Penuh Bersih (Tanpa Teks / Keterangan Apapun) */}
      <div
        className={`w-full h-full flex items-center justify-center p-0 transition-transform duration-75 ${
          scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
        }`}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0px) scale(${scale})`,
          transformOrigin: 'center center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Preview"
            className="w-full h-full object-contain pointer-events-none"
            draggable={false}
          />
        ) : (
          <div
            className={`w-52 h-52 sm:w-64 sm:h-64 rounded-full text-white font-bold text-7xl sm:text-8xl flex items-center justify-center shadow-2xl ${
              isFemale
                ? 'bg-gradient-to-br from-rose-400 to-pink-600'
                : 'bg-gradient-to-br from-sky-500 to-indigo-600'
            }`}
          >
            {fallbackInitial.charAt(0)}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
