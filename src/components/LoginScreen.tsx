import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Sparkles, GraduationCap, Calendar, AlertCircle, ShieldCheck, User, Users } from 'lucide-react';
import { AlumniRecord, AdminUser, UserRole } from '../types';
import alumniIllustrationImg from '../assets/images/alumni_highfive_illustration_1790612738105.jpg';

interface LoginScreenProps {
  alumniList: AlumniRecord[];
  adminAccount: AdminUser;
  onLoginSuccess: (role: UserRole, alumniData?: AlumniRecord, adminData?: AdminUser) => void;
  onOpenRegister: () => void;
  onOpenForgotPassword: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  alumniList,
  adminAccount,
  onLoginSuccess,
  onOpenRegister,
  onOpenForgotPassword,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('alumni');
  const [loginIdentifier, setLoginIdentifier] = useState('3507123456780001'); // default NIK Mulia Ningsih
  const [password, setPassword] = useState('1234'); // default 1234
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage(null);
    if (role === 'alumni') {
      setLoginIdentifier('3507123456780001'); // NIK Mulia Ningsih
      setPassword('1234');
    } else {
      setLoginIdentifier(adminAccount.email);
      setPassword('admin123');
    }
  };

  const handleQuickDemo = (type: 'mulia_1234' | 'fauzi_custom' | 'admin') => {
    setErrorMessage(null);
    if (type === 'mulia_1234') {
      setSelectedRole('alumni');
      setLoginIdentifier('3507123456780001');
      setPassword('1234');
    } else if (type === 'fauzi_custom') {
      setSelectedRole('alumni');
      setLoginIdentifier('3507123456780002');
      setPassword('passwordfauzi');
    } else if (type === 'admin') {
      setSelectedRole('admin');
      setLoginIdentifier('admin.pondok@attaroqqy.ac.id');
      setPassword('admin123');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const identifier = loginIdentifier.trim();
    if (!identifier) {
      setErrorMessage(
        selectedRole === 'alumni'
          ? 'Silakan masukkan NIK atau Username Anda.'
          : 'Silakan masukkan Email Admin Pondok.'
      );
      return;
    }

    if (!password) {
      setErrorMessage('Silakan masukkan kata sandi.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      if (selectedRole === 'admin') {
        if (
          (identifier.toLowerCase() === adminAccount.email.toLowerCase() ||
           identifier.toLowerCase() === 'admin') &&
          password === 'admin123'
        ) {
          onLoginSuccess('admin', undefined, adminAccount);
          return;
        } else {
          setErrorMessage('Kredensial Admin tidak cocok. Coba: admin.pondok@attaroqqy.ac.id / admin123');
          return;
        }
      }

      // Role Alumni: Cari berdasarkan NIK, NIS, atau Username
      const matchedAlumni = alumniList.find((alm) => {
        const idMatch =
          alm.nik === identifier ||
          alm.nis.toLowerCase() === identifier.toLowerCase() ||
          (alm.username && alm.username.toLowerCase() === identifier.toLowerCase()) ||
          alm.email.toLowerCase() === identifier.toLowerCase();

        return idMatch;
      });

      if (!matchedAlumni) {
        setErrorMessage(
          'NIK atau Username belum terdaftar di database alumni pondok. Pastikan status santri telah diubah menjadi alumni.'
        );
        return;
      }

      // Check password (bisa 1234 jika belum ganti, atau password baru)
      if (matchedAlumni.password !== password) {
        setErrorMessage(
          'Kata sandi salah. Jika belum pernah mengubah sandi, gunakan sandi standar: 1234.'
        );
        return;
      }

      onLoginSuccess('alumni', matchedAlumni);
    }, 600);
  };

  return (
    <div className="relative w-full h-full min-h-[660px] flex flex-col bg-gradient-to-b from-[#006bd6] via-[#0284c7] to-[#0ea5e9] overflow-hidden select-none">
      {/* Background subtle droplet bokeh overlay */}
      <div className="absolute inset-0 droplet-pattern opacity-30 pointer-events-none" />

      {/* Decorative radial lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-sky-300/20 rounded-full blur-3xl pointer-events-none" />

      {/* TOP SECTION: Portal Titles */}
      <div className="relative z-10 pt-7 sm:pt-9 px-6 text-center text-white flex flex-col items-center">
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-wider uppercase drop-shadow-md text-white">
          Portal Alumni
        </h1>
        <p className="text-xl sm:text-2xl font-display font-bold tracking-widest uppercase text-sky-100 drop-shadow-sm mt-0.5">
          At-taroqqy
        </p>

        {/* Subtitle / role guidance */}
        <div className="mt-2 text-center">
          <p className="text-xs font-semibold text-white">
            {selectedRole === 'alumni' ? 'Login Alumni (Gunakan NIK & Sandi 1234)' : 'Portal Pengelolaan Data Admin Pondok'}
          </p>
        </div>
      </div>

      {/* CENTER SECTION: Illustration with Badges */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-1 min-h-[160px] max-h-[220px]">
        <div className="relative w-full max-w-[280px] h-[175px] flex items-center justify-center">
          {/* Floating badge 1: KTA Digital */}
          <div className="absolute -top-1 left-1 z-20 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl shadow-lg border border-sky-100/80 flex items-center gap-1.5 transform -rotate-3">
            <div className="w-5 h-5 rounded-md bg-sky-600 text-white flex items-center justify-center">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-800 tracking-tight">KTA Digital</span>
          </div>

          {/* Floating badge 2: Reuni Akbar */}
          <div className="absolute top-2 right-1 z-20 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl shadow-lg border border-sky-100/80 flex items-center gap-1.5 transform rotate-3">
            <div className="w-5 h-5 rounded-md bg-amber-500 text-white flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-800 tracking-tight">Reuni 2026</span>
          </div>

          <div className="absolute top-1/2 -left-2 text-sky-200 pointer-events-none opacity-80">
            <Sparkles className="w-4 h-4" />
          </div>

          {/* Image */}
          <div className="w-full h-full rounded-2xl overflow-hidden flex items-center justify-center relative">
            {!imageError ? (
              <img
                src={alumniIllustrationImg}
                alt="Alumni At-taroqqy"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover object-center rounded-2xl drop-shadow-md"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-sky-600/30 rounded-2xl p-4 text-white">
                <div className="text-3xl">🤝</div>
                <p className="text-xs font-semibold text-sky-100 mt-2">Portal Alumni At-taroqqy</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM SHEET: Curved White Surface */}
      <div className="relative z-20 bg-white rounded-t-[34px] sm:rounded-3xl shadow-[0_-10px_35px_rgba(0,0,0,0.15)] px-6 pt-5 pb-6 mt-auto flex flex-col max-w-md mx-auto w-full sm:mb-5 sm:border sm:border-slate-100">
        {/* Handle Bar */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3" />

        {/* ROLE SELECTOR TABS: ALUMNI VS ADMIN PONDOK */}
        <div className="p-1 bg-slate-100 rounded-2xl flex items-center mb-3">
          <button
            type="button"
            onClick={() => handleRoleChange('alumni')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              selectedRole === 'alumni'
                ? 'bg-white text-sky-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Masuk Alumni</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('admin')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              selectedRole === 'admin'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Pondok</span>
          </button>
        </div>

        {/* QUICK DEMO SHORTCUTS BAR */}
        <div className="mb-3 flex items-center justify-between text-[11px] bg-sky-50/80 px-2.5 py-1.5 rounded-xl border border-sky-100">
          <span className="text-sky-700 font-semibold">Demo Cepat:</span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => handleQuickDemo('mulia_1234')}
              className={`px-2 py-0.5 rounded-lg border text-[10px] font-medium cursor-pointer transition-colors ${
                loginIdentifier === '3507123456780001'
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white text-sky-800 border-sky-200 hover:bg-sky-100'
              }`}
              title="Alumni Baru dengan sandi 1234 (Akan muncul prompt ganti sandi)"
            >
              Mulia (Sandi 1234)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('fauzi_custom')}
              className={`px-2 py-0.5 rounded-lg border text-[10px] font-medium cursor-pointer transition-colors ${
                loginIdentifier === '3507123456780002'
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white text-sky-800 border-sky-200 hover:bg-sky-100'
              }`}
              title="Alumni yang sudah ubah sandi"
            >
              Fauzi (Aktif)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              className={`px-2 py-0.5 rounded-lg border text-[10px] font-medium cursor-pointer transition-colors ${
                selectedRole === 'admin'
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
              }`}
              title="Admin Pondok Pengelola Data"
            >
              Admin Pondok
            </button>
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mb-2.5 p-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-[11px] leading-tight">{errorMessage}</span>
          </div>
        )}

        {/* 2 VERTICALLY STACKED INPUT BOXES AS REQUESTED */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* KOTAK 1: NIK / USERNAME (FOR ALUMNI) OR EMAIL (FOR ADMIN) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {selectedRole === 'alumni' ? 'NIK / Username Alumni' : 'Email Admin Pondok'}
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-600">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                placeholder={
                  selectedRole === 'alumni'
                    ? 'Masukkan NIK (16 digit) atau Username'
                    : 'admin.pondok@attaroqqy.ac.id'
                }
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white focus:border-transparent transition-all shadow-xs"
              />
            </div>
            {selectedRole === 'alumni' && (
              <p className="text-[10px] text-slate-400 mt-1">
                Gunakan NIK KTP Anda yang terdaftar pada database santri pondok.
              </p>
            )}
          </div>

          {/* KOTAK 2: KATA SANDI */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Kata Sandi
              </label>
              {selectedRole === 'alumni' && (
                <button
                  type="button"
                  onClick={onOpenForgotPassword}
                  className="text-[11px] text-[#0284c7] hover:text-[#0369a1] font-semibold hover:underline cursor-pointer"
                >
                  Lupa Sandi?
                </button>
              )}
            </div>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-600">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder={
                  selectedRole === 'alumni'
                    ? 'Sandi awal default: 1234'
                    : 'Kata sandi admin'
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white focus:border-transparent transition-all shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {selectedRole === 'alumni' && (
              <p className="text-[10px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-lg mt-1 inline-block">
                💡 Login pertama kali? Gunakan kata sandi bawaan: <strong className="font-mono">1234</strong>
              </p>
            )}
          </div>

          {/* TOMBOL LOGIN PENUH (TANPA FINGERPRINT) */}
          <div className="pt-1.5">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full h-11 sm:h-12 py-2.5 sm:py-3 font-bold rounded-2xl shadow-md text-white text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 ${
                selectedRole === 'admin'
                  ? 'bg-sky-700 hover:bg-sky-800 shadow-sky-700/25'
                  : 'bg-[#0284c7] hover:bg-[#0369a1] shadow-sky-600/30'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memverifikasi...</span>
                </div>
              ) : (
                <span>{selectedRole === 'admin' ? 'Masuk Sebagai Admin' : 'Login Alumni'}</span>
              )}
            </button>
          </div>

          {/* TEKS KECIL: "Belum punya akun? Daftar ." */}
          <div className="text-center pt-1">
            <p className="text-xs text-slate-600">
              Belum punya akun?{' '}
              <button
                type="button"
                onClick={onOpenRegister}
                className="text-[#0284c7] font-bold hover:text-[#0369a1] hover:underline cursor-pointer focus:outline-none"
              >
                Daftar .
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
