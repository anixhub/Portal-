import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Check, 
  MapPin,
  RotateCcw,
  Navigation,
  Loader2,
  ExternalLink,
  Copy,
  Trash2
} from 'lucide-react';
import L from 'leaflet';

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface DetectedAddressHint {
  displayName?: string;
  road?: string;
  village?: string;
  subdistrict?: string;
  city?: string;
  state?: string;
}

interface FullscreenLocationMapModalProps {
  isOpen: boolean;
  initialCoordinates?: LocationCoordinates | null;
  initialZoom?: number;
  currentAddressLabel?: string;
  onClose: () => void;
  onSelectLocation: (coords: LocationCoordinates | null, addressHint?: DetectedAddressHint) => void;
  onDeleteLocation?: () => void;
}

// Default center: Malang, Jawa Timur (Lokasi Pondok Pesantren At-Taroqqy)
const DEFAULT_CENTER: LocationCoordinates = {
  lat: -7.9826,
  lng: 112.6308,
};

export const FullscreenLocationMapModal: React.FC<FullscreenLocationMapModalProps> = ({
  isOpen,
  initialCoordinates,
  initialZoom = 15,
  currentAddressLabel,
  onClose,
  onSelectLocation,
  onDeleteLocation,
}) => {
  const [selectedCoords, setSelectedCoords] = useState<LocationCoordinates>(
    initialCoordinates?.lat && initialCoordinates?.lng
      ? initialCoordinates
      : DEFAULT_CENTER
  );
  const [initialCoordsState, setInitialCoordsState] = useState<LocationCoordinates>(
    initialCoordinates?.lat && initialCoordinates?.lng
      ? initialCoordinates
      : DEFAULT_CENTER
  );
  const [isMovingLocation, setIsMovingLocation] = useState(
    !Boolean(initialCoordinates?.lat && initialCoordinates?.lng)
  );
  const [hasChanged, setHasChanged] = useState(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showBottomDetailCard, setShowBottomDetailCard] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [detectedHint, setDetectedHint] = useState<DetectedAddressHint | undefined>();
  const [hasPinnedLocation, setHasPinnedLocation] = useState<boolean>(
    Boolean(initialCoordinates?.lat && initialCoordinates?.lng)
  );
  const [gpsNotification, setGpsNotification] = useState<{
    type: 'loading' | 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const handleDeleteLocation = () => {
    setHasPinnedLocation(false);
    setShowBottomDetailCard(false);
    setIsMovingLocation(false);
    setHasChanged(false);
    if (markerInstanceRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(markerInstanceRef.current);
      markerInstanceRef.current = null;
    }
    onSelectLocation(null, undefined);
    if (onDeleteLocation) onDeleteLocation();
    setGpsNotification({
      type: 'success',
      message: 'Titik tag lokasi rumah berhasil dihapus',
    });
    setTimeout(() => {
      setGpsNotification(null);
      onClose();
    }, 700);
  };

  const isMovingRef = useRef(isMovingLocation);
  isMovingRef.current = isMovingLocation;

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerInstanceRef = useRef<L.Marker | null>(null);

  // Synchronize when opened with initial coords
  useEffect(() => {
    if (isOpen) {
      const isSet = Boolean(initialCoordinates?.lat && initialCoordinates?.lng);
      const target = isSet ? (initialCoordinates as LocationCoordinates) : DEFAULT_CENTER;
      setSelectedCoords(target);
      setInitialCoordsState(target);
      setHasPinnedLocation(isSet);
      setIsMovingLocation(!isSet);
      setHasChanged(false);
      setShowSavedFeedback(false);
      setShowBottomDetailCard(false);
      setGpsNotification(null);
      setShowPermissionModal(false);
    }
  }, [isOpen, initialCoordinates]);

  // Leaflet custom marker icon
  const createCustomPinIcon = (isMoving: boolean) => {
    return L.divIcon({
      className: 'custom-leaflet-pin !border-0 !bg-transparent',
      html: `
        <div style="width: 36px; height: 46px; position: relative; cursor: pointer;">
          <!-- Shadow -->
          <div style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 16px; height: 6px; background: rgba(0,0,0,0.35); border-radius: 50%; filter: blur(1.5px);"></div>
          
          <!-- Floating container (vertical float only, NO rotation) -->
          <div class="${isMoving ? 'animate-pin-float' : ''}" style="position: absolute; top: 0; left: 0; width: 36px; height: 46px;">
            <!-- Outer Pin Teardrop with fixed stable -45deg angle -->
            <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 14px rgba(185, 28, 28, 0.45); border: 2.5px solid #ffffff;">
              <!-- Inner white dot -->
              <div style="width: 11px; height: 11px; background: #ffffff; border-radius: 50%;"></div>
            </div>
          </div>
        </div>
      `,
      iconSize: [36, 46],
      iconAnchor: [18, 46],
    });
  };

  const attachMarkerEvents = (marker: L.Marker) => {
    marker.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      setShowBottomDetailCard((prev) => !prev);
    });
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      setSelectedCoords({ lat: pos.lat, lng: pos.lng });
      setHasChanged(true);
    });
  };

  // Initialize and manage the Leaflet map instance
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    let resizeObserver: ResizeObserver | null = null;
    let timers: ReturnType<typeof setTimeout>[] = [];

    const initTimer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Clean up any stale leaflet ID to prevent "Map container is already initialized"
      if ((mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
        mapContainerRef.current.innerHTML = '';
      }

      const initialLat = initialCoordinates?.lat ?? selectedCoords.lat ?? DEFAULT_CENTER.lat;
      const initialLng = initialCoordinates?.lng ?? selectedCoords.lng ?? DEFAULT_CENTER.lng;
      const currentZoom = initialZoom || 15;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: currentZoom,
        zoomControl: false,
        zoomSnap: 0,
        zoomDelta: 0.5,
        bounceAtZoomLimits: false,
        wheelPxPerZoomLevel: 90,
        touchZoom: true,
      });

      // OpenStreetMap Tiles
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      // Marker - add if pinned location exists
      const shouldHavePin = Boolean(initialCoordinates?.lat && initialCoordinates?.lng) || hasPinnedLocation;
      if (shouldHavePin) {
        const pinIcon = createCustomPinIcon(isMovingRef.current);
        const marker = L.marker([initialLat, initialLng], {
          draggable: isMovingRef.current,
          icon: pinIcon,
        }).addTo(map);
        attachMarkerEvents(marker);
        markerInstanceRef.current = marker;
      }

      // Move or create marker on map click
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        setSelectedCoords({ lat, lng });
        setHasPinnedLocation(true);
        setHasChanged(true);
        setIsMovingLocation(true);

        if (!markerInstanceRef.current) {
          const pinIcon = createCustomPinIcon(true);
          const newMarker = L.marker([lat, lng], {
            draggable: true,
            icon: pinIcon,
          }).addTo(map);
          attachMarkerEvents(newMarker);
          markerInstanceRef.current = newMarker;
        } else {
          markerInstanceRef.current.setLatLng([lat, lng]);
          markerInstanceRef.current.dragging?.enable();
          markerInstanceRef.current.setIcon(createCustomPinIcon(true));
        }
      });

      mapInstanceRef.current = map;

      // Invalidate size immediately and repeatedly to ensure tiles render perfectly
      const triggerInvalidate = () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      };

      triggerInvalidate();
      map.setView([initialLat, initialLng], currentZoom, { animate: false });

      timers.push(setTimeout(triggerInvalidate, 80));
      timers.push(setTimeout(triggerInvalidate, 200));
      timers.push(setTimeout(triggerInvalidate, 450));
      timers.push(setTimeout(triggerInvalidate, 800));

      if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          triggerInvalidate();
        });
        resizeObserver.observe(mapContainerRef.current);
      }
    }, 40);

    return () => {
      clearTimeout(initTimer);
      timers.forEach(clearTimeout);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // Update marker draggable state and icon when isMovingLocation changes
  useEffect(() => {
    if (!markerInstanceRef.current) return;
    if (isMovingLocation) {
      markerInstanceRef.current.dragging?.enable();
      markerInstanceRef.current.setIcon(createCustomPinIcon(true));
      setShowBottomDetailCard(false); // Hide detail card when entering move mode
    } else {
      markerInstanceRef.current.dragging?.disable();
      markerInstanceRef.current.setIcon(createCustomPinIcon(false));
    }
  }, [isMovingLocation]);

  // Reverse geocode when selectedCoords change
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchReverse = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${selectedCoords.lat}&lon=${selectedCoords.lng}&zoom=18&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'id',
            },
          }
        );
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (!isMounted) return;

        if (data && data.display_name) {
          const addr = data.address || {};
          setDetectedHint({
            displayName: data.display_name,
            road: addr.road || addr.street,
            village: addr.village || addr.suburb || addr.quarter,
            subdistrict: addr.city_district || addr.subdistrict || addr.county,
            city: addr.city || addr.town || addr.municipality,
            state: addr.state,
          });
        }
      } catch {
        // Quiet
      }
    };

    const debounceTimer = setTimeout(fetchReverse, 400);
    return () => {
      isMounted = false;
      clearTimeout(debounceTimer);
    };
  }, [selectedCoords, isOpen]);

  // Open location in Google Maps (View Pin)
  const handleOpenGoogleMaps = () => {
    const url = `https://www.google.com/maps?q=${selectedCoords.lat},${selectedCoords.lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Open location in Google Maps Route/Directions
  const handleOpenGoogleMapsRoute = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedCoords.lat},${selectedCoords.lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Display GPS status toast notification without window.alert
  const showGpsNotification = (type: 'loading' | 'success' | 'warning' | 'error', message: string, duration = 3500) => {
    setGpsNotification({ type, message });
    if (duration > 0) {
      setTimeout(() => {
        setGpsNotification((prev) => (prev?.message === message ? null : prev));
      }, duration);
    }
  };

  // Move directly to user's real GPS location using high-precision satellite tracking
  const handleMoveToCurrentLocation = () => {
    if (!navigator.geolocation) {
      showGpsNotification('error', 'Browser atau perangkat Anda tidak mendukung GPS.');
      return;
    }

    setIsLocating(true);
    showGpsNotification('loading', 'Mengunci sinyal satelit GPS perangkat Anda...', 0);

    let bestFix: GeolocationPosition | null = null;
    let watchId: number | null = null;
    let isFinished = false;

    const stopTracking = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      setIsLocating(false);
      isFinished = true;
    };

    const applyPreciseGps = (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const acc = Math.round(pos.coords.accuracy);

      setSelectedCoords({ lat, lng });
      setHasPinnedLocation(true);
      setHasChanged(true);

      // Smoothly move or create pin marker at exact coordinates
      if (markerInstanceRef.current) {
        markerInstanceRef.current.setLatLng([lat, lng]);
      } else if (mapInstanceRef.current) {
        const pinIcon = createCustomPinIcon(true);
        const newMarker = L.marker([lat, lng], {
          draggable: true,
          icon: pinIcon,
        }).addTo(mapInstanceRef.current);
        attachMarkerEvents(newMarker);
        markerInstanceRef.current = newMarker;
      }

      // Smoothly fly map to target location with street/house level zoom
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([lat, lng], 18, { animate: true, duration: 1.2 });
        mapInstanceRef.current.invalidateSize();
      }

      const qualityText = acc <= 20 
        ? `Sangat akurat (±${acc} meter)` 
        : `Akurasi ±${acc} meter`;
      showGpsNotification('success', `Lokasi GPS terkunci: ${qualityText}`, 4000);
    };

    // Safety timeout: wait up to 10 seconds to refine satellite accuracy
    const safetyTimeout = setTimeout(() => {
      if (isFinished) return;
      if (bestFix) {
        applyPreciseGps(bestFix);
      } else {
        showGpsNotification('error', 'Waktu pencarian GPS habis. Pastikan GPS HP aktif dengan mode Akurasi Tinggi.');
      }
      stopTracking();
    }, 10000);

    // Use watchPosition to let the GPS hardware warm up and acquire satellite lock (down to 5-15m)
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (isFinished) return;

        // Keep track of the highest precision fix
        if (!bestFix || pos.coords.accuracy < bestFix.coords.accuracy) {
          bestFix = pos;
        }

        // If satellite fix is high precision (<= 25 meters, true satellite lock), finish immediately!
        if (pos.coords.accuracy <= 25) {
          clearTimeout(safetyTimeout);
          applyPreciseGps(pos);
          stopTracking();
        } else {
          // Provide real-time accuracy improvement feedback
          showGpsNotification(
            'loading', 
            `Mengunci satelit GPS (akurasi saat ini ±${Math.round(pos.coords.accuracy)}m, mencari yang lebih presisi)...`, 
            0
          );
        }
      },
      (err) => {
        if (isFinished) return;
        clearTimeout(safetyTimeout);
        stopTracking();

        let errMsg = 'Gagal mengakses GPS perangkat.';
        if (err.code === 1) {
          errMsg = 'Izin lokasi belum aktif di browser. Ketuk bantuan izin di bawah.';
          setShowPermissionModal(true);
        } else if (err.code === 2) {
          errMsg = 'Sinyal GPS tidak tersedia. Pastikan fitur Lokasi di perangkat HP sudah aktif.';
        } else if (err.code === 3) {
          errMsg = 'Pencarian GPS timeout. Coba pastikan HP tidak dalam mode hemat baterai.';
        }
        showGpsNotification('error', errMsg, 4500);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  // Copy coordinates to clipboard
  const handleCopyCoords = () => {
    const text = `${selectedCoords.lat.toFixed(6)}, ${selectedCoords.lng.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  // Cancel moving mode & revert marker to initial coords if not saved
  const handleCancelMove = () => {
    setIsMovingLocation(false);
    setSelectedCoords(initialCoordsState);
    setHasChanged(false);
    if (markerInstanceRef.current) {
      markerInstanceRef.current.setLatLng([initialCoordsState.lat, initialCoordsState.lng]);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([initialCoordsState.lat, initialCoordsState.lng], initialZoom || 15);
    }
  };

  const handleConfirmLocation = () => {
    onSelectLocation(selectedCoords, detectedHint);
    setInitialCoordsState(selectedCoords);
    setIsMovingLocation(false);
    setHasChanged(false);
    if (markerInstanceRef.current) {
      markerInstanceRef.current.dragging?.disable();
      markerInstanceRef.current.setIcon(createCustomPinIcon(false));
    }
    setShowSavedFeedback(true);
    setTimeout(() => {
      setShowSavedFeedback(false);
      onClose();
    }, 400);
  };

  if (!isOpen) return null;

  // Render via React Portal into document.body to ensure complete viewport coverage without bleed-through
  return createPortal(
    <div className="fixed inset-0 z-[200000] w-screen h-screen bg-slate-950 overflow-hidden animate-in fade-in duration-150">
      {/* ================= FULL VIEWPORT LEAFLET MAP ================= */}
      <div 
        ref={mapContainerRef} 
        className="absolute inset-0 w-full h-full z-10" 
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />

      {/* ================= ULTRA-CLEAN FLOATING TOP CONTROLS ================= */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
        {/* Left: Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-2xl bg-slate-900/85 hover:bg-slate-900 text-white backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg transition-all cursor-pointer pointer-events-auto active:scale-95"
          title="Tutup Peta"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Right: Action Buttons (Pindah Lokasi / Batal / Simpan) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Tombol Pindah Lokasi / Pin Lokasi Rumah */}
          {!isMovingLocation ? (
            <button
              type="button"
              onClick={() => {
                if (!hasPinnedLocation && mapInstanceRef.current) {
                  const center = mapInstanceRef.current.getCenter();
                  setSelectedCoords({ lat: center.lat, lng: center.lng });
                  setHasPinnedLocation(true);
                  setHasChanged(true);
                  if (!markerInstanceRef.current) {
                    const pinIcon = createCustomPinIcon(true);
                    const marker = L.marker([center.lat, center.lng], {
                      draggable: true,
                      icon: pinIcon,
                    }).addTo(mapInstanceRef.current);
                    attachMarkerEvents(marker);
                    markerInstanceRef.current = marker;
                  }
                } else if (markerInstanceRef.current) {
                  markerInstanceRef.current.dragging?.enable();
                  markerInstanceRef.current.setIcon(createCustomPinIcon(true));
                }
                setIsMovingLocation(true);
              }}
              className="h-10 px-4 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/30 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              title={hasPinnedLocation ? 'Klik untuk memindah titik lokasi' : 'Pasang pin lokasi rumah'}
            >
              <MapPin className="w-4 h-4" />
              <span>{hasPinnedLocation ? 'Pindah Lokasi' : 'Pin Lokasi Rumah'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCancelMove}
              className="h-10 px-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold backdrop-blur-md border border-white/10 flex items-center gap-1 transition-all cursor-pointer"
              title="Batalkan perubahan titik"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Batal</span>
            </button>
          )}

          {/* Tombol Simpan - Muncul Saat Lokasi Sudah Ditandai */}
          {hasPinnedLocation && (
            <button
              type="button"
              onClick={handleConfirmLocation}
              className="h-10 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-700/30 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 animate-in fade-in zoom-in-95 duration-150"
              title="Gunakan titik lokasi ini"
            >
              <Check className="w-4 h-4" />
              <span>Gunakan Titik</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Guidance Banner when moving location or when no pin yet */}
      {(isMovingLocation || !hasPinnedLocation) && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-sky-500/40 text-sky-200 text-xs font-medium shadow-xl pointer-events-none flex items-center gap-1.5 animate-in fade-in duration-150">
          <MapPin className="w-3.5 h-3.5 text-rose-500" />
          <span>{!hasPinnedLocation ? 'Ketuk pada peta untuk memasang pin lokasi rumah' : 'Ketuk peta atau geser pin untuk menentukan titik'}</span>
        </div>
      )}

      {/* Floating Success Feedback Toast */}
      {showSavedFeedback && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full bg-emerald-600/95 backdrop-blur-md text-white text-xs font-semibold shadow-xl pointer-events-none flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Check className="w-4 h-4 text-white" />
          <span>Titik lokasi berhasil disimpan</span>
        </div>
      )}

      {/* Floating GPS Status Notification Toast */}
      {gpsNotification && (
        <div className={`absolute top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full backdrop-blur-md text-xs font-semibold shadow-2xl flex items-center gap-2 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200 border whitespace-nowrap ${
          gpsNotification.type === 'loading'
            ? 'bg-slate-900/95 border-sky-500/50 text-sky-200'
            : gpsNotification.type === 'success'
            ? 'bg-emerald-600/95 border-emerald-400/50 text-white'
            : gpsNotification.type === 'warning'
            ? 'bg-amber-600/95 border-amber-400/50 text-white'
            : 'bg-rose-600/95 border-rose-400/50 text-white'
        }`}>
          {gpsNotification.type === 'loading' && <Loader2 className="w-4 h-4 animate-spin text-sky-400 shrink-0" />}
          {gpsNotification.type === 'success' && <Check className="w-4 h-4 text-white shrink-0" />}
          {gpsNotification.type === 'warning' && <Navigation className="w-4 h-4 text-white shrink-0" />}
          {gpsNotification.type === 'error' && <X className="w-4 h-4 text-white shrink-0" />}
          <span>{gpsNotification.message}</span>
        </div>
      )}

      {/* ================= TOMBOL PINDAH KE TITIK LOKASI SAAT INI (GPS) DI BAWAH TENGAH ================= */}
      {isMovingLocation && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 pointer-events-auto animate-in slide-in-from-bottom-3 fade-in duration-200 w-auto px-4 max-w-full">
          <button
            type="button"
            onClick={handleMoveToCurrentLocation}
            disabled={isLocating}
            className="h-12 px-5 rounded-2xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-2xl shadow-sky-950/70 border border-sky-400/40 backdrop-blur-md flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-60 whitespace-nowrap"
            title="Akses GPS perangkat untuk pindah ke titik lokasi saat ini"
          >
            {isLocating ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-white shrink-0" />
            ) : (
              <Navigation className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white shrink-0" />
            )}
            <span>Pindah ke Titik Lokasi Saat Ini</span>
          </button>
        </div>
      )}

      {/* ================= BOTTOM CARD: DETAIL KOORDINAT & TOMBOL RUTE GOOGLE MAPS (KETUK PIN) ================= */}
      {showBottomDetailCard && (
        <div className="absolute bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 bg-slate-900/95 backdrop-blur-xl border border-white/15 text-white p-4 rounded-3xl shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-200 pointer-events-auto">
          {/* Card Header */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-rose-400 font-bold uppercase tracking-wide">
                <MapPin className="w-3.5 h-3.5 fill-rose-500 text-rose-500 shrink-0" />
                <span>Titik Tag Lokasi</span>
              </div>
              <h4 className="text-sm font-semibold text-white truncate mt-0.5" title={detectedHint?.displayName || currentAddressLabel || 'Alamat Terpilih'}>
                {detectedHint?.village || detectedHint?.subdistrict || currentAddressLabel || 'Titik Lokasi Terpilih'}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setShowBottomDetailCard(false)}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Tutup Detail"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Full address summary if detected */}
          {detectedHint?.displayName && (
            <p className="text-[11px] text-slate-300 line-clamp-2 mb-2.5">
              {detectedHint.displayName}
            </p>
          )}

          {/* Coordinates display box with copy button */}
          <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-2xl px-3 py-2 mb-3">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] text-slate-400 font-semibold uppercase shrink-0">Koordinat:</span>
              <span className="font-mono text-xs text-emerald-400 font-medium truncate select-all">
                {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyCoords}
              className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium cursor-pointer shrink-0 ml-2"
              title="Salin Koordinat"
            >
              <Copy className="w-3 h-3" />
              <span>{copiedCoords ? 'Tersalin!' : 'Salin'}</span>
            </button>
          </div>

          {/* Action Row: Tombol Google Maps & Hapus */}
          <div className="flex items-center gap-2">
            {/* Tombol Google Maps */}
            <button
              type="button"
              onClick={handleOpenGoogleMapsRoute}
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-95 cursor-pointer"
            >
              <Navigation className="w-4 h-4 fill-white shrink-0" />
              <span>Google Maps</span>
            </button>

            {/* Tombol Hapus */}
            <button
              type="button"
              onClick={handleDeleteLocation}
              className="py-2.5 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-rose-500/40 transition-all active:scale-95 cursor-pointer"
              title="Hapus Titik Tag Lokasi"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Hapus</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL BANTUAN / IZIN LOKASI BROWSER ================= */}
      {showPermissionModal && (
        <div className="fixed inset-0 z-[100000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 pointer-events-auto">
          <div className="bg-slate-900 border border-white/15 text-white w-full max-w-md rounded-3xl p-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
                  <Navigation className="w-5 h-5 fill-sky-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Izin Lokasi Browser</h3>
                  <p className="text-xs text-slate-400">Akses GPS dibutuhkan untuk mengunci titik</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPermissionModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-800/80 border border-white/10 rounded-2xl p-3.5 mb-4 text-xs text-slate-300 space-y-2">
              <p>
                Browser mendeteksi izin lokasi belum aktif atau dibatasi oleh jendela pratinjau (iframe).
              </p>
              <div className="bg-black/30 rounded-xl p-2.5 space-y-1.5 text-[11px] text-slate-300">
                <p className="font-semibold text-sky-300">Langkah mengizinkan di Chrome:</p>
                <div className="flex items-start gap-1.5">
                  <span className="font-mono text-sky-400 font-bold">1.</span>
                  <span>Ketuk ikon <b>Gembok (🔒)</b> atau ikon setelan di sebelah kiri kolom alamat Chrome.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="font-mono text-sky-400 font-bold">2.</span>
                  <span>Pilih <b>Izin (Permissions)</b> → Aktifkan <b>Lokasi (Location)</b>.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="font-mono text-sky-400 font-bold">3.</span>
                  <span>Tekan tombol <b>Minta Izin Ulang</b> di bawah ini.</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowPermissionModal(false);
                  handleMoveToCurrentLocation();
                }}
                className="flex-1 py-3 px-4 rounded-2xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Navigation className="w-4 h-4 fill-white" />
                <span>Minta Izin Ulang</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.open(window.location.href, '_blank', 'noopener,noreferrer');
                }}
                className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold text-xs border border-white/15 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Buka langsung di tab browser baru"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Buka di Tab Baru</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
