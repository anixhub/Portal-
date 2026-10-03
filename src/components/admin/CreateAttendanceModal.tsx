import React, { useState, useEffect } from 'react';
import { X, Calendar, Check, ChevronRight } from 'lucide-react';
import { EventAgenda } from '../../types';
import { DateWheelPicker } from '../common/DateWheelPicker';

interface CreateAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventList: EventAgenda[];
  initialEvent?: EventAgenda | null;
  onSave: (session: {
    title: string;
    date: string;
    sourceEventId?: string;
    sourceType: 'imported' | 'manual';
  }) => void;
}

export const CreateAttendanceModal: React.FC<CreateAttendanceModalProps> = ({
  isOpen,
  onClose,
  eventList,
  initialEvent,
  onSave,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isDatePickerModalOpen, setIsDatePickerModalOpen] = useState(false);
  const [tempDateIso, setTempDateIso] = useState('2026-10-20');

  useEffect(() => {
    if (initialEvent) {
      setSelectedEventId(initialEvent.id);
      setTitle(initialEvent.title);
      setDate(initialEvent.date || '');
    } else {
      setSelectedEventId('');
      setTitle('');
      setDate('');
    }
  }, [initialEvent, isOpen]);

  const indonesianMonthMap: Record<string, string> = {
    januari: '01', februari: '02', maret: '03', april: '04',
    mei: '05', juni: '06', juli: '07', agustus: '08',
    september: '09', oktober: '10', november: '11', desember: '12'
  };

  const indonesianMonths = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const parseIndonesianDateToIso = (str: string): string => {
    if (!str) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 3) {
      const day = parts[0].padStart(2, '0');
      const month = indonesianMonthMap[parts[1].toLowerCase()];
      const year = parts[2];
      if (day && month && year) {
        return `${year}-${month}-${day}`;
      }
    }
    return '';
  };

  const formatToIndonesianDate = (isoStr: string) => {
    if (!isoStr) return '';
    const [y, m, d] = isoStr.split('-');
    if (!y || !m || !d) return isoStr;
    const monthIdx = parseInt(m, 10) - 1;
    const monthName = indonesianMonths[monthIdx] || m;
    return `${parseInt(d, 10)} ${monthName} ${y}`;
  };

  const handleSelectEvent = (ev: EventAgenda) => {
    setSelectedEventId(ev.id);
    setTitle(ev.title);
    setDate(ev.date || '');
    setIsPickerOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      date: date.trim() || '-',
      sourceEventId: selectedEventId || undefined,
      sourceType: selectedEventId ? 'imported' : 'manual',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100020] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl border border-slate-100 flex flex-col gap-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bersih Tanpa Icon & Tanpa Keterangan */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-sm text-slate-900 leading-tight">
            Buat Presensi
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body 2 Kotak Minimalis */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Kotak 1: Nama Agenda */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Agenda
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ketik nama agenda..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-none transition-colors"
            />
            {/* Tombol Impor di bawah kotak nama agenda */}
            <div className="mt-1.5 flex items-center justify-start">
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Impor dari Agenda</span>
              </button>
            </div>
          </div>

          {/* Kotak 2: Tanggal */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tanggal
            </label>
            <div
              onClick={() => {
                const curIso = parseIndonesianDateToIso(date) || new Date().toISOString().split('T')[0];
                setTempDateIso(curIso);
                setIsDatePickerModalOpen(true);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl font-semibold text-slate-900 flex items-center justify-between cursor-pointer transition-colors group"
            >
              <span className={date ? 'text-slate-900 text-xs' : 'text-slate-400 font-normal text-xs'}>
                {date ? date : 'Belum ditentukan (klik untuk pilih tanggal)'}
              </span>
              <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-sky-600 transition-colors">
                {date && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDate('');
                    }}
                    className="w-5 h-5 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
                    title="Hapus tanggal"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <Calendar className="w-4 h-4 shrink-0" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-sky-600/20 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Buat Presensi</span>
            </button>
          </div>
        </form>
      </div>

      {/* ================= MODAL PEMILIH AGENDA ================= */}
      {isPickerOpen && (
        <div
          className="fixed inset-0 z-[100030] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsPickerOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl border border-slate-100 flex flex-col gap-3 animate-in zoom-in-95 duration-150 max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h4 className="font-bold text-sm text-slate-900">
                Pilih Agenda
              </h4>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto divide-y divide-slate-100 -mr-1 pr-1 max-h-[55vh]">
              {eventList.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => handleSelectEvent(ev)}
                  className="py-2.5 px-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-slate-900 truncate">
                      {ev.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {ev.date}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              ))}

              {eventList.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-6">
                  Belum ada agenda di halaman agenda.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL PEMILIH TANGGAL (WHEEL PICKER) ================= */}
      {isDatePickerModalOpen && (
        <div
          className="fixed inset-0 z-[100035] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsDatePickerModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl border border-slate-100 flex flex-col gap-3.5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-600" />
                <h4 className="font-bold text-sm text-slate-900">
                  Pilih Tanggal Presensi
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsDatePickerModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-2.5 px-4 bg-sky-50/90 rounded-2xl border border-sky-100 text-center shadow-2xs">
              <span className="text-[10px] text-sky-600 font-bold uppercase tracking-wider block mb-0.5">
                Tanggal Terpilih
              </span>
              <span className="font-bold text-base text-sky-900">
                {formatToIndonesianDate(tempDateIso)}
              </span>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-2.5">
              <DateWheelPicker
                value={tempDateIso}
                onChange={(newVal) => setTempDateIso(newVal)}
                minYear={2020}
                maxYear={2035}
              />
            </div>

            {/* Tombol Pintas Hari Ini */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => {
                  const todayIso = new Date().toISOString().split('T')[0];
                  setTempDateIso(todayIso);
                }}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer"
              >
                Atur ke Hari Ini
              </button>
            </div>

            <div className="flex gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDatePickerModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setDate(formatToIndonesianDate(tempDateIso));
                  setIsDatePickerModalOpen(false);
                }}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-sky-600/20 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Terapkan Tanggal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
