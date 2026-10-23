import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  User,
  KeyRound,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  X,
  XCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Camera,
  Upload,
  AlertCircle,
  FileCheck2,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { AlumniRecord, AdminUser } from '../types';
import { getGlobalAllSantriRecords } from '../services/apiService';

interface FirstTimeActivationViewProps {
  alumni: AlumniRecord;
  alumniList: AlumniRecord[];
  adminAccounts?: AdminUser[];
  onComplete: (data: {
    username: string;
    newPassword: string;
    updatedAlumni: AlumniRecord;
    photoUrl?: string;
  }) => Promise<void> | void;
  onCancelLogout: () => void;
}

type Step = 1 | 2 | 3;

export const FirstTimeActivationView: React.FC<FirstTimeActivationViewProps> = ({
  alumni,
  alumniList,
  adminAccounts,
  onComplete,
  onCancelLogout,
}) => {
  const [currentStep, setCurrentStep] = useState<Step>(1);

  // --- STEP 1: AKUN (USERNAME & KATA SANDI) ---
  const [usernameInput, setUsernameInput] = useState(() => {
    return alumni.username ? alumni.username.replace(/^@/, '') : '';
  });
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  // Username validation & availability state
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'reserved'
  >('idle');
  const [usernameFeedback, setUsernameFeedback] = useState<string>('');
  const checkTimeoutRef = useRef<any>(null);

  // Check username availability with debounce
  useEffect(() => {
    const raw = usernameInput.trim().toLowerCase().replace(/^@/, '');

    if (!raw) {
      setUsernameStatus('idle');
      setUsernameFeedback('');
      setIsCheckingUsername(false);
      return;
    }

    // Format validation
    const usernameRegex = /^[a-z0-9_.]+$/;
    if (raw.length < 3) {
      setUsernameStatus('invalid');
      setUsernameFeedback('Username minimal 3 karakter.');
      setIsCheckingUsername(false);
      return;
    }
    if (raw.length > 24) {
      setUsernameStatus('invalid');
      setUsernameFeedback('Username maksimal 24 karakter.');
      setIsCheckingUsername(false);
      return;
    }
    if (!usernameRegex.test(raw)) {
      setUsernameStatus('invalid');
      setUsernameFeedback('Hanya boleh huruf kecil, angka, titik, atau garis bawah (_).');
      setIsCheckingUsername(false);
      return;
    }

    // Start checking animation
    setIsCheckingUsername(true);
    setUsernameStatus('checking');
    setUsernameFeedback('Memeriksa ketersediaan...');

    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    checkTimeoutRef.current = setTimeout(() => {
      // 1. Reserved admin usernames check
      const reservedList = [
        'admin',
        'admin_pusat',
        'superadmin',
        'pengurus',
        'pengurus_pondok',
        'attaroqqy',
        'root',
        'administrator',
      ];
      if (adminAccounts && adminAccounts.length > 0) {
        adminAccounts.forEach((adm) => {
          if (adm.username) {
            reservedList.push(adm.username.toLowerCase().replace(/^@/, ''));
          }
        });
      }

      if (reservedList.includes(raw)) {
        setIsCheckingUsername(false);
        setUsernameStatus('reserved');
        setUsernameFeedback('Username ini dicadangkan untuk pengurus.');
        return;
      }

      // 2. Check if taken by any other alumni
      const isTaken = alumniList.some((alm) => {
        if (alm.id === alumni.id) return false;
        const existing = (alm.username || '').toLowerCase().replace(/^@/, '').trim();
        return existing === raw;
      });

      setIsCheckingUsername(false);
      if (isTaken) {
        setUsernameStatus('taken');
        setUsernameFeedback('Username sudah digunakan, silakan pilih yang lain.');
      } else {
        setUsernameStatus('available');
        setUsernameFeedback('Username tersedia!');
      }
    }, 380);

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [usernameInput, alumni.id, alumniList, adminAccounts]);

  // Step 1 Validation
  const isUsernameValid = usernameStatus === 'available';
  const isPasswordValid = password.length >= 4 && password !== '1234';
  const isRepeatMatch = repeatPassword.length > 0 && repeatPassword === password;
  const canProceedStep1 = isUsernameValid && isPasswordValid && isRepeatMatch && !isCheckingUsername;

  // --- STEP 2: BIODATA FIELDS ---
  const [formData, setFormData] = useState({
    name: alumni.name || '',
    nik: alumni.nik || '',
    noKk: alumni.noKk || '',
    nis: alumni.nis || '',
    nism: alumni.nism || '',
    gender: (alumni.gender === 'P' || alumni.gender === 'Putri' ? 'P' : 'L') as 'L' | 'P',
    tempatLahir: alumni.tempatLahir || '',
    tanggalLahir: alumni.tanggalLahir || '',
    entryYear: alumni.entryYear || '',
    gradYear: alumni.gradYear || '',
    asramaDulu: alumni.asramaDulu || '',
    phone: alumni.phone || '',
    alamatLengkap: alumni.alamatLengkap || '',
    desa: alumni.desa || '',
    kecamatan: alumni.kecamatan || '',
    city: alumni.city || '',
    province: alumni.province || '',
    occupation: alumni.occupation || '',
    institution: alumni.institution || '',
  });

  const [isCheckingNik, setIsCheckingNik] = useState(false);
  const [duplicateNik, setDuplicateNik] = useState<any>(null);
  const [isCheckingNoKk, setIsCheckingNoKk] = useState(false);
  const [duplicateNoKk, setDuplicateNoKk] = useState<any>(null);

  useEffect(() => {
    const clean = formData.nik.replace(/\D/g, '').slice(0, 16);
    if (clean.length < 16) {
      setIsCheckingNik(false);
      setDuplicateNik(null);
      return;
    }
    setIsCheckingNik(true);
    const timer = setTimeout(() => {
      setIsCheckingNik(false);
      const allPool = getGlobalAllSantriRecords && getGlobalAllSantriRecords().length > 0
        ? getGlobalAllSantriRecords()
        : alumniList;
      const found = allPool.find(
        (a: any) => a.id !== alumni.id && a.nik && a.nik.replace(/\D/g, '').trim() === clean
      );
      setDuplicateNik(found || null);
    }, 320);
    return () => clearTimeout(timer);
  }, [formData.nik, alumni.id, alumniList]);

  useEffect(() => {
    const clean = formData.noKk.replace(/\D/g, '').slice(0, 16);
    if (clean.length < 16) {
      setIsCheckingNoKk(false);
      setDuplicateNoKk(null);
      return;
    }
    setIsCheckingNoKk(true);
    const timer = setTimeout(() => {
      setIsCheckingNoKk(false);
      const allPool = getGlobalAllSantriRecords && getGlobalAllSantriRecords().length > 0
        ? getGlobalAllSantriRecords()
        : alumniList;
      const found = allPool.find(
        (a: any) => a.id !== alumni.id && a.noKk && a.noKk.replace(/\D/g, '').trim() === clean
      );
      setDuplicateNoKk(found || null);
    }, 320);
    return () => clearTimeout(timer);
  }, [formData.noKk, alumni.id, alumniList]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // --- STEP 3: FOTO PROFIL ---
  const [photoPreview, setPhotoPreview] = useState<string>(alumni.photoUrl || '');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Silakan pilih berkas gambar (JPG, PNG, atau WEBP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert('Ukuran gambar terlalu besar. Maksimal 8MB.');
      return;
    }

    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
      setIsUploadingPhoto(false);
    };
    reader.onerror = () => {
      alert('Gagal membaca gambar.');
      setIsUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // --- SUBMISSION ---
  const handleFinalSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const cleanHandle = usernameInput.trim().toLowerCase().replace(/^@/, '');
      const finalUsername = cleanHandle ? (cleanHandle.startsWith('@') ? cleanHandle : `@${cleanHandle}`) : '';

      const updatedRecord: AlumniRecord = {
        ...alumni,
        ...formData,
        username: finalUsername,
        password: password,
        isPasswordChanged: true,
        hasLoggedIn: true,
        photoUrl: photoPreview || alumni.photoUrl,
      };

      await onComplete({
        username: finalUsername,
        newPassword: password,
        updatedAlumni: updatedRecord,
        photoUrl: photoPreview || undefined,
      });
    } catch (err) {
      console.error('Error saat menyimpan aktivasi:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-between py-6 sm:py-10 px-4 sm:px-6 relative select-none">
      {/* Decorative subtle background accents */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-gradient-to-b from-sky-100/50 via-sky-50/20 to-transparent pointer-events-none rounded-full blur-3xl -z-10" />

      {/* TOP HEADER */}
      <div className="w-full max-w-3xl mx-auto flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0284c7] to-[#0369a1] text-white flex items-center justify-center shadow-md shadow-sky-600/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-display font-bold text-slate-800 leading-tight">
              Aktivasi Akun Alumni
            </h1>
            <p className="text-xs text-slate-500">
              Pondok Pesantren At-taroqqy
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancelLogout}
          className="text-xs font-semibold text-slate-500 hover:text-rose-600 py-1.5 px-3 rounded-xl hover:bg-rose-50 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar</span>
        </button>
      </div>

      {/* MAIN CONTAINER */}
      <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col my-6">
        {/* STEP PROGRESS BAR */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs mb-6">
          <div className="flex items-center justify-between relative">
            {/* Step lines */}
            <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-0.5 bg-slate-200 -z-0" />
            <div
              className="absolute top-1/2 left-8 -translate-y-1/2 h-0.5 bg-[#0284c7] transition-all duration-300 -z-0"
              style={{
                width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%',
              }}
            />

            {/* Step 1 Indicator */}
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep > 1
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : currentStep === 1
                    ? 'bg-[#0284c7] text-white ring-4 ring-sky-100 shadow-xs'
                    : 'bg-white text-slate-400 border-2 border-slate-200'
                }`}
              >
                {currentStep > 1 ? <Check className="w-4 h-4 stroke-[3]" /> : '1'}
              </div>
              <span
                className={`text-[11px] font-semibold mt-1.5 ${
                  currentStep >= 1 ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                Setup Akun
              </span>
            </div>

            {/* Step 2 Indicator */}
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep > 2
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : currentStep === 2
                    ? 'bg-[#0284c7] text-white ring-4 ring-sky-100 shadow-xs'
                    : 'bg-white text-slate-400 border-2 border-slate-200'
                }`}
              >
                {currentStep > 2 ? <Check className="w-4 h-4 stroke-[3]" /> : '2'}
              </div>
              <span
                className={`text-[11px] font-semibold mt-1.5 ${
                  currentStep >= 2 ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                Koreksi Data
              </span>
            </div>

            {/* Step 3 Indicator */}
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep === 3
                    ? 'bg-[#0284c7] text-white ring-4 ring-sky-100 shadow-xs'
                    : 'bg-white text-slate-400 border-2 border-slate-200'
                }`}
              >
                3
              </div>
              <span
                className={`text-[11px] font-semibold mt-1.5 ${
                  currentStep === 3 ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                Foto Profil
              </span>
            </div>
          </div>
        </div>

        {/* STEP CONTENT BOX */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex-1 flex flex-col justify-between">
          {/* ======================================================== */}
          {/* STEP 1: SETUP USERNAME & KATA SANDI */}
          {/* ======================================================== */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg sm:text-xl font-display font-bold text-slate-900">
                  Buat Username & Kata Sandi
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                  Selamat datang, <span className="font-semibold text-slate-800">{alumni.name}</span>. Karena ini pertama kali Anda login, silakan tentukan username pribadi dan ganti kata sandi default Anda.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {/* 1. INPUT USERNAME DENGAN LOADING & STATUS */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Username Baru
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Bisa untuk login selain NIK
                    </span>
                  </div>

                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                      @
                    </div>

                    <input
                      type="text"
                      autoFocus
                      placeholder="contoh: ahmad_fauzi"
                      value={usernameInput}
                      onChange={(e) => {
                        const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '');
                        setUsernameInput(cleaned);
                      }}
                      className={`w-full pl-8 pr-11 py-3 bg-slate-50 border rounded-2xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all ${
                        usernameStatus === 'available'
                          ? 'border-emerald-400 focus:ring-2 focus:ring-emerald-300'
                          : usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'reserved'
                          ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                          : 'border-slate-200 focus:ring-2 focus:ring-[#0284c7]'
                      }`}
                    />

                    {/* ANIMASI LOADING / STATUS DI SEBELAH KANAN */}
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                      {isCheckingUsername && (
                        <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                      )}

                      {!isCheckingUsername && usernameStatus === 'available' && (
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      {!isCheckingUsername &&
                        (usernameStatus === 'taken' ||
                          usernameStatus === 'invalid' ||
                          usernameStatus === 'reserved') && (
                          <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                            <X className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                    </div>
                  </div>

                  {/* PEMBERITAHUAN DI BAWAH KOTAK DENGAN SIMPLE */}
                  <div className="mt-1.5 min-h-[18px]">
                    {usernameFeedback ? (
                      <p
                        className={`text-xs font-medium flex items-center gap-1.5 ${
                          usernameStatus === 'available'
                            ? 'text-emerald-600'
                            : usernameStatus === 'checking'
                            ? 'text-sky-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {usernameStatus === 'available' && <Check className="w-3 h-3 shrink-0" />}
                        {usernameStatus === 'taken' && <AlertCircle className="w-3 h-3 shrink-0" />}
                        <span>{usernameFeedback}</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400">
                        Gunakan huruf kecil, angka, titik, atau garis bawah (_) tanpa spasi.
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. KATA SANDI BARU */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Kata Sandi Baru
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Minimal 4 karakter
                    </span>
                  </div>

                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>

                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Masukkan kata sandi baru"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-10 pr-10 py-3 bg-slate-50 border rounded-2xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all ${
                        password && !isPasswordValid
                          ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                          : 'border-slate-200 focus:ring-2 focus:ring-[#0284c7]'
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {password === '1234' ? (
                    <p className="text-xs text-rose-600 font-medium mt-1">
                      Tidak boleh menggunakan kata sandi standar 1234.
                    </p>
                  ) : password && password.length < 4 ? (
                    <p className="text-xs text-rose-600 font-medium mt-1">
                      Kata sandi minimal 4 karakter.
                    </p>
                  ) : null}
                </div>

                {/* 3. ULANGI KATA SANDI */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Ulangi Kata Sandi
                  </label>

                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>

                    <input
                      type={showRepeatPassword ? 'text' : 'password'}
                      placeholder="Ketik ulang kata sandi baru"
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                      className={`w-full pl-10 pr-10 py-3 bg-slate-50 border rounded-2xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all ${
                        repeatPassword && !isRepeatMatch
                          ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                          : repeatPassword && isRepeatMatch
                          ? 'border-emerald-400 focus:ring-2 focus:ring-emerald-300'
                          : 'border-slate-200 focus:ring-2 focus:ring-[#0284c7]'
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showRepeatPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {repeatPassword && !isRepeatMatch ? (
                    <p className="text-xs text-rose-600 font-medium mt-1">
                      Kata sandi tidak cocok.
                    </p>
                  ) : repeatPassword && isRepeatMatch ? (
                    <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Kata sandi cocok!</span>
                    </p>
                  ) : null}
                </div>
              </div>

              {/* NAV BUTTONS */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  disabled={!canProceedStep1}
                  onClick={() => setCurrentStep(2)}
                  className="w-full sm:w-auto px-6 py-3 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-sky-600/20"
                >
                  <span>Lanjut ke Koreksi Data</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 2: KOREKSI DATA DIRI DARI DATABASE */}
          {/* ======================================================== */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg sm:text-xl font-display font-bold text-slate-900">
                  Koreksi Data Diri
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                  Berikut data Anda yang saat ini tersimpan di pangkalan data pondok. Silakan periksa dan perbaiki jika ada data yang kurang tepat.
                </p>
              </div>

              {/* FORM FIELDS - CLEAN, SIMPLE, NO RED ASTERISKS */}
              <div className="space-y-4 pt-1 max-h-[58vh] overflow-y-auto pr-1">
                {/* 1. NAMA LENGKAP */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white"
                  />
                </div>

                {/* 2. NIK & NO KK */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor Induk Kependudukan (NIK)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={16}
                        placeholder="16 digit"
                        value={formData.nik}
                        onChange={(e) => handleFieldChange('nik', e.target.value.replace(/\D/g, '').slice(0, 16))}
                        className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                        {isCheckingNik && (
                          <Loader2 className="w-4 h-4 text-sky-600 animate-spin" />
                        )}
                        {!isCheckingNik && formData.nik.replace(/\D/g, '').length === 16 && !duplicateNik && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                        {!isCheckingNik && formData.nik.replace(/\D/g, '').length === 16 && duplicateNik && (
                          <XCircle className="w-4 h-4 text-rose-500" />
                        )}
                      </div>
                    </div>
                    {formData.nik.replace(/\D/g, '').length > 0 && formData.nik.replace(/\D/g, '').length < 16 && (
                      <p className="text-[11px] text-amber-600 font-medium mt-1">
                        Kurang {16 - formData.nik.replace(/\D/g, '').length} digit (harus 16 digit)
                      </p>
                    )}
                    {!isCheckingNik && formData.nik.replace(/\D/g, '').length === 16 && duplicateNik && (
                      <p className="text-[11px] text-rose-500 font-medium mt-1">
                        NIK sudah terdaftar pada santri/alumni lain ({duplicateNik.name || 'data lain'})
                      </p>
                    )}
                    {!isCheckingNik && formData.nik.replace(/\D/g, '').length === 16 && !duplicateNik && (
                      <p className="text-[11px] text-emerald-600 font-medium mt-1">
                        NIK valid & tersedia
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor Kartu Keluarga (KK)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={16}
                        placeholder="16 digit"
                        value={formData.noKk}
                        onChange={(e) => handleFieldChange('noKk', e.target.value.replace(/\D/g, '').slice(0, 16))}
                        className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                        {isCheckingNoKk && (
                          <Loader2 className="w-4 h-4 text-sky-600 animate-spin" />
                        )}
                        {!isCheckingNoKk && formData.noKk.replace(/\D/g, '').length === 16 && !duplicateNoKk && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                        {!isCheckingNoKk && formData.noKk.replace(/\D/g, '').length === 16 && duplicateNoKk && (
                          <XCircle className="w-4 h-4 text-rose-500" />
                        )}
                      </div>
                    </div>
                    {formData.noKk.replace(/\D/g, '').length > 0 && formData.noKk.replace(/\D/g, '').length < 16 && (
                      <p className="text-[11px] text-amber-600 font-medium mt-1">
                        Kurang {16 - formData.noKk.replace(/\D/g, '').length} digit (harus 16 digit)
                      </p>
                    )}
                    {!isCheckingNoKk && formData.noKk.replace(/\D/g, '').length === 16 && duplicateNoKk && (
                      <p className="text-[11px] text-rose-500 font-medium mt-1">
                        Nomor KK sudah terdaftar pada santri/alumni lain ({duplicateNoKk.name || 'data lain'})
                      </p>
                    )}
                    {!isCheckingNoKk && formData.noKk.replace(/\D/g, '').length === 16 && !duplicateNoKk && (
                      <p className="text-[11px] text-emerald-600 font-medium mt-1">
                        Nomor KK valid & tersedia
                      </p>
                    )}
                  </div>
                </div>

                {/* 3. NIS & JENIS KELAMIN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor Induk Santri (NIS)
                    </label>
                    <input
                      type="text"
                      value={formData.nis}
                      onChange={(e) => handleFieldChange('nis', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Jenis Kelamin
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleFieldChange('gender', 'L')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          formData.gender === 'L'
                            ? 'bg-sky-50 border-sky-400 text-sky-800'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Laki-laki
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFieldChange('gender', 'P')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          formData.gender === 'P'
                            ? 'bg-rose-50 border-rose-400 text-rose-800'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Perempuan
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4. TEMPAT & TANGGAL LAHIR */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tempat Lahir
                    </label>
                    <input
                      type="text"
                      value={formData.tempatLahir}
                      onChange={(e) => handleFieldChange('tempatLahir', e.target.value)}
                      placeholder="Contoh: Rembang"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tanggal Lahir
                    </label>
                    <input
                      type="date"
                      value={formData.tanggalLahir}
                      onChange={(e) => handleFieldChange('tanggalLahir', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white"
                    />
                  </div>
                </div>

                {/* 5. TAHUN MASUK & TAHUN LULUS (BOYONG) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tahun Masuk
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={formData.entryYear}
                      onChange={(e) => handleFieldChange('entryYear', e.target.value)}
                      placeholder="Contoh: 2014"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tahun Lulus / Boyong
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={formData.gradYear}
                      onChange={(e) => handleFieldChange('gradYear', e.target.value)}
                      placeholder="Contoh: 2020"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Asrama Dulu / Kamar
                    </label>
                    <input
                      type="text"
                      value={formData.asramaDulu}
                      onChange={(e) => handleFieldChange('asramaDulu', e.target.value)}
                      placeholder="Contoh: Khodijah Lt. 2"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white"
                    />
                  </div>
                </div>

                {/* 6. WHATSAPP & NO HP */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor WhatsApp / HP Aktif
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Penting untuk informasi silaturahmi reuni dan grup kedaerahan alumni.
                  </p>
                </div>

                {/* 7. ALAMAT LENGKAP */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alamat Lengkap (Jalan, RT/RW)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.alamatLengkap}
                    onChange={(e) => handleFieldChange('alamatLengkap', e.target.value)}
                    placeholder="Contoh: Jl. Diponegoro No. 45, RT 02 / RW 01"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white resize-none"
                  />
                </div>

                {/* 8. WILAYAH: DESA, KECAMATAN, KABUPATEN, PROVINSI */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Desa / Kelurahan
                    </label>
                    <input
                      type="text"
                      value={formData.desa}
                      onChange={(e) => handleFieldChange('desa', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Kecamatan
                    </label>
                    <input
                      type="text"
                      value={formData.kecamatan}
                      onChange={(e) => handleFieldChange('kecamatan', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Kabupaten / Kota
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleFieldChange('city', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Provinsi
                    </label>
                    <input
                      type="text"
                      value={formData.province}
                      onChange={(e) => handleFieldChange('province', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white"
                    />
                  </div>
                </div>

                {/* 9. PROFESI & INSTANSI */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Profesi / Pekerjaan Saat Ini
                    </label>
                    <input
                      type="text"
                      value={formData.occupation}
                      onChange={(e) => handleFieldChange('occupation', e.target.value)}
                      placeholder="Contoh: Guru, Wiraswasta, Mahasiswa"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Instansi / Kampus / Tempat Usaha
                    </label>
                    <input
                      type="text"
                      value={formData.institution}
                      onChange={(e) => handleFieldChange('institution', e.target.value)}
                      placeholder="Contoh: MAN 1 Rembang"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* NAV BUTTONS */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-2.5 text-slate-600 hover:text-slate-800 font-bold rounded-xl text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-3 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold rounded-2xl text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-sky-600/20"
                >
                  <span>Lanjut ke Foto Profil</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 3: UPLOAD FOTO PROFIL */}
          {/* ======================================================== */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg sm:text-xl font-display font-bold text-slate-900">
                  Upload Foto Profil
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                  Pasang foto profil terbaik Anda agar rekan alumni mudah mengenali Anda di direktori dan peta persebaran alumni.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center py-6 space-y-5">
                {/* PREVIEW LINGKARAN */}
                <div className="relative">
                  <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-sky-100 shadow-lg bg-slate-100 flex items-center justify-center">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Foto Profil"
                        className="w-full h-full object-cover object-center"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-300">
                        <User className="w-16 h-16" />
                      </div>
                    )}
                  </div>

                  {photoPreview && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      title="Hapus foto"
                      className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-105"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* HIDDEN FILE INPUT */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* ACTION BUTTONS & DROPZONE */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="px-5 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold rounded-2xl text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{photoPreview ? 'Ganti Foto Profil' : 'Pilih Foto Profil'}</span>
                  </button>
                </div>

                <p className="text-xs text-slate-400 text-center max-w-sm">
                  Format yang didukung: JPG, PNG, atau WEBP. Anda juga dapat memperbarui foto ini sewaktu-waktu di halaman profil.
                </p>
              </div>

              {/* NAV BUTTONS */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-slate-600 hover:text-slate-800 font-bold rounded-xl text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalSubmit}
                  className="px-7 py-3 bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#0369a1] hover:to-[#075985] text-white font-bold rounded-2xl text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-sky-600/30 disabled:opacity-75"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menyimpan Akun...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>Simpan & Masuk ke Portal Alumni</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER NOTICE */}
      <div className="w-full max-w-3xl mx-auto text-center pt-2">
        <p className="text-[11px] text-slate-400">
          Akun Anda terlindungi dengan enkripsi database pangkalan data santri At-taroqqy.
        </p>
      </div>
    </div>
  );
};
