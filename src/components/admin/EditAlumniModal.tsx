import React, { useState, useEffect } from 'react';
import { X, Save, Edit, Database } from 'lucide-react';
import { AlumniRecord } from '../../types';
import { WilayahAddressFilter } from '../common/WilayahAddressFilter';
import { LocationCoordinates } from '../common/FullscreenLocationMapModal';

interface EditAlumniModalProps {
  isOpen: boolean;
  alumni: AlumniRecord | null;
  onClose: () => void;
  onSave: (id: string, updated: Partial<AlumniRecord>) => void;
}

export const EditAlumniModal: React.FC<EditAlumniModalProps> = ({
  isOpen,
  alumni,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(alumni?.name || '');
  const [nik, setNik] = useState(alumni?.nik || '');
  const [noKk, setNoKk] = useState(alumni?.noKk || '');
  const [nis, setNis] = useState(alumni?.nis || '');
  const [gender, setGender] = useState<'L' | 'P'>((alumni?.gender as 'L' | 'P') || 'L');
  const [anakKe, setAnakKe] = useState<number>(Number(alumni?.anak_ke ?? alumni?.urutanAnak) || 1);
  const [dariBersaudara, setDariBersaudara] = useState<number>(Number(alumni?.dari_bersaudara ?? alumni?.jumlahSaudara) || 1);
  const [gradYear, setGradYear] = useState(alumni?.gradYear || '');
  const [jenjang, setJenjang] = useState(alumni?.jenjang || '');
  const [asramaDulu, setAsramaDulu] = useState(alumni?.asramaDulu || '');
  const [phone, setPhone] = useState(alumni?.phone || '');
  const [email, setEmail] = useState(alumni?.email || '');
  const [province, setProvince] = useState(alumni?.province || '');
  const [city, setCity] = useState(alumni?.city || '');
  const [kecamatan, setKecamatan] = useState(alumni?.kecamatan || '');
  const [desa, setDesa] = useState(alumni?.desa || '');
  const [alamatLengkap, setAlamatLengkap] = useState(alumni?.alamatLengkap || '');
  const [coordinates, setCoordinates] = useState<LocationCoordinates | null>(alumni?.coordinates || null);
  const [occupation, setOccupation] = useState(alumni?.occupation || '');
  const [institution, setInstitution] = useState(alumni?.institution || '');

  useEffect(() => {
    if (alumni) {
      setName(alumni.name || '');
      setNik(alumni.nik || '');
      setNoKk(alumni.noKk || '');
      setNis(alumni.nis || '');
      setGender((alumni.gender as 'L' | 'P') || 'L');
      setAnakKe(Number(alumni.anak_ke ?? alumni.urutanAnak) || 1);
      setDariBersaudara(Number(alumni.dari_bersaudara ?? alumni.jumlahSaudara) || 1);
      setGradYear(alumni.gradYear || '');
      setJenjang(alumni.jenjang || '');
      setAsramaDulu(alumni.asramaDulu || '');
      setPhone(alumni.phone || '');
      setEmail(alumni.email || '');
      setProvince(alumni.province || '');
      setCity(alumni.city || '');
      setKecamatan(alumni.kecamatan || '');
      setDesa(alumni.desa || '');
      setAlamatLengkap(alumni.alamatLengkap || '');
      setCoordinates(alumni.coordinates || null);
      setOccupation(alumni.occupation || '');
      setInstitution(alumni.institution || '');
    }
  }, [alumni]);

  if (!isOpen || !alumni) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(alumni.id, {
      name,
      nik,
      noKk: noKk || undefined,
      nis,
      gender,
      anak_ke: anakKe,
      dari_bersaudara: dariBersaudara,
      urutanAnak: anakKe,
      jumlahSaudara: dariBersaudara,
      gradYear,
      jenjang,
      asramaDulu,
      phone,
      email,
      province,
      city,
      kecamatan,
      desa,
      alamatLengkap,
      coordinates: coordinates || undefined,
      occupation,
      institution,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit className="w-4 h-4 text-sky-400" />
            <div>
              <h3 className="font-display font-bold text-base">Edit Data Alumni</h3>
              <p className="text-[11px] text-sky-200">Perbarui informasi record alumni</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">NIK (16 Digit)</label>
              <input
                type="text"
                maxLength={16}
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-sky-600 focus:bg-white"
                placeholder="3507xxxxxxxxxxxx"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">No. KK (16 Digit)</label>
              <input
                type="text"
                maxLength={16}
                value={noKk}
                onChange={(e) => setNoKk(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-sky-600 focus:bg-white"
                placeholder="Nomor KK (Opsional)"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-600 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor Induk Santri (NIS)</label>
              <input
                type="text"
                value={nis}
                onChange={(e) => setNis(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-sky-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tahun Lulus (Angkatan)</label>
              <input
                type="text"
                value={gradYear}
                onChange={(e) => setGradYear(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin (gender)</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'L' | 'P')}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-600 focus:bg-white"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Anak Ke- (anak_ke)</label>
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
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Dari Bersaudara (dari_bersaudara)</label>
              <input
                type="number"
                min={anakKe}
                max={25}
                value={dariBersaudara}
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value) || 1);
                  setDariBersaudara(Math.max(val, anakKe));
                }}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Jenjang / Marhalah</label>
              <input
                type="text"
                value={jenjang}
                onChange={(e) => setJenjang(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Asrama Dulu</label>
              <input
                type="text"
                value={asramaDulu}
                onChange={(e) => setAsramaDulu(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-600 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Kamar / Komplek Dulu</label>
            <input
              type="text"
              value={asramaDulu}
              onChange={(e) => setAsramaDulu(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-600 focus:bg-white"
            />
          </div>

          {/* Wilayah & Alamat Domisili */}
          <div className="pt-2 border-t border-slate-100">
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pekerjaan</label>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Instansi</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-sky-600/20"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
