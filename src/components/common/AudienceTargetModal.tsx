import React, { useState, useEffect } from 'react';
import { AudienceTarget } from '../../types';
import { 
  fetchProvinces, 
  fetchRegencies, 
  fetchDistricts, 
  fetchVillages,
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
 * Format string ringkasan jangkauan wilayah.
 * Jika tidak diatur, secara default ditulis 'Umum'.
 */
export const formatAudienceSummary = (target?: AudienceTarget): string => {
  if (!target || target.regionScope === 'semua') return 'Umum';
  
  if (target.villageName) {
    return `Desa ${formatWilayahName(target.villageName)}`;
  }
  if (target.districtName) {
    return `Kec. ${formatWilayahName(target.districtName)}`;
  }
  if (target.regencyName) {
    return formatWilayahName(target.regencyName);
  }
  if (target.provinceName) {
    return `Prov. ${formatWilayahName(target.provinceName)}`;
  }
  return 'Umum';
};

/**
 * Bottom Sheet Pengatur Jangkauan
 * Tampilan bersih minimalis tanpa judul dan tanpa keterangan tidak perlu.
 * Tersusun vertikal dari Provinsi, Kabupaten, Kecamatan, Desa, dan Tombol Terapkan.
 */
export const AudienceTargetModal: React.FC<AudienceTargetModalProps> = ({
  isOpen,
  onClose,
  initialTarget,
  onSave,
}) => {
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

  // Desa / Kelurahan
  const [villages, setVillages] = useState<WilayahItem[]>([]);
  const [selectedVillageId, setSelectedVillageId] = useState<string>(initialTarget?.villageId || '');
  const [selectedVillageName, setSelectedVillageName] = useState<string>(initialTarget?.villageName || '');

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingRegencies, setLoadingRegencies] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  // Sync state saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setSelectedProvinceId(initialTarget?.provinceId || '');
      setSelectedProvinceName(initialTarget?.provinceName || '');
      setSelectedRegencyId(initialTarget?.regencyId || '');
      setSelectedRegencyName(initialTarget?.regencyName || '');
      setSelectedDistrictId(initialTarget?.districtId || '');
      setSelectedDistrictName(initialTarget?.districtName || '');
      setSelectedVillageId(initialTarget?.villageId || '');
      setSelectedVillageName(initialTarget?.villageName || '');
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

  // Load regencies saat provinsi berubah
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

  // Load districts saat kabupaten berubah
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

  // Load villages saat kecamatan berubah
  useEffect(() => {
    if (!selectedDistrictId) {
      setVillages([]);
      return;
    }
    let isMounted = true;
    async function loadVill() {
      setLoadingVillages(true);
      try {
        const data = await fetchVillages(selectedDistrictId);
        if (isMounted) {
          setVillages(data);
        }
      } finally {
        if (isMounted) setLoadingVillages(false);
      }
    }
    loadVill();
    return () => { isMounted = false; };
  }, [selectedDistrictId]);

  if (!isOpen) return null;

  const handleProvinceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provId = e.target.value;
    setSelectedProvinceId(provId);
    const item = provinces.find((p) => p.id === provId);
    setSelectedProvinceName(item ? formatWilayahName(item.name) : '');
    // Reset tingkat di bawahnya
    setSelectedRegencyId('');
    setSelectedRegencyName('');
    setSelectedDistrictId('');
    setSelectedDistrictName('');
    setSelectedVillageId('');
    setSelectedVillageName('');
  };

  const handleRegencySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const regId = e.target.value;
    setSelectedRegencyId(regId);
    const item = regencies.find((r) => r.id === regId);
    setSelectedRegencyName(item ? formatWilayahName(item.name) : '');
    // Reset tingkat di bawahnya
    setSelectedDistrictId('');
    setSelectedDistrictName('');
    setSelectedVillageId('');
    setSelectedVillageName('');
  };

  const handleDistrictSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const distId = e.target.value;
    setSelectedDistrictId(distId);
    const item = districts.find((d) => d.id === distId);
    setSelectedDistrictName(item ? formatWilayahName(item.name) : '');
    // Reset desa
    setSelectedVillageId('');
    setSelectedVillageName('');
  };

  const handleVillageSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const villId = e.target.value;
    setSelectedVillageId(villId);
    const item = villages.find((v) => v.id === villId);
    setSelectedVillageName(item ? formatWilayahName(item.name) : '');
  };

  const handleSave = () => {
    if (!selectedProvinceId) {
      onSave({
        regionScope: 'semua',
      });
    } else {
      onSave({
        regionScope: 'khusus',
        provinceId: selectedProvinceId || undefined,
        provinceName: selectedProvinceName || undefined,
        regencyId: selectedRegencyId || undefined,
        regencyName: selectedRegencyName || undefined,
        districtId: selectedDistrictId || undefined,
        districtName: selectedDistrictName || undefined,
        villageId: selectedVillageId || undefined,
        villageName: selectedVillageName || undefined,
      });
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[100065] bg-black/50 backdrop-blur-2xs flex items-end justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-lg rounded-t-3xl shadow-2xl p-5 pb-6 space-y-3.5 animate-in slide-in-from-bottom duration-200 border-t border-slate-200/80"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle Bar Drag di Bagian Atas */}
        <div 
          onClick={onClose}
          className="w-12 h-1.5 bg-slate-300 hover:bg-slate-400 rounded-full mx-auto cursor-pointer transition-colors" 
        />

        {/* Kotak-kotak Wilayah Tersusun Vertikal Bersih */}
        <div className="space-y-2.5 pt-1">
          {/* Kotak 1: Provinsi */}
          <div className="relative">
            <select
              value={selectedProvinceId}
              onChange={handleProvinceSelect}
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all cursor-pointer"
            >
              <option value="">Provinsi (Umum)</option>
              {provinces.map((prov) => (
                <option key={prov.id} value={prov.id}>
                  {formatWilayahName(prov.name)}
                </option>
              ))}
            </select>
            {loadingProvinces && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none animate-pulse">
                Memuat...
              </span>
            )}
          </div>

          {/* Kotak 2: Kabupaten / Kota */}
          <div className="relative">
            <select
              value={selectedRegencyId}
              onChange={handleRegencySelect}
              disabled={!selectedProvinceId}
              className={`w-full px-4 py-3 border rounded-2xl text-xs font-semibold transition-all ${
                !selectedProvinceId
                  ? 'border-slate-100 bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white cursor-pointer'
              }`}
            >
              <option value="">
                {!selectedProvinceId 
                  ? 'Kabupaten / Kota' 
                  : selectedProvinceName 
                  ? `Semua Kabupaten / Kota (${selectedProvinceName})` 
                  : 'Semua Kabupaten / Kota'}
              </option>
              {regencies.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {formatWilayahName(reg.name)}
                </option>
              ))}
            </select>
            {loadingRegencies && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none animate-pulse">
                Memuat...
              </span>
            )}
          </div>

          {/* Kotak 3: Kecamatan */}
          <div className="relative">
            <select
              value={selectedDistrictId}
              onChange={handleDistrictSelect}
              disabled={!selectedRegencyId}
              className={`w-full px-4 py-3 border rounded-2xl text-xs font-semibold transition-all ${
                !selectedRegencyId
                  ? 'border-slate-100 bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white cursor-pointer'
              }`}
            >
              <option value="">
                {!selectedRegencyId 
                  ? 'Kecamatan' 
                  : selectedRegencyName 
                  ? `Semua Kecamatan (${selectedRegencyName})` 
                  : 'Semua Kecamatan'}
              </option>
              {districts.map((dist) => (
                <option key={dist.id} value={dist.id}>
                  Kec. {formatWilayahName(dist.name)}
                </option>
              ))}
            </select>
            {loadingDistricts && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none animate-pulse">
                Memuat...
              </span>
            )}
          </div>

          {/* Kotak 4: Desa / Kelurahan */}
          <div className="relative">
            <select
              value={selectedVillageId}
              onChange={handleVillageSelect}
              disabled={!selectedDistrictId}
              className={`w-full px-4 py-3 border rounded-2xl text-xs font-semibold transition-all ${
                !selectedDistrictId
                  ? 'border-slate-100 bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white cursor-pointer'
              }`}
            >
              <option value="">
                {!selectedDistrictId 
                  ? 'Desa / Kelurahan' 
                  : selectedDistrictName 
                  ? `Semua Desa (${selectedDistrictName})` 
                  : 'Semua Desa / Kelurahan'}
              </option>
              {villages.map((vill) => (
                <option key={vill.id} value={vill.id}>
                  {formatWilayahName(vill.name)}
                </option>
              ))}
            </select>
            {loadingVillages && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none animate-pulse">
                Memuat...
              </span>
            )}
          </div>
        </div>

        {/* Tombol Terapkan */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xs transition-all cursor-pointer text-center"
          >
            Terapkan
          </button>
        </div>
      </div>
    </div>
  );
};
