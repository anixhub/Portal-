import React, { useState, useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';

interface TimeWheelPickerBottomSheetProps {
  isOpen: boolean;
  value: string;
  onClose: () => void;
  onSelect: (timeRange: string) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

const ITEM_HEIGHT = 44; // px
const VISIBLE_COUNT = 5; // 2 above, 1 center, 2 below
const PADDING_OFFSET = ITEM_HEIGHT * 2; // 88px

interface MagnetColumnProps {
  items: string[];
  selected: string;
  onSelect: (val: string) => void;
  label?: string;
}

const MagnetColumn: React.FC<MagnetColumnProps> = ({
  items,
  selected,
  onSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<any>(null);

  // Initial scroll into center
  useEffect(() => {
    if (containerRef.current && !isScrollingRef.current) {
      const idx = items.indexOf(selected);
      if (idx !== -1) {
        containerRef.current.scrollTo({
          top: idx * ITEM_HEIGHT,
          behavior: 'auto',
        });
      }
    }
  }, [selected, items]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    isScrollingRef.current = true;
    clearTimeout(scrollTimeoutRef.current);
    const scrollTop = e.currentTarget.scrollTop;
    const targetIdx = Math.max(0, Math.min(items.length - 1, Math.round(scrollTop / ITEM_HEIGHT)));
    if (items[targetIdx] && items[targetIdx] !== selected) {
      onSelect(items[targetIdx]);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
      if (containerRef.current) {
        const finalScroll = containerRef.current.scrollTop;
        const snapIdx = Math.max(0, Math.min(items.length - 1, Math.round(finalScroll / ITEM_HEIGHT)));
        if (items[snapIdx] && items[snapIdx] !== selected) {
          onSelect(items[snapIdx]);
        }
      }
    }, 120);
  };

  const handleItemClick = (val: string) => {
    onSelect(val);
    const idx = items.indexOf(val);
    if (containerRef.current && idx !== -1) {
      containerRef.current.scrollTo({
        top: idx * ITEM_HEIGHT,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 h-[220px] overflow-y-auto snap-y snap-mandatory no-scrollbar select-none relative z-10"
      style={{
        scrollSnapType: 'y mandatory',
      }}
    >
      {/* Spacer top for centering */}
      <div style={{ height: `${PADDING_OFFSET}px` }} aria-hidden="true" />
      {items.map((val) => {
        const isSelected = val === selected;
        return (
          <div
            key={val}
            onClick={() => handleItemClick(val)}
            className={`h-[44px] flex items-center justify-center font-mono cursor-pointer snap-center transition-all duration-150 select-none ${
              isSelected
                ? 'font-extrabold text-sky-600 text-xl scale-110 drop-shadow-xs'
                : 'font-semibold text-slate-400 text-sm hover:text-slate-600 opacity-60 scale-95'
            }`}
          >
            {val}
          </div>
        );
      })}
      {/* Spacer bottom for centering */}
      <div style={{ height: `${PADDING_OFFSET}px` }} aria-hidden="true" />
    </div>
  );
};

export const TimeWheelPickerBottomSheet: React.FC<TimeWheelPickerBottomSheetProps> = ({
  isOpen,
  value,
  onClose,
  onSelect,
}) => {
  const [startHour, setStartHour] = useState('08');
  const [startMinute, setStartMinute] = useState('00');
  const [endHour, setEndHour] = useState('15');
  const [endMinute, setEndMinute] = useState('00');

  // Parse initial value
  useEffect(() => {
    if (value) {
      const match = value.match(/(\d{1,2})[:.](\d{2})\s*[-–—]\s*(\d{1,2})[:.](\d{2})/);
      if (match) {
        setStartHour(String(parseInt(match[1], 10)).padStart(2, '0'));
        setStartMinute(match[2]);
        setEndHour(String(parseInt(match[3], 10)).padStart(2, '0'));
        setEndMinute(match[4]);
      }
    }
  }, [value, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const formatted = `${startHour}.${startMinute} - ${endHour}.${endMinute} WIB`;
    onSelect(formatted);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100060] bg-black/60 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      {/* Bottom Sheet selebar layar (w-full max-w-none edge-to-edge) */}
      <div
        className="w-full max-w-none bg-white rounded-t-[32px] sm:rounded-t-[36px] p-5 sm:p-6 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-200 border-t border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto" />

        {/* Clean Header */}
        <div className="flex items-center justify-between pb-1">
          <div>
            <h3 className="font-bold text-base text-slate-900 leading-tight">
              Pilih Waktu Kegiatan
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Gulir angka untuk menyesuaikan jam mulai dan selesai
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preview Waktu Terpilih */}
        <div className="py-2.5 px-4 bg-sky-50/90 rounded-2xl border border-sky-100 text-center shadow-2xs">
          <span className="text-[11px] text-sky-600 font-bold uppercase tracking-wider block mb-0.5">
            Waktu Acara
          </span>
          <span className="font-mono font-extrabold text-xl sm:text-2xl text-sky-800 tracking-wider">
            {startHour}:{startMinute} &mdash; {endHour}:{endMinute} WIB
          </span>
        </div>

        {/* Labels Jam Mulai - Jam Selesai */}
        <div className="grid grid-cols-2 text-center text-xs font-bold text-slate-500 px-4">
          <span>JAM MULAI</span>
          <span>JAM SELESAI</span>
        </div>

        {/* Wheel Columns Container: Satu Baris Sejajar Penuh dengan Efek Magnet & Highlight Bar */}
        <div className="relative flex items-center justify-center gap-1 sm:gap-2 px-3 py-1 bg-slate-50 rounded-3xl border border-slate-200/90 overflow-hidden shadow-inner">
          {/* Middle highlight band yang persis di tengah dan sejajar antar semua angka */}
          <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-[44px] bg-white rounded-2xl shadow-sm border border-sky-300 pointer-events-none z-0" />

          {/* Kolom 1: Jam Mulai */}
          <MagnetColumn
            items={HOURS}
            selected={startHour}
            onSelect={setStartHour}
          />

          {/* Separator Titik Dua Mulai (Tepat di Center) */}
          <div className="w-3 flex items-center justify-center font-mono font-extrabold text-slate-400 text-lg z-10 select-none">
            :
          </div>

          {/* Kolom 2: Menit Mulai */}
          <MagnetColumn
            items={MINUTES}
            selected={startMinute}
            onSelect={setStartMinute}
          />

          {/* Separator Garis Tengah (Tepat di Center) */}
          <div className="px-2 flex items-center justify-center font-bold text-slate-400 text-base z-10 select-none">
            &mdash;
          </div>

          {/* Kolom 3: Jam Selesai */}
          <MagnetColumn
            items={HOURS}
            selected={endHour}
            onSelect={setEndHour}
          />

          {/* Separator Titik Dua Selesai (Tepat di Center) */}
          <div className="w-3 flex items-center justify-center font-mono font-extrabold text-slate-400 text-lg z-10 select-none">
            :
          </div>

          {/* Kolom 4: Menit Selesai */}
          <MagnetColumn
            items={MINUTES}
            selected={endMinute}
            onSelect={setEndMinute}
          />
        </div>

        {/* Simpan Button */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 active:scale-[0.99] text-white font-bold rounded-2xl text-sm transition-all cursor-pointer shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          <span>Terapkan Waktu</span>
        </button>
      </div>
    </div>
  );
};
