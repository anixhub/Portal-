/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { AlumniView } from './components/AlumniView';
import { AdminView } from './components/AdminView';
import { FirstLoginModal } from './components/FirstLoginModal';
import { RegisterModal } from './components/RegisterModal';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { INITIAL_ALUMNI, INITIAL_ADMIN, INITIAL_ADMIN_LIST, INITIAL_EVENTS, INITIAL_ANNOUNCEMENTS } from './data/mockData';
import { AlumniRecord, AdminUser, EventAgenda, UserRole, ActiveSession, AnnouncementItem } from './types';
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
  fetchAnnouncementsFromHostinger,
  saveAnnouncementToHostinger,
  deleteAnnouncementFromHostinger,
  syncChannel,
} from './services/apiService';

export default function App() {
  const [alumniList, setAlumniList] = useState<AlumniRecord[]>(INITIAL_ALUMNI);
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
      localStorage.setItem('attaroqqy_admin_list_v1', JSON.stringify(adminList));
    } catch (e) {}
    if (adminList[0]) {
      setAdminAccount(adminList[0]);
    }
  }, [adminList]);

  const handleAddAdminUser = (newAdmin: AdminUser) => {
    setAdminList((prev) => [...prev, newAdmin]);
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
  };

  const handleDeleteAdminUser = (adminId: string) => {
    setAdminList((prev) => prev.filter((a) => a.id !== adminId));
  };

  // Events & Announcements dengan persistensi lokal dan sinkronisasi database
  const [events, setEvents] = useState<EventAgenda[]>(() => {
    try {
      const saved = localStorage.getItem('attaroqqy_events_cache_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_EVENTS;
  });

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(() => {
    try {
      const saved = localStorage.getItem('attaroqqy_announcements_cache_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_ANNOUNCEMENTS;
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

  // Security prompt for first-time login alumni
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false);
  const [pendingAlumniData, setPendingAlumniData] = useState<AlumniRecord | null>(null);

  // Other modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // Database connection states
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [isDbConnected, setIsDbConnected] = useState(false);

  // Load real data from Hostinger MySQL database on mount & support manual refresh and background polling
  const loadData = async (silent: boolean = false) => {
    if (!silent) setIsDbLoading(true);
    try {
      const [alumniRes, eventsRes, annRes] = await Promise.all([
        fetchAlumniFromHostinger(true),
        fetchEventsFromHostinger(),
        fetchAnnouncementsFromHostinger(),
      ]);

      if (alumniRes.success && alumniRes.data && alumniRes.data.length > 0) {
        setAlumniList(alumniRes.data);
        setIsDbConnected(true);

        // Perbarui data sesi alumni yang sedang aktif agar selalu sinkron dengan database
        setCurrentSession((prev) => {
          if (prev?.role === 'alumni' && prev.alumniData) {
            const freshMe = alumniRes.data.find(
              (a) => a.id === prev.alumniData!.id || (a.nik && a.nik === prev.alumniData!.nik)
            );
            if (freshMe) {
              return { ...prev, alumniData: freshMe };
            }
          }
          return prev;
        });
      } else {
        if (!silent) setIsDbConnected(false);
      }

      if (eventsRes.success && eventsRes.data && eventsRes.data.length > 0) {
        setEvents(eventsRes.data);
      }

      if (annRes.success && annRes.data && annRes.data.length > 0) {
        setAnnouncements(annRes.data);
      }
    } catch (err) {
      console.warn('Gagal memuat data dari Hostinger:', err);
      if (!silent) setIsDbConnected(false);
    } finally {
      if (!silent) setIsDbLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);

    // 1. Sinkronisasi otomatis setiap 8 detik (Polling 2-arah realtime)
    const pollInterval = setInterval(() => {
      loadData(true);
    }, 8000);

    // 2. Auto-refresh saat jendela browser mendapatkan fokus kembali atau kembali online
    const handleWindowFocus = () => {
      loadData(true);
    };

    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('online', handleWindowFocus);

    // 3. Sinkronisasi instan via BroadcastChannel (antar-tab & antar-window)
    const handleBroadcastMessage = (event: MessageEvent) => {
      console.log('[Realtime Sync] Sinyal update diterima:', event.data);
      loadData(true);
    };

    if (syncChannel) {
      syncChannel.addEventListener('message', handleBroadcastMessage);
    }

    // 4. Fallback sinkronisasi via Storage Event jika BroadcastChannel tidak aktif
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'attaroqqy_sync_pulse') {
        loadData(true);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('online', handleWindowFocus);
      if (syncChannel) {
        syncChannel.removeEventListener('message', handleBroadcastMessage);
      }
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Penanganan tombol fisik kembali untuk modal-modal di layer Login/Auth
  useBackHandler(isRegisterOpen, 'login-register-modal', () => setIsRegisterOpen(false));
  useBackHandler(isForgotPasswordOpen, 'login-forgot-pwd-modal', () => setIsForgotPasswordOpen(false));
  useBackHandler(showFirstLoginModal, 'login-first-time-modal', () => setShowFirstLoginModal(false));

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
      const updatedAlumni: AlumniRecord = {
        ...alumniData,
        hasLoggedIn: true,
      };
      setAlumniList((prev) =>
        prev.map((alm) => (alm.id === alumniData.id ? { ...alm, hasLoggedIn: true } : alm))
      );
      setCurrentSession({ role: 'alumni', alumniData: updatedAlumni });
      // Update hasLoggedIn / status in database
      updateAlumniInHostinger(alumniData.id, { hasLoggedIn: true });
    }
  };

  const handleLogout = () => {
    setCurrentSession(null);
    setShowFirstLoginModal(false);
    setPendingAlumniData(null);
  };

  // Alumni self-profile update
  const handleUpdateAlumniProfile = async (updates: Partial<AlumniRecord>) => {
    if (!currentSession?.alumniData) return;

    const prevAlumni = currentSession.alumniData;
    const updatedAlumni: AlumniRecord = {
      ...currentSession.alumniData,
      ...updates,
    };

    if ('coordinates' in updates && !updates.coordinates) {
      delete (updatedAlumni as any).coordinates;
    }

    if ('coverPhotoUrl' in updates && !updates.coverPhotoUrl) {
      delete (updatedAlumni as any).coverPhotoUrl;
    }

    setCurrentSession({
      ...currentSession,
      alumniData: updatedAlumni,
    });

    setAlumniList((prev) =>
      prev.map((item) => (item.id === updatedAlumni.id ? updatedAlumni : item))
    );

    // Sync all existing events and announcements authored by this alumni
    if (updates.name || updates.username || updates.photoUrl !== undefined) {
      const prevHandle = prevAlumni.username ? prevAlumni.username.replace(/^@/, '').toLowerCase() : '';
      const newHandle = updates.username ? (updates.username.startsWith('@') ? updates.username : `@${updates.username}`) : undefined;

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

    // Sync secara realtime ke database Hostinger
    await updateAlumniInHostinger(updatedAlumni.id, updates);
  };

  // First-time modal save
  const handleFirstLoginSave = ({
    username,
    newPassword,
    phone,
  }: {
    username: string;
    newPassword?: string;
    phone?: string;
  }) => {
    if (!currentSession?.alumniData) return;

    const updates: Partial<AlumniRecord> = {
      username: username || currentSession.alumniData.username,
      phone: phone || currentSession.alumniData.phone,
    };

    if (newPassword) {
      updates.password = newPassword;
      updates.isPasswordChanged = true;
    }

    handleUpdateAlumniProfile(updates);
    setShowFirstLoginModal(false);
    setPendingAlumniData(null);
  };

  // Admin actions
  const handleAddAlumniByAdmin = async (newAlumni: AlumniRecord) => {
    setAlumniList((prev) => [newAlumni, ...prev]);
    // Simpan ke database Hostinger
    await addAlumniToHostinger(newAlumni);
  };

  const handleUpdateAlumniByAdmin = async (id: string, updated: Partial<AlumniRecord>) => {
    setAlumniList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );
    // If current alumni is the one updated
    if (currentSession?.alumniData?.id === id) {
      setCurrentSession({
        ...currentSession,
        alumniData: { ...currentSession.alumniData, ...updated },
      });
    }
    // Simpan ke database Hostinger
    await updateAlumniInHostinger(id, updated);
  };

  const handleResetAlumniPassword = async (id: string) => {
    setAlumniList((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, password: '1234', isPasswordChanged: false }
          : item
      )
    );
    // Reset di database Hostinger
    await resetAlumniPasswordInHostinger(id);
  };

  const handleDeleteAlumniByAdmin = async (id: string) => {
    setAlumniList((prev) => prev.filter((item) => item.id !== id));
    await deleteAlumniFromHostinger(id);
  };

  const handleUpdateAdmin = (updated: Partial<AdminUser>) => {
    const prevName = adminAccount.name;
    const prevUsername = adminAccount.username;

    setAdminAccount((prev) => {
      const next = { ...prev, ...updated };
      if (currentSession?.role === 'admin' && currentSession.adminData) {
        setCurrentSession({
          ...currentSession,
          adminData: next,
        });
      }
      return next;
    });

    // Sync all existing events authored by admin
    setEvents((prevEvents) =>
      prevEvents.map((ev) => {
        const evHandle = ev.authorHandle ? ev.authorHandle.replace(/^@/, '').toLowerCase() : '';
        const prevH = prevUsername ? prevUsername.replace(/^@/, '').toLowerCase() : '';
        const isAuthor =
          !ev.authorHandle ||
          evHandle === prevH ||
          evHandle === 'admin_pusat' ||
          ev.authorName === prevName ||
          ev.authorName === 'Ust. H. Abdurrahman, M.Pd.';

        if (isAuthor) {
          return {
            ...ev,
            authorName: updated.name ?? ev.authorName,
            authorHandle: updated.username ?? ev.authorHandle,
            authorAvatar: updated.avatar !== undefined ? updated.avatar : ev.authorAvatar,
          };
        }
        return ev;
      })
    );

    // Sync all existing announcements authored by admin
    setAnnouncements((prevAnn) =>
      prevAnn.map((ann) => {
        const annHandle = ann.authorHandle ? ann.authorHandle.replace(/^@/, '').toLowerCase() : '';
        const prevH = prevUsername ? prevUsername.replace(/^@/, '').toLowerCase() : '';
        const isAuthor =
          !ann.authorHandle ||
          annHandle === prevH ||
          annHandle === 'admin_pusat' ||
          ann.authorName === prevName ||
          ann.authorName === 'Ust. H. Abdurrahman, M.Pd.' ||
          ann.authorName === 'Pondok Pesantren At-taroqqy';

        if (isAuthor) {
          return {
            ...ann,
            authorName: updated.name ?? ann.authorName,
            authorHandle: updated.username ?? ann.authorHandle,
            authorAvatar: updated.avatar !== undefined ? updated.avatar : ann.authorAvatar,
          };
        }
        return ann;
      })
    );
  };

  const handleRsvpEvent = async (
    eventId: string,
    rsvp: 'hadir' | 'belum_pasti' | 'tidak_hadir',
    note?: string
  ) => {
    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== eventId) return ev;
        const prevRsvp = ev.userRsvp;
        let newAttendees = ev.attendeesCount;
        let newAbsent = ev.absentCount || 0;

        // Decrement previous selection count
        if (prevRsvp === 'hadir') newAttendees = Math.max(0, newAttendees - 1);
        if (prevRsvp === 'tidak_hadir') newAbsent = Math.max(0, newAbsent - 1);

        // Increment new selection count
        if (rsvp === 'hadir') newAttendees += 1;
        if (rsvp === 'tidak_hadir') newAbsent += 1;

        return {
          ...ev,
          userRsvp: rsvp,
          attendeesCount: newAttendees,
          absentCount: newAbsent,
          rsvpNote: note !== undefined ? note : ev.rsvpNote,
        };
      })
    );

    if (currentSession?.alumniData?.id) {
      await saveRsvpToHostinger(eventId, currentSession.alumniData.id, rsvp, note);
    }
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
        <AlumniView
          alumni={currentSession.alumniData}
          allAlumni={alumniList}
          events={events}
          announcements={announcements}
          onLogout={handleLogout}
          onUpdateProfile={handleUpdateAlumniProfile}
          onRsvpEvent={handleRsvpEvent}
          onAddAnnouncement={handleAddAnnouncement}
          isDbLoading={isDbLoading}
          isDbConnected={isDbConnected}
          onRefreshData={() => loadData(false)}
        />
      )}

      {/* 2. STATE: LOGGED IN AS ADMIN */}
      {currentSession?.role === 'admin' && currentSession.adminData && (
        <AdminView
          admin={currentSession.adminData}
          alumniList={alumniList}
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

      {/* FIRST LOGIN PROMPT FOR ALUMNI WITH PASSWORD 1234 */}
      {showFirstLoginModal && pendingAlumniData && (
        <FirstLoginModal
          isOpen={showFirstLoginModal}
          alumni={pendingAlumniData}
          onSave={handleFirstLoginSave}
          onDismiss={() => setShowFirstLoginModal(false)}
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
