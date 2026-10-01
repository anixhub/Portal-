import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ArrowLeft, 
  Camera, 
  QrCode, 
  CheckCircle2, 
  Users, 
  Search, 
  Zap, 
  ZapOff, 
  RefreshCw, 
  AlertCircle,
  Clock,
  UserCheck,
  Plus
} from 'lucide-react';
import { EventAgenda, AlumniRecord } from '../../types';

export interface AttendanceRecord {
  id: string;
  alumniId: string;
  alumniName: string;
  alumniNis: string;
  gradYear: string;
  jenjang?: string;
  checkInTime: string;
  photoUrl?: string;
  gender: 'L' | 'P';
}

interface EventAttendanceScannerModalProps {
  isOpen: boolean;
  event: EventAgenda;
  alumniList: AlumniRecord[];
  onClose: () => void;
  onUpdateEventAttendees?: (eventId: string, newCount: number) => void;
}

export const EventAttendanceScannerModal: React.FC<EventAttendanceScannerModalProps> = ({
  isOpen,
  event,
  alumniList,
  onClose,
  onUpdateEventAttendees,
}) => {
  const [attendees, setAttendees] = useState<AttendanceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [lastScannedAlumni, setLastScannedAlumni] = useState<AlumniRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [manualInputNis, setManualInputNis] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<any>(null);
  const lastScannedTimeRef = useRef<{ [key: string]: number }>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const playSuccessBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.28);
    } catch {
      // Audio autoplay policy fallback
    }

    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  };

  // Start Camera Stream
  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Kamera tidak didukung pada peramban ini');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError(err.message || 'Izin kamera belum diberikan atau tidak tersedia');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Check in an alumni
  const handleCheckInAlumni = (alumni: AlumniRecord) => {
    const now = Date.now();
    const lastScan = lastScannedTimeRef.current[alumni.id] || 0;
    if (now - lastScan < 2500) {
      return; // prevent spam double-firing in rapid succession
    }
    lastScannedTimeRef.current[alumni.id] = now;

    // Check if already in list
    const isAlreadyPresent = attendees.some((a) => a.alumniId === alumni.id);
    if (isAlreadyPresent) {
      showToast(`Perhatian: ${alumni.name} sudah tercatat hadir.`);
      setLastScannedAlumni(alumni);
      return;
    }

    // Record check in
    const timeStr = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' WIB';

    const newRecord: AttendanceRecord = {
      id: 'att-' + Date.now(),
      alumniId: alumni.id,
      alumniName: alumni.name,
      alumniNis: alumni.nis,
      gradYear: alumni.gradYear,
      jenjang: alumni.jenjang,
      checkInTime: timeStr,
      photoUrl: alumni.photoUrl,
      gender: alumni.gender,
    };

    playSuccessBeep();
    setAttendees((prev) => [newRecord, ...prev]);
    setLastScannedAlumni(alumni);
    showToast(`Presensi Berhasil: ${alumni.name}`);

    // Update parent attendee count
    onUpdateEventAttendees?.(event.id, (event.attendeesCount || 0) + 1);
  };

  // Process raw scanned text from QR
  const processScannedText = (text: string) => {
    if (!text || !text.trim()) return;
    const clean = text.trim();

    // Find alumni matching nis, nik, or id, or JSON format
    let matched = alumniList.find(
      (a) =>
        a.nis.toLowerCase() === clean.toLowerCase() ||
        a.nik === clean ||
        a.id.toLowerCase() === clean.toLowerCase() ||
        clean.toLowerCase().includes(a.nis.toLowerCase()) ||
        clean.toLowerCase().includes(a.name.toLowerCase())
    );

    // Try parsing JSON if qr contains object
    if (!matched) {
      try {
        const parsed = JSON.parse(clean);
        if (parsed.nis || parsed.nik || parsed.id) {
          matched = alumniList.find(
            (a) =>
              (parsed.nis && a.nis === parsed.nis) ||
              (parsed.nik && a.nik === parsed.nik) ||
              (parsed.id && a.id === parsed.id)
          );
        }
      } catch {
        // Not JSON, ignore
      }
    }

    if (matched) {
      handleCheckInAlumni(matched);
    } else {
      showToast('QR Code tidak dikenali sebagai data alumni');
    }
  };

  // Native BarcodeDetector loop if supported
  useEffect(() => {
    if (!isOpen) return;
    startCamera();

    const BarcodeDetectorClass = (window as any).BarcodeDetector;
    if (BarcodeDetectorClass) {
      try {
        const barcodeDetector = new BarcodeDetectorClass({ formats: ['qr_code'] });
        scanIntervalRef.current = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes && barcodes.length > 0) {
                processScannedText(barcodes[0].rawValue);
              }
            } catch {
              // Frame dropped or detection error
            }
          }
        }, 300);
      } catch (e) {
        console.warn('BarcodeDetector error:', e);
      }
    }

    return () => {
      stopCamera();
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [isOpen, facingMode]);

  // Flip camera
  const handleToggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Torch toggle
  const handleToggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && (track.getCapabilities as any)?.()?.torch) {
      const nextTorch = !torchOn;
      try {
        await (track as any).applyConstraints({
          advanced: [{ torch: nextTorch }],
        });
        setTorchOn(nextTorch);
      } catch (err) {
        console.warn('Torch constraint error:', err);
      }
    } else {
      showToast('Lampu senter tidak didukung di perangkat ini');
    }
  };

  // Manual Check in Submit
  const handleManualCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInputNis.trim()) return;
    const clean = manualInputNis.trim().toLowerCase();
    const matched = alumniList.find(
      (a) =>
        a.nis.toLowerCase().includes(clean) ||
        a.nik.includes(clean) ||
        a.name.toLowerCase().includes(clean)
    );

    if (matched) {
      handleCheckInAlumni(matched);
      setManualInputNis('');
      setShowManualModal(false);
    } else {
      showToast('Data alumni tidak ditemukan');
    }
  };

  if (!isOpen) return null;

  const filteredAttendees = attendees.filter((item) =>
    item.alumniName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.alumniNis.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[110] bg-slate-900/95 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-2xl border border-white/20 backdrop-blur-md animate-in fade-in slide-in-from-top-2 flex items-center gap-2 whitespace-nowrap">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= BAGIAN ATAS (50% LAYAR): PREVIEW KAMERA SCAN QR ================= */}
      <div className="relative w-full h-[48vh] sm:h-[50vh] bg-slate-950 flex flex-col shrink-0 overflow-hidden">
        {/* Top Control Bar Over Camera */}
        <div className="absolute top-0 inset-x-0 z-20 px-4 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between text-white">
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 flex items-center justify-center text-white transition-colors cursor-pointer"
            title="Tutup Presensi"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="text-center min-w-0 px-2 flex-1">
            <h3 className="font-bold text-xs sm:text-sm text-white truncate drop-shadow-sm">
              Scan Presensi QR
            </h3>
            <p className="text-[10px] sm:text-[11px] text-emerald-400 truncate font-medium">
              {event.title}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleTorch}
              className={`w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-colors cursor-pointer ${
                torchOn ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-black/40 hover:bg-black/60 text-white'
              }`}
              title="Nyalakan Lampu Senter"
            >
              {torchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleToggleCameraFacing}
              className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 flex items-center justify-center text-white transition-colors cursor-pointer"
              title="Putar Kamera Depan/Belakang"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Camera Preview */}
        <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            className="w-full h-full object-cover"
          />

          {/* Viewfinder Target Box Overlay */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-3xl border-2 border-emerald-400/80 shadow-[0_0_40px_rgba(16,185,129,0.25)] flex items-center justify-center">
              {/* Corner Accents */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

              {/* Animated Laser Scan Line */}
              <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_#10b981] animate-pulse" />
            </div>

            <p className="mt-3 text-[11px] text-white/90 font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur-xs">
              Arahkan kamera ke QR Code Santri / Alumni
            </p>
          </div>

          {/* Camera Permission / Fallback Box */}
          {cameraError && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white z-10 space-y-3">
              <Camera className="w-10 h-10 text-slate-500" />
              <div className="max-w-xs">
                <p className="text-xs font-semibold text-slate-300">{cameraError}</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Anda tetap dapat melakukan presensi menggunakan tombol simulasi cepat atau input manual di bawah.
                </p>
              </div>
              <button
                type="button"
                onClick={startCamera}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Coba Hubungkan Kamera</span>
              </button>
            </div>
          )}

          {/* Quick Simulation Bar (Always available at bottom of camera view for testing) */}
          <div className="absolute bottom-2 inset-x-3 z-20 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setShowManualModal(true)}
              className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Input Manual / Cari Alumni</span>
            </button>

            {/* Quick Test Scan Dropdown / Trigger */}
            <button
              type="button"
              onClick={() => {
                // Pick an alumni that hasn't checked in yet, or first alumni
                const unChecked = alumniList.find((a) => !attendees.some((att) => att.alumniId === a.id)) || alumniList[0];
                if (unChecked) handleCheckInAlumni(unChecked);
              }}
              className="px-3 py-1.5 rounded-full bg-emerald-600/80 hover:bg-emerald-600 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="Simulasi scan otomatis QR alumni"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Tes Scan Cepat</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= BAGIAN BAWAH (50% LAYAR): DAFTAR KEHADIRAN (BARIS PER BARIS) ================= */}
      <div className="flex-1 bg-white rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.3)] flex flex-col min-h-0 z-30 -mt-3">
        {/* Header Bar Daftar Kehadiran */}
        <div className="px-5 pt-3 pb-2.5 border-b border-slate-100 flex flex-col gap-2 shrink-0">
          <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mb-1" />

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h4 className="font-display font-bold text-sm text-slate-900">
                Daftar Kehadiran
              </h4>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold font-mono">
                {attendees.length} Hadir
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">
                Live Sinkron
              </span>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
          </div>

          {/* Search Box in Attendance List */}
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama atau NIS di daftar hadir..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-1 focus:ring-sky-600"
            />
          </div>
        </div>

        {/* Scrollable Attendance Rows */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y-0">
          {filteredAttendees.length === 0 ? (
            <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-700">Belum ada alumni yang discan</p>
              <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
                Arahkan kamera ke QR kartu alumni atau gunakan tombol input manual untuk mencatat kehadiran.
              </p>
            </div>
          ) : (
            filteredAttendees.map((att, idx) => (
              <div
                key={att.id}
                className="p-3 rounded-2xl bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/70 flex items-center justify-between gap-3 transition-colors animate-in slide-in-from-top-2 duration-150"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-sky-100 border border-slate-200 shrink-0 flex items-center justify-center font-bold text-xs text-sky-700">
                    {att.photoUrl ? (
                      <img src={att.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className={`w-full h-full flex items-center justify-center text-white ${
                          att.gender === 'P'
                            ? 'bg-gradient-to-br from-rose-400 to-pink-500'
                            : 'bg-gradient-to-br from-sky-500 to-blue-600'
                        }`}
                      >
                        {att.alumniName.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h5 className="font-bold text-xs text-slate-900 truncate">
                      {att.alumniName}
                    </h5>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono truncate mt-0.5">
                      <span>NIS: {att.alumniNis}</span>
                      <span>•</span>
                      <span>Lulus {att.gradYear}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Hadir</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{att.checkInTime}</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Selesai Bar */}
        <div className="p-3 border-t border-slate-100 bg-white flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 pl-1">
            Total Tercatat: <strong className="text-slate-900 font-mono">{attendees.length}</strong> orang
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm"
          >
            Selesai Presensi
          </button>
        </div>
      </div>

      {/* ================= MODAL INPUT NIS MANUAL ================= */}
      {showManualModal && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h4 className="font-bold text-sm text-slate-900">Input Manual Presensi</h4>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualCheckInSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cari Nama, NIS, atau NIK Alumni
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="Ketik nama atau NIS..."
                  value={manualInputNis}
                  onChange={(e) => setManualInputNis(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:bg-white font-medium"
                />
              </div>

              {/* Quick Matches Preview */}
              {manualInputNis.trim().length > 1 && (
                <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs">
                  {alumniList
                    .filter(
                      (a) =>
                        a.name.toLowerCase().includes(manualInputNis.toLowerCase()) ||
                        a.nis.toLowerCase().includes(manualInputNis.toLowerCase())
                    )
                    .slice(0, 4)
                    .map((alm) => (
                      <button
                        key={alm.id}
                        type="button"
                        onClick={() => {
                          handleCheckInAlumni(alm);
                          setManualInputNis('');
                          setShowManualModal(false);
                        }}
                        className="w-full p-2 text-left hover:bg-sky-50 flex items-center justify-between cursor-pointer"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-slate-900 truncate">{alm.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">NIS: {alm.nis}</p>
                        </div>
                        <span className="text-[10px] font-bold text-sky-600 shrink-0">Pilih</span>
                      </button>
                    ))}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-sky-600/20"
                >
                  Simpan Hadir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
