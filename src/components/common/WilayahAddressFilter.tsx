import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Loader2, 
  Check, 
  ChevronUp,
  ChevronDown,
  MapPin,
  Maximize2,
  Navigation
} from 'lucide-react';
import L from 'leaflet';
import { 
  WilayahItem, 
  fetchProvinces, 
  fetchRegencies, 
  fetchDistricts, 
  fetchVillages, 
  formatWilayahName 
} from '../../services/wilayahService';
import { 
  FullscreenLocationMapModal, 
  LocationCoordinates, 
  DetectedAddressHint 
} from './FullscreenLocationMapModal';

export interface WilayahAddressFilterProps {
  province: string;
  city: string;
  kecamatan: string;
  desa: string;
  alamatLengkap?: string;
  coordinates?: LocationCoordinates | null;
  onChange: (vals: {
    province: string;
    city: string;
    kecamatan: string;
    desa: string;
    alamatLengkap?: string;
    coordinates?: LocationCoordinates;
  }) => void;
  showLocationTag?: boolean;
  showAlamatLengkap?: boolean;
}

type ActiveField = 'province' | 'city' | 'kecamatan' | 'desa' | null;

export const WilayahAddressFilter: React.FC<WilayahAddressFilterProps> = ({
  province,
  city,
  kecamatan,
  desa,
  alamatLengkap = '',
  coordinates,
  onChange,
  showLocationTag = true,
  showAlamatLengkap = true,
}) => {
  // Lists from endpoint
  const [provincesList, setProvincesList] = useState<WilayahItem[]>([]);
  const [regenciesList, setRegenciesList] = useState<WilayahItem[]>([]);
  const [districtsList, setDistrictsList] = useState<WilayahItem[]>([]);
  const [villagesList, setVillagesList] = useState<WilayahItem[]>([]);

  // Selected IDs
  const [selectedProvId, setSelectedProvId] = useState<string>('');
  const [selectedRegId, setSelectedRegId] = useState<string>('');
  const [selectedDistId, setSelectedDistId] = useState<string>('');

  // Loading states
  const [loadingProv, setLoadingProv] = useState(false);
  const [loadingReg, setLoadingReg] = useState(false);
  const [loadingDist, setLoadingDist] = useState(false);
  const [loadingVill, setLoadingVill] = useState(false);

  // Active dropdown
  const [activeDropdown, setActiveDropdown] = useState<ActiveField>(null);

  // Fullscreen map modal state
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [cachedCenter, setCachedCenter] = useState<LocationCoordinates | null>(null);
  const [cachedZoom, setCachedZoom] = useState<number>(15);

  const containerRef = useRef<HTMLDivElement>(null);
  const previewMapRef = useRef<HTMLDivElement>(null);
  const miniMapInstanceRef = useRef<L.Map | null>(null);
  const miniMarkerRef = useRef<L.Marker | null>(null);

  // Initialize and update preview mini map
  useEffect(() => {
    if (!showLocationTag) {
      if (miniMapInstanceRef.current) {
        miniMapInstanceRef.current.remove();
        miniMapInstanceRef.current = null;
        miniMarkerRef.current = null;
      }
      return;
    }

    const hasCoordinates = Boolean(coordinates?.lat && coordinates?.lng);
    const targetLat = coordinates?.lat || -7.9826;
    const targetLng = coordinates?.lng || 112.6308;

    const timer = setTimeout(() => {
      if (!previewMapRef.current) return;

      if (!miniMapInstanceRef.current) {
        const miniMap = L.map(previewMapRef.current, {
          center: [targetLat, targetLng],
          zoom: 15,
          zoomControl: false,
          attributionControl: false,
          dragging: false,
          touchZoom: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          boxZoom: false,
          keyboard: false,
        });

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(miniMap);

        if (hasCoordinates) {
          const pinIcon = L.divIcon({
            className: 'mini-preview-pin !border-0 !bg-transparent',
            html: `
              <div style="width: 32px; height: 40px; position: relative;">
                <!-- Shadow -->
                <div style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 14px; height: 5px; background: rgba(0,0,0,0.35); border-radius: 50%; filter: blur(1.5px);"></div>
                <!-- Pin Teardrop -->
                <div style="position: absolute; top: 0; left: 0; width: 32px; height: 32px; background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(185, 28, 28, 0.45); border: 2.5px solid #ffffff;">
                  <div style="width: 10px; height: 10px; background: #ffffff; border-radius: 50%;"></div>
                </div>
              </div>
            `,
            iconSize: [32, 40],
            iconAnchor: [16, 40],
          });

          const marker = L.marker([targetLat, targetLng], { icon: pinIcon }).addTo(miniMap);
          miniMarkerRef.current = marker;
        }

        miniMapInstanceRef.current = miniMap;
      } else {
        miniMapInstanceRef.current.setView([targetLat, targetLng], 15, { animate: false });
        if (hasCoordinates) {
          if (miniMarkerRef.current) {
            miniMarkerRef.current.setLatLng([targetLat, targetLng]);
          } else {
            const pinIcon = L.divIcon({
              className: 'mini-preview-pin !border-0 !bg-transparent',
              html: `
                <div style="width: 32px; height: 40px; position: relative;">
                  <div style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 14px; height: 5px; background: rgba(0,0,0,0.35); border-radius: 50%; filter: blur(1.5px);"></div>
                  <div style="position: absolute; top: 0; left: 0; width: 32px; height: 32px; background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(185, 28, 28, 0.45); border: 2.5px solid #ffffff;">
                    <div style="width: 10px; height: 10px; background: #ffffff; border-radius: 50%;"></div>
                  </div>
                </div>
              `,
              iconSize: [32, 40],
              iconAnchor: [16, 40],
            });
            const marker = L.marker([targetLat, targetLng], { icon: pinIcon }).addTo(miniMapInstanceRef.current);
            miniMarkerRef.current = marker;
          }
        } else if (miniMarkerRef.current) {
          miniMapInstanceRef.current.removeLayer(miniMarkerRef.current);
          miniMarkerRef.current = null;
        }
      }

      miniMapInstanceRef.current?.invalidateSize();
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [showLocationTag, coordinates?.lat, coordinates?.lng]);

  // Clean up preview map on unmount
  useEffect(() => {
    return () => {
      if (miniMapInstanceRef.current) {
        miniMapInstanceRef.current.remove();
        miniMapInstanceRef.current = null;
        miniMarkerRef.current = null;
      }
    };
  }, []);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch initial provinces
  useEffect(() => {
    let isMounted = true;
    setLoadingProv(true);
    fetchProvinces()
      .then((items) => {
        if (!isMounted) return;
        setProvincesList(items);
        setLoadingProv(false);

        if (province) {
          const match = items.find(
            (p) => p.name.toLowerCase() === province.toLowerCase() ||
                   formatWilayahName(p.name).toLowerCase() === province.toLowerCase()
          );
          if (match) {
            setSelectedProvId(match.id);
          }
        }
      })
      .catch(() => {
        if (isMounted) setLoadingProv(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch regencies when selectedProvId changes
  useEffect(() => {
    if (!selectedProvId) {
      setRegenciesList([]);
      setSelectedRegId('');
      return;
    }

    let isMounted = true;
    setLoadingReg(true);
    fetchRegencies(selectedProvId)
      .then((items) => {
        if (!isMounted) return;
        setRegenciesList(items);
        setLoadingReg(false);

        if (city) {
          const match = items.find(
            (r) => r.name.toLowerCase().includes(city.toLowerCase()) ||
                   formatWilayahName(r.name).toLowerCase().includes(city.toLowerCase())
          );
          if (match) {
            setSelectedRegId(match.id);
          }
        }
      })
      .catch(() => {
        if (isMounted) setLoadingReg(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedProvId]);

  // Fetch districts when selectedRegId changes
  useEffect(() => {
    if (!selectedRegId) {
      setDistrictsList([]);
      setSelectedDistId('');
      return;
    }

    let isMounted = true;
    setLoadingDist(true);
    fetchDistricts(selectedRegId)
      .then((items) => {
        if (!isMounted) return;
        setDistrictsList(items);
        setLoadingDist(false);

        if (kecamatan) {
          const match = items.find(
            (d) => d.name.toLowerCase() === kecamatan.toLowerCase() ||
                   formatWilayahName(d.name).toLowerCase() === kecamatan.toLowerCase()
          );
          if (match) {
            setSelectedDistId(match.id);
          }
        }
      })
      .catch(() => {
        if (isMounted) setLoadingDist(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedRegId]);

  // Fetch villages when selectedDistId changes
  useEffect(() => {
    if (!selectedDistId) {
      setVillagesList([]);
      return;
    }

    let isMounted = true;
    setLoadingVill(true);
    fetchVillages(selectedDistId)
      .then((items) => {
        if (!isMounted) return;
        setVillagesList(items);
        setLoadingVill(false);
      })
      .catch(() => {
        if (isMounted) setLoadingVill(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDistId]);

  // 1. PROVINSI HANDLERS
  const handleProvinceInputChange = (val: string) => {
    setActiveDropdown('province');
    const match = provincesList.find(
      (p) => p.name.toLowerCase() === val.trim().toLowerCase() ||
             formatWilayahName(p.name).toLowerCase() === val.trim().toLowerCase()
    );

    if (match) {
      setSelectedProvId(match.id);
      setSelectedRegId('');
      setSelectedDistId('');
      setRegenciesList([]);
      setDistrictsList([]);
      setVillagesList([]);
    } else {
      setSelectedProvId('');
      setSelectedRegId('');
      setSelectedDistId('');
      setRegenciesList([]);
      setDistrictsList([]);
      setVillagesList([]);
    }

    onChange({
      province: val,
      city: '',
      kecamatan: '',
      desa: '',
      alamatLengkap,
      coordinates: coordinates || undefined,
    });
  };

  const handleSelectProvince = (item: WilayahItem) => {
    const formatted = formatWilayahName(item.name);
    setSelectedProvId(item.id);
    setSelectedRegId('');
    setSelectedDistId('');
    setRegenciesList([]);
    setDistrictsList([]);
    setVillagesList([]);
    setActiveDropdown(null);

    onChange({
      province: formatted,
      city: '',
      kecamatan: '',
      desa: '',
      alamatLengkap,
      coordinates: coordinates || undefined,
    });
  };

  // 2. KOTA / KABUPATEN HANDLERS
  const handleCityInputChange = (val: string) => {
    setActiveDropdown('city');
    const match = regenciesList.find(
      (r) => r.name.toLowerCase() === val.trim().toLowerCase() ||
             formatWilayahName(r.name).toLowerCase() === val.trim().toLowerCase()
    );

    if (match) {
      setSelectedRegId(match.id);
      setSelectedDistId('');
      setDistrictsList([]);
      setVillagesList([]);
    } else {
      setSelectedRegId('');
      setSelectedDistId('');
      setDistrictsList([]);
      setVillagesList([]);
    }

    onChange({
      province,
      city: val,
      kecamatan: '',
      desa: '',
      alamatLengkap,
      coordinates: coordinates || undefined,
    });
  };

  const handleSelectCity = (item: WilayahItem) => {
    const formatted = formatWilayahName(item.name);
    setSelectedRegId(item.id);
    setSelectedDistId('');
    setDistrictsList([]);
    setVillagesList([]);
    setActiveDropdown(null);

    onChange({
      province,
      city: formatted,
      kecamatan: '',
      desa: '',
      alamatLengkap,
      coordinates: coordinates || undefined,
    });
  };

  // 3. KECAMATAN HANDLERS
  const handleKecamatanInputChange = (val: string) => {
    setActiveDropdown('kecamatan');
    const match = districtsList.find(
      (d) => d.name.toLowerCase() === val.trim().toLowerCase() ||
             formatWilayahName(d.name).toLowerCase() === val.trim().toLowerCase()
    );

    if (match) {
      setSelectedDistId(match.id);
      setVillagesList([]);
    } else {
      setSelectedDistId('');
      setVillagesList([]);
    }

    onChange({
      province,
      city,
      kecamatan: val,
      desa: '',
      alamatLengkap,
      coordinates: coordinates || undefined,
    });
  };

  const handleSelectKecamatan = (item: WilayahItem) => {
    const formatted = formatWilayahName(item.name);
    setSelectedDistId(item.id);
    setVillagesList([]);
    setActiveDropdown(null);

    onChange({
      province,
      city,
      kecamatan: formatted,
      desa: '',
      alamatLengkap,
      coordinates: coordinates || undefined,
    });
  };

  // 4. DESA / KELURAHAN HANDLERS
  const handleDesaInputChange = (val: string) => {
    setActiveDropdown('desa');
    onChange({
      province,
      city,
      kecamatan,
      desa: val,
      alamatLengkap,
      coordinates: coordinates || undefined,
    });
  };

  const handleSelectDesa = (item: WilayahItem) => {
    const formatted = formatWilayahName(item.name);
    setActiveDropdown(null);
    onChange({
      province,
      city,
      kecamatan,
      desa: formatted,
      alamatLengkap,
      coordinates: coordinates || undefined,
    });
  };

  // Filter lists based on what's typed directly in the respective input
  const filteredProvinces = provincesList.filter((it) => {
    if (!province.trim()) return true;
    const q = province.toLowerCase();
    return it.name.toLowerCase().includes(q) || formatWilayahName(it.name).toLowerCase().includes(q);
  });

  const filteredRegencies = regenciesList.filter((it) => {
    if (!city.trim()) return true;
    const q = city.toLowerCase();
    return it.name.toLowerCase().includes(q) || formatWilayahName(it.name).toLowerCase().includes(q);
  });

  const filteredDistricts = districtsList.filter((it) => {
    if (!kecamatan.trim()) return true;
    const q = kecamatan.toLowerCase();
    return it.name.toLowerCase().includes(q) || formatWilayahName(it.name).toLowerCase().includes(q);
  });

  const filteredVillages = villagesList.filter((it) => {
    if (!desa.trim()) return true;
    const q = desa.toLowerCase();
    return it.name.toLowerCase().includes(q) || formatWilayahName(it.name).toLowerCase().includes(q);
  });

  // Handle location selected from fullscreen interactive map
  const handleLocationPicked = (coords: LocationCoordinates | null, hint?: DetectedAddressHint) => {
    setCachedCenter(coords);
    if (!coords) {
      onChange({
        province,
        city,
        kecamatan,
        desa,
        alamatLengkap,
        coordinates: undefined,
      });
      return;
    }

    // If the detected hint provides details and current fields are empty, fill or update them smoothly
    const updatedProv = province || hint?.state || '';
    const updatedCity = city || hint?.city || '';
    const updatedKec = kecamatan || hint?.subdistrict || '';
    const updatedDesa = desa || hint?.village || '';
    const updatedAlamat = alamatLengkap || hint?.road || hint?.displayName || '';

    onChange({
      province: updatedProv,
      city: updatedCity,
      kecamatan: updatedKec,
      desa: updatedDesa,
      alamatLengkap: updatedAlamat,
      coordinates: coords,
    });
  };

  const hasCoords = Boolean(coordinates && coordinates.lat && coordinates.lng);

  return (
    <div ref={containerRef} className="space-y-3.5 text-xs relative z-40">
      {/* 1. KOLOM PROVINSI DAN KABUPATEN SEJAJAR (PALING ATAS) */}
      <div className={`grid grid-cols-2 gap-2.5 relative transition-all ${activeDropdown === 'province' || activeDropdown === 'city' ? 'z-50' : 'z-30'}`}>
        {/* PROVINSI */}
        <div className={`relative ${activeDropdown === 'province' ? 'z-50' : 'z-20'}`}>
          <label className="block text-[10px] font-semibold text-slate-500 mb-1">
            Provinsi
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Ketik provinsi..."
              value={province}
              onChange={(e) => handleProvinceInputChange(e.target.value)}
              onFocus={() => setActiveDropdown('province')}
              onClick={() => setActiveDropdown('province')}
              className={`w-full pl-3 pr-7 py-2 bg-slate-50 border rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none transition-colors ${
                activeDropdown === 'province'
                  ? 'border-sky-500 ring-2 ring-sky-100 bg-white'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            />
            <div className="absolute right-2 flex items-center gap-1">
              {loadingProv ? (
                <Loader2 className="w-3.5 h-3.5 text-sky-600 animate-spin" />
              ) : province ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProvId('');
                    setSelectedRegId('');
                    setSelectedDistId('');
                    setRegenciesList([]);
                    setDistrictsList([]);
                    setVillagesList([]);
                    onChange({ 
                      province: '', 
                      city: '', 
                      kecamatan: '', 
                      desa: '',
                      alamatLengkap,
                      coordinates: coordinates || undefined
                    });
                  }}
                  className="p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              ) : null}
            </div>
          </div>

          {/* DROPDOWN MENU PROVINSI (DI ATAS INPUT BOX AGAR TIDAK TERTIMBUN KEYBOARD) */}
          {activeDropdown === 'province' && (
            <div className="absolute left-0 right-0 bottom-full mb-1.5 z-[999] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in ring-1 ring-black/10">
              <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span>Pilih Provinsi</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
                {loadingProv && (
                  <div className="px-3 py-4 text-center text-xs text-sky-600 flex items-center justify-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Memuat daftar provinsi...</span>
                  </div>
                )}
                {!loadingProv && filteredProvinces.map((item) => {
                  const nameFormatted = formatWilayahName(item.name);
                  const isSelected = province.toLowerCase() === nameFormatted.toLowerCase();
                  return (
                    <div
                      key={item.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectProvince(item);
                      }}
                      className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                        isSelected ? 'bg-sky-50 text-sky-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="truncate">{nameFormatted}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-sky-600 shrink-0 ml-1" />}
                    </div>
                  );
                })}
                {!loadingProv && filteredProvinces.length === 0 && (
                  <div className="px-3 py-3 text-center text-xs text-slate-400">
                    Tidak ada provinsi yang cocok
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* KOTA / KABUPATEN */}
        <div className={`relative ${activeDropdown === 'city' ? 'z-50' : 'z-20'}`}>
          <label className="block text-[10px] font-semibold text-slate-500 mb-1">
            Kota / Kabupaten
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder={!selectedProvId ? 'Pilih provinsi dulu' : 'Ketik kota/kabupaten...'}
              disabled={!selectedProvId}
              value={city}
              onChange={(e) => handleCityInputChange(e.target.value)}
              onFocus={() => {
                if (selectedProvId) setActiveDropdown('city');
              }}
              onClick={() => {
                if (selectedProvId) setActiveDropdown('city');
              }}
              className={`w-full pl-3 pr-7 py-2 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none transition-colors ${
                !selectedProvId
                  ? 'bg-slate-100 border border-slate-200/60 cursor-not-allowed opacity-60'
                  : activeDropdown === 'city'
                  ? 'border-sky-500 ring-2 ring-sky-100 bg-white'
                  : 'bg-slate-50 border border-slate-200 hover:border-slate-300'
              }`}
            />
            <div className="absolute right-2 flex items-center gap-1">
              {loadingReg ? (
                <Loader2 className="w-3.5 h-3.5 text-sky-600 animate-spin" />
              ) : city ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRegId('');
                    setSelectedDistId('');
                    setDistrictsList([]);
                    setVillagesList([]);
                    onChange({ 
                      province, 
                      city: '', 
                      kecamatan: '', 
                      desa: '',
                      alamatLengkap,
                      coordinates: coordinates || undefined
                    });
                  }}
                  className="p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              ) : null}
            </div>
          </div>

          {/* DROPDOWN MENU KOTA / KABUPATEN (DI ATAS INPUT BOX AGAR TIDAK TERTIMBUN KEYBOARD) */}
          {activeDropdown === 'city' && selectedProvId && (
            <div className="absolute left-0 right-0 bottom-full mb-1.5 z-[999] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in ring-1 ring-black/10">
              <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span>Pilih Kota / Kabupaten</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
                {loadingReg && (
                  <div className="px-3 py-4 text-center text-xs text-sky-600 flex items-center justify-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Memuat daftar kota/kabupaten...</span>
                  </div>
                )}
                {!loadingReg && filteredRegencies.map((item) => {
                  const nameFormatted = formatWilayahName(item.name);
                  const isSelected = city.toLowerCase() === nameFormatted.toLowerCase();
                  return (
                    <div
                      key={item.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectCity(item);
                      }}
                      className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                        isSelected ? 'bg-sky-50 text-sky-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="truncate">{nameFormatted}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-sky-600 shrink-0 ml-1" />}
                    </div>
                  );
                })}
                {!loadingReg && filteredRegencies.length === 0 && (
                  <div className="px-3 py-3 text-center text-xs text-slate-400">
                    Tidak ada kota/kabupaten yang cocok
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. KOLOM KECAMATAN DAN DESA SEJAJAR */}
      <div className={`grid grid-cols-2 gap-2.5 relative transition-all ${activeDropdown === 'kecamatan' || activeDropdown === 'desa' ? 'z-50' : 'z-20'}`}>
        {/* KECAMATAN */}
        <div className={`relative ${activeDropdown === 'kecamatan' ? 'z-50' : 'z-10'}`}>
          <label className="block text-[10px] font-semibold text-slate-500 mb-1">
            Kecamatan
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder={!selectedRegId ? 'Pilih kota dulu' : 'Ketik kecamatan...'}
              disabled={!selectedRegId}
              value={kecamatan}
              onChange={(e) => handleKecamatanInputChange(e.target.value)}
              onFocus={() => {
                if (selectedRegId) setActiveDropdown('kecamatan');
              }}
              onClick={() => {
                if (selectedRegId) setActiveDropdown('kecamatan');
              }}
              className={`w-full pl-3 pr-7 py-2 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none transition-colors ${
                !selectedRegId
                  ? 'bg-slate-100 border border-slate-200/60 cursor-not-allowed opacity-60'
                  : activeDropdown === 'kecamatan'
                  ? 'border-sky-500 ring-2 ring-sky-100 bg-white'
                  : 'bg-slate-50 border border-slate-200 hover:border-slate-300'
              }`}
            />
            <div className="absolute right-2 flex items-center gap-1">
              {loadingDist ? (
                <Loader2 className="w-3.5 h-3.5 text-sky-600 animate-spin" />
              ) : kecamatan ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDistId('');
                    setVillagesList([]);
                    onChange({ 
                      province, 
                      city, 
                      kecamatan: '', 
                      desa: '',
                      alamatLengkap,
                      coordinates: coordinates || undefined
                    });
                  }}
                  className="p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              ) : null}
            </div>
          </div>

          {/* DROPDOWN MENU KECAMATAN (DI ATAS INPUT BOX AGAR TIDAK TERTIMBUN KEYBOARD) */}
          {activeDropdown === 'kecamatan' && selectedRegId && (
            <div className="absolute left-0 right-0 bottom-full mb-1.5 z-[999] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in ring-1 ring-black/10">
              <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span>Pilih Kecamatan</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
                {loadingDist && (
                  <div className="px-3 py-4 text-center text-xs text-sky-600 flex items-center justify-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Memuat daftar kecamatan...</span>
                  </div>
                )}
                {!loadingDist && filteredDistricts.map((item) => {
                  const nameFormatted = formatWilayahName(item.name);
                  const isSelected = kecamatan.toLowerCase() === nameFormatted.toLowerCase();
                  return (
                    <div
                      key={item.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectKecamatan(item);
                      }}
                      className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                        isSelected ? 'bg-sky-50 text-sky-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="truncate">{nameFormatted}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-sky-600 shrink-0 ml-1" />}
                    </div>
                  );
                })}
                {!loadingDist && filteredDistricts.length === 0 && (
                  <div className="px-3 py-3 text-center text-xs text-slate-400">
                    Tidak ada kecamatan yang cocok
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* DESA / KELURAHAN */}
        <div className={`relative ${activeDropdown === 'desa' ? 'z-50' : 'z-10'}`}>
          <label className="block text-[10px] font-semibold text-slate-500 mb-1">
            Desa / Kelurahan
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder={!selectedDistId ? 'Pilih kecamatan dulu' : 'Ketik desa/kelurahan...'}
              disabled={!selectedDistId}
              value={desa}
              onChange={(e) => handleDesaInputChange(e.target.value)}
              onFocus={() => {
                if (selectedDistId) setActiveDropdown('desa');
              }}
              onClick={() => {
                if (selectedDistId) setActiveDropdown('desa');
              }}
              className={`w-full pl-3 pr-7 py-2 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none transition-colors ${
                !selectedDistId
                  ? 'bg-slate-100 border border-slate-200/60 cursor-not-allowed opacity-60'
                  : activeDropdown === 'desa'
                  ? 'border-sky-500 ring-2 ring-sky-100 bg-white'
                  : 'bg-slate-50 border border-slate-200 hover:border-slate-300'
              }`}
            />
            <div className="absolute right-2 flex items-center gap-1">
              {loadingVill ? (
                <Loader2 className="w-3.5 h-3.5 text-sky-600 animate-spin" />
              ) : desa ? (
                <button
                  type="button"
                  onClick={() => {
                    onChange({ 
                      province, 
                      city, 
                      kecamatan, 
                      desa: '',
                      alamatLengkap,
                      coordinates: coordinates || undefined
                    });
                  }}
                  className="p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              ) : null}
            </div>
          </div>

          {/* DROPDOWN MENU DESA (DI ATAS INPUT BOX AGAR TIDAK TERTIMBUN KEYBOARD) */}
          {activeDropdown === 'desa' && selectedDistId && (
            <div className="absolute left-0 right-0 bottom-full mb-1.5 z-[999] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in ring-1 ring-black/10">
              <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span>Pilih Desa / Kelurahan</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
                {loadingVill && (
                  <div className="px-3 py-4 text-center text-xs text-sky-600 flex items-center justify-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Memuat daftar desa...</span>
                  </div>
                )}
                {!loadingVill && filteredVillages.map((item) => {
                  const nameFormatted = formatWilayahName(item.name);
                  const isSelected = desa.toLowerCase() === nameFormatted.toLowerCase();
                  return (
                    <div
                      key={item.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectDesa(item);
                      }}
                      className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                        isSelected ? 'bg-sky-50 text-sky-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="truncate">{nameFormatted}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-sky-600 shrink-0 ml-1" />}
                    </div>
                  );
                })}
                {!loadingVill && filteredVillages.length === 0 && (
                  <div className="px-3 py-3 text-center text-xs text-slate-400">
                    Tidak ada desa yang cocok
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. ALAMAT LENGKAP */}
      {showAlamatLengkap && (
        <div className="space-y-1 relative z-10">
          <label className="block text-[11px] font-bold text-slate-700">
            Alamat Lengkap (Jalan, RT/RW, Dusun, No. Rumah)
          </label>
          <textarea
            rows={2}
            placeholder="Contoh: Jl. Pesantren No. 45, RT 03 / RW 02, Dusun Krajan"
            value={alamatLengkap}
            onChange={(e) => {
              onChange({
                province,
                city,
                kecamatan,
                desa,
                alamatLengkap: e.target.value,
                coordinates: coordinates || undefined,
              });
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors shadow-2xs"
          />
        </div>
      )}

      {/* 4. KOTAK PREVIEW PETA & TAG LOKASI (PALING BAWAH) */}
      {showLocationTag && (
        <div
          onClick={() => {
            if (coordinates?.lat && coordinates?.lng) {
              setCachedCenter(coordinates);
            } else {
              setCachedCenter(null);
            }
            if (miniMapInstanceRef.current) {
              setCachedZoom(miniMapInstanceRef.current.getZoom());
            }
            setIsMapModalOpen(true);
          }}
          className="group relative w-full h-36 sm:h-40 rounded-2xl overflow-hidden border border-slate-300 shadow-xs hover:shadow-md hover:border-sky-500 transition-all cursor-pointer bg-slate-100 z-0"
          title={hasCoords ? "Klik untuk membuka peta layar penuh dan memindah titik" : "Titik lokasi rumah belum diatur"}
        >
          {/* Layer Peta Preview Leaflet (Blur jika belum diatur) */}
          <div
            ref={previewMapRef}
            className={`w-full h-full pointer-events-none transition-all ${
              !hasCoords ? 'filter blur-[3px] opacity-60' : ''
            }`}
          />

          {/* Overlay jika belum ada titik lokasi rumah yang diatur */}
          {!hasCoords && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/35 backdrop-blur-2xs p-3 text-center">
              <div className="w-10 h-10 rounded-full bg-white/95 shadow-md flex items-center justify-center text-slate-700 mb-2">
                <MapPin className="w-5 h-5 text-rose-500" />
              </div>
              <p className="text-white font-bold text-xs sm:text-sm drop-shadow-sm mb-2.5">
                Titik lokasi rumah belum diatur
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCachedCenter(null);
                  if (miniMapInstanceRef.current) {
                    setCachedZoom(miniMapInstanceRef.current.getZoom());
                  }
                  setIsMapModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-sky-950/40 active:scale-95 cursor-pointer transition-all"
              >
                <MapPin className="w-3.5 h-3.5 fill-white" />
                <span>Atur Pin Lokasi Rumah</span>
              </button>
            </div>
          )}

          {/* Tag Lokasi (Hanya muncul jika koordinat sudah diatur) */}
          {hasCoords && (
            <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-full shadow-md border border-slate-200/90 text-xs font-bold text-slate-800 pointer-events-none">
              <MapPin className="w-4 h-4 text-rose-600 fill-rose-600 shrink-0 animate-pulse" />
              <span>Tag Lokasi</span>
              <span className="text-[10px] font-mono text-slate-500 font-normal ml-0.5">
                ({coordinates!.lat.toFixed(4)}, {coordinates!.lng.toFixed(4)})
              </span>
            </div>
          )}
        </div>
      )}

      {/* FULLSCREEN LOCATION MAP MODAL */}
      {isMapModalOpen && (
        <FullscreenLocationMapModal
          isOpen={isMapModalOpen}
          initialCoordinates={coordinates?.lat && coordinates?.lng ? coordinates : null}
          initialZoom={cachedZoom || 15}
          currentAddressLabel={[alamatLengkap, desa, kecamatan, city, province].filter(Boolean).join(', ')}
          onClose={() => setIsMapModalOpen(false)}
          onSelectLocation={handleLocationPicked}
          onDeleteLocation={() => {
            setCachedCenter(null);
            handleLocationPicked(null, undefined);
          }}
        />
      )}
    </div>
  );
};
