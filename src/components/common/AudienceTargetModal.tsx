import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowLeft, 
  Users, 
  MapPin, 
  Check, 
  ChevronRight, 
  Globe, 
  Sparkles,
  Building,
  Navigation
} from 'lucide-react';
import { AudienceTarget } from '../../types';
import { 
  fetchProvinces, 
  fetchRegencies, 
  fetchDistricts, 
  WilayahItem, 
  formatWilayahName 
} from '../../services/wilayahService';

interface AudienceTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTarget?: AudienceTarget;
  onSave: (target: AudienceTarget) => void;
  title?: string;
}

/**
 * Format string ringkasan target pemirsa untuk ditampilkan di badge atau tombol form
 */
export const formatAudienceSummary = (target?: AudienceTarget): string => {
  if (!target) return 'Semua Alumni';
  
  const genderText = 
    target.gender === 'L' 
      ? 'Ikhwan' 
      : target.gender === 'P' 
      ? 'Akhwat' 
      : 'Semua';

  if (target.regionScope === 'khusus') {
    let regionText = '';
    if (target.districtName) {
      regionText = `Kec. ${formatWilayahName(target.districtName)}`;
    } else if (target.regencyName) {
      regionText = formatWilayahName(target.regencyName);
    } else if (target.provinceName) {
      regionText = `Prov. ${formatWilayahName(target.provinceName)}`;
    } else {
      regionText = 'Wilayah Spesifik';
    }

    if (genderText === 'Semua') {
      return regionText;
    }
    return `${genderText} • ${regionText}`;
  }

  if (genderText === 'Semua') {
    return 'Semua Alumni';
  }
  return `Khusus ${genderText}`;
};

