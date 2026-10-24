/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { AlumniView } from './components/AlumniView';
import { AdminView } from './components/AdminView';
import { FirstTimeActivationView } from './components/FirstTimeActivationView';
import { RegisterModal } from './components/RegisterModal';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { INITIAL_ALUMNI, INITIAL_ADMIN, INITIAL_ADMIN_LIST, INITIAL_EVENTS, INITIAL_ANNOUNCEMENTS } from './data/mockData';
import { AlumniRecord, AdminUser, EventAgenda, UserRole, ActiveSession, AnnouncementItem, EventComment } from './types';
import { useBackHandler } from './utils/navigationHistory';
import {
  fetchAlumniFromHostinger,
  updateAlumniInHostinger,
  addAlumniToHostinger,
  deleteAlumniFromHostinger,
  resetAlumniPasswordInHostinger,
  fetchEventsFromHostinger,
  saveEventToHostinger,
  deleteEventFromHostinger,
  saveRsvpToHostinger,
  saveCommentToDatabase,
  fetchAnnouncementsFromHostinger,
  saveAnnouncementToHostinger,
  deleteAnnouncementFromHostinger,
  getDeletedEventIds,
  getDeletedAnnouncementIds,
  syncChannel,
  syncAdminProfileAcrossApp,
  fetchAdminProfile,
  fetchAdminUsers,
  saveAdminUser,
  deleteAdminUser,
  SantriIdentityLookup,
  ensureAllSantriLoaded,
} from './services/apiService';
import { wsClient, WsMessage } from './services/websocketService';

export function isAlumniNeedingActivation(alm?: AlumniRecord | null): boolean {
  if (!alm) return false;
  const hasNoUsername = !alm.username || alm.username.trim() === '';
  const hasDefaultPassword = !alm.isPasswordChanged || alm.password === '1234';
  return hasNoUsername || hasDefaultPassword;
}

