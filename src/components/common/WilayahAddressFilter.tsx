import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Loader2, 
  Check, 
  ChevronUp,
  ChevronDown,
  MapPin,
  Maximize2,
  Navigation,
  Plus,
  Edit3
} from 'lucide-react';
import L from 'leaflet';
import { 
  WilayahItem, 
  fetchProvinces, 
  fetchRegencies, 
  fetchDistricts, 
  fetchVillages, 
  formatWilayahName,
  cleanWilayahName,
  normalizeProvinceName,
  resolveLocationHierarchy,
  FALLBACK_PROVINCES,
  FALLBACK_REGENCIES,
  FALLBACK_DISTRICTS,
  FALLBACK_VILLAGES
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
  showCurrentLocationButton?: boolean;
  stacked?: boolean;
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
  showCurrentLocationButton = false,
  stacked = false,
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
  const [isTypingField, setIsTypingField] = useState<ActiveField>(null);

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
        if ((previewMapRef.current as any)._leaflet_id) {
          delete (previewMapRef.current as any)._leaflet_id;
          previewMapRef.current.innerHTML = '';
        }

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
        setProvincesList(items && items.length > 0 ? items : FALLBACK_PROVINCES);
        setLoadingProv(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoadingProv(false);
        setProvincesList(FALLBACK_PROVINCES);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-sync IDs dan normalisasi dari props secara otomatis saat edit alamat dibuka
  useEffect(() => {
    const resolved = resolveLocationHierarchy(province, city, kecamatan);

    // Auto-isi nama provinsi jika belum ada di data alumni tetapi kabupaten/kecamatannya diketahui
    if (resolved.provName && !province && (city || kecamatan)) {
      onChange({
        province: resolved.provName,
        city,
        kecamatan,
        desa,
        alamatLengkap,
        coordinates: coordinates || undefined,
      });
    }

    if (resolved.provId && resolved.provId !== selectedProvId) {
      setSelectedProvId(resolved.provId);
    }
    if (resolved.regId && resolved.regId !== selectedRegId) {
      setSelectedRegId(resolved.regId);
    }
    if (resolved.distId && resolved.distId !== selectedDistId) {
      setSelectedDistId(resolved.distId);
    }
  }, [province, city, kecamatan]);

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
        const list = items && items.length > 0 ? items : (FALLBACK_REGENCIES[selectedProvId] || []);
        setRegenciesList(list);
        setLoadingReg(false);

        // Cocokkan kembali nama kota/kabupaten jika sudah ada
        if (city) {
          const cleanCity = cleanWilayahName(city);
          const match = list.find((r) => {
            const cleanR = cleanWilayahName(r.name);
            return cleanR === cleanCity || cleanR.includes(cleanCity) || cleanCity.includes(cleanR);
          });
          if (match && match.id !== selectedRegId) {
            setSelectedRegId(match.id);
          }
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setLoadingReg(false);
        const fallback = FALLBACK_REGENCIES[selectedProvId] || [];
        setRegenciesList(fallback);
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
        const list = items && items.length > 0 ? items : (FALLBACK_DISTRICTS[selectedRegId] || []);
        setDistrictsList(list);
        setLoadingDist(false);

        // Cocokkan kembali nama kecamatan jika sudah ada
        if (kecamatan) {
          const cleanKec = cleanWilayahName(kecamatan);
          const match = list.find((d) => {
            const cleanD = cleanWilayahName(d.name);
            return cleanD === cleanKec || cleanD.includes(cleanKec) || cleanKec.includes(cleanD);
          });
          if (match && match.id !== selectedDistId) {
            setSelectedDistId(match.id);
          }
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setLoadingDist(false);
        const fallback = FALLBACK_DISTRICTS[selectedRegId] || [];
        setDistrictsList(fallback);
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
        const list = items && items.length > 0 ? items : (FALLBACK_VILLAGES[selectedDistId] || []);
        setVillagesList(list);
        setLoadingVill(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoadingVill(false);
        const fallback = FALLBACK_VILLAGES[selectedDistId] || [];
        setVillagesList(fallback);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDistId]);

  // 1. PROVINSI HANDLERS
  const handleProvinceInputChange = (val: string) => {
    setActiveDropdown('province');
    setIsTypingField('province');
    const cleanVal = cleanWilayahName(normalizeProvinceName(val));
    const match = provincesList.find((p) => {
      const cleanP = cleanWilayahName(p.name);
      return cleanP === cleanVal;
    });

    if (match) {
      setSelectedProvId(match.id);
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
    setIsTypingField(null);

    // Pre-fetch regencies immediately
    fetchRegencies(item.id).then((regs) => {
      if (regs && regs.length > 0) setRegenciesList(regs);
    }).catch(() => {});

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
    setIsTypingField('city');
    const cleanVal = cleanWilayahName(val);
    
    // Cari kecocokan di regenciesList saat ini atau di seluruh fallback provinsi
    let match = regenciesList.find((r) => {
      const cleanR = cleanWilayahName(r.name);
      return cleanR === cleanVal || cleanR.includes(cleanVal);
    });

    let autoProv = province;
    if (!match && cleanVal) {
      for (const [pId, list] of Object.entries(FALLBACK_REGENCIES)) {
        const found = list.find(r => {
          const cName = cleanWilayahName(r.name);
          return cName === cleanVal || cName.includes(cleanVal);
        });
        if (found) {
          match = found;
          if (pId !== selectedProvId) {
            setSelectedProvId(pId);
            const pObj = FALLBACK_PROVINCES.find(p => p.id === pId);
            if (pObj) autoProv = formatWilayahName(pObj.name);
          }
          break;
        }
      }
    }

    if (match) {
      setSelectedRegId(match.id);
      setSelectedDistId('');
      setDistrictsList([]);
      setVillagesList([]);
    }

    onChange({
      province: autoProv || province,
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
    setIsTypingField(null);

    // Pre-fetch districts langsung agar saat buka kecamatan instan muncul
    fetchDistricts(item.id).then((dists) => {
      if (dists && dists.length > 0) setDistrictsList(dists);
    }).catch(() => {});

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
    setIsTypingField('kecamatan');
    const cleanVal = cleanWilayahName(val);
    const match = districtsList.find((d) => {
      const cleanD = cleanWilayahName(d.name);
      return cleanD === cleanVal || cleanD.includes(cleanVal);
    });

    if (match) {
      setSelectedDistId(match.id);
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
    setIsTypingField(null);

    // Pre-fetch villages langsung agar saat buka desa instan muncul
    fetchVillages(item.id).then((vills) => {
      if (vills && vills.length > 0) setVillagesList(vills);
    }).catch(() => {});

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
    setIsTypingField('desa');
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
    setIsTypingField(null);
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
    if (isTypingField !== 'province' || !province.trim()) return true;
    const q = cleanWilayahName(normalizeProvinceName(province));
    const n = cleanWilayahName(it.name);
    return n.includes(q) || q.includes(n);
  });

  const filteredRegencies = regenciesList.filter((it) => {
    if (isTypingField !== 'city' || !city.trim()) return true;
    const q = cleanWilayahName(city);
    const n = cleanWilayahName(it.name);
    return n.includes(q) || q.includes(n);
  });

  const filteredDistricts = districtsList.filter((it) => {
    if (isTypingField !== 'kecamatan' || !kecamatan.trim()) return true;
    const q = cleanWilayahName(kecamatan);
    const n = cleanWilayahName(it.name);
    return n.includes(q) || q.includes(n);
  });

  const filteredVillages = villagesList.filter((it) => {
    if (isTypingField !== 'desa' || !desa.trim()) return true;
    const q = cleanWilayahName(desa);
    const n = cleanWilayahName(it.name);
    return n.includes(q) || q.includes(n);
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

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [detectStatus, setDetectStatus] = useState<string | null>(null);

  const handleUseCurrentLocation = async () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('Perangkat Anda tidak mendukung fitur lokasi GPS');
      return;
    }
    setIsDetectingLocation(true);
    setDetectStatus('Membaca sinyal GPS...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setDetectStatus('Mendeteksi nama wilayah...');

          let hint: any = null;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
              {
                headers: { 'Accept-Language': 'id' },
                signal: AbortSignal.timeout(8000),
              }
            );
            if (res.ok) {
              const data = await res.json();
              if (data && data.address) {
                const a = data.address;
                hint = {
                  state: a.state || a.province || a.region || '',
                  city: a.city || a.county || a.municipality || a.town || '',
                  subdistrict: a.city_district || a.subdistrict || a.district || '',
                  village: a.village || a.suburb || a.quarter || a.neighbourhood || '',
                  road: a.road || a.street || '',
                  displayName: data.display_name || '',
                };
              }
            }
          } catch (e) {
            console.warn('Nominatim reverse error:', e);
          }

          if (!hint) {
            try {
              const bdcRes = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=id`,
                { signal: AbortSignal.timeout(6000) }
              );
              if (bdcRes.ok) {
                const bdc = await bdcRes.json();
                hint = {
                  state: bdc.principalSubdivision || '',
                  city: bdc.city || bdc.locality || '',
                  subdistrict: bdc.localityInfo?.administrative?.[3]?.name || '',
                  village: bdc.localityInfo?.administrative?.[4]?.name || '',
                  road: '',
                  displayName: '',
                };
              }
            } catch (e) {}
          }

          setDetectStatus('Menyesuaikan data dropdown...');

          let provs = provincesList;
          if (provs.length === 0) {
            provs = await fetchProvinces().catch(() => FALLBACK_PROVINCES);
            setProvincesList(provs);
          }

          let matchedProv = provs.find((p) => {
            const cleanP = cleanWilayahName(p.name);
            const cleanHintState = cleanWilayahName(hint?.state || '');
            return cleanP === cleanHintState || cleanHintState.includes(cleanP) || cleanP.includes(cleanHintState);
          });
          if (!matchedProv) {
            matchedProv = provs.find((p) => p.name.includes('JAWA TIMUR') || p.id === '35');
          }

          let matchedReg: WilayahItem | undefined;
          let matchedDist: WilayahItem | undefined;
          let matchedVill: WilayahItem | undefined;

          let targetCityName = '';
          let targetKecName = '';
          let targetDesaName = '';

          if (matchedProv) {
            setSelectedProvId(matchedProv.id);
            const regList = await fetchRegencies(matchedProv.id).catch(() => []);
            setRegenciesList(regList);

            if (hint?.city) {
              const cleanHintCity = cleanWilayahName(hint.city);
              matchedReg = regList.find((r) => {
                const cleanR = cleanWilayahName(r.name);
                return cleanR === cleanHintCity || cleanHintCity.includes(cleanR) || cleanR.includes(cleanHintCity);
              });
            }

            if (matchedReg) {
              setSelectedRegId(matchedReg.id);
              targetCityName = formatWilayahName(matchedReg.name);
              const distList = await fetchDistricts(matchedReg.id).catch(() => []);
              setDistrictsList(distList);

              if (hint?.subdistrict) {
                const cleanHintDist = cleanWilayahName(hint.subdistrict);
                matchedDist = distList.find((d) => {
                  const cleanD = cleanWilayahName(d.name);
                  return cleanD === cleanHintDist || cleanHintDist.includes(cleanD) || cleanD.includes(cleanHintDist);
                });
              }

              if (matchedDist) {
                setSelectedDistId(matchedDist.id);
                targetKecName = formatWilayahName(matchedDist.name);
                const villList = await fetchVillages(matchedDist.id).catch(() => []);
                setVillagesList(villList);

                if (hint?.village) {
                  const cleanHintVill = cleanWilayahName(hint.village);
                  matchedVill = villList.find((v) => {
                    const cleanV = cleanWilayahName(v.name);
                    return cleanV === cleanHintVill || cleanHintVill.includes(cleanV) || cleanV.includes(cleanHintVill);
                  });
                }

                if (matchedVill) {
                  targetDesaName = formatWilayahName(matchedVill.name);
                } else if (hint?.village) {
                  targetDesaName = hint.village;
                }
              } else if (hint?.subdistrict) {
                targetKecName = hint.subdistrict;
                if (hint?.village) targetDesaName = hint.village;
              }
            } else if (hint?.city) {
              targetCityName = hint.city;
              if (hint?.subdistrict) targetKecName = hint.subdistrict;
              if (hint?.village) targetDesaName = hint.village;
            }
          }

          const targetProvName = matchedProv ? formatWilayahName(matchedProv.name) : (hint?.state || 'Jawa Timur');
          const targetRoad = hint?.road || (hint?.displayName ? hint.displayName.split(',')[0] : '');
          const finalAlamat = targetRoad ? `${targetRoad}${alamatLengkap ? ` (${alamatLengkap})` : ''}` : alamatLengkap;

          onChange({
            province: targetProvName,
            city: targetCityName || city,
            kecamatan: targetKecName || kecamatan,
            desa: targetDesaName || desa,
            alamatLengkap: finalAlamat,
            coordinates: { lat, lng },
          });

          setDetectStatus('Wilayah berhasil dipilih!');
          setTimeout(() => {
            setDetectStatus(null);
            setIsDetectingLocation(false);
          }, 1500);
        } catch (err) {
          console.error('Error auto-detecting location:', err);
          setDetectStatus('Gagal membaca detail wilayah');
          setTimeout(() => {
            setDetectStatus(null);
            setIsDetectingLocation(false);
          }, 2000);
        }
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setDetectStatus('Izin GPS ditolak atau tidak tersedia');
        setTimeout(() => {
          setDetectStatus(null);
          setIsDetectingLocation(false);
        }, 2000);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const hasCoords = Boolean(coordinates && coordinates.lat && coordinates.lng);

  return (
    <div ref={containerRef} className="space-y-3.5 text-xs relative z-40">
      {/* TOMBOL GUNAKAN LOKASI SAAT INI (GPS AUTO-SELECT DROPDOWN WILAYAH) */}
      {showCurrentLocationButton && (
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isDetectingLocation}
          className="w-full py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-75 disabled:cursor-wait"
        >
          {isDetectingLocation ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin shrink-0 text-white" />
              <span>{detectStatus || 'Mendeteksi Lokasi & Memilih Wilayah...'}</span>
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4 shrink-0 text-sky-100" />
              <span>Gunakan Lokasi Saat Ini (Pilih Wilayah Otomatis)</span>
            </>
          )}
        </button>
      )}

      {/* 1. KOLOM WILAYAH (STACKED DARI PROVINSI SAMPAI DESA ATAU GRID 2 KOLOM) */}
      {(() => {
        const renderProvinceField = () => (
          <>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">
              Provinsi
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Ketik provinsi..."
                value={province}
                onChange={(e) => handleProvinceInputChange(e.target.value)}
                onFocus={() => {
                  setActiveDropdown('province');
                  setIsTypingField(null);
                }}
                onClick={() => {
                  setActiveDropdown('province');
                  setIsTypingField(null);
                }}
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

            {/* DROPDOWN MENU PROVINSI */}
            {activeDropdown === 'province' && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-[9999] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in ring-1 ring-black/10">
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
          </>
        );

        const renderCityField = () => (
          <>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">
              Kota / Kabupaten
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder={!selectedProvId ? 'Pilih provinsi atau ketik kota...' : 'Ketik kota/kabupaten...'}
                value={city}
                onChange={(e) => handleCityInputChange(e.target.value)}
                onFocus={() => {
                  setActiveDropdown('city');
                  setIsTypingField(null);
                }}
                onClick={() => {
                  setActiveDropdown('city');
                  setIsTypingField(null);
                }}
                className={`w-full pl-3 pr-7 py-2 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none transition-colors ${
                  activeDropdown === 'city'
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

            {/* DROPDOWN MENU KOTA / KABUPATEN */}
            {activeDropdown === 'city' && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-[9999] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in ring-1 ring-black/10">
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
                      {!selectedProvId ? 'Silakan pilih provinsi terlebih dahulu.' : 'Tidak ada kota/kabupaten yang cocok'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        );

        const renderKecamatanField = () => (
          <>
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
                  if (selectedRegId) {
                    setActiveDropdown('kecamatan');
                    setIsTypingField(null);
                  }
                }}
                onClick={() => {
                  if (selectedRegId) {
                    setActiveDropdown('kecamatan');
                    setIsTypingField(null);
                  }
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

            {/* DROPDOWN MENU KECAMATAN */}
            {activeDropdown === 'kecamatan' && selectedRegId && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-[9999] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in ring-1 ring-black/10">
                <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span>Pilih Kecamatan</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
                  {/* Opsi Gunakan Input Mandiri jika kecamatan diketik belum ada di daftar resmi */}
                  {kecamatan.trim() && !filteredDistricts.some(d => cleanWilayahName(d.name) === cleanWilayahName(kecamatan)) && (
                    <div
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setActiveDropdown(null);
                        setIsTypingField(null);
                      }}
                      className="px-3 py-2 text-xs cursor-pointer flex items-center gap-2 bg-sky-50 hover:bg-sky-100 text-sky-800 font-semibold border-b border-sky-100 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span className="truncate">Gunakan &quot;{kecamatan.trim()}&quot; (Input Mandiri)</span>
                    </div>
                  )}

                  {loadingDist && (
                    <div className="px-3 py-4 text-center text-xs text-sky-600 flex items-center justify-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Memuat daftar kecamatan...</span>
                    </div>
                  )}
                  {!loadingDist && filteredDistricts.map((item) => {
                    const nameFormatted = formatWilayahName(item.name);
                    const isSelected = cleanWilayahName(kecamatan) === cleanWilayahName(item.name);
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
          </>
        );

        const renderDesaField = () => (
          <>
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
                  if (selectedDistId) {
                    setActiveDropdown('desa');
                    setIsTypingField(null);
                  }
                }}
                onClick={() => {
                  if (selectedDistId) {
                    setActiveDropdown('desa');
                    setIsTypingField(null);
                  }
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

            {/* DROPDOWN MENU DESA */}
            {activeDropdown === 'desa' && selectedDistId && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-[9999] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in ring-1 ring-black/10">
                <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span>Pilih Desa / Kelurahan</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
                  {/* Opsi Gunakan Input Mandiri jika nama desa diketik tapi belum ada di daftar resmi */}
                  {desa.trim() && !filteredVillages.some(v => cleanWilayahName(v.name) === cleanWilayahName(desa)) && (
                    <div
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setActiveDropdown(null);
                        setIsTypingField(null);
                      }}
                      className="px-3 py-2 text-xs cursor-pointer flex items-center gap-2 bg-sky-50 hover:bg-sky-100 text-sky-800 font-semibold border-b border-sky-100 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span className="truncate">Gunakan &quot;{desa.trim()}&quot; (Input Mandiri)</span>
                    </div>
                  )}

                  {loadingVill && (
                    <div className="px-3 py-4 text-center text-xs text-sky-600 flex items-center justify-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Memuat daftar desa...</span>
                    </div>
                  )}
                  {!loadingVill && filteredVillages.map((item) => {
                    const nameFormatted = formatWilayahName(item.name);
                    const isSelected = cleanWilayahName(desa) === cleanWilayahName(item.name);
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
                    <div className="px-3 py-3 text-center text-xs text-slate-500 space-y-1.5">
                      <p className="text-[11px] text-slate-400">Desa tidak ditemukan di daftar resmi.</p>
                      {desa.trim() ? (
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setActiveDropdown(null);
                            setIsTypingField(null);
                          }}
                          className="w-full py-1.5 px-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          <span>Tetap gunakan &quot;{desa.trim()}&quot;</span>
                        </button>
                      ) : (
                        <p className="text-[10px] text-slate-400">Silakan ketikkan nama desa secara manual.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        );

        if (stacked) {
          return (
            <div className="space-y-3 relative z-30">
              <div className={`relative ${activeDropdown === 'province' ? 'z-50' : 'z-40'}`}>
                {renderProvinceField()}
              </div>
              <div className={`relative ${activeDropdown === 'city' ? 'z-50' : 'z-30'}`}>
                {renderCityField()}
              </div>
              <div className={`relative ${activeDropdown === 'kecamatan' ? 'z-50' : 'z-20'}`}>
                {renderKecamatanField()}
              </div>
              <div className={`relative ${activeDropdown === 'desa' ? 'z-50' : 'z-10'}`}>
                {renderDesaField()}
              </div>
            </div>
          );
        }

        return (
          <>
            <div className={`grid grid-cols-2 gap-2.5 relative transition-all ${activeDropdown === 'province' || activeDropdown === 'city' ? 'z-50' : 'z-30'}`}>
              <div className={`relative ${activeDropdown === 'province' ? 'z-50' : 'z-20'}`}>
                {renderProvinceField()}
              </div>
              <div className={`relative ${activeDropdown === 'city' ? 'z-50' : 'z-20'}`}>
                {renderCityField()}
              </div>
            </div>

            <div className={`grid grid-cols-2 gap-2.5 relative transition-all ${activeDropdown === 'kecamatan' || activeDropdown === 'desa' ? 'z-50' : 'z-20'}`}>
              <div className={`relative ${activeDropdown === 'kecamatan' ? 'z-50' : 'z-10'}`}>
                {renderKecamatanField()}
              </div>
              <div className={`relative ${activeDropdown === 'desa' ? 'z-50' : 'z-10'}`}>
                {renderDesaField()}
              </div>
            </div>
          </>
        );
      })()}

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
      {/* 5. BOX PETA TITIK LOKASI RUMAH */}
      {showLocationTag && (
        <div
          onClick={(e) => {
            e.stopPropagation();
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
          className="group relative w-full h-40 sm:h-44 rounded-2xl overflow-hidden border border-slate-300 shadow-xs hover:shadow-md hover:border-sky-500 transition-all cursor-pointer bg-slate-100 z-0"
          title="Klik untuk membuka peta dan mengatur titik lokasi rumah"
        >
          {/* Layer Peta Preview Leaflet */}
          <div
            ref={previewMapRef}
            className="w-full h-full pointer-events-none transition-all"
          />

          {/* Overlay tombol di pojok jika belum ada titik lokasi atau untuk ubah titik */}
          <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5">
            <span className="px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-sky-700 text-xs font-bold shadow-md border border-slate-200/90 flex items-center gap-1.5 backdrop-blur-md transition-all active:scale-95">
              <MapPin className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>{hasCoords ? 'Ubah Titik Peta' : 'Atur Titik Peta'}</span>
            </span>
          </div>

          {/* Tag Lokasi Koordinat (Jika sudah diatur) */}
          {hasCoords ? (
            <div className="absolute bottom-2.5 left-2.5 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-slate-200/90 text-xs font-bold text-slate-800 pointer-events-none">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Lokasi Terpasang</span>
              <span className="text-[10px] font-mono text-slate-500 font-normal ml-0.5">
                ({coordinates!.lat.toFixed(4)}, {coordinates!.lng.toFixed(4)})
              </span>
            </div>
          ) : (
            <div className="absolute bottom-2.5 left-2.5 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/75 backdrop-blur-md rounded-xl text-xs font-semibold text-white pointer-events-none">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Ketuk kotak peta untuk menentukan titik rumah</span>
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
          onClose={() => {
            setIsMapModalOpen(false);
            setTimeout(() => {
              miniMapInstanceRef.current?.invalidateSize();
            }, 120);
          }}
          onSelectLocation={(coords, hint) => {
            handleLocationPicked(coords, hint);
            setIsMapModalOpen(false);
            setTimeout(() => {
              miniMapInstanceRef.current?.invalidateSize();
            }, 120);
          }}
          onDeleteLocation={() => {
            setCachedCenter(null);
            handleLocationPicked(null, undefined);
            setIsMapModalOpen(false);
            setTimeout(() => {
              miniMapInstanceRef.current?.invalidateSize();
            }, 120);
          }}
        />
      )}
    </div>
  );
};
