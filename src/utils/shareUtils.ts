/**
 * Utility untuk membagikan gambar yang sedang disorot dan teks caption
 * ke WhatsApp atau aplikasi lain via Web Share API, serta fallback
 * menyalin gambar (PNG Blob) dan teks caption ke clipboard.
 */

// Helper untuk mengubah URL gambar atau DataURL apa pun menjadi Blob PNG (wajib PNG untuk clipboard.write)
async function convertImageUrlToPngBlob(imageUrl: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width || 800;
          canvas.height = img.naturalHeight || img.height || 600;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/png');
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = imageUrl;
    } catch {
      resolve(null);
    }
  });
}

// Helper untuk mengubah URL gambar menjadi File untuk Web Share API
async function getFileFromImageUrl(imageUrl: string, filename = 'post-image.jpg'): Promise<File | null> {
  try {
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
    } else {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const ext = blob.type.includes('png') ? 'png' : 'jpg';
      return new File([blob], `${filename}.${ext}`, { type: blob.type || 'image/jpeg' });
    }
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
  onToast: (msg: string) => void;
}) {
  let sharedViaNative = false;

  // 1. Coba salin gambar & teks ke Clipboard terlebih dahulu agar pengguna bisa langsung Paste (Ctrl+V) di WhatsApp Web
  let copiedImageSuccess = false;
  if (imageUrl && navigator.clipboard && typeof (window as any).ClipboardItem !== 'undefined') {
    try {
      const pngBlob = await convertImageUrlToPngBlob(imageUrl);
      if (pngBlob) {
        // Tulis blob gambar ke clipboard
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({
            'image/png': pngBlob,
          }),
        ]);
        copiedImageSuccess = true;
      }
    } catch (e) {
      console.warn('Clipboard image write info:', e);
    }
  }

  // Salin teks caption ke clipboard jika belum atau sebagai teks utama
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    }
  } catch {
    // abaikan jika tidak diizinkan
  }

  // 2. Jika di smartphone / browser yang mendukung Web Share API beserta File Gambar (Standar WhatsApp Mobile)
  if (imageUrl) {
    try {
      const file = await getFileFromImageUrl(imageUrl, `agenda_${Date.now()}`);
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: title,
          text: text,
        });
        sharedViaNative = true;
        onToast('Foto yang disorot & caption siap dibagikan ke WhatsApp!');
        return;
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        // User menutup menu share
        return;
      }
      console.warn('File Web Share tidak berhasil:', e);
    }
  }

  // 3. Jika Web Share didukung untuk teks
  if (!sharedViaNative && navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: text,
      });
      sharedViaNative = true;
      onToast('Teks & foto disiapkan untuk dibagikan');
      return;
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
    }
  }

  // 4. Fallback jika dibuka di browser desktop tanpa native share:
  if (copiedImageSuccess) {
    onToast('Foto yang disorot & caption berhasil disalin! Tinggal tempel (Ctrl+V) di WhatsApp.');
  } else {
    onToast('Caption agenda/pengumuman berhasil disalin ke papan klip!');
  }
}
