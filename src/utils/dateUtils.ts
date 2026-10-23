/**
 * Utilitas format penanggalan seragam seluruh aplikasi: DD-MM-YYYY
 */

const indonesianMonthMap: Record<string, string> = {
  januari: '01', jan: '01',
  februari: '02', feb: '02',
  maret: '03', mar: '03',
  april: '04', apr: '04',
  mei: '05', may: '05',
  juni: '06', jun: '06',
  juli: '07', jul: '07',
  agustus: '08', agu: '08', ags: '08', aug: '08',
  september: '09', sep: '09',
  oktober: '10', okt: '10', oct: '10',
  november: '11', nov: '11',
  desember: '12', des: '12', dec: '12',
};

/**
 * Mengubah sembarang format tanggal menjadi format standar DD-MM-YYYY
 * Contoh:
 * - "2026-11-20" -> "20-11-2026"
 * - "20 November 2026" -> "20-11-2026"
 * - "2026-10-17 09:30:00" -> "17-10-2026"
 * - Date object -> "17-10-2026"
 */
export function formatToDDMMYYYY(dateInput: any): string {
  if (!dateInput) return '';
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed || trimmed === '-' || trimmed.toLowerCase() === 'belum ditentukan') {
      return trimmed;
    }

    // Pola 1: Sudah DD-MM-YYYY
    const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (ddmmyyyyMatch) {
      const d = ddmmyyyyMatch[1].padStart(2, '0');
      const m = ddmmyyyyMatch[2].padStart(2, '0');
      const y = ddmmyyyyMatch[3];
      return `${d}-${m}-${y}`;
    }

    // Pola 2: YYYY-MM-DD (ISO)
    const yyyymmddMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (yyyymmddMatch) {
      const y = yyyymmddMatch[1];
      const m = yyyymmddMatch[2].padStart(2, '0');
      const d = yyyymmddMatch[3].padStart(2, '0');
      return `${d}-${m}-${y}`;
    }

    // Pola 3: Teks Indonesia / Inggris, misal: "20 November 2026" atau "20 Nov 2026"
    const textParts = trimmed.split(/\s+/);
    if (textParts.length >= 3) {
      const d = textParts[0].replace(/\D/g, '').padStart(2, '0');
      const mKey = textParts[1].toLowerCase().replace(/[^a-z]/g, '');
      const m = indonesianMonthMap[mKey];
      const y = textParts[2].replace(/\D/g, '');
      if (d && m && y && y.length === 4) {
        return `${d}-${m}-${y}`;
      }
    }

    // Coba Date parsing
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const d = String(parsed.getDate()).padStart(2, '0');
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const y = parsed.getFullYear();
      return `${d}-${m}-${y}`;
    }

    return trimmed;
  }

  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    const d = String(dateInput.getDate()).padStart(2, '0');
    const m = String(dateInput.getMonth() + 1).padStart(2, '0');
    const y = dateInput.getFullYear();
    return `${d}-${m}-${y}`;
  }

  return String(dateInput || '');
}

/**
 * Mengubah format DD-MM-YYYY atau teks ke format ISO (YYYY-MM-DD)
 * untuk digunakan pada HTML <input type="date"> atau DateWheelPicker
 */
