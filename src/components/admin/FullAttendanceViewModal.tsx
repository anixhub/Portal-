import React, { useState } from 'react';
import { 
  ArrowLeft, 
  QrCode, 
  Search, 
  Download, 
  Calendar, 
  Clock, 
  UserCheck, 
  Trash2, 
  User, 
  X, 
  Check, 
  Sparkles,
  Users,
  FileSpreadsheet
} from 'lucide-react';
import { AttendanceSession, AttendanceAttendee, AlumniRecord } from '../../types';
import { EventAttendanceScannerModal } from './EventAttendanceScannerModal';

interface FullAttendanceViewModalProps {
  session: AttendanceSession;
  alumniList: AlumniRecord[];
  onClose: () => void;
  onUpdateSessionAttendees: (sessionId: string, newAttendees: AttendanceAttendee[]) => void;
}

export const FullAttendanceViewModal: React.FC<FullAttendanceViewModalProps> = ({
  session,
  alumniList,
  onClose,
  onUpdateSessionAttendees,
}) => {
  const [searchAttendeeQuery, setSearchAttendeeQuery] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [attendeeToDelete, setAttendeeToDelete] = useState<{ id: string; name: string } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2600);
  };

  // Add attendee
  const handleRecordAttendee = (newAttendee: AttendanceAttendee) => {
    // Check if already checked in
    const isAlready = session.attendees.some(
      (a) => a.alumniId === newAttendee.alumniId || (a.alumniNis && a.alumniNis === newAttendee.alumniNis)
    );

    if (isAlready) {
      showToast(`${newAttendee.alumniName} sudah tercatat hadir sebelumnya`);
      return;
    }

    const updated = [newAttendee, ...session.attendees];
    onUpdateSessionAttendees(session.id, updated);
    showToast(`Presensi berhasil: ${newAttendee.alumniName}`);
  };

  // Manual Check in from list
  const handleManualCheckIn = (alumni: AlumniRecord) => {
    const timeStr = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' WIB';

    const newAttendee: AttendanceAttendee = {
      id: 'att-' + Date.now(),
      alumniId: alumni.id,
      alumniName: alumni.name,
      alumniNis: alumni.nis,
      gradYear: alumni.gradYear,
      jenjang: alumni.jenjang,
      checkInTime: timeStr,
      photoUrl: alumni.photoUrl,
      gender: alumni.gender,
      method: 'manual',
    };

    handleRecordAttendee(newAttendee);
  };

  // Delete attendee
  const handleDeleteAttendee = (attendeeId: string, name: string) => {
    if (window.confirm(`Batalkan status presensi untuk ${name}?`)) {
      const updated = session.attendees.filter((a) => a.id !== attendeeId);
      onUpdateSessionAttendees(session.id, updated);
      showToast(`Presensi ${name} telah dibatalkan`);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (session.attendees.length === 0) {
      showToast('Belum ada data kehadiran untuk diunduh');
      return;
    }

    const headers = ['No', 'Nama Alumni', 'NIS', 'Angkatan/Tahun Lulus', 'Waktu Hadir', 'Metode'];
    const rows = session.attendees.map((a, idx) => [
      idx + 1,
      `"${a.alumniName.replace(/"/g, '""')}"`,
      `"${a.alumniNis}"`,
      `"${a.gradYear || '-'}"`,
      `"${a.checkInTime}"`,
      a.method === 'qr' ? 'Scan QR' : 'Manual',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Presensi_${session.title.replace(/\s+/g, '_')}_${session.date}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Rekap presensi berhasil diunduh (CSV)');
  };

  // Filter attendees in current session
  const filteredAttendees = session.attendees.filter((a) => {
    const q = searchAttendeeQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      a.alumniName.toLowerCase().includes(q) ||
      a.alumniNis.toLowerCase().includes(q) ||
      (a.gradYear && a.gradYear.includes(q))
    );
  });

  // Filter alumni for manual search popup
  const searchResultsForManual = manualSearchQuery.trim()
    ? alumniList.filter((a) => {
        const q = manualSearchQuery.toLowerCase().trim();
        return (
          a.name.toLowerCase().includes(q) ||
          a.nis.toLowerCase().includes(q) ||
          (a.nik && a.nik.includes(q))
        );
      }).slice(0, 20)
    : alumniList.slice(0, 15);

  const qrCount = session.attendees.filter((a) => a.method === 'qr').length;
  const manualCount = session.attendees.filter((a) => a.method === 'manual').length;

  return (
    <div className="fixed inset-0 z-[100010] bg-slate-50 flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100030] bg-slate-900/95 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl border border-white/20 backdrop-blur-md animate-in fade-in slide-in-from-top-2 flex items-center gap-2 whitespace-nowrap">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= HEADER BERSIH ================= */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 shrink-0 flex items-center gap-3 shadow-2xs">
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer shrink-0"
          title="Kembali"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="font-display font-extrabold text-sm sm:text-base text-slate-900 truncate flex-1 leading-tight">
          {session.title}
        </h3>
      </div>

      {/* ================= BODY DAFTAR HADIR BERSIH ================= */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-2xl mx-auto w-full space-y-4 pb-28">
        {/* Ringkasan Kehadiran */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Hadir</p>
            <p className="text-lg font-extrabold text-slate-900 font-mono mt-0.5">{session.attendees.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs">
            <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">Scan QR</p>
            <p className="text-lg font-extrabold text-emerald-700 font-mono mt-0.5">{qrCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs">
            <p className="text-[10px] text-sky-600 uppercase font-bold tracking-wider">Manual</p>
            <p className="text-lg font-extrabold text-sky-700 font-mono mt-0.5">{manualCount}</p>
          </div>
        </div>

        {/* Pencarian dalam Daftar Hadir */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama atau NIS santri yang sudah hadir..."
            value={searchAttendeeQuery}
            onChange={(e) => setSearchAttendeeQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-600 focus:outline-none shadow-2xs"
          />
          {searchAttendeeQuery && (
            <button
              type="button"
              onClick={() => setSearchAttendeeQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Daftar Santri Hadir */}
        <div className="space-y-2.5">
          {filteredAttendees.map((att, idx) => (
            <div
              key={att.id}
              className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-mono text-slate-400 w-5 text-center shrink-0">
                  {idx + 1}
                </span>

                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden font-bold text-slate-600">
                  {att.photoUrl ? (
                    <img src={att.photoUrl} alt={att.alumniName} className="w-full h-full object-cover" />
                  ) : (
                    <span>{att.alumniName.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>

                <div className="min-w-0">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate leading-tight">
                    {att.alumniName}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                    <span className="font-mono">{att.alumniNis || 'NIS: -'}</span>
                    {att.gradYear && (
                      <>
                        <span>•</span>
                        <span>Lulus: {att.gradYear}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{att.checkInTime}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    att.method === 'qr'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-sky-50 text-sky-700 border-sky-200'
                  }`}
                >
                  {att.method === 'qr' ? 'Scan QR' : 'Manual'}
                </span>

                <button
                  type="button"
                  onClick={() => setAttendeeToDelete({ id: att.id, name: att.alumniName })}
                  className="w-7 h-7 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                  title="Batalkan Kehadiran"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {session.attendees.length === 0 && (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 text-center flex flex-col items-center gap-3 shadow-2xs">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <UserCheck className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">
                  Belum Ada Santri yang Hadir
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  Gunakan tombol melayang <strong>QR</strong> di kanan bawah untuk memindai kartu alumni lewat kamera, atau tombol <strong>Pencarian</strong> untuk menandai hadir manual.
                </p>
              </div>
            </div>
          )}

          {session.attendees.length > 0 && filteredAttendees.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 text-center text-slate-500 text-xs">
              Tidak ditemukan data kehadiran yang cocok dengan &ldquo;{searchAttendeeQuery}&rdquo;.
            </div>
          )}
        </div>
      </div>

      {/* ================= TOMBOL MELAYANG DI KANAN BAWAH (HANYA MUNCUL JIKA SCANNER TIDAK BUKA) ================= */}
      {!isScannerOpen && (
        <div className="fixed bottom-6 right-5 z-[100020] flex flex-col items-end gap-3 pointer-events-auto">
          {/* Tombol Melayang Pencarian Manual */}
          <button
            type="button"
            onClick={() => {
              setManualSearchQuery('');
              setIsManualModalOpen(true);
            }}
            className="w-12 h-12 rounded-full bg-sky-600 hover:bg-sky-700 text-white shadow-xl flex items-center justify-center cursor-pointer transition-all active:scale-95 group"
            title="Pencarian Manual Alumni"
          >
            <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>

          {/* Tombol Melayang QR Scanner Layar Split */}
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xl flex items-center justify-center cursor-pointer transition-all active:scale-95 group"
            title="Buka Scan QR Kamera (Layar Split)"
          >
            <QrCode className="w-7 h-7 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      )}

      {/* ================= MODAL PENCARIAN MANUAL ALUMNI ================= */}
      {isManualModalOpen && (
        <div
          className="fixed inset-0 z-[100030] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsManualModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-4 w-full max-w-md shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header dihapus, tombol X ditaruh di sebelah kanan kotak cari */}
            <div className="flex items-center gap-2 pb-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Ketik Nama, NIS, atau NIK alumni..."
                  value={manualSearchQuery}
                  onChange={(e) => setManualSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-none"
                />
                {manualSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setManualSearchQuery('')}
                    className="w-6 h-6 rounded-full flex items-center justify-center absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer shrink-0"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List Results */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1 -mr-1 max-h-[50vh]">
              {searchResultsForManual.map((alm) => {
                const isAlreadyCheckedIn = session.attendees.some(
                  (a) => a.alumniId === alm.id || (a.alumniNis && a.alumniNis === alm.nis)
                );

                return (
                  <div
                    key={alm.id}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-[11px] shrink-0 overflow-hidden">
                        {alm.photoUrl ? (
                          <img src={alm.photoUrl} alt={alm.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{alm.name.slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{alm.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          NIS: {alm.nis || '-'} • Lulus: {alm.gradYear || '-'}
                        </p>
                      </div>
                    </div>

                    {isAlreadyCheckedIn ? (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[10px] font-bold shrink-0 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Hadir</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleManualCheckIn(alm)}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold rounded-xl text-[11px] transition-colors cursor-pointer shrink-0 shadow-xs"
                      >
                        Tandai Hadir
                      </button>
                    )}
                  </div>
                );
              })}

              {searchResultsForManual.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Tidak ditemukan santri dengan nama atau NIS tersebut.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL SCANNER LAYAR SPLIT (ATAS KAMERA, BAWAH DAFTAR HADIR) ================= */}
      {isScannerOpen && (
        <EventAttendanceScannerModal
          isOpen={isScannerOpen}
          event={{
            id: session.sourceEventId || session.id,
            title: session.title,
            date: session.date,
            time: 'Pelaksanaan Presensi',
            location: 'Lokasi Acara',
            category: 'reuni',
            description: 'Sesi Presensi QR',
            attendeesCount: session.attendees.length,
          }}
          alumniList={alumniList}
          onClose={() => setIsScannerOpen(false)}
          onUpdateEventAttendees={(_evId, _count) => {
            // Updated dynamically
          }}
          onRecordCustomAttendee={handleRecordAttendee}
          existingAttendees={session.attendees}
          onDeleteCustomAttendee={(id) => {
            const updated = session.attendees.filter((a) => a.id !== id);
            onUpdateSessionAttendees(session.id, updated);
          }}
        />
      )}
      {/* ================= MODAL KONFIRMASI HAPUS KEHADIRAN SANTRI ================= */}
      {attendeeToDelete && (
        <div
          className="fixed inset-0 z-[100040] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setAttendeeToDelete(null)}
        >
          <div
            className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl border border-slate-100 flex flex-col gap-3 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-slate-900 leading-tight">
                  Batalkan Presensi?
                </h4>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {attendeeToDelete.name}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin membatalkan status presensi santri ini?
            </p>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAttendeeToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated = session.attendees.filter((a) => a.id !== attendeeToDelete.id);
                  onUpdateSessionAttendees(session.id, updated);
                  showToast(`Presensi ${attendeeToDelete.name} dibatalkan`);
                  setAttendeeToDelete(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-rose-600/20"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
