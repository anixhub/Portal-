import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ArrowLeft, 
  User, 
  Calendar, 
  Users, 
  CreditCard, 
  MapPin, 
  Phone, 
  Briefcase, 
  GraduationCap, 
  Clock, 
  KeyRound, 
  ChevronRight, 
  Camera,
  FileText,
  FileCheck,
  Trash2,
  AtSign,
  Check,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { AlumniRecord } from '../../types';
import { WilayahAddressFilter } from '../common/WilayahAddressFilter';
import { FullscreenPhotoViewerModal } from '../common/FullscreenPhotoViewerModal';
import { LocationCoordinates } from '../common/FullscreenLocationMapModal';
import { useBackHandler } from '../../utils/navigationHistory';
import { getAlumniPhotoUrl } from '../../utils/photoUtils';
import { 
  generateNisFromEntryDate, 
  isUsernameTaken, 
  formatBaseUsername,
  calculateCascadeShiftOnEntryDateChange,
  cascadeShiftOnManualNisChange
} from '../../utils/alumniIdentityUtils';
import { DateWheelPicker } from '../common/DateWheelPicker';
import { 
  formatToDDMMYYYY, 
  getMaxDaysInMonth, 
  formatDayInput, 
  formatMonthInput,
  padDayInput,
  padMonthInput,
  padYearInput
} from '../../utils/dateUtils';
import { getGlobalAllSantriRecords, setGlobalAllSantriRecords, SantriIdentityLookup, checkNisLive } from '../../services/apiService';

interface AlumniDetailAdminModalProps {
  isOpen: boolean;
  alumni: AlumniRecord | null;
  existingAlumni?: AlumniRecord[];
  allSantriList?: SantriIdentityLookup[];
  onClose: () => void;
  onResetPassword: (id: string) => void;
  onSave?: (id: string, updated: Partial<AlumniRecord>, fullRecord?: AlumniRecord) => void;
  onDeleteAlumni?: (id: string) => void;
}