export function parseDateToISO(str?: string | null): string {
  if (!str) return '';
  const trimmed = str.trim();

  // Sudah ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // DD-MM-YYYY
  const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (ddmmyyyyMatch) {
    const d = ddmmyyyyMatch[1].padStart(2, '0');
    const m = ddmmyyyyMatch[2].padStart(2, '0');
    const y = ddmmyyyyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // Teks "20 November 2026"
  const textParts = trimmed.split(/\s+/);
  if (textParts.length >= 3) {
    const d = textParts[0].replace(/\D/g, '').padStart(2, '0');
    const mKey = textParts[1].toLowerCase().replace(/[^a-z]/g, '');
    const m = indonesianMonthMap[mKey];
    const y = textParts[2].replace(/\D/g, '');
    if (d && m && y && y.length === 4) {
      return `${y}-${m}-${d}`;
    }
  }

  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  return '';
}

/**
 * Dapatkan tanggal hari ini dalam format DD-MM-YYYY
 */
export function getTodayDDMMYYYY(): string {
  return formatToDDMMYYYY(new Date());
}

/**
 * Menghitung jumlah hari maksimal pada bulan dan tahun tertentu
 */
export function getMaxDaysInMonth(month?: string | number, year?: string | number): number {
  const m = parseInt(String(month || ''), 10);
  if (!m || isNaN(m)) return 31;
  if ([4, 6, 9, 11].includes(m)) return 30;
  if (m === 2) {
    const y = parseInt(String(year || ''), 10);
    if (y && !isNaN(y)) {
      const isLeap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
      return isLeap ? 29 : 28;
    }
    return 29;
  }
  return 31;
}

/**
 * Format input tanggal (Hari):
 * - Saat ketik '0', jangan langsung jadi 1 (agar bisa ketik 01-09)
 * - Saat ketik angka 4 ke atas (4-9), otomatis jadi '04'-'09'
 * - Angka 1, 2, 3 dibiarkan satu digit agar user bisa mengetik digit kedua (misal: 15, 28, 31)
 * - Jika 2 digit, dibatasi maks hari pada bulan tersebut
 */
export function formatDayInput(raw: string, currentMonth?: string | number, currentYear?: string | number): string {
  const digits = raw.replace(/\D/g, '').slice(0, 2);
  if (!digits) return '';
  if (digits === '0') return '0';

  if (digits.length === 1) {
    const n = parseInt(digits, 10);
    if (n >= 4) {
      return `0${n}`;
    }
    return digits;
  }

  // 2 digit
  if (digits === '00') return '01';
  const num = parseInt(digits, 10);
  const maxDays = getMaxDaysInMonth(currentMonth, currentYear);
  const clamped = Math.max(1, Math.min(num, maxDays));
  return clamped < 10 ? `0${clamped}` : String(clamped);
}

/**
 * Format input bulan:
 * - Saat ketik '0', jangan langsung jadi 1 (agar bisa ketik 01-09)
 * - Saat ketik angka di atas 1 (2-9), otomatis jadi '02'-'09'
 * - Angka 1 dibiarkan satu digit agar user bisa mengetik digit kedua (10, 11, 12)
 * - Jika 2 digit, dibatasi antara 01 sampai 12
 */
export function formatMonthInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 2);
  if (!digits) return '';
  if (digits === '0') return '0';

  if (digits.length === 1) {
    const n = parseInt(digits, 10);
    if (n >= 2) {
      return `0${n}`;
    }
    return digits;
  }

// 2 digit
  if (digits === '00') return '01';
  const num = parseInt(digits, 10);
  const clamped = Math.max(1, Math.min(num, 12));
  return clamped < 10 ? `0${clamped}` : String(clamped);
}

/**
 * Normalisasi format tgl, bulan, tahun menjadi digit yang tepat:
 * - Hari harus 2 digit (misal: 01-31). Saat input kurang dari 2 digit, tambahkan 0 di depannya.
 * - Bulan harus 2 digit (misal: 01-12). Saat input kurang dari 2 digit, tambahkan 0 di depannya.
 * - Tahun harus 4 digit (misal: 2005). Saat input kurang dari 4 digit, tambahkan 0 di depannya.
 */
export function padDayInput(raw: string, currentMonth?: string | number, currentYear?: string | number): string {
  const digits = raw.replace(/\D/g, '').slice(0, 2);
  if (!digits) return '';
  const num = parseInt(digits, 10);
  if (isNaN(num) || num <= 0) return '01';
  const maxDays = getMaxDaysInMonth(currentMonth, currentYear);
  const clamped = Math.min(num, maxDays);
  return String(clamped).padStart(2, '0');
}

export function padMonthInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 2);
  if (!digits) return '';
  const num = parseInt(digits, 10);
  if (isNaN(num) || num <= 0) return '01';
  const clamped = Math.min(12, num);
  return String(clamped).padStart(2, '0');
}

export function padYearInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (!digits) return '';
  const num = parseInt(digits, 10);
  if (isNaN(num)) return '';
  return String(num).padStart(4, '0');
}

