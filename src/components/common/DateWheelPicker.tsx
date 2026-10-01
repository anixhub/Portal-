import React, { useRef, useEffect, useLayoutEffect } from 'react';

interface DateWheelPickerProps {
  value: string; // Format: 'YYYY-MM-DD'
  onChange: (value: string) => void;
  minYear?: number;
  maxYear?: number;
}

const BULAN_SINGKAT = [
  'JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN',
  'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'
];

export const DateWheelPicker: React.FC<DateWheelPickerProps> = ({
  value,
  onChange,
  minYear = 1980,
  maxYear = 2035,
}) => {
  // Parse date value
  let initialDate = new Date();
  if (value) {
    const parts = value.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        initialDate = new Date(y, m, d);
      }
    }
  }

  const selectedYear = isNaN(initialDate.getFullYear()) ? 2026 : initialDate.getFullYear();
  const selectedMonth = isNaN(initialDate.getMonth()) ? 5 : initialDate.getMonth(); // 0-indexed (5 = JUN)
  const selectedDay = isNaN(initialDate.getDate()) ? 30 : initialDate.getDate();

  // Days in month
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const validDay = Math.min(selectedDay, daysInMonth);

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

  const dayRef = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);

  const ITEM_HEIGHT = 50; // px
  const PADDING_OFFSET = 50; // 3 visible rows: 1 above (50px), 1 center (50px), 1 below (50px)

  const updateDate = (newYear: number, newMonth: number, newDay: number) => {
    const maxDays = new Date(newYear, newMonth + 1, 0).getDate();
    const clampedDay = Math.min(newDay, maxDays);
    const mm = String(newMonth + 1).padStart(2, '0');
    const dd = String(clampedDay).padStart(2, '0');
    onChange(`${newYear}-${mm}-${dd}`);
  };

  // Sync scroll positions without flicker
  useLayoutEffect(() => {
    if (dayRef.current) {
      dayRef.current.scrollTop = (validDay - 1) * ITEM_HEIGHT;
    }
    if (monthRef.current) {
      monthRef.current.scrollTop = selectedMonth * ITEM_HEIGHT;
    }
    if (yearRef.current) {
      const yearIndex = years.indexOf(selectedYear);
      if (yearIndex >= 0) {
        yearRef.current.scrollTop = yearIndex * ITEM_HEIGHT;
      }
    }
  }, []);

  useEffect(() => {
    if (dayRef.current) {
      dayRef.current.scrollTop = (validDay - 1) * ITEM_HEIGHT;
    }
    if (monthRef.current) {
      monthRef.current.scrollTop = selectedMonth * ITEM_HEIGHT;
    }
    if (yearRef.current) {
      const yearIndex = years.indexOf(selectedYear);
      if (yearIndex >= 0) {
        yearRef.current.scrollTop = yearIndex * ITEM_HEIGHT;
      }
    }
  }, [selectedYear, selectedMonth, validDay, years]);

  // Handle scroll snap selection
  const handleScrollEnd = (
    ref: React.RefObject<HTMLDivElement | null>,
    type: 'day' | 'month' | 'year'
  ) => {
    if (!ref.current) return;
    const scrollTop = ref.current.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);

    if (type === 'day') {
      const newDay = Math.max(1, Math.min(daysInMonth, index + 1));
      if (newDay !== validDay) {
        updateDate(selectedYear, selectedMonth, newDay);
      }
    } else if (type === 'month') {
      const newMonth = Math.max(0, Math.min(11, index));
      if (newMonth !== selectedMonth) {
        updateDate(selectedYear, newMonth, validDay);
      }
    } else if (type === 'year') {
      const newYear = years[Math.max(0, Math.min(years.length - 1, index))];
      if (newYear && newYear !== selectedYear) {
        updateDate(newYear, selectedMonth, validDay);
      }
    }
  };

  return (
    <div className="w-full relative select-none max-w-xs mx-auto py-1">
      {/* 3-Column Wheel Container persis seperti di screenshot */}
      <div className="relative h-[150px] flex items-stretch justify-center gap-2 sm:gap-4 overflow-hidden px-2">
        {/* Subtle center selector divider lines */}
        <div className="absolute inset-x-2 top-[50px] h-[50px] border-y border-slate-100/90 pointer-events-none z-10" />

        {/* Soft top & bottom gradient fades */}
        <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white via-white/80 to-transparent pointer-events-none z-20" />
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-20" />

        {/* 1. COLUMN: TANGGAL (01 - 31) */}
        <div className="w-20 h-full relative z-10">
          <div
            ref={dayRef}
            onTouchEnd={() => setTimeout(() => handleScrollEnd(dayRef, 'day'), 80)}
            onMouseUp={() => setTimeout(() => handleScrollEnd(dayRef, 'day'), 80)}
            onWheel={() => setTimeout(() => handleScrollEnd(dayRef, 'day'), 120)}
            className="w-full h-full overflow-y-auto no-scrollbar snap-y snap-mandatory text-center"
            style={{
              paddingTop: `${PADDING_OFFSET}px`,
              paddingBottom: `${PADDING_OFFSET}px`,
            }}
          >
            {days.map((d) => {
              const isSelected = d === validDay;
              const formatted = String(d).padStart(2, '0');
              return (
                <div
                  key={d}
                  onClick={() => updateDate(selectedYear, selectedMonth, d)}
                  className={`h-[50px] flex items-center justify-center snap-center cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'text-slate-900 font-bold text-2xl scale-105'
                      : 'text-slate-300 font-medium text-xl hover:text-slate-400'
                  }`}
                >
                  {formatted}
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. COLUMN: BULAN (JAN - DES) */}
        <div className="w-24 h-full relative z-10">
          <div
            ref={monthRef}
            onTouchEnd={() => setTimeout(() => handleScrollEnd(monthRef, 'month'), 80)}
            onMouseUp={() => setTimeout(() => handleScrollEnd(monthRef, 'month'), 80)}
            onWheel={() => setTimeout(() => handleScrollEnd(monthRef, 'month'), 120)}
            className="w-full h-full overflow-y-auto no-scrollbar snap-y snap-mandatory text-center"
            style={{
              paddingTop: `${PADDING_OFFSET}px`,
              paddingBottom: `${PADDING_OFFSET}px`,
            }}
          >
            {BULAN_SINGKAT.map((m, idx) => {
              const isSelected = idx === selectedMonth;
              return (
                <div
                  key={m}
                  onClick={() => updateDate(selectedYear, idx, validDay)}
                  className={`h-[50px] flex items-center justify-center snap-center cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'text-slate-900 font-bold text-2xl scale-105'
                      : 'text-slate-300 font-medium text-xl hover:text-slate-400'
                  }`}
                >
                  {m}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. COLUMN: TAHUN (e.g. 2026) */}
        <div className="w-24 h-full relative z-10">
          <div
            ref={yearRef}
            onTouchEnd={() => setTimeout(() => handleScrollEnd(yearRef, 'year'), 80)}
            onMouseUp={() => setTimeout(() => handleScrollEnd(yearRef, 'year'), 80)}
            onWheel={() => setTimeout(() => handleScrollEnd(yearRef, 'year'), 120)}
            className="w-full h-full overflow-y-auto no-scrollbar snap-y snap-mandatory text-center"
            style={{
              paddingTop: `${PADDING_OFFSET}px`,
              paddingBottom: `${PADDING_OFFSET}px`,
            }}
          >
            {years.map((y) => {
              const isSelected = y === selectedYear;
              return (
                <div
                  key={y}
                  onClick={() => updateDate(y, selectedMonth, validDay)}
                  className={`h-[50px] flex items-center justify-center snap-center cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'text-slate-900 font-bold text-2xl scale-105'
                      : 'text-slate-300 font-medium text-xl hover:text-slate-400'
                  }`}
                >
                  {y}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