export const AlumniDetailAdminModal: React.FC<AlumniDetailAdminModalProps> = ({
  isOpen,
  alumni,
  existingAlumni = [],
  allSantriList,
  onClose,
  onResetPassword,
  onSave,
  onDeleteAlumni,
}) => {
  if (!isOpen || !alumni) return null;

  // Active edit modal state for individual sections
  const [activeEditModal, setActiveEditModal] = useState<string | null>(null);
  const [showFullscreenPhoto, setShowFullscreenPhoto] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  // Penanganan tombol fisik kembali (Android hardware back & swipe back)
  useBackHandler(Boolean(showFullscreenPhoto), 'detail-admin-fullscreen-photo', () => setShowFullscreenPhoto(false));
  useBackHandler(Boolean(showDeleteConfirmModal), 'detail-admin-delete-modal', () => setShowDeleteConfirmModal(false));
  useBackHandler(Boolean(activeEditModal), 'detail-admin-edit-submodal', () => setActiveEditModal(null));
  useBackHandler(isOpen, 'detail-admin-root-modal', onClose);

  // Form edit states
  const [editPhotoUrl, setEditPhotoUrl] = useState(alumni.photoUrl || '');
  const [editName, setEditName] = useState(alumni.name);
  const [editTempatLahir, setEditTempatLahir] = useState(alumni.tempatLahir || '');
  const [editTanggalLahir, setEditTanggalLahir] = useState(alumni.tanggalLahir || '');
  const [editGender, setEditGender] = useState<'L' | 'P'>((alumni.gender as 'L' | 'P') || 'L');
  const [editUrutanAnak, setEditUrutanAnak] = useState<number | string>(
    alumni.anak_ke !== undefined && alumni.anak_ke !== null
      ? Number(alumni.anak_ke)
      : (alumni.urutanAnak !== undefined && alumni.urutanAnak !== null ? Number(alumni.urutanAnak) : 1)
  );
  const [editJumlahSaudara, setEditJumlahSaudara] = useState<number | string>(
    alumni.dari_bersaudara !== undefined && alumni.dari_bersaudara !== null
      ? Number(alumni.dari_bersaudara)
      : (alumni.jumlahSaudara !== undefined && alumni.jumlahSaudara !== null ? Number(alumni.jumlahSaudara) : 0)
  );
  const [editNik, setEditNik] = useState(alumni.nik || '');
  const [editNoKk, setEditNoKk] = useState(alumni.noKk || '');
  const [editPhone, setEditPhone] = useState(alumni.phone || '');
  const [editEmail, setEditEmail] = useState(alumni.email || '');
  const [editOccupation, setEditOccupation] = useState(alumni.occupation || '');
  const [editInstitution, setEditInstitution] = useState(alumni.institution || '');

  // Address
  const [editProvince, setEditProvince] = useState(alumni.province || '');
  const [editCity, setEditCity] = useState(alumni.city || '');
  const [editKecamatan, setEditKecamatan] = useState(alumni.kecamatan || '');
  const [editDesa, setEditDesa] = useState(alumni.desa || '');
  const [editAlamatLengkap, setEditAlamatLengkap] = useState(alumni.alamatLengkap || '');
  const [editCoordinates, setEditCoordinates] = useState(alumni.coordinates || null);

  // Riwayat Pendidikan Pondok
  const [editNis, setEditNis] = useState(alumni.nis || '');
  const [editEntryDate, setEditEntryDate] = useState(alumni.entryDate || '');
  const [editGradDate, setEditGradDate] = useState(alumni.gradDate || '');
  const [tempEntryDate, setTempEntryDate] = useState(alumni.entryDate || '');
  const [tempGradDate, setTempGradDate] = useState(alumni.gradDate || '');
  const [isEntryDateKnown, setIsEntryDateKnown] = useState<boolean>(Boolean(alumni.entryDate && alumni.entryDate.trim() !== ''));
  const [isGradDateKnown, setIsGradDateKnown] = useState<boolean>(Boolean(alumni.gradDate && alumni.gradDate.trim() !== ''));

  // Parents
  const [editNamaAyah, setEditNamaAyah] = useState(alumni.namaAyah || '');
  const [editNikAyah, setEditNikAyah] = useState(alumni.nikAyah || '');
  const [editPekerjaanAyah, setEditPekerjaanAyah] = useState(alumni.pekerjaanAyah || '');
  const [editPendidikanAyah, setEditPendidikanAyah] = useState(alumni.pendidikanAyah || '');

  const [editNamaIbu, setEditNamaIbu] = useState(alumni.namaIbu || '');
  const [editNikIbu, setEditNikIbu] = useState(alumni.nikIbu || '');
  const [editPekerjaanIbu, setEditPekerjaanIbu] = useState(alumni.pekerjaanIbu || '');
  const [editPendidikanIbu, setEditPendidikanIbu] = useState(alumni.pendidikanIbu || '');

  // Username
  const [editUsername, setEditUsername] = useState(alumni.username || '');
  const [newAdminUsernameInput, setNewAdminUsernameInput] = useState('');
  const [adminUsernameError, setAdminUsernameError] = useState<string | null>(null);

  // Dedicated Draft states for submodals
  const [draftName, setDraftName] = useState('');
  const [draftTempatLahir, setDraftTempatLahir] = useState('');
  const [draftTanggalLahir, setDraftTanggalLahir] = useState('');
  const [draftBirthDay, setDraftBirthDay] = useState('');
  const [draftBirthMonth, setDraftBirthMonth] = useState('');
  const [draftBirthYear, setDraftBirthYear] = useState('');

  const [draftGender, setDraftGender] = useState<'L' | 'P'>('L');
  const [draftUrutanAnak, setDraftUrutanAnak] = useState<number | string>(1);
  const [draftJumlahSaudara, setDraftJumlahSaudara] = useState<number | string>(0);
  const [draftNik, setDraftNik] = useState('');
  const [draftNoKk, setDraftNoKk] = useState('');
  const [draftPhone, setDraftPhone] = useState('');
  const [draftEmail, setDraftEmail] = useState('');
  const [draftOccupation, setDraftOccupation] = useState('');
  const [draftInstitution, setDraftInstitution] = useState('');
  const [draftProvince, setDraftProvince] = useState('');
  const [draftCity, setDraftCity] = useState('');
  const [draftKecamatan, setDraftKecamatan] = useState('');
  const [draftDesa, setDraftDesa] = useState('');
  const [draftAlamatLengkap, setDraftAlamatLengkap] = useState('');
  const [draftCoordinates, setDraftCoordinates] = useState<LocationCoordinates | null>(null);

  // NIS Edit State
  const [draftNis, setDraftNis] = useState('');
  const [nisChecking, setNisChecking] = useState(false);
  const [nisCheckStatus, setNisCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [collidingAlumni, setCollidingAlumni] = useState<AlumniRecord | null>(null);
  const [isManualShiftApplied, setIsManualShiftApplied] = useState(false);
  const [affectedManualAlumni, setAffectedManualAlumni] = useState<Array<{ id: string; nis: string; name: string }>>([]);
  const lastCheckedNisRef = useRef<string | null>(null);

  const [draftNamaAyah, setDraftNamaAyah] = useState('');
  const [draftNikAyah, setDraftNikAyah] = useState('');
  const [draftPekerjaanAyah, setDraftPekerjaanAyah] = useState('');
  const [draftPendidikanAyah, setDraftPendidikanAyah] = useState('');
  const [draftNamaIbu, setDraftNamaIbu] = useState('');
  const [draftNikIbu, setDraftNikIbu] = useState('');
  const [draftPekerjaanIbu, setDraftPekerjaanIbu] = useState('');
  const [draftPendidikanIbu, setDraftPendidikanIbu] = useState('');

  // Check state for Username
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameCheckStatus, setUsernameCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  // Check state for NIK & No KK
  const [isCheckingNik, setIsCheckingNik] = useState(false);
  const [nikCheckStatus, setNikCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [duplicateNik, setDuplicateNik] = useState<SantriIdentityLookup | AlumniRecord | null>(null);

  const [isCheckingNoKk, setIsCheckingNoKk] = useState(false);
  const [noKkCheckStatus, setNoKkCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [duplicateNoKk, setDuplicateNoKk] = useState<SantriIdentityLookup | AlumniRecord | null>(null);

  // Check state for NIK Ayah & NIK Ibu
  const [isCheckingNikAyah, setIsCheckingNikAyah] = useState(false);
  const [nikAyahCheckStatus, setNikAyahCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [duplicateNikAyah, setDuplicateNikAyah] = useState<SantriIdentityLookup | AlumniRecord | null>(null);

  const [isCheckingNikIbu, setIsCheckingNikIbu] = useState(false);
  const [nikIbuCheckStatus, setNikIbuCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [duplicateNikIbu, setDuplicateNikIbu] = useState<SantriIdentityLookup | AlumniRecord | null>(null);

  // Username realtime check with debounce
  useEffect(() => {
    if (activeEditModal !== 'username') return;
    const clean = newAdminUsernameInput.trim();
    if (!clean) {
      setIsCheckingUsername(false);
      setUsernameCheckStatus('idle');
      setAdminUsernameError(null);
      return;
    }

    setIsCheckingUsername(true);
    setUsernameCheckStatus('checking');

    const timer = setTimeout(() => {
      setIsCheckingUsername(false);
      if (isUsernameTaken(clean, existingAlumni, alumni.id)) {
        setUsernameCheckStatus('taken');
        setAdminUsernameError('Username sudah digunakan santri/alumni lain');
      } else {
        setUsernameCheckStatus('available');
        setAdminUsernameError(null);
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [newAdminUsernameInput, activeEditModal, existingAlumni, alumni.id]);

  // NIK duplicate check with debounce
  useEffect(() => {
    if (activeEditModal !== 'nik_kk') return;
    const clean = draftNik.replace(/\D/g, '').slice(0, 16);
    if (!clean || clean.length < 16) {
      setIsCheckingNik(false);
      setNikCheckStatus('idle');
      setDuplicateNik(null);
      return;
    }

    setIsCheckingNik(true);
    setNikCheckStatus('checking');

    const timer = setTimeout(() => {
      setIsCheckingNik(false);
      const allPool = (allSantriList && allSantriList.length > 0)
        ? allSantriList
        : (getGlobalAllSantriRecords().length > 0 ? getGlobalAllSantriRecords() : existingAlumni);
      const found = allPool.find(
        (a) => a.id !== alumni.id && a.nik && a.nik.replace(/\D/g, '').trim() === clean
      );
      if (found) {
        setDuplicateNik(found as any);
        setNikCheckStatus('taken');
      } else {
        setDuplicateNik(null);
        setNikCheckStatus('available');
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [draftNik, activeEditModal, allSantriList, existingAlumni, alumni.id]);

  // No KK duplicate check with debounce
  useEffect(() => {
    if (activeEditModal !== 'nik_kk') return;
    const clean = draftNoKk.replace(/\D/g, '').slice(0, 16);
    if (!clean || clean.length < 16) {
      setIsCheckingNoKk(false);
      setNoKkCheckStatus('idle');
      setDuplicateNoKk(null);
      return;
    }

    setIsCheckingNoKk(true);
    setNoKkCheckStatus('checking');

    const timer = setTimeout(() => {
      setIsCheckingNoKk(false);
      const allPool = (allSantriList && allSantriList.length > 0)
        ? allSantriList
        : (getGlobalAllSantriRecords().length > 0 ? getGlobalAllSantriRecords() : existingAlumni);
      const found = allPool.find(
        (a) => a.id !== alumni.id && a.noKk && a.noKk.replace(/\D/g, '').trim() === clean
      );
      if (found) {
        setDuplicateNoKk(found as any);
        setNoKkCheckStatus('taken');
      } else {
        setDuplicateNoKk(null);
        setNoKkCheckStatus('available');
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [draftNoKk, activeEditModal, allSantriList, existingAlumni, alumni.id]);

  // NIK Ayah duplicate check with debounce
  useEffect(() => {
    if (activeEditModal !== 'ayah') return;
    const clean = draftNikAyah.replace(/\D/g, '').slice(0, 16);
    if (!clean || clean.length < 16) {
      setIsCheckingNikAyah(false);
      setNikAyahCheckStatus('idle');
      setDuplicateNikAyah(null);
      return;
    }

    setIsCheckingNikAyah(true);
    setNikAyahCheckStatus('checking');

    const timer = setTimeout(() => {
      setIsCheckingNikAyah(false);
      const allPool = (allSantriList && allSantriList.length > 0)
        ? allSantriList
        : (getGlobalAllSantriRecords().length > 0 ? getGlobalAllSantriRecords() : existingAlumni);
      const found = allPool.find(
        (a) => a.id !== alumni.id && (
          (a.nik && a.nik.replace(/\D/g, '').trim() === clean) ||
          ((a as any).nikAyah && (a as any).nikAyah.replace(/\D/g, '').trim() === clean)
        )
      );
      if (found) {
        setDuplicateNikAyah(found as any);
        setNikAyahCheckStatus('taken');
      } else {
        setDuplicateNikAyah(null);
        setNikAyahCheckStatus('available');
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [draftNikAyah, activeEditModal, allSantriList, existingAlumni, alumni.id]);

  // NIK Ibu duplicate check with debounce
  useEffect(() => {
    if (activeEditModal !== 'ibu') return;
    const clean = draftNikIbu.replace(/\D/g, '').slice(0, 16);
    if (!clean || clean.length < 16) {
      setIsCheckingNikIbu(false);
      setNikIbuCheckStatus('idle');
      setDuplicateNikIbu(null);
      return;
    }

    setIsCheckingNikIbu(true);
    setNikIbuCheckStatus('checking');

    const timer = setTimeout(() => {
      setIsCheckingNikIbu(false);
      const allPool = (allSantriList && allSantriList.length > 0)
        ? allSantriList
        : (getGlobalAllSantriRecords().length > 0 ? getGlobalAllSantriRecords() : existingAlumni);
      const found = allPool.find(
        (a) => a.id !== alumni.id && (
          (a.nik && a.nik.replace(/\D/g, '').trim() === clean) ||
          ((a as any).nikIbu && (a as any).nikIbu.replace(/\D/g, '').trim() === clean)
        )
      );
      if (found) {
        setDuplicateNikIbu(found as any);
        setNikIbuCheckStatus('taken');
      } else {
        setDuplicateNikIbu(null);
        setNikIbuCheckStatus('available');
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [draftNikIbu, activeEditModal, allSantriList, existingAlumni, alumni.id]);

  // NIS duplicate check with debounce (memeriksa ketidaksamaan dengan alumni dan santri aktif)
  useEffect(() => {
    if (activeEditModal !== 'nis') return;
    const clean = draftNis.replace(/\D/g, '').trim();

    if (!clean) {
      lastCheckedNisRef.current = '';
      setNisCheckStatus('idle');
      setCollidingAlumni(null);
      setNisChecking(false);
      return;
    }

    if (clean.length < 7) {
      lastCheckedNisRef.current = clean;
      setNisCheckStatus('invalid');
      setCollidingAlumni(null);
      setNisChecking(false);
      return;
    }

    // Jika input ini sudah pernah dicek dan nilainya belum berubah, jangan lakukan cek ulang
    if (lastCheckedNisRef.current === clean) {
      return;
    }

    setNisChecking(true);
    setNisCheckStatus('checking');

    const timer = setTimeout(async () => {
      lastCheckedNisRef.current = clean;

      // 1. Cek dari allPool (allSantriList, getGlobalAllSantriRecords, existingAlumni)
      const allPool = (allSantriList && allSantriList.length > 0)
        ? allSantriList
        : (getGlobalAllSantriRecords().length > 0 ? getGlobalAllSantriRecords() : existingAlumni);

      let found: any = allPool.find(
        (a) => a.id !== alumni.id && a.nis && a.nis.replace(/\D/g, '').trim() === clean
      );

      // 2. Jika belum ditemukan di allPool, lakukan pengecekan langsung ke server
      if (!found) {
        try {
          const liveCheck = await checkNisLive(clean, alumni.id);
          if (!liveCheck.available && liveCheck.collidingRecord) {
            found = liveCheck.collidingRecord;
          }
        } catch (err) {
          console.warn('Gagal live check NIS:', err);
        }
      }

      if (draftNis.replace(/\D/g, '').trim() !== clean) {
        return;
      }

      lastCheckedNisRef.current = clean;
      setNisChecking(false);

      if (found) {
        setCollidingAlumni(found as any);
        setNisCheckStatus('taken');
      } else {
        setCollidingAlumni(null);
        setNisCheckStatus('available');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [draftNis, activeEditModal]);

  const openEditModal = (modalKey: string) => {
    if (modalKey === 'nama') setDraftName(editName);
    if (modalKey === 'username') {
      setNewAdminUsernameInput(editUsername || alumni.username || '');
      setAdminUsernameError(null);
      setIsCheckingUsername(false);
      setUsernameCheckStatus('idle');
    }
    if (modalKey === 'ttl') {
      setDraftTempatLahir(editTempatLahir);
      if (editTanggalLahir && editTanggalLahir.includes('-')) {
        const parts = editTanggalLahir.split('-');
        if (parts.length === 3) {
          const y = parts[0].padStart(4, '0');
          const m = String(parseInt(parts[1], 10) || '').padStart(2, '0');
          const d = String(parseInt(parts[2], 10) || '').padStart(2, '0');
          setDraftBirthYear(y);
          setDraftBirthMonth(m);
          setDraftBirthDay(d);
        } else {
          setDraftBirthDay('');
          setDraftBirthMonth('');
          setDraftBirthYear('');
        }
      } else {
        setDraftBirthDay('');
        setDraftBirthMonth('');
        setDraftBirthYear('');
      }
    }
    if (modalKey === 'gender_saudara') {
      setDraftGender(editGender);
      setDraftUrutanAnak(editUrutanAnak);
      setDraftJumlahSaudara(editJumlahSaudara);
    }
    if (modalKey === 'nik_kk') {
      setDraftNik(editNik);
      setDraftNoKk(editNoKk);
      setIsCheckingNik(false);
      setIsCheckingNoKk(false);
      setNikCheckStatus('idle');
      setNoKkCheckStatus('idle');
      setDuplicateNik(null);
      setDuplicateNoKk(null);
    }
    if (modalKey === 'alamat') {
      setDraftProvince(editProvince);
      setDraftCity(editCity);
      setDraftKecamatan(editKecamatan);
      setDraftDesa(editDesa);
      setDraftAlamatLengkap(editAlamatLengkap);
      setDraftCoordinates(editCoordinates);
    }
    if (modalKey === 'kontak') {
      setDraftPhone(editPhone);
      setDraftEmail(editEmail);
    }
    if (modalKey === 'pekerjaan') {
      setDraftOccupation(editOccupation);
      setDraftInstitution(editInstitution);
    }
    if (modalKey === 'nis') {
      const initialNis = editNis || '';
      setDraftNis(initialNis);
      lastCheckedNisRef.current = initialNis.replace(/\D/g, '').trim() || null;
      setNisCheckStatus('idle');
      setCollidingAlumni(null);
      setIsManualShiftApplied(false);
      setAffectedManualAlumni([]);
      setNisChecking(false);
    }
    if (modalKey === 'tanggal_masuk') {
      const hasDate = Boolean(editEntryDate && editEntryDate.trim() !== '');
      setIsEntryDateKnown(hasDate);
      setTempEntryDate(hasDate ? editEntryDate : '2021-07-15');
    }
    if (modalKey === 'tanggal_keluar') {
      const hasDate = Boolean(editGradDate && editGradDate.trim() !== '');
      setIsGradDateKnown(hasDate);
      setTempGradDate(hasDate ? editGradDate : '2024-05-20');
    }
    if (modalKey === 'ayah') {
      setDraftNamaAyah(editNamaAyah);
      setDraftNikAyah(editNikAyah);
      setDraftPekerjaanAyah(editPekerjaanAyah);
      setDraftPendidikanAyah(editPendidikanAyah);
      setIsCheckingNikAyah(false);
      setNikAyahCheckStatus('idle');
      setDuplicateNikAyah(null);
    }
    if (modalKey === 'ibu') {
      setDraftNamaIbu(editNamaIbu);
      setDraftNikIbu(editNikIbu);
      setDraftPekerjaanIbu(editPekerjaanIbu);
      setDraftPendidikanIbu(editPendidikanIbu);
      setIsCheckingNikIbu(false);
      setNikIbuCheckStatus('idle');
      setDuplicateNikIbu(null);
    }
    setActiveEditModal(modalKey);
  };

  // Sinkronisasi state saat data alumni dari props berubah
  useEffect(() => {
    setEditPhotoUrl(alumni.photoUrl || '');
    setEditName(alumni.name);
    setEditUsername(alumni.username || '');
    setEditTempatLahir(alumni.tempatLahir || '');
    setEditTanggalLahir(alumni.tanggalLahir || '');
    setEditGender((alumni.gender as 'L' | 'P') || 'L');
    setEditUrutanAnak(
      alumni.anak_ke !== undefined && alumni.anak_ke !== null
        ? Number(alumni.anak_ke)
        : (alumni.urutanAnak !== undefined && alumni.urutanAnak !== null ? Number(alumni.urutanAnak) : 1)
    );
    setEditJumlahSaudara(
      alumni.dari_bersaudara !== undefined && alumni.dari_bersaudara !== null
        ? Number(alumni.dari_bersaudara)
        : (alumni.jumlahSaudara !== undefined && alumni.jumlahSaudara !== null ? Number(alumni.jumlahSaudara) : 0)
    );
    setEditNik(alumni.nik || '');
    setEditNoKk(alumni.noKk || '');
    setEditPhone(alumni.phone || '');
    setEditEmail(alumni.email || '');
    setEditOccupation(alumni.occupation || '');
    setEditInstitution(alumni.institution || '');
    setEditProvince(alumni.province || '');
    setEditCity(alumni.city || '');
    setEditKecamatan(alumni.kecamatan || '');
    setEditDesa(alumni.desa || '');
    setEditAlamatLengkap(alumni.alamatLengkap || '');
    setEditCoordinates(alumni.coordinates || null);
    setEditNis(alumni.nis || '');
    setEditEntryDate(alumni.entryDate || '');
    setEditGradDate(alumni.gradDate || '');
    setTempEntryDate(alumni.entryDate || '');
    setTempGradDate(alumni.gradDate || '');
    setIsEntryDateKnown(Boolean(alumni.entryDate && alumni.entryDate.trim() !== ''));
    setIsGradDateKnown(Boolean(alumni.gradDate && alumni.gradDate.trim() !== ''));
    setEditNamaAyah(alumni.namaAyah || '');
    setEditNikAyah(alumni.nikAyah || '');
    setEditPekerjaanAyah(alumni.pekerjaanAyah || '');
    setEditPendidikanAyah(alumni.pendidikanAyah || '');
    setEditNamaIbu(alumni.namaIbu || '');
    setEditNikIbu(alumni.nikIbu || '');
    setEditPekerjaanIbu(alumni.pekerjaanIbu || '');
    setEditPendidikanIbu(alumni.pendidikanIbu || '');
  }, [alumni]);

  const photoFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUpdate = (updated: Partial<AlumniRecord>) => {
    const cleanNama = updated.name ?? (updated as any).nama ?? alumni.name;
    const fullMerged: AlumniRecord = {
      ...alumni,
      ...updated,
      name: cleanNama,
      status: 'alumni',
    };
    (fullMerged as any).nama = cleanNama;
    (fullMerged as any).status_keanggotaan = 'Alumni';

    const finalUpdates = {
      ...updated,
      ...(updated.name !== undefined ? { nama: cleanNama } : {}),
      status_keanggotaan: 'Alumni',
    };

    if (onSave) {
      onSave(alumni.id, finalUpdates, fullMerged);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const newUrl = event.target.result as string;
        setEditPhotoUrl(newUrl);
        handleUpdate({ photoUrl: newUrl });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = () => {
    setEditPhotoUrl('');
    handleUpdate({ photoUrl: '' });
  };

  const addressText = [editDesa, editKecamatan, editCity, editProvince].filter(Boolean).join(', ') || 'Alamat belum diatur';

  return (
    <div className="fixed inset-0 z-[100005] bg-[#f0f2fb] flex flex-col w-full h-full overflow-hidden animate-in fade-in select-none">
      {/* ================= TOP NAVIGATION BAR (TEKS "Detail Biodata Alumni", TANPA TOMBOL KANAN) ================= */}
      <div className="bg-white px-4 py-3 border-b border-slate-200/80 shrink-0 z-30 shadow-2xs flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          title="Kembali"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h2 className="font-display font-bold text-sm sm:text-base text-slate-900 leading-tight text-center">
          Detail Biodata Alumni
        </h2>

        {/* Placeholder penyeimbang agar judul tetap tepat di tengah */}
        <div className="w-9 h-9 shrink-0" />
      </div>

      {/* ================= PROFILE BODY ================= */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full flex flex-col">
          {/* FOTO SAMPUL / COVER */}
          <div 
            className="relative w-full h-44 sm:h-52 overflow-hidden select-none shrink-0"
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 60%, #075985 100%)',
            }}
          >
            <div className="absolute inset-0 droplet-pattern opacity-15 pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-44 h-44 bg-sky-300/25 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-amber-300/20 rounded-full blur-xl pointer-events-none" />
          </div>

          {/* WADAH KARTU PUTIH MELENGKUNG */}
          <div className="bg-white rounded-t-[36px] shadow-sm px-6 pt-0 pb-24 space-y-6 flex-1 border-t border-slate-200/40 relative z-20 -mt-10 sm:-mt-12">
            {/* Lingkaran Avatar dengan klik fullscreen dan tombol kamera */}
            <div className="text-center flex flex-col items-center relative -top-11 -mb-7">
              <div className="relative inline-block mb-1.5">
                <button
                  type="button"
                  onClick={() => setShowFullscreenPhoto(true)}
                  className="relative w-22 h-22 sm:w-24 sm:h-24 rounded-full ring-4 ring-white shadow-lg overflow-hidden bg-slate-200 flex items-center justify-center cursor-pointer group transition-transform active:scale-95"
                  title="Klik untuk melihat foto profil layar penuh"
                >
                  <div className="w-full h-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold text-3xl flex items-center justify-center">
                    {(editName || alumni.name).charAt(0)}
                  </div>
                  {editPhotoUrl && (
                    <img
                      src={getAlumniPhotoUrl(editPhotoUrl)}
                      alt={editName || alumni.name}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  )}
                </button>

                {/* Tombol Kamera Ganti Foto Profil Alumni oleh Admin */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    photoFileInputRef.current?.click();
                  }}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white shadow-md border border-slate-200/80 text-slate-700 hover:text-sky-600 flex items-center justify-center cursor-pointer active:scale-90 transition-all ring-2 ring-white z-10"
                  title="Ganti Foto Profil Alumni"
                >
                  <Camera className="w-4 h-4" />
                </button>

                <input
                  ref={photoFileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>

              <h2 className="font-display font-bold text-lg text-slate-900 tracking-tight">
                {editName || alumni.name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {[editKecamatan, editCity, editProvince].filter(Boolean).join(', ')}
              </p>
            </div>

            {/* SEGMEN 1: INFORMASI PRIBADI */}
            <div>
              <p className="text-xs font-semibold text-slate-400 text-center tracking-wide mb-3">
                Informasi Pribadi
              </p>

              <div className="divide-y divide-slate-100">
                {/* 1. Nama Lengkap */}
                <div
                  onClick={() => openEditModal('nama')}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">Nama Lengkap</p>
                      <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                        {editName}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* 1b. Username Alumni */}
                <div
                  onClick={() => openEditModal('username')}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <AtSign className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">Username Alumni</p>
                      <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                        {editUsername || alumni.username ? `@${editUsername || alumni.username}` : 'Belum diatur'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* 2. Tempat, Tanggal Lahir (TTL) */}
                <div
                  onClick={() => openEditModal('ttl')}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">Tempat, Tanggal Lahir</p>
                      <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                        {editTempatLahir ? `${editTempatLahir}, ` : ''}{editTanggalLahir ? formatToDDMMYYYY(editTanggalLahir) : 'Belum diisi'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* 3. Gender & Saudara */}
                <div
                  onClick={() => openEditModal('gender_saudara')}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">Jenis Kelamin & Jumlah Saudara</p>
                      <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                        {editGender === 'P' ? 'Perempuan' : 'Laki-laki'}
                        {editUrutanAnak ? `, Anak ke-${editUrutanAnak}` : ''}
                        {editJumlahSaudara !== undefined && editJumlahSaudara !== null
                          ? `, Jumlah saudara: ${editJumlahSaudara}`
                          : ''}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* 4. NIK & Nomor KK */}
                <div
                  onClick={() => openEditModal('nik_kk')}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">NIK & No. KK</p>
                      <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                        {editNik || '-'} · {editNoKk || '-'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* 5. Alamat */}
                <div
                  onClick={() => openEditModal('alamat')}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">Alamat Domisili</p>
                      <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                        {addressText}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* 6. Kontak WhatsApp & Email */}
                <div
                  onClick={() => openEditModal('kontak')}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">WhatsApp & Email</p>
                      <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                        {editPhone || '-'} · {editEmail || '-'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* 7. Pekerjaan & Instansi */}
                <div
                  onClick={() => openEditModal('pekerjaan')}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <Briefcase className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">Pekerjaan & Instansi</p>
                      <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                        {editOccupation || '-'}
                        {editInstitution ? ` · ${editInstitution}` : ''}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>

            {/* SEGMEN 2: RIWAYAT PENDIDIKAN PONDOK (JENJANG & KAMAR DIHAPUS SESUAI PERMINTAAN) */}
            <div>
              <p className="text-xs font-semibold text-slate-400 text-center tracking-wide mb-3">
                Riwayat Pendidikan
              </p>

              <div className="divide-y divide-slate-100">
                {/* 1. NIS (Bisa diubah oleh Admin) */}
                <div
                  onClick={() => openEditModal('nis')}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">Nomor Induk Santri (NIS)</p>
                      <p className="text-sm font-semibold font-mono text-slate-800 truncate mt-0.5">
                        {editNis || '-'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>



                {/* 4. Tanggal Masuk */}
                <div
                  onClick={() => openEditModal('tanggal_masuk')}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-sky-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">Tanggal Masuk</p>
                      <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                        {editEntryDate ? formatToDDMMYYYY(editEntryDate) : 'Belum diisi'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* 5. Tanggal Keluar */}
                <div
                  onClick={() => openEditModal('tanggal_keluar')}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-sky-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">Tanggal Keluar (Boyong)</p>
                      <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                        {editGradDate ? formatToDDMMYYYY(editGradDate) : (alumni.gradYear ? `Tahun ${alumni.gradYear}` : 'Belum diisi')}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>

            {/* SEGMEN 3: INFORMASI ORANG TUA */}
            <div>
              <p className="text-xs font-semibold text-slate-400 text-center tracking-wide mb-3">
                Informasi Orang Tua
              </p>

              <div className="divide-y divide-slate-100">
                {/* 1. Ayah */}
                <div
                  onClick={() => openEditModal('ayah')}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">Data Ayah Kandung</p>
                      {editNamaAyah ? (
                        <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                          {editNamaAyah}{editNikAyah ? ` · NIK: ${editNikAyah}` : ''}{editPekerjaanAyah ? ` · ${editPekerjaanAyah}` : ''}{editPendidikanAyah ? ` · ${editPendidikanAyah}` : ''}
                        </p>
                      ) : (
                        <p className="text-sm font-normal text-slate-400 mt-0.5">Belum diisi</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* 2. Ibu */}
                <div
                  onClick={() => openEditModal('ibu')}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">Data Ibu Kandung</p>
                      {editNamaIbu ? (
                        <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                          {editNamaIbu}{editNikIbu ? ` · NIK: ${editNikIbu}` : ''}{editPekerjaanIbu ? ` · ${editPekerjaanIbu}` : ''}{editPendidikanIbu ? ` · ${editPendidikanIbu}` : ''}
                        </p>
                      ) : (
                        <p className="text-sm font-normal text-slate-400 mt-0.5">Belum diisi</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>

            {/* SEGMEN 4: AKUN & KEAMANAN */}
            <div>
              <p className="text-xs font-semibold text-slate-400 text-center tracking-wide mb-3">
                Keamanan Akun
              </p>

              <div className="divide-y divide-slate-100">
                <div
                  onClick={() => onResetPassword(alumni.id)}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-amber-50/70 -mx-3 px-3 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <KeyRound className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 leading-tight">Reset Kata Sandi Akun</p>
                      <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                        Kembalikan kata sandi login alumni ini ke pengaturan awal
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-xl">
                    Reset
                  </span>
                </div>
              </div>
            </div>

            {/* TOMBOL HAPUS DATA ALUMNI (PALING BAWAH) */}
            <div className="pt-4 pb-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(true)}
                className="w-full py-3 px-4 rounded-2xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] shadow-2xs"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Hapus Data Alumni</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= POPUP KONFIRMASI HAPUS ALUMNI ================= */}
      {showDeleteConfirmModal && (
        <div 
          className="fixed inset-0 z-[100030] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in select-none"
          onClick={() => setShowDeleteConfirmModal(false)}
        >
          <div 
            className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3.5 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-900">
                Hapus Data Alumni?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Apakah Anda yakin ingin menghapus data alumni <b>"{alumni.name}"</b>? Tindakan ini akan menghapus seluruh data alumni dari portal.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  onDeleteAlumni?.(alumni.id);
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-md shadow-rose-600/20"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= FULLSCREEN PHOTO VIEWER (DENGAN X, HAPUS, ZOOM IN/OUT & GESER) ================= */}
      {showFullscreenPhoto && (
        <FullscreenPhotoViewerModal
          photoUrl={editPhotoUrl}
          name={editName || alumni.name}
          onClose={() => setShowFullscreenPhoto(false)}
          onDelete={editPhotoUrl ? handleDeletePhoto : undefined}
        />
      )}

      {/* ================= EDIT MODALS UNTUK SETIAP FIELD ================= */}
      {/* 1. EDIT NAMA */}
      {activeEditModal === 'nama' && (
        <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900">Ubah Nama Lengkap</h3>
              <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
              placeholder="Nama lengkap..."
            />
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button type="button" onClick={() => { 
                const trimmed = draftName.trim();
                if (!trimmed) return;
                setEditName(trimmed);
                handleUpdate({ name: trimmed }); 
                setActiveEditModal(null); 
              }} className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* 1b. EDIT USERNAME */}
      {activeEditModal === 'username' && (
        <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900">Ubah Username Alumni</h3>
              <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Username login bersifat unik. Spasi akan otomatis diganti underscore (_) dan tidak boleh sama dengan alumni lain.
              </p>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Username Baru</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">@</span>
                  <input
                    type="text"
                    value={newAdminUsernameInput}
                    onChange={(e) => {
                      const clean = e.target.value.toLowerCase().replace(/[\s\t\n]+/g, '_').replace(/[^a-z0-9_]/g, '');
                      setNewAdminUsernameInput(clean);
                    }}
                    className="w-full pl-7 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
                    placeholder="username_baru"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                    {isCheckingUsername && (
                      <Loader2 className="w-4 h-4 text-sky-600 animate-spin" />
                    )}
                    {!isCheckingUsername && newAdminUsernameInput.trim() && usernameCheckStatus === 'available' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    {!isCheckingUsername && newAdminUsernameInput.trim() && usernameCheckStatus === 'taken' && (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    )}
                  </div>
                </div>
                {!isCheckingUsername && usernameCheckStatus === 'taken' && adminUsernameError && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{adminUsernameError}</p>
                )}
                {!isCheckingUsername && usernameCheckStatus === 'available' && newAdminUsernameInput.trim() && (
                  <p className="text-[11px] text-emerald-600 mt-1 font-medium">Username tersedia</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button
                type="button"
                disabled={!newAdminUsernameInput.trim() || isCheckingUsername || usernameCheckStatus === 'taken'}
                onClick={() => {
                  const clean = formatBaseUsername(newAdminUsernameInput);
                  if (!clean) return;
                  if (isUsernameTaken(clean, existingAlumni, alumni.id)) {
                    setAdminUsernameError('Username sudah digunakan santri/alumni lain');
                    return;
                  }
                  setEditUsername(clean);
                  handleUpdate({ username: clean });
                  setActiveEditModal(null);
                }}
                className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. EDIT TTL */}
      {activeEditModal === 'ttl' && (
        <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900">Ubah Tempat & Tanggal Lahir</h3>
              <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tempat Lahir</label>
                <input
                  type="text"
                  value={draftTempatLahir}
                  onChange={(e) => setDraftTempatLahir(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                  placeholder="Kota/Kabupaten kelahiran..."
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Lahir</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={2}
                      placeholder="DD"
                      value={draftBirthDay}
                      onChange={(e) => {
                        const val = formatDayInput(e.target.value, draftBirthMonth, draftBirthYear);
                        setDraftBirthDay(val);
                      }}
                      onBlur={() => {
                        if (draftBirthDay) {
                          setDraftBirthDay(padDayInput(draftBirthDay, draftBirthMonth, draftBirthYear));
                        }
                      }}
                      className="w-full text-center px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={2}
                      placeholder="MM"
                      value={draftBirthMonth}
                      onChange={(e) => {
                        const val = formatMonthInput(e.target.value);
                        setDraftBirthMonth(val);
                        if (draftBirthDay && val) {
                          const currentD = parseInt(draftBirthDay, 10);
                          const maxD = getMaxDaysInMonth(val, draftBirthYear);
                          if (currentD > maxD) {
                            setDraftBirthDay(String(maxD).padStart(2, '0'));
                          }
                        }
                      }}
                      onBlur={() => {
                        if (draftBirthMonth) {
                          const padded = padMonthInput(draftBirthMonth);
                          setDraftBirthMonth(padded);
                          if (draftBirthDay) {
                            const currentD = parseInt(draftBirthDay, 10);
                            const maxD = getMaxDaysInMonth(padded, draftBirthYear);
                            if (currentD > maxD) {
                              setDraftBirthDay(String(maxD).padStart(2, '0'));
                            }
                          }
                        }
                      }}
                      className="w-full text-center px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      placeholder="YYYY"
                      value={draftBirthYear}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setDraftBirthYear(val);
                        if (draftBirthDay && draftBirthMonth && val.length === 4) {
                          const currentD = parseInt(draftBirthDay, 10);
                          const maxD = getMaxDaysInMonth(draftBirthMonth, val);
                          if (currentD > maxD) {
                            setDraftBirthDay(String(maxD).padStart(2, '0'));
                          }
                        }
                      }}
                      onBlur={() => {
                        if (draftBirthYear) {
                          const padded = padYearInput(draftBirthYear);
                          setDraftBirthYear(padded);
                          if (draftBirthDay && draftBirthMonth) {
                            const currentD = parseInt(draftBirthDay, 10);
                            const maxD = getMaxDaysInMonth(draftBirthMonth, padded);
                            if (currentD > maxD) {
                              setDraftBirthDay(String(maxD).padStart(2, '0'));
                            }
                          }
                        }
                      }}
                      className="w-full text-center px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button type="button" onClick={() => { 
                let formattedDate = '';
                if (draftBirthYear && draftBirthMonth && draftBirthDay) {
                  const y = padYearInput(draftBirthYear);
                  const m = padMonthInput(draftBirthMonth);
                  const d = padDayInput(draftBirthDay, m, y);
                  formattedDate = `${y}-${m}-${d}`;
                }
                setEditTempatLahir(draftTempatLahir);
                setEditTanggalLahir(formattedDate);
                handleUpdate({ tempatLahir: draftTempatLahir, tanggalLahir: formattedDate }); 
                setActiveEditModal(null); 
              }} className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. EDIT GENDER & SAUDARA */}
      {activeEditModal === 'gender_saudara' && (
        <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900">Ubah Gender & Saudara</h3>
              <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDraftGender('L')}
                    className={`p-2.5 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                      draftGender === 'L' ? 'bg-sky-50 border-sky-600 text-sky-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Laki-laki
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraftGender('P')}
                    className={`p-2.5 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                      draftGender === 'P' ? 'bg-rose-50 border-rose-600 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Perempuan
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Anak Ke</label>
                  <input
                    type="number"
                    min={1}
                    max={25}
                    value={draftUrutanAnak}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => e.currentTarget.select()}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === '') {
                        setDraftUrutanAnak('');
                        return;
                      }
                      const val = parseInt(raw, 10);
                      setDraftUrutanAnak(isNaN(val) ? '' : val);
                    }}
                    onBlur={() => {
                      if (draftUrutanAnak === '' || Number(draftUrutanAnak) < 1) {
                        setDraftUrutanAnak(1);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jumlah Saudara</label>
                  <input
                    type="number"
                    min={0}
                    max={25}
                    value={draftJumlahSaudara}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => e.currentTarget.select()}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === '') {
                        setDraftJumlahSaudara('');
                        return;
                      }
                      const val = parseInt(raw, 10);
                      setDraftJumlahSaudara(isNaN(val) ? '' : Math.max(0, val));
                    }}
                    onBlur={() => {
                      if (draftJumlahSaudara === '' || Number(draftJumlahSaudara) < 0) {
                        setDraftJumlahSaudara(0);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs font-semibold"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button 
                type="button" 
                onClick={() => { 
                  const finalAnak = typeof draftUrutanAnak === 'number'
                    ? Math.max(1, draftUrutanAnak)
                    : (parseInt(String(draftUrutanAnak), 10) || 1);
                  const finalSaudara = typeof draftJumlahSaudara === 'number'
                    ? Math.max(0, draftJumlahSaudara)
                    : (parseInt(String(draftJumlahSaudara), 10) || 0);
                  setEditGender(draftGender);
                  setEditUrutanAnak(finalAnak);
                  setEditJumlahSaudara(finalSaudara);
                  handleUpdate({ 
                    gender: draftGender, 
                    anak_ke: finalAnak, 
                    dari_bersaudara: finalSaudara, 
                    urutanAnak: finalAnak, 
                    jumlahSaudara: finalSaudara 
                  }); 
                  setActiveEditModal(null); 
                }} 
                className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. EDIT NIK & NO KK */}
      {activeEditModal === 'nik_kk' && (() => {
        const cleanNik = draftNik.replace(/\D/g, '').slice(0, 16);
        const cleanNoKk = draftNoKk.replace(/\D/g, '').slice(0, 16);
        const isNikValid = cleanNik.length === 0 || (cleanNik.length === 16 && !duplicateNik && !isCheckingNik);
        const isKkValid = cleanNoKk.length === 0 || (cleanNoKk.length === 16 && !duplicateNoKk && !isCheckingNoKk);
        const isValid = isNikValid && isKkValid && !isCheckingNik && !isCheckingNoKk;

        return (
          <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
            <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <h3 className="font-bold text-sm text-slate-900">Ubah NIK & No. KK</h3>
                <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Induk Kependudukan (NIK)</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={16}
                      value={draftNik}
                      onChange={(e) => setDraftNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
                      className="w-full px-3 py-2 pr-9 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs font-mono"
                      placeholder="16 digit"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                      {isCheckingNik && (
                        <Loader2 className="w-4 h-4 text-sky-600 animate-spin" />
                      )}
                      {!isCheckingNik && cleanNik.length === 16 && !duplicateNik && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                      {!isCheckingNik && cleanNik.length === 16 && duplicateNik && (
                        <XCircle className="w-4 h-4 text-rose-500" />
                      )}
                    </div>
                  </div>
                  {cleanNik.length > 0 && cleanNik.length < 16 && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1">
                      Kurang {16 - cleanNik.length} digit
                    </p>
                  )}
                  {!isCheckingNik && cleanNik.length === 16 && duplicateNik && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1">
                      NIK sudah digunakan oleh {duplicateNik.name} ({(duplicateNik as any).status || 'Santri/Alumni'})
                    </p>
                  )}
                  {!isCheckingNik && cleanNik.length === 16 && !duplicateNik && (
                    <p className="text-[11px] text-emerald-600 font-medium mt-1">
                      NIK valid & belum terdaftar
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Kartu Keluarga (KK)</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={16}
                      value={draftNoKk}
                      onChange={(e) => setDraftNoKk(e.target.value.replace(/\D/g, '').slice(0, 16))}
                      className="w-full px-3 py-2 pr-9 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs font-mono"
                      placeholder="16 digit"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                      {isCheckingNoKk && (
                        <Loader2 className="w-4 h-4 text-sky-600 animate-spin" />
                      )}
                      {!isCheckingNoKk && cleanNoKk.length === 16 && !duplicateNoKk && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                      {!isCheckingNoKk && cleanNoKk.length === 16 && duplicateNoKk && (
                        <XCircle className="w-4 h-4 text-rose-500" />
                      )}
                    </div>
                  </div>
                  {cleanNoKk.length > 0 && cleanNoKk.length < 16 && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1">
                      Kurang {16 - cleanNoKk.length} digit
                    </p>
                  )}
                  {!isCheckingNoKk && cleanNoKk.length === 16 && duplicateNoKk && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1">
                      Nomor KK sudah digunakan oleh {duplicateNoKk.name} ({(duplicateNoKk as any).status || 'Santri/Alumni'})
                    </p>
                  )}
                  {!isCheckingNoKk && cleanNoKk.length === 16 && !duplicateNoKk && (
                    <p className="text-[11px] text-emerald-600 font-medium mt-1">
                      Nomor KK valid & belum terdaftar
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
                <button 
                  type="button" 
                  disabled={!isValid}
                  onClick={() => { 
                    setEditNik(cleanNik);
                    setEditNoKk(cleanNoKk);
                    handleUpdate({ nik: cleanNik, noKk: cleanNoKk }); 
                    setActiveEditModal(null); 
                  }} 
                  className={`flex-1 py-2 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                    isValid 
                      ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-xs' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 5. EDIT ALAMAT */}
      {activeEditModal === 'alamat' && (
        <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900">Ubah Alamat Domisili</h3>
              <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <WilayahAddressFilter
                province={draftProvince}
                city={draftCity}
                kecamatan={draftKecamatan}
                desa={draftDesa}
                alamatLengkap={draftAlamatLengkap}
                coordinates={draftCoordinates}
                showAlamatLengkap={true}
                showLocationTag={true}
                onChange={({ province, city, kecamatan, desa, alamatLengkap, coordinates }) => {
                  setDraftProvince(province);
                  setDraftCity(city);
                  setDraftKecamatan(kecamatan);
                  setDraftDesa(desa);
                  if (alamatLengkap !== undefined) setDraftAlamatLengkap(alamatLengkap);
                  if (coordinates) setDraftCoordinates(coordinates);
                }}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button type="button" onClick={() => {
                setEditProvince(draftProvince);
                setEditCity(draftCity);
                setEditKecamatan(draftKecamatan);
                setEditDesa(draftDesa);
                setEditAlamatLengkap(draftAlamatLengkap);
                setEditCoordinates(draftCoordinates);
                handleUpdate({
                  province: draftProvince,
                  city: draftCity,
                  kecamatan: draftKecamatan,
                  desa: draftDesa,
                  alamatLengkap: draftAlamatLengkap,
                  coordinates: draftCoordinates || undefined
                });
                setActiveEditModal(null);
              }} className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* 6. EDIT KONTAK */}
      {activeEditModal === 'kontak' && (
        <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900">Ubah Kontak WhatsApp & Email</h3>
              <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor WhatsApp</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={draftPhone}
                  onChange={(e) => setDraftPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                  placeholder="08123456789"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alamat Email</label>
                <input
                  type="email"
                  value={draftEmail}
                  onChange={(e) => setDraftEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                  placeholder="alumni@gmail.com"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button type="button" onClick={() => { 
                setEditPhone(draftPhone);
                setEditEmail(draftEmail);
                handleUpdate({ phone: draftPhone, email: draftEmail }); 
                setActiveEditModal(null); 
              }} className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* 7. EDIT PEKERJAAN */}
      {activeEditModal === 'pekerjaan' && (
        <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900">Ubah Pekerjaan & Instansi</h3>
              <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Profesi / Pekerjaan</label>
                <input
                  type="text"
                  value={draftOccupation}
                  onChange={(e) => setDraftOccupation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                  placeholder="Profesi saat ini..."
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Instansi / Lembaga / Usaha</label>
                <input
                  type="text"
                  value={draftInstitution}
                  onChange={(e) => setDraftInstitution(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                  placeholder="Nama kantor, usaha, sekolah..."
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
              <button type="button" onClick={() => { 
                setEditOccupation(draftOccupation);
                setEditInstitution(draftInstitution);
                handleUpdate({ occupation: draftOccupation, institution: draftInstitution }); 
                setActiveEditModal(null); 
              }} className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* 8. EDIT NIS */}
      {activeEditModal === 'nis' && (() => {
        const cleanNis = draftNis.replace(/\D/g, '');
        const isCurrentNis = cleanNis.length === 7 && cleanNis === (alumni.nis || '').replace(/\D/g, '').trim();
        const isAvailable = cleanNis.length === 7 && (nisCheckStatus === 'available' || isCurrentNis);
        const isColliding = cleanNis.length === 7 && !isCurrentNis && nisCheckStatus === 'taken' && collidingAlumni !== null;
        const isValid = !nisChecking && (cleanNis.length === 0 || isAvailable || isManualShiftApplied);

        return (
          <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
            <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <h3 className="font-bold text-sm text-slate-900">Ubah Nomor Induk Santri (NIS)</h3>
                <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-xs">Nomor Induk Santri (NIS)</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={7}
                    value={draftNis}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 7);
                      setDraftNis(val);
                      setIsManualShiftApplied(false);
                      setAffectedManualAlumni([]);
                    }}
                    className={`w-full px-3 py-2 pr-9 bg-slate-50 border rounded-xl font-mono focus:bg-white text-xs ${
                      isColliding && !isManualShiftApplied
                        ? 'border-amber-400 focus:ring-2 focus:ring-amber-200'
                        : isAvailable || isManualShiftApplied
                        ? 'border-emerald-400 focus:ring-2 focus:ring-emerald-200'
                        : 'border-slate-200 focus:ring-2 focus:ring-sky-500'
                    }`}
                    placeholder="7 digit (misal: 2012001)"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                    {nisChecking && (
                      <Loader2 className="w-4 h-4 text-sky-600 animate-spin" />
                    )}
                    {!nisChecking && cleanNis.length === 7 && isColliding && !isManualShiftApplied && (
                      <AlertCircle className="w-4 h-4 text-amber-500 stroke-[2.5]" />
                    )}
                    {!nisChecking && cleanNis.length === 7 && (isAvailable || isManualShiftApplied) && (
                      <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                    )}
                  </div>
                </div>

                {/* Keterangan validasi */}
                {cleanNis.length > 0 && cleanNis.length < 7 && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1">
                    Kurang {7 - cleanNis.length} digit (harus 7 digit)
                  </p>
                )}

                {!nisChecking && isAvailable && (
                  <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>NIS tersedia</span>
                  </p>
                )}

                {!nisChecking && isColliding && !isManualShiftApplied && (
                  <div className="mt-2.5 p-3 bg-amber-50 rounded-2xl border border-amber-200/80 space-y-2 animate-in fade-in">
                    <p className="text-xs text-amber-900 leading-snug">
                      NIS <span className="font-mono font-bold">{cleanNis}</span> sudah digunakan oleh <b>{collidingAlumni?.name}</b> ({collidingAlumni?.status || 'Santri'}).
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const allPool = (allSantriList && allSantriList.length > 0)
                          ? allSantriList
                          : (getGlobalAllSantriRecords().length > 0 ? getGlobalAllSantriRecords() : existingAlumni);
                        const shiftResult = cascadeShiftOnManualNisChange(alumni.id, cleanNis, allPool as any);
                        setAffectedManualAlumni(shiftResult.affectedAlumni);
                        setIsManualShiftApplied(true);
                      }}
                      className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-2xs text-center"
                    >
                      Sesuaikan Urutan NIS
                    </button>
                  </div>
                )}

                {isManualShiftApplied && (
                  <div className="mt-2.5 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 leading-snug flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Urutan NIS disesuaikan ({affectedManualAlumni.length} data digeser). Klik Simpan.</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
                <button 
                  type="button" 
                  disabled={!isValid}
                  className={`flex-1 py-2 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                    isValid
                      ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                  onClick={() => { 
                    if (isManualShiftApplied && affectedManualAlumni.length > 0) {
                      for (const aff of affectedManualAlumni) {
                        const targetAlm = existingAlumni.find(a => a.id === aff.id);
                        if (targetAlm && onSave) {
                          const updatedFull = { ...targetAlm, nis: aff.nis, status: 'alumni' as const };
                          (updatedFull as any).status_keanggotaan = 'Alumni';
                          onSave(aff.id, { nis: aff.nis }, updatedFull);
                        } else {
                          // Data santri aktif di database
                          fetch(`/api/db/santri/${aff.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ nis: aff.nis })
                          }).catch(() => {});
                        }
                      }
                      // Update in-memory pool
                      const updatedPool = getGlobalAllSantriRecords().map(item => {
                        const match = affectedManualAlumni.find(a => a.id === item.id);
                        if (match) return { ...item, nis: match.nis };
                        if (item.id === alumni.id) return { ...item, nis: cleanNis };
                        return item;
                      });
                      setGlobalAllSantriRecords(updatedPool);
                    }

                    setEditNis(cleanNis);
                    handleUpdate({ nis: cleanNis }); 
                    setActiveEditModal(null); 
                  }} 
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 11. EDIT TANGGAL MASUK */}
      {activeEditModal === 'tanggal_masuk' && (
        <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900 text-center">Ubah Tanggal Masuk Pondok</h3>
              <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            {/* Toggle Sudah diketahui */}
            <div className="flex items-center justify-between bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-700">Sudah diketahui</span>
              <button
                type="button"
                onClick={() => {
                  const nextVal = !isEntryDateKnown;
                  setIsEntryDateKnown(nextVal);
                  if (nextVal && !tempEntryDate) {
                    setTempEntryDate('2021-07-15');
                  }
                }}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  isEntryDateKnown ? 'bg-sky-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {isEntryDateKnown ? (
              <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-2.5">
                <DateWheelPicker
                  value={tempEntryDate || '2021-07-15'}
                  onChange={(val) => setTempEntryDate(val)}
                  minYear={1980}
                  maxYear={new Date().getFullYear()}
                  maxDate={new Date().toISOString().split('T')[0]}
                />
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                Tanggal masuk belum diketahui. NIS akan otomatis dikosongkan.
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer hover:bg-slate-50">Batal</button>
              <button type="button" onClick={() => {
                const newDate = isEntryDateKnown ? (tempEntryDate || '2021-07-15') : '';
                const newYear = newDate ? newDate.substring(0, 4) : '';
                
                // Hitung cascade pergeseran NIS
                const cascade = calculateCascadeShiftOnEntryDateChange(alumni.id, newDate, existingAlumni);
                
                // Simpan data alumni lain yang tergeser
                if (onSave && cascade.affectedAlumni.length > 0) {
                  for (const aff of cascade.affectedAlumni) {
                    const targetAlm = existingAlumni.find(a => a.id === aff.id);
                    if (targetAlm) {
                      const updatedFull = { ...targetAlm, nis: aff.nis, status: 'alumni' as const };
                      (updatedFull as any).status_keanggotaan = 'Alumni';
                      onSave(aff.id, { nis: aff.nis }, updatedFull);
                    }
                  }
                }

                setEditEntryDate(newDate);
                setEditNis(cascade.targetNis);
                handleUpdate({ entryDate: newDate, entryYear: newYear, nis: cascade.targetNis });
                setActiveEditModal(null);
              }} className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer shadow-xs">Simpan Tanggal</button>
            </div>
          </div>
        </div>
      )}

      {/* 12. EDIT TANGGAL KELUAR */}
      {activeEditModal === 'tanggal_keluar' && (
        <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900 text-center">Ubah Tanggal Keluar (Boyong)</h3>
              <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            {/* Toggle Sudah diketahui */}
            <div className="flex items-center justify-between bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-700">Sudah diketahui</span>
              <button
                type="button"
                onClick={() => {
                  const nextVal = !isGradDateKnown;
                  setIsGradDateKnown(nextVal);
                  if (nextVal && !tempGradDate) {
                    setTempGradDate('2024-05-20');
                  }
                }}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  isGradDateKnown ? 'bg-sky-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {isGradDateKnown ? (
              <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-2.5">
                <DateWheelPicker
                  value={tempGradDate || '2024-05-20'}
                  onChange={(val) => setTempGradDate(val)}
                  minYear={1980}
                  maxYear={new Date().getFullYear()}
                  maxDate={new Date().toISOString().split('T')[0]}
                />
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                Tanggal keluar belum diketahui / masih aktif di pondok.
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer hover:bg-slate-50">Batal</button>
              <button type="button" onClick={() => {
                const newDate = isGradDateKnown ? (tempGradDate || '2024-05-20') : '';
                const newYear = newDate ? newDate.substring(0, 4) : '';
                setEditGradDate(newDate);
                handleUpdate({ gradDate: newDate, gradYear: newYear });
                setActiveEditModal(null);
              }} className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer shadow-xs">Simpan Tanggal</button>
            </div>
          </div>
        </div>
      )}

      {/* 13. EDIT DATA ORANG TUA (AYAH) */}
      {activeEditModal === 'ayah' && (() => {
        const cleanNikAyah = draftNikAyah.replace(/\D/g, '').slice(0, 16);
        const isNikAyahValid = (cleanNikAyah.length === 0 || (cleanNikAyah.length === 16 && !duplicateNikAyah)) && !isCheckingNikAyah;

        return (
          <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
            <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <h3 className="font-bold text-sm text-slate-900">Ubah Data Ayah Kandung</h3>
                <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Ayah</label>
                  <input
                    type="text"
                    value={draftNamaAyah}
                    onChange={(e) => setDraftNamaAyah(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                    placeholder="Nama lengkap ayah..."
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIK Ayah</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={16}
                      value={draftNikAyah}
                      onChange={(e) => setDraftNikAyah(e.target.value.replace(/\D/g, '').slice(0, 16))}
                      className="w-full px-3 py-2 pr-9 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white text-xs"
                      placeholder="16 digit"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                      {isCheckingNikAyah && (
                        <Loader2 className="w-4 h-4 text-sky-600 animate-spin" />
                      )}
                      {!isCheckingNikAyah && cleanNikAyah.length === 16 && !duplicateNikAyah && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                      {!isCheckingNikAyah && cleanNikAyah.length === 16 && duplicateNikAyah && (
                        <XCircle className="w-4 h-4 text-rose-500" />
                      )}
                    </div>
                  </div>
                  {cleanNikAyah.length > 0 && cleanNikAyah.length < 16 && (
                    <p className="text-[11px] text-amber-600 font-medium mt-1">
                      Kurang {16 - cleanNikAyah.length} digit (harus 16 digit)
                    </p>
                  )}
                  {!isCheckingNikAyah && cleanNikAyah.length === 16 && duplicateNikAyah && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1">
                      NIK Ayah sudah digunakan oleh {duplicateNikAyah.name} ({(duplicateNikAyah as any).status || 'Santri/Alumni'})
                    </p>
                  )}
                  {!isCheckingNikAyah && cleanNikAyah.length === 16 && !duplicateNikAyah && (
                    <p className="text-[11px] text-emerald-600 font-medium mt-1">
                      NIK Ayah valid & tersedia
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pekerjaan Ayah</label>
                  <input
                    type="text"
                    value={draftPekerjaanAyah}
                    onChange={(e) => setDraftPekerjaanAyah(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                    placeholder="Petani / Guru / Wiraswasta..."
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pendidikan Terakhir Ayah</label>
                  <input
                    type="text"
                    value={draftPendidikanAyah}
                    onChange={(e) => setDraftPendidikanAyah(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                    placeholder="SMA / S1 / Pesantren..."
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
                <button 
                  type="button" 
                  disabled={!isNikAyahValid}
                  onClick={() => { 
                    setEditNamaAyah(draftNamaAyah);
                    setEditNikAyah(cleanNikAyah);
                    setEditPekerjaanAyah(draftPekerjaanAyah);
                    setEditPendidikanAyah(draftPendidikanAyah);
                    handleUpdate({ 
                      namaAyah: draftNamaAyah, 
                      nikAyah: cleanNikAyah, 
                      pekerjaanAyah: draftPekerjaanAyah, 
                      pendidikanAyah: draftPendidikanAyah 
                    }); 
                    setActiveEditModal(null); 
                  }} 
                  className={`flex-1 py-2 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                    isNikAyahValid 
                      ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-xs' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 14. EDIT DATA ORANG TUA (IBU) */}
      {activeEditModal === 'ibu' && (() => {
        const cleanNikIbu = draftNikIbu.replace(/\D/g, '').slice(0, 16);
        const isNikIbuValid = (cleanNikIbu.length === 0 || (cleanNikIbu.length === 16 && !duplicateNikIbu)) && !isCheckingNikIbu;

        return (
          <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setActiveEditModal(null)}>
            <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <h3 className="font-bold text-sm text-slate-900">Ubah Data Ibu Kandung</h3>
                <button type="button" onClick={() => setActiveEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Ibu</label>
                  <input
                    type="text"
                    value={draftNamaIbu}
                    onChange={(e) => setDraftNamaIbu(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                    placeholder="Nama lengkap ibu..."
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIK Ibu</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={16}
                      value={draftNikIbu}
                      onChange={(e) => setDraftNikIbu(e.target.value.replace(/\D/g, '').slice(0, 16))}
                      className="w-full px-3 py-2 pr-9 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white text-xs"
                      placeholder="16 digit"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                      {isCheckingNikIbu && (
                        <Loader2 className="w-4 h-4 text-sky-600 animate-spin" />
                      )}
                      {!isCheckingNikIbu && cleanNikIbu.length === 16 && !duplicateNikIbu && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                      {!isCheckingNikIbu && cleanNikIbu.length === 16 && duplicateNikIbu && (
                        <XCircle className="w-4 h-4 text-rose-500" />
                      )}
                    </div>
                  </div>
                  {cleanNikIbu.length > 0 && cleanNikIbu.length < 16 && (
                    <p className="text-[11px] text-amber-600 font-medium mt-1">
                      Kurang {16 - cleanNikIbu.length} digit (harus 16 digit)
                    </p>
                  )}
                  {!isCheckingNikIbu && cleanNikIbu.length === 16 && duplicateNikIbu && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1">
                      NIK Ibu sudah digunakan oleh {duplicateNikIbu.name} ({(duplicateNikIbu as any).status || 'Santri/Alumni'})
                    </p>
                  )}
                  {!isCheckingNikIbu && cleanNikIbu.length === 16 && !duplicateNikIbu && (
                    <p className="text-[11px] text-emerald-600 font-medium mt-1">
                      NIK Ibu valid & tersedia
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pekerjaan Ibu</label>
                  <input
                    type="text"
                    value={draftPekerjaanIbu}
                    onChange={(e) => setDraftPekerjaanIbu(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                    placeholder="Ibu Rumah Tangga / Guru / Wiraswasta..."
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pendidikan Terakhir Ibu</label>
                  <input
                    type="text"
                    value={draftPendidikanIbu}
                    onChange={(e) => setDraftPendidikanIbu(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                    placeholder="SMA / S1 / Pesantren..."
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setActiveEditModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer">Batal</button>
                <button 
                  type="button" 
                  disabled={!isNikIbuValid}
                  onClick={() => { 
                    setEditNamaIbu(draftNamaIbu);
                    setEditNikIbu(cleanNikIbu);
                    setEditPekerjaanIbu(draftPekerjaanIbu);
                    setEditPendidikanIbu(draftPendidikanIbu);
                    handleUpdate({ 
                      namaIbu: draftNamaIbu, 
                      nikIbu: cleanNikIbu, 
                      pekerjaanIbu: draftPekerjaanIbu, 
                      pendidikanIbu: draftPendidikanIbu 
                    }); 
                    setActiveEditModal(null); 
                  }} 
                  className={`flex-1 py-2 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                    isNikIbuValid 
                      ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-xs' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
