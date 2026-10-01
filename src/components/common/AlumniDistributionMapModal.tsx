import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  MapPin, 
  Navigation, 
  ChevronRight, 
  User, 
  Sparkles,
  Home,
  ExternalLink
} from 'lucide-react';
import L from 'leaflet';
import { AlumniRecord } from '../../types';

interface AlumniDistributionMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  alumniList: AlumniRecord[];
  currentUser: AlumniRecord;
  deviceGps?: { lat: number; lng: number } | null;
  onSelectAlumni: (alumni: AlumniRecord) => void;
}

export const AlumniDistributionMapModal: React.FC<AlumniDistributionMapModalProps> = ({
  isOpen,
  onClose,
  alumniList,
  currentUser,
  deviceGps,
  onSelectAlumni,
}) => {
  const [selectedAlumni, setSelectedAlumni] = useState<AlumniRecord | null>(null);
  const [realtimeGps, setRealtimeGps] = useState<{ lat: number; lng: number } | null>(deviceGps || null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isShowingRealtimeGpsDetail, setIsShowingRealtimeGpsDetail] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Sync prop deviceGps if updated
  useEffect(() => {
    if (deviceGps && !realtimeGps) {
      setRealtimeGps(deviceGps);
    }
  }, [deviceGps]);

  // Filter only alumni who share location tag and have coordinates
  const permittedAlumni = alumniList.filter(
    (item) => item.shareLocationTag !== false && Boolean(item.coordinates?.lat && item.coordinates?.lng)
  );

  const displayedAlumni = searchFilter.trim()
    ? permittedAlumni.filter(
        (a) =>
          a.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
          a.city.toLowerCase().includes(searchFilter.toLowerCase()) ||
          (a.kecamatan && a.kecamatan.toLowerCase().includes(searchFilter.toLowerCase())) ||
          a.province.toLowerCase().includes(searchFilter.toLowerCase())
      )
    : permittedAlumni;

  // Real-time GPS Geolocation Tracker - Pastikan akurat & langsung terpusat
  useEffect(() => {
    if (!isOpen) return;

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setRealtimeGps(coords);
          setGpsAccuracy(Math.round(pos.coords.accuracy || 10));

          // Langsung pusatkan peta ke titik GPS akurat tanpa animasi overshoot
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([coords.lat, coords.lng], 15, { animate: false });
          }
        },
        (err) => {
          console.warn('Geolocation access:', err);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
      );

      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setRealtimeGps(coords);
          setGpsAccuracy(Math.round(pos.coords.accuracy || 10));
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000 }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [isOpen]);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    // Prioritaskan selalu lokasi realtime GPS terkini, BUKAN titik rumah saya!
    const effectiveGps = realtimeGps || deviceGps;
    const initialLat = effectiveGps?.lat || -6.9928;
    const initialLng = effectiveGps?.lng || 110.4286;

    // Create map instance if not already created
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 15,
        zoomControl: false,
        bounceAtZoomLimits: false,
        inertia: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;

      // Deselect cards when clicking background map
      map.on('click', () => {
        setSelectedAlumni(null);
        setIsShowingRealtimeGpsDetail(false);
      });
    }

    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;

    if (!map || !markersGroup) return;

    // Clear previous markers
    markersGroup.clearLayers();

    // 1. ADD REALTIME GPS MARKER (Titik Lokasi Terkini Saya: Lingkaran Biru Google Maps)
    const currentGps = realtimeGps || deviceGps;
    if (currentGps) {
      const gpsMarkerHtml = `
        <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <div class="gps-pulse-ring" style="position: absolute; width: 38px; height: 38px; border-radius: 9999px; background: rgba(26, 115, 232, 0.28); pointer-events: none;"></div>
          <div style="position: relative; width: 17px; height: 17px; border-radius: 9999px; background: #1a73e8; border: 3px solid #ffffff; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);"></div>
        </div>
      `;

      const gpsIcon = L.divIcon({
        className: 'alumni-avatar-pin',
        html: gpsMarkerHtml,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });

      const gpsMarker = L.marker([currentGps.lat, currentGps.lng], {
        icon: gpsIcon,
        zIndexOffset: 1500,
      });

      gpsMarker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setIsShowingRealtimeGpsDetail(true);
        setSelectedAlumni(null);
        map.panTo([currentGps.lat, currentGps.lng], { animate: true, duration: 0.35 });
      });

      markersGroup.addLayer(gpsMarker);
    }

    // 2. ADD ALUMNI REGISTERED LOCATION PINS (Tag Rumah / Domisili Alumni)
    displayedAlumni.forEach((alumni) => {
      if (!alumni.coordinates?.lat || !alumni.coordinates?.lng) return;

      const isCurrent = alumni.id === currentUser.id;
      const lat = alumni.coordinates.lat;
      const lng = alumni.coordinates.lng;

      // Custom circular avatar marker
      const photoHtml = alumni.photoUrl
        ? `<img src="${alumni.photoUrl}" alt="${alumni.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 9999px;" />`
        : `<div style="width: 100%; height: 100%; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px; color: white; background: ${
            alumni.gender === 'P'
              ? 'linear-gradient(135deg, #f43f5e, #ec4899)'
              : 'linear-gradient(135deg, #0284c7, #2563eb)'
          }; display: flex; align-items: center; justify-content: center;">${alumni.name.charAt(0)}</div>`;

      const markerHtml = `
        <div style="position: relative; cursor: pointer; display: flex; flex-direction: column; align-items: center; transform: translate3d(0,0,0);">
          <div style="width: 44px; height: 44px; border-radius: 9999px; border: 2.5px solid white; box-shadow: 0 10px 25px -3px rgba(0,0,0,0.4); overflow: hidden; background: #e0f2fe; ${
            isCurrent ? 'box-shadow: 0 0 0 3px #0284c7, 0 10px 25px -3px rgba(0,0,0,0.5);' : ''
          }">
            ${photoHtml}
          </div>
          <div style="width: 10px; height: 10px; background-color: ${
            isCurrent ? '#0284c7' : '#0369a1'
          }; transform: rotate(45deg); margin-top: -5px; border-right: 2px solid white; border-bottom: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
          ${
            isCurrent
              ? '<span style="background: #334155; color: white; font-size: 9px; font-weight: bold; padding: 1px 6px; border-radius: 9999px; margin-top: 2px; box-shadow: 0 2px 5px rgba(0,0,0,0.3); border: 1px solid white; white-space: nowrap;">Rumah Anda</span>'
              : ''
          }
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'alumni-avatar-pin',
        html: markerHtml,
        iconSize: [48, 54],
        iconAnchor: [24, 52],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setSelectedAlumni(alumni);
        setIsShowingRealtimeGpsDetail(false);
        // Direct smooth pan without overshoot
        map.panTo([lat, lng], { animate: true, duration: 0.35 });
      });

      markersGroup.addLayer(marker);
    });

    // Invalidate size to ensure full view renders, and lock directly to realtime GPS location without overshoot
    setTimeout(() => {
      if (!mapInstanceRef.current) return;
      mapInstanceRef.current.invalidateSize();
      const targetGps = realtimeGps || deviceGps;
      if (targetGps) {
        // Langsung terpusat sesuai lokasi terkini GPS secara presisi
        mapInstanceRef.current.setView([targetGps.lat, targetGps.lng], 15, { animate: false });
      }
    }, 100);

  }, [isOpen, displayedAlumni.length, realtimeGps?.lat, realtimeGps?.lng, deviceGps?.lat, deviceGps?.lng]);

  // Clean cleanup on modal close
  useEffect(() => {
    if (!isOpen && mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      setSelectedAlumni(null);
      setIsShowingRealtimeGpsDetail(false);
      setSearchFilter('');
    }
  }, [isOpen]);

  // Pusatkan ke Lokasi Terkini Realtime Saya (GPS) - Tanpa animasi overshoot
  const handleCenterUser = () => {
    if (!mapInstanceRef.current) return;
    const target = realtimeGps || deviceGps;
    if (target) {
      // Direct setView linear animation without parabolic zoom-out overshoot
      mapInstanceRef.current.setView([target.lat, target.lng], 15, { animate: true });
      setIsShowingRealtimeGpsDetail(true);
      setSelectedAlumni(null);
    } else if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setRealtimeGps(coords);
          mapInstanceRef.current?.setView([coords.lat, coords.lng], 15, { animate: true });
          setIsShowingRealtimeGpsDetail(true);
          setSelectedAlumni(null);
        },
        (err) => {
          console.warn('Geolocation error:', err);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  };

  // Pusatkan ke Tag Rumah Saya
  const handleCenterHome = () => {
    if (!mapInstanceRef.current) return;
    if (currentUser.coordinates?.lat && currentUser.coordinates?.lng) {
      mapInstanceRef.current.setView([currentUser.coordinates.lat, currentUser.coordinates.lng], 15, { animate: true });
      setSelectedAlumni(currentUser);
      setIsShowingRealtimeGpsDetail(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex flex-col bg-slate-900 animate-in fade-in duration-200 select-none overflow-hidden">
      {/* 1. TOP FLOATING APP BAR */}
      <div className="absolute top-4 inset-x-4 z-[1000] flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl p-1.5 pr-4 border border-slate-200/90 shadow-xl">
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            title="Tutup Peta"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-display font-bold text-xs sm:text-sm text-slate-900 leading-tight">
              Peta Sebaran Alumni
            </h2>
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-[10px] text-slate-500 font-medium">
                {displayedAlumni.length} alumni berbagi lokasi
              </p>
              {currentUser.shareLocationTag === false && (
                <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-200/70 px-1.5 py-0.2 rounded-full font-semibold">
                  Tag rumah disembunyikan
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAP CANVAS CONTAINER */}
      <div className="relative w-full h-full flex-1">
        <div ref={mapContainerRef} className="w-full h-full z-0 bg-slate-100" />
      </div>

      {/* 3. TOMBOL AKSI PUSATKAN LOKASI & PUSATKAN KE RUMAH (KANAN BAWAH) */}
      <div
        className={`absolute right-4 z-[1000] flex flex-col gap-2.5 transition-all duration-300 pointer-events-auto ${
          selectedAlumni || isShowingRealtimeGpsDetail ? 'bottom-52' : 'bottom-6'
        }`}
      >
        {/* Tombol 1: Pusatkan ke Lokasi GPS Terkini */}
        <button
          type="button"
          onClick={handleCenterUser}
          className="w-12 h-12 sm:w-13 sm:h-13 rounded-[22px] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.16)] border border-slate-100 flex items-center justify-center cursor-pointer transition-all active:scale-90 hover:shadow-2xl select-none"
          title="Pusatkan ke Lokasi GPS Saya"
        >
          {/* Ikon Lingkaran Biru Persis Referensi Gambar */}
          <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-[#dbe9fe] flex items-center justify-center">
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#0066ff] ring-2 ring-white shadow-2xs" />
          </div>
        </button>

        {/* Tombol 2: Pusatkan ke Rumah Saya (Di bawah tombol pusatkan lokasi) */}
        <button
          type="button"
          onClick={handleCenterHome}
          className="w-12 h-12 sm:w-13 sm:h-13 rounded-[22px] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.16)] border border-slate-100 flex items-center justify-center cursor-pointer transition-all active:scale-90 hover:shadow-2xl select-none group"
          title="Pusatkan ke Rumah Saya"
        >
          <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-slate-100 group-hover:bg-sky-50 text-slate-700 group-hover:text-sky-600 flex items-center justify-center transition-colors">
            <Home className="w-4.5 h-4.5 text-slate-700 group-hover:text-sky-600 transition-colors" />
          </div>
        </button>
      </div>

      {/* 4. FLOATING BOTTOM CARD (PREVIEW DETAIL ALUMNI YANG DIKLIK) */}
      {selectedAlumni && (
        <div className="absolute bottom-6 inset-x-4 sm:max-w-md sm:mx-auto z-[1000] animate-in slide-in-from-bottom-6 duration-200">
          <div className="bg-white rounded-3xl p-4 shadow-2xl border border-slate-200/90 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-13 h-13 rounded-2xl overflow-hidden bg-sky-100 shrink-0 border border-slate-200 shadow-xs">
                  {selectedAlumni.photoUrl ? (
                    <img
                      src={selectedAlumni.photoUrl}
                      alt={selectedAlumni.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className={`w-full h-full flex items-center justify-center font-bold text-lg text-white ${
                        selectedAlumni.gender === 'P'
                          ? 'bg-gradient-to-br from-rose-400 to-pink-500'
                          : 'bg-gradient-to-br from-sky-500 to-blue-600'
                      }`}
                    >
                      {selectedAlumni.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-display font-bold text-sm text-slate-900 truncate">
                      {selectedAlumni.name}
                    </h3>
                    {selectedAlumni.id === currentUser.id && (
                      <span className="text-[9px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.2 rounded-full border border-slate-200">
                        Tag Rumah Anda
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {[selectedAlumni.desa, selectedAlumni.kecamatan, selectedAlumni.city]
                      .filter(Boolean)
                      .join(', ') || selectedAlumni.city}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {selectedAlumni.occupation || selectedAlumni.jenjang}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAlumni(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  onSelectAlumni(selectedAlumni);
                  onClose();
                }}
                className="flex-1 py-2.5 px-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-sky-600/20 cursor-pointer transition-all active:scale-[0.98]"
              >
                <User className="w-3.5 h-3.5" />
                <span>Lihat Profil Lengkap</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Tombol Rute Google Maps (HANYA ICON di Samping Tombol Lihat Profil) */}
              {selectedAlumni.coordinates?.lat && selectedAlumni.coordinates?.lng && (
                <button
                  type="button"
                  onClick={() => {
                    const destLat = selectedAlumni.coordinates!.lat;
                    const destLng = selectedAlumni.coordinates!.lng;
                    const curGps = realtimeGps || deviceGps;
                    const originParam = curGps ? `&origin=${curGps.lat},${curGps.lng}` : '';
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}${originParam}`;
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }}
                  className="w-11 h-11 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200/90 text-sky-700 flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-xs shrink-0"
                  title="Buka Rute di Google Maps"
                >
                  <Navigation className="w-5 h-5 text-sky-600" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. FLOATING BOTTOM CARD (DETAIL TITIK LOKASI TERKINI REALTIME GPS SAYA) */}
      {isShowingRealtimeGpsDetail && (realtimeGps || deviceGps) && (
        <div className="absolute bottom-6 inset-x-4 sm:max-w-md sm:mx-auto z-[1000] animate-in slide-in-from-bottom-6 duration-200">
          <div className="bg-white rounded-3xl p-4 shadow-2xl border border-slate-200/90 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center shrink-0">
                  <Navigation className="w-6 h-6 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-display font-bold text-sm text-slate-900 truncate">
                      Lokasi Terkini Saya
                    </h3>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      GPS Aktif
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Titik akurat sinyal GPS realtime saat ini
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {(realtimeGps || deviceGps)!.lat.toFixed(5)}, {(realtimeGps || deviceGps)!.lng.toFixed(5)} {gpsAccuracy ? `(±${gpsAccuracy}m)` : ''}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsShowingRealtimeGpsDetail(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[11px] text-slate-600 bg-sky-50/70 p-2.5 rounded-xl border border-sky-100 flex items-center justify-between">
              <span>*Berbeda dengan titik tag rumah Anda</span>
              {currentUser.coordinates?.lat && currentUser.coordinates?.lng && (
                <button
                  type="button"
                  onClick={() => {
                    if (mapInstanceRef.current && currentUser.coordinates) {
                      // Smooth direct setView without parabolic overshoot
                      mapInstanceRef.current.setView([currentUser.coordinates.lat, currentUser.coordinates.lng], 14, { animate: true });
                      setSelectedAlumni(currentUser);
                      setIsShowingRealtimeGpsDetail(false);
                    }
                  }}
                  className="text-sky-700 font-bold hover:underline cursor-pointer ml-2 shrink-0"
                >
                  Lihat Tag Rumah
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