export const AudienceTargetModal: React.FC<AudienceTargetModalProps> = ({
  isOpen,
  onClose,
  initialTarget,
  onSave,
  title = 'Target Pemirsa',
}) => {
  const [gender, setGender] = useState<'semua' | 'L' | 'P'>(initialTarget?.gender || 'semua');
  const [regionScope, setRegionScope] = useState<'semua' | 'khusus'>(initialTarget?.regionScope || 'semua');

  // Provinsi
  const [provinces, setProvinces] = useState<WilayahItem[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>(initialTarget?.provinceId || '');
  const [selectedProvinceName, setSelectedProvinceName] = useState<string>(initialTarget?.provinceName || '');

  // Kabupaten / Kota
  const [regencies, setRegencies] = useState<WilayahItem[]>([]);
  const [selectedRegencyId, setSelectedRegencyId] = useState<string>(initialTarget?.regencyId || '');
  const [selectedRegencyName, setSelectedRegencyName] = useState<string>(initialTarget?.regencyName || '');

  // Kecamatan
  const [districts, setDistricts] = useState<WilayahItem[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(initialTarget?.districtId || '');
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>(initialTarget?.districtName || '');

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingRegencies, setLoadingRegencies] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  // Sync state when initialTarget or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setGender(initialTarget?.gender || 'semua');
      setRegionScope(initialTarget?.regionScope || 'semua');
      setSelectedProvinceId(initialTarget?.provinceId || '');
      setSelectedProvinceName(initialTarget?.provinceName || '');
      setSelectedRegencyId(initialTarget?.regencyId || '');
      setSelectedRegencyName(initialTarget?.regencyName || '');
      setSelectedDistrictId(initialTarget?.districtId || '');
      setSelectedDistrictName(initialTarget?.districtName || '');
    }
  }, [initialTarget, isOpen]);

  // Load provinces on open
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    async function loadProv() {
      setLoadingProvinces(true);
      try {
        const data = await fetchProvinces();
        if (isMounted) {
          setProvinces(data);
        }
      } finally {
        if (isMounted) setLoadingProvinces(false);
      }
    }
    loadProv();
    return () => { isMounted = false; };
  }, [isOpen]);

  // Load regencies when province changes
  useEffect(() => {
    if (!selectedProvinceId) {
      setRegencies([]);
      return;
    }
    let isMounted = true;
    async function loadReg() {
      setLoadingRegencies(true);
      try {
        const data = await fetchRegencies(selectedProvinceId);
        if (isMounted) {
          setRegencies(data);
        }
      } finally {
        if (isMounted) setLoadingRegencies(false);
      }
    }
    loadReg();
    return () => { isMounted = false; };
  }, [selectedProvinceId]);

  // Load districts when regency changes
  useEffect(() => {
    if (!selectedRegencyId) {
      setDistricts([]);
      return;
    }
    let isMounted = true;
    async function loadDist() {
      setLoadingDistricts(true);
      try {
        const data = await fetchDistricts(selectedRegencyId);
        if (isMounted) {
          setDistricts(data);
        }
      } finally {
        if (isMounted) setLoadingDistricts(false);
      }
    }
    loadDist();
    return () => { isMounted = false; };
  }, [selectedRegencyId]);

  if (!isOpen) return null;

  const handleProvinceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provId = e.target.value;
    setSelectedProvinceId(provId);
    const item = provinces.find((p) => p.id === provId);
    setSelectedProvinceName(item ? formatWilayahName(item.name) : '');
    // Reset lower levels
    setSelectedRegencyId('');
    setSelectedRegencyName('');
    setSelectedDistrictId('');
    setSelectedDistrictName('');
  };

  const handleRegencySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const regId = e.target.value;
    setSelectedRegencyId(regId);
    const item = regencies.find((r) => r.id === regId);
    setSelectedRegencyName(item ? formatWilayahName(item.name) : '');
    // Reset lower levels
    setSelectedDistrictId('');
    setSelectedDistrictName('');
  };

  const handleDistrictSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const distId = e.target.value;
    setSelectedDistrictId(distId);
    const item = districts.find((d) => d.id === distId);
    setSelectedDistrictName(item ? formatWilayahName(item.name) : '');
  };

  const handleSave = () => {
    const result: AudienceTarget = {
      gender,
      regionScope,
      ...(regionScope === 'khusus' ? {
        provinceId: selectedProvinceId || undefined,
        provinceName: selectedProvinceName || undefined,
        regencyId: selectedRegencyId || undefined,
        regencyName: selectedRegencyName || undefined,
        districtId: selectedDistrictId || undefined,
        districtName: selectedDistrictName || undefined,
      } : {})
    };
    onSave(result);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100065] bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-1 -ml-1 text-slate-500 hover:text-slate-800 cursor-pointer rounded-full hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h3 className="font-display font-bold text-base text-slate-900 leading-tight">
                {title}
              </h3>
              <p className="text-[11px] text-slate-400">
                Atur siapa saja alumni yang dapat melihat ini
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 rounded-full bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            Terapkan
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-700">
          {/* 1. Pengaturan Gender (Jenis Kelamin) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-600" />
              <label className="font-bold text-slate-800 text-xs">
                Jenis Kelamin (Gender)
              </label>
            </div>
            <p className="text-[11px] text-slate-400">
              Pilih apakah kiriman ini ditujukan untuk semua atau khusus santri putra/putri
            </p>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setGender('semua')}
                className={`py-2.5 px-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  gender === 'semua'
                    ? 'border-sky-500 bg-sky-50/80 text-sky-700 font-bold shadow-2xs ring-1 ring-sky-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-medium'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <span>Semua</span>
                  {gender === 'semua' && <Check className="w-3.5 h-3.5 text-sky-600" />}
                </div>
                <span className="text-[10px] text-slate-400 block font-normal">
                  Ikhwan & Akhwat
                </span>
              </button>

              <button
                type="button"
                onClick={() => setGender('L')}
                className={`py-2.5 px-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  gender === 'L'
                    ? 'border-sky-500 bg-sky-50/80 text-sky-700 font-bold shadow-2xs ring-1 ring-sky-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-medium'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <span>Ikhwan</span>
                  {gender === 'L' && <Check className="w-3.5 h-3.5 text-sky-600" />}
                </div>
                <span className="text-[10px] text-slate-400 block font-normal">
                  Khusus Laki-laki
                </span>
              </button>

              <button
                type="button"
                onClick={() => setGender('P')}
                className={`py-2.5 px-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  gender === 'P'
                    ? 'border-sky-500 bg-sky-50/80 text-sky-700 font-bold shadow-2xs ring-1 ring-sky-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-medium'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <span>Akhwat</span>
                  {gender === 'P' && <Check className="w-3.5 h-3.5 text-sky-600" />}
                </div>
                <span className="text-[10px] text-slate-400 block font-normal">
                  Khusus Perempuan
                </span>
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* 2. Pengaturan Daerah / Jangkauan Wilayah */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <label className="font-bold text-slate-800 text-xs">
                Jangkauan Wilayah
              </label>
            </div>
            <p className="text-[11px] text-slate-400">
              Pilih jangkauan wilayah alumni yang menjadi target penerima
            </p>

            {/* Pilihan Cakupan: Semua Wilayah vs Spesifik Wilayah */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRegionScope('semua')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  regionScope === 'semua'
                    ? 'border-emerald-500 bg-emerald-50/80 text-emerald-800 font-bold shadow-2xs ring-1 ring-emerald-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-medium'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs">Semua Wilayah</span>
                  </div>
                  {regionScope === 'semua' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <p className="text-[10px] text-slate-400 font-normal">
                  Seluruh alumni nasional & luar negeri
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRegionScope('khusus')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  regionScope === 'khusus'
                    ? 'border-emerald-500 bg-emerald-50/80 text-emerald-800 font-bold shadow-2xs ring-1 ring-emerald-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-medium'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs">Wilayah Tertentu</span>
                  </div>
                  {regionScope === 'khusus' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <p className="text-[10px] text-slate-400 font-normal">
                  Provinsi, Kabupaten, atau Kecamatan
                </p>
              </button>
            </div>

            {/* Jika Wilayah Spesifik Dipilih: Hirarki Provinsi -> Kabupaten -> Kecamatan */}
            {regionScope === 'khusus' && (
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/90 space-y-3 mt-2 animate-in fade-in duration-150">
                {/* 1. Pilih Provinsi */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <span>1. Pilih Provinsi</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    {loadingProvinces && (
                      <span className="text-[10px] text-slate-400 animate-pulse">Memuat...</span>
                    )}
                  </div>
                  <select
                    value={selectedProvinceId}
                    onChange={handleProvinceSelect}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Pilih Provinsi Target --</option>
                    {provinces.map((prov) => (
                      <option key={prov.id} value={prov.id}>
                        {formatWilayahName(prov.name)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Pilih Kabupaten / Kota */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <span>2. Kabupaten / Kota</span>
                      <span className="text-[10px] font-normal text-slate-400">(Opsional)</span>
                    </label>
                    {loadingRegencies && (
                      <span className="text-[10px] text-slate-400 animate-pulse">Memuat...</span>
                    )}
                  </div>
                  <select
                    value={selectedRegencyId}
                    onChange={handleRegencySelect}
                    disabled={!selectedProvinceId}
                    className={`w-full px-3 py-2 bg-white border rounded-xl text-xs font-semibold transition-colors ${
                      !selectedProvinceId
                        ? 'border-slate-100 bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500'
                    }`}
                  >
                    <option value="">
                      {!selectedProvinceId 
                        ? 'Pilih provinsi terlebih dahulu' 
                        : selectedProvinceName 
                        ? `-- Semua Kabupaten/Kota di ${selectedProvinceName} --` 
                        : '-- Semua Kabupaten/Kota --'}
                    </option>
                    {regencies.map((reg) => (
                      <option key={reg.id} value={reg.id}>
                        {formatWilayahName(reg.name)}
                      </option>
                    ))}
                  </select>
                  {selectedProvinceId && !selectedRegencyId && (
                    <p className="text-[10px] text-emerald-600 mt-1">
                      ✓ Berlaku untuk seluruh kabupaten/kota di {selectedProvinceName}
                    </p>
                  )}
                </div>

                {/* 3. Pilih Kecamatan */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <span>3. Kecamatan Tertentu</span>
                      <span className="text-[10px] font-normal text-slate-400">(Opsional)</span>
                    </label>
                    {loadingDistricts && (
                      <span className="text-[10px] text-slate-400 animate-pulse">Memuat...</span>
                    )}
                  </div>
                  <select
                    value={selectedDistrictId}
                    onChange={handleDistrictSelect}
                    disabled={!selectedRegencyId}
                    className={`w-full px-3 py-2 bg-white border rounded-xl text-xs font-semibold transition-colors ${
                      !selectedRegencyId
                        ? 'border-slate-100 bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500'
                    }`}
                  >
                    <option value="">
                      {!selectedRegencyId 
                        ? 'Pilih kabupaten terlebih dahulu' 
                        : selectedRegencyName 
                        ? `-- Semua Kecamatan di ${selectedRegencyName} --` 
                        : '-- Semua Kecamatan --'}
                    </option>
                    {districts.map((dist) => (
                      <option key={dist.id} value={dist.id}>
                        Kec. {formatWilayahName(dist.name)}
                      </option>
                    ))}
                  </select>
                  {selectedRegencyId && !selectedDistrictId && (
                    <p className="text-[10px] text-emerald-600 mt-1">
                      ✓ Berlaku untuk seluruh kecamatan di {selectedRegencyName}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 3. Ringkasan Target (Preview) */}
          <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-sky-800 font-bold text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>Ringkasan Target Pemirsa:</span>
            </div>
            <p className="text-xs font-semibold text-slate-800">
              {formatAudienceSummary({
                gender,
                regionScope,
                provinceId: selectedProvinceId,
                provinceName: selectedProvinceName,
                regencyId: selectedRegencyId,
                regencyName: selectedRegencyName,
                districtId: selectedDistrictId,
                districtName: selectedDistrictName,
              })}
            </p>
            <p className="text-[10px] text-slate-500">
              {regionScope === 'khusus' && selectedProvinceName
                ? `Hanya alumni dengan domisili di ${[
                    selectedDistrictName ? `Kec. ${selectedDistrictName}` : '',
                    selectedRegencyName,
                    selectedProvinceName
                  ].filter(Boolean).join(', ')}${gender !== 'semua' ? ` berjenis kelamin ${gender === 'L' ? 'Ikhwan' : 'Akhwat'}` : ''} yang dapat melihat informasi ini.`
                : gender !== 'semua'
                ? `Hanya santri/alumni ${gender === 'L' ? 'Ikhwan (Laki-laki)' : 'Akhwat (Perempuan)'} di seluruh wilayah yang dapat melihat informasi ini.`
                : 'Dapat dilihat oleh seluruh alumni (Ikhwan & Akhwat) dari seluruh wilayah nasional.'}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200/60 font-semibold text-xs cursor-pointer transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            Terapkan Target
          </button>
        </div>
      </div>
    </div>
  );
};
