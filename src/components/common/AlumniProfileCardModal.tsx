import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  MapPin, 
  Mail, 
  MessageCircle, 
  Navigation, 
  Lock, 
  Briefcase,
  Building2
} from 'lucide-react';
import L from 'leaflet';
import { AlumniRecord } from '../../types';
import { CleanMediaPreviewModal } from './CleanMediaPreviewModal';

interface AlumniProfileCardModalProps {
  isOpen: boolean;
  alumni: AlumniRecord | null;
  onClose: () => void;
  currentUser?: AlumniRecord;
  userGps?: { lat: number; lng: number } | null;
}

export const AlumniProfileCardModal: React.FC<AlumniProfileCardModalProps> = ({
  isOpen,
  alumni,
  onClose,
  currentUser,
  userGps,
}) => {
  const miniMapContainerRef = useRef<HTMLDivElement>(null);
  const miniMapInstanceRef = useRef<L.Map | null>(null);

  // State for fullscreen clean preview (no overlay descriptions, with zoom, pan, and X)
  const [fullscreenMedia, setFullscreenMedia] = useState<{
    url?: string;
    initial?: string;
    isFemale?: boolean;
  } | null>(null);

  // Ensure if viewing current user, it reflects latest profile updates (photoUrl, coverPhotoUrl, etc.)
  const displayAlumni = (currentUser && alumni && alumni.id === currentUser.id)
    ? { ...alumni, ...currentUser }
    : alumni;

  const hasLocationTag = Boolean(
    displayAlumni?.shareLocationTag !== false && displayAlumni?.coordinates?.lat && displayAlumni?.coordinates?.lng
  );

  // Initialize mini Leaflet preview map inside the address segment if location tag is allowed
  useEffect(() => {
    if (!isOpen || !displayAlumni || !hasLocationTag || !miniMapContainerRef.current) return;

    const timer = setTimeout(() => {
      if (!miniMapContainerRef.current) return;

      if (miniMapInstanceRef.current) {
        miniMapInstanceRef.current.remove();
        miniMapInstanceRef.current = null;
      }

      const lat = displayAlumni.coordinates!.lat;
      const lng = displayAlumni.coordinates!.lng;

      const map = L.map(miniMapContainerRef.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        touchZoom: false,
        doubleClickZoom: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Custom marker icon
      const customPin = L.divIcon({
        className: 'alumni-avatar-pin',
        html: `
          <div style="position: relative; width: 34px; height: 34px; border-radius: 9999px; background: #0284c7; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
      });

      L.marker([lat, lng], { icon: customPin }).addTo(map);
      miniMapInstanceRef.current = map;
      map.invalidateSize();
    }, 120);

    return () => {
      clearTimeout(timer);
      if (miniMapInstanceRef.current) {
        miniMapInstanceRef.current.remove();
        miniMapInstanceRef.current = null;
      }
    };
  }, [isOpen, displayAlumni?.id, hasLocationTag]);

  if (!isOpen || !displayAlumni) return null;

  const isAdminRecord = Boolean(
    displayAlumni.id === 'author-admin' ||
    displayAlumni.gradYear === 'Administrator Alumni' ||
    (displayAlumni.gradYear && displayAlumni.gradYear.toLowerCase().includes('administrator')) ||
    (displayAlumni.nis === 'TRQ-ADMIN')
  );

  // Address display logic according to privacy permissions
  const isFullAddressAllowed = displayAlumni.shareFullAddress !== false;
  const addressText = isFullAddressAllowed
    ? [
        displayAlumni.alamatLengkap,
        displayAlumni.desa ? `Desa ${displayAlumni.desa}` : '',
        displayAlumni.kecamatan ? `Kec. ${displayAlumni.kecamatan}` : '',
        displayAlumni.city,
        displayAlumni.province,
      ]
        .filter(Boolean)
        .join(', ') || displayAlumni.city
    : [
        displayAlumni.kecamatan ? `Kec. ${displayAlumni.kecamatan}` : '',
        displayAlumni.city,
        displayAlumni.province,
      ]
        .filter(Boolean)
        .join(', ') || displayAlumni.city;

  // Social media & contact permissions (WhatsApp & Email)
  const isWaAllowed = displayAlumni.shareContact !== false;
  const isEmailAllowed = displayAlumni.shareEmail !== false;
  const hasPhone = Boolean(displayAlumni.phone && isWaAllowed);
  const hasEmail = Boolean(displayAlumni.email && isEmailAllowed);

  // Clean phone number for WhatsApp
  const cleanPhone = displayAlumni.phone ? displayAlumni.phone.replace(/[^0-9]/g, '') : '';
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}`
    : '#';

  const emailUrl = displayAlumni.email ? `mailto:${displayAlumni.email}` : '#';

  // Google Maps route URL
  const googleMapsUrl = displayAlumni.coordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${displayAlumni.coordinates.lat},${displayAlumni.coordinates.lng}${
        userGps ? `&origin=${userGps.lat},${userGps.lng}` : ''
      }`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}`;

  return createPortal(
    <div 
      className="fixed inset-0 z-[100005] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[340px] sm:max-w-sm bg-white rounded-[32px] overflow-hidden shadow-2xl border border-slate-100 flex flex-col relative animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= 1. BANNER / FOTO SAMPUL ================= */}
        <div 
          onClick={() => {
            if (displayAlumni.coverPhotoUrl) {
              setFullscreenMedia({ url: displayAlumni.coverPhotoUrl });
            }
          }}
          className={`h-32 sm:h-36 relative overflow-hidden bg-gradient-to-b from-sky-200 via-sky-100 to-sky-50 shrink-0 ${
            displayAlumni.coverPhotoUrl ? 'cursor-pointer group' : ''
          }`}
          title={displayAlumni.coverPhotoUrl ? 'Klik untuk melihat foto sampul layar penuh' : undefined}
        >
          {displayAlumni.coverPhotoUrl ? (
            <img 
              src={displayAlumni.coverPhotoUrl} 
              alt="Foto Sampul" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            />
          ) : (
            <div className="absolute inset-0 opacity-80 mix-blend-overlay pointer-events-none">
              <svg viewBox="0 0 400 200" className="w-full h-full object-cover">
                <path d="M0,80 Q90,30 180,60 T360,40 Q400,60 400,100 L400,200 L0,200 Z" fill="#ffffff" opacity="0.6" />
                <path d="M0,120 Q120,70 240,110 T400,90 L400,200 L0,200 Z" fill="#ffffff" opacity="0.8" />
              </svg>
            </div>
          )}

          {/* Close button X on top right */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-black/35 hover:bg-black/55 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ================= 2. AVATAR & TAHUN BOYONG ================= */}
        <div className="px-5 relative z-10 flex items-end justify-between -mt-12">
          {/* Avatar Bulat (Bisa diklik untuk preview full screen bersih) */}
          <div 
            onClick={() => {
              setFullscreenMedia({
                url: displayAlumni.photoUrl,
                initial: displayAlumni.name,
                isFemale: displayAlumni.gender === 'P',
              });
            }}
            className="w-22 h-22 rounded-full border-4 border-white shadow-md overflow-hidden bg-sky-100 shrink-0 cursor-pointer group hover:ring-2 hover:ring-sky-400 transition-all"
            title="Klik untuk melihat foto profil layar penuh"
          >
            {displayAlumni.photoUrl ? (
              <img 
                src={displayAlumni.photoUrl} 
                alt={displayAlumni.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
              />
            ) : (
              <div
                className={`w-full h-full flex items-center justify-center font-bold text-2xl text-white group-hover:scale-105 transition-transform duration-300 ${
                  displayAlumni.gender === 'P'
                    ? 'bg-gradient-to-br from-rose-400 to-pink-500'
                    : 'bg-gradient-to-br from-sky-500 to-blue-600'
                }`}
              >
                {displayAlumni.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Pengganti exp: Boyong 2024 / Administrator Alumni & Colorful Dashes */}
          <div className="flex items-center gap-1.5 pb-2.5">
            <span className="text-xs font-bold text-slate-700 font-display">
              {isAdminRecord ? 'Administrator Alumni' : `Boyong ${displayAlumni.gradYear || '2024'}`}
            </span>
            <div className="flex items-center gap-0.5">
              {['#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6'].map(
                (color, i) => (
                  <div key={i} className="w-0.5 h-3 rounded-full" style={{ backgroundColor: color }} />
                )
              )}
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-0.5 h-3 rounded-full bg-slate-200" />
              ))}
            </div>
          </div>
        </div>

        {/* ================= 3. NAMA, BIO & PROFESI/PERUSAHAAN ================= */}
        <div className="px-5 pt-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-display font-bold text-lg text-slate-900 leading-tight break-words">
              {displayAlumni.name}
            </h3>
            {currentUser && displayAlumni.id === currentUser.id && (
              <span className="text-[9px] bg-sky-50 text-sky-700 font-bold px-2 py-0.2 rounded-full border border-sky-200 shrink-0">
                Profil Anda
              </span>
            )}
          </div>

          {/* Bio dengan Tanda Petik (otomatis membungkus ke baris berikutnya jika panjang) */}
          <p className="text-xs text-slate-600 italic leading-relaxed mt-1 break-words whitespace-normal">
            “{displayAlumni.bio || displayAlumni.occupation || (isAdminRecord ? 'Administrator Ikatan Alumni Ponpes At-Taroqqy' : 'Santri Pondok Pesantren At-Taroqqy')}”
          </p>

          {/* Jabatan di Ikatan Alumni (Untuk Akun Admin) ATAU Profesi & Perusahaan/Instansi (Untuk Alumni Biasa) */}
          {isAdminRecord ? (
            displayAlumni.occupation && (
              <div className="mt-2.5 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                  Jabatan di Ikatan Alumni
                </span>
                <div className="flex items-start gap-2 text-xs text-sky-950 font-semibold bg-sky-50 border border-sky-200/80 px-3 py-2 rounded-xl">
                  <Briefcase className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                  <span className="break-words whitespace-normal leading-relaxed">
                    {displayAlumni.occupation}
                  </span>
                </div>
              </div>
            )
          ) : (
            (displayAlumni.occupation || displayAlumni.institution) && (
              <div className="mt-2.5 space-y-1.5">
                {/* Baris 1: Profesi / Pekerjaan dengan Icon Briefcase */}
                {displayAlumni.occupation && (
                  <div className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                    <Briefcase className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                    <span className="break-words whitespace-normal leading-relaxed">
                      {displayAlumni.occupation}
                    </span>
                  </div>
                )}

                {/* Baris 2: Perusahaan / Lembaga / Instansi dengan Icon Building2 */}
                {displayAlumni.institution && (
                  <div className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="break-words whitespace-normal leading-relaxed">
                      {displayAlumni.institution}
                    </span>
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* ================= 4. SEGMEN ALAMAT DOMISILI & PREVIEW PETA ================= */}
        <div className="px-5 py-3">
          <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-3 flex flex-col gap-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-800">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="text-xs font-bold font-display">Alamat Domisili</span>
              </div>
            </div>

            {/* Alamat otomatis baris ke bawah jika tidak cukup */}
            <p className="text-xs text-slate-700 leading-relaxed font-medium break-words whitespace-normal">
              {addressText}
            </p>

            {/* Kotak Preview Peta jika mengizinkan bagikan lokasi dan punya koordinat */}
            {hasLocationTag && (
              <div className="mt-1 flex flex-col gap-1.5">
                <div 
                  ref={miniMapContainerRef} 
                  className="w-full h-24 rounded-xl overflow-hidden border border-slate-200 shadow-2xs bg-slate-100 relative z-0" 
                />
                <button
                  type="button"
                  onClick={() => window.open(googleMapsUrl, '_blank', 'noopener,noreferrer')}
                  className="w-full py-1.5 px-3 bg-white hover:bg-sky-50 border border-sky-200 rounded-xl text-sky-700 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer active:scale-[0.98]"
                >
                  <Navigation className="w-3 h-3 text-sky-600 shrink-0" />
                  <span>Google Maps</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ================= 5. MEDSOS: WA DAN EMAIL SAJA ================= */}
        <div className="border-t border-slate-100 px-5 py-3 bg-white flex items-center justify-around mt-auto">
          {/* Tombol WhatsApp */}
          {hasPhone ? (
            <button
              type="button"
              onClick={() => window.open(waUrl, '_blank', 'noopener,noreferrer')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200/80 transition-all cursor-pointer active:scale-95 shadow-2xs"
              title={`WhatsApp: ${displayAlumni.phone}`}
            >
              <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600 shrink-0" />
              <span>WhatsApp</span>
            </button>
          ) : (
            <div
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 text-slate-400 text-xs font-semibold border border-slate-200/60 opacity-45 cursor-not-allowed select-none"
              title="Nomor WhatsApp tidak dibagikan atau belum diatur"
            >
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>WhatsApp</span>
            </div>
          )}

          {/* Tombol Email */}
          {hasEmail ? (
            <button
              type="button"
              onClick={() => window.open(emailUrl, '_blank')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold border border-sky-200/80 transition-all cursor-pointer active:scale-95 shadow-2xs"
              title={`Email: ${displayAlumni.email}`}
            >
              <Mail className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Email</span>
            </button>
          ) : (
            <div
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 text-slate-400 text-xs font-semibold border border-slate-200/60 opacity-45 cursor-not-allowed select-none"
              title="Email tidak dibagikan atau belum diatur"
            >
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>Email</span>
            </div>
          )}
        </div>
      </div>

      {/* MODAL FULLSCREEN BERSIH: ZOOM IN/OUT, PAN/GESER, X */}
      {fullscreenMedia && (
        <CleanMediaPreviewModal
          isOpen={Boolean(fullscreenMedia)}
          imageUrl={fullscreenMedia.url}
          fallbackInitial={fullscreenMedia.initial}
          isFemale={fullscreenMedia.isFemale}
          onClose={() => setFullscreenMedia(null)}
        />
      )}
    </div>,
    document.body
  );
};
