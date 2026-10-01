import React, { useState } from 'react';
import { Smartphone, Monitor, Info, CheckCircle } from 'lucide-react';

interface DeviceFrameProps {
  children: React.ReactNode;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({ children }) => {
  const [isMobileMode, setIsMobileMode] = useState(true);
  const [showNotes, setShowNotes] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 via-sky-100 to-slate-200 flex flex-col items-center justify-center p-3 sm:p-6 text-slate-800">
      {/* Top Controller Bar */}
      <div className="w-full max-w-md sm:max-w-2xl mb-3 flex items-center justify-between bg-white/80 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xs border border-white/60 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-700 hidden sm:inline">Portal Alumni At-taroqqy</span>
          <span className="font-semibold text-slate-700 sm:hidden">Portal Alumni</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-sky-700 hover:bg-sky-50 transition-colors cursor-pointer"
            title="Catatan Desain"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="font-medium">Catatan Desain</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-200 mx-1" />

          {/* Toggle View Mode */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-xl">
            <button
              onClick={() => setIsMobileMode(true)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isMobileMode
                  ? 'bg-white text-sky-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile</span>
            </button>
            <button
              onClick={() => setIsMobileMode(false)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                !isMobileMode
                  ? 'bg-white text-sky-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Layar Lebar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Design notes expandable panel */}
      {showNotes && (
        <div className="w-full max-w-md sm:max-w-xl mb-4 bg-white/95 rounded-2xl p-4 shadow-lg border border-sky-100 text-xs text-slate-700 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="font-bold text-sky-900 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Penyesuaian Sesuai Permintaan:
            </span>
            <button
              onClick={() => setShowNotes(false)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold px-1"
            >
              ✕
            </button>
          </div>
          <ul className="space-y-1.5 list-disc pl-4 text-slate-600">
            <li>
              <strong>Judul Baru:</strong> Baris 1 <code className="text-sky-700 bg-sky-50 px-1 py-0.5 rounded">Portal Alumni</code>, Baris 2 <code className="text-sky-700 bg-sky-50 px-1 py-0.5 rounded">At-taroqqy</code>.
            </li>
            <li>
              <strong>Form Pengganti Fast Menu:</strong> Mengganti fast menu 4 ikon dengan 2 kotak tersusun vertikal: <strong>Email</strong> dan <strong>Kata Sandi</strong>.
            </li>
            <li>
              <strong>Tombol Login:</strong> Tombol Login dibuat penuh (full-width) tanpa tombol fingerprint di sampingnya.
            </li>
            <li>
              <strong>Teks Bawah:</strong> Menambahkan teks kecil di bawah tombol: <code className="text-sky-700 bg-sky-50 px-1 py-0.5 rounded">Belum punya akun? Daftar .</code> yang interaktif membuka formulir registrasi.
            </li>
          </ul>
        </div>
      )}

      {/* Main Container */}
      {isMobileMode ? (
        /* Phone Shell Mockup (Mirrors the screenshot aesthetic) */
        <div className="relative w-full max-w-[375px] sm:max-w-[400px] h-[780px] bg-slate-900 rounded-[50px] p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] border-4 border-slate-800 ring-1 ring-white/20 flex flex-col">
          {/* Top Speaker & Camera Cutout */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-950 rounded-full z-30 flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full mr-2" />
            <div className="w-10 h-1 bg-slate-800 rounded-full" />
          </div>

          {/* Screen Content Wrapper */}
          <div className="relative w-full h-full bg-white rounded-[40px] overflow-hidden flex flex-col shadow-inner">
            {/* Status Bar */}
            <div className="h-10 pt-2 px-7 flex items-center justify-between text-white text-[11px] font-semibold z-30 select-none bg-transparent">
              <span>23:22</span>
              <div className="flex items-center gap-1.5 opacity-90">
                <span className="text-[10px]">5G</span>
                {/* Signal bars */}
                <div className="flex items-end gap-0.5 h-2.5">
                  <div className="w-0.5 h-1 bg-white rounded-xs" />
                  <div className="w-0.5 h-1.5 bg-white rounded-xs" />
                  <div className="w-0.5 h-2 bg-white rounded-xs" />
                  <div className="w-0.5 h-2.5 bg-white rounded-xs" />
                </div>
                {/* Battery icon */}
                <div className="w-4 h-2.5 border border-white rounded-xs p-0.5 flex items-center">
                  <div className="w-full h-full bg-white rounded-2xs" />
                </div>
              </div>
            </div>

            {/* Inner Content */}
            <div className="flex-1 overflow-hidden flex flex-col -mt-10">
              {children}
            </div>

            {/* Home indicator bar at bottom */}
            <div className="h-4 bg-white flex items-center justify-center select-none z-30">
              <div className="w-28 h-1 bg-slate-300 rounded-full" />
            </div>
          </div>
        </div>
      ) : (
        /* Full Width / Tablet Responsive Container */
        <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden min-h-[640px] flex flex-col">
          {children}
        </div>
      )}
    </div>
  );
};
