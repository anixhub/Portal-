import React, { useState } from 'react';
import { X, PlusCircle, Database, CheckCircle2, AlertCircle } from 'lucide-react';
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
  const [nik, setNik] = useState('');
  const [nis, setNis] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [gradYear, setGradYear] = useState('2024');
  const [entryYear, setEntryYear] = useState('2018');
  const [jenjang, setJenjang] = useState("Madrasah Aliyah Keagamaan (MAK)");
  const [asramaDulu, setAsramaDulu] = useState('Komplek Al-Ghazali');
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
  const [bio, setBio] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nik || nik.length < 10) {
      setError('Harap masukkan NIK yang valid (minimal 10 digit, standar 16 digit).');
      return;
    }

    if (!name.trim()) {
      setError('Nama lengkap alumni wajib diisi.');
      return;
    }

    setIsSubmitting(true);

    const generatedNis = nis.trim() || `TRQ-${gradYear}-${Math.floor(100 + Math.random() * 900)}`;

    const newRecord: AlumniRecord = {
      id: 'alm-man-' + Date.now(),
      nik: nik.trim(),
      nis: generatedNis,
      name: name.trim(),
      username: '',
      gender: gender,
      gradYear: gradYear,
      entryYear: entryYear,
      jenjang: jenjang,
      asramaDulu: asramaDulu,
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
      password: '1234', // default password for alumni
      isPasswordChanged: false,
      source: 'manual_admin',
      syncTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      bio: bio.trim(),
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
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-600 flex items-center justify-center">
              <PlusCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base">Tambah Data Alumni Baru</h3>
              <p className="text-[11px] text-sky-200">
                Pencatatan alumni yang belum ada di database lama santri
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {isSuccess ? (
            <div className="py-10 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-lg text-slate-900">Data Alumni Berhasil Disimpan!</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Data <strong>{name}</strong> telah berhasil ditambahkan. Alumni dapat langsung login menggunakan NIK dan kata sandi default <code className="bg-slate-100 px-1 py-0.5 rounded font-bold">1234</code>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* SECTION 1: IDENTITAS POKOK */}
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 text-sky-700 border-b pb-1">
                  1. Data Identitas Pokok
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      NIK KTP (16 Digit) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 3507123456780007"
                      value={nik}
                      onChange={(e) => setNik(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400">Digunakan alumni untuk login pertama kali.</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nomor Induk Santri (NIS)
                    </label>
                    <input
                      type="text"
                      placeholder="Otomatis digenerate jika kosong"
                      value={nis}
                      onChange={(e) => setNis(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: K.H. Muhammad Zainuddin, Lc., M.A."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as 'L' | 'P')}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-none"
                    >
                      <option value="L">Laki-laki (Santriwan)</option>
                      <option value="P">Perempuan (Santriwati)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Kata Sandi Awal Default
                    </label>
                    <input
                      type="text"
                      disabled
                      value="1234 (Standar Sistem)"
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: RIWAYAT PONDOK PESANTREN */}
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 text-sky-700 border-b pb-1">
                  2. Riwayat Masa Pendidikan Pondok
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tahun Kelulusan (Angkatan)</label>
                    <select
                      value={gradYear}
                      onChange={(e) => setGradYear(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-none"
                    >
                      {Array.from({ length: 35 }, (_, i) => 2026 - i).map((yr) => (
                        <option key={yr} value={yr.toString()}>
                          Lulus Angkatan {yr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tahun Masuk Pondok</label>
                    <select
                      value={entryYear}
                      onChange={(e) => setEntryYear(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-none"
                    >
                      {Array.from({ length: 40 }, (_, i) => 2026 - i).map((yr) => (
                        <option key={yr} value={yr.toString()}>
                          Masuk Tahun {yr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Jenjang / Marhalah</label>
                    <input
                      type="text"
                      value={jenjang}
                      onChange={(e) => setJenjang(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Kamar / Komplek Dulu</label>
                    <input
                      type="text"
                      placeholder="Contoh: Komplek Al-Ghazali Lt. 2"
                      value={asramaDulu}
                      onChange={(e) => setAsramaDulu(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: KONTAK & DOMISILI TERKINI */}
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 text-sky-700 border-b pb-1">
                  3. Kontak & Domisili Terkini
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nomor WhatsApp</label>
                    <input
                      type="tel"
                      placeholder="08123456789"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 pt-2 border-t border-slate-100">
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

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Profesi / Pekerjaan Saat Ini</label>
                    <input
                      type="text"
                      placeholder="Contoh: Pengajar / Wirausaha"
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Instansi / Lembaga</label>
                    <input
                      type="text"
                      placeholder="Contoh: UIN Malang / Ponpes Cabang"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs shadow-md shadow-sky-600/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Menyimpan Data...' : 'Simpan Data Alumni'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
