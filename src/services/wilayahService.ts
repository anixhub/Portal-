import { REMBANG_DISTRICTS, REMBANG_VILLAGES_BY_DISTRICT } from '../data/rembangWilayahData';

export interface WilayahItem {
  id: string;
  name: string;
}

const cache = new Map<string, WilayahItem[]>();

// Convert ALL CAPS to Title Case for cleaner UI (e.g. "JAWA TIMUR" -> "Jawa Timur")
export const formatWilayahName = (name: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (word === 'dki' || word === 'diy') return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

// Configurable wilayah API endpoint (mendukung endpoint buatan sendiri atau default emsifa)
const DEFAULT_API_URL = 'https://www.emsifa.com/api-wilayah-indonesia/api';
const BASE_URL = (import.meta.env.VITE_WILAYAH_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');

// Comprehensive Fallback Provinces
export const FALLBACK_PROVINCES: WilayahItem[] = [
  { id: '11', name: 'ACEH' },
  { id: '12', name: 'SUMATERA UTARA' },
  { id: '13', name: 'SUMATERA BARAT' },
  { id: '14', name: 'RIAU' },
  { id: '15', name: 'JAMBI' },
  { id: '16', name: 'SUMATERA SELATAN' },
  { id: '17', name: 'BENGKULU' },
  { id: '18', name: 'LAMPUNG' },
  { id: '19', name: 'KEPULAUAN BANGKA BELITUNG' },
  { id: '21', name: 'KEPULAUAN RIAU' },
  { id: '31', name: 'DKI JAKARTA' },
  { id: '32', name: 'JAWA BARAT' },
  { id: '33', name: 'JAWA TENGAH' },
  { id: '34', name: 'DI YOGYAKARTA' },
  { id: '35', name: 'JAWA TIMUR' },
  { id: '36', name: 'BANTEN' },
  { id: '51', name: 'BALI' },
  { id: '52', name: 'NUSA TENGGARA BARAT' },
  { id: '53', name: 'NUSA TENGGARA TIMUR' },
  { id: '61', name: 'KALIMANTAN BARAT' },
  { id: '62', name: 'KALIMANTAN TENGAH' },
  { id: '63', name: 'KALIMANTAN SELATAN' },
  { id: '64', name: 'KALIMANTAN TIMUR' },
  { id: '65', name: 'KALIMANTAN UTARA' },
  { id: '71', name: 'SULAWESI UTARA' },
  { id: '72', name: 'SULAWESI TENGAH' },
  { id: '73', name: 'SULAWESI SELATAN' },
  { id: '74', name: 'SULAWESI TENGGARA' },
  { id: '75', name: 'GORONTALO' },
  { id: '76', name: 'SULAWESI BARAT' },
  { id: '81', name: 'MALUKU' },
  { id: '82', name: 'MALUKU UTARA' },
  { id: '91', name: 'PAPUA BARAT' },
  { id: '94', name: 'PAPUA' }
];

// Fallback Regencies for major provinces to ensure 100% instant display even if network is restricted
export const FALLBACK_REGENCIES: Record<string, WilayahItem[]> = {
  // Jawa Timur (35)
  '35': [
    { id: '3501', name: 'KABUPATEN PACITAN' },
    { id: '3502', name: 'KABUPATEN PONOROGO' },
    { id: '3503', name: 'KABUPATEN TRENGGALEK' },
    { id: '3504', name: 'KABUPATEN TULUNGAGUNG' },
    { id: '3505', name: 'KABUPATEN BLITAR' },
    { id: '3506', name: 'KABUPATEN KEDIRI' },
    { id: '3507', name: 'KABUPATEN MALANG' },
    { id: '3508', name: 'KABUPATEN LUMAJANG' },
    { id: '3509', name: 'KABUPATEN JEMBER' },
    { id: '3510', name: 'KABUPATEN BANYUWANGI' },
    { id: '3511', name: 'KABUPATEN BONDOWOSO' },
    { id: '3512', name: 'KABUPATEN SITUBONDO' },
    { id: '3513', name: 'KABUPATEN PROBOLINGGO' },
    { id: '3514', name: 'KABUPATEN PASURUAN' },
    { id: '3515', name: 'KABUPATEN SIDOARJO' },
    { id: '3516', name: 'KABUPATEN MOJOKERTO' },
    { id: '3517', name: 'KABUPATEN JOMBANG' },
    { id: '3518', name: 'KABUPATEN NGANJUK' },
    { id: '3519', name: 'KABUPATEN MADIUN' },
    { id: '3520', name: 'KABUPATEN MAGETAN' },
    { id: '3521', name: 'KABUPATEN NGAWI' },
    { id: '3522', name: 'KABUPATEN BOJONEGORO' },
    { id: '3523', name: 'KABUPATEN TUBAN' },
    { id: '3524', name: 'KABUPATEN LAMONGAN' },
    { id: '3525', name: 'KABUPATEN GRESIK' },
    { id: '3526', name: 'KABUPATEN BANGKALAN' },
    { id: '3527', name: 'KABUPATEN SAMPANG' },
    { id: '3528', name: 'KABUPATEN PAMEKASAN' },
    { id: '3529', name: 'KABUPATEN SUMENEP' },
    { id: '3571', name: 'KOTA KEDIRI' },
    { id: '3572', name: 'KOTA BLITAR' },
    { id: '3573', name: 'KOTA MALANG' },
    { id: '3574', name: 'KOTA PROBOLINGGO' },
    { id: '3575', name: 'KOTA PASURUAN' },
    { id: '3576', name: 'KOTA MOJOKERTO' },
    { id: '3577', name: 'KOTA MADIUN' },
    { id: '3578', name: 'KOTA SURABAYA' },
    { id: '3579', name: 'KOTA BATU' },
  ],
  // DKI Jakarta (31)
  '31': [
    { id: '3101', name: 'KABUPATEN KEPULAUAN SERIBU' },
    { id: '3171', name: 'KOTA JAKARTA SELATAN' },
    { id: '3172', name: 'KOTA JAKARTA TIMUR' },
    { id: '3173', name: 'KOTA JAKARTA PUSAT' },
    { id: '3174', name: 'KOTA JAKARTA BARAT' },
    { id: '3175', name: 'KOTA JAKARTA UTARA' },
  ],
  // Jawa Tengah (33)
  '33': [
    { id: '3301', name: 'KABUPATEN CILACAP' },
    { id: '3302', name: 'KABUPATEN BANYUMAS' },
    { id: '3303', name: 'KABUPATEN PURBALINGGA' },
    { id: '3304', name: 'KABUPATEN BANJARNEGARA' },
    { id: '3305', name: 'KABUPATEN KEBUMEN' },
    { id: '3306', name: 'KABUPATEN PURWOREJO' },
    { id: '3307', name: 'KABUPATEN WONOSOBO' },
    { id: '3308', name: 'KABUPATEN MAGELANG' },
    { id: '3309', name: 'KABUPATEN BOYOLALI' },
    { id: '3310', name: 'KABUPATEN KLATEN' },
    { id: '3311', name: 'KABUPATEN SUKOHARJO' },
    { id: '3312', name: 'KABUPATEN WONOGIRI' },
    { id: '3313', name: 'KABUPATEN KARANGANYAR' },
    { id: '3314', name: 'KABUPATEN SRAGEN' },
    { id: '3315', name: 'KABUPATEN GROBOGAN' },
    { id: '3316', name: 'KABUPATEN BLORA' },
    { id: '3317', name: 'KABUPATEN REMBANG' },
    { id: '3318', name: 'KABUPATEN PATI' },
    { id: '3319', name: 'KABUPATEN KUDUS' },
    { id: '3320', name: 'KABUPATEN JEPARA' },
    { id: '3321', name: 'KABUPATEN DEMAK' },
    { id: '3322', name: 'KABUPATEN SEMARANG' },
    { id: '3323', name: 'KABUPATEN TEMANGGUNG' },
    { id: '3324', name: 'KABUPATEN KENDAL' },
    { id: '3325', name: 'KABUPATEN BATANG' },
    { id: '3326', name: 'KABUPATEN PEKALONGAN' },
    { id: '3327', name: 'KABUPATEN PEMALANG' },
    { id: '3328', name: 'KABUPATEN TEGAL' },
    { id: '3329', name: 'KABUPATEN BREBES' },
    { id: '3371', name: 'KOTA MAGELANG' },
    { id: '3372', name: 'KOTA SURAKARTA' },
    { id: '3373', name: 'KOTA SALATIGA' },
    { id: '3374', name: 'KOTA SEMARANG' },
    { id: '3375', name: 'KOTA PEKALONGAN' },
    { id: '3376', name: 'KOTA TEGAL' },
  ],
  // Jawa Barat (32)
  '32': [
    { id: '3201', name: 'KABUPATEN BOGOR' },
    { id: '3202', name: 'KABUPATEN SUKABUMI' },
    { id: '3203', name: 'KABUPATEN CIANJUR' },
    { id: '3204', name: 'KABUPATEN BANDUNG' },
    { id: '3205', name: 'KABUPATEN GARUT' },
    { id: '3206', name: 'KABUPATEN TASIKMALAYA' },
    { id: '3207', name: 'KABUPATEN CIAMIS' },
    { id: '3208', name: 'KABUPATEN KUNINGAN' },
    { id: '3209', name: 'KABUPATEN CIREBON' },
    { id: '3210', name: 'KABUPATEN MAJALENGKA' },
    { id: '3211', name: 'KABUPATEN SUMEDANG' },
    { id: '3212', name: 'KABUPATEN INDRAMAYU' },
    { id: '3213', name: 'KABUPATEN SUBANG' },
    { id: '3214', name: 'KABUPATEN PURWAKARTA' },
    { id: '3215', name: 'KABUPATEN KARAWANG' },
    { id: '3216', name: 'KABUPATEN BEKASI' },
    { id: '3217', name: 'KABUPATEN BANDUNG BARAT' },
    { id: '3218', name: 'KABUPATEN PANGANDARAN' },
    { id: '3271', name: 'KOTA BOGOR' },
    { id: '3272', name: 'KOTA SUKABUMI' },
    { id: '3273', name: 'KOTA BANDUNG' },
    { id: '3274', name: 'KOTA CIREBON' },
    { id: '3275', name: 'KOTA BEKASI' },
    { id: '3276', name: 'KOTA DEPOK' },
    { id: '3277', name: 'KOTA CIMAHI' },
    { id: '3278', name: 'KOTA TASIKMALAYA' },
    { id: '3279', name: 'KOTA BANJAR' },
  ],
  // DI Yogyakarta (34)
  '34': [
    { id: '3401', name: 'KABUPATEN KULON PROGO' },
    { id: '3402', name: 'KABUPATEN BANTUL' },
    { id: '3403', name: 'KABUPATEN GUNUNGKIDUL' },
    { id: '3404', name: 'KABUPATEN SLEMAN' },
    { id: '3471', name: 'KOTA YOGYAKARTA' },
  ],
  // Banten (36)
  '36': [
    { id: '3601', name: 'KABUPATEN PANDEGLANG' },
    { id: '3602', name: 'KABUPATEN LEBAK' },
    { id: '3603', name: 'KABUPATEN TANGERANG' },
    { id: '3604', name: 'KABUPATEN SERANG' },
    { id: '3671', name: 'KOTA TANGERANG' },
    { id: '3672', name: 'KOTA CILEGON' },
    { id: '3673', name: 'KOTA SERANG' },
    { id: '3674', name: 'KOTA TANGERANG SELATAN' },
  ]
};

// Fallback Districts for Kota Malang (3573) and Kabupaten Malang (3507)
export const FALLBACK_DISTRICTS: Record<string, WilayahItem[]> = {
  '3573': [ // Kota Malang
    { id: '3573010', name: 'KEDUNGKANDANG' },
    { id: '3573020', name: 'SUKUN' },
    { id: '3573030', name: 'KLOJEN' },
    { id: '3573040', name: 'BLIMBING' },
    { id: '3573050', name: 'LOWOKWARU' }
  ],
  '3507': [ // Kab Malang
    { id: '3507010', name: 'DONOMULYO' },
    { id: '3507020', name: 'KALIPARE' },
    { id: '3507030', name: 'PAGELARAN' },
    { id: '3507040', name: 'BANTUR' },
    { id: '3507050', name: 'GEDANGAN' },
    { id: '3507060', name: 'SUMBERMANJING WETAN' },
    { id: '3507070', name: 'DAMPIT' },
    { id: '3507080', name: 'TIRTOYUDO' },
    { id: '3507090', name: 'AMPELGADING' },
    { id: '3507100', name: 'PONCOKUSUMO' },
    { id: '3507110', name: 'WAJAK' },
    { id: '3507120', name: 'TUREN' },
    { id: '3507130', name: 'BULULAWANG' },
    { id: '3507140', name: 'GONDANGLEGI' },
    { id: '3507150', name: 'KEPANJEN' },
    { id: '3507160', name: 'KROMENGAN' },
    { id: '3507170', name: 'NGAJUM' },
    { id: '3507180', name: 'WONOSARI' },
    { id: '3507190', name: 'WAGIR' },
    { id: '3507200', name: 'PAKISAJI' },
    { id: '3507210', name: 'TAJINAN' },
    { id: '3507220', name: 'TUMPANG' },
    { id: '3507230', name: 'JABUNG' },
    { id: '3507240', name: 'PAKIS' },
    { id: '3507250', name: 'SINGOSARI' },
    { id: '3507260', name: 'KARANGPLOSO' },
    { id: '3507270', name: 'DAU' },
    { id: '3507280', name: 'PUJON' },
    { id: '3507290', name: 'NGANTANG' },
    { id: '3507300', name: 'KASEMBON' },
    { id: '3507310', name: 'PAGAK' },
    { id: '3507320', name: 'SUMBERPUCUNG' },
    { id: '3507330', name: 'LAWANG' }
  ],
  // Kabupaten Rembang (3317) - 14 Kecamatan Lengkap
  '3317': REMBANG_DISTRICTS
};

// Fallback Villages for Klojen (3573030), Sumber (3317010), Sedan (3317060), and all Rembang districts
export const FALLBACK_VILLAGES: Record<string, WilayahItem[]> = {
  '3573030': [ // Klojen, Kota Malang
    { id: '3573030001', name: 'KASIN' },
    { id: '3573030002', name: 'SUKOHARJO' },
    { id: '3573030003', name: 'KIDUL DALEM' },
    { id: '3573030004', name: 'KAUMAN' },
    { id: '3573030005', name: 'BARENG' },
    { id: '3573030006', name: 'GADING KASRI' },
    { id: '3573030007', name: 'ORO-ORO DOWO' },
    { id: '3573030008', name: 'RAMPAL CELAKET' },
    { id: '3573030009', name: 'SAMAAN' },
    { id: '3573030010', name: 'PENANGGUNGAN' },
    { id: '3573030011', name: 'KLOJEN' }
  ],
  // Seluruh desa dari 14 kecamatan di Kabupaten Rembang (termasuk Sedan dan Sumber)
  ...REMBANG_VILLAGES_BY_DISTRICT
};

// Daftar desa yang sering tertinggal di endpoint EMSIFA agar otomatis ditambahkan ke dropdown
const KNOWN_EXTRA_VILLAGES: Record<string, WilayahItem[]> = {
  // Sumber, Kab Rembang (emsifa melewatkan Kedungtulup, Sumber, dan Megulung)
  '3317010': [
    { id: '3317010006', name: 'KEDUNGTULUP' },
    { id: '3317010009', name: 'SUMBER' },
    { id: '3317010016', name: 'MEGULUNG' }
  ],
  '33.17.01': [
    { id: '33.17.01.2006', name: 'Kedungtulup' },
    { id: '33.17.01.2009', name: 'Sumber' },
    { id: '33.17.01.2016', name: 'Megulung' }
  ]
};

// Clean prefixes and punctuation for resilient matching
export const cleanWilayahName = (name: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/^(provinsi|prov\.|daerah khusus ibukota|daerah istimewa|dki|di)\s+/i, '')
    .replace(/^(kabupaten|kota administrasi|kota adm\.|kota|kab\.|kot\.)\s+/i, '')
    .replace(/^(kecamatan|kec\.)\s+/i, '')
    .replace(/^(desa|kelurahan|ds\.|kel\.)\s+/i, '')
    .trim();
};

export const normalizeProvinceName = (prov: string): string => {
  if (!prov) return '';
  const p = prov.trim().toUpperCase();
  if (p === 'JATENG') return 'JAWA TENGAH';
  if (p === 'JATIM') return 'JAWA TIMUR';
  if (p === 'JABAR') return 'JAWA BARAT';
  if (p === 'DKI' || p === 'JAKARTA') return 'DKI JAKARTA';
  if (p === 'DIY' || p === 'JOGJA' || p === 'YOGYAKARTA') return 'DI YOGYAKARTA';
  if (p === 'BANTEN') return 'BANTEN';
  if (p === 'BALI') return 'BALI';
  if (p === 'SUMUT') return 'SUMATERA UTARA';
  if (p === 'SUMBAR') return 'SUMATERA BARAT';
  if (p === 'SUMSEL') return 'SUMATERA SELATAN';
  if (p === 'LAMPUNG') return 'LAMPUNG';
  if (p === 'ACEH') return 'ACEH';
  if (p === 'RIAU') return 'RIAU';
  if (p === 'JAMBI') return 'JAMBI';
  return prov;
};

export interface ResolvedLocation {
  provId: string;
  provName: string;
  regId: string;
  regName: string;
  distId: string;
  distName: string;
}

export const resolveLocationHierarchy = (
  rawProv?: string,
  rawCity?: string,
  rawKec?: string
): ResolvedLocation => {
  let provId = '';
  let provName = '';
  let regId = '';
  let regName = '';
  let distId = '';
  let distName = '';

  const cleanProv = cleanWilayahName(normalizeProvinceName(rawProv || ''));
  const cleanCity = cleanWilayahName(rawCity || '');
  const cleanKec = cleanWilayahName(rawKec || '');

  // 1. Try to match province directly
  if (cleanProv) {
    const provMatch = FALLBACK_PROVINCES.find(
      p => cleanWilayahName(p.name) === cleanProv || cleanWilayahName(p.name).includes(cleanProv)
    );
    if (provMatch) {
      provId = provMatch.id;
      provName = formatWilayahName(provMatch.name);
    }
  }

  // 2. If province not found or empty, search city across known provinces
  if (!provId && cleanCity) {
    for (const [pId, regList] of Object.entries(FALLBACK_REGENCIES)) {
      const regMatch = regList.find(r => {
        const cName = cleanWilayahName(r.name);
        return cName === cleanCity || cName.includes(cleanCity) || cleanCity.includes(cName);
      });
      if (regMatch) {
        provId = pId;
        const pObj = FALLBACK_PROVINCES.find(p => p.id === pId);
        provName = pObj ? formatWilayahName(pObj.name) : '';
        regId = regMatch.id;
        regName = formatWilayahName(regMatch.name);
        break;
      }
    }
  }

  // 3. If province still not found, check if kecamatan belongs to known district
  if (!provId && cleanKec) {
    for (const [rId, distList] of Object.entries(FALLBACK_DISTRICTS)) {
      const distMatch = distList.find(d => {
        const dName = cleanWilayahName(d.name);
        return dName === cleanKec || dName.includes(cleanKec) || cleanKec.includes(dName);
      });
      if (distMatch) {
        for (const [pId, regList] of Object.entries(FALLBACK_REGENCIES)) {
          const rObj = regList.find(r => r.id === rId);
          if (rObj) {
            provId = pId;
            const pObj = FALLBACK_PROVINCES.find(p => p.id === pId);
            provName = pObj ? formatWilayahName(pObj.name) : '';
            regId = rId;
            regName = formatWilayahName(rObj.name);
            distId = distMatch.id;
            distName = formatWilayahName(distMatch.name);
            break;
          }
        }
        if (provId) break;
      }
    }
  }

  // 4. If provId is found, but regId is still not found, search city in that province
  if (provId && !regId && cleanCity) {
    const regList = FALLBACK_REGENCIES[provId] || [];
    const regMatch = regList.find(r => {
      const cName = cleanWilayahName(r.name);
      return cName === cleanCity || cName.includes(cleanCity) || cleanCity.includes(cName);
    });
    if (regMatch) {
      regId = regMatch.id;
      regName = formatWilayahName(regMatch.name);
    }
  }

  // 5. If regId is found, but distId is still not found, search kecamatan in that regency
  if (regId && !distId && cleanKec) {
    const distList = FALLBACK_DISTRICTS[regId] || [];
    const distMatch = distList.find(d => {
      const dName = cleanWilayahName(d.name);
      return dName === cleanKec || dName.includes(cleanKec) || cleanKec.includes(dName);
    });
    if (distMatch) {
      distId = distMatch.id;
      distName = formatWilayahName(distMatch.name);
    }
  }

  return { provId, provName, regId, regName, distId, distName };
};

// Helper untuk normalisasi item dari berbagai format API (emsifa [{id, name}], wilayah.id {data: [{code, name}]})
const normalizeItems = (raw: any): WilayahItem[] => {
  const arr = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
  return arr.map((item: any) => ({
    id: String(item.id || item.code || ''),
    name: String(item.name || '')
  }));
};

export const fetchProvinces = async (): Promise<WilayahItem[]> => {
  if (cache.has('provinces')) {
    return cache.get('provinces')!;
  }
  try {
    let res = await fetch('/api/wilayah/provinces').catch(() => null);
    if (!res || !res.ok) {
      res = await fetch(`${BASE_URL}/provinces.json`);
    }
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const raw = await res.json();
    const data = normalizeItems(raw);
    if (data.length > 0) {
      cache.set('provinces', data);
      return data;
    }
    throw new Error('Empty data');
  } catch (err) {
    console.warn('Using fallback provinces:', err);
    cache.set('provinces', FALLBACK_PROVINCES);
    return FALLBACK_PROVINCES;
  }
};

export const fetchRegencies = async (provinceId: string): Promise<WilayahItem[]> => {
  if (!provinceId) return [];
  const cacheKey = `regencies_${provinceId}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }
  try {
    let res = await fetch(`/api/wilayah/regencies/${provinceId}`).catch(() => null);
    if (!res || !res.ok) {
      res = await fetch(`${BASE_URL}/regencies/${provinceId}.json`);
    }
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const raw = await res.json();
    const data = normalizeItems(raw);
    if (data.length > 0) {
      cache.set(cacheKey, data);
      return data;
    }
    throw new Error('Empty data');
  } catch (err) {
    console.warn(`Falling back for regencies in ${provinceId}:`, err);
    const fallback = FALLBACK_REGENCIES[provinceId] || [];
    cache.set(cacheKey, fallback);
    return fallback;
  }
};

export const fetchDistricts = async (regencyId: string): Promise<WilayahItem[]> => {
  if (!regencyId) return [];
  const cacheKey = `districts_${regencyId}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  // Cek fallback lokal Rembang terlebih dahulu untuk kecepatan instan
  if (FALLBACK_DISTRICTS[regencyId] && FALLBACK_DISTRICTS[regencyId].length > 0) {
    const local = FALLBACK_DISTRICTS[regencyId];
    cache.set(cacheKey, local);
    return local;
  }

  try {
    let res = await fetch(`/api/wilayah/districts/${regencyId}`).catch(() => null);
    if (!res || !res.ok) {
      res = await fetch(`${BASE_URL}/districts/${regencyId}.json`);
    }
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const raw = await res.json();
    const data = normalizeItems(raw);
    if (data.length > 0) {
      cache.set(cacheKey, data);
      return data;
    }
    throw new Error('Empty data');
  } catch (err) {
    console.warn(`Falling back for districts in ${regencyId}:`, err);
    const fallback = FALLBACK_DISTRICTS[regencyId] || [];
    cache.set(cacheKey, fallback);
    return fallback;
  }
};

export const fetchVillages = async (districtId: string): Promise<WilayahItem[]> => {
  if (!districtId) return [];
  const cacheKey = `villages_${districtId}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  // Cek fallback lokal terlebih dahulu (terutama Sedan 3317060 dan Sumber 3317010)
  if (FALLBACK_VILLAGES[districtId] && FALLBACK_VILLAGES[districtId].length > 0) {
    const local = FALLBACK_VILLAGES[districtId];
    cache.set(cacheKey, local);
    return local;
  }

  try {
    let res = await fetch(`/api/wilayah/villages/${districtId}`).catch(() => null);
    if (!res || !res.ok) {
      res = await fetch(`${BASE_URL}/villages/${districtId}.json`);
    }
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const raw = await res.json();
    const data = normalizeItems(raw);
    if (data.length > 0) {
      // Lengkapi desa yang hilang dari emsifa jika ada
      const extra = KNOWN_EXTRA_VILLAGES[districtId] || [];
      for (const item of extra) {
        const alreadyExists = data.some(
          d => d.name.toLowerCase() === item.name.toLowerCase() ||
               d.id === item.id
        );
        if (!alreadyExists) {
          data.push(item);
        }
      }
      data.sort((a, b) => a.name.localeCompare(b.name));

      cache.set(cacheKey, data);
      return data;
    }
    throw new Error('Empty data');
  } catch (err) {
    console.warn(`Falling back for villages in ${districtId}:`, err);
    const fallback = FALLBACK_VILLAGES[districtId] || [];
    cache.set(cacheKey, fallback);
    return fallback;
  }
};

export interface ReverseGeocodeResult {
  state: string;
  city: string;
  subdistrict: string;
  village: string;
  road: string;
  displayName: string;
}

export const reverseGeocodeLocation = async (lat: number, lng: number): Promise<ReverseGeocodeResult> => {
  // 1. Coba lewat proxy internal server (/api/wilayah/reverse-geocode)
  try {
    const res = await fetch(`/api/wilayah/reverse-geocode?lat=${lat}&lng=${lng}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && (data.state || data.city || data.subdistrict || data.village)) {
        return {
          state: data.state || '',
          city: data.city || '',
          subdistrict: data.subdistrict || '',
          village: data.village || '',
          road: data.road || '',
          displayName: data.displayName || '',
        };
      }
    }
  } catch (err) {
    // Fallback ke direct client-side fetch jika server proxy offline
  }

  // 2. Direct client-side fetch multi-zoom ke Nominatim OpenStreetMap
  const headers = { 'Accept-Language': 'id' };
  let prov = '';
  let reg = '';
  let kec = '';
  let desa = '';
  let road = '';
  let displayName = '';

  try {
    // Zoom 18: tingkat jalan, nomor rumah, desa / kelurahan
    const res18 = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers, signal: AbortSignal.timeout(6000) }
    );
    if (res18.ok) {
      const d18 = await res18.json();
      displayName = d18?.display_name || '';
      const a18 = d18?.address || {};
      prov = a18.state || a18.province || a18.region || '';
      reg = a18.county || (a18.city && !a18.county ? a18.city : '') || a18.state_district || a18.city || '';
      kec = a18.subdistrict || a18.district || a18.city_district || a18.town || a18.municipality || '';
      desa = a18.village || a18.suburb || a18.hamlet || a18.quarter || a18.neighbourhood || a18.locality || '';
      road = a18.road || a18.street || a18.pedestrian || a18.path || '';
    }
  } catch (e) {
    console.warn('Direct Nominatim z18 error:', e);
  }

  // Jika kecamatan atau kabupaten belum lengkap, coba zoom 14 untuk kecamatan
  if (!kec || !reg) {
    try {
      const res14 = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
        { headers, signal: AbortSignal.timeout(4000) }
      );
      if (res14.ok) {
        const d14 = await res14.json();
        const a14 = d14?.address || {};
        if (!prov) prov = a14.state || a14.province || '';
        if (!reg) reg = a14.county || a14.city || a14.state_district || '';
        if (!kec) kec = a14.town || a14.district || a14.city_district || a14.subdistrict || a14.municipality || '';
        if (!desa) desa = a14.village || a14.suburb || a14.hamlet || '';
      }
    } catch (e) {}
  }

  // Jika kecamatan masih kosong, coba zoom 12
  if (!kec) {
    try {
      const res12 = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=12&addressdetails=1`,
        { headers, signal: AbortSignal.timeout(3000) }
      );
      if (res12.ok) {
        const d12 = await res12.json();
        const a12 = d12?.address || {};
        if (!kec) kec = a12.town || a12.district || a12.city_district || a12.subdistrict || a12.municipality || '';
      }
    } catch (e) {}
  }

  // Deteksi tambahan khusus jika kabupaten Rembang dan desa diketahui tetapi kecamatan belum terisi
  if (desa && !kec) {
    const cleanDesa = cleanWilayahName(desa);
    for (const [distId, vList] of Object.entries(FALLBACK_VILLAGES)) {
      if (vList.some(v => cleanWilayahName(v.name) === cleanDesa)) {
        // Cari nama kecamatan dari FALLBACK_DISTRICTS
        for (const dList of Object.values(FALLBACK_DISTRICTS)) {
          const matchedD = dList.find(d => d.id === distId);
          if (matchedD) {
            kec = matchedD.name;
            if (!reg) reg = 'KABUPATEN REMBANG';
            if (!prov) prov = 'JAWA TENGAH';
            break;
          }
        }
        if (kec) break;
      }
    }
  }

  return {
    state: prov,
    city: reg,
    subdistrict: kec,
    village: desa,
    road,
    displayName,
  };
};
