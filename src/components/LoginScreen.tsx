import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, ShieldCheck, User, Users } from 'lucide-react';
import { AlumniRecord, AdminUser, UserRole } from '../types';
import alumniIllustrationImg from '../assets/images/alumni_highfive_illustration_1790612738105.jpg';

interface LoginScreenProps {
  alumniList: AlumniRecord[];
  adminAccount: AdminUser;
  onLoginSuccess: (role: UserRole, alumniData?: AlumniRecord, adminData?: AdminUser) => void;
  onOpenRegister?: () => void;
  onOpenForgotPassword: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  alumniList,
  adminAccount,
  onLoginSuccess,
  onOpenForgotPassword,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('alumni');
  const [username, setUsername] = useState('mulia_ningsih');
  const [password, setPassword] = useState('1234');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage(null);
    if (role === 'alumni') {
      setUsername('mulia_ningsih');
      setPassword('1234');
    } else {
      setUsername('@admin_pusat');
      setPassword(adminAccount.password || '1997');
    }
  };

  const handleQuickDemo = (type: 'mulia' | 'fauzi' | 'admin') => {
    setErrorMessage(null);
    if (type === 'mulia') {
      setSelectedRole('alumni');
      setUsername('mulia_ningsih');
      setPassword('1234');
    } else if (type === 'fauzi') {
      setSelectedRole('alumni');
      setUsername('fauzi_trq');
      setPassword('passwordfauzi');
    } else if (type === 'admin') {
      setSelectedRole('admin');
      setUsername('@admin_pusat');
      setPassword(adminAccount.password || '1997');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const inputVal = username.trim();
    if (!inputVal) {
      setErrorMessage(
        selectedRole === 'alumni'
          ? 'Silakan masukkan username alumni Anda.'
          : 'Silakan masukkan username admin.'
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
        const expectedUsername = (adminAccount.username || '@admin_pusat').toLowerCase();
        const cleanExpected = expectedUsername.replace(/^@/, '');
        const expectedPassword = adminAccount.password || '1997';

        const inputId = inputVal.toLowerCase();
        const cleanInput = inputId.replace(/^@/, '');

        const isMatch =
          cleanInput === cleanExpected ||
          inputId === expectedUsername ||
          cleanInput === 'admin_pusat' ||
          cleanInput === 'superadmin' ||
          cleanInput === 'admin';

        if (isMatch && password === expectedPassword) {
          onLoginSuccess('admin', undefined, adminAccount);
          return;
        } else {
          setErrorMessage('Kredensial Admin tidak cocok. Gunakan username: @admin_pusat / sandi: 1997');
          return;
        }
      }

      // Role Alumni: Cari berdasarkan Username (dengan fallback NIK / NIS)
      const matchedAlumni = alumniList.find((alm) => {
        const cleanInput = inputVal.toLowerCase().replace(/^@/, '');
        const almUser = (alm.username || '').toLowerCase().replace(/^@/, '');
        const isUserMatch = almUser && almUser === cleanInput;
        const isNikMatch = alm.nik === inputVal;
        const isNisMatch = alm.nis.toLowerCase() === inputVal.toLowerCase();
        const isEmailMatch = alm.email.toLowerCase() === inputVal.toLowerCase();

        return isUserMatch || isNikMatch || isNisMatch || isEmailMatch;
      });

      if (!matchedAlumni) {
        setErrorMessage(
          'Username belum terdaftar di database alumni. Silakan periksa kembali nama pengguna Anda.'
        );
        return;
      }

      if (matchedAlumni.password !== password) {
        setErrorMessage(
          'Kata sandi salah. Jika belum pernah mengubah sandi, gunakan kata sandi awal: 1234.'
        );
        return;
      }

      onLoginSuccess('alumni', matchedAlumni);
    }, 450);
  };

  return (
    <div className="relative w-full h-full min-h-[660px] flex flex-col bg-gradient-to-b from-[#006bd6] via-[#0284c7] to-[#0ea5e9] overflow-hidden select-none">
      {/* Background subtle droplet bokeh overlay */}
      <div className="absolute inset-0 droplet-pattern opacity-25 pointer-events-none" />

      {/* Decorative radial lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-sky-300/20 rounded-full blur-3xl pointer-events-none" />

      {/* TOP SECTION: Portal Titles */}
      <div className="relative z-10 pt-8 sm:pt-10 px-6 text-center text-white flex flex-col items-center">
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-wider uppercase drop-shadow-md text-white">
          Portal Alumni
        </h1>
        <p className="text-xl sm:text-2xl font-display font-bold tracking-widest uppercase text-sky-100 drop-shadow-sm mt-0.5">
          At-taroqqy
        </p>
        <p className="text-xs text-sky-100 font-medium mt-1.5 opacity-90">
          {selectedRole === 'alumni' ? 'Masuk ke Akun Alumni' : 'Akses Panel Pengurus Admin'}
        </p>
      </div>

      {/* CENTER SECTION: Clean Illustration */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-2 min-h-[150px] max-h-[200px]">
        <div className="relative w-full max-w-[270px] h-[165px] flex items-center justify-center">
          <div className="w-full h-full rounded-2xl overflow-hidden flex items-center justify-center relative shadow-lg">
            {!imageError ? (
              <img
                src={alumniIllustrationImg}
                alt="Alumni At-taroqqy"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover object-center rounded-2xl"
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

      {/* BOTTOM SHEET: Clean Minimal Surface */}
      <div className="relative z-20 bg-white rounded-t-[32px] sm:rounded-3xl shadow-[0_-10px_35px_rgba(0,0,0,0.12)] px-6 pt-5 pb-7 mt-auto flex flex-col max-w-md mx-auto w-full sm:mb-5 sm:border sm:border-slate-100">
        {/* Handle Bar */}
        <div className="w-9 h-1 bg-slate-200 rounded-full mx-auto mb-3.5" />

        {/* ROLE SELECTOR TABS: ALUMNI VS ADMIN */}
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
            <span>Alumni</span>
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
            <span>Admin</span>
          </button>
        </div>

        {/* QUICK SHORTCUTS */}
        <div className="mb-3.5 flex items-center justify-between text-[11px] bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/80">
          <span className="text-slate-500 font-medium">Contoh Akun:</span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => handleQuickDemo('mulia')}
              className={`px-2 py-0.5 rounded-lg border text-[10px] font-semibold cursor-pointer transition-colors ${
                selectedRole === 'alumni' && username === 'mulia_ningsih'
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Mulia (1234)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('fauzi')}
              className={`px-2 py-0.5 rounded-lg border text-[10px] font-semibold cursor-pointer transition-colors ${
                selectedRole === 'alumni' && username === 'fauzi_trq'
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Fauzi
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              className={`px-2 py-0.5 rounded-lg border text-[10px] font-semibold cursor-pointer transition-colors ${
                selectedRole === 'admin' && username === '@admin_pusat'
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              @admin_pusat
            </button>
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-[11px] leading-tight font-medium">{errorMessage}</span>
          </div>
        )}

        {/* FORM LOGIN: USERNAME & KATA SANDI */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* KOTAK 1: USERNAME */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Username
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
                    ? 'Contoh: mulia_ningsih'
                    : 'Contoh: @admin_pusat'
                }
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white focus:border-transparent transition-all shadow-2xs"
              />
            </div>
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
                    ? 'Kata sandi (default: 1234)'
                    : 'Kata sandi admin'
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white focus:border-transparent transition-all shadow-2xs"
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
          </div>

          {/* TOMBOL LOGIN */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full h-11 sm:h-12 py-2.5 sm:py-3 font-bold rounded-2xl shadow-md text-white text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 ${
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
        </form>
      </div>
    </div>
  );
};
