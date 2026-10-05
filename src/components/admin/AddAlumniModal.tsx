import React, { useState } from 'react';
import { 
  X, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  CheckCircle2, 
  AlertCircle,
  User,
  GraduationCap,
  MapPin
} from 'lucide-react';
import { AlumniRecord } from '../../types';
import { WilayahAddressFilter } from '../common/WilayahAddressFilter';
import { LocationCoordinates } from '../common/FullscreenLocationMapModal';

interface AddAlumniModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newAlumni: AlumniRecord) => void;
}

export const AddAlumniModal: React.FC<AddAlumniModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form State - Step 1: Identitas
  const [nik, setNik] = useState('');
  const [nis, setNis] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [anakKe, setAnakKe] = useState<number>(1);
  const [dariBersaudara, setDariBersaudara] = useState<number>(1);

  // Form State - Step 2: Pendidikan Pondok
  const [gradYear, setGradYear] = useState('2024');
  const [entryYear, setEntryYear] = useState('2018');
  const [jenjang, setJenjang] = useState('Madrasah Aliyah Keagamaan (MAK)');
  const [asramaDulu, setAsramaDulu] = useState('Komplek Al-Ghazali');

  // Form State - Step 3: Kontak & Domisili
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Malang');
  const [province, setProvince] = useState('Jawa Timur');
  const [kecamatan, setKecamatan] = useState('');
  const [desa, setDesa] = useState('');
  const [alamatLengkap, setAlamatLengkap] = useState('');
  const [coordinates, setCoordinates] = useState<LocationCoordinates | null>(null);
  const [occupation, setOccupation] = useState('');
  const [institution, setInstitution] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNext = () => {
    setError(null);

    if (currentStep === 1) {
      if (!nik || nik.length < 10) {
        setError('Masukkan NIK yang valid (minimal 10 digit angka).');
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
      if (!jenjang.trim()) {
        setError('Jenjang pendidikan pondok wajib diisi.');
        return;
      }
      setCurrentStep(3);
      return;
    }
  };

  const handlePrev = () => {
    setError(null);
    if (currentStep === 2) setCurrentStep(1);
    if (currentStep === 3) setCurrentStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    setIsSubmitting(true);
    const generatedNis = nis.trim() || `TRQ-${gradYear}-${Math.floor(100 + Math.random() * 900)}`;

    const newRecord: AlumniRecord = {
      id: 'alm-man-' + Date.now(),
      nik: nik.trim(),
      nis: generatedNis,
      name: name.trim(),
      username: '',
      gender,
      anak_ke: anakKe,
      dari_bersaudara: dariBersaudara,
      urutanAnak: anakKe,
      jumlahSaudara: dariBersaudara,
      gradYear,
      entryYear,
      jenjang: jenjang.trim(),
      asramaDulu: asramaDulu.trim() || 'Komplek Utama',
      email: email.trim() || `${name.toLowerCase().replace(/[^a-z]/g, '')}@alumni.attaroqqy.id`,
      phone: phone.trim() || '08123456789',
      city: city.trim(),
      province: province.trim(),
      kecamatan: kecamatan.trim() || undefined,
      desa: desa.trim() || undefined,
      alamatLengkap: alamatLengkap.trim() || undefined,
      coordinates: coordinates || undefined,
      occupation: occupation.trim() || 'Alumni At-taroqqy',
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
      }, 1000);
    }, 600);
  };

  const steps = [
    { num: 1, title: 'Identitas Diri', icon: User },
    { num: 2, title: 'Riwayat Pondok', icon: GraduationCap },
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
          <p className="text-[11px] text-slate-500 font-medium">
            Langkah {currentStep} dari 3: {steps[currentStep - 1].title}
          </p>
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
            <form onSubmit={currentStep === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-5">
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
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="Masukkan 16 digit NIK"
                      value={nik}
                      onChange={(e) => setNik(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-none"
                    />
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
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
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

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        NIS (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="Otomatis jika kosong"
                        value={nis}
                        onChange={(e) => setNis(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Anak Ke-
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={25}
                        value={anakKe}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value) || 1);
                          setAnakKe(val);
                          if (val > dariBersaudara) {
                            setDariBersaudara(val);
                          }
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Dari Bersaudara
                      </label>
                      <input
                        type="number"
                        min={anakKe}
                        max={25}
                        value={dariBersaudara}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value) || 1);
                          setDariBersaudara(Math.max(val, anakKe));
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ================= STEP 2: RIWAYAT PONDOK ================= */}
              {currentStep === 2 && (
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Tahun Masuk
                      </label>
                      <select
                        value={entryYear}
                        onChange={(e) => setEntryYear(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-none"
                      >
                        {Array.from({ length: 40 }, (_, i) => 2026 - i).map((yr) => (
                          <option key={yr} value={yr.toString()}>
                            {yr}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Tahun Lulus (Angkatan)
                      </label>
                      <select
                        value={gradYear}
                        onChange={(e) => setGradYear(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-none"
                      >
                        {Array.from({ length: 35 }, (_, i) => 2026 - i).map((yr) => (
                          <option key={yr} value={yr.toString()}>
                            {yr}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Jenjang / Marhalah
                    </label>
                    <select
                      value={jenjang}
                      onChange={(e) => setJenjang(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-none"
                    >
                      <option value="Madrasah Aliyah Keagamaan (MAK)">Madrasah Aliyah Keagamaan (MAK)</option>
                      <option value="Madrasah Aliyah (MA)">Madrasah Aliyah (MA)</option>
                      <option value="Madrasah Tsanawiyah (MTs)">Madrasah Tsanawiyah (MTs)</option>
                      <option value="Kuliyyatul Muallimin (KMI)">Kuliyyatul Muallimin (KMI)</option>
                      <option value="Tahfidzul Qur'an">Tahfidzul Qur'an</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Asrama / Kamar Dulu
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Komplek Al-Ghazali / Khodijah"
                      value={asramaDulu}
                      onChange={(e) => setAsramaDulu(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-none"
                    />
                  </div>
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
                        placeholder="Contoh: 081234567890"
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
                        placeholder="email@alumni.id"
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
                        placeholder="Contoh: Pengajar / Wirausaha"
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
                    onClick={handleNext}
                    className="ml-auto px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-sky-600/25 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Lanjutkan</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="ml-auto px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-sky-600/25 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
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
    </div>
  );
};
