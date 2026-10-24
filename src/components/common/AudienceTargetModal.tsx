import React, { useState, useEffect } from 'react';
import { AudienceTarget, AdminUser, AdminRegionLevel } from '../../types';
import { 
  fetchProvinces, 
  fetchRegencies, 
  fetchDistricts, 
  fetchVillages,
  WilayahItem, 
  formatWilayahName 
} from '../../services/wilayahService';
import { Globe, Lock, ShieldAlert, Check, MapPin, ChevronDown } from 'lucide-react';

export interface AudienceTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTarget?: AudienceTarget;
  onSave: (target: AudienceTarget) => void;
  title?: string;
  admin?: AdminUser | null;
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

type ScopeLevelType = 'umum' | 'provinsi' | 'kota' | 'kecamatan' | 'desa';

const LEVEL_RANK: Record<string, number> = {
  umum: 0,
  pusat: 0,
  provinsi: 1,
  kota: 2,
  kabupaten: 2,
  kecamatan: 3,
  desa: 4,
};

/**
 * Bottom Sheet Pengatur Jangkauan
 * Dropdown paling atas adalah Umum / Publik (default Admin Pusat).
 * Untuk admin daerah, default jangkauannya sesuai daerah dia dan tidak bisa memilih tingkat di atas daerahnya.
 * Urutan dropdown: Umum, Provinsi, Kabupaten/Kota, Kecamatan, Desa.
 */
