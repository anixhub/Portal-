import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  MapPin, 
  Navigation, 
  User, 
  ArrowLeft,
  ArrowUpRight,
  Home,
  Shield,
  Eye,
  Loader2,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import L from 'leaflet';
import { AlumniRecord } from '../../types';
import { AlumniProfileCardModal } from './AlumniProfileCardModal';
import { FullscreenLocationMapModal, LocationCoordinates } from './FullscreenLocationMapModal';

interface AlumniDistributionMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  alumniList: AlumniRecord[];
  currentUser: AlumniRecord;
  deviceGps?: { lat: number; lng: number } | null;
  onSelectAlumni: (alumni: AlumniRecord) => void;
  onUpdateProfile?: (updated: Partial<AlumniRecord>) => void;
}

// Master list of Indonesian locations (Provinces, Regencies, Cities, and Districts)
const INDONESIA_LOCATIONS: Array<{
  name: string;
  type: 'provinsi' | 'kota' | 'kabupaten' | 'kecamatan';
  parent?: string;
  lat: number;
  lng: number;
  zoom: number;
}> = [
  // 34 Provinsi di Indonesia
  { name: 'Aceh', type: 'provinsi', lat: 4.6951, lng: 96.7494, zoom: 7 },
  { name: 'Sumatera Utara', type: 'provinsi', lat: 2.1154, lng: 99.5451, zoom: 7 },
  { name: 'Sumatera Barat', type: 'provinsi', lat: -0.7399, lng: 100.8000, zoom: 7 },
  { name: 'Riau', type: 'provinsi', lat: 0.2933, lng: 101.7068, zoom: 7 },
  { name: 'Kepulauan Riau', type: 'provinsi', lat: 3.9457, lng: 108.1429, zoom: 7 },
  { name: 'Jambi', type: 'provinsi', lat: -1.6101, lng: 103.6131, zoom: 7 },
  { name: 'Sumatera Selatan', type: 'provinsi', lat: -3.3194, lng: 104.9144, zoom: 7 },
  { name: 'Bangka Belitung', type: 'provinsi', lat: -2.7411, lng: 106.4406, zoom: 7 },
  { name: 'Bengkulu', type: 'provinsi', lat: -3.5778, lng: 102.3464, zoom: 7 },
  { name: 'Lampung', type: 'provinsi', lat: -4.5586, lng: 105.4068, zoom: 7 },
  { name: 'DKI Jakarta', type: 'provinsi', lat: -6.2088, lng: 106.8456, zoom: 11 },
  { name: 'Banten', type: 'provinsi', lat: -6.4058, lng: 106.0640, zoom: 9 },
  { name: 'Jawa Barat', type: 'provinsi', lat: -6.9175, lng: 107.6191, zoom: 8 },
  { name: 'Jawa Tengah', type: 'provinsi', lat: -7.1510, lng: 110.1403, zoom: 8 },
  { name: 'DI Yogyakarta', type: 'provinsi', lat: -7.7956, lng: 110.3695, zoom: 10 },
  { name: 'Jawa Timur', type: 'provinsi', lat: -7.5361, lng: 112.2384, zoom: 8 },
  { name: 'Bali', type: 'provinsi', lat: -8.4095, lng: 115.1889, zoom: 9 },
  { name: 'Nusa Tenggara Barat', type: 'provinsi', lat: -8.6529, lng: 117.3616, zoom: 8 },
  { name: 'Nusa Tenggara Timur', type: 'provinsi', lat: -8.6574, lng: 121.0794, zoom: 8 },
  { name: 'Kalimantan Barat', type: 'provinsi', lat: -0.2787, lng: 111.4753, zoom: 7 },
  { name: 'Kalimantan Tengah', type: 'provinsi', lat: -1.6815, lng: 113.3824, zoom: 7 },
  { name: 'Kalimantan Selatan', type: 'provinsi', lat: -3.0926, lng: 115.2838, zoom: 7 },
  { name: 'Kalimantan Timur', type: 'provinsi', lat: 0.5387, lng: 116.4194, zoom: 7 },
  { name: 'Kalimantan Utara', type: 'provinsi', lat: 3.0731, lng: 116.0414, zoom: 7 },
  { name: 'Sulawesi Utara', type: 'provinsi', lat: 0.6247, lng: 123.9750, zoom: 7 },
  { name: 'Gorontalo', type: 'provinsi', lat: 0.6999, lng: 122.4467, zoom: 8 },
  { name: 'Sulawesi Tengah', type: 'provinsi', lat: -1.4300, lng: 121.4456, zoom: 7 },
  { name: 'Sulawesi Barat', type: 'provinsi', lat: -2.8441, lng: 119.2321, zoom: 7 },
  { name: 'Sulawesi Selatan', type: 'provinsi', lat: -3.6687, lng: 119.9741, zoom: 7 },
  { name: 'Sulawesi Tenggara', type: 'provinsi', lat: -4.1449, lng: 122.1746, zoom: 7 },
  { name: 'Maluku', type: 'provinsi', lat: -3.2385, lng: 130.1453, zoom: 7 },
  { name: 'Maluku Utara', type: 'provinsi', lat: 1.5709, lng: 127.8088, zoom: 7 },
  { name: 'Papua', type: 'provinsi', lat: -4.2699, lng: 138.0804, zoom: 6 },
  { name: 'Papua Barat', type: 'provinsi', lat: -1.3361, lng: 133.1747, zoom: 6 },

  // Kabupaten, Kota, & Kecamatan
  { name: 'Rembang', type: 'kabupaten', parent: 'Jawa Tengah', lat: -6.7118, lng: 111.3411, zoom: 12 },
  { name: 'Sedan', type: 'kecamatan', parent: 'Kabupaten Rembang', lat: -6.7565, lng: 111.5167, zoom: 14 },
  { name: 'Sarang', type: 'kecamatan', parent: 'Kabupaten Rembang', lat: -6.7412, lng: 111.6625, zoom: 14 },
  { name: 'Lasem', type: 'kecamatan', parent: 'Kabupaten Rembang', lat: -6.6925, lng: 111.4528, zoom: 14 },
  { name: 'Kragan', type: 'kecamatan', parent: 'Kabupaten Rembang', lat: -6.6997, lng: 111.5936, zoom: 14 },
  { name: 'Pamotan', type: 'kecamatan', parent: 'Kabupaten Rembang', lat: -6.7649, lng: 111.4883, zoom: 14 },

  { name: 'Pati', type: 'kabupaten', parent: 'Jawa Tengah', lat: -6.7533, lng: 111.0378, zoom: 12 },
  { name: 'Kudus', type: 'kabupaten', parent: 'Jawa Tengah', lat: -6.8048, lng: 110.8405, zoom: 12 },
  { name: 'Jepara', type: 'kabupaten', parent: 'Jawa Tengah', lat: -6.5888, lng: 110.6684, zoom: 12 },
  { name: 'Blora', type: 'kabupaten', parent: 'Jawa Tengah', lat: -6.9698, lng: 111.4184, zoom: 12 },
  { name: 'Semarang', type: 'kota', parent: 'Jawa Tengah', lat: -6.9932, lng: 110.4203, zoom: 12 },
  { name: 'Surakarta / Solo', type: 'kota', parent: 'Jawa Tengah', lat: -7.5755, lng: 110.8243, zoom: 12 },

  { name: 'Tuban', type: 'kabupaten', parent: 'Jawa Timur', lat: -6.8976, lng: 112.0649, zoom: 12 },
  { name: 'Bojonegoro', type: 'kabupaten', parent: 'Jawa Timur', lat: -7.1502, lng: 111.8817, zoom: 12 },
  { name: 'Lamongan', type: 'kabupaten', parent: 'Jawa Timur', lat: -7.1199, lng: 112.4158, zoom: 12 },
  { name: 'Surabaya', type: 'kota', parent: 'Jawa Timur', lat: -7.2575, lng: 112.7521, zoom: 12 },
  { name: 'Sidoarjo', type: 'kabupaten', parent: 'Jawa Timur', lat: -7.4478, lng: 112.7183, zoom: 12 },
  { name: 'Malang', type: 'kota', parent: 'Jawa Timur', lat: -7.9826, lng: 112.6308, zoom: 12 },
  { name: 'Batu', type: 'kota', parent: 'Jawa Timur', lat: -7.8712, lng: 112.5270, zoom: 12 },
  { name: 'Kediri', type: 'kota', parent: 'Jawa Timur', lat: -7.8228, lng: 112.0118, zoom: 12 },
  { name: 'Jombang', type: 'kabupaten', parent: 'Jawa Timur', lat: -7.5458, lng: 112.2331, zoom: 12 },
  { name: 'Pasuruan', type: 'kota', parent: 'Jawa Timur', lat: -7.6453, lng: 112.9075, zoom: 12 },
  { name: 'Jember', type: 'kabupaten', parent: 'Jawa Timur', lat: -8.1724, lng: 113.7007, zoom: 12 },
  { name: 'Banyuwangi', type: 'kabupaten', parent: 'Jawa Timur', lat: -8.2192, lng: 114.3692, zoom: 12 },

  { name: 'Jakarta Selatan', type: 'kota', parent: 'DKI Jakarta', lat: -6.2615, lng: 106.8106, zoom: 12 },
  { name: 'Jakarta Pusat', type: 'kota', parent: 'DKI Jakarta', lat: -6.1805, lng: 106.8284, zoom: 12 },
  { name: 'Jakarta Barat', type: 'kota', parent: 'DKI Jakarta', lat: -6.1683, lng: 106.7588, zoom: 12 },
  { name: 'Jakarta Timur', type: 'kota', parent: 'DKI Jakarta', lat: -6.2250, lng: 106.9004, zoom: 12 },
  { name: 'Jakarta Utara', type: 'kota', parent: 'DKI Jakarta', lat: -6.1384, lng: 106.8640, zoom: 12 },

  { name: 'Bandung', type: 'kota', parent: 'Jawa Barat', lat: -6.9175, lng: 107.6191, zoom: 12 },
  { name: 'Bekasi', type: 'kota', parent: 'Jawa Barat', lat: -6.2383, lng: 106.9756, zoom: 12 },
  { name: 'Depok', type: 'kota', parent: 'Jawa Barat', lat: -6.4025, lng: 106.7942, zoom: 12 },
  { name: 'Bogor', type: 'kota', parent: 'Jawa Barat', lat: -6.5971, lng: 106.8060, zoom: 12 },

  { name: 'Tangerang', type: 'kota', parent: 'Banten', lat: -6.1783, lng: 106.6319, zoom: 12 },
  { name: 'Yogyakarta', type: 'kota', parent: 'DI Yogyakarta', lat: -7.7956, lng: 110.3695, zoom: 12 },
  { name: 'Denpasar', type: 'kota', parent: 'Bali', lat: -8.6705, lng: 115.2126, zoom: 12 },
  { name: 'Medan', type: 'kota', parent: 'Sumatera Utara', lat: 3.5952, lng: 98.6722, zoom: 12 },
  { name: 'Palembang', type: 'kota', parent: 'Sumatera Selatan', lat: -2.9761, lng: 104.7754, zoom: 12 },
  { name: 'Makassar', type: 'kota', parent: 'Sulawesi Selatan', lat: -5.1477, lng: 119.4327, zoom: 12 },
];

