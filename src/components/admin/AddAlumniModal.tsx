import React, { useState } from 'react';
import { 
  X, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  CheckCircle2, 
  XCircle,
  Loader2,
  AlertCircle,
  User,
  GraduationCap,
  MapPin,
  Calendar
} from 'lucide-react';
import { AlumniRecord } from '../../types';
import { WilayahAddressFilter } from '../common/WilayahAddressFilter';
import { formatToDDMMYYYY } from '../../utils/dateUtils';
import { LocationCoordinates } from '../common/FullscreenLocationMapModal';
import { generateNisFromEntryDate, generateUniqueUsername } from '../../utils/alumniIdentityUtils';
import { DateWheelPicker } from '../common/DateWheelPicker';

import { getGlobalAllSantriRecords, SantriIdentityLookup } from '../../services/apiService';

interface AddAlumniModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newAlumni: AlumniRecord) => void;
  existingAlumni?: AlumniRecord[];
  allSantriList?: SantriIdentityLookup[];
}

export const AddAlumniModal: React.FC<AddAlumniModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingAlumni = [],
  allSantriList,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form State - Step 1: Identitas
  const [nik, setNik] = useState('');
  const [isCheckingNik, setIsCheckingNik] = useState(false);
  const [nikCheckStatus, setNikCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [collidingSantri, setCollidingSantri] = useState<SantriIdentityLookup | AlumniRecord | null>(null);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [anakKe, setAnakKe] = useState<number>(1);
  const [dariBersaudara, setDariBersaudara] = useState<number>(1);

  // Debounce check NIK 16 digit terhadap seluruh data santri (aktif & alumni)
  React.useEffect(() => {
    const cleanNik = nik.replace(/\D/g, '').slice(0, 16);
    if (!cleanNik || cleanNik.length < 16) {
      setIsCheckingNik(false);
      setNikCheckStatus('idle');
      setCollidingSantri(null);
      return;
    }

    setIsCheckingNik(true);
    setNikCheckStatus('checking');

    const timer = setTimeout(() => {
      setIsCheckingNik(false);
      const allPool = (allSantriList && allSantriList.length > 0)
        ? allSantriList
        : (getGlobalAllSantriRecords().length > 0 ? getGlobalAllSantriRecords() : existingAlumni);
      const found = allPool.find(a => a.nik && a.nik.replace(/\D/g, '').trim() === cleanNik);
      if (found) {
        setCollidingSantri(found as any);
        setNikCheckStatus('taken');
      } else {
        setCollidingSantri(null);
        setNikCheckStatus('available');
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [nik, allSantriList, existingAlumni]);

  // Form State - Step 2: Riwayat Tanggal Pondok
  const [entryDate, setEntryDate] = useState('');
  const [gradDate, setGradDate] = useState('');
  const [activeDateModal, setActiveDateModal] = useState<'entry' | 'grad' | null>(null);
  const [tempPickerDate, setTempPickerDate] = useState<string>('2021-07-15');

  const formatIndonesianDate = (iso: string) => formatToDDMMYYYY(iso);

  // Form State - Step 3: Domisili & Kontak (Default Kosong Sesuai Permintaan)
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [desa, setDesa] = useState('');
  const [alamatLengkap, setAlamatLengkap] = useState('');
  const [coordinates, setCoordinates] = useState<LocationCoordinates | null>(null);
  const [occupation, setOccupation] = useState('');
  const [institution, setInstitution] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canSubmitStep3, setCanSubmitStep3] = useState(false);
  const step3EnteredAtRef = React.useRef<number>(0);

  if (!isOpen) return null;

  const handleNext = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setError(null);

    if (currentStep === 1) {
      const cleanNik = nik.replace(/\D/g, '');
      if (cleanNik.length !== 16) {
        setError('NIK harus tepat 16 digit angka.');
        return;
      }
      if (isCheckingNik) {
        setError('Sedang memvalidasi NIK, silakan tunggu sebentar...');
        return;
      }
      const allPool = (allSantriList && allSantriList.length > 0)
        ? allSantriList
        : (getGlobalAllSantriRecords().length > 0 ? getGlobalAllSantriRecords() : existingAlumni);
      const duplicate = allPool.find(a => a.nik && a.nik.replace(/\D/g, '').trim() === cleanNik);
      if (duplicate || nikCheckStatus === 'taken') {
        const dupName = duplicate ? duplicate.name : (collidingSantri?.name || 'Santri/Alumni');
        setError(`NIK sudah terdaftar pada: ${dupName}`);
        return;
      }
      if (!name.trim()) {
        setError('Nama lengkap alumni wajib diisi.');
        return;
      }
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      // Pindah ke Step 3: Domisili & Kontak
      // Berikan jeda pengaman agar event klik/touch tidak bocor ke tombol Simpan
      setCurrentStep(3);
      step3EnteredAtRef.current = Date.now();
      setCanSubmitStep3(false);
      setTimeout(() => {
        setCanSubmitStep3(true);
      }, 700);
      return;
    }
  };

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setError(null);
    if (currentStep === 2) setCurrentStep(1);
    if (currentStep === 3) {
      setCurrentStep(2);
      setCanSubmitStep3(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Mencegah submit jika belum sampai langkah 3 atau jika transisi baru saja terjadi
    if (currentStep !== 3) {
      return;
    }
    if (!canSubmitStep3 || Date.now() - step3EnteredAtRef.current < 700) {
      return;
    }
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    // Hitung NIS berdasarkan Tanggal Masuk (4 digit tahun + 3 digit nomor urut santri)
    // Memperhitungkan seluruh santri (baik santri aktif maupun alumni) agar tidak bentrok
    const allPool = (allSantriList && allSantriList.length > 0)
      ? allSantriList
      : (getGlobalAllSantriRecords().length > 0 ? getGlobalAllSantriRecords() : existingAlumni);

    const generatedNis = entryDate.trim()
      ? generateNisFromEntryDate(entryDate.trim(), allPool as any)
      : '';

    // Generate Username unik sesuai nama (ganti spasi underscore, label angka pembeda jika duplikat)
    const generatedUsername = generateUniqueUsername(name.trim(), allPool as any);

    const calculatedEntryYear = entryDate.trim() ? entryDate.trim().slice(0, 4) : '';
    const calculatedGradYear = gradDate.trim() ? gradDate.trim().slice(0, 4) : '';

    const newRecord: AlumniRecord = {
      id: 'alm-man-' + Date.now(),
      nik: nik.trim(),
      nis: generatedNis,
      name: name.trim(),
      username: generatedUsername,
      gender,
      anak_ke: anakKe,
      dari_bersaudara: dariBersaudara,
      urutanAnak: anakKe,
      jumlahSaudara: dariBersaudara,
      entryDate: entryDate.trim() || undefined,
      gradDate: gradDate.trim() || undefined,
      entryYear: calculatedEntryYear,
      gradYear: calculatedGradYear,
      jenjang: 'Madrasah Aliyah Keagamaan (MAK)',
      asramaDulu: 'Komplek Utama',
      email: email.trim() || '',
      phone: phone.trim() || '',
      city: city.trim(),
      province: province.trim(),
      kecamatan: kecamatan.trim() || undefined,
      desa: desa.trim() || undefined,
      alamatLengkap: alamatLengkap.trim() || undefined,
      coordinates: coordinates || undefined,
      occupation: occupation.trim() || '',
      institution: institution.trim(),
      password: '1234',
      isPasswordChanged: false,
      source: 'manual_admin',
      syncTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      shareContact: true,
      status: 'alumni',
    };

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        onSave(newRecord);
        setIsSuccess(false);
        onClose();
      }, 900);
    }, 500);
  };

  const steps = [
    { num: 1, title: 'Identitas Diri', icon: User },
    { num: 2, title: 'Tanggal Pondok', icon: GraduationCap },
    { num: 3, title: 'Domisili & Kontak', icon: MapPin },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* 1. TOP HEADER APP BAR */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 sm:px-6 flex items-center justify-between shrink-0 shadow-2xs">
        <button
          type="button"
          onClick={currentStep > 1 ? handlePrev : onClose}
          className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
          title={currentStep > 1 ? 'Kembali' : 'Tutup'}
        >
          {currentStep > 1 ? <ArrowLeft className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>

        <div className="text-center">
          <h2 className="font-display font-bold text-sm sm:text-base text-slate-900 leading-tight">
            Tambah Data Alumni
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-2 py-1 cursor-pointer"
        >
          Batal
        </button>
      </div>

      {/* 2. PROGRESS STEPPER BAR */}
      <div className="bg-white border-b border-slate-100 px-4 py-2 sm:px-6 shrink-0">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-2">
          {steps.map((st) => (
            <div key={st.num} className="flex flex-col gap-1">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentStep >= st.num ? 'bg-sky-600' : 'bg-slate-200'
                }`}
              />
              <span
                className={`text-[10px] font-semibold truncate text-center ${
                  currentStep === st.num
                    ? 'text-sky-700'
                    : currentStep > st.num
                    ? 'text-slate-700'
                    : 'text-slate-400'
                }`}
              >
                {st.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. FORM BODY CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="max-w-lg mx-auto w-full">
          {isSuccess ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 shadow-sm my-auto">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Alumni Berhasil Ditambahkan</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Data <strong>{name}</strong> telah tersimpan dalam sistem.
                </p>
              </div>
            </div>
          ) : (
            // Form strictly ignores accidental submits; transitions and saves are controlled by buttons
            <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* ================= STEP 1: IDENTITAS DIRI ================= */}
              {currentStep === 1 && (
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      NIK KTP <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={16}
                        required
                        placeholder="16 digit"
                        value={nik}
                        onChange={(e) => setNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
                        className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-none"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                        {isCheckingNik && (
                          <Loader2 className="w-4 h-4 text-sky-600 animate-spin" />
                        )}
                        {!isCheckingNik && nik.length === 16 && nikCheckStatus === 'available' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                        {!isCheckingNik && nik.length === 16 && nikCheckStatus === 'taken' && (
                          <XCircle className="w-4 h-4 text-rose-500" />
                        )}
                      </div>
                    </div>

                    {nik.length > 0 && nik.length < 16 && (
                      <p className="text-[11px] text-rose-500 font-medium mt-1">
                        Kurang {16 - nik.length} digit
                      </p>
                    )}
                    {!isCheckingNik && nik.length === 16 && nikCheckStatus === 'available' && (
                      <p className="text-[11px] text-emerald-600 font-medium mt-1">
                        NIK valid & belum terdaftar
                      </p>
                    )}
                    {!isCheckingNik && nik.length === 16 && nikCheckStatus === 'taken' && collidingSantri && (
                      <p className="text-[11px] text-rose-500 font-medium mt-1">
                        NIK sudah terdaftar pada: {collidingSantri.name} ({(collidingSantri as any).status || 'Santri/Alumni'})
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nama Lengkap <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nama lengkap beserta gelar (jika ada)"
                      value={name}
                      onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z\s.'’-]/g, ''))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Jenis Kelamin
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as 'L' | 'P')}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-none"
                    >
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Anak Ke
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={25}
                        value={anakKe}
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => e.currentTarget.select()}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value) || 1);
                          setAnakKe(val);
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Jumlah Saudara
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={25}
                        value={dariBersaudara}
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => e.currentTarget.select()}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          setDariBersaudara(val);
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ================= STEP 2: TANGGAL PONDOK ================= */}
              {currentStep === 2 && (
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tanggal Masuk Pondok
                    </label>
                    <p className="text-[11px] text-slate-500 mb-2">
                      Tanggal masuk menjadi acuan generate NIS otomatis (Tahun + 3 digit urutan santri).
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setTempPickerDate(entryDate || new Date().toISOString().split('T')[0]);
                        setActiveDateModal('entry');
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 flex items-center justify-between transition-colors cursor-pointer group"
                    >
                      <span className={entryDate ? 'text-slate-900 font-semibold' : 'text-slate-400 font-normal'}>
                        {entryDate ? formatIndonesianDate(entryDate) : 'Pilih Tanggal Masuk Pondok'}
                      </span>
                      <Calendar className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors shrink-0" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tanggal Keluar / Boyong (Opsional)
                    </label>
                    <p className="text-[11px] text-slate-500 mb-2">
                      Tanggal kelulusan atau peresmian status alumni.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setTempPickerDate(gradDate || new Date().toISOString().split('T')[0]);
                        setActiveDateModal('grad');
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 flex items-center justify-between transition-colors cursor-pointer group"
                    >
                      <span className={gradDate ? 'text-slate-900 font-semibold' : 'text-slate-400 font-normal'}>
                        {gradDate ? formatIndonesianDate(gradDate) : 'Pilih Tanggal Keluar Pondok (Opsional)'}
                      </span>
                      <Calendar className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors shrink-0" />
                    </button>
                  </div>

                  {entryDate && (
                    <div className="p-3 bg-sky-50 border border-sky-200/70 rounded-2xl text-[11px] text-sky-800 flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Estimasi NIS Baru:</span>{' '}
                        {generateNisFromEntryDate(entryDate, existingAlumni) || 'Akan digenerate otomatis'}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ================= STEP 3: KONTAK & DOMISILI ================= */}
              {currentStep === 3 && (
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Nomor WhatsApp
                      </label>
                      <input
                        type="tel"
                        placeholder="08123456789"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Email (Opsional)
                      </label>
                      <input
                        type="email"
                        placeholder="alumni@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Profesi Saat Ini
                      </label>
                      <input
                        type="text"
                        placeholder="Profesi saat ini..."
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Instansi / Lembaga
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Universitas / Yayasan"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Domisili Tempat Tinggal
                    </label>
                    <WilayahAddressFilter
                      province={province}
                      city={city}
                      kecamatan={kecamatan}
                      desa={desa}
                      alamatLengkap={alamatLengkap}
                      coordinates={coordinates}
                      onChange={(vals) => {
                        setProvince(vals.province);
                        setCity(vals.city);
                        setKecamatan(vals.kecamatan);
                        setDesa(vals.desa);
                        if (vals.alamatLengkap !== undefined) setAlamatLengkap(vals.alamatLengkap);
                        if (vals.coordinates !== undefined) setCoordinates(vals.coordinates);
                      }}
                    />
                  </div>
                </div>
              )}

              {/* 4. BOTTOM ACTION BUTTONS */}
              <div className="flex items-center justify-between gap-3 pt-2">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Sebelumnya</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                )}

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={(e) => handleNext(e)}
                    className="ml-auto px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-sky-600/25 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Lanjutkan</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e)}
                    disabled={isSubmitting || !canSubmitStep3}
                    className="ml-auto px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-sky-600/25 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Data Alumni'}</span>
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
      {/* BOTTOM SHEET DATE WHEEL PICKER BERSIH */}
      {activeDateModal && (
        <div
          className="fixed inset-0 z-[100030] bg-black/60 backdrop-blur-2xs flex flex-col justify-end animate-in fade-in duration-200"
          onClick={() => setActiveDateModal(null)}
        >
          <div
            className="w-full bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 p-5 pb-6 flex flex-col animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-4" />
            <h3 className="font-bold text-sm text-slate-900 text-center mb-4">
              {activeDateModal === 'entry' ? 'Pilih Tanggal Masuk Pondok' : 'Pilih Tanggal Keluar Pondok'}
            </h3>

            <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-2.5 mb-4">
              <DateWheelPicker
                value={tempPickerDate || new Date().toISOString().split('T')[0]}
                onChange={(val) => setTempPickerDate(val)}
                minYear={1980}
                maxYear={new Date().getFullYear()}
                maxDate={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveDateModal(null)}
                className="flex-1 py-2.5 text-center text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (activeDateModal === 'entry') {
                    setEntryDate(tempPickerDate);
                  } else {
                    setGradDate(tempPickerDate);
                  }
                  setActiveDateModal(null);
                }}
                className="flex-1 py-2.5 text-center text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl cursor-pointer shadow-xs transition-colors"
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