export const AudienceTargetModal: React.FC<AudienceTargetModalProps> = ({
  isOpen,
  onClose,
  initialTarget,
  onSave,
  admin,
}) => {
  // Cek kewenangan admin: pusat vs daerah
  const activeAdmin: AdminUser | null = admin || (() => {
    try {
      const raw = localStorage.getItem('attaroqqy_active_session_v1');
      if (raw) {
        const sess = JSON.parse(raw);
        if (sess.role === 'admin' && sess.adminData) return sess.adminData;
      }
    } catch (e) {}
    return null;
  })();

  const isPusat = !activeAdmin || 
    activeAdmin.regionLevel === 'pusat' || 
    activeAdmin.role === 'super_admin' || 
    activeAdmin.username === '@admin_pusat';

  const adminLevel: AdminRegionLevel = activeAdmin?.regionLevel || (isPusat ? 'pusat' : 'provinsi');
  const adminRank = LEVEL_RANK[adminLevel] ?? (isPusat ? 0 : 1);

  // Fungsi pengecekan apakah admin diizinkan memilih tingkat tertentu
  // Admin daerah TIDAK BISA memilih tingkat di atas daerahnya (targetRank < adminRank)
  const canSelectLevel = (level: ScopeLevelType): boolean => {
    if (isPusat) return true;
    const targetRank = LEVEL_RANK[level] ?? 0;
    return targetRank >= adminRank;
  };

  // Tentukan default level
  const getDefaultLevel = (): ScopeLevelType => {
    if (initialTarget && initialTarget.regionScope === 'khusus') {
      if (initialTarget.villageName) return 'desa';
      if (initialTarget.districtName) return 'kecamatan';
      if (initialTarget.regencyName) return 'kota';
      if (initialTarget.provinceName) return 'provinsi';
    }
    if (isPusat) return 'umum';
    if (adminLevel === 'desa') return 'desa';
    if (adminLevel === 'kecamatan') return 'kecamatan';
    if (adminLevel === 'kota') return 'kota';
    if (adminLevel === 'provinsi') return 'provinsi';
    return 'provinsi';
  };

  const [selectedLevel, setSelectedLevel] = useState<ScopeLevelType>(getDefaultLevel);

  // Provinsi
  const [provinces, setProvinces] = useState<WilayahItem[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>(initialTarget?.provinceId || '');
  const [selectedProvinceName, setSelectedProvinceName] = useState<string>(initialTarget?.provinceName || activeAdmin?.province || '');

  // Kabupaten / Kota
  const [regencies, setRegencies] = useState<WilayahItem[]>([]);
  const [selectedRegencyId, setSelectedRegencyId] = useState<string>(initialTarget?.regencyId || '');
  const [selectedRegencyName, setSelectedRegencyName] = useState<string>(initialTarget?.regencyName || (adminRank >= 2 ? activeAdmin?.city || '' : ''));

  // Kecamatan
  const [districts, setDistricts] = useState<WilayahItem[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(initialTarget?.districtId || '');
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>(initialTarget?.districtName || (adminRank >= 3 ? activeAdmin?.kecamatan || '' : ''));

  // Desa / Kelurahan
  const [villages, setVillages] = useState<WilayahItem[]>([]);
  const [selectedVillageId, setSelectedVillageId] = useState<string>(initialTarget?.villageId || '');
  const [selectedVillageName, setSelectedVillageName] = useState<string>(initialTarget?.villageName || (adminRank >= 4 ? activeAdmin?.desa || '' : ''));

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingRegencies, setLoadingRegencies] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  // Sync state saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      const defLevel = getDefaultLevel();
      // Pastikan jika admin daerah, level tidak pernah di atas wewenangnya
      const validLevel = canSelectLevel(defLevel) ? defLevel : (adminLevel === 'kota' ? 'kota' : adminLevel === 'kecamatan' ? 'kecamatan' : 'provinsi');
      setSelectedLevel(validLevel);

      // Pre-set data wilayah jika admin daerah
      const initProvName = initialTarget?.provinceName || (!isPusat ? activeAdmin?.province || '' : '');
      const initCityName = initialTarget?.regencyName || (adminRank >= 2 ? activeAdmin?.city || '' : '');
      const initKecName = initialTarget?.districtName || (adminRank >= 3 ? activeAdmin?.kecamatan || '' : '');
      const initDesaName = initialTarget?.villageName || (adminRank >= 4 ? activeAdmin?.desa || '' : '');

      setSelectedProvinceId(initialTarget?.provinceId || '');
      setSelectedProvinceName(initProvName);
      setSelectedRegencyId(initialTarget?.regencyId || '');
      setSelectedRegencyName(initCityName);
      setSelectedDistrictId(initialTarget?.districtId || '');
      setSelectedDistrictName(initKecName);
      setSelectedVillageId(initialTarget?.villageId || '');
      setSelectedVillageName(initDesaName);
    }
  }, [initialTarget, isOpen, activeAdmin]);

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
          // Jika ada nama provinsi tapi belum ada ID, cari ID-nya
          if (selectedProvinceName && !selectedProvinceId) {
            const found = data.find(
              (p) => p.name.toLowerCase() === selectedProvinceName.toLowerCase() ||
                     selectedProvinceName.toLowerCase().includes(p.name.toLowerCase()) ||
                     p.name.toLowerCase().includes(selectedProvinceName.toLowerCase())
            );
            if (found) setSelectedProvinceId(found.id);
          }
        }
      } finally {
        if (isMounted) setLoadingProvinces(false);
      }
    }
    loadProv();
    return () => { isMounted = false; };
  }, [isOpen, selectedProvinceName]);

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
          if (selectedRegencyName && !selectedRegencyId) {
            const cleanTarget = selectedRegencyName.toLowerCase().replace(/^(kabupaten|kab\.|kota)\s+/i, '');
            const found = data.find(
              (r) => r.name.toLowerCase().includes(cleanTarget) || cleanTarget.includes(r.name.toLowerCase())
            );
            if (found) setSelectedRegencyId(found.id);
          }
        }
      } finally {
        if (isMounted) setLoadingRegencies(false);
      }
    }
    loadReg();
    return () => { isMounted = false; };
  }, [selectedProvinceId, selectedRegencyName]);

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
          if (selectedDistrictName && !selectedDistrictId) {
            const cleanTarget = selectedDistrictName.toLowerCase().replace(/^(kecamatan|kec\.)\s+/i, '');
            const found = data.find(
              (d) => d.name.toLowerCase().includes(cleanTarget) || cleanTarget.includes(d.name.toLowerCase())
            );
            if (found) setSelectedDistrictId(found.id);
          }
        }
      } finally {
        if (isMounted) setLoadingDistricts(false);
      }
    }
    loadDist();
    return () => { isMounted = false; };
  }, [selectedRegencyId, selectedDistrictName]);

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
          if (selectedVillageName && !selectedVillageId) {
            const cleanTarget = selectedVillageName.toLowerCase().replace(/^(desa|kelurahan)\s+/i, '');
            const found = data.find(
              (v) => v.name.toLowerCase().includes(cleanTarget) || cleanTarget.includes(v.name.toLowerCase())
            );
            if (found) setSelectedVillageId(found.id);
          }
        }
      } finally {
        if (isMounted) setLoadingVillages(false);
      }
    }
    loadVill();
    return () => { isMounted = false; };
  }, [selectedDistrictId, selectedVillageName]);

  if (!isOpen) return null;

  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLvl = e.target.value as ScopeLevelType;
    if (!canSelectLevel(newLvl)) return;
    setSelectedLevel(newLvl);
  };

  const handleProvinceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provId = e.target.value;
    setSelectedProvinceId(provId);
    const item = provinces.find((p) => p.id === provId);
    setSelectedProvinceName(item ? formatWilayahName(item.name) : '');
    // Reset tingkat di bawahnya jika bukan dikunci oleh akun admin
    if (adminRank < 2) {
      setSelectedRegencyId('');
      setSelectedRegencyName('');
    }
    if (adminRank < 3) {
      setSelectedDistrictId('');
      setSelectedDistrictName('');
    }
    if (adminRank < 4) {
      setSelectedVillageId('');
      setSelectedVillageName('');
    }
  };

  const handleRegencySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const regId = e.target.value;
    setSelectedRegencyId(regId);
    const item = regencies.find((r) => r.id === regId);
    setSelectedRegencyName(item ? formatWilayahName(item.name) : '');
    if (adminRank < 3) {
      setSelectedDistrictId('');
      setSelectedDistrictName('');
    }
    if (adminRank < 4) {
      setSelectedVillageId('');
      setSelectedVillageName('');
    }
  };

  const handleDistrictSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const distId = e.target.value;
    setSelectedDistrictId(distId);
    const item = districts.find((d) => d.id === distId);
    setSelectedDistrictName(item ? formatWilayahName(item.name) : '');
    if (adminRank < 4) {
      setSelectedVillageId('');
      setSelectedVillageName('');
    }
  };

  const handleVillageSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const villId = e.target.value;
    setSelectedVillageId(villId);
    const item = villages.find((v) => v.id === villId);
    setSelectedVillageName(item ? formatWilayahName(item.name) : '');
  };

  const handleSave = () => {
    if (selectedLevel === 'umum') {
      onSave({
        gender: 'semua',
        regionScope: 'semua',
      });
    } else if (selectedLevel === 'provinsi') {
      onSave({
        gender: 'semua',
        regionScope: 'khusus',
        provinceId: selectedProvinceId || undefined,
        provinceName: selectedProvinceName || activeAdmin?.province || 'Jawa Timur',
      });
    } else if (selectedLevel === 'kota') {
      onSave({
        gender: 'semua',
        regionScope: 'khusus',
        provinceId: selectedProvinceId || undefined,
        provinceName: selectedProvinceName || activeAdmin?.province || 'Jawa Timur',
        regencyId: selectedRegencyId || undefined,
        regencyName: selectedRegencyName || activeAdmin?.city || undefined,
      });
    } else if (selectedLevel === 'kecamatan') {
      onSave({
        gender: 'semua',
        regionScope: 'khusus',
        provinceId: selectedProvinceId || undefined,
        provinceName: selectedProvinceName || activeAdmin?.province || 'Jawa Timur',
        regencyId: selectedRegencyId || undefined,
        regencyName: selectedRegencyName || activeAdmin?.city || undefined,
        districtId: selectedDistrictId || undefined,
        districtName: selectedDistrictName || activeAdmin?.kecamatan || undefined,
      });
    } else if (selectedLevel === 'desa') {
      onSave({
        gender: 'semua',
        regionScope: 'khusus',
        provinceId: selectedProvinceId || undefined,
        provinceName: selectedProvinceName || activeAdmin?.province || 'Jawa Timur',
        regencyId: selectedRegencyId || undefined,
        regencyName: selectedRegencyName || activeAdmin?.city || undefined,
        districtId: selectedDistrictId || undefined,
        districtName: selectedDistrictName || activeAdmin?.kecamatan || undefined,
        villageId: selectedVillageId || undefined,
        villageName: selectedVillageName || activeAdmin?.desa || undefined,
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
        className="bg-white w-full max-w-lg rounded-t-3xl shadow-2xl p-5 pb-6 space-y-3.5 animate-in slide-in-from-bottom duration-200 border-t border-slate-200/80 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle Bar Drag di Bagian Atas */}
        <div 
          onClick={onClose}
          className="w-12 h-1.5 bg-slate-300 hover:bg-slate-400 rounded-full mx-auto cursor-pointer transition-colors" 
        />

        {/* Header Modal */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Jangkauan Wilayah</h3>
            <p className="text-[11px] text-slate-500">
              {isPusat 
                ? 'Akun Pusat: Bebas menentukan jangkauan publik maupun per wilayah' 
                : `Akun Daerah: Dibatasi pada wilayah ${activeAdmin?.city || activeAdmin?.province || 'daerah Anda'}`}
            </p>
          </div>
          {isPusat ? (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Admin Pusat
            </span>
          ) : (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              <span>Admin Daerah</span>
            </span>
          )}
        </div>

        {/* Dropdown Tingkat Jangkauan (Paling Atas: Umum/Publik, lalu Provinsi, Kab/Kota, dst) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Tingkat Jangkauan Postingan
          </label>
          <div className="relative">
            <select
              value={selectedLevel}
              onChange={handleLevelChange}
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all cursor-pointer appearance-none pr-9"
            >
              {/* 1. UMUM / PUBLIK (PALING ATAS, DEFAULT ADMIN PUSAT) */}
              <option 
                value="umum" 
                disabled={!canSelectLevel('umum')}
                className={!canSelectLevel('umum') ? 'text-slate-400 bg-slate-100' : 'text-slate-800 font-bold'}
              >
                1. Umum / Publik (Semua Alumni Seluruh Wilayah) {!canSelectLevel('umum') ? '— [Khusus Admin Pusat]' : '— (Default Pusat)'}
              </option>

              {/* 2. PROVINSI */}
              <option 
                value="provinsi" 
                disabled={!canSelectLevel('provinsi')}
                className={!canSelectLevel('provinsi') ? 'text-slate-400 bg-slate-100' : 'text-slate-800'}
              >
                2. Tingkat Provinsi {!canSelectLevel('provinsi') ? '— [Di Luar Wewenang]' : ''}
              </option>

              {/* 3. KABUPATEN / KOTA */}
              <option 
                value="kota" 
                disabled={!canSelectLevel('kota')}
                className={!canSelectLevel('kota') ? 'text-slate-400 bg-slate-100' : 'text-slate-800'}
              >
                3. Tingkat Kabupaten / Kota {!canSelectLevel('kota') ? '— [Di Luar Wewenang]' : ''}
              </option>

              {/* 4. KECAMATAN */}
              <option 
                value="kecamatan" 
                disabled={!canSelectLevel('kecamatan')}
                className={!canSelectLevel('kecamatan') ? 'text-slate-400 bg-slate-100' : 'text-slate-800'}
              >
                4. Tingkat Kecamatan {!canSelectLevel('kecamatan') ? '— [Di Luar Wewenang]' : ''}
              </option>

              {/* 5. DESA / KELURAHAN */}
              <option 
                value="desa" 
                disabled={!canSelectLevel('desa')}
                className={!canSelectLevel('desa') ? 'text-slate-400 bg-slate-100' : 'text-slate-800'}
              >
                5. Tingkat Desa / Kelurahan {!canSelectLevel('desa') ? '— [Di Luar Wewenang]' : ''}
              </option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Keterangan atau Pilihan Wilayah Tergantung Level Terpilih */}
        {selectedLevel === 'umum' ? (
          <div className="bg-sky-50 border border-sky-200/80 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-sky-800">
            <Globe className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sky-900">Jangkauan Publik (Nasional & Internasional)</p>
              <p className="text-[11px] text-sky-700 mt-0.5">
                Agenda atau pengumuman ini dapat dibaca dan dihadiri oleh seluruh alumni santri At-Taroqqy di mana pun berada.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5 pt-1">
            {/* Kotak 1: Provinsi (Muncul jika level >= provinsi) */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-600">Provinsi Target</label>
              <div className="relative">
                <select
                  value={selectedProvinceId}
                  onChange={handleProvinceSelect}
                  disabled={!isPusat && Boolean(activeAdmin?.province)}
                  className={`w-full px-4 py-2.5 border rounded-2xl text-xs font-semibold transition-all ${
                    !isPusat && Boolean(activeAdmin?.province)
                      ? 'bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white cursor-pointer'
                  }`}
                >
                  <option value="">{selectedProvinceName ? selectedProvinceName : 'Pilih Provinsi'}</option>
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
            </div>

            {/* Kotak 2: Kabupaten / Kota (Muncul jika level >= kota) */}
            {['kota', 'kecamatan', 'desa'].includes(selectedLevel) && (
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-600">Kabupaten / Kota Target</label>
                <div className="relative">
                  <select
                    value={selectedRegencyId}
                    onChange={handleRegencySelect}
                    disabled={adminRank >= 2 && Boolean(activeAdmin?.city)}
                    className={`w-full px-4 py-2.5 border rounded-2xl text-xs font-semibold transition-all ${
                      adminRank >= 2 && Boolean(activeAdmin?.city)
                        ? 'bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed'
                        : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white cursor-pointer'
                    }`}
                  >
                    <option value="">
                      {selectedRegencyName ? selectedRegencyName : 'Pilih Kabupaten / Kota'}
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
              </div>
            )}

            {/* Kotak 3: Kecamatan (Muncul jika level >= kecamatan) */}
            {['kecamatan', 'desa'].includes(selectedLevel) && (
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-600">Kecamatan Target</label>
                <div className="relative">
                  <select
                    value={selectedDistrictId}
                    onChange={handleDistrictSelect}
                    disabled={adminRank >= 3 && Boolean(activeAdmin?.kecamatan)}
                    className={`w-full px-4 py-2.5 border rounded-2xl text-xs font-semibold transition-all ${
                      adminRank >= 3 && Boolean(activeAdmin?.kecamatan)
                        ? 'bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed'
                        : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white cursor-pointer'
                    }`}
                  >
                    <option value="">
                      {selectedDistrictName ? `Kec. ${selectedDistrictName}` : 'Pilih Kecamatan'}
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
              </div>
            )}

            {/* Kotak 4: Desa / Kelurahan (Muncul jika level === desa) */}
            {selectedLevel === 'desa' && (
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-600">Desa / Kelurahan Target</label>
                <div className="relative">
                  <select
                    value={selectedVillageId}
                    onChange={handleVillageSelect}
                    disabled={adminRank >= 4 && Boolean(activeAdmin?.desa)}
                    className={`w-full px-4 py-2.5 border rounded-2xl text-xs font-semibold transition-all ${
                      adminRank >= 4 && Boolean(activeAdmin?.desa)
                        ? 'bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed'
                        : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white cursor-pointer'
                    }`}
                  >
                    <option value="">
                      {selectedVillageName ? `Desa ${selectedVillageName}` : 'Pilih Desa / Kelurahan'}
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
            )}
          </div>
        )}

        {/* Tombol Terapkan */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xs transition-all cursor-pointer text-center"
          >
            Terapkan Jangkauan
          </button>
        </div>
      </div>
    </div>
  );
};