export const AlumniDistributionMapModal: React.FC<AlumniDistributionMapModalProps> = ({
  isOpen,
  onClose,
  alumniList,
  currentUser,
  deviceGps,
  onSelectAlumni,
  onUpdateProfile,
}) => {
  const initialCoord = deviceGps || 
    (currentUser.coordinates?.lat && currentUser.coordinates?.lng
      ? { lat: currentUser.coordinates.lat, lng: currentUser.coordinates.lng }
      : { lat: -6.7423, lng: 111.4589 });

  const [selectedAlumni, setSelectedAlumni] = useState<AlumniRecord | null>(null);
  const [realtimeGps, setRealtimeGps] = useState<{ lat: number; lng: number }>(initialCoord);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isShowingRealtimeGpsDetail, setIsShowingRealtimeGpsDetail] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [hideTags, setHideTags] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Bottom Sheet State: 'hidden' | 'half' (60% height) | 'collapsed' (only header box at bottom)
  const [bottomSheetState, setBottomSheetState] = useState<'hidden' | 'half' | 'collapsed'>('hidden');

  // Fullscreen Search Overlay State
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const [searchOverlayQuery, setSearchOverlayQuery] = useState('');
  const [dynamicNominatimResults, setDynamicNominatimResults] = useState<any[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Touch Drag for Bottom Sheet Header Box
  const touchStartYRef = useRef<number | null>(null);

  // Profile Modal State (opens Alumni Profile in modal on top of map)
  const [detailModalAlumni, setDetailModalAlumni] = useState<AlumniRecord | null>(null);

  // Profile & Privacy Settings Bottom Sheet State
  const [isProfileBottomSheetOpen, setIsProfileBottomSheetOpen] = useState(false);
  const [shareLocationTag, setShareLocationTag] = useState<boolean>(currentUser.shareLocationTag !== false);
  const [shareFullAddress, setShareFullAddress] = useState<boolean>(currentUser.shareFullAddress !== false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [showLocationNotSetPopup, setShowLocationNotSetPopup] = useState(false);
  const locationNotSetTimerRef = useRef<any>(null);

  const isLocationTagSet = Boolean(currentUser?.coordinates?.lat && currentUser?.coordinates?.lng);

  const handleTriggerDisabledLocationTag = () => {
    setShowLocationNotSetPopup(true);
    if (locationNotSetTimerRef.current) clearTimeout(locationNotSetTimerRef.current);
    locationNotSetTimerRef.current = setTimeout(() => {
      setShowLocationNotSetPopup(false);
    }, 2500);
  };

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const gpsMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    setShareLocationTag(currentUser.shareLocationTag !== false);
    setShareFullAddress(currentUser.shareFullAddress !== false);
  }, [currentUser.shareLocationTag, currentUser.shareFullAddress]);

  const userKecamatan = currentUser.kecamatan || 'Sedan';
  const userKabupaten = (currentUser.city || 'Rembang').replace(/^(KABUPATEN|KOTA|Kab\.|Kota)\s*/i, '');
  const userProvinsi = currentUser.province || 'Jawa Tengah';

  const locationTags = [
    { id: 'kec', label: `Kec. ${userKecamatan}`, searchVal: userKecamatan, type: 'kecamatan', name: userKecamatan },
    { id: 'kab', label: `Kab. ${userKabupaten}`, searchVal: userKabupaten, type: 'kabupaten', name: userKabupaten },
    { id: 'prov', label: `Prov. ${userProvinsi}`, searchVal: userProvinsi, type: 'provinsi', name: userProvinsi },
  ];

  useEffect(() => {
    if (deviceGps) {
      setRealtimeGps(deviceGps);
    }
  }, [deviceGps]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const permittedAlumni = alumniList.filter((item) => {
    if (item.id === currentUser.id) {
      return shareLocationTag && Boolean(item.coordinates?.lat && item.coordinates?.lng);
    }
    return item.shareLocationTag !== false && Boolean(item.coordinates?.lat && item.coordinates?.lng);
  });

  const getDistanceFromGps = (destLat?: number, destLng?: number): number | null => {
    if (!destLat || !destLng || !realtimeGps) return null;
    const lat1 = realtimeGps.lat;
    const lon1 = realtimeGps.lng;
    const R = 6371;
    const dLat = ((destLat - lat1) * Math.PI) / 180;
    const dLon = ((destLng - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((destLat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const cleanQuery = searchFilter
    .toLowerCase()
    .trim()
    .replace(/^(kec\.|kab\.|prov\.|kecamatan|kabupaten|kota)\s*/i, '');

  const displayedAlumni = cleanQuery
    ? permittedAlumni.filter((a) => {
        const nameMatch = a.name.toLowerCase().includes(cleanQuery);
        const cityMatch = a.city.toLowerCase().includes(cleanQuery);
        const kecMatch = a.kecamatan ? a.kecamatan.toLowerCase().includes(cleanQuery) : false;
        const provMatch = a.province.toLowerCase().includes(cleanQuery);
        const desaMatch = a.desa ? a.desa.toLowerCase().includes(cleanQuery) : false;
        return nameMatch || cityMatch || kecMatch || provMatch || desaMatch;
      })
    : permittedAlumni;

  // Real-time GPS Geolocation Tracker
  useEffect(() => {
    if (!isOpen) return;

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setRealtimeGps(coords);
          setGpsAccuracy(Math.round(pos.coords.accuracy || 10));

          if (mapInstanceRef.current && !searchFilter) {
            mapInstanceRef.current.setView([coords.lat, coords.lng], 15, { animate: false });
          }
        },
        () => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              setRealtimeGps(coords);
              setGpsAccuracy(Math.round(pos.coords.accuracy || 30));
            },
            () => {},
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
          );
        },
        { enableHighAccuracy: true, timeout: 4500, maximumAge: 15000 }
      );

      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setRealtimeGps(coords);
          setGpsAccuracy(Math.round(pos.coords.accuracy || 10));
        },
        () => {},
        { enableHighAccuracy: false, maximumAge: 5000 }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [isOpen]);

  // Dynamic OpenStreetMap Nominatim search across Indonesia
  useEffect(() => {
    if (!searchOverlayQuery.trim() || searchOverlayQuery.length < 2) {
      setDynamicNominatimResults([]);
      setIsSearchingOnline(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingOnline(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&countrycodes=id&limit=6&q=${encodeURIComponent(
            searchOverlayQuery
          )}`,
          {
            headers: {
              'Accept-Language': 'id',
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setDynamicNominatimResults(data);
        }
      } catch (err) {
        console.warn('Nominatim search:', err);
      } finally {
        setIsSearchingOnline(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchOverlayQuery]);

  // Combined Search: Search both Alumni Names and Locations Across Indonesia
  // "Pada pencarian selain bisa cari lokasi juga bisa cari nama alumni."
  const { matchingAlumniResults, matchingLocationResults } = useMemo(() => {
    const q = searchOverlayQuery.toLowerCase().trim();

    if (!q) {
      // Empty search query -> show user's 3 territories as quick shortcuts
      const userLocs = [
        {
          id: 'user-kec',
          title: userKecamatan,
          subtitle: `Kecamatan domisili Anda di ${userKabupaten}`,
          lat: -6.7565,
          lng: 111.5167,
          zoom: 14,
          distance: getDistanceFromGps(-6.7565, 111.5167),
        },
        {
          id: 'user-kab',
          title: userKabupaten,
          subtitle: `Kabupaten/Kota domisili Anda di ${userProvinsi}`,
          lat: -6.7118,
          lng: 111.3411,
          zoom: 12,
          distance: getDistanceFromGps(-6.7118, 111.3411),
        },
        {
          id: 'user-prov',
          title: userProvinsi,
          subtitle: `Provinsi domisili Anda`,
          lat: -7.1510,
          lng: 110.1403,
          zoom: 8,
          distance: getDistanceFromGps(-7.1510, 110.1403),
        },
      ];
      return { matchingAlumniResults: [], matchingLocationResults: userLocs };
    }

    // 1. Alumni matching query
    const alumniMatches = alumniList.filter((a) => {
      const matchName = a.name.toLowerCase().includes(q);
      const matchNis = a.nis ? a.nis.toLowerCase().includes(q) : false;
      const matchOcc = a.occupation ? a.occupation.toLowerCase().includes(q) : false;
      return matchName || matchNis || matchOcc;
    }).slice(0, 8);

    // 2. Locations matching query
    const localLocMatches = INDONESIA_LOCATIONS.filter((loc) =>
      loc.name.toLowerCase().includes(q) || (loc.parent && loc.parent.toLowerCase().includes(q))
    ).map((loc) => ({
      id: `loc-${loc.name}-${loc.lat}`,
      title: loc.name,
      subtitle: loc.parent ? `${loc.type === 'kecamatan' ? 'Kecamatan di ' : ''}${loc.parent}` : `Provinsi di Indonesia`,
      lat: loc.lat,
      lng: loc.lng,
      zoom: loc.zoom,
      distance: getDistanceFromGps(loc.lat, loc.lng),
    }));

    const onlineLocMatches = dynamicNominatimResults.map((item) => ({
      id: `osm-${item.place_id}`,
      title: item.display_name.split(',')[0],
      subtitle: item.display_name.split(',').slice(1, 4).join(',').trim(),
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      zoom: 13,
      distance: getDistanceFromGps(parseFloat(item.lat), parseFloat(item.lon)),
    }));

    const seen = new Set<string>();
    const combinedLocs = [...localLocMatches, ...onlineLocMatches].filter((item) => {
      const key = item.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 10);

    return { matchingAlumniResults: alumniMatches, matchingLocationResults: combinedLocs };
  }, [searchOverlayQuery, dynamicNominatimResults, alumniList, userKecamatan, userKabupaten, userProvinsi]);

  // Helper to resolve coordinates
  const resolveLocation = (name: string) => {
    const clean = name.toLowerCase().trim();
    const found = INDONESIA_LOCATIONS.find((loc) => loc.name.toLowerCase().includes(clean));
    if (found) {
      return { lat: found.lat, lng: found.lng, zoom: found.zoom };
    }
    return { lat: -6.7423, lng: 111.4589, zoom: 12 };
  };

  /**
   * Center map on an alumni pin:
   * When bottom sheet is expanded (60% height), the exposed map area is top 40%.
   * Shifts center so marker is in exact center of top 40% area.
   */
  const centerMapOnAlumni = (alumni: AlumniRecord, isSheetExpanded: boolean = true) => {
    if (!alumni.coordinates || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const zoom = 16;
    const latLng = L.latLng(alumni.coordinates.lat, alumni.coordinates.lng);

    if (isSheetExpanded) {
      const mapSize = map.getSize();
      const targetPixel = map.project(latLng, zoom);
      const offsetY = mapSize.y * 0.30;
      const adjustedCenterPixel = L.point(targetPixel.x, targetPixel.y + offsetY);
      const adjustedCenterLatLng = map.unproject(adjustedCenterPixel, zoom);
      map.flyTo(adjustedCenterLatLng, zoom, { duration: 0.8 });
    } else {
      const mapSize = map.getSize();
      const targetPixel = map.project(latLng, zoom);
      const offsetY = Math.min(100, mapSize.y * 0.15);
      const adjustedCenterPixel = L.point(targetPixel.x, targetPixel.y + offsetY);
      const adjustedCenterLatLng = map.unproject(adjustedCenterPixel, zoom);
      map.flyTo(adjustedCenterLatLng, zoom, { duration: 0.8 });
    }
  };

  // Tag Click Handler
  const handleTagClick = (tag: { id: string; label: string; searchVal: string; type: string; name: string }) => {
    setSearchFilter(tag.searchVal);
    setHideTags(true);
    setSelectedAlumni(null);
    setIsShowingRealtimeGpsDetail(false);

    const loc = resolveLocation(tag.name);
    if (loc && mapInstanceRef.current) {
      const map = mapInstanceRef.current;
      const targetPixel = map.project(L.latLng(loc.lat, loc.lng), loc.zoom);
      const offsetY = map.getSize().y * 0.30;
      const adjustedCenterLatLng = map.unproject(L.point(targetPixel.x, targetPixel.y + offsetY), loc.zoom);
      map.flyTo(adjustedCenterLatLng, loc.zoom, { duration: 0.9 });
    }

    setBottomSheetState('half');
  };

  // Alumni selected from search list (bottom sheet)
  const handleSelectAlumniFromSheet = (alumni: AlumniRecord) => {
    setSelectedAlumni(alumni);
    setIsShowingRealtimeGpsDetail(false);
    centerMapOnAlumni(alumni, true);
  };

  // Open Route in Google Maps
  const handleOpenGoogleMapsRoute = (alumni: AlumniRecord) => {
    if (!alumni.coordinates) return;
    const destLat = alumni.coordinates.lat;
    const destLng = alumni.coordinates.lng;
    const originParam = `&origin=${realtimeGps.lat},${realtimeGps.lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}${originParam}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Clear search and restore tags
  const handleClearSearch = () => {
    setSearchFilter('');
    setHideTags(false);
    setBottomSheetState('hidden');
    setSelectedAlumni(null);
  };

  // Touch swipe gesture handlers for bottom sheet header box
  // "Cukup untuk klik atau geser ke bawah pada box diatas header bottom sheet untuk menyempitkan atau klik pada peta. Dan untuk meluaskan cukup geser ke atas atau klik pada box tadi."
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartYRef.current;
    
    // Geser ke bawah -> menyempitkan
    if (deltaY > 30 && bottomSheetState === 'half') {
      setBottomSheetState('collapsed');
      if (selectedAlumni) centerMapOnAlumni(selectedAlumni, false);
      touchStartYRef.current = null;
    }
    // Geser ke atas -> meluaskan
    else if (deltaY < -30 && bottomSheetState === 'collapsed') {
      setBottomSheetState('half');
      if (selectedAlumni) centerMapOnAlumni(selectedAlumni, true);
      touchStartYRef.current = null;
    }
  };

  const handleTouchEnd = () => {
    touchStartYRef.current = null;
  };

  // Toggle expand / collapse when tapping the header box
  const handleToggleBottomSheet = () => {
    if (bottomSheetState === 'half') {
      setBottomSheetState('collapsed');
      if (selectedAlumni) centerMapOnAlumni(selectedAlumni, false);
    } else if (bottomSheetState === 'collapsed') {
      setBottomSheetState('half');
      if (selectedAlumni) centerMapOnAlumni(selectedAlumni, true);
    }
  };

  // Leaflet map setup and updates
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    const initialLat = realtimeGps.lat;
    const initialLng = realtimeGps.lng;

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

      // "Saat klik tag lokasi alumni lalu muncul kotak maka saat klik diluar kotak buat kotaknya tertutup."
      // "atau klik area peta buat bottom sheet menyempit dan hanya menampilkan header bottom sheet"
      map.on('click', () => {
        setIsShowingRealtimeGpsDetail(false);
        setSelectedAlumni(null); // Tutup kotak alumni saat klik di luar kotak (peta)
        if (bottomSheetState === 'half') {
          setBottomSheetState('collapsed');
        }
      });
    }

    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // 1. ADD REALTIME GPS MARKER
    const gpsMarkerHtml = `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div class="gps-pulse-ring" style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background: rgba(26, 115, 232, 0.35); pointer-events: none;"></div>
        <div style="position: absolute; width: 28px; height: 28px; border-radius: 9999px; background: rgba(26, 115, 232, 0.25); pointer-events: none;"></div>
        <div style="position: relative; width: 17px; height: 17px; border-radius: 9999px; background: #1a73e8; border: 3px solid #ffffff; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.45), 0 0 14px rgba(26, 115, 232, 0.7);"></div>
      </div>
    `;

    const gpsIcon = L.divIcon({
      className: 'alumni-avatar-pin',
      html: gpsMarkerHtml,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    const gpsMarker = L.marker([realtimeGps.lat, realtimeGps.lng], {
      icon: gpsIcon,
      zIndexOffset: 2000,
    });

    gpsMarker.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      setIsShowingRealtimeGpsDetail(true);
      setSelectedAlumni(null);
      map.panTo([realtimeGps.lat, realtimeGps.lng], { animate: true, duration: 0.35 });
    });

    markersGroup.addLayer(gpsMarker);
    gpsMarkerRef.current = gpsMarker;

    // 2. ADD ALUMNI REGISTERED LOCATION PINS
    displayedAlumni.forEach((alumni) => {
      if (!alumni.coordinates?.lat || !alumni.coordinates?.lng) return;

      const isCurrent = alumni.id === currentUser.id;
      const isSelected = selectedAlumni?.id === alumni.id;
      const lat = alumni.coordinates.lat;
      const lng = alumni.coordinates.lng;

      const photoHtml = alumni.photoUrl
        ? `<img src="${alumni.photoUrl}" alt="${alumni.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 9999px;" />`
        : `<div style="width: 100%; height: 100%; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px; color: white; background: ${
            alumni.gender === 'P'
              ? 'linear-gradient(135deg, #f43f5e, #ec4899)'
              : 'linear-gradient(135deg, #0284c7, #2563eb)'
          };">${alumni.name.charAt(0)}</div>`;

      const markerHtml = `
        <div style="position: relative; cursor: pointer; display: flex; flex-direction: column; align-items: center; transform: translate3d(0,0,0);">
          <div style="width: 44px; height: 44px; border-radius: 9999px; border: 2.5px solid white; box-shadow: 0 10px 25px -3px rgba(0,0,0,0.4); overflow: hidden; background: #e0f2fe; ${
            isSelected
              ? 'box-shadow: 0 0 0 4.5px #0284c7, 0 14px 30px rgba(2,132,199,0.7); transform: scale(1.15);'
              : isCurrent
              ? 'box-shadow: 0 0 0 3px #0284c7, 0 10px 25px -3px rgba(0,0,0,0.5);'
              : ''
          }">
            ${photoHtml}
          </div>
          <div style="width: 10px; height: 10px; background-color: ${
            isSelected ? '#0284c7' : isCurrent ? '#0284c7' : '#0369a1'
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
        centerMapOnAlumni(alumni, bottomSheetState === 'half');
      });

      markersGroup.addLayer(marker);
    });

    setTimeout(() => {
      if (!mapInstanceRef.current) return;
      mapInstanceRef.current.invalidateSize();
    }, 100);

  }, [isOpen, displayedAlumni.length, realtimeGps.lat, realtimeGps.lng, selectedAlumni?.id, shareLocationTag, bottomSheetState]);

  // Clean cleanup on modal close
  useEffect(() => {
    if (!isOpen && mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      gpsMarkerRef.current = null;
      setSelectedAlumni(null);
      setIsShowingRealtimeGpsDetail(false);
      setSearchFilter('');
      setHideTags(false);
      setBottomSheetState('hidden');
      setIsSearchOverlayOpen(false);
      setIsProfileBottomSheetOpen(false);
      setDetailModalAlumni(null);
    }
  }, [isOpen]);

  // Pusatkan ke Lokasi Terkini Realtime Saya (GPS)
  const handleCenterUser = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([realtimeGps.lat, realtimeGps.lng], 16, { animate: true });
    setIsShowingRealtimeGpsDetail(true);
    setSelectedAlumni(null);
    showToast('Memusatkan ke lokasi realtime Anda');

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setRealtimeGps(coords);
          setGpsAccuracy(Math.round(pos.coords.accuracy || 10));
          mapInstanceRef.current?.panTo([coords.lat, coords.lng], { animate: true, duration: 0.35 });
        },
        () => {},
        { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
      );
    }
  };

  // Pusatkan ke Tag Rumah Saya
  const handleCenterHome = () => {
    if (!mapInstanceRef.current) return;
    if (currentUser.coordinates?.lat && currentUser.coordinates?.lng) {
      mapInstanceRef.current.setView(
        [currentUser.coordinates.lat, currentUser.coordinates.lng],
        16,
        { animate: true }
      );
      setSelectedAlumni(currentUser);
      setIsShowingRealtimeGpsDetail(false);
      showToast('Memusatkan ke Rumah Anda');
    } else {
      showToast('Tag koordinat rumah belum diatur.');
    }
  };

  // Profile Privacy Toggles Handlers
  const handleToggleShareLocation = (val: boolean) => {
    setShareLocationTag(val);
    onUpdateProfile?.({ shareLocationTag: val });
    showToast(val ? 'Tag lokasi rumah diaktifkan di peta' : 'Tag lokasi rumah disembunyikan dari peta');
  };

  const handleToggleShareFullAddress = (val: boolean) => {
    setShareFullAddress(val);
    onUpdateProfile?.({ shareFullAddress: val });
    showToast(val ? 'Alamat lengkap ditampilkan ke alumni' : 'Alamat lengkap disembunyikan');
  };

  // Click on an Alumni search result
  // "Kalau klik hasil berupa alumni maka akan langsung memusatkan ke alamat alumni"
  const handleSelectAlumniFromSearchOverlay = (alumni: AlumniRecord) => {
    setSearchFilter(alumni.name);
    setSelectedAlumni(alumni);
    setIsSearchOverlayOpen(false);
    setBottomSheetState('hidden'); // Tidak buka bottomsheet wilayah, langsung fokus ke alumni
    setIsShowingRealtimeGpsDetail(false);

    if (alumni.coordinates && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(
        [alumni.coordinates.lat, alumni.coordinates.lng],
        16,
        { duration: 0.8 }
      );
    }
  };

  // Click on a Location search result
  // "kalau yg diklik hasil alamat maka akan muncul bottomsheet nama nama alumni di alamat itu."
  const handleSelectLocationFromSearchOverlay = (item: { title: string; lat: number; lng: number; zoom: number }) => {
    setSearchFilter(item.title);
    setHideTags(true);
    setIsSearchOverlayOpen(false);
    setSelectedAlumni(null);

    if (mapInstanceRef.current) {
      const map = mapInstanceRef.current;
      const targetPixel = map.project(L.latLng(item.lat, item.lng), item.zoom);
      const offsetY = map.getSize().y * 0.30;
      const adjustedCenterLatLng = map.unproject(L.point(targetPixel.x, targetPixel.y + offsetY), item.zoom);
      map.flyTo(adjustedCenterLatLng, item.zoom, { duration: 0.9 });
    }

    setBottomSheetState('half'); // Muncul bottomsheet nama-nama alumni di alamat itu
  };

  if (!isOpen) return null;

  // Cek apakah ada input apapun di kotak cari
  const hasSearchInput = Boolean(searchFilter.trim());

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex flex-col bg-slate-900 animate-in fade-in duration-200 select-none overflow-hidden">
      {/* ================= 1. TOP FLOATING APP BAR & LOCATION TAGS ================= */}
      <div className="absolute top-3 inset-x-3 sm:top-4 sm:inset-x-4 z-[1000] flex flex-col gap-2 pointer-events-none max-w-2xl mx-auto">
        <div className="flex items-center gap-2 pointer-events-auto bg-white rounded-full px-3.5 py-2.5 shadow-[0_4px_22px_rgba(0,0,0,0.16)] border border-slate-200/90 transition-all">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 -ml-1 rounded-full hover:bg-slate-100 active:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Kembali ke Aplikasi"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>

          <div 
            onClick={() => {
              setSearchOverlayQuery(searchFilter);
              setIsSearchOverlayOpen(true);
              setTimeout(() => searchInputRef.current?.focus(), 80);
            }}
            className="flex-1 relative flex items-center min-w-0 cursor-text"
          >
            <input
              type="text"
              readOnly
              value={searchFilter}
              placeholder="Cari alumni atau lokasi..."
              className="w-full bg-transparent text-sm sm:text-base text-slate-800 placeholder-slate-500 font-medium focus:outline-none px-1 cursor-pointer"
            />
            {searchFilter && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearSearch();
                }}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                title="Hapus pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Badge Avatar Profil Pengguna:
              "Saat mode cari atau kotak carinada inputnya apapun itu buat lingkarang profil di kanan kotak cari gaada." */}
          {!hasSearchInput && !isSearchOverlayOpen && (
            <div
              onClick={() => setIsProfileBottomSheetOpen(true)}
              className="cursor-pointer shrink-0 ml-0.5 active:scale-95 transition-transform"
              title="Profil & Pengaturan Akun"
            >
              {currentUser.photoUrl ? (
                <img
                  src={currentUser.photoUrl}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-600 shadow-xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-sm shadow-xs border border-white">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'M'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tag Wilayah di Bawah Kotak Cari */}
        {!hideTags && !searchFilter && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pointer-events-auto px-1 py-1 animate-in fade-in duration-200">
            {locationTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleTagClick(tag)}
                className="rounded-full px-3.5 py-1.5 flex items-center gap-1.5 text-xs font-semibold shadow-md border transition-all cursor-pointer whitespace-nowrap active:scale-95 bg-white border-slate-200/90 text-slate-800 hover:bg-slate-50"
              >
                <MapPin className="w-3.5 h-3.5 text-slate-600" />
                <span>{tag.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ================= TOAST NOTIFICATION BADGE ================= */}
      {toastMessage && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-[1001] px-4 py-2 rounded-full bg-slate-900/95 backdrop-blur-md text-white text-xs font-medium shadow-2xl border border-white/20 animate-in fade-in slide-in-from-top-2 duration-150 pointer-events-none whitespace-nowrap flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= 2. MAP CANVAS CONTAINER ================= */}
      <div className="relative w-full h-full flex-1">
        <div ref={mapContainerRef} className="w-full h-full z-0 bg-slate-100" />
      </div>

      {/* ================= 3. TOMBOL AKSI PUSATKAN LOKASI & PUSATKAN KE RUMAH ================= */}
      <div
        className={`absolute right-4 z-[1000] flex flex-col gap-2.5 transition-all duration-300 pointer-events-auto ${
          bottomSheetState === 'half'
            ? 'bottom-[62vh]'
            : bottomSheetState === 'collapsed'
            ? selectedAlumni
              ? 'bottom-56'
              : 'bottom-20'
            : isShowingRealtimeGpsDetail
            ? 'bottom-28'
            : selectedAlumni
            ? 'bottom-36'
            : 'bottom-6'
        }`}
      >
        <button
          type="button"
          onClick={handleCenterUser}
          className="w-12 h-12 sm:w-13 sm:h-13 rounded-[22px] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.18)] border border-slate-100 flex items-center justify-center cursor-pointer transition-all active:scale-90 hover:shadow-2xl select-none"
          title="Pusatkan ke Lokasi GPS Terkini Saya"
        >
          <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-[#dbe9fe] flex items-center justify-center">
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#0066ff] ring-2 ring-white shadow-xs" />
          </div>
        </button>

        <button
          type="button"
          onClick={handleCenterHome}
          className="w-12 h-12 sm:w-13 sm:h-13 rounded-[22px] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.18)] border border-slate-100 flex items-center justify-center cursor-pointer transition-all active:scale-90 hover:shadow-2xl select-none group"
          title="Pusatkan ke Rumah Saya"
        >
          <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-slate-100 group-hover:bg-sky-50 text-slate-700 group-hover:text-sky-600 flex items-center justify-center transition-colors">
            <Home className="w-4.5 h-4.5 text-slate-700 group-hover:text-sky-600 transition-colors" />
          </div>
        </button>
      </div>

      {/* ================= 4. BOTTOM SHEET 60% LAYAR (DAFTAR ALUMNI HASIL PENCARIAN ALAMAT) =================
          "Hapus tombol sempitkan. Daftar. Dan x. Cukup untuk klik atau geser ke bawah pada box diatas header bottom sheet untuk menyempitkan atau klik pada peta. Dan untuk meluaskan cukup geser ke atas atau klik pada box tadi." */}
      {bottomSheetState === 'half' && (
        <div className="absolute inset-x-0 bottom-0 z-[1002] h-[60vh] bg-white rounded-t-3xl shadow-[0_-8px_32px_rgba(0,0,0,0.22)] border-t border-slate-200 flex flex-col transition-all duration-300 animate-in slide-in-from-bottom-8">
          {/* Box Header Touch/Click Target (Cukup klik atau geser ke bawah untuk menyempitkan) */}
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={handleToggleBottomSheet}
            className="pt-3 pb-2.5 px-4 flex flex-col items-center shrink-0 border-b border-slate-100 cursor-pointer select-none active:bg-slate-50 transition-colors"
            title="Ketuk atau geser ke bawah untuk menyempitkan peta"
          >
            <div className="w-10 h-1.5 rounded-full bg-slate-300 hover:bg-slate-400 mb-2 transition-colors" />
            <div className="w-full flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
                  <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 truncate">
                    Alumni di {searchFilter || 'Wilayah Terpilih'}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ditemukan {displayedAlumni.length} alumni terdaftar
                </p>
              </div>
            </div>
          </div>

          {/* List Alumni */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {displayedAlumni.length === 0 ? (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center">
                <User className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-600">Tidak ada alumni yang berbagi lokasi di wilayah ini</p>
                <p className="text-xs text-slate-400 mt-1">Coba cari wilayah lain</p>
              </div>
            ) : (
              displayedAlumni.map((alumni) => {
                const distance = alumni.coordinates ? getDistanceFromGps(alumni.coordinates.lat, alumni.coordinates.lng) : null;
                const isCurrent = alumni.id === currentUser.id;
                const isSelected = selectedAlumni?.id === alumni.id;

                return (
                  <div
                    key={alumni.id}
                    onClick={() => handleSelectAlumniFromSheet(alumni)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                      isSelected
                        ? 'bg-sky-50/90 border-sky-400 shadow-md ring-2 ring-sky-300'
                        : 'bg-white hover:bg-slate-50 border-slate-200/90 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-sky-100 shrink-0 border border-slate-200 shadow-xs">
                        {alumni.photoUrl ? (
                          <img
                            src={alumni.photoUrl}
                            alt={alumni.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className={`w-full h-full flex items-center justify-center font-bold text-base text-white ${
                              alumni.gender === 'P'
                                ? 'bg-gradient-to-br from-rose-400 to-pink-500'
                                : 'bg-gradient-to-br from-sky-500 to-blue-600'
                            }`}
                          >
                            {alumni.name.charAt(0)}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-display font-bold text-sm text-slate-900 truncate">
                            {alumni.name}
                          </h4>
                          {isCurrent && (
                            <span className="text-[9px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.2 rounded-full border border-slate-200">
                              Anda
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {[alumni.desa, alumni.kecamatan, alumni.city].filter(Boolean).join(', ') || alumni.city}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                          <span>{alumni.occupation || alumni.jenjang}</span>
                          {distance !== null && (
                            <>
                              <span>•</span>
                              <span className="text-sky-600 font-semibold">{distance} km</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100/90">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailModalAlumni(alumni);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>Profile</span>
                      </button>

                      {alumni.coordinates?.lat && alumni.coordinates?.lng && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenGoogleMapsRoute(alumni);
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 active:scale-95 text-sky-700 border border-sky-200/90 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5 text-sky-600" />
                          <span>Rute</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ================= 5. MODE SEMPIT: HEADER DI BAWAH & KOTAK DETAIL ALUMNI DISOROT DI ATASNYA =================
          "Hapus tombol sempitkan. Daftar. Dan x. Cukup untuk klik atau geser ke bawah pada box diatas header bottom sheet untuk menyempitkan atau klik pada peta. Dan untuk meluaskan cukup geser ke atas atau klik pada box tadi.
          dan jika ada yang disorot maka saat mode sempit di atas bottom sheet munculkan kotak yang sama seperti kotak yang muncul saat mengklik tag lokasi alumni" */}
      {bottomSheetState === 'collapsed' && (
        <div className="absolute inset-x-0 bottom-0 z-[1002] flex flex-col items-center pointer-events-none animate-in slide-in-from-bottom-6 duration-200">
          {/* Kotak Detail Alumni yang Disorot di Atas Bottom Sheet Sempit */}
          {selectedAlumni && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="w-full px-4 sm:max-w-md pointer-events-auto mb-2 animate-in fade-in slide-in-from-bottom-2 duration-150"
            >
              <div className="bg-white rounded-3xl p-3.5 shadow-2xl border border-slate-200/95 flex flex-col gap-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden bg-sky-100 shrink-0 border border-slate-200 shadow-xs">
                    {selectedAlumni.photoUrl ? (
                      <img
                        src={selectedAlumni.photoUrl}
                        alt={selectedAlumni.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-full h-full flex items-center justify-center font-bold text-base text-white ${
                          selectedAlumni.gender === 'P'
                            ? 'bg-gradient-to-br from-rose-400 to-pink-500'
                            : 'bg-gradient-to-br from-sky-500 to-blue-600'
                        }`}
                      >
                        {selectedAlumni.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-display font-bold text-sm text-slate-900 truncate">
                        {selectedAlumni.name}
                      </h3>
                      {selectedAlumni.id === currentUser.id && (
                        <span className="text-[9px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.2 rounded-full border border-slate-200">
                          Rumah Anda
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

                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setDetailModalAlumni(selectedAlumni)}
                    className="flex-1 py-2 px-3 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-sky-600/20 cursor-pointer transition-all"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Profil</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  {selectedAlumni.coordinates?.lat && selectedAlumni.coordinates?.lng && (
                    <button
                      type="button"
                      onClick={() => handleOpenGoogleMapsRoute(selectedAlumni)}
                      className="py-2 px-3.5 rounded-xl bg-sky-50 hover:bg-sky-100 active:scale-95 border border-sky-200/90 text-sky-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs shrink-0"
                      title="Buka Rute di Google Maps"
                    >
                      <Navigation className="w-3.5 h-3.5 text-sky-600" />
                      <span>Rute</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Box Header Bottom Sheet Mode Sempit (Hanya box, tanpa tombol sempitkan, daftar, atau x)
              "Dan untuk meluaskan cukup geser ke atas atau klik pada box tadi." */}
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={handleToggleBottomSheet}
            className="w-full bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.18)] border-t border-slate-200/90 pointer-events-auto px-4 pt-3 pb-4 cursor-pointer select-none active:bg-slate-50 transition-colors"
            title="Ketuk atau geser ke atas untuk meluaskan daftar"
          >
            <div className="w-10 h-1.5 rounded-full bg-slate-300 hover:bg-slate-400 mx-auto mb-2 transition-colors" />
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-7 h-7 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                    Alumni di {searchFilter || 'Wilayah Terpilih'}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">
                    {displayedAlumni.length} alumni • Ketuk untuk meluaskan
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 6. KOTAK DETAIL ALUMNI SAAT KLIK PIN DI PETA (KETIKA TIDAK DALAM MODE BOTTOM SHEET) =================
          "Saat klik tag lokasi alumni lalu muncul kotak maka saat klik diluar kotak buat kotaknya tertutup." */}
      {selectedAlumni && bottomSheetState === 'hidden' && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-6 inset-x-4 sm:max-w-md sm:mx-auto z-[1000] animate-in slide-in-from-bottom-6 duration-200 pointer-events-auto"
        >
          <div className="bg-white rounded-3xl p-4 shadow-2xl border border-slate-200/90 flex flex-col gap-3">
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

              <div className="min-w-0 flex-1">
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

            <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDetailModalAlumni(selectedAlumni)}
                className="flex-1 py-2.5 px-3 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-sky-600/20 cursor-pointer transition-all"
              >
                <User className="w-3.5 h-3.5" />
                <span>Profil</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {selectedAlumni.coordinates?.lat && selectedAlumni.coordinates?.lng && (
                <button
                  type="button"
                  onClick={() => handleOpenGoogleMapsRoute(selectedAlumni)}
                  className="py-2.5 px-4 rounded-xl bg-sky-50 hover:bg-sky-100 active:scale-95 border border-sky-200/90 text-sky-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs shrink-0"
                  title="Buka Rute di Google Maps"
                >
                  <Navigation className="w-4 h-4 text-sky-600" />
                  <span>Rute</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= 7. KOTAK LOKASI TERKINI SAYA (BERSIH) ================= */}
      {isShowingRealtimeGpsDetail && bottomSheetState === 'hidden' && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-6 inset-x-4 sm:max-w-md sm:mx-auto z-[1000] animate-in slide-in-from-bottom-6 duration-200 pointer-events-auto"
        >
          <div className="bg-white rounded-3xl p-4 shadow-2xl border border-slate-200/90 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center shrink-0">
                <Navigation className="w-5 h-5 animate-pulse" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display font-bold text-sm text-slate-900 truncate">
                  Lokasi Terkini Saya
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {realtimeGps.lat.toFixed(5)}, {realtimeGps.lng.toFixed(5)} {gpsAccuracy ? `(±${gpsAccuracy}m)` : ''}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsShowingRealtimeGpsDetail(false)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer shrink-0"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= 8. FULLSCREEN SEARCH OVERLAY (CARI ALUMNI & CARI LOKASI) =================
          "Pada pencarian selain bisa cari lokasi juga bisa cari nama alumni. Kalau klik hasil berupa alumni maka akan langsung memusatkan ke alamat alumni kalau yg diklik hasil alamat maka akan muncul bottomsheet nama nama alumni di alamat itu." */}
      {isSearchOverlayOpen && (
        <div className="fixed inset-0 z-[100000] bg-white flex flex-col animate-in fade-in duration-150">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200/90 shrink-0">
            <button
              type="button"
              onClick={() => setIsSearchOverlayOpen(false)}
              className="p-1 -ml-1 rounded-full text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer shrink-0"
              title="Kembali ke Peta"
            >
              <ArrowLeft className="w-6 h-6 text-slate-800" />
            </button>

            <div className="flex-1 flex items-center relative min-w-0">
              <input
                ref={searchInputRef}
                type="text"
                value={searchOverlayQuery}
                onChange={(e) => setSearchOverlayQuery(e.target.value)}
                placeholder="Cari nama alumni atau lokasi..."
                className="w-full text-base sm:text-lg text-slate-900 font-medium placeholder-slate-400 focus:outline-none"
              />
              {isSearchingOnline && (
                <Loader2 className="w-4 h-4 animate-spin text-sky-600 ml-1 shrink-0" />
              )}
            </div>

            {searchOverlayQuery && (
              <button
                type="button"
                onClick={() => setSearchOverlayQuery('')}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Hapus teks"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 px-2 py-2">
            {/* HASIL 1: DAFTAR NAMA ALUMNI YANG COCOK */}
            {matchingAlumniResults.length > 0 && (
              <div className="pb-2">
                <div className="px-3 py-1.5">
                  <p className="text-[11px] font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>Alumni Ditemukan ({matchingAlumniResults.length})</span>
                  </p>
                </div>

                <div className="space-y-1">
                  {matchingAlumniResults.map((alumni) => {
                    const distance = alumni.coordinates ? getDistanceFromGps(alumni.coordinates.lat, alumni.coordinates.lng) : null;

                    return (
                      <div
                        key={alumni.id}
                        onClick={() => handleSelectAlumniFromSearchOverlay(alumni)}
                        className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-2xl hover:bg-sky-50 active:bg-sky-100 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-sky-100 shrink-0 border border-slate-200 shadow-2xs">
                            {alumni.photoUrl ? (
                              <img src={alumni.photoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-sm text-white bg-sky-600">
                                {alumni.name.charAt(0)}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-slate-900 group-hover:text-sky-700 transition-colors truncate">
                              {alumni.name}
                            </h4>
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              {[alumni.desa, alumni.kecamatan, alumni.city].filter(Boolean).join(', ') || alumni.city}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {distance !== null && (
                            <span className="text-[11px] font-medium text-slate-400">
                              {distance} km
                            </span>
                          )}
                          <div className="p-1 text-slate-400 group-hover:text-sky-600 transition-colors">
                            <ArrowUpRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* HASIL 2: DAFTAR LOKASI / WILAYAH */}
            <div>
              <div className="px-3 py-1.5 flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>
                    {!searchOverlayQuery ? 'Lokasi Domisili Anda' : 'Lokasi di Seluruh Indonesia'}
                  </span>
                </p>
                {isSearchingOnline && (
                  <span className="text-[11px] text-sky-600 font-medium">Mencari...</span>
                )}
              </div>

              {matchingLocationResults.length === 0 && matchingAlumniResults.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Tidak ada alumni atau lokasi yang cocok</p>
                  <p className="text-xs text-slate-400 mt-1">Coba ketik nama santri/alumni atau nama kota/wilayah lain</p>
                </div>
              ) : (
                matchingLocationResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectLocationFromSearchOverlay(item)}
                    className="flex items-center justify-between gap-3 py-3 px-3 hover:bg-slate-50 active:bg-slate-100 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="flex flex-col items-center justify-center shrink-0 w-9 text-center">
                        <div className="w-8 h-8 rounded-full bg-sky-50 group-hover:bg-sky-600 group-hover:text-white flex items-center justify-center text-sky-600 transition-colors">
                          <MapPin className="w-4 h-4" />
                        </div>
                        {item.distance !== null && item.distance !== undefined && (
                          <span className="text-[10px] text-slate-400 mt-0.5 truncate max-w-full font-medium">
                            {item.distance} km
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-slate-900 group-hover:text-sky-700 transition-colors truncate">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="p-1 text-slate-400 group-hover:text-sky-600 transition-colors shrink-0">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= 9. MODAL PROFILE ALUMNI (DIBUKA DARI TOMBOL PROFILE - PERSIS REFERENSI) ================= */}
      {detailModalAlumni && (
        <AlumniProfileCardModal
          isOpen={Boolean(detailModalAlumni)}
          alumni={detailModalAlumni}
          currentUser={currentUser}
          userGps={realtimeGps}
          onClose={() => setDetailModalAlumni(null)}
        />
      )}

      {/* ================= 10. BOTTOM SHEET PROFIL USER & PENGATURAN PRIVASI AKUN ================= */}
      {isProfileBottomSheetOpen && (
        <div className="fixed inset-0 z-[100001] bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-8 duration-300">
            <div className="pt-3 pb-2 px-5 flex flex-col items-center shrink-0 border-b border-slate-100">
              <div 
                onClick={() => setIsProfileBottomSheetOpen(false)}
                className="w-10 h-1.5 rounded-full bg-slate-300 hover:bg-slate-400 cursor-pointer mb-2.5 transition-colors"
              />
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-sky-600" />
                  <h3 className="font-display font-bold text-base text-slate-900">
                    Profil & Privasi Lokasi
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProfileBottomSheetOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-5">
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100">
                <div className="w-13 h-13 rounded-2xl overflow-hidden bg-sky-200 shrink-0 border border-sky-300 shadow-xs">
                  {currentUser.photoUrl ? (
                    <img src={currentUser.photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-lg text-white bg-sky-600">
                      {currentUser.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <h4 className="font-display font-bold text-sm text-slate-900 truncate">
                    {currentUser.name}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5 truncate">
                    NIS: {currentUser.nis} • Angkatan {currentUser.gradYear || 'Alumni'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {[currentUser.kecamatan, currentUser.city, currentUser.province].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Pengaturan Tag Lokasi & Izin Tampilan
                </h4>

                {/* Kotak Tag Lokasi: Default keterangan lokasi belum diatur dan tombol atur */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex items-center justify-between gap-3 shadow-2xs">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
                      <span className="font-bold text-xs sm:text-sm text-slate-900">
                        Tag Lokasi Rumah
                      </span>
                    </div>
                    <p className={`text-xs mt-1 ${isLocationTagSet ? 'text-slate-600 font-medium' : 'text-amber-600 font-bold'}`}>
                      {isLocationTagSet
                        ? `${currentUser.kecamatan ? `Kec. ${currentUser.kecamatan}, ` : ''}${currentUser.city || 'Titik Terpasang'}`
                        : 'Lokasi belum diatur'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsLocationPickerOpen(true)}
                    className={`py-1.5 px-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-95 shrink-0 ${
                      isLocationTagSet
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'bg-sky-600 hover:bg-sky-700 text-white shadow-xs'
                    }`}
                  >
                    {isLocationTagSet ? 'Ubah' : 'Atur'}
                  </button>
                </div>

                {/* Setting Izin Membagikan Lokasi: Mati jika lokasi belum diatur, muncul popup kecil di atas */}
                <div className="relative p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex items-start justify-between gap-3 shadow-2xs">
                  {/* Popup kecil di atas: "Lokasi belum diatur" */}
                  {showLocationNotSetPopup && (
                    <div className="absolute -top-9 right-3 z-30 bg-slate-900 text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-1.5 animate-in fade-in zoom-in-95 pointer-events-none">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Lokasi belum diatur</span>
                      <div className="absolute -bottom-1 right-6 w-2 h-2 bg-slate-900 rotate-45" />
                    </div>
                  )}

                  <div className="min-w-0" onClick={!isLocationTagSet ? handleTriggerDisabledLocationTag : undefined}>
                    <div className="flex items-center gap-2">
                      <MapPin className={`w-4 h-4 shrink-0 ${isLocationTagSet ? 'text-sky-600' : 'text-slate-400'}`} />
                      <span className={`font-bold text-xs sm:text-sm ${isLocationTagSet ? 'text-slate-900' : 'text-slate-500'}`}>
                        Tampilkan Tag Lokasi di Peta
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Izinkan alumni lain melihat pin lokasi rumah Anda pada Peta Sebaran Alumni.
                    </p>
                  </div>

                  {isLocationTagSet ? (
                    <button
                      type="button"
                      onClick={() => handleToggleShareLocation(!shareLocationTag)}
                      className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer shrink-0 mt-0.5 ${
                        shareLocationTag ? 'bg-sky-600' : 'bg-slate-300'
                      }`}
                      title={shareLocationTag ? 'Nonaktifkan tag lokasi' : 'Aktifkan tag lokasi'}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.5 ${
                          shareLocationTag ? 'left-6' : 'left-1'
                        }`}
                      />
                    </button>
                  ) : (
                    <div
                      onClick={handleTriggerDisabledLocationTag}
                      className="w-12 h-6.5 rounded-full bg-slate-200/90 relative cursor-pointer shrink-0 mt-0.5 opacity-60"
                      title="Lokasi belum diatur"
                    >
                      <div className="w-5 h-5 rounded-full bg-white shadow-xs absolute top-0.5 left-1" />
                    </div>
                  )}
                </div>

                {/* Tampilkan Alamat Lengkap */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex items-start justify-between gap-3 shadow-2xs">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-xs sm:text-sm text-slate-900">
                        Tampilkan Alamat Lengkap
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Izinkan rincian desa, RT/RW, dan jalan rumah Anda terlihat oleh sesama alumni di profil.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleShareFullAddress(!shareFullAddress)}
                    className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer shrink-0 mt-0.5 ${
                      shareFullAddress ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                    title={shareFullAddress ? 'Sembunyikan alamat lengkap' : 'Tampilkan alamat lengkap'}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.5 ${
                        shareFullAddress ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileBottomSheetOpen(false);
                    setDetailModalAlumni(currentUser);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <User className="w-4 h-4" />
                  <span>Buka Halaman Profil Saya</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileBottomSheetOpen(false);
                    handleCenterHome();
                  }}
                  className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <Home className="w-4 h-4" />
                  <span>Pusatkan ke Rumah</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 11. MODAL ATUR TITIK LOKASI TAG RUMAH ================= */}
      {isLocationPickerOpen && (
        <FullscreenLocationMapModal
          isOpen={isLocationPickerOpen}
          initialCoordinates={currentUser.coordinates || realtimeGps}
          currentAddressLabel={[currentUser.desa, currentUser.kecamatan, currentUser.city].filter(Boolean).join(', ')}
          onClose={() => setIsLocationPickerOpen(false)}
          onSelectLocation={(coords, hint) => {
            if (onUpdateProfile) {
              onUpdateProfile({
                coordinates: coords || undefined,
                ...(hint?.subdistrict ? { kecamatan: hint.subdistrict } : {}),
                ...(hint?.city ? { city: hint.city } : {}),
                ...(hint?.state ? { province: hint.state } : {}),
                ...(hint?.road || hint?.village ? { desa: hint.village || '', alamatLengkap: hint.displayName || '' } : {}),
              });
            }
            setIsLocationPickerOpen(false);
            showToast(coords ? 'Tag lokasi rumah berhasil disimpan' : 'Tag lokasi rumah berhasil dihapus');
          }}
        />
      )}
    </div>,
    document.body
  );
};
