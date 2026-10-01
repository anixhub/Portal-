import React, { useState, useEffect } from 'react';
import { UserCheck, Shield, KeyRound, Sparkles, Check, ArrowRight } from 'lucide-react';
import { AlumniRecord } from '../types';

interface FirstLoginModalProps {
  isOpen: boolean;
  alumni: AlumniRecord;
  onSave: (updatedData: { username: string; newPassword?: string; phone?: string }) => void;
  onDismiss: () => void;
}

export const FirstLoginModal: React.FC<FirstLoginModalProps> = ({
  isOpen,
  alumni,
  onSave,
  onDismiss,
}) => {
  const [username, setUsername] = useState(alumni?.username || '');
  const [phone, setPhone] = useState(alumni?.phone || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (alumni) {
      setUsername(alumni.username || '');
      setPhone(alumni.phone || '');
    }
  }, [alumni]);

  if (!isOpen || !alumni) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword) {
      if (newPassword.length < 4) {
        setError('Kata sandi baru minimal 4 karakter.');
        return;
      }
      if (newPassword === '1234') {
        setError('Kata sandi baru tidak boleh sama dengan kata sandi default 1234.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Konfirmasi kata sandi tidak cocok.');
        return;
      }
    }

    setIsSuccess(true);
    setTimeout(() => {
      onSave({
        username: username.trim(),
        newPassword: newPassword || undefined,
        phone: phone.trim(),
      });
      setIsSuccess(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-sky-100 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0369a1] via-[#0284c7] to-[#0ea5e9] px-6 py-5 text-white">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-amber-300" />
            </div>
            <span className="text-xs uppercase tracking-wider font-semibold text-sky-200">
              Pengaturan Awal Akun
            </span>
          </div>
          <h3 className="font-display font-bold text-lg">Tingkatkan Keamanan Akun</h3>
          <p className="text-xs text-sky-100 mt-1 leading-relaxed">
            Ahlan wa sahlan, <span className="font-semibold text-white">{alumni.name}</span>! Anda saat ini masih menggunakan sandi standar <code className="bg-white/20 px-1 py-0.5 rounded font-mono">1234</code>.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {isSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-lg text-slate-800">Akun Berhasil Diperbarui!</h4>
              <p className="text-xs text-slate-600">
                Data login Anda telah disimpan. Sekarang Anda dapat login menggunakan NIK atau Username baru Anda.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                  {error}
                </div>
              )}

              {/* Step 1: Buat Username */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Buat Username Pribadi (Opsional)
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Contoh: mulia_ningsih20"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Dapat digunakan sebagai alternatif login selain NIK Anda.
                </p>
              </div>

              {/* Step 2: No WhatsApp Aktif */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor WhatsApp Aktif
                </label>
                <input
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white"
                />
              </div>

              {/* Step 3: Ganti Password */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <KeyRound className="w-3.5 h-3.5 text-sky-600" />
                  <span className="text-xs font-bold text-slate-800">Ganti Sandi dari 1234:</span>
                </div>
                
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Kata Sandi Baru
                    </label>
                    <input
                      type="password"
                      placeholder="Masukkan kata sandi baru"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Ulangi Kata Sandi Baru
                    </label>
                    <input
                      type="password"
                      placeholder="Konfirmasi kata sandi baru"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex flex-col sm:flex-row gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold rounded-xl shadow-md shadow-sky-600/20 text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Simpan & Masuk</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onDismiss}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Nanti Saja
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
