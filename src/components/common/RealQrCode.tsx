import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface RealQrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export const RealQrCode: React.FC<RealQrCodeProps> = ({
  value,
  size = 160,
  className = '',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!value || !value.trim()) {
      setDataUrl('');
      return;
    }

    QRCode.toDataURL(value.trim(), {
      width: size * 2, // render high DPI
      margin: 1,
      color: {
        dark: '#0f172a', // slate-900
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        setDataUrl(url);
        setError(false);
      })
      .catch((err) => {
        console.warn('Gagal generate QR Code:', err);
        setError(true);
      });
  }, [value, size]);

  if (!value || !value.trim() || error) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs font-mono border border-slate-200 ${className}`}
      >
        QR Belum Tersedia
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 animate-pulse border border-slate-200 ${className}`}
      >
        <div className="w-5 h-5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-block rounded-xl overflow-hidden bg-white shadow-2xs ${className}`}
    >
      <img
        src={dataUrl}
        alt={`QR Code ${value}`}
        style={{ width: size, height: size }}
        className="w-full h-full object-contain pointer-events-none select-none"
      />
    </div>
  );
};
