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
import { INITIAL_ALUMNI, INITIAL_ADMIN, INITIAL_EVENTS, INITIAL_ANNOUNCEMENTS } from './data/mockData';
import { AlumniRecord, AdminUser, EventAgenda, UserRole, ActiveSession, AnnouncementItem } from './types';
import {
  fetchAlumniFromHostinger,
  updateAlumniInHostinger,
  addAlumniToHostinger,
  resetAlumniPasswordInHostinger,
} from './services/apiService';

export default function App() {
  const [alumniList, setAlumniList] = useState<AlumniRecord[]>(INITIAL_ALUMNI);
  const [adminAccount, setAdminAccount] = useState<AdminUser>(INITIAL_ADMIN);
  const [events, setEvents] = useState<EventAgenda[]>(INITIAL_EVENTS);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(INITIAL_ANNOUNCEMENTS);

  // Current session
  const [currentSession, setCurrentSession] = useState<ActiveSession | null>(null);

  // Security prompt for first-time login alumni
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false);
  const [pendingAlumniData, setPendingAlumniData] = useState<AlumniRecord | null>(null);

  // Other modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // Load real data from Hostinger MySQL database on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const res = await fetchAlumniFromHostinger();
        if (isMounted && res.success && res.data && res.data.length > 0) {
          setAlumniList(res.data);
        }
      } catch (err) {
        console.warn('Gagal memuat data alumni dari Hostinger:', err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
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

  const handleUpdateAdmin = (updated: Partial<AdminUser>) => {
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
  };

  const handleRsvpEvent = (
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
  };

  const handleAddEvent = (newEvent: EventAgenda) => {
    setEvents((prev) => [newEvent, ...prev]);
  };

  const handleAddAnnouncement = (newAnn: AnnouncementItem) => {
    setAnnouncements((prev) => [newAnn, ...prev]);
  };

  const handleUpdateAnnouncement = (id: string, updated: Partial<AnnouncementItem>) => {
    setAnnouncements((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((item) => item.id !== id));
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
    <div className="w-full min-h-screen h-screen flex flex-col bg-slate-50 overflow-hidden text-slate-800">
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
        />
      )}

      {/* 2. STATE: LOGGED IN AS ADMIN */}
      {currentSession?.role === 'admin' && currentSession.adminData && (
        <AdminView
          admin={currentSession.adminData}
          alumniList={alumniList}
          events={events}
          announcements={announcements}
          onLogout={handleLogout}
          onAddAlumni={handleAddAlumniByAdmin}
          onUpdateAlumni={handleUpdateAlumniByAdmin}
          onResetPassword={handleResetAlumniPassword}
          onAddEvent={handleAddEvent}
          onUpdateAdmin={handleUpdateAdmin}
          onAddAnnouncement={handleAddAnnouncement}
          onUpdateAnnouncement={handleUpdateAnnouncement}
          onDeleteAnnouncement={handleDeleteAnnouncement}
        />
      )}

      {/* 3. STATE: LOGIN SCREEN */}
      {!currentSession && (
        <LoginScreen
          alumniList={alumniList}
          adminAccount={adminAccount}
          onLoginSuccess={handleLoginSuccess}
          onOpenRegister={() => setIsRegisterOpen(true)}
          onOpenForgotPassword={() => setIsForgotPasswordOpen(true)}
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
    </div>
  );
}