export default function App() {
  const [wsConnected, setWsConnected] = useState(false);
  const [allSantriList, setAllSantriList] = useState<SantriIdentityLookup[]>([]);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);
  const [alumniList, setAlumniList] = useState<AlumniRecord[]>(() => {
    try {
      const saved = localStorage.getItem('attaroqqy_alumni_list_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_ALUMNI;
  });
  const [adminList, setAdminList] = useState<AdminUser[]>(() => {
    try {
      const saved = localStorage.getItem('attaroqqy_admin_list_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_ADMIN_LIST;
  });
  const [adminAccount, setAdminAccount] = useState<AdminUser>(adminList[0] || INITIAL_ADMIN);

  useEffect(() => {
    try {
      if (alumniList && alumniList.length > 0) {
        localStorage.setItem('attaroqqy_alumni_list_v1', JSON.stringify(alumniList));
      }
    } catch (e) {}
  }, [alumniList]);

  useEffect(() => {
    try {
      localStorage.setItem('attaroqqy_admin_list_v1', JSON.stringify(adminList));
    } catch (e) {}
    if (adminList[0]) {
      setAdminAccount(adminList[0]);
    }
  }, [adminList]);

  const handleAddAdminUser = (newAdmin: AdminUser) => {
    setAdminList((prev) => [...prev, newAdmin]);
    saveAdminUser(newAdmin);
  };

  const handleUpdateAdminUser = (updatedAdmin: AdminUser) => {
    setAdminList((prev) =>
      prev.map((a) => (a.id === updatedAdmin.id ? updatedAdmin : a))
    );
    if (currentSession?.adminData?.id === updatedAdmin.id) {
      setCurrentSession((prev) =>
        prev ? { ...prev, adminData: updatedAdmin } : null
      );
    }
    const isPusat = updatedAdmin.username === '@admin_pusat' || updatedAdmin.role === 'super_admin' || updatedAdmin.regionLevel === 'pusat';
    if (isPusat) {
      setAdminAccount(updatedAdmin);
    }
    saveAdminUser(updatedAdmin);
  };

  const handleDeleteAdminUser = (adminId: string) => {
    setAdminList((prev) => prev.filter((a) => a.id !== adminId));
    deleteAdminUser(adminId);
  };

  // Events & Announcements dengan persistensi lokal dan sinkronisasi database
  const [events, setEvents] = useState<EventAgenda[]>(() => {
    const deletedIds = getDeletedEventIds();
    try {
      const saved = localStorage.getItem('attaroqqy_events_cache_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((e) => e && e.id && !deletedIds.includes(e.id));
        }
      }
    } catch (e) {}
    return INITIAL_EVENTS.filter((e) => !deletedIds.includes(e.id));
  });

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(() => {
    const deletedIds = getDeletedAnnouncementIds();
    try {
      const saved = localStorage.getItem('attaroqqy_announcements_cache_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((a) => a && a.id && !deletedIds.includes(a.id));
        }
      }
    } catch (e) {}
    return INITIAL_ANNOUNCEMENTS.filter((a) => !deletedIds.includes(a.id));
  });

  useEffect(() => {
    try {
      localStorage.setItem('attaroqqy_events_cache_v1', JSON.stringify(events));
    } catch (e) {}
  }, [events]);

  useEffect(() => {
    try {
      localStorage.setItem('attaroqqy_announcements_cache_v1', JSON.stringify(announcements));
    } catch (e) {}
  }, [announcements]);

  // Current session dengan persistensi localStorage agar tidak logout saat refresh
  const [currentSession, setCurrentSession] = useState<ActiveSession | null>(() => {
    try {
      const saved = localStorage.getItem('attaroqqy_active_session_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.role === 'admin' || parsed.role === 'alumni')) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Gagal memuat sesi tersimpan:', e);
    }
    return null;
  });

  useEffect(() => {
    try {
      if (currentSession) {
        localStorage.setItem('attaroqqy_active_session_v1', JSON.stringify(currentSession));
      } else {
        localStorage.removeItem('attaroqqy_active_session_v1');
      }
    } catch (e) {}
  }, [currentSession]);

  // Other modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // Database connection states
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [isDbConnected, setIsDbConnected] = useState(false);

  // Kunci perlindungan: jangan timpa editan lokal aktif saat background sync / polling berjalan
  const isSyncingRef = useRef(false);
  const lastSelfUpdateTimeRef = useRef<number>(0);

  // Load real data from Hostinger MySQL database on mount & support manual refresh and background polling
  const loadData = async (silent: boolean = false) => {
    // Jika sedang dalam proses simpan aktif atau baru saja mengedit, cegah polling menimpa state
    if (silent && isSyncingRef.current) return;
    if (!silent) setIsDbLoading(true);
    try {
      const [alumniRes, eventsRes, annRes, adminProfileRes, adminUsersRes] = await Promise.all([
        fetchAlumniFromHostinger(true),
        fetchEventsFromHostinger(),
        fetchAnnouncementsFromHostinger(),
        fetchAdminProfile(),
        fetchAdminUsers(),
      ]);

      if (alumniRes.success && alumniRes.data && alumniRes.data.length > 0) {
        setIsDbConnected(true);

        const isRecentlyUpdated = Date.now() - lastSelfUpdateTimeRef.current < 30000;

        // Perbarui data sesi alumni yang sedang aktif secara aman tanpa menghapus field lokal yang telah diubah
        setCurrentSession((prev) => {
          if (prev?.role === 'alumni' && prev.alumniData) {
            // Jika user baru saja mengedit profil dalam 30 detik terakhir, kunci data lokal 100%
            if (isRecentlyUpdated) {
              return prev;
            }

            const freshMe = alumniRes.data.find(
              (a) => a.id === prev.alumniData!.id || (a.nik && a.nik === prev.alumniData!.nik)
            );
            if (freshMe) {
              const prevData = prev.alumniData;

              // Jangan membuat referensi object baru jika data tidak berubah sama sekali
              const isMeaningfullyDifferent = Object.keys(freshMe).some((key) => {
                const k = key as keyof AlumniRecord;
                return (
                  freshMe[k] !== undefined &&
                  freshMe[k] !== '' &&
                  freshMe[k] !== null &&
                  freshMe[k] !== prevData[k]
                );
              });

              if (!isMeaningfullyDifferent) {
                return prev;
              }

              // PENTING: Pertahankan data sesi aktif lokal (prevData) agar editan pengguna tidak ditimpa oleh data polling lama dari server
              const mergedAlumni: AlumniRecord = {
                ...freshMe,
                ...prevData,
                // Field yang telah diisi di sesi aktif lokal (prevData) tidak boleh di-revert ke nilai lama freshMe
                name: prevData.name || freshMe.name,
                username: prevData.username || freshMe.username,
                bio: prevData.bio !== undefined && prevData.bio !== '' ? prevData.bio : (freshMe.bio || ''),
                occupation: prevData.occupation !== undefined && prevData.occupation !== '' ? prevData.occupation : (freshMe.occupation || ''),
                institution: prevData.institution !== undefined && prevData.institution !== '' ? prevData.institution : (freshMe.institution || ''),
                namaAyah: prevData.namaAyah || freshMe.namaAyah || '',
                nikAyah: prevData.nikAyah || freshMe.nikAyah || '',
                pekerjaanAyah: prevData.pekerjaanAyah || freshMe.pekerjaanAyah || '',
                pendidikanAyah: prevData.pendidikanAyah || freshMe.pendidikanAyah || '',
                namaIbu: prevData.namaIbu || freshMe.namaIbu || '',
                nikIbu: prevData.nikIbu || freshMe.nikIbu || '',
                pekerjaanIbu: prevData.pekerjaanIbu || freshMe.pekerjaanIbu || '',
                pendidikanIbu: prevData.pendidikanIbu || freshMe.pendidikanIbu || '',
                entryDate: prevData.entryDate || freshMe.entryDate || '',
                entryYear: prevData.entryYear || freshMe.entryYear || '',
                gradDate: prevData.gradDate || freshMe.gradDate || '',
                gradYear: prevData.gradYear || freshMe.gradYear || '',
                tempatLahir: prevData.tempatLahir || freshMe.tempatLahir || '',
                tanggalLahir: prevData.tanggalLahir || freshMe.tanggalLahir || '',
                phone: prevData.phone || freshMe.phone || '',
                email: prevData.email || freshMe.email || '',
                alamatLengkap: prevData.alamatLengkap || freshMe.alamatLengkap || '',
                desa: prevData.desa || freshMe.desa || '',
                kecamatan: prevData.kecamatan || freshMe.kecamatan || '',
                city: prevData.city || freshMe.city || '',
                province: prevData.province || freshMe.province || '',
                photoUrl: prevData.photoUrl !== undefined ? prevData.photoUrl : freshMe.photoUrl,
                coverPhotoUrl: prevData.coverPhotoUrl !== undefined ? prevData.coverPhotoUrl : freshMe.coverPhotoUrl,
                gender: prevData.gender || freshMe.gender,
                urutanAnak: prevData.urutanAnak ?? freshMe.urutanAnak,
                jumlahSaudara: prevData.jumlahSaudara ?? freshMe.jumlahSaudara,
                nik: prevData.nik || freshMe.nik,
                noKk: prevData.noKk || freshMe.noKk,
              };
              return { ...prev, alumniData: mergedAlumni };
            }
          }
          return prev;
        });

        // Simpan daftar alumni dengan memastikan data alumni yang sedang diedit lokal atau password baru tidak tertimpa data basi
        setAlumniList((prevList) => {
          let localSavedList: AlumniRecord[] = [];
          try {
            const rawSaved = localStorage.getItem('attaroqqy_alumni_list_v1');
            if (rawSaved) {
              const parsed = JSON.parse(rawSaved);
              if (Array.isArray(parsed)) localSavedList = parsed;
            }
          } catch (e) {}

          let activatedCache: AlumniRecord[] = [];
          try {
            const rawAct = localStorage.getItem('attaroqqy_activated_alumni_cache');
            if (rawAct) {
              const parsed = JSON.parse(rawAct);
              if (Array.isArray(parsed)) activatedCache = parsed;
            }
          } catch (e) {}

          // Prioritaskan activatedCache dan localSavedList di atas prevList
          const localPool = [...(prevList || []), ...(localSavedList || []), ...(activatedCache || [])];
          const localIdMap = new Map(localPool.map((a) => [String(a.id).trim(), a]));
          const localNikMap = new Map(localPool.filter((a) => a.nik).map((a) => [String(a.nik).replace(/\D/g, '').trim(), a]));
          const localNisMap = new Map(localPool.filter((a) => a.nis).map((a) => [String(a.nis).trim(), a]));
          const localUserMap = new Map(localPool.filter((a) => a.username).map((a) => [(a.username || '').toLowerCase().replace(/^@/, '').trim(), a]));

          const activeAlumni = currentSession?.role === 'alumni' ? currentSession.alumniData : null;

          return alumniRes.data.map((freshItem) => {
            const freshNikDigits = freshItem.nik ? String(freshItem.nik).replace(/\D/g, '').trim() : '';
            const freshNisClean = freshItem.nis ? String(freshItem.nis).trim() : '';
            const freshUserClean = freshItem.username ? String(freshItem.username).toLowerCase().replace(/^@/, '').trim() : '';

            const localItem =
              (activeAlumni && (
                String(activeAlumni.id).trim() === String(freshItem.id).trim() ||
                (activeAlumni.nik && freshNikDigits && String(activeAlumni.nik).replace(/\D/g, '').trim() === freshNikDigits) ||
                (activeAlumni.nis && freshNisClean && String(activeAlumni.nis).trim() === freshNisClean)
              ))
                ? activeAlumni
                : (localIdMap.get(String(freshItem.id).trim()) ||
                   (freshNikDigits ? localNikMap.get(freshNikDigits) : undefined) ||
                   (freshNisClean ? localNisMap.get(freshNisClean) : undefined) ||
                   (freshUserClean ? localUserMap.get(freshUserClean) : undefined));

            if (localItem) {
              // PENTING: Pertahankan kata sandi yang telah diubah secara lokal agar tidak ditimpa default '1234' dari server
              const hasLocalCustomPassword =
                Boolean(localItem.isPasswordChanged) ||
                (Boolean(localItem.password) && localItem.password !== '1234');

              const effectivePassword = hasLocalCustomPassword
                ? localItem.password
                : (freshItem.password || localItem.password || '1234');

              const effectiveIsPasswordChanged = Boolean(
                localItem.isPasswordChanged ||
                freshItem.isPasswordChanged ||
                (effectivePassword && effectivePassword !== '1234')
              );

              const effectiveHasLoggedIn = Boolean(
                localItem.hasLoggedIn ||
                freshItem.hasLoggedIn ||
                effectiveIsPasswordChanged
              );

              // Username kustom hasil aktivasi SELALU diutamakan jika ada
              const effectiveUsername = (localItem.username && localItem.username.trim() !== '')
                ? localItem.username
                : (freshItem.username || '');

              return {
                ...freshItem,
                name: localItem.name || freshItem.name,
                username: effectiveUsername,
                password: effectivePassword,
                isPasswordChanged: effectiveIsPasswordChanged,
                hasLoggedIn: effectiveHasLoggedIn,
                phone: localItem.phone || freshItem.phone,
                email: localItem.email || freshItem.email,
                city: localItem.city || freshItem.city,
                province: localItem.province || freshItem.province,
                alamatLengkap: localItem.alamatLengkap || freshItem.alamatLengkap,
                tempatLahir: localItem.tempatLahir || freshItem.tempatLahir,
                tanggalLahir: localItem.tanggalLahir || freshItem.tanggalLahir,
                bio: localItem.bio || freshItem.bio,
                occupation: localItem.occupation || freshItem.occupation,
                institution: localItem.institution || freshItem.institution,
                photoUrl: localItem.photoUrl || freshItem.photoUrl,
                coverPhotoUrl: localItem.coverPhotoUrl || freshItem.coverPhotoUrl,
              };
            }
            return freshItem;
          });
        });

        if (alumniRes.allSantri && alumniRes.allSantri.length > 0) {
          setAllSantriList(alumniRes.allSantri);
        }
      } else {
        if (!silent) setIsDbConnected(false);
      }

      if (eventsRes.success && Array.isArray(eventsRes.data)) {
        const deletedIds = getDeletedEventIds();
        setEvents(eventsRes.data.filter((e) => e && e.id && !deletedIds.includes(e.id)));
      }

      if (annRes.success && Array.isArray(annRes.data)) {
        const deletedIds = getDeletedAnnouncementIds();
        setAnnouncements(annRes.data.filter((a) => a && a.id && !deletedIds.includes(a.id)));
      }

      if (adminProfileRes?.success && adminProfileRes.data) {
        const freshAdmin = adminProfileRes.data;
        setAdminAccount((prev) => ({
          ...prev,
          ...freshAdmin,
          name: freshAdmin.name || prev.name,
          username: freshAdmin.username || prev.username,
          avatar: freshAdmin.avatar !== undefined ? freshAdmin.avatar : prev.avatar,
          coverPhotoUrl: freshAdmin.coverPhotoUrl !== undefined ? freshAdmin.coverPhotoUrl : prev.coverPhotoUrl,
          bio: freshAdmin.bio !== undefined ? freshAdmin.bio : prev.bio,
          jabatan: freshAdmin.jabatan !== undefined ? freshAdmin.jabatan : prev.jabatan,
        }));
        setCurrentSession((prev) => {
          if (prev?.role === 'admin' && prev.adminData) {
            const isTarget = prev.adminData.id === freshAdmin.id || prev.adminData.username === freshAdmin.username || prev.adminData.username === '@admin_pusat';
            if (isTarget) {
              return {
                ...prev,
                adminData: {
                  ...prev.adminData,
                  ...freshAdmin,
                },
              };
            }
          }
          return prev;
        });
      }

      if (adminUsersRes?.success && Array.isArray(adminUsersRes.data) && adminUsersRes.data.length > 0) {
        setAdminList(adminUsersRes.data);
      }
    } catch (err) {
      console.warn('Gagal memuat data dari Hostinger:', err);
      if (!silent) setIsDbConnected(false);
    } finally {
      if (!silent) setIsDbLoading(false);
    }
  };

  useEffect(() => {
    ensureAllSantriLoaded().then((list) => {
      if (list && list.length > 0) {
        setAllSantriList(list);
      }
    });

    loadData(false);

    // 0. WebSocket Realtime 2-Way Sync Listener
    const unsubscribeWsStatus = wsClient.onStatusChange((status) => {
      const isConn = status === 'connected';
      setWsConnected(isConn);
      if (isConn) {
        setIsDbConnected(true);
      }
    });

    const unsubscribeWsMessage = wsClient.onMessage((msg: WsMessage) => {
      console.log('[App Realtime WS] Menerima sinyal:', msg.type, msg.entity, msg.action);

      if (msg.type === 'DATA_CHANGED' || msg.type === 'REMOTE_DATA_CHANGED') {
        // Tampilkan indikator toast sinkronisasi
        const notice = msg.type === 'REMOTE_DATA_CHANGED'
          ? 'Perubahan dari database tersinkronkan!'
          : 'Data diperbarui secara realtime via WebSocket';
        setSyncToastMessage(notice);
        setTimeout(() => setSyncToastMessage((curr) => (curr === notice ? null : curr)), 3000);

        // 1. DELTA UPDATE ALUMNI (0-detik latency)
        if (msg.entity === 'alumni') {
          if ((msg.action === 'update' || msg.action === 'sync') && msg.data && msg.id) {
            const rawData = msg.data;
            const deltaData: Record<string, any> = {
              ...rawData,
              name: rawData.name || rawData.nama || undefined,
              nama: rawData.name || rawData.nama || undefined,
              alamatLengkap: rawData.alamatLengkap || rawData.alamat || undefined,
              phone: rawData.phone || rawData.no_hp || undefined,
              tempatLahir: rawData.tempatLahir || rawData.tempat_lahir || undefined,
              tanggalLahir: rawData.tanggalLahir || rawData.tanggal_lahir || undefined,
              city: rawData.city || rawData.kabupaten || undefined,
              province: rawData.province || rawData.provinsi || undefined,
              desa: rawData.desa || undefined,
              kecamatan: rawData.kecamatan || undefined,
              namaAyah: rawData.namaAyah || rawData.nama_ayah || undefined,
              namaIbu: rawData.namaIbu || rawData.nama_ibu || undefined,
            };
            Object.keys(deltaData).forEach((k) => deltaData[k] === undefined && delete deltaData[k]);

            setAlumniList((prevList) => {
              const idx = prevList.findIndex((a) => String(a.id) === String(msg.id));
              if (idx >= 0) {
                const updated = [...prevList];
                updated[idx] = { ...updated[idx], ...deltaData };
                return updated;
              }
              return prevList;
            });

            setCurrentSession((prev) => {
              if (prev?.role === 'alumni' && prev.alumniData && String(prev.alumniData.id) === String(msg.id)) {
                return { ...prev, alumniData: { ...prev.alumniData, ...deltaData } };
              }
              return prev;
            });
          } else if (msg.action === 'delete' && msg.id) {
            setAlumniList((prevList) => prevList.filter((a) => String(a.id) !== String(msg.id)));
          }
          return;
        }

        // 2. DELTA UPDATE PROFIL & AKUN ADMIN (0-detik latency tanpa timpa form aktif)
        if (msg.entity === 'admin') {
          if ((msg.action === 'update' || msg.action === 'save_user') && msg.data) {
            const adminData = msg.data;
            const isPusat =
              adminData.username === '@admin_pusat' ||
              adminData.role === 'super_admin' ||
              adminData.regionLevel === 'pusat';

            setAdminAccount((prev) => {
              if (isPusat || prev.id === adminData.id || prev.username === adminData.username) {
                return { ...prev, ...adminData };
              }
              return prev;
            });

            setCurrentSession((prev) => {
              if (prev?.role === 'admin' && prev.adminData) {
                const isTarget =
                  prev.adminData.id === adminData.id ||
                  prev.adminData.username === adminData.username ||
                  (isPusat && (prev.adminData.username === '@admin_pusat' || prev.adminData.role === 'super_admin'));
                if (isTarget) {
                  return {
                    ...prev,
                    adminData: { ...prev.adminData, ...adminData },
                  };
                }
              }
              return prev;
            });

            setAdminList((prev) => {
              const idx = prev.findIndex((a) => a.id === adminData.id || a.username === adminData.username);
              if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = { ...updated[idx], ...adminData };
                return updated;
              }
              return [...prev, adminData];
            });
          } else if (msg.action === 'delete_user' && msg.id) {
            setAdminList((prev) => prev.filter((a) => a.id !== msg.id));
          }
          return;
        }

        // 3. DELTA UPDATE AGENDA / EVENTS (0-detik latency)
        if (msg.entity === 'events') {
          if ((msg.action === 'save' || msg.action === 'create' || msg.action === 'update') && msg.data && msg.data.id) {
            const evData = msg.data;
            setEvents((prev) => {
              const idx = prev.findIndex((e) => e.id === evData.id);
              if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = { ...updated[idx], ...evData };
                return updated;
              }
              return [evData, ...prev];
            });
          } else if (msg.action === 'delete' && msg.id) {
            setEvents((prev) => prev.filter((e) => e.id !== msg.id));
          }
          return;
        }

        // 4. DELTA UPDATE PENGUMUMAN / ANNOUNCEMENTS (0-detik latency)
        if (msg.entity === 'announcements') {
          if ((msg.action === 'save' || msg.action === 'create' || msg.action === 'update') && msg.data && msg.data.id) {
            const annData = msg.data;
            setAnnouncements((prev) => {
              const idx = prev.findIndex((a) => a.id === annData.id);
              if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = { ...updated[idx], ...annData };
                return updated;
              }
              return [annData, ...prev];
            });
          } else if (msg.action === 'delete' && msg.id) {
            setAnnouncements((prev) => prev.filter((a) => a.id !== msg.id));
          }
          return;
        }

        // 5. GLOBAL FALLBACK: Jika pesan adalah resync umum (entity: 'all')
        if (msg.entity === 'all' && !isSyncingRef.current) {
          loadData(true);
        }
      }
    });

    // Sinkronisasi instan via BroadcastChannel (antar-tab & antar-window)
    const handleBroadcastMessage = (event: MessageEvent) => {
      console.log('[Realtime Sync] Sinyal update diterima via BroadcastChannel:', event.data);
      if (event.data?.type === 'all' && !isSyncingRef.current) {
        loadData(true);
      }
    };

    if (syncChannel) {
      syncChannel.addEventListener('message', handleBroadcastMessage);
    }

    return () => {
      unsubscribeWsStatus();
      unsubscribeWsMessage();
      if (syncChannel) {
        syncChannel.removeEventListener('message', handleBroadcastMessage);
      }
    };
  }, []);

  // Penanganan tombol fisik kembali untuk modal-modal di layer Login/Auth
  useBackHandler(isRegisterOpen, 'login-register-modal', () => setIsRegisterOpen(false));
  useBackHandler(isForgotPasswordOpen, 'login-forgot-pwd-modal', () => setIsForgotPasswordOpen(false));

  // Toast petunjuk saat tombol fisik ditekan di halaman utama (Double back to exit)
  const [exitToastMessage, setExitToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleExitHint = (e: any) => {
      setExitToastMessage(e.detail?.message || 'Tekan sekali lagi untuk keluar dari website');
      setTimeout(() => setExitToastMessage(null), 2200);
    };

    window.addEventListener('app-back-exit-hint', handleExitHint);
    return () => {
      window.removeEventListener('app-back-exit-hint', handleExitHint);
    };
  }, []);

  const handleLoginSuccess = (
    role: UserRole,
    alumniData?: AlumniRecord,
    adminData?: AdminUser
  ) => {
    if (role === 'admin' && adminData) {
      setCurrentSession({ role: 'admin', adminData });
    } else if (role === 'alumni' && alumniData) {
      setCurrentSession({ role: 'alumni', alumniData });
      if (!isAlumniNeedingActivation(alumniData)) {
        updateAlumniInHostinger(alumniData.id, { hasLoggedIn: true });
      }
    }
  };

  const handleLogout = () => {
    setCurrentSession(null);
    try {
      localStorage.removeItem('attaroqqy_active_session_v1');
    } catch (e) {}
  };

  // Alumni self-profile update
  const handleUpdateAlumniProfile = async (updates: Partial<AlumniRecord>) => {
    if (!currentSession?.alumniData) return;

    // Kunci proses sync agar polling background tidak menimpa data yang sedang disimpan
    lastSelfUpdateTimeRef.current = Date.now();
    isSyncingRef.current = true;

    const prevAlumni = currentSession.alumniData;
    // Bersihkan username jika ada input username baru, atau pertahankan yang lama
    const cleanUser = updates.username !== undefined 
      ? updates.username.toLowerCase().replace(/^@/, '').trim()
      : prevAlumni.username;

    const finalUpdates: Partial<AlumniRecord> = {
      ...updates,
      username: cleanUser,
    };
    if (updates.password) {
      finalUpdates.password = updates.password.trim();
      finalUpdates.isPasswordChanged = true;
      finalUpdates.hasLoggedIn = true;
    }

    const updatedAlumni: AlumniRecord = {
      ...currentSession.alumniData,
      ...finalUpdates,
      username: cleanUser,
    };

    if ('coordinates' in updates && !updates.coordinates) {
      delete (updatedAlumni as any).coordinates;
    }

    if ('coverPhotoUrl' in updates && !updates.coverPhotoUrl) {
      delete (updatedAlumni as any).coverPhotoUrl;
    }

    const nextSession = {
      ...currentSession,
      alumniData: updatedAlumni,
    };
    setCurrentSession(nextSession);
    try {
      localStorage.setItem('attaroqqy_active_session_v1', JSON.stringify(nextSession));
    } catch (e) {}

    // Simpan ke cache aktivasi & persistensi lokal
    try {
      let actCache: AlumniRecord[] = [];
      const rawAct = localStorage.getItem('attaroqqy_activated_alumni_cache');
      if (rawAct) {
        const parsed = JSON.parse(rawAct);
        if (Array.isArray(parsed)) actCache = parsed;
      }
      const isTarget = (a: AlumniRecord) =>
        String(a.id).trim() === String(updatedAlumni.id).trim() ||
        (a.nik && updatedAlumni.nik && a.nik.replace(/\D/g, '') === updatedAlumni.nik.replace(/\D/g, '')) ||
        (a.nis && updatedAlumni.nis && String(a.nis).trim() === String(updatedAlumni.nis).trim());

      actCache = [updatedAlumni, ...actCache.filter((a) => !isTarget(a))];
      localStorage.setItem('attaroqqy_activated_alumni_cache', JSON.stringify(actCache));
    } catch (e) {}

    const isTargetAlm = (item: AlumniRecord) =>
      String(item.id).trim() === String(updatedAlumni.id).trim() ||
      (item.nik && updatedAlumni.nik && item.nik.replace(/\D/g, '') === updatedAlumni.nik.replace(/\D/g, '')) ||
      (item.nis && updatedAlumni.nis && String(item.nis).trim() === String(updatedAlumni.nis).trim());

    setAlumniList((prevList) => {
      let found = false;
      const next = prevList.map((item) => {
        if (isTargetAlm(item)) {
          found = true;
          return updatedAlumni;
        }
        return item;
      });
      const finalList = found ? next : [updatedAlumni, ...prevList];
      try {
        localStorage.setItem('attaroqqy_alumni_list_v1', JSON.stringify(finalList));
      } catch (e) {}
      return finalList;
    });

    // Sync all existing events and announcements authored by this alumni
    if (updates.name || updates.username || updates.photoUrl !== undefined) {
      const prevHandle = prevAlumni.username ? prevAlumni.username.replace(/^@/, '').toLowerCase() : '';
      const newHandle = cleanUser ? (cleanUser.startsWith('@') ? cleanUser : `@${cleanUser}`) : undefined;

      setEvents((prev) =>
        prev.map((ev) => {
          const evHandle = ev.authorHandle ? ev.authorHandle.replace(/^@/, '').toLowerCase() : '';
          const isAuthor =
            (prevHandle && evHandle === prevHandle) ||
            ev.authorName === prevAlumni.name;

          if (isAuthor) {
            return {
              ...ev,
              authorName: updates.name ?? ev.authorName,
              authorHandle: newHandle ?? ev.authorHandle,
              authorAvatar: updates.photoUrl !== undefined ? updates.photoUrl : ev.authorAvatar,
            };
          }
          return ev;
        })
      );

      setAnnouncements((prev) =>
        prev.map((ann) => {
          const annHandle = ann.authorHandle ? ann.authorHandle.replace(/^@/, '').toLowerCase() : '';
          const isAuthor =
            (prevHandle && annHandle === prevHandle) ||
            ann.authorName === prevAlumni.name;

          if (isAuthor) {
            return {
              ...ann,
              authorName: updates.name ?? ann.authorName,
              authorHandle: newHandle ?? ann.authorHandle,
              authorAvatar: updates.photoUrl !== undefined ? updates.photoUrl : ann.authorAvatar,
            };
          }
          return ann;
        })
      );
    }

    try {
      // Sync secara realtime ke database Hostinger (attaroqqy.com, alumni.attaroqqy.com, & Express)
      await updateAlumniInHostinger(updatedAlumni.id, finalUpdates, updatedAlumni);
    } finally {
      // Pertahankan lock selama 5 detik setelah network call selesai agar database server stabil
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 5000);
    }
  };

  // First-time activation save handler (fullscreen 3-step onboarding)
  const handleCompleteActivation = async (data: {
    username: string;
    newPassword: string;
    updatedAlumni: AlumniRecord;
    photoUrl?: string;
  }) => {
    isSyncingRef.current = true;
    lastSelfUpdateTimeRef.current = Date.now();

    const cleanUser = data.username.toLowerCase().replace(/^@/, '').trim();
    const cleanPwd = data.newPassword.trim();

    const finalAlumni: AlumniRecord = {
      ...data.updatedAlumni,
      username: cleanUser,
      password: cleanPwd,
      isPasswordChanged: true,
      hasLoggedIn: true,
      photoUrl: data.photoUrl !== undefined ? data.photoUrl : data.updatedAlumni.photoUrl,
    };

    // Update active session immediately so screen transitions to AlumniView
    setCurrentSession({ role: 'alumni', alumniData: finalAlumni });
    try {
      localStorage.setItem('attaroqqy_active_session_v1', JSON.stringify({ role: 'alumni', alumniData: finalAlumni }));
    } catch (e) {}

    // Simpan ke cache aktivasi khusus agar tahan terhadap refresh & sync apapun
    try {
      let actCache: AlumniRecord[] = [];
      const rawAct = localStorage.getItem('attaroqqy_activated_alumni_cache');
      if (rawAct) {
        const parsed = JSON.parse(rawAct);
        if (Array.isArray(parsed)) actCache = parsed;
      }
      const isTarget = (a: AlumniRecord) =>
        String(a.id).trim() === String(finalAlumni.id).trim() ||
        (a.nik && finalAlumni.nik && a.nik.replace(/\D/g, '') === finalAlumni.nik.replace(/\D/g, '')) ||
        (a.nis && finalAlumni.nis && String(a.nis).trim() === String(finalAlumni.nis).trim());

      actCache = [finalAlumni, ...actCache.filter((a) => !isTarget(a))];
      localStorage.setItem('attaroqqy_activated_alumni_cache', JSON.stringify(actCache));
    } catch (e) {}

    // Update local alumniList with robust matching
    const isTargetAlm = (item: AlumniRecord) => {
      if (String(item.id).trim() === String(finalAlumni.id).trim()) return true;
      if (item.nik && finalAlumni.nik && item.nik.replace(/\D/g, '') === finalAlumni.nik.replace(/\D/g, '')) return true;
      if (item.nis && finalAlumni.nis && String(item.nis).trim() === String(finalAlumni.nis).trim()) return true;
      return false;
    };

    setAlumniList((prevList) => {
      let found = false;
      const next = prevList.map((item) => {
        if (isTargetAlm(item)) {
          found = true;
          return finalAlumni;
        }
        return item;
      });
      const finalList = found ? next : [finalAlumni, ...prevList];
      try {
        localStorage.setItem('attaroqqy_alumni_list_v1', JSON.stringify(finalList));
      } catch (e) {}
      return finalList;
    });

    try {
      await updateAlumniInHostinger(
        finalAlumni.id,
        {
          ...data.updatedAlumni,
          username: cleanUser,
          password: cleanPwd,
          isPasswordChanged: true,
          hasLoggedIn: true,
          photoUrl: data.photoUrl,
        },
        finalAlumni
      );
    } catch (err) {
      console.warn('Gagal menyimpan aktivasi ke Hostinger:', err);
    } finally {
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 5000);
    }
  };

  // Admin actions
  const handleAddAlumniByAdmin = async (newAlumni: AlumniRecord) => {
    setAlumniList((prev) => [newAlumni, ...prev]);
    // Simpan ke database Hostinger
    await addAlumniToHostinger(newAlumni);
  };

  const handleUpdateAlumniByAdmin = async (
    id: string,
    updated: Partial<AlumniRecord>,
    passedFullRecord?: AlumniRecord
  ) => {
    // Kunci proses sync agar polling background tidak menimpa data yang sedang disimpan admin
    lastSelfUpdateTimeRef.current = Date.now();
    isSyncingRef.current = true;

    const existingAlumni =
      passedFullRecord ||
      alumniList.find((item) => String(item.id).trim() === String(id).trim());

    const cleanNama =
      updated.name ??
      (updated as any).nama ??
      existingAlumni?.name ??
      (existingAlumni as any)?.nama ??
      '';

    const fullRecord: AlumniRecord = {
      ...(existingAlumni || {}),
      id,
      ...updated,
      name: cleanNama,
      status: 'alumni',
    } as AlumniRecord;
    (fullRecord as any).nama = cleanNama;
    (fullRecord as any).status_keanggotaan = 'Alumni';

    const finalUpdates: Partial<AlumniRecord> = {
      ...updated,
      ...(cleanNama ? { name: cleanNama, nama: cleanNama } : {}),
      status_keanggotaan: 'Alumni',
    } as any;

    const updatedList = alumniList.map((item) =>
      String(item.id).trim() === String(id).trim() ? fullRecord : item
    );
    setAlumniList(updatedList);
    try {
      localStorage.setItem('attaroqqy_alumni_list_v1', JSON.stringify(updatedList));
    } catch (e) {}

    // If current alumni is the one updated
    if (currentSession?.alumniData && String(currentSession.alumniData.id).trim() === String(id).trim()) {
      const nextSession = {
        ...currentSession,
        alumniData: fullRecord,
      };
      setCurrentSession(nextSession);
      try {
        localStorage.setItem('attaroqqy_active_session_v1', JSON.stringify(nextSession));
      } catch (e) {}
    }

    try {
      // Simpan ke database Hostinger & Express SmartSantri (aplikasi lama)
      await updateAlumniInHostinger(id, finalUpdates, fullRecord);
    } finally {
      // Tahan lock selama 3.5 detik agar penulisan database server stabil
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 3500);
    }
  };

  const handleResetAlumniPassword = async (id: string) => {
    lastSelfUpdateTimeRef.current = Date.now();
    isSyncingRef.current = true;
    const updatedList = alumniList.map((item) =>
      item.id === id
        ? { ...item, password: '1234', isPasswordChanged: false }
        : item
    );
    setAlumniList(updatedList);
    try {
      localStorage.setItem('attaroqqy_alumni_list_v1', JSON.stringify(updatedList));
    } catch (e) {}
    try {
      await resetAlumniPasswordInHostinger(id);
    } finally {
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 3000);
    }
  };

  const handleDeleteAlumniByAdmin = async (id: string) => {
    lastSelfUpdateTimeRef.current = Date.now();
    isSyncingRef.current = true;
    const updatedList = alumniList.filter((item) => item.id !== id);
    setAlumniList(updatedList);
    try {
      localStorage.setItem('attaroqqy_alumni_list_v1', JSON.stringify(updatedList));
    } catch (e) {}
    try {
      await deleteAlumniFromHostinger(id);
    } finally {
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 3000);
    }
  };

  const handleUpdateAdmin = async (updated: Partial<AdminUser>) => {
    const currentAdmin = (currentSession?.role === 'admin' && currentSession.adminData) ? currentSession.adminData : adminAccount;
    const prevName = currentAdmin.name;
    const prevUsername = currentAdmin.username;
    const adminId = currentAdmin.id;

    const nextAdmin: AdminUser = { ...currentAdmin, ...updated };

    setAdminAccount(nextAdmin);

    if (currentSession?.role === 'admin' && currentSession.adminData) {
      const nextSession = {
        ...currentSession,
        adminData: nextAdmin,
      };
      setCurrentSession(nextSession);
      try {
        localStorage.setItem('attaroqqy_active_session_v1', JSON.stringify(nextSession));
      } catch (e) {}
    }

    setAdminList((prev) => {
      const updatedList = prev.map((a) => (a.id === adminId || a.username === prevUsername ? { ...a, ...updated } : a));
      try {
        localStorage.setItem('attaroqqy_admin_list_v1', JSON.stringify(updatedList));
      } catch (e) {}
      return updatedList;
    });

    const newHandle = updated.username
      ? (updated.username.startsWith('@') ? updated.username : `@${updated.username}`)
      : undefined;
    const newName = updated.name ?? currentAdmin.name;
    const newAvatar = updated.avatar !== undefined ? updated.avatar : currentAdmin.avatar;
    const newCoverPhoto = updated.coverPhotoUrl !== undefined ? updated.coverPhotoUrl : currentAdmin.coverPhotoUrl;

    // Sync and PERMANENTLY save all existing events authored by admin (synchronously computed)
    const prevH = prevUsername ? prevUsername.replace(/^@/, '').toLowerCase().trim() : '';
    if (updated.name || updated.username || updated.avatar !== undefined) {
      const nextEvents = events.map((ev) => {
        const evHandle = ev.authorHandle ? ev.authorHandle.replace(/^@/, '').toLowerCase().trim() : '';
        const isAuthor =
          !ev.authorHandle ||
          evHandle === prevH ||
          evHandle === 'admin_pusat' ||
          ev.authorName === prevName ||
          ev.authorName === 'Ust. H. Abdurrahman, M.Pd.' ||
          ev.authorName === 'Davidko' ||
          ev.authorName === 'Davidson' ||
          ev.authorName === newName;

        if (isAuthor) {
          return {
            ...ev,
            authorName: newName,
            authorHandle: newHandle ?? ev.authorHandle,
            authorAvatar: newAvatar,
          };
        }
        return ev;
      });
      setEvents(nextEvents);

      // Save each updated event to database/server so it is never overwritten by polling
      for (const ev of nextEvents) {
        const evHandle = ev.authorHandle ? ev.authorHandle.replace(/^@/, '').toLowerCase().trim() : '';
        const isAuthor =
          !ev.authorHandle ||
          evHandle === prevH ||
          evHandle === 'admin_pusat' ||
          ev.authorName === prevName ||
          ev.authorName === newName;
        if (isAuthor) {
          saveEventToHostinger(ev).catch(() => {});
        }
      }

      // Sync and PERMANENTLY save all existing announcements authored by admin (synchronously computed)
      const nextAnns = announcements.map((ann) => {
        const annHandle = ann.authorHandle ? ann.authorHandle.replace(/^@/, '').toLowerCase().trim() : '';
        const isAuthor =
          !ann.authorHandle ||
          annHandle === prevH ||
          annHandle === 'admin_pusat' ||
          ann.authorName === prevName ||
          ann.authorName === 'Ust. H. Abdurrahman, M.Pd.' ||
          ann.authorName === 'Davidko' ||
          ann.authorName === 'Davidson' ||
          ann.authorName === 'Pondok Pesantren At-taroqqy' ||
          ann.authorName === newName;

        if (isAuthor) {
          return {
            ...ann,
            authorName: newName,
            authorHandle: newHandle ?? ann.authorHandle,
            authorAvatar: newAvatar,
          };
        }
        return ann;
      });
      setAnnouncements(nextAnns);

      // Save each updated announcement to database/server
      for (const ann of nextAnns) {
        const annHandle = ann.authorHandle ? ann.authorHandle.replace(/^@/, '').toLowerCase().trim() : '';
        const isAuthor =
          !ann.authorHandle ||
          annHandle === prevH ||
          annHandle === 'admin_pusat' ||
          ann.authorName === prevName ||
          ann.authorName === newName;
        if (isAuthor) {
          saveAnnouncementToHostinger(ann).catch(() => {});
        }
      }
    }

    // Sync admin profile to server and MySQL backend
    await syncAdminProfileAcrossApp({
      id: nextAdmin.id,
      prevName,
      prevUsername,
      name: newName,
      username: newHandle ?? currentAdmin.username,
      avatar: newAvatar,
      coverPhotoUrl: newCoverPhoto,
      jabatan: updated.jabatan ?? currentAdmin.jabatan,
      bio: updated.bio ?? currentAdmin.bio,
      phone: updated.phone ?? currentAdmin.phone,
      province: updated.province ?? currentAdmin.province,
      city: updated.city ?? currentAdmin.city,
      kecamatan: updated.kecamatan ?? currentAdmin.kecamatan,
      desa: updated.desa ?? currentAdmin.desa,
      alamatLengkap: updated.alamatLengkap ?? currentAdmin.alamatLengkap,
      coordinates: updated.coordinates !== undefined ? updated.coordinates : currentAdmin.coordinates,
      password: updated.password ?? currentAdmin.password,
      role: nextAdmin.role,
      regionLevel: nextAdmin.regionLevel,
    });
  };

  const handleRsvpEvent = async (
    eventId: string,
    rsvp: 'hadir' | 'belum_pasti' | 'tidak_hadir',
    note?: string
  ) => {
    const targetEvent = events.find((ev) => ev.id === eventId);
    if (!targetEvent) return;

    const prevRsvp = targetEvent.userRsvp;
    let newAttendees = targetEvent.attendeesCount || 0;
    let newAbsent = targetEvent.absentCount || targetEvent.notAttendingCount || 0;

    // Decrement previous selection count
    if (prevRsvp === 'hadir') newAttendees = Math.max(0, newAttendees - 1);
    if (prevRsvp === 'tidak_hadir') newAbsent = Math.max(0, newAbsent - 1);

    // Increment new selection count
    if (rsvp === 'hadir') newAttendees += 1;
    if (rsvp === 'tidak_hadir') newAbsent += 1;

    const updatedEv: EventAgenda = {
      ...targetEvent,
      userRsvp: rsvp,
      attendeesCount: newAttendees,
      absentCount: newAbsent,
      notAttendingCount: newAbsent,
      rsvpNote: note !== undefined ? note : targetEvent.rsvpNote,
    };

    // Update state immediately
    setEvents((prev) => prev.map((ev) => (ev.id === eventId ? updatedEv : ev)));

    // Save event with updated attendees count immediately to server so polling doesn't overwrite it
    await saveEventToHostinger(updatedEv);

    const activeUser = currentSession?.role === 'admin' && currentSession.adminData
      ? {
          id: currentSession.adminData.id || 'adm-001',
          name: currentSession.adminData.name,
          username: currentSession.adminData.username,
          photoUrl: currentSession.adminData.avatar,
        }
      : currentSession?.alumniData
      ? {
          id: currentSession.alumniData.id,
          name: currentSession.alumniData.name,
          username: currentSession.alumniData.username,
          photoUrl: currentSession.alumniData.photoUrl,
        }
      : {
          id: 'user-' + Date.now(),
          name: 'Alumni',
          username: '@alumni',
          photoUrl: '',
        };

    const finalContent = note || (rsvp === 'hadir' ? 'Insya Allah saya hadir' : rsvp === 'tidak_hadir' ? 'Mohon maaf belum bisa hadir' : '');
    if (rsvp !== 'belum_pasti') {
      const rsvpComment: EventComment = {
        id: `comm-rsvp-${activeUser.id}-${eventId}`,
        eventId,
        authorName: activeUser.name,
        authorHandle: activeUser.username || '@alumni',
        authorAvatar: activeUser.photoUrl,
        avatarRing: true,
        status: rsvp,
        content: finalContent,
        timeAgo: 'Baru saja',
        likesCount: 0,
        repliesCount: 0,
        replies: [],
        isCurrentUser: true,
      };
      await saveCommentToDatabase(rsvpComment, 'event');
    }

    await saveRsvpToHostinger(
      eventId,
      activeUser.id,
      rsvp,
      finalContent,
      {
        name: activeUser.name,
        username: activeUser.username,
        photoUrl: activeUser.photoUrl,
      },
      {
        attendeesCount: newAttendees,
        absentCount: newAbsent,
      }
    );
  };

  const handleAddEvent = async (newEvent: EventAgenda) => {
    setEvents((prev) => [newEvent, ...prev]);
    // Simpan permanen ke database Hostinger
    await saveEventToHostinger(newEvent);
  };

  const handleUpdateEvent = async (id: string, updated: Partial<EventAgenda>) => {
    let mergedEvent: EventAgenda | null = null;
    setEvents((prev) => {
      const next = prev.map((item) => {
        if (item.id === id) {
          mergedEvent = { ...item, ...updated };
          return mergedEvent;
        }
        return item;
      });
      return next;
    });

    // Fallback pencarian langsung jika state callback belum tereksekusi
    const current = events.find((item) => item.id === id);
    const eventToSave = mergedEvent || (current ? { ...current, ...updated } : (updated as EventAgenda));
    if (eventToSave && eventToSave.id) {
      await saveEventToHostinger(eventToSave);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    setEvents((prev) => prev.filter((item) => item.id !== id));
    await deleteEventFromHostinger(id);
  };

  const handleAddAnnouncement = async (newAnn: AnnouncementItem) => {
    setAnnouncements((prev) => [newAnn, ...prev]);
    // Simpan permanen ke database Hostinger
    await saveAnnouncementToHostinger(newAnn);
  };

  const handleUpdateAnnouncement = async (id: string, updated: Partial<AnnouncementItem>) => {
    let mergedAnn: AnnouncementItem | null = null;
    setAnnouncements((prev) => {
      const next = prev.map((item) => {
        if (item.id === id) {
          mergedAnn = { ...item, ...updated };
          return mergedAnn;
        }
        return item;
      });
      return next;
    });

    const current = announcements.find((item) => item.id === id);
    const annToSave = mergedAnn || (current ? { ...current, ...updated } : (updated as AnnouncementItem));
    if (annToSave && annToSave.id) {
      await saveAnnouncementToHostinger(annToSave);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    setAnnouncements((prev) => prev.filter((item) => item.id !== id));
    await deleteAnnouncementFromHostinger(id);
  };

  const handleRegisterSuccess = (data: { email: string; name: string }) => {
    // Automatically register as a pending alumni record
    const newAlm: AlumniRecord = {
      id: 'alm-' + Date.now(),
      nik: '3507' + Math.floor(100000000000 + Math.random() * 900000000000),
      nis: 'TRQ-2022-' + Math.floor(100 + Math.random() * 900),
      name: data.name,
      username: '',
      gender: 'L',
      gradYear: '2022',
      entryYear: '2016',
      jenjang: "Madrasah Aliyah Keagamaan (MAK)",
      asramaDulu: 'Komplek Santri Baru',
      email: data.email,
      phone: '08123456789',
      city: 'Malang',
      province: 'Jawa Timur',
      occupation: 'Alumni Fresh Graduate',
      institution: 'Universitas / Mandiri',
      password: '1234',
      isPasswordChanged: false,
      source: 'manual_admin',
      syncTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      shareContact: true,
      status: 'alumni',
    };
    setAlumniList((prev) => [newAlm, ...prev]);
  };

  return (
    <div className="w-full h-full h-[100dvh] flex flex-col bg-slate-50 overflow-hidden text-slate-800">
      {/* 1. STATE: LOGGED IN AS ALUMNI */}
      {currentSession?.role === 'alumni' && currentSession.alumniData && (
        isAlumniNeedingActivation(currentSession.alumniData) ? (
          <FirstTimeActivationView
            alumni={currentSession.alumniData}
            alumniList={alumniList}
            adminAccounts={adminList}
            onComplete={handleCompleteActivation}
            onCancelLogout={handleLogout}
          />
        ) : (
          <AlumniView
            alumni={currentSession.alumniData}
            allAlumni={alumniList}
            events={events}
            announcements={announcements}
            onLogout={handleLogout}
            onUpdateProfile={handleUpdateAlumniProfile}
            onRsvpEvent={handleRsvpEvent}
            onAddAnnouncement={handleAddAnnouncement}
            onDeleteEvent={handleDeleteEvent}
            onDeleteAnnouncement={handleDeleteAnnouncement}
            isDbLoading={isDbLoading}
            isDbConnected={isDbConnected}
            onRefreshData={() => loadData(false)}
          />
        )
      )}

      {/* 2. STATE: LOGGED IN AS ADMIN */}
      {currentSession?.role === 'admin' && currentSession.adminData && (
        <AdminView
          admin={currentSession.adminData}
          alumniList={alumniList}
          allSantriList={allSantriList}
          adminList={adminList}
          events={events}
          announcements={announcements}
          onLogout={handleLogout}
          onAddAlumni={handleAddAlumniByAdmin}
          onUpdateAlumni={handleUpdateAlumniByAdmin}
          onDeleteAlumni={handleDeleteAlumniByAdmin}
          onResetPassword={handleResetAlumniPassword}
          onAddEvent={handleAddEvent}
          onUpdateEvent={handleUpdateEvent}
          onDeleteEvent={handleDeleteEvent}
          onUpdateAdmin={handleUpdateAdmin}
          onAddAdminUser={handleAddAdminUser}
          onUpdateAdminUser={handleUpdateAdminUser}
          onDeleteAdminUser={handleDeleteAdminUser}
          onAddAnnouncement={handleAddAnnouncement}
          onUpdateAnnouncement={handleUpdateAnnouncement}
          onDeleteAnnouncement={handleDeleteAnnouncement}
          isDbLoading={isDbLoading}
          isDbConnected={isDbConnected}
          onRefreshData={loadData}
        />
      )}

      {/* 3. STATE: LOGIN SCREEN */}
      {!currentSession && (
        <LoginScreen
          alumniList={alumniList}
          adminAccount={adminAccount}
          adminAccounts={adminList}
          onLoginSuccess={handleLoginSuccess}
          onOpenForgotPassword={() => setIsForgotPasswordOpen(true)}
          isDbLoading={isDbLoading}
          isDbConnected={isDbConnected}
          onRefreshData={loadData}
        />
      )}



      {/* MODAL PENDAFTARAN PENGAJUAN AKUN */}
      {isRegisterOpen && (
        <RegisterModal
          isOpen={isRegisterOpen}
          onClose={() => setIsRegisterOpen(false)}
          onSuccess={handleRegisterSuccess}
        />
      )}

      {/* MODAL LUPA KATA SANDI */}
      {isForgotPasswordOpen && (
        <ForgotPasswordModal
          isOpen={isForgotPasswordOpen}
          onClose={() => setIsForgotPasswordOpen(false)}
        />
      )}

      {/* TOAST REALTIME TWO-WAY SYNC */}
      {syncToastMessage && (
        <div className="fixed top-4 inset-x-0 flex justify-center z-[999999] pointer-events-none px-4 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="bg-emerald-950/95 text-emerald-100 text-xs font-medium px-4 py-2 rounded-full shadow-xl backdrop-blur-md border border-emerald-500/30 flex items-center gap-2 max-w-sm text-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span>{syncToastMessage}</span>
          </div>
        </div>
      )}

      {/* TOAST PETUNJUK TOMBOL KEMBALI KELUAR */}
      {exitToastMessage && (
        <div className="fixed bottom-20 inset-x-0 flex justify-center z-[999999] pointer-events-none px-4 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="bg-slate-900/90 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-xs border border-white/10 text-center max-w-xs">
            {exitToastMessage}
          </div>
        </div>
      )}
    </div>
  );
}
