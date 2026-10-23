import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, GraduationCap, Phone, CheckCircle2, XCircle, Eye, EyeOff, Loader2, CreditCard } from 'lucide-react';
import { RegisterFormData } from '../types';
import { getGlobalAllSantriRecords } from '../services/apiService';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: { email: string; name: string }) => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    nik: '',
    email: '',
    phone: '',
    gradYear: '2022',
    majorOrProgram: 'Pendidikan Agama Islam',
    password: '',
    confirmPassword: '',
  });

  const [nik, setNik] = useState('');
  const [isCheckingNik, setIsCheckingNik] = useState(false);
  const [nikStatus, setNikStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [duplicateNikUser, setDuplicateNikUser] = useState<any>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  // Realtime debounce check NIK 16 digit against database
  useEffect(() => {
    if (!isOpen) return;
    const clean = nik.replace(/\D/g, '').slice(0, 16);
    if (clean.length < 16) {
      setIsCheckingNik(false);
      setNikStatus('idle');
      setDuplicateNikUser(null);
      return;
    }

    setIsCheckingNik(true);
    setNikStatus('checking');

    const timer = setTimeout(() => {
      setIsCheckingNik(false);
      const pool = getGlobalAllSantriRecords();
      const found = pool.find(
        (a: any) => a.nik && a.nik.replace(/\D/g, '').trim() === clean
      );
      if (found) {
        setDuplicateNikUser(found);
        setNikStatus('taken');
      } else {
        setDuplicateNikUser(null);
        setNikStatus('available');
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [nik, isOpen]);

  if (!isOpen) return null;

  const cleanNik = nik.replace(/\D/g, '').slice(0, 16);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (cleanNik.length !== 16) {
      setError('NIK harus tepat 16 digit angka.');
      return;
    }

    if (nikStatus === 'taken' || duplicateNikUser) {
      setError('NIK sudah terdaftar dalam sistem.');
      return;
    }

    if (isCheckingNik) {
      setError('Sedang memverifikasi NIK, mohon tunggu...');
      return;
    }

    if (!formData.name || !formData.email || !formData.password) {
      setError('Mohon lengkapi semua data wajib!');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Format email tidak valid.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsRegistered(true);
      setTimeout(() => {
        onSuccess({ email: formData.email, name: formData.name });
        setIsRegistered(false);
        onClose();
      }, 1400);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] px-6 py-5 text-white flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-lg">Pendaftaran Alumni</h3>
            <p className="text-xs text-sky-100 mt-0.5">Bergabung dengan Portal Alumni At-taroqqy</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {isRegistered ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-lg text-slate-800">Pendaftaran Berhasil!</h4>
              <p className="text-sm text-slate-600 max-w-xs mx-auto">
                Selamat datang <span className="font-semibold text-sky-700">{formData.name}</span>. Akun Anda siap digunakan untuk login.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {error && (
                <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                  {error}
                </div>
              )}

              {/* NIK (16 digit) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Induk Kependudukan (NIK) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={16}
                    required
                    placeholder="16 digit"
                    value={nik}
                    onChange={(e) => setNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                    {isCheckingNik && (
                      <Loader2 className="w-4 h-4 text-sky-600 animate-spin" />
                    )}
                    {!isCheckingNik && cleanNik.length === 16 && nikStatus === 'available' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    {!isCheckingNik && cleanNik.length === 16 && nikStatus === 'taken' && (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    )}
                  </div>
                </div>
                {cleanNik.length > 0 && cleanNik.length < 16 && (
                  <p className="text-[11px] text-amber-600 font-medium mt-1">
                    Kurang {16 - cleanNik.length} digit (harus 16 digit)
                  </p>
                )}
                {!isCheckingNik && cleanNik.length === 16 && nikStatus === 'taken' && duplicateNikUser && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">
                    NIK sudah terdaftar atas nama {duplicateNikUser.name || duplicateNikUser.namaSantri || 'alumni/santri lain'}
                  </p>
                )}
                {!isCheckingNik && cleanNik.length === 16 && nikStatus === 'available' && (
                  <p className="text-[11px] text-emerald-600 font-medium mt-1">
                    NIK valid & dapat didaftarkan
                  </p>
                )}
              </div>

              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Mulia Ningsih"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Tahun Angkatan & Jurusan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tahun Lulus
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={formData.gradYear}
                      onChange={(e) => setFormData({ ...formData, gradYear: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white transition-all"
                    >
                      {Array.from({ length: 25 }, (_, i) => 2026 - i).map((year) => (
                        <option key={year} value={year.toString()}>
                          Angkatan {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="08123456789"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Kata Sandi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Minimal 6 karakter"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Konfirmasi Kata Sandi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Konfirmasi Kata Sandi <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Ulangi kata sandi"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Tombol Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || cleanNik.length !== 16 || isCheckingNik || nikStatus === 'taken'}
                  className="w-full py-3 bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold rounded-xl shadow-md shadow-sky-600/20 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? 'Memproses Pendaftaran...' : 'Daftar Sekarang'}
                </button>
              </div>

              <div className="text-center pt-1">
                <p className="text-xs text-slate-500">
                  Sudah memiliki akun?{' '}
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-[#0284c7] font-semibold hover:underline cursor-pointer"
                  >
                    Masuk di sini
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
