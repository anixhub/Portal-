import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';

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

const ITEM_HEIGHT = 50; // px per baris
// Container height = 150px (3 baris: atas 50px, tengah 50px, bawah 50px)
const PADDING_SPACER = 50; // Spacer atas & bawah tepat 50px agar item pertama & terakhir pas di tengah (75px)

export const DateWheelPicker: React.FC<DateWheelPickerProps> = ({
  value,
  onChange,
  minYear = 1940,
  maxYear = 2050,
}) => {
  // Parse date value safely
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
  const selectedMonth = isNaN(initialDate.getMonth()) ? 0 : initialDate.getMonth();
  const selectedDay = isNaN(initialDate.getDate()) ? 1 : initialDate.getDate();

  // Days in month according to leap year and calendar rules
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const validDay = Math.min(selectedDay, daysInMonth);

  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);
  const years = useMemo(
    () => Array.from({ length: Math.max(1, maxYear - minYear + 1) }, (_, i) => minYear + i),
    [minYear, maxYear]
  );

  // Active highlighted items during scroll
  const [activeDay, setActiveDay] = useState(validDay);
  const [activeMonth, setActiveMonth] = useState(selectedMonth);
  const [activeYear, setActiveYear] = useState(selectedYear);

  const dayRef = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);

  const isUserScrollingRef = useRef<{ day: boolean; month: boolean; year: boolean }>({
    day: false,
    month: false,
    year: false,
  });

  const scrollTimerRef = useRef<{ day?: any; month?: any; year?: any }>({});

  const updateDate = useCallback(
    (newYear: number, newMonth: number, newDay: number) => {
      const maxDays = new Date(newYear, newMonth + 1, 0).getDate();
      const clampedDay = Math.max(1, Math.min(newDay, maxDays));
      const mm = String(newMonth + 1).padStart(2, '0');
      const dd = String(clampedDay).padStart(2, '0');
      onChange(`${newYear}-${mm}-${dd}`);
    },
    [onChange]
  );

  // Auto-clamp when daysInMonth changes (e.g., February leap year 28/29 or 30-day month)
  useEffect(() => {
    if (activeDay > daysInMonth) {
      setActiveDay(daysInMonth);
      if (dayRef.current) {
        dayRef.current.scrollTop = (daysInMonth - 1) * ITEM_HEIGHT;
      }
      updateDate(selectedYear, selectedMonth, daysInMonth);
    }
  }, [daysInMonth, activeDay, selectedYear, selectedMonth, updateDate]);

  // Sync scroll position whenever value changes externally
  useEffect(() => {
    setActiveDay(validDay);
    if (dayRef.current && !isUserScrollingRef.current.day) {
      const targetScroll = (validDay - 1) * ITEM_HEIGHT;
      if (Math.abs(dayRef.current.scrollTop - targetScroll) > 2) {
        dayRef.current.scrollTop = targetScroll;
      }
    }
  }, [validDay]);

  useEffect(() => {
    setActiveMonth(selectedMonth);
    if (monthRef.current && !isUserScrollingRef.current.month) {
      const targetScroll = selectedMonth * ITEM_HEIGHT;
      if (Math.abs(monthRef.current.scrollTop - targetScroll) > 2) {
        monthRef.current.scrollTop = targetScroll;
      }
    }
  }, [selectedMonth]);

  useEffect(() => {
    setActiveYear(selectedYear);
    if (yearRef.current && !isUserScrollingRef.current.year) {
      const yearIndex = years.indexOf(selectedYear);
      if (yearIndex >= 0) {
        const targetScroll = yearIndex * ITEM_HEIGHT;
        if (Math.abs(yearRef.current.scrollTop - targetScroll) > 2) {
          yearRef.current.scrollTop = targetScroll;
        }
      }
    }
  }, [selectedYear, years]);

  const handleScroll = (type: 'day' | 'month' | 'year', container: HTMLDivElement | null) => {
    if (!container) return;
    isUserScrollingRef.current[type] = true;

    const scrollTop = container.scrollTop;
    const snapIdx = Math.round(scrollTop / ITEM_HEIGHT);

    // Update real-time visually highlighted item while scrolling
    if (type === 'day') {
      const d = Math.max(1, Math.min(daysInMonth, snapIdx + 1));
      setActiveDay(d);
    } else if (type === 'month') {
      const m = Math.max(0, Math.min(11, snapIdx));
      setActiveMonth(m);
    } else if (type === 'year') {
      const yIdx = Math.max(0, Math.min(years.length - 1, snapIdx));
      if (years[yIdx]) {
        setActiveYear(years[yIdx]);
      }
    }

    if (scrollTimerRef.current[type]) {
      clearTimeout(scrollTimerRef.current[type]);
    }

    // Scroll end debouncer: ensures the element lands EXACTLY at snapIdx * ITEM_HEIGHT dead center
    scrollTimerRef.current[type] = setTimeout(() => {
      if (!container) return;

      const currentScrollTop = container.scrollTop;
      const targetIdx = Math.round(currentScrollTop / ITEM_HEIGHT);

      if (type === 'day') {
        const clampedDay = Math.max(1, Math.min(daysInMonth, targetIdx + 1));
        const finalScroll = (clampedDay - 1) * ITEM_HEIGHT;
        if (Math.abs(container.scrollTop - finalScroll) > 1) {
          container.scrollTo({ top: finalScroll, behavior: 'smooth' });
        }
        setActiveDay(clampedDay);
        updateDate(selectedYear, selectedMonth, clampedDay);
      } else if (type === 'month') {
        const clampedMonth = Math.max(0, Math.min(11, targetIdx));
        const finalScroll = clampedMonth * ITEM_HEIGHT;
        if (Math.abs(container.scrollTop - finalScroll) > 1) {
          container.scrollTo({ top: finalScroll, behavior: 'smooth' });
        }
        setActiveMonth(clampedMonth);
        const maxDaysForNewMonth = new Date(selectedYear, clampedMonth + 1, 0).getDate();
        const adjustedDay = Math.min(activeDay, maxDaysForNewMonth);
        setActiveDay(adjustedDay);
        updateDate(selectedYear, clampedMonth, adjustedDay);
      } else if (type === 'year') {
        const clampedYearIdx = Math.max(0, Math.min(years.length - 1, targetIdx));
        const finalScroll = clampedYearIdx * ITEM_HEIGHT;
        const newYear = years[clampedYearIdx];
        if (Math.abs(container.scrollTop - finalScroll) > 1) {
          container.scrollTo({ top: finalScroll, behavior: 'smooth' });
        }
        if (newYear) {
          setActiveYear(newYear);
          const maxDaysForNewYear = new Date(newYear, selectedMonth + 1, 0).getDate();
          const adjustedDay = Math.min(activeDay, maxDaysForNewYear);
          setActiveDay(adjustedDay);
          updateDate(newYear, selectedMonth, adjustedDay);
        }
      }

      setTimeout(() => {
        isUserScrollingRef.current[type] = false;
      }, 150);
    }, 120);
  };

  const handleItemClick = (type: 'day' | 'month' | 'year', val: number) => {
    if (type === 'day') {
      setActiveDay(val);
      updateDate(selectedYear, selectedMonth, val);
      dayRef.current?.scrollTo({ top: (val - 1) * ITEM_HEIGHT, behavior: 'smooth' });
    } else if (type === 'month') {
      setActiveMonth(val);
      const maxDaysForNewMonth = new Date(selectedYear, val + 1, 0).getDate();
      const adjustedDay = Math.min(activeDay, maxDaysForNewMonth);
      setActiveDay(adjustedDay);
      updateDate(selectedYear, val, adjustedDay);
      monthRef.current?.scrollTo({ top: val * ITEM_HEIGHT, behavior: 'smooth' });
    } else if (type === 'year') {
      setActiveYear(val);
      const maxDaysForNewYear = new Date(val, selectedMonth + 1, 0).getDate();
      const adjustedDay = Math.min(activeDay, maxDaysForNewYear);
      setActiveDay(adjustedDay);
      updateDate(val, selectedMonth, adjustedDay);
      const idx = years.indexOf(val);
      if (idx !== -1) {
        yearRef.current?.scrollTo({ top: idx * ITEM_HEIGHT, behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="w-full relative select-none max-w-xs mx-auto py-1">
      {/* 3-Column Wheel Container (Tinggi 150px = 3 baris item) */}
      <div className="relative h-[150px] flex items-stretch justify-center gap-2 sm:gap-4 overflow-hidden px-2">
        {/* Garis batas seleksi tengah (50px persis di tengah 50px-100px) */}
        <div 
          className="absolute inset-x-2 top-[50px] h-[50px] border-y-2 border-sky-300 bg-sky-100/30 pointer-events-none z-10 rounded-xl shadow-xs" 
          aria-hidden="true"
        />

        {/* Gradien fade atas & bawah agar estetik ala iOS picker */}
        <div 
          className="absolute inset-x-0 top-0 h-11 bg-gradient-to-b from-white via-white/80 to-transparent pointer-events-none z-20" 
          aria-hidden="true" 
        />
        <div 
          className="absolute inset-x-0 bottom-0 h-11 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-20" 
          aria-hidden="true" 
        />

        {/* 1. KOLOM TANGGAL (01 - 31) */}
        <div className="w-20 h-full relative z-10">
          <div
            ref={dayRef}
            onScroll={() => handleScroll('day', dayRef.current)}
            className="w-full h-full overflow-y-auto no-scrollbar snap-y snap-mandatory text-center touch-pan-y"
            style={{
              overscrollBehavior: 'contain',
              scrollSnapType: 'y mandatory',
            }}
          >
            {/* Top Spacer persis 50px agar item pertama mendarat di tengah */}
            <div style={{ height: `${PADDING_SPACER}px`, scrollSnapAlign: 'none' }} className="shrink-0 pointer-events-none" aria-hidden="true" />
            {days.map((d) => {
              const isSelected = d === activeDay;
              const formatted = String(d).padStart(2, '0');
              return (
                <div
                  key={d}
                  onClick={() => handleItemClick('day', d)}
                  style={{
                    height: `${ITEM_HEIGHT}px`,
                    scrollSnapAlign: 'center',
                    scrollSnapStop: 'always',
                  }}
                  className={`flex items-center justify-center cursor-pointer transition-all duration-100 select-none ${
                    isSelected
                      ? 'text-sky-900 font-black text-2xl scale-110 drop-shadow-xs'
                      : 'text-slate-400 font-medium text-base hover:text-slate-600 opacity-60'
                  }`}
                >
                  {formatted}
                </div>
              );
            })}
            {/* Bottom Spacer persis 50px agar item terakhir mendarat di tengah */}
            <div style={{ height: `${PADDING_SPACER}px`, scrollSnapAlign: 'none' }} className="shrink-0 pointer-events-none" aria-hidden="true" />
          </div>
        </div>

        {/* 2. KOLOM BULAN (JAN - DES) */}
        <div className="w-24 h-full relative z-10">
          <div
            ref={monthRef}
            onScroll={() => handleScroll('month', monthRef.current)}
            className="w-full h-full overflow-y-auto no-scrollbar snap-y snap-mandatory text-center touch-pan-y"
            style={{
              overscrollBehavior: 'contain',
              scrollSnapType: 'y mandatory',
            }}
          >
            {/* Top Spacer */}
            <div style={{ height: `${PADDING_SPACER}px`, scrollSnapAlign: 'none' }} className="shrink-0 pointer-events-none" aria-hidden="true" />
            {BULAN_SINGKAT.map((m, idx) => {
              const isSelected = idx === activeMonth;
              return (
                <div
                  key={m}
                  onClick={() => handleItemClick('month', idx)}
                  style={{
                    height: `${ITEM_HEIGHT}px`,
                    scrollSnapAlign: 'center',
                    scrollSnapStop: 'always',
                  }}
                  className={`flex items-center justify-center cursor-pointer transition-all duration-100 select-none ${
                    isSelected
                      ? 'text-sky-900 font-black text-2xl scale-110 drop-shadow-xs'
                      : 'text-slate-400 font-medium text-base hover:text-slate-600 opacity-60'
                  }`}
                >
                  {m}
                </div>
              );
            })}
            {/* Bottom Spacer */}
            <div style={{ height: `${PADDING_SPACER}px`, scrollSnapAlign: 'none' }} className="shrink-0 pointer-events-none" aria-hidden="true" />
          </div>
        </div>

        {/* 3. KOLOM TAHUN (2020 - 2035) */}
        <div className="w-24 h-full relative z-10">
          <div
            ref={yearRef}
            onScroll={() => handleScroll('year', yearRef.current)}
            className="w-full h-full overflow-y-auto no-scrollbar snap-y snap-mandatory text-center touch-pan-y"
            style={{
              overscrollBehavior: 'contain',
              scrollSnapType: 'y mandatory',
            }}
          >
            {/* Top Spacer */}
            <div style={{ height: `${PADDING_SPACER}px`, scrollSnapAlign: 'none' }} className="shrink-0 pointer-events-none" aria-hidden="true" />
            {years.map((y) => {
              const isSelected = y === activeYear;
              return (
                <div
                  key={y}
                  onClick={() => handleItemClick('year', y)}
                  style={{
                    height: `${ITEM_HEIGHT}px`,
                    scrollSnapAlign: 'center',
                    scrollSnapStop: 'always',
                  }}
                  className={`flex items-center justify-center cursor-pointer transition-all duration-100 select-none ${
                    isSelected
                      ? 'text-sky-900 font-black text-2xl scale-110 drop-shadow-xs'
                      : 'text-slate-400 font-medium text-base hover:text-slate-600 opacity-60'
                  }`}
                >
                  {y}
                </div>
              );
            })}
            {/* Bottom Spacer */}
            <div style={{ height: `${PADDING_SPACER}px`, scrollSnapAlign: 'none' }} className="shrink-0 pointer-events-none" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
};
