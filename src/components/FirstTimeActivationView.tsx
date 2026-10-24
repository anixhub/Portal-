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
  LogOut,
  MapPin,
  Calendar,
  Navigation,
  FileText,
} from 'lucide-react';
import { AlumniRecord, AdminUser } from '../types';
import {
  getGlobalAllSantriRecords,
  setGlobalAllSantriRecords,
  checkNisLive,
  checkUsernameLive,
  checkNikLive,
  checkNoKkLive,
  uploadFileToHostinger,
} from '../services/apiService';
import {
  cascadeShiftOnManualNisChange,
  calculateCascadeShiftOnEntryDateChange,
  formatBaseUsername,
} from '../utils/alumniIdentityUtils';
import { WilayahAddressFilter } from './common/WilayahAddressFilter';
import { LocationCoordinates } from './common/FullscreenLocationMapModal';
import { DateWheelPicker } from './common/DateWheelPicker';
import { formatToDDMMYYYY } from '../utils/dateUtils';

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

  // =========================================================================
  // STEP 1: USERNAME & KATA SANDI (PERSIS SEPERTI DI KELOLA ALUMNI)
  // =========================================================================
  const initialRawClean = (alumni.username ? alumni.username.replace(/^@+/, '') : '').trim();
  const initialHasNoSpaces = !/\s/.test(initialRawClean);
  const initialHasOnlyAllowedChars = /^[a-zA-Z0-9_.]+$/.test(initialRawClean);
  const initialIsLengthRulePassed = initialRawClean.length >= 4;
  const initialIsValid = Boolean(initialRawClean && initialHasNoSpaces && initialHasOnlyAllowedChars && initialIsLengthRulePassed);

  const [usernameInput, setUsernameInput] = useState(() => initialRawClean);
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  // Username validation state
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>(
    initialIsValid ? 'available' : 'idle'
  );
  const [usernameError, setUsernameError] = useState<string>('');
  const usernameTimerRef = useRef<any>(null);

  // Simpan nilai username terakhir yang telah diperiksa atau nilai awal
  // Agar tidak melakukan pemeriksaan duplikasi kecuali ada perubahan input nyata
  const lastCheckedUsernameRef = useRef<string | null>(initialIsValid ? initialRawClean.toLowerCase() : null);

  // Logika validasi duplikasi username: HANYA berjalan jika ada perubahan input
  useEffect(() => {
    const rawClean = usernameInput.replace(/^@+/, '').trim();
    if (!rawClean) {
      if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);
      lastCheckedUsernameRef.current = null;
      setIsCheckingUsername(false);
      setUsernameStatus('idle');
      setUsernameError('');
      return;
    }

    const hasNoSpaces = !/\s/.test(usernameInput);
    const hasOnlyAllowedChars = /^[a-zA-Z0-9_.]+$/.test(rawClean);
    const isLengthRulePassed = rawClean.length >= 4;

    if (!hasNoSpaces || !hasOnlyAllowedChars || !isLengthRulePassed) {
      if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);
      lastCheckedUsernameRef.current = null;
      setIsCheckingUsername(false);
      setUsernameStatus('idle');
      setUsernameError('');
      return;
    }

    const lower = rawClean.toLowerCase();

    // JIKA TIDAK ADA PERUBAHAN DARI PEMERIKSAAN SEBELUMNYA, JANGAN LAKUKAN PEMERIKSAAN
    if (lastCheckedUsernameRef.current === lower) {
      return;
    }

    setIsCheckingUsername(true);
    setUsernameStatus('checking');

    if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);
    usernameTimerRef.current = setTimeout(async () => {
      // 1. Cek reserved admin list
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
            reservedList.push(adm.username.toLowerCase().replace(/^@+/, ''));
          }
        });
      }

      if (reservedList.includes(lower)) {
        lastCheckedUsernameRef.current = lower;
        setIsCheckingUsername(false);
        setUsernameStatus('taken');
        setUsernameError('Username ini dicadangkan untuk pengurus/admin');
        return;
      }

      // 2. Cek database santri & alumni
      const allPool = getGlobalAllSantriRecords && getGlobalAllSantriRecords().length > 0
        ? getGlobalAllSantriRecords()
        : alumniList;

      const isTakenLocal = allPool.some((alm: any) => {
        if (String(alm.id).trim() === String(alumni.id).trim()) return false;
        const exist = (alm.username || '').toLowerCase().replace(/^@+/, '').trim();
        return exist === lower;
      });

      if (isTakenLocal) {
        lastCheckedUsernameRef.current = lower;
        setIsCheckingUsername(false);
        setUsernameStatus('taken');
        setUsernameError('Sudah digunakan oleh alumni lain');
        return;
      }

      // 3. Live check ke API
      try {
        const live = await checkUsernameLive(rawClean, alumni.id);
        if (!live.available) {
          lastCheckedUsernameRef.current = lower;
          setIsCheckingUsername(false);
          setUsernameStatus('taken');
          setUsernameError(
            live.collidingRecord?.name
              ? `Sudah digunakan oleh ${live.collidingRecord.name}`
              : 'Sudah digunakan oleh akun lain'
          );
          return;
        }
      } catch (e) {
        // Fallback local ok
      }

      lastCheckedUsernameRef.current = lower;
      setIsCheckingUsername(false);
      setUsernameStatus('available');
      setUsernameError('');
    }, 320);

    return () => {
      if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);
    };
  }, [usernameInput, alumni.id]);

  const rawCleanUsername = usernameInput.replace(/^@+/, '').trim();
  const hasNoSpaces = !/\s/.test(usernameInput);
  const hasOnlyAllowedChars = rawCleanUsername.length > 0 && /^[a-zA-Z0-9_.]+$/.test(rawCleanUsername);
  const isCharRulePassed = rawCleanUsername.length > 0 && hasOnlyAllowedChars && hasNoSpaces;
  const isLengthRulePassed = rawCleanUsername.length >= 4;
  const isUniquePassed = usernameStatus === 'available';

  const isUsernameSaveEnabled =
    isCharRulePassed && isLengthRulePassed && isUniquePassed && !isCheckingUsername;

  const isPasswordValid = password.length >= 4 && password !== '1234';
  const isRepeatMatch = repeatPassword.length > 0 && repeatPassword === password;
  const canProceedStep1 = isUsernameSaveEnabled && isPasswordValid && isRepeatMatch;

  // =========================================================================
  // STEP 2: LENGKAPI DATA DIRI (PERSIS SEPERTI DI KELOLA ALUMNI)
  // =========================================================================
  const [formData, setFormData] = useState({
    name: alumni.name || '',
    nik: alumni.nik || '',
    noKk: alumni.noKk || '',
    nis: alumni.nis || '',
    gender: (alumni.gender === 'P' || alumni.gender === 'Putri' ? 'P' : 'L') as 'L' | 'P',
    tempatLahir: alumni.tempatLahir || '',
    tanggalLahir: alumni.tanggalLahir || '',
    phone: alumni.phone || '',
    occupation: alumni.occupation || '',
    institution: alumni.institution || '',
    province: alumni.province || '',
    city: alumni.city || '',
    kecamatan: alumni.kecamatan || '',
    desa: alumni.desa || '',
    alamatLengkap: alumni.alamatLengkap || '',
  });

  const [coordinates, setCoordinates] = useState<LocationCoordinates | null>(
    alumni.coordinates || null
  );

  // --- LOGIKA TAHUN MASUK & TAHUN BOYONG (PERSIS KELOLA ALUMNI) ---
  const [isEntryDateKnown, setIsEntryDateKnown] = useState<boolean>(
    Boolean(alumni.entryDate || alumni.entryYear)
  );
  const [entryDate, setEntryDate] = useState<string>(
    alumni.entryDate || (alumni.entryYear ? `${alumni.entryYear}-07-15` : '')
  );
  const [isGradDateKnown, setIsGradDateKnown] = useState<boolean>(
    Boolean(alumni.gradDate || alumni.gradYear)
  );
  const [gradDate, setGradDate] = useState<string>(
    alumni.gradDate || (alumni.gradYear ? `${alumni.gradYear}-05-20` : '')
  );
  const [activeDateModal, setActiveDateModal] = useState<'entry' | 'grad' | null>(null);
  const [tempPickerDate, setTempPickerDate] = useState<string>('2018-07-15');

  // --- LOGIKA NIK, NO KK, NIS (PERSIS KELOLA ALUMNI) ---
  const [isCheckingNik, setIsCheckingNik] = useState(false);
  const [duplicateNik, setDuplicateNik] = useState<any>(null);

  const [isCheckingNoKk, setIsCheckingNoKk] = useState(false);
  const [duplicateNoKk, setDuplicateNoKk] = useState<any>(null);

  const [isCheckingNis, setIsCheckingNis] = useState(false);
  const [duplicateNis, setDuplicateNis] = useState<any>(null);
  const [isManualShiftApplied, setIsManualShiftApplied] = useState(false);
  const [affectedManualAlumni, setAffectedManualAlumni] = useState<
    Array<{ id: string; nis: string; name: string }>
  >([]);
  const lastCheckedNisRef = useRef<string | null>(
    alumni.nis ? alumni.nis.replace(/\D/g, '').trim() : null
  );

  // Cek NIK
  useEffect(() => {
    const clean = formData.nik.replace(/\D/g, '').slice(0, 16);
    if (clean.length < 16) {
      setIsCheckingNik(false);
      setDuplicateNik(null);
      return;
    }
    setIsCheckingNik(true);
    const timer = setTimeout(async () => {
      const allPool =
        getGlobalAllSantriRecords && getGlobalAllSantriRecords().length > 0
          ? getGlobalAllSantriRecords()
          : alumniList;
      let found: any = allPool.find(
        (a: any) => a.id !== alumni.id && a.nik && a.nik.replace(/\D/g, '').trim() === clean
      );
      if (!found) {
        try {
          const live = await checkNikLive(clean, alumni.id);
          if (!live.available && live.collidingRecord) {
            found = live.collidingRecord;
          }
        } catch (e) {}
      }
      setIsCheckingNik(false);
      setDuplicateNik(found || null);
    }, 300);
    return () => clearTimeout(timer);
  }, [formData.nik, alumni.id, alumniList]);

  // Cek No KK
  useEffect(() => {
    const clean = formData.noKk.replace(/\D/g, '').slice(0, 16);
    if (clean.length < 16) {
      setIsCheckingNoKk(false);
      setDuplicateNoKk(null);
      return;
    }
    setIsCheckingNoKk(true);
    const timer = setTimeout(async () => {
      const allPool =
        getGlobalAllSantriRecords && getGlobalAllSantriRecords().length > 0
          ? getGlobalAllSantriRecords()
          : alumniList;
      let found: any = allPool.find(
        (a: any) => a.id !== alumni.id && a.noKk && a.noKk.replace(/\D/g, '').trim() === clean
      );
      if (!found) {
        try {
          const live = await checkNoKkLive(clean, alumni.id);
          if (!live.available && live.collidingRecord) {
            found = live.collidingRecord;
          }
        } catch (e) {}
      }
      setIsCheckingNoKk(false);
      setDuplicateNoKk(found || null);
    }, 300);
    return () => clearTimeout(timer);
  }, [formData.noKk, alumni.id, alumniList]);

  // Cek NIS
  useEffect(() => {
    const clean = formData.nis.replace(/\D/g, '').trim();
    if (!clean || clean.length < 7) {
      lastCheckedNisRef.current = clean;
      setIsCheckingNis(false);
      setDuplicateNis(null);
      return;
    }

    if (lastCheckedNisRef.current === clean) {
      return;
    }

    setIsCheckingNis(true);
    const timer = setTimeout(async () => {
      const allPool =
        getGlobalAllSantriRecords && getGlobalAllSantriRecords().length > 0
          ? getGlobalAllSantriRecords()
          : alumniList;
      let found: any = allPool.find(
        (a: any) => a.id !== alumni.id && a.nis && a.nis.replace(/\D/g, '').trim() === clean
      );
      if (!found) {
        try {
          const live = await checkNisLive(clean, alumni.id);
          if (!live.available && live.collidingRecord) {
            found = live.collidingRecord;
          }
        } catch (e) {}
      }

      if (formData.nis.replace(/\D/g, '').trim() !== clean) return;
      lastCheckedNisRef.current = clean;
      setIsCheckingNis(false);
      setDuplicateNis(found || null);
    }, 300);
    return () => clearTimeout(timer);
  }, [formData.nis, alumni.id, alumniList]);

  const cleanNik = formData.nik.replace(/\D/g, '').slice(0, 16);
  const cleanNoKk = formData.noKk.replace(/\D/g, '').slice(0, 16);
  const cleanNis = formData.nis.replace(/\D/g, '').trim();
  const isCurrentNis =
    cleanNis.length === 7 && cleanNis === (alumni.nis || '').replace(/\D/g, '').trim();
  const isNisOk =
    cleanNis.length === 0 ||
    (cleanNis.length === 7 && (!duplicateNis || isManualShiftApplied || isCurrentNis));

  const isStep2SubmitDisabled =
    cleanNik.length !== 16 ||
    isCheckingNik ||
    Boolean(duplicateNik) ||
    isCheckingNoKk ||
    Boolean(duplicateNoKk) ||
    isCheckingNis ||
    !isNisOk ||
    (cleanNoKk.length > 0 && cleanNoKk.length !== 16);

  // =========================================================================
  // STEP 3: FOTO PROFIL & KOTAK BIO
  // =========================================================================
  const [photoPreview, setPhotoPreview] = useState<string>(alumni.photoUrl || '');
  const [bio, setBio] = useState<string>(alumni.bio || '');
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

  // =========================================================================
  // SUBMISSION FINAL
  // =========================================================================
  const handleFinalSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Jika pergeseran manual diterapkan pada NIS
      if (isManualShiftApplied && affectedManualAlumni.length > 0) {
        for (const aff of affectedManualAlumni) {
          fetch(`/api/db/santri/${aff.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nis: aff.nis }),
          }).catch(() => {});
        }
        const updatedPool = getGlobalAllSantriRecords().map((item: any) => {
          const match = affectedManualAlumni.find((a) => a.id === item.id);
          if (match) return { ...item, nis: match.nis };
          if (item.id === alumni.id) return { ...item, nis: cleanNis };
          return item;
        });
        setGlobalAllSantriRecords(updatedPool);
      }

      // Username yang valid persis seperti yang diinput dan lolos validasi (lowercase, tanpa @)
      const cleanUser = rawCleanUsername.toLowerCase();
      const finalUsername = cleanUser;

      // Upload foto profil jika berupa data base64 sebelum dispatch agar payload ringkas
      let finalPhotoUrl = photoPreview || alumni.photoUrl;
      if (photoPreview && photoPreview.startsWith('data:image/')) {
        try {
          const uploaded = await uploadFileToHostinger(photoPreview, `pas_foto_${alumni.id}_${Date.now()}.jpg`);
          if (uploaded && !uploaded.startsWith('data:')) {
            finalPhotoUrl = uploaded;
          }
        } catch (e) {}
      }

      const calcEntryYear = entryDate ? entryDate.substring(0, 4) : alumni.entryYear || '';
      const calcGradYear = gradDate ? gradDate.substring(0, 4) : alumni.gradYear || '';

      const updatedRecord: AlumniRecord = {
        ...alumni,
        name: formData.name,
        nik: cleanNik,
        noKk: cleanNoKk || undefined,
        nis: cleanNis || alumni.nis || '',
        gender: formData.gender,
        tempatLahir: formData.tempatLahir || undefined,
        tanggalLahir: formData.tanggalLahir || undefined,
        entryDate: entryDate || undefined,
        entryYear: calcEntryYear,
        gradDate: gradDate || undefined,
        gradYear: calcGradYear,
        phone: formData.phone || '',
        occupation: formData.occupation || '',
        institution: formData.institution || '',
        province: formData.province || '',
        city: formData.city || '',
        kecamatan: formData.kecamatan || undefined,
        desa: formData.desa || undefined,
        alamatLengkap: formData.alamatLengkap || undefined,
        coordinates: coordinates || undefined,
        bio: bio.trim(),
        username: finalUsername,
        password: password,
        isPasswordChanged: true,
        hasLoggedIn: true,
        photoUrl: finalPhotoUrl,
        status: 'alumni',
      };
      (updatedRecord as any).nama = formData.name;
      (updatedRecord as any).status_keanggotaan = 'Alumni';

      await onComplete({
        username: finalUsername,
        newPassword: password,
        updatedAlumni: updatedRecord,
        photoUrl: finalPhotoUrl || undefined,
      });
    } catch (err) {
      console.error('Error saat menyimpan aktivasi akun:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-between py-6 sm:py-8 px-4 sm:px-6 relative select-none">
      {/* Decorative background subtle glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-gradient-to-b from-sky-100/40 via-sky-50/20 to-transparent pointer-events-none rounded-full blur-3xl -z-10" />

      {/* TOP HEADER */}
      <div className="w-full max-w-2xl mx-auto flex items-center justify-between pb-3.5 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-600 to-sky-700 text-white flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
              Aktivasi Akun Alumni
            </h1>
            <p className="text-[11px] text-slate-500">Pondok Pesantren At-taroqqy</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancelLogout}
          className="text-xs font-semibold text-slate-500 hover:text-rose-600 py-1 px-2.5 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar</span>
        </button>
      </div>

      {/* MAIN CONTAINER */}
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col my-5">
        {/* STEP PROGRESS BAR */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-2xs mb-5">
          <div className="flex items-center justify-between relative px-2 sm:px-6">
            <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-0.5 bg-slate-200 -z-0" />
            <div
              className="absolute top-1/2 left-8 -translate-y-1/2 h-0.5 bg-sky-600 transition-all duration-300 -z-0"
              style={{
                width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%',
              }}
            />

            {/* Step 1 Indicator */}
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep > 1
                    ? 'bg-emerald-500 text-white'
                    : currentStep === 1
                    ? 'bg-sky-600 text-white ring-4 ring-sky-100'
                    : 'bg-white text-slate-400 border border-slate-200'
                }`}
              >
                {currentStep > 1 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '1'}
              </div>
              <span
                className={`text-[11px] font-semibold mt-1 ${
                  currentStep >= 1 ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                Atur Akun
              </span>
            </div>

            {/* Step 2 Indicator */}
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep > 2
                    ? 'bg-emerald-500 text-white'
                    : currentStep === 2
                    ? 'bg-sky-600 text-white ring-4 ring-sky-100'
                    : 'bg-white text-slate-400 border border-slate-200'
                }`}
              >
                {currentStep > 2 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '2'}
              </div>
              <span
                className={`text-[11px] font-semibold mt-1 ${
                  currentStep >= 2 ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                Lengkapi Data Diri
              </span>
            </div>

            {/* Step 3 Indicator */}
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep === 3
                    ? 'bg-sky-600 text-white ring-4 ring-sky-100'
                    : 'bg-white text-slate-400 border border-slate-200'
                }`}
              >
                3
              </div>
              <span
                className={`text-[11px] font-semibold mt-1 ${
                  currentStep === 3 ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                Foto & Bio
              </span>
            </div>
          </div>
        </div>

        {/* STEP CONTENT CONTAINER */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-xs flex-1 flex flex-col justify-between">
          {/* ======================================================== */}
          {/* STEP 1: ATUR USERNAME & KATA SANDI (PERSIS KELOLA ALUMNI) */}
          {/* ======================================================== */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Buat Username & Kata Sandi
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Hai <span className="font-semibold text-slate-800">{alumni.name}</span>, tentukan
                  username unik Anda dan buat kata sandi baru untuk login portal.
                </p>
              </div>

              <div className="space-y-4 pt-1">
                {/* 1. INPUT USERNAME PERSIS SEPERTI DI KELOLA ALUMNI */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Username Baru</label>
                    <span className="text-[11px] text-slate-400">Untuk login akun portal</span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                      @
                    </span>
                    <input
                      type="text"
                      autoFocus
                      placeholder="username_baru"
                      value={usernameInput}
                      onChange={(e) => {
                        setUsernameInput(e.target.value.replace(/^@+/, ''));
                      }}
                      className="w-full pl-8 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs sm:text-sm text-slate-800 placeholder-slate-400 transition-colors"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                      {isCheckingUsername && (
                        <Loader2 className="w-4 h-4 text-sky-600 animate-spin" />
                      )}
                      {!isCheckingUsername && rawCleanUsername && usernameStatus === 'available' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                      {!isCheckingUsername && rawCleanUsername && usernameStatus === 'taken' && (
                        <XCircle className="w-4 h-4 text-rose-500" />
                      )}
                    </div>
                  </div>

                  {/* Checklist Syarat Username persis Kelola Alumni */}
                  <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5">
                    {/* Syarat 1: Tidak mengandung spasi atau special karakter */}
                    <div className="flex items-center gap-2 text-xs">
                      {isCharRulePassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : rawCleanUsername.length > 0 && (!hasNoSpaces || !hasOnlyAllowedChars) ? (
                        <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        </div>
                      )}
                      <span
                        className={`text-[11px] leading-tight ${
                          isCharRulePassed
                            ? 'text-emerald-700 font-semibold'
                            : rawCleanUsername.length > 0 && (!hasNoSpaces || !hasOnlyAllowedChars)
                            ? 'text-rose-600 font-semibold'
                            : 'text-slate-600'
                        }`}
                      >
                        Tidak mengandung spasi atau special karakter (selain _ dan titik)
                      </span>
                    </div>

                    {/* Syarat 2: Minimal 4 digit */}
                    <div className="flex items-center gap-2 text-xs">
                      {isLengthRulePassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : rawCleanUsername.length > 0 ? (
                        <div className="w-3.5 h-3.5 rounded-full border border-amber-400 bg-amber-50 flex items-center justify-center shrink-0 text-[9px] font-bold text-amber-700">
                          {rawCleanUsername.length}
                        </div>
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        </div>
                      )}
                      <span
                        className={`text-[11px] leading-tight ${
                          isLengthRulePassed
                            ? 'text-emerald-700 font-semibold'
                            : 'text-slate-600'
                        }`}
                      >
                        Minimal 4 digit{' '}
                        {rawCleanUsername.length > 0 && !isLengthRulePassed && (
                          <span className="text-amber-600 font-bold">
                            ({rawCleanUsername.length}/4)
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Syarat 3: Unik */}
                    <div className="flex items-center gap-2 text-xs">
                      {isCheckingUsername ? (
                        <Loader2 className="w-3.5 h-3.5 text-sky-500 animate-spin shrink-0" />
                      ) : isUniquePassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : usernameStatus === 'taken' ? (
                        <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        </div>
                      )}
                      <span
                        className={`text-[11px] leading-tight ${
                          isCheckingUsername
                            ? 'text-sky-600 font-medium'
                            : isUniquePassed
                            ? 'text-emerald-700 font-semibold'
                            : usernameStatus === 'taken'
                            ? 'text-rose-600 font-semibold'
                            : 'text-slate-500'
                        }`}
                      >
                        {isCheckingUsername
                          ? 'Memeriksa ketersediaan...'
                          : isUniquePassed
                          ? 'Unik (tidak sama dengan yang lain)'
                          : usernameStatus === 'taken'
                          ? usernameError || 'Sudah digunakan oleh alumni lain'
                          : 'Unik (tidak sama dengan yang lain)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. KATA SANDI BARU */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Kata Sandi Baru</label>
                    <span className="text-[11px] text-slate-400">Minimal 4 karakter</span>
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
                      className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-colors ${
                        password && !isPasswordValid
                          ? 'border-rose-300 focus:ring-2 focus:ring-rose-200'
                          : 'border-slate-200 focus:ring-2 focus:ring-sky-500'
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {password === '1234' ? (
                    <p className="text-[11px] text-rose-600 font-medium mt-1">
                      Tidak boleh menggunakan kata sandi default 1234.
                    </p>
                  ) : password && password.length < 4 ? (
                    <p className="text-[11px] text-rose-600 font-medium mt-1">
                      Kata sandi minimal 4 karakter.
                    </p>
                  ) : null}
                </div>

                {/* 3. ULANGI KATA SANDI */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
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
                      className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-colors ${
                        repeatPassword && !isRepeatMatch
                          ? 'border-rose-300 focus:ring-2 focus:ring-rose-200'
                          : repeatPassword && isRepeatMatch
                          ? 'border-emerald-400 focus:ring-2 focus:ring-emerald-200'
                          : 'border-slate-200 focus:ring-2 focus:ring-sky-500'
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showRepeatPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {repeatPassword && !isRepeatMatch ? (
                    <p className="text-[11px] text-rose-600 font-medium mt-1">
                      Kata sandi tidak cocok.
                    </p>
                  ) : repeatPassword && isRepeatMatch ? (
                    <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Kata sandi cocok!</span>
                    </p>
                  ) : null}
                </div>
              </div>

              {/* NAV BUTTON */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  disabled={!canProceedStep1}
                  onClick={() => setCurrentStep(2)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  <span>Lanjut ke Lengkapi Data Diri</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 2: LENGKAPI DATA DIRI (PERSIS KELOLA ALUMNI) */}
          {/* ======================================================== */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Lengkapi Data Diri
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Periksa dan lengkapi data diri Anda untuk pangkalan data alumni pondok.
                </p>
              </div>

              <div className="space-y-3.5 pt-1 max-h-[58vh] overflow-y-auto pr-1 text-xs">
                {/* 1. NAMA LENGKAP */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Lengkap & Gelar
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white text-xs"
                  />
                </div>

                {/* 2. NIK & NO KK (PERSIS KELOLA ALUMNI) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
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
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            nik: e.target.value.replace(/\D/g, '').slice(0, 16),
                          }))
                        }
                        className="w-full px-3 py-2 pr-9 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                      />
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                        {isCheckingNik && (
                          <Loader2 className="w-4 h-4 text-sky-600 animate-spin" />
                        )}
                        {!isCheckingNik && cleanNik.length === 16 && !duplicateNik && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                        {!isCheckingNik && cleanNik.length === 16 && duplicateNik && (
                          <XCircle className="w-4 h-4 text-rose-500" />
                        )}
                      </div>
                    </div>
                    {cleanNik.length > 0 && cleanNik.length < 16 && (
                      <p className="text-[11px] text-amber-600 font-medium mt-1">
                        Kurang {16 - cleanNik.length} digit (harus 16 digit)
                      </p>
                    )}
                    {!isCheckingNik && cleanNik.length === 16 && duplicateNik && (
                      <p className="text-[11px] text-rose-500 font-medium mt-1">
                        NIK sudah digunakan oleh {duplicateNik.name || 'data lain'} (
                        {duplicateNik.status || 'Santri/Alumni'})
                      </p>
                    )}
                    {!isCheckingNik && cleanNik.length === 16 && !duplicateNik && (
                      <p className="text-[11px] text-emerald-600 font-medium mt-1">
                        NIK valid & belum terdaftar
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
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
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            noKk: e.target.value.replace(/\D/g, '').slice(0, 16),
                          }))
                        }
                        className="w-full px-3 py-2 pr-9 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                      />
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                        {isCheckingNoKk && (
                          <Loader2 className="w-4 h-4 text-sky-600 animate-spin" />
                        )}
                        {!isCheckingNoKk && cleanNoKk.length === 16 && !duplicateNoKk && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                        {!isCheckingNoKk && cleanNoKk.length === 16 && duplicateNoKk && (
                          <XCircle className="w-4 h-4 text-rose-500" />
                        )}
                      </div>
                    </div>
                    {cleanNoKk.length > 0 && cleanNoKk.length < 16 && (
                      <p className="text-[11px] text-amber-600 font-medium mt-1">
                        Kurang {16 - cleanNoKk.length} digit (harus 16 digit)
                      </p>
                    )}
                    {!isCheckingNoKk && cleanNoKk.length === 16 && duplicateNoKk && (
                      <p className="text-[11px] text-rose-500 font-medium mt-1">
                        Nomor KK sudah digunakan oleh {duplicateNoKk.name || 'data lain'}
                      </p>
                    )}
                    {!isCheckingNoKk && cleanNoKk.length === 16 && !duplicateNoKk && (
                      <p className="text-[11px] text-emerald-600 font-medium mt-1">
                        Nomor KK valid & belum terdaftar
                      </p>
                    )}
                  </div>
                </div>

                {/* 3. NIS & JENIS KELAMIN (PERSIS KELOLA ALUMNI) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nomor Induk Santri (NIS)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={7}
                        value={formData.nis}
                        onChange={(e) => {
                          setFormData((p) => ({
                            ...p,
                            nis: e.target.value.replace(/\D/g, '').slice(0, 7),
                          }));
                          setIsManualShiftApplied(false);
                          setAffectedManualAlumni([]);
                        }}
                        className={`w-full px-3 py-2 pr-9 bg-slate-50 border rounded-xl font-mono text-xs focus:bg-white focus:outline-none ${
                          duplicateNis && !isManualShiftApplied && !isCurrentNis
                            ? 'border-amber-300 focus:ring-2 focus:ring-amber-200'
                            : cleanNis.length === 7 && (!duplicateNis || isManualShiftApplied || isCurrentNis)
                            ? 'border-emerald-300 focus:ring-2 focus:ring-emerald-200'
                            : 'border-slate-200 focus:ring-2 focus:ring-sky-500'
                        }`}
                        placeholder="7 digit (misal: 2012001)"
                      />
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                        {isCheckingNis && (
                          <Loader2 className="w-4 h-4 text-sky-600 animate-spin" />
                        )}
                        {!isCheckingNis &&
                          cleanNis.length === 7 &&
                          (!duplicateNis || isManualShiftApplied || isCurrentNis) && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          )}
                        {!isCheckingNis &&
                          cleanNis.length === 7 &&
                          duplicateNis &&
                          !isManualShiftApplied &&
                          !isCurrentNis && <AlertCircle className="w-4 h-4 text-amber-500" />}
                      </div>
                    </div>

                    {cleanNis.length > 0 && cleanNis.length < 7 && (
                      <p className="text-[11px] text-amber-600 font-medium mt-1">
                        Kurang {7 - cleanNis.length} digit (harus 7 digit)
                      </p>
                    )}
                    {!isCheckingNis && cleanNis.length === 7 && !duplicateNis && (
                      <p className="text-[11px] text-emerald-600 font-medium mt-1">
                        NIS valid & tersedia
                      </p>
                    )}

                    {!isCheckingNis &&
                      cleanNis.length === 7 &&
                      duplicateNis &&
                      !isManualShiftApplied &&
                      !isCurrentNis && (
                        <div className="mt-2 p-2.5 bg-amber-50 rounded-xl border border-amber-200/80 space-y-1.5">
                          <p className="text-[11px] text-amber-900 leading-snug">
                            NIS <span className="font-mono font-bold">{cleanNis}</span> sudah
                            digunakan oleh <b>{duplicateNis.name || 'Santri Lain'}</b> (
                            {duplicateNis.status || 'Santri Aktif'}).
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              const allPool =
                                getGlobalAllSantriRecords && getGlobalAllSantriRecords().length > 0
                                  ? getGlobalAllSantriRecords()
                                  : alumniList;
                              const shiftResult = cascadeShiftOnManualNisChange(
                                alumni.id,
                                cleanNis,
                                allPool as any
                              );
                              setAffectedManualAlumni(shiftResult.affectedAlumni);
                              setIsManualShiftApplied(true);
                            }}
                            className="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer text-center"
                          >
                            Sesuaikan Urutan NIS
                          </button>
                        </div>
                      )}

                    {isManualShiftApplied && (
                      <div className="mt-2 p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          Urutan NIS disesuaikan ({affectedManualAlumni.length} data digeser).
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, gender: 'L' }))}
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
                        onClick={() => setFormData((p) => ({ ...p, gender: 'P' }))}
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
                    <label className="block font-semibold text-slate-700 mb-1">Tempat Lahir</label>
                    <input
                      type="text"
                      value={formData.tempatLahir}
                      onChange={(e) => setFormData((p) => ({ ...p, tempatLahir: e.target.value }))}
                      placeholder="Contoh: Rembang"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tanggal Lahir</label>
                    <input
                      type="date"
                      value={formData.tanggalLahir}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, tanggalLahir: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* 5. TAHUN MASUK & TAHUN BOYONG (PERSIS SEPERTI DI KELOLA ALUMNI) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Tanggal Masuk */}
                  <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 text-xs">
                        Tanggal Masuk Pondok
                      </span>
                      <span className="text-[10px] text-sky-700 font-bold bg-sky-100 px-2 py-0.5 rounded-full">
                        {entryDate ? entryDate.substring(0, 4) : 'Tahun Masuk'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTempPickerDate(entryDate || '2018-07-15');
                        setActiveDateModal('entry');
                      }}
                      className="w-full px-3 py-2 bg-white hover:bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 flex items-center justify-between transition-colors cursor-pointer group"
                    >
                      <span
                        className={
                          entryDate
                            ? 'text-slate-900 font-semibold'
                            : 'text-slate-400 font-normal'
                        }
                      >
                        {entryDate
                          ? formatToDDMMYYYY(entryDate)
                          : isEntryDateKnown
                          ? 'Pilih Tanggal Masuk'
                          : 'Belum diketahui'}
                      </span>
                      <Calendar className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 transition-colors shrink-0" />
                    </button>
                    <p className="text-[10px] text-slate-400">
                      Acuan tahun masuk & generate urutan NIS santri
                    </p>
                  </div>

                  {/* Tanggal Keluar / Boyong */}
                  <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 text-xs">
                        Tanggal Keluar / Boyong
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                        {gradDate ? gradDate.substring(0, 4) : 'Tahun Lulus'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTempPickerDate(gradDate || '2024-05-20');
                        setActiveDateModal('grad');
                      }}
                      className="w-full px-3 py-2 bg-white hover:bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 flex items-center justify-between transition-colors cursor-pointer group"
                    >
                      <span
                        className={
                          gradDate
                            ? 'text-slate-900 font-semibold'
                            : 'text-slate-400 font-normal'
                        }
                      >
                        {gradDate
                          ? formatToDDMMYYYY(gradDate)
                          : isGradDateKnown
                          ? 'Pilih Tanggal Keluar'
                          : 'Belum diketahui / Aktif'}
                      </span>
                      <Calendar className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 transition-colors shrink-0" />
                    </button>
                    <p className="text-[10px] text-slate-400">
                      Tahun kelulusan angkatan alumni pondok
                    </p>
                  </div>
                </div>

                {/* 6. WHATSAPP */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nomor WhatsApp Aktif
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                  />
                </div>

                {/* 7. PROFESI & INSTANSI (DI ATAS ALAMAT SESUAI INSTRUKSI USER) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Profesi / Pekerjaan Saat Ini
                    </label>
                    <input
                      type="text"
                      value={formData.occupation}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, occupation: e.target.value }))
                      }
                      placeholder="Contoh: Pengajar, Wirausaha, Mahasiswa"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Instansi / Kampus / Lembaga
                    </label>
                    <input
                      type="text"
                      value={formData.institution}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, institution: e.target.value }))
                      }
                      placeholder="Contoh: Universitas / Lembaga"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* 8. ALAMAT (TOMBOL LOKASI SAAT INI -> PROVINSI S.D. DESA -> KOTAK PETA PIN) */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="mb-2">
                    <label className="block font-bold text-slate-800 text-xs">
                      Alamat & Titik Domisili
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Gunakan tombol lokasi otomatis atau pilih provinsi sampai desa secara berurutan.
                    </p>
                  </div>

                  <WilayahAddressFilter
                    province={formData.province}
                    city={formData.city}
                    kecamatan={formData.kecamatan}
                    desa={formData.desa}
                    alamatLengkap={formData.alamatLengkap}
                    coordinates={coordinates}
                    showAlamatLengkap={true}
                    showLocationTag={true}
                    showCurrentLocationButton={true}
                    stacked={true}
                    onChange={(vals) => {
                      setFormData((prev) => ({
                        ...prev,
                        province: vals.province,
                        city: vals.city,
                        kecamatan: vals.kecamatan,
                        desa: vals.desa,
                        alamatLengkap:
                          vals.alamatLengkap !== undefined
                            ? vals.alamatLengkap
                            : prev.alamatLengkap,
                      }));
                      if (vals.coordinates !== undefined) {
                        setCoordinates(vals.coordinates);
                      }
                    }}
                  />
                </div>
              </div>

              {/* NAV BUTTONS */}
              <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali</span>
                </button>

                <button
                  type="button"
                  disabled={isStep2SubmitDisabled}
                  onClick={() => setCurrentStep(3)}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Lanjut ke Foto & Bio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 3: FOTO PROFIL & KOTAK BIO */}
          {/* ======================================================== */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Foto Profil & Bio Diri
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Pasang foto profil terbaik dan tuliskan catatan bio singkat Anda untuk direktori alumni.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center py-2 space-y-4">
                {/* PREVIEW LINGKARAN */}
                <div className="relative">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-sky-100 shadow-md bg-slate-100 flex items-center justify-center">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Foto Profil"
                        className="w-full h-full object-cover object-center"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-300">
                        <User className="w-14 h-14" />
                      </div>
                    )}
                  </div>

                  {photoPreview && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      title="Hapus foto"
                      className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-105"
                    >
                      <X className="w-3.5 h-3.5" />
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

                {/* ACTION BUTTON */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{photoPreview ? 'Ganti Foto Profil' : 'Pilih Foto Profil'}</span>
                </button>
              </div>

              {/* KOTAK BIO / CATATAN DIRI SESUAI INSTRUKSI USER */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Bio / Catatan Diri
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {bio.length}/250
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={250}
                  placeholder="Tuliskan bio singkat, hobi, keahlian, atau pesan silaturahmi untuk sesama alumni..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors resize-none shadow-2xs"
                />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Bio akan tampil pada kartu profil alumni dan direktori silaturahmi pondok.
                </p>
              </div>

              {/* NAV BUTTONS */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalSubmit}
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-sky-600/20 disabled:opacity-75"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Menyimpan Akun...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>Simpan & Masuk Portal</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER NOTICE */}
      <div className="w-full max-w-2xl mx-auto text-center pt-1">
        <p className="text-[11px] text-slate-400">
          Pangkalan Data Alumni Pondok Pesantren At-taroqqy &bull; Terlindungi & Terverifikasi
        </p>
      </div>

      {/* ========================================================================= */}
      {/* MODAL DATE WHEEL PICKER UNTUK TANGGAL MASUK (PERSIS KELOLA ALUMNI) */}
      {/* ========================================================================= */}
      {activeDateModal === 'entry' && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setActiveDateModal(null)}
        >
          <div
            className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900 text-center">
                Atur Tanggal Masuk Pondok
              </h3>
              <button
                type="button"
                onClick={() => setActiveDateModal(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Toggle Sudah diketahui */}
            <div className="flex items-center justify-between bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-700">Sudah diketahui</span>
              <button
                type="button"
                onClick={() => {
                  const nextVal = !isEntryDateKnown;
                  setIsEntryDateKnown(nextVal);
                  if (nextVal && !tempPickerDate) {
                    setTempPickerDate('2018-07-15');
                  }
                }}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  isEntryDateKnown ? 'bg-sky-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {isEntryDateKnown ? (
              <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-2.5">
                <DateWheelPicker
                  value={tempPickerDate || '2018-07-15'}
                  onChange={(val) => setTempPickerDate(val)}
                  minYear={1970}
                  maxYear={new Date().getFullYear()}
                  maxDate={new Date().toISOString().split('T')[0]}
                />
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                Tanggal masuk belum diketahui. NIS akan dikosongkan.
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveDateModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const newDate = isEntryDateKnown ? tempPickerDate || '2018-07-15' : '';
                  setEntryDate(newDate);

                  // Jika NIS kosong atau belum diubah, otomatis hitung perkiraan NIS
                  if (newDate) {
                    const cascade = calculateCascadeShiftOnEntryDateChange(
                      alumni.id,
                      newDate,
                      alumniList
                    );
                    if (!formData.nis || formData.nis === alumni.nis) {
                      setFormData((p) => ({ ...p, nis: cascade.targetNis }));
                    }
                  }
                  setActiveDateModal(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Simpan Tanggal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DATE WHEEL PICKER UNTUK TANGGAL KELUAR (PERSIS KELOLA ALUMNI) */}
      {/* ========================================================================= */}
      {activeDateModal === 'grad' && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setActiveDateModal(null)}
        >
          <div
            className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900 text-center">
                Atur Tanggal Keluar (Boyong)
              </h3>
              <button
                type="button"
                onClick={() => setActiveDateModal(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Toggle Sudah diketahui */}
            <div className="flex items-center justify-between bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-700">Sudah diketahui</span>
              <button
                type="button"
                onClick={() => {
                  const nextVal = !isGradDateKnown;
                  setIsGradDateKnown(nextVal);
                  if (nextVal && !tempPickerDate) {
                    setTempPickerDate('2024-05-20');
                  }
                }}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  isGradDateKnown ? 'bg-sky-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {isGradDateKnown ? (
              <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-2.5">
                <DateWheelPicker
                  value={tempPickerDate || '2024-05-20'}
                  onChange={(val) => setTempPickerDate(val)}
                  minYear={1970}
                  maxYear={new Date().getFullYear()}
                  maxDate={new Date().toISOString().split('T')[0]}
                />
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                Tanggal keluar belum diketahui / masih aktif di pondok.
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveDateModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const newDate = isGradDateKnown ? tempPickerDate || '2024-05-20' : '';
                  setGradDate(newDate);
                  setActiveDateModal(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Simpan Tanggal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
