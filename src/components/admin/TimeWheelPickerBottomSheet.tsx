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

  const startHourRef = useRef<HTMLDivElement>(null);
  const startMinuteRef = useRef<HTMLDivElement>(null);
  const endHourRef = useRef<HTMLDivElement>(null);
  const endMinuteRef = useRef<HTMLDivElement>(null);

  // Parse initial value
  useEffect(() => {
    if (value) {
      // Look for format like "08.00 - 15.00" or "08:00 - 15:00"
      const match = value.match(/(\d{1,2})[:.](\d{2})\s*[-–—]\s*(\d{1,2})[:.](\d{2})/);
      if (match) {
        setStartHour(String(parseInt(match[1])).padStart(2, '0'));
        setStartMinute(match[2]);
        setEndHour(String(parseInt(match[3])).padStart(2, '0'));
        setEndMinute(match[4]);
      }
    }
  }, [value, isOpen]);

  // Scroll active item into view on open
  useEffect(() => {
    if (isOpen) {
      const scrollInto = (container: HTMLDivElement | null, val: string) => {
        if (!container) return;
        const target = container.querySelector(`[data-val="${val}"]`) as HTMLElement;
        if (target) {
          target.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      };
      const timer = setTimeout(() => {
        scrollInto(startHourRef.current, startHour);
        scrollInto(startMinuteRef.current, startMinute);
        scrollInto(endHourRef.current, endHour);
        scrollInto(endMinuteRef.current, endMinute);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

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
      <div
        className="w-full max-w-md bg-white rounded-t-3xl p-5 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-200 border-t border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto" />

        {/* Clean Header */}
        <div className="flex items-center justify-between pb-1">
          <h3 className="font-bold text-sm text-slate-900">
            Pilih Waktu Kegiatan
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preview Waktu Terpilih */}
        <div className="py-2 px-4 bg-sky-50 rounded-2xl border border-sky-100/80 text-center">
          <span className="font-mono font-extrabold text-lg sm:text-xl text-sky-800 tracking-wider">
            {startHour}:{startMinute} &mdash; {endHour}:{endMinute} WIB
          </span>
        </div>

        {/* Wheel Columns: Satu Baris Jam Menit - Jam Menit */}
        <div className="relative flex items-center justify-center gap-1 sm:gap-2 px-2 py-3 bg-slate-50 rounded-2xl border border-slate-200/80 overflow-hidden">
          {/* Middle highlight band */}
          <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-10 bg-white rounded-xl shadow-xs border border-sky-200 pointer-events-none" />

          {/* Kolom 1: Jam Mulai */}
          <div
            ref={startHourRef}
            className="flex-1 h-36 overflow-y-auto scroll-smooth py-12 flex flex-col items-center z-10 no-scrollbar"
          >
            {HOURS.map((h) => (
              <button
                key={`sh-${h}`}
                type="button"
                data-val={h}
                onClick={() => setStartHour(h)}
                className={`h-9 w-full flex items-center justify-center font-mono text-sm shrink-0 cursor-pointer transition-all ${
                  startHour === h
                    ? 'font-bold text-sky-600 scale-110'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {h}
              </button>
            ))}
          </div>

          <span className="font-bold text-slate-400 text-sm z-10">:</span>

          {/* Kolom 2: Menit Mulai */}
          <div
            ref={startMinuteRef}
            className="flex-1 h-36 overflow-y-auto scroll-smooth py-12 flex flex-col items-center z-10 no-scrollbar"
          >
            {MINUTES.map((m) => (
              <button
                key={`sm-${m}`}
                type="button"
                data-val={m}
                onClick={() => setStartMinute(m)}
                className={`h-9 w-full flex items-center justify-center font-mono text-sm shrink-0 cursor-pointer transition-all ${
                  startMinute === m
                    ? 'font-bold text-sky-600 scale-110'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Separator Strip */}
          <div className="px-1 text-slate-400 font-bold text-base z-10">
            &mdash;
          </div>

          {/* Kolom 3: Jam Selesai */}
          <div
            ref={endHourRef}
            className="flex-1 h-36 overflow-y-auto scroll-smooth py-12 flex flex-col items-center z-10 no-scrollbar"
          >
            {HOURS.map((h) => (
              <button
                key={`eh-${h}`}
                type="button"
                data-val={h}
                onClick={() => setEndHour(h)}
                className={`h-9 w-full flex items-center justify-center font-mono text-sm shrink-0 cursor-pointer transition-all ${
                  endHour === h
                    ? 'font-bold text-sky-600 scale-110'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {h}
              </button>
            ))}
          </div>

          <span className="font-bold text-slate-400 text-sm z-10">:</span>

          {/* Kolom 4: Menit Selesai */}
          <div
            ref={endMinuteRef}
            className="flex-1 h-36 overflow-y-auto scroll-smooth py-12 flex flex-col items-center z-10 no-scrollbar"
          >
            {MINUTES.map((m) => (
              <button
                key={`em-${m}`}
                type="button"
                data-val={m}
                onClick={() => setEndMinute(m)}
                className={`h-9 w-full flex items-center justify-center font-mono text-sm shrink-0 cursor-pointer transition-all ${
                  endMinute === m
                    ? 'font-bold text-sky-600 scale-110'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Simpan Button */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-2xl text-xs transition-colors cursor-pointer shadow-md shadow-sky-600/20 flex items-center justify-center gap-1.5"
        >
          <Check className="w-4 h-4" />
          <span>Terapkan Waktu</span>
        </button>
      </div>
    </div>
  );
};
