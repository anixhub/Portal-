import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2 } from 'lucide-react';

interface FullscreenPhotoViewerModalProps {
  photoUrl?: string;
  name: string;
  onClose: () => void;
  onDelete?: () => void;
}

export const FullscreenPhotoViewerModal: React.FC<FullscreenPhotoViewerModalProps> = ({
  photoUrl,
  name,
  onClose,
  onDelete,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const touchStartRef = useRef<{ dist: number; scale: number; x: number; y: number; posX: number; posY: number }>({ 
    dist: 0, 
    scale: 1, 
    x: 0, 
    y: 0, 
    posX: 0, 
    posY: 0 
  });
  const isDraggingRef = useRef(false);
  const lastTapRef = useRef<number>(0);

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
        posY: position.y
      };
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
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
      touchStartRef.current.x = e.touches[0].clientX;
      touchStartRef.current.y = e.touches[0].clientY;
      touchStartRef.current.posX = position.x;
      touchStartRef.current.posY = position.y;
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
        const newScale = Math.min(Math.max(touchStartRef.current.scale * factor, 1), 6);
        setScale(newScale);
        if (newScale === 1) {
          setPosition({ x: 0, y: 0 });
        }
      }
    } else if (e.touches.length === 1 && scale > 1 && isDraggingRef.current) {
      const dx = e.touches[0].clientX - touchStartRef.current.x;
      const dy = e.touches[0].clientY - touchStartRef.current.y;
      setPosition({
        x: touchStartRef.current.posX + dx,
        y: touchStartRef.current.posY + dy
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

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.002;
    const newScale = Math.min(Math.max(scale + delta, 1), 6);
    setScale(newScale);
    if (newScale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[999999] bg-black flex items-center justify-center overflow-hidden touch-none select-none animate-in fade-in duration-200"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Tombol kontrol kanan atas: Hapus dan Tutup X */}
      <div className="absolute top-5 right-5 sm:top-6 sm:right-6 z-50 flex items-center gap-3">
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="w-11 h-11 rounded-full bg-black/60 hover:bg-rose-600 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-90"
            title="Hapus foto profil"
          >
            <Trash2 className="w-5 h-5 text-white" />
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="w-11 h-11 rounded-full bg-black/60 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-90"
          title="Tutup"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Gambar layar penuh dengan zoom & pan */}
      <div
        className="w-full h-full flex items-center justify-center p-0 cursor-grab active:cursor-grabbing transition-transform duration-75"
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0px) scale(${scale})`,
          transformOrigin: 'center center'
        }}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className="w-full h-full object-contain pointer-events-none"
            draggable={false}
          />
        ) : (
          <div className="w-56 h-56 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold text-7xl flex items-center justify-center shadow-2xl">
            {name.charAt(0)}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
