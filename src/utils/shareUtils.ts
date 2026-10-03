/**
 * Utility untuk membagikan gambar dan teks caption ke WhatsApp atau aplikasi lain via Web Share API
 * (Memunculkan daftar aplikasi sistem: WhatsApp Status/Story, Chat, dll.)
 */

// Helper untuk mengubah URL gambar menjadi File untuk Web Share API
export async function getFileFromImageUrl(imageUrl: string, filename = 'post-image'): Promise<File | null> {
  try {
    if (!imageUrl) return null;

    if (imageUrl.startsWith('data:')) {
      const arr = imageUrl.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const ext = mime.includes('png') ? 'png' : 'jpg';
      return new File([blob], `${filename}.${ext}`, { type: mime });
    }

    const res = await fetch(imageUrl);
    const blob = await res.blob();
    const mime = blob.type || 'image/jpeg';
    const ext = mime.includes('png') ? 'png' : 'jpg';
    return new File([blob], `${filename}.${ext}`, { type: mime });
  } catch (err) {
    console.warn('Gagal mengubah gambar menjadi File:', err);
    return null;
  }
}

export async function shareMediaWithCaption({
  imageUrl,
  title,
  text,
  onToast,
}: {
  imageUrl?: string | null;
  title: string;
  text: string;
  onToast?: (msg: string) => void;
}) {
  // PENTING: Untuk menjaga "User Gesture Activation" agar menu daftar aplikasi sistem
  // (WhatsApp, Instagram, Story, dll.) muncul di mobile, kita siapkan file gambar dan
  // segera memanggil navigator.share.

  let file: File | null = null;
  if (imageUrl) {
    try {
      file = await getFileFromImageUrl(imageUrl, `attaroqqy_${Date.now()}`);
    } catch {
      file = null;
    }
  }

  // 1. Coba Web Share API dengan File Gambar + Teks Caption sekaligus (Standar WhatsApp Story & Chat Mobile)
  if (typeof navigator !== 'undefined' && navigator.share) {
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: title,
          text: text,
        });
        return;
      } catch (e: any) {
        if (e?.name === 'AbortError') return; // Pengguna menutup share sheet
        console.warn('Web Share dengan file tidak berhasil, mencoba share teks:', e);
      }
    }

    // 2. Jika share dengan file gagal atau tidak didukung pada browser ini, share teks
    try {
      await navigator.share({
        title: title,
        text: text,
      });
      return;
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      console.warn('Web Share teks tidak berhasil, beralih ke fallback clipboard:', e);
    }
  }

  // 3. Fallback jika dibuka di browser desktop (tanpa Web Share API):
  // Salin teks caption ke clipboard dan unduh gambar otomatis agar bisa ditempel (Ctrl+V) di WhatsApp Web
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    }
  } catch {
    // abaikan jika tidak diizinkan
  }

  if (imageUrl) {
    try {
      const a = document.createElement('a');
      a.href = imageUrl;
      a.download = `attaroqqy_${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {}
    onToast?.('Foto disiapkan & caption teks disalin! Siap ditempel (Paste) ke WhatsApp.');
  } else {
    onToast?.('Teks caption berhasil disalin ke papan klip!');
  }
}
