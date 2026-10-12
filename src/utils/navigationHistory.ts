/**
 * Utility Pengelola Tombol Fisik Kembali (Android Physical Back Button & Browser Back)
 * Sinkronisasi antara tombol fisik HP, gesture swipe-back Android, dan tombol kembali UI di website.
 */

type BackHandler = () => void;

interface StackItem {
  id: string;
  handler: BackHandler;
}

const backStack: StackItem[] = [];
let isProgrammaticBack = false;
let lastExitBackPressTime = 0;

// Inisialisasi listener popstate global
if (typeof window !== 'undefined') {
  // Pastikan ada state awal di browser history agar tidak langsung exit saat pertama dibuka
  if (!window.history.state || !window.history.state.__app_initialized) {
    window.history.replaceState({ __app_initialized: true, depth: 0 }, '');
  }

  window.addEventListener('popstate', (event) => {
    if (isProgrammaticBack) {
      isProgrammaticBack = false;
      return;
    }

    // Jika ada modal / layer sub-view yang terbuka di atas stack
    if (backStack.length > 0) {
      const top = backStack.pop();
      if (top) {
        try {
          top.handler();
        } catch (err) {
          console.warn('[NavigationHistory] Gagal mengeksekusi handler kembali:', err);
        }
      }
      return;
    }

    // Jika tidak ada modal terbuka dan berada di halaman utama
    // Terapkan perlindungan "Tekan sekali lagi untuk keluar"
    const now = Date.now();
    if (now - lastExitBackPressTime < 2200) {
      // Pengguna memang ingin keluar, biarkan riwayat mundur ke luar web
      lastExitBackPressTime = 0;
      window.history.back();
    } else {
      lastExitBackPressTime = now;
      // Beri efek toast via custom event
      window.dispatchEvent(
        new CustomEvent('app-back-exit-hint', {
          detail: { message: 'Tekan sekali lagi untuk keluar dari website' },
        })
      );
      // Dorong kembali state agar browser tidak keluar pada ketukan pertama
      window.history.pushState({ __app_initialized: true, depth: 0 }, '');
    }
  });
}

/**
 * Daftarkan modal / subview yang baru dibuka ke riwayat tombol fisik
 * @param id ID unik untuk modal ini (misal: 'modal-peta-sebaran', 'modal-detail-alumni')
 * @param onClose Callback fungsi untuk menutup modal tersebut
 */
export function pushModalBackHandler(id: string, onClose: BackHandler): () => void {
  // Jika sudah terdaftar dengan ID yang sama, hapus dulu agar tidak ganda
  const existingIdx = backStack.findIndex((item) => item.id === id);
  if (existingIdx !== -1) {
    backStack.splice(existingIdx, 1);
  }

  // Tambahkan ke stack
  backStack.push({ id, handler: onClose });

  // Dorong state baru ke browser history
  if (typeof window !== 'undefined') {
    window.history.pushState({ modalId: id, depth: backStack.length }, '');
  }

  // Mengembalikan fungsi unregister untuk useEffect cleanup
  return () => {
    closeModalBackHandler(id);
  };
}

/**
 * Tutup modal secara terprogram (misal tombol silang 'X' atau 'Kembali' di UI ditekan)
 * Ini akan menyelaraskan riwayat browser sehingga tombol fisik tidak tertinggal state mati.
 */
export function closeModalBackHandler(id: string): void {
  const idx = backStack.findIndex((item) => item.id === id);
  if (idx !== -1) {
    backStack.splice(idx, 1);

    // Jika state di browser saat ini cocok dengan modal ini, lakukan history.back
    if (typeof window !== 'undefined' && window.history.state?.modalId === id) {
      isProgrammaticBack = true;
      window.history.back();
    }
  }
}

/**
 * Hook bantuan React untuk otomatis mendaftarkan penanganan tombol fisik saat modal/drawer terbuka
 */
import { useEffect, useRef } from 'react';

export function useBackHandler(isOpen: boolean, id: string, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const unregister = pushModalBackHandler(id, () => {
      onCloseRef.current();
    });

    return () => {
      unregister();
    };
  }, [isOpen, id]);
}
