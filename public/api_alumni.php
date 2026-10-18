<?php
/**
 * REST API Jembatan Portal Alumni Ponpes At-Taroqqy
 * Website: https://attaroqqy.com
 * Database: u648273511_attaroqqy
 * Tabel: santri
 * Status Keanggotaan: 'Alumni' (dengan A kapital)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-KEY');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Cache-Control: post-check=0, pre-check=0', false);
header('Pragma: no-cache');
header('Expires: 0');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ==========================================
// KONFIGURASI DATABASE MYSQL HOSTINGER
// ==========================================
$db_host = 'localhost';
$db_name = 'u648273511_attaroqqy';
$db_user = 'u648273511_attaroqqy';
$db_pass = '199722Attar@';

try {
    $pdo = new PDO("mysql:host={$db_host};dbname={$db_name};charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Koneksi database gagal: ' . $e->getMessage()
    ]);
    exit;
}

$action = $_GET['action'] ?? 'get_alumni';

// ==========================================
// FUNGSI BANTUAN NORMALISASI, GENDER & TABEL
// ==========================================
function ensureTablesExist($pdo) {
    static $checked = false;
    if ($checked) return;
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS events (
                id VARCHAR(64) NOT NULL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                date VARCHAR(80) NOT NULL,
                time VARCHAR(80) DEFAULT NULL,
                location VARCHAR(255) NOT NULL,
                category VARCHAR(50) NOT NULL DEFAULT 'reuni',
                description TEXT DEFAULT NULL,
                poster_url TEXT DEFAULT NULL,
                images LONGTEXT DEFAULT NULL,
                author_name VARCHAR(150) DEFAULT NULL,
                author_handle VARCHAR(80) DEFAULT NULL,
                author_avatar TEXT DEFAULT NULL,
                target_gender VARCHAR(20) DEFAULT 'semua',
                target_region_scope VARCHAR(20) DEFAULT 'semua',
                target_province_name VARCHAR(80) DEFAULT NULL,
                target_regency_name VARCHAR(80) DEFAULT NULL,
                target_district_name VARCHAR(80) DEFAULT NULL,
                target_village_name VARCHAR(80) DEFAULT NULL,
                attendees_count INT(11) DEFAULT 0,
                absent_count INT(11) DEFAULT 0,
                posted_at VARCHAR(80) DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS announcements (
                id VARCHAR(64) NOT NULL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                date VARCHAR(80) NOT NULL,
                category VARCHAR(50) NOT NULL DEFAULT 'maklumat',
                content LONGTEXT NOT NULL,
                author_name VARCHAR(150) NOT NULL,
                author_handle VARCHAR(80) DEFAULT NULL,
                author_avatar TEXT DEFAULT NULL,
                author_role VARCHAR(150) DEFAULT NULL,
                is_important TINYINT(1) DEFAULT 0,
                images LONGTEXT DEFAULT NULL,
                target_gender VARCHAR(20) DEFAULT 'semua',
                target_region_scope VARCHAR(20) DEFAULT 'semua',
                target_province_name VARCHAR(80) DEFAULT NULL,
                target_regency_name VARCHAR(80) DEFAULT NULL,
                target_district_name VARCHAR(80) DEFAULT NULL,
                target_village_name VARCHAR(80) DEFAULT NULL,
                likes_count INT(11) DEFAULT 0,
                comments_count INT(11) DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS event_rsvps (
                id VARCHAR(64) NOT NULL PRIMARY KEY,
                event_id VARCHAR(64) NOT NULL,
                alumni_id VARCHAR(64) NOT NULL,
                status VARCHAR(30) NOT NULL DEFAULT 'hadir',
                note TEXT DEFAULT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uk_event_alumni (event_id, alumni_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS admin_users (
                id VARCHAR(64) NOT NULL PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                username VARCHAR(80) NOT NULL UNIQUE,
                email VARCHAR(120) DEFAULT NULL,
                password VARCHAR(255) NOT NULL DEFAULT '1997',
                role VARCHAR(50) NOT NULL DEFAULT 'pengurus_pondok',
                jabatan VARCHAR(150) NOT NULL DEFAULT 'Pengurus Ikatan Alumni',
                region_level VARCHAR(50) NOT NULL DEFAULT 'pusat',
                avatar TEXT DEFAULT NULL,
                cover_photo_url TEXT DEFAULT NULL,
                bio TEXT DEFAULT NULL,
                phone VARCHAR(30) DEFAULT NULL,
                province VARCHAR(80) DEFAULT 'Jawa Timur',
                city VARCHAR(80) DEFAULT NULL,
                kecamatan VARCHAR(80) DEFAULT NULL,
                desa VARCHAR(80) DEFAULT NULL,
                alamat_lengkap TEXT DEFAULT NULL,
                latitude DECIMAL(10, 8) DEFAULT NULL,
                longitude DECIMAL(11, 8) DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS post_comments (
                id VARCHAR(64) NOT NULL PRIMARY KEY,
                post_type ENUM('event', 'announcement') NOT NULL DEFAULT 'event',
                post_id VARCHAR(64) NOT NULL,
                parent_comment_id VARCHAR(64) DEFAULT NULL,
                author_id VARCHAR(64) DEFAULT NULL,
                author_name VARCHAR(150) NOT NULL,
                author_handle VARCHAR(80) DEFAULT NULL,
                author_avatar TEXT DEFAULT NULL,
                avatar_ring TINYINT(1) DEFAULT 0,
                status ENUM('hadir', 'tidak_hadir', 'netral') DEFAULT 'netral',
                content TEXT NOT NULL,
                likes_count INT(11) DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS user_quran_bookmarks (
                user_id VARCHAR(64) NOT NULL PRIMARY KEY,
                surah_id INT(11) NOT NULL,
                verse_number INT(11) NOT NULL,
                page_number INT(11) DEFAULT 1,
                bookmarks_json LONGTEXT DEFAULT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");
        // Ensure columns in events and announcements can hold large images if created as TEXT earlier
        try {
            $pdo->exec("ALTER TABLE events MODIFY COLUMN poster_url LONGTEXT DEFAULT NULL;");
            $pdo->exec("ALTER TABLE events MODIFY COLUMN images LONGTEXT DEFAULT NULL;");
            $pdo->exec("ALTER TABLE announcements MODIFY COLUMN images LONGTEXT DEFAULT NULL;");
        } catch (Exception $alterEx) {
            // Already altered or non-fatal
        }

        $checked = true;
    } catch (Exception $e) {
        // Silent catch
    }
}

/**
 * Normalisasi Jenis Kelamin (Gender)
 * PENTING: Jangan memakai stripos($raw, 'p') === 0 karena "Putra" dan "Pria" juga diawali huruf P!
 */
function parseSantriGender($raw) {
    if (empty($raw)) return 'L';
    $raw = strtolower(trim((string)$raw));
    
    // Indikator Laki-laki / Putra / Pria
    $isPutra = (
        $raw === 'l' ||
        $raw === '1' ||
        $raw === 'putra' ||
        $raw === 'pria' ||
        $raw === 'laki-laki' ||
        $raw === 'laki' ||
        $raw === 'ikhwan' ||
        $raw === 'male' ||
        strpos($raw, 'putra') !== false ||
        strpos($raw, 'pria') !== false ||
        strpos($raw, 'laki') !== false
    );
    
    // Indikator Perempuan / Putri / Wanita
    $isPutri = (
        $raw === 'p' ||
        $raw === '2' ||
        $raw === 'putri' ||
        $raw === 'wanita' ||
        $raw === 'perempuan' ||
        $raw === 'akhwat' ||
        $raw === 'female' ||
        strpos($raw, 'putri') !== false ||
        strpos($raw, 'wanita') !== false ||
        strpos($raw, 'perem') !== false
    );

    if ($isPutri && !$isPutra) {
        return 'P';
    }
    return 'L';
}

function normalizePhotoUrlForOutput($path) {
    if (empty($path)) return '';
    $path = trim($path);
    if (strpos($path, 'http://') === 0 || strpos($path, 'https://') === 0 || strpos($path, 'data:') === 0) {
        return $path;
    }
    if (strpos($path, '/') === 0) {
        return 'https://attaroqqy.com' . $path;
    }
    return 'https://attaroqqy.com/api/uploads/pas_foto/' . $path;
}

function processIncomingPhoto($photoData, $prefix = 'filePasFoto') {
    if (empty($photoData)) return null;
    $photoData = trim($photoData);

    // Jika berupa base64 Data URL, coba simpan sebagai file fisik
    if (strpos($photoData, 'data:image/') === 0) {
        if (preg_match('/data:image\/([a-zA-Z0-9]+);base64,(.+)/', $photoData, $matches)) {
            $ext = strtolower($matches[1]);
            if ($ext === 'jpeg') $ext = 'jpg';
            $decoded = base64_decode($matches[2]);
            if ($decoded) {
                $filename = $prefix . '_' . round(microtime(true) * 1000) . '_' . substr(md5(uniqid()), 0, 5) . '.' . $ext;
                $possibleDirs = [
                    __DIR__ . '/api/uploads/pas_foto/',
                    __DIR__ . '/uploads/pas_foto/',
                    dirname(__DIR__) . '/public_html/api/uploads/pas_foto/',
                ];
                foreach ($possibleDirs as $dir) {
                    if (!is_dir($dir)) {
                        @mkdir($dir, 0755, true);
                    }
                    if (is_dir($dir) && is_writable($dir)) {
                        if (@file_put_contents($dir . $filename, $decoded)) {
                            return '/api/uploads/pas_foto/' . $filename;
                        }
                    }
                }
            }
        }
    }

    // Jika mengarah ke domain attaroqqy.com, normalkan kembali ke path relatif untuk database
    if (strpos($photoData, 'https://attaroqqy.com/') === 0) {
        return str_replace('https://attaroqqy.com', '', $photoData);
    }

    return $photoData;
}

// ==========================================
// 1. AMBIL DATA SANTRI YANG BERSTATUS 'Alumni'
// ==========================================
if ($action === 'get_alumni') {
    try {
        // HANYA mengambil santri dengan status 'Alumni' (atau jika ada variasi case-insensitive 'Alumni')
        $sql = "SELECT * FROM santri 
                WHERE status_keanggotaan = 'Alumni' 
                   OR LOWER(status_keanggotaan) = 'alumni'
                   OR status_keanggotaan LIKE '%Alumni%'
                   OR status_keanggotaan LIKE '%alumni%'
                ORDER BY id DESC";

        $stmt = $pdo->query($sql);
        $rows = $stmt->fetchAll();

        $alumni = [];
        foreach ($rows as $row) {
            $rawGender = trim($row['gender'] ?? $row['jenis_kelamin'] ?? $row['jk'] ?? $row['sex'] ?? '');
            $gender = parseSantriGender($rawGender);

            $alumni[] = [
                'id' => (string)($row['id'] ?? ''),
                'nik' => $row['nik'] ?? '',
                'noKk' => $row['no_kk'] ?? '',
                'nis' => $row['nis'] ?? '',
                'nism' => $row['nism'] ?? '',
                'nisn' => $row['nisn'] ?? '',
                'name' => $row['nama'] ?? '',
                'username' => !empty($row['username']) ? $row['username'] : (strtolower(str_replace(' ', '_', $row['nama'] ?? '')) ?: 'santri_' . $row['id']),
                'gender' => $gender,
                'tempatLahir' => $row['tempat_lahir'] ?? '',
                'tanggalLahir' => $row['tanggal_lahir'] ?? '',
                'urutanAnak' => (!empty($row['anak_ke']) && is_numeric($row['anak_ke'])) ? (int)$row['anak_ke'] : null,
                'jumlahSaudara' => (!empty($row['dari_bersaudara']) && is_numeric($row['dari_bersaudara'])) ? (int)$row['dari_bersaudara'] : null,
                
                // Data Asli Orang Tua dari Database (Mendukung nama_ayah, nama_bapak, ayah, bapak, nama_ibu, ibu)
                'namaAyah' => $row['nama_ayah'] ?? $row['nama_bapak'] ?? $row['ayah'] ?? $row['bapak'] ?? '',
                'nikAyah' => $row['nik_ayah'] ?? $row['nik_bapak'] ?? '',
                'pekerjaanAyah' => $row['pekerjaan_ayah'] ?? $row['pekerjaan_bapak'] ?? '',
                'pendidikanAyah' => $row['pendidikan_ayah'] ?? $row['pendidikan_bapak'] ?? '',
                'namaIbu' => $row['nama_ibu'] ?? $row['ibu'] ?? '',
                'nikIbu' => $row['nik_ibu'] ?? '',
                'pekerjaanIbu' => $row['pekerjaan_ibu'] ?? '',
                'pendidikanIbu' => $row['pendidikan_ibu'] ?? '',

                'gradYear' => $row['tahun_lulus'] ?? (!empty($row['tanggal_keluar']) ? substr($row['tanggal_keluar'], 0, 4) : ''),
                'entryYear' => !empty($row['tanggal_masuk']) ? substr($row['tanggal_masuk'], 0, 4) : '',
                'entryDate' => $row['tanggal_masuk'] ?? '',
                'gradDate' => $row['tanggal_keluar'] ?? '',
                'jenjang' => $row['pendidikan_formal'] ?? $row['pendidikan_terakhir'] ?? 'Pondok Pesantren At-Taroqqy',
                'asramaDulu' => $row['kamar'] ?? '',
                'email' => $row['email'] ?? '',
                'phone' => $row['no_hp'] ?? '',
                'address' => $row['alamat'] ?? '',
                'desa' => $row['desa'] ?? '',
                'kecamatan' => $row['kecamatan'] ?? '',
                'city' => $row['kabupaten'] ?? '',
                'province' => $row['provinsi'] ?? '',
                'occupation' => $row['pekerjaan'] ?? '',
                'institution' => $row['instansi'] ?? '',
                'avatarUrl' => normalizePhotoUrlForOutput($row['file_pas_foto'] ?? ''),
                'coverPhotoUrl' => normalizePhotoUrlForOutput($row['foto_sampul'] ?? ''),
                'bio' => $row['bio'] ?? '',
                'coordinates' => (!empty($row['latitude']) && !empty($row['longitude'])) ? [
                    'lat' => (float)$row['latitude'],
                    'lng' => (float)$row['longitude']
                ] : null,
                'password' => $row['password'] ?? '1234',
                'isPasswordChanged' => (bool)($row['is_password_changed'] ?? 0),
                'hasLoggedIn' => (bool)($row['is_password_changed'] ?? 0),
                'shareContact' => isset($row['share_contact']) ? (bool)$row['share_contact'] : true,
                'status' => 'alumni'
            ];
        }

        echo json_encode([
            'success' => true, 
            'total' => count($alumni), 
            'data' => $alumni
        ], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

// ==========================================
// 2. UPDATE DATA ALUMNI DARI APLIKASI
// ==========================================
if ($action === 'update_alumni' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? '';

    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID santri wajib disertakan']);
        exit;
    }

    try {
        $fields = [];
        $params = [':id' => $id];

        // Pastikan status_keanggotaan otomatis jadi 'Alumni' dengan A kapital jika diubah atau diperbarui
        $fields[] = "status_keanggotaan = 'Alumni'";

        // Biodata Santri
        $namaVal = $input['nama'] ?? $input['name'] ?? null;
        if ($namaVal !== null) { $fields[] = "nama = :name"; $params[':name'] = $namaVal; }
        if (isset($input['nis'])) { $fields[] = "nis = :nis"; $params[':nis'] = $input['nis']; }
        if (isset($input['nik'])) { $fields[] = "nik = :nik"; $params[':nik'] = $input['nik']; }
        if (isset($input['no_kk']) || isset($input['noKk'])) { 
            $fields[] = "no_kk = :noKk"; 
            $params[':noKk'] = $input['no_kk'] ?? $input['noKk']; 
        }
        if (isset($input['username'])) { $fields[] = "username = :username"; $params[':username'] = $input['username']; }
        
        $genderInput = $input['gender'] ?? $input['jenis_kelamin'] ?? $input['raw_gender'] ?? $input['jk'] ?? null;
        if ($genderInput !== null) { 
            $parsedG = parseSantriGender($genderInput);
            $genderVal = ($parsedG === 'P') ? 'Putri' : 'Putra';
            $fields[] = "gender = :gender"; 
            $params[':gender'] = $genderVal;
        }

        if (isset($input['tempatLahir']) || isset($input['tempat_lahir'])) { 
            $fields[] = "tempat_lahir = :tempatLahir"; 
            $params[':tempatLahir'] = $input['tempatLahir'] ?? $input['tempat_lahir']; 
        }
        if (isset($input['tanggalLahir']) || isset($input['tanggal_lahir'])) { 
            $fields[] = "tanggal_lahir = :tanggalLahir"; 
            $params[':tanggalLahir'] = $input['tanggalLahir'] ?? $input['tanggal_lahir']; 
        }
        
        $anakVal = $input['anak_ke'] ?? $input['urutanAnak'] ?? $input['anakKe'] ?? null;
        if ($anakVal !== null) { $fields[] = "anak_ke = :anakKe"; $params[':anakKe'] = $anakVal; }

        $saudaraVal = $input['dari_bersaudara'] ?? $input['jumlahSaudara'] ?? $input['dariBersaudara'] ?? null;
        if ($saudaraVal !== null) { $fields[] = "dari_bersaudara = :saudara"; $params[':saudara'] = $saudaraVal; }

        if (isset($input['kamar']) || isset($input['asramaDulu'])) {
            $fields[] = "kamar = :kamar";
            $params[':kamar'] = $input['kamar'] ?? $input['asramaDulu'];
        }
        if (isset($input['kelas']) || isset($input['jenjang'])) {
            $fields[] = "kelas = :kelas";
            $params[':kelas'] = $input['kelas'] ?? $input['jenjang'];
        }

        // Data Orang Tua
        if (isset($input['namaAyah'])) { $fields[] = "nama_ayah = :namaAyah"; $params[':namaAyah'] = $input['namaAyah']; }
        if (isset($input['nikAyah'])) { $fields[] = "nik_ayah = :nikAyah"; $params[':nikAyah'] = $input['nikAyah']; }
        if (isset($input['pekerjaanAyah'])) { $fields[] = "pekerjaan_ayah = :pekerjaanAyah"; $params[':pekerjaanAyah'] = $input['pekerjaanAyah']; }
        if (isset($input['pendidikanAyah'])) { $fields[] = "pendidikan_ayah = :pendidikanAyah"; $params[':pendidikanAyah'] = $input['pendidikanAyah']; }
        if (isset($input['namaIbu'])) { $fields[] = "nama_ibu = :namaIbu"; $params[':namaIbu'] = $input['namaIbu']; }
        if (isset($input['nikIbu'])) { $fields[] = "nik_ibu = :nikIbu"; $params[':nikIbu'] = $input['nikIbu']; }
        if (isset($input['pekerjaanIbu'])) { $fields[] = "pekerjaan_ibu = :pekerjaanIbu"; $params[':pekerjaanIbu'] = $input['pekerjaanIbu']; }
        if (isset($input['pendidikanIbu'])) { $fields[] = "pendidikan_ibu = :pendidikanIbu"; $params[':pendidikanIbu'] = $input['pendidikanIbu']; }

        // Kontak & Alamat
        if (isset($input['phone'])) { $fields[] = "no_hp = :phone"; $params[':phone'] = $input['phone']; }
        if (isset($input['email'])) { $fields[] = "email = :email"; $params[':email'] = $input['email']; }
        if (isset($input['address']) || isset($input['alamatLengkap'])) { 
            $fields[] = "alamat = :address"; 
            $params[':address'] = $input['alamatLengkap'] ?? $input['address']; 
        }
        if (isset($input['desa'])) { $fields[] = "desa = :desa"; $params[':desa'] = $input['desa']; }
        if (isset($input['kecamatan'])) { $fields[] = "kecamatan = :kecamatan"; $params[':kecamatan'] = $input['kecamatan']; }
        if (isset($input['city'])) { $fields[] = "kabupaten = :city"; $params[':city'] = $input['city']; }
        if (isset($input['province'])) { $fields[] = "provinsi = :province"; $params[':province'] = $input['province']; }
        if (isset($input['occupation'])) { $fields[] = "pekerjaan = :occupation"; $params[':occupation'] = $input['occupation']; }
        if (isset($input['institution'])) { $fields[] = "instansi = :institution"; $params[':institution'] = $input['institution']; }
        if (isset($input['bio'])) { $fields[] = "bio = :bio"; $params[':bio'] = $input['bio']; }
        if (isset($input['avatarUrl']) || isset($input['photoUrl'])) { 
            $rawPhotoVal = $input['avatarUrl'] ?? $input['photoUrl'];
            $processed = processIncomingPhoto($rawPhotoVal, 'filePasFoto');
            $fields[] = "file_pas_foto = :avatarUrl"; 
            $params[':avatarUrl'] = $processed; 
        }
        if (isset($input['coverPhotoUrl'])) { 
            $processedCover = processIncomingPhoto($input['coverPhotoUrl'], 'fotoSampul');
            $fields[] = "foto_sampul = :coverPhotoUrl"; 
            $params[':coverPhotoUrl'] = $processedCover; 
        }
        if (isset($input['password'])) { $fields[] = "password = :password"; $params[':password'] = $input['password']; }
        if (isset($input['isPasswordChanged'])) { $fields[] = "is_password_changed = :is_pwd"; $params[':is_pwd'] = $input['isPasswordChanged'] ? 1 : 0; }
        if (isset($input['shareContact'])) { $fields[] = "share_contact = :share_contact"; $params[':share_contact'] = $input['shareContact'] ? 1 : 0; }

        // Riwayat Pondok & Tanggal Masuk/Keluar
        if (isset($input['entryDate']) || isset($input['tanggal_masuk'])) { 
            $fields[] = "tanggal_masuk = :entryDate"; 
            $params[':entryDate'] = $input['entryDate'] ?? $input['tanggal_masuk']; 
        }
        if (isset($input['gradYear'])) { $fields[] = "tahun_lulus = :gradYear"; $params[':gradYear'] = $input['gradYear']; }
        if (isset($input['gradDate']) || isset($input['tanggal_keluar'])) { 
            $fields[] = "tanggal_keluar = :gradDate"; 
            $params[':gradDate'] = $input['gradDate'] ?? $input['tanggal_keluar']; 
        }

        if (isset($input['coordinates'])) {
            $coords = $input['coordinates'];
            $fields[] = "latitude = :lat";
            $fields[] = "longitude = :lng";
            $params[':lat'] = $coords ? $coords['lat'] : null;
            $params[':lng'] = $coords ? $coords['lng'] : null;
        }

        if (!empty($fields)) {
            $nikLookup = $input['nik_lookup'] ?? ($input['nik'] ?? '');
            $nisLookup = $input['nis_lookup'] ?? ($input['nis'] ?? '');
            $sql = "UPDATE santri SET " . implode(", ", $fields) . " WHERE id = :id";
            if (!empty($nikLookup)) {
                $sql .= " OR (nik IS NOT NULL AND nik != '' AND nik = :nik_lookup)";
                $params[':nik_lookup'] = $nikLookup;
            }
            if (!empty($nisLookup)) {
                $sql .= " OR (nis IS NOT NULL AND nis != '' AND nis = :nis_lookup)";
                $params[':nis_lookup'] = $nisLookup;
            }
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
        }

        echo json_encode(['success' => true, 'message' => 'Data berhasil diperbarui di database Hostinger']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

// ==========================================
// 3. TAMBAH ALUMNI BARU DARI ADMIN
// ==========================================
if ($action === 'add_alumni' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    try {
        $id = $input['id'] ?? ('alm-' . time());
        $sql = "INSERT INTO santri (
            id, nis, nama, username, nik, no_kk, gender, tempat_lahir, tanggal_lahir, 
            alamat, desa, kecamatan, kabupaten, provinsi, no_hp, email,
            pekerjaan, instansi, status_keanggotaan, tahun_lulus, tanggal_masuk, tanggal_keluar, kamar,
            password, is_password_changed, latitude, longitude,
            nama_ayah, nik_ayah, pekerjaan_ayah, pendidikan_ayah,
            nama_ibu, nik_ibu, pekerjaan_ibu, pendidikan_ibu,
            anak_ke, dari_bersaudara, created_at
        ) VALUES (
            :id, :nis, :nama, :username, :nik, :no_kk, :gender, :tempat_lahir, :tanggal_lahir,
            :alamat, :desa, :kecamatan, :kabupaten, :provinsi, :no_hp, :email,
            :pekerjaan, :instansi, 'Alumni', :tahun_lulus, :tanggal_masuk, :tanggal_keluar, :kamar,
            :password, 0, :lat, :lng,
            :nama_ayah, :nik_ayah, :pekerjaan_ayah, :pendidikan_ayah,
            :nama_ibu, :nik_ibu, :pekerjaan_ibu, :pendidikan_ibu,
            :anak_ke, :dari_bersaudara, NOW()
        )";

        $stmt = $pdo->prepare($sql);
        $coords = $input['coordinates'] ?? null;
        $stmt->execute([
            ':id' => $id,
            ':nis' => $input['nis'] ?? '',
            ':nama' => $input['name'] ?? '',
            ':username' => $input['username'] ?? '',
            ':nik' => $input['nik'] ?? '',
            ':no_kk' => $input['noKk'] ?? '',
            ':gender' => ($input['gender'] === 'P') ? 'Putri' : 'Putra',
            ':tempat_lahir' => $input['tempatLahir'] ?? '',
            ':tanggal_lahir' => $input['tanggalLahir'] ?? null,
            ':alamat' => $input['address'] ?? ($input['alamatLengkap'] ?? ''),
            ':desa' => $input['desa'] ?? '',
            ':kecamatan' => $input['kecamatan'] ?? '',
            ':kabupaten' => $input['city'] ?? '',
            ':provinsi' => $input['province'] ?? '',
            ':no_hp' => $input['phone'] ?? '',
            ':email' => $input['email'] ?? '',
            ':pekerjaan' => $input['occupation'] ?? '',
            ':instansi' => $input['institution'] ?? '',
            ':tahun_lulus' => $input['gradYear'] ?? date('Y'),
            ':tanggal_masuk' => $input['entryDate'] ?? ($input['tanggal_masuk'] ?? null),
            ':tanggal_keluar' => $input['gradDate'] ?? ($input['tanggal_keluar'] ?? null),
            ':kamar' => $input['asramaDulu'] ?? '',
            ':password' => $input['password'] ?? '1234',
            ':lat' => $coords ? $coords['lat'] : null,
            ':lng' => $coords ? $coords['lng'] : null,
            ':nama_ayah' => $input['namaAyah'] ?? '',
            ':nik_ayah' => $input['nikAyah'] ?? '',
            ':pekerjaan_ayah' => $input['pekerjaanAyah'] ?? '',
            ':pendidikan_ayah' => $input['pendidikanAyah'] ?? '',
            ':nama_ibu' => $input['namaIbu'] ?? '',
            ':nik_ibu' => $input['nikIbu'] ?? '',
            ':pekerjaan_ibu' => $input['pekerjaanIbu'] ?? '',
            ':pendidikan_ibu' => $input['pendidikanIbu'] ?? '',
            ':anak_ke' => $input['urutanAnak'] ?? null,
            ':dari_bersaudara' => $input['jumlahSaudara'] ?? null,
        ]);

        echo json_encode(['success' => true, 'id' => $id, 'message' => 'Alumni baru berhasil ditambahkan']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

// ==========================================
// 4. HAPUS ALUMNI DARI DATABASE
// ==========================================
if ($action === 'delete_alumni' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? '';
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID wajib diisi']);
        exit;
    }
    try {
        $stmt = $pdo->prepare("DELETE FROM santri WHERE id = :id");
        $stmt->execute([':id' => $id]);
        echo json_encode(['success' => true, 'message' => 'Alumni berhasil dihapus']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

// ==========================================
// 5. MIGRASI OTOMATIS: BUAT SEMUA TABEL FITUR JIKA BELUM ADA
// ==========================================
if ($action === 'migrate_db') {
    try {
        // 1. Kolom tambahan santri
        $pdo->exec("
            ALTER TABLE santri 
                ADD COLUMN IF NOT EXISTS nism VARCHAR(32) DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS nisn VARCHAR(32) DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS username VARCHAR(80) DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS no_kk VARCHAR(32) DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS anak_ke INT(11) DEFAULT 1,
                ADD COLUMN IF NOT EXISTS dari_bersaudara INT(11) DEFAULT 0,
                ADD COLUMN IF NOT EXISTS nama_ayah VARCHAR(150) DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS nik_ayah VARCHAR(32) DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS pekerjaan_ayah VARCHAR(100) DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS pendidikan_ayah VARCHAR(80) DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS nama_ibu VARCHAR(150) DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS nik_ibu VARCHAR(32) DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS pekerjaan_ibu VARCHAR(100) DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS pendidikan_ibu VARCHAR(80) DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS tanggal_masuk DATE DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS tanggal_keluar DATE DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS is_password_changed TINYINT(1) DEFAULT 0,
                ADD COLUMN IF NOT EXISTS foto_sampul TEXT DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8) DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8) DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS share_contact TINYINT(1) DEFAULT 1;
        ");

        // 2. admin_users
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS admin_users (
                id VARCHAR(64) NOT NULL PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                username VARCHAR(80) NOT NULL UNIQUE,
                email VARCHAR(120) DEFAULT NULL,
                password VARCHAR(255) NOT NULL DEFAULT '1997',
                role ENUM('super_admin', 'pengurus_pondok') NOT NULL DEFAULT 'pengurus_pondok',
                jabatan VARCHAR(150) NOT NULL DEFAULT 'Pengurus Ikatan Alumni',
                region_level ENUM('pusat', 'provinsi', 'kota', 'kecamatan') NOT NULL DEFAULT 'pusat',
                avatar TEXT DEFAULT NULL,
                cover_photo_url TEXT DEFAULT NULL,
                bio TEXT DEFAULT NULL,
                phone VARCHAR(30) DEFAULT NULL,
                province VARCHAR(80) DEFAULT 'Jawa Timur',
                city VARCHAR(80) DEFAULT NULL,
                kecamatan VARCHAR(80) DEFAULT NULL,
                desa VARCHAR(80) DEFAULT NULL,
                alamat_lengkap TEXT DEFAULT NULL,
                latitude DECIMAL(10, 8) DEFAULT NULL,
                longitude DECIMAL(11, 8) DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // 3. events
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS events (
                id VARCHAR(64) NOT NULL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                date VARCHAR(80) NOT NULL,
                time VARCHAR(80) DEFAULT NULL,
                location VARCHAR(255) NOT NULL,
                category ENUM('reuni', 'haul', 'kajian', 'korda') NOT NULL DEFAULT 'reuni',
                description TEXT DEFAULT NULL,
                poster_url TEXT DEFAULT NULL,
                images LONGTEXT DEFAULT NULL,
                author_name VARCHAR(150) DEFAULT NULL,
                author_handle VARCHAR(80) DEFAULT NULL,
                author_avatar TEXT DEFAULT NULL,
                target_gender ENUM('semua', 'L', 'P') DEFAULT 'semua',
                target_region_scope ENUM('semua', 'khusus') DEFAULT 'semua',
                target_province_name VARCHAR(80) DEFAULT NULL,
                target_regency_name VARCHAR(80) DEFAULT NULL,
                target_district_name VARCHAR(80) DEFAULT NULL,
                target_village_name VARCHAR(80) DEFAULT NULL,
                attendees_count INT(11) DEFAULT 0,
                absent_count INT(11) DEFAULT 0,
                posted_at VARCHAR(80) DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // 4. event_rsvps
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS event_rsvps (
                id VARCHAR(64) NOT NULL PRIMARY KEY,
                event_id VARCHAR(64) NOT NULL,
                alumni_id VARCHAR(64) NOT NULL,
                status ENUM('hadir', 'belum_pasti', 'tidak_hadir') NOT NULL DEFAULT 'hadir',
                note TEXT DEFAULT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uk_event_alumni (event_id, alumni_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // 5. announcements
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS announcements (
                id VARCHAR(64) NOT NULL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                date VARCHAR(80) NOT NULL,
                category ENUM('maklumat', 'kegiatan', 'beasiswa', 'umum') NOT NULL DEFAULT 'maklumat',
                content LONGTEXT NOT NULL,
                author_name VARCHAR(150) NOT NULL,
                author_handle VARCHAR(80) DEFAULT NULL,
                author_avatar TEXT DEFAULT NULL,
                author_role VARCHAR(150) DEFAULT NULL,
                is_important TINYINT(1) DEFAULT 0,
                images LONGTEXT DEFAULT NULL,
                target_gender ENUM('semua', 'L', 'P') DEFAULT 'semua',
                target_region_scope ENUM('semua', 'khusus') DEFAULT 'semua',
                target_province_name VARCHAR(80) DEFAULT NULL,
                target_regency_name VARCHAR(80) DEFAULT NULL,
                target_district_name VARCHAR(80) DEFAULT NULL,
                target_village_name VARCHAR(80) DEFAULT NULL,
                likes_count INT(11) DEFAULT 0,
                comments_count INT(11) DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // 6. post_comments
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS post_comments (
                id VARCHAR(64) NOT NULL PRIMARY KEY,
                post_type ENUM('event', 'announcement') NOT NULL DEFAULT 'event',
                post_id VARCHAR(64) NOT NULL,
                parent_comment_id VARCHAR(64) DEFAULT NULL,
                author_id VARCHAR(64) DEFAULT NULL,
                author_name VARCHAR(150) NOT NULL,
                author_handle VARCHAR(80) DEFAULT NULL,
                author_avatar TEXT DEFAULT NULL,
                avatar_ring TINYINT(1) DEFAULT 0,
                status ENUM('hadir', 'tidak_hadir', 'netral') DEFAULT 'netral',
                content TEXT NOT NULL,
                likes_count INT(11) DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // 7. attendance_sessions
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS attendance_sessions (
                id VARCHAR(64) NOT NULL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                date VARCHAR(80) NOT NULL,
                source_event_id VARCHAR(64) DEFAULT NULL,
                source_type ENUM('imported', 'manual') NOT NULL DEFAULT 'manual',
                total_attendees INT(11) DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // 8. attendance_attendees
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS attendance_attendees (
                id VARCHAR(64) NOT NULL PRIMARY KEY,
                session_id VARCHAR(64) NOT NULL,
                alumni_id VARCHAR(64) NOT NULL,
                alumni_name VARCHAR(150) NOT NULL,
                alumni_nis VARCHAR(32) DEFAULT NULL,
                gender ENUM('Putra', 'Putri', 'L', 'P') DEFAULT 'Putra',
                desa VARCHAR(80) DEFAULT NULL,
                kecamatan VARCHAR(80) DEFAULT NULL,
                city VARCHAR(80) DEFAULT NULL,
                address_text TEXT DEFAULT NULL,
                grad_year VARCHAR(10) DEFAULT NULL,
                jenjang VARCHAR(100) DEFAULT NULL,
                photo_url TEXT DEFAULT NULL,
                check_in_time VARCHAR(40) NOT NULL,
                method ENUM('qr', 'manual') NOT NULL DEFAULT 'qr',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uk_session_alumni (session_id, alumni_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // 9. alumni_bills
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS alumni_bills (
                id VARCHAR(64) NOT NULL PRIMARY KEY,
                alumni_id VARCHAR(64) DEFAULT NULL,
                name VARCHAR(255) NOT NULL,
                amount DECIMAL(12, 2) NOT NULL,
                category ENUM('Pondok', 'Alumni', 'Wakaf', 'Lainnya') NOT NULL DEFAULT 'Alumni',
                is_paid TINYINT(1) DEFAULT 0,
                due_date VARCHAR(80) DEFAULT NULL,
                paid_at VARCHAR(80) DEFAULT NULL,
                payment_method VARCHAR(80) DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        echo json_encode(['success' => true, 'message' => 'Semua tabel database berhasil diperbarui/dimigrasikan']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Gagal migrasi: ' . $e->getMessage()]);
    }
    exit;
}

// ==========================================
// 6. ENDPOINTS FITUR EVENTS (AGENDA)
// ==========================================
if ($action === 'get_events') {
    ensureTablesExist($pdo);
    try {
        $stmt = $pdo->query("SELECT * FROM events ORDER BY id DESC");
        $rawEvents = $stmt->fetchAll();
        $events = [];
        foreach ($rawEvents as $ev) {
            $images = [];
            if (!empty($ev['images'])) {
                $decoded = json_decode($ev['images'], true);
                if (is_array($decoded)) $images = $decoded;
            }
            $targetAudience = [
                'gender' => $ev['target_gender'] ?? 'semua',
                'regionScope' => $ev['target_region_scope'] ?? 'semua',
                'provinceName' => $ev['target_province_name'] ?? null,
                'regencyName' => $ev['target_regency_name'] ?? null,
                'districtName' => $ev['target_district_name'] ?? null,
                'villageName' => $ev['target_village_name'] ?? null,
            ];
            $events[] = [
                'id' => (string)$ev['id'],
                'title' => $ev['title'] ?? '',
                'date' => $ev['date'] ?? '',
                'time' => $ev['time'] ?? '',
                'location' => $ev['location'] ?? '',
                'category' => $ev['category'] ?? 'reuni',
                'description' => $ev['description'] ?? '',
                'attendeesCount' => (int)($ev['attendees_count'] ?? 0),
                'absentCount' => (int)($ev['absent_count'] ?? 0),
                'posterUrl' => $ev['poster_url'] ?? '',
                'images' => $images,
                'authorName' => $ev['author_name'] ?? '',
                'authorHandle' => $ev['author_handle'] ?? '',
                'authorAvatar' => $ev['author_avatar'] ?? '',
                'postedAt' => $ev['posted_at'] ?? $ev['created_at'] ?? '',
                'targetAudience' => $targetAudience,
            ];
        }
        echo json_encode(['success' => true, 'data' => $events], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'save_event' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    ensureTablesExist($pdo);
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? ('ev-' . time());
    try {
        $sql = "INSERT INTO events (
            id, title, date, time, location, category, description, poster_url, images,
            author_name, author_handle, author_avatar,
            target_gender, target_region_scope, target_province_name, target_regency_name,
            target_district_name, target_village_name, attendees_count, absent_count, posted_at, created_at
        ) VALUES (
            :id, :title, :date, :time, :location, :category, :description, :poster_url, :images,
            :author_name, :author_handle, :author_avatar,
            :target_gender, :target_region_scope, :target_province_name, :target_regency_name,
            :target_district_name, :target_village_name, :attendees_count, :absent_count, :posted_at, NOW()
        ) ON DUPLICATE KEY UPDATE
            title = VALUES(title), date = VALUES(date), time = VALUES(time), location = VALUES(location),
            category = VALUES(category), description = VALUES(description), poster_url = VALUES(poster_url),
            images = VALUES(images), author_name = VALUES(author_name), author_handle = VALUES(author_handle),
            author_avatar = VALUES(author_avatar), attendees_count = VALUES(attendees_count), absent_count = VALUES(absent_count),
            target_gender = VALUES(target_gender), target_region_scope = VALUES(target_region_scope),
            target_province_name = VALUES(target_province_name), target_regency_name = VALUES(target_regency_name),
            target_district_name = VALUES(target_district_name), target_village_name = VALUES(target_village_name)";

        $stmt = $pdo->prepare($sql);
        $target = $input['targetAudience'] ?? [];
        $processedPoster = !empty($input['posterUrl']) ? processIncomingPhoto($input['posterUrl'], 'event_poster') : '';
        $processedImages = [];
        if (!empty($input['images']) && is_array($input['images'])) {
            foreach ($input['images'] as $img) {
                $processedImages[] = processIncomingPhoto($img, 'event_img');
            }
        }
        $stmt->execute([
            ':id' => $id,
            ':title' => $input['title'] ?? '',
            ':date' => $input['date'] ?? '',
            ':time' => $input['time'] ?? '',
            ':location' => $input['location'] ?? '',
            ':category' => $input['category'] ?? 'reuni',
            ':description' => $input['description'] ?? '',
            ':poster_url' => $processedPoster,
            ':images' => !empty($processedImages) ? json_encode($processedImages) : null,
            ':author_name' => $input['authorName'] ?? 'Pengurus Pusat',
            ':author_handle' => $input['authorHandle'] ?? '@admin_pusat',
            ':author_avatar' => $input['authorAvatar'] ?? '',
            ':target_gender' => $target['gender'] ?? 'semua',
            ':target_region_scope' => $target['regionScope'] ?? 'semua',
            ':target_province_name' => $target['provinceName'] ?? null,
            ':target_regency_name' => $target['regencyName'] ?? null,
            ':target_district_name' => $target['districtName'] ?? null,
            ':target_village_name' => $target['villageName'] ?? null,
            ':attendees_count' => $input['attendeesCount'] ?? 0,
            ':absent_count' => $input['absentCount'] ?? 0,
            ':posted_at' => $input['postedAt'] ?? date('Y-m-d H:i:s'),
        ]);

        echo json_encode(['success' => true, 'id' => $id, 'message' => 'Event berhasil disimpan']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'delete_event') {
    ensureTablesExist($pdo);
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = $input['id'] ?? $_POST['id'] ?? $_GET['id'] ?? '';
    try {
        $stmt = $pdo->prepare("DELETE FROM events WHERE id = :id");
        $stmt->execute([':id' => $id]);
        echo json_encode(['success' => true, 'message' => 'Event berhasil dihapus']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'save_rsvp' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    ensureTablesExist($pdo);
    $input = json_decode(file_get_contents('php://input'), true);
    $eventId = $input['eventId'] ?? $input['event_id'] ?? '';
    $alumniId = $input['alumniId'] ?? $input['alumni_id'] ?? '';
    $status = $input['status'] ?? 'hadir';
    $note = $input['note'] ?? '';
    if ($eventId && $alumniId) {
        try {
            $id = 'rsvp-' . md5($eventId . '_' . $alumniId);
            $stmt = $pdo->prepare("INSERT INTO event_rsvps (id, event_id, alumni_id, status, note, updated_at) 
                VALUES (:id, :eid, :aid, :st, :nt, NOW()) 
                ON DUPLICATE KEY UPDATE status = VALUES(status), note = VALUES(note), updated_at = NOW()");
            $stmt->execute([':id' => $id, ':eid' => $eventId, ':aid' => $alumniId, ':st' => $status, ':nt' => $note]);

            // Sync tanggapan kehadiran ke post_comments agar akun admin dan publik dapat langsung melihat komentar konfirmasi kehadiran
            $defaultNote = ($status === 'hadir') ? 'Insya Allah saya hadir' : (($status === 'tidak_hadir') ? 'Mohon maaf belum bisa hadir' : '');
            $finalContent = (!empty($note) && trim($note) !== '') ? trim($note) : $defaultNote;

            if ($finalContent !== '') {
                $authorName = $input['authorName'] ?? '';
                $authorHandle = $input['authorHandle'] ?? '';
                $authorAvatar = $input['authorAvatar'] ?? '';

                if (empty($authorName)) {
                    $sStmt = $pdo->prepare("SELECT nama, username, foto FROM santri WHERE id = :aid OR nis = :aid OR nik = :aid LIMIT 1");
                    $sStmt->execute([':aid' => $alumniId]);
                    $sRow = $sStmt->fetch();
                    if ($sRow) {
                        $authorName = $sRow['nama'];
                        $authorHandle = !empty($sRow['username']) ? '@' . ltrim($sRow['username'], '@') : '@alumni';
                        $authorAvatar = $sRow['foto'] ?? '';
                    }
                }

                $commId = 'comm-rsvp-' . $alumniId . '-' . $eventId;
                $commStatus = ($status === 'hadir' || $status === 'tidak_hadir') ? $status : 'netral';
                $cStmt = $pdo->prepare("INSERT INTO post_comments (
                    id, post_type, post_id, author_id, author_name, author_handle, author_avatar, avatar_ring, status, content, likes_count, created_at
                ) VALUES (
                    :cid, 'event', :eid, :aid, :aname, :ahandle, :aavatar, 1, :st, :cnt, 0, NOW()
                ) ON DUPLICATE KEY UPDATE status = VALUES(status), content = VALUES(content)");
                $cStmt->execute([
                    ':cid' => $commId,
                    ':eid' => $eventId,
                    ':aid' => $alumniId,
                    ':aname' => $authorName ?: 'Alumni',
                    ':ahandle' => $authorHandle ?: '@alumni',
                    ':aavatar' => $authorAvatar ?: '',
                    ':st' => $commStatus,
                    ':cnt' => $finalContent,
                ]);
            }

            echo json_encode(['success' => true, 'message' => 'RSVP berhasil disimpan']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        exit;
    }
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'eventId dan alumniId wajib']);
    exit;
}

// ==========================================
// 7. ENDPOINTS FITUR ANNOUNCEMENTS (MAKLUMAT)
// ==========================================
if ($action === 'get_announcements') {
    ensureTablesExist($pdo);
    try {
        $stmt = $pdo->query("SELECT * FROM announcements ORDER BY is_important DESC, id DESC");
        $rawAnn = $stmt->fetchAll();
        $announcements = [];
        foreach ($rawAnn as $ann) {
            $images = [];
            if (!empty($ann['images'])) {
                $decoded = json_decode($ann['images'], true);
                if (is_array($decoded)) $images = $decoded;
            }
            $targetAudience = [
                'gender' => $ann['target_gender'] ?? 'semua',
                'regionScope' => $ann['target_region_scope'] ?? 'semua',
                'provinceName' => $ann['target_province_name'] ?? null,
                'regencyName' => $ann['target_regency_name'] ?? null,
                'districtName' => $ann['target_district_name'] ?? null,
                'villageName' => $ann['target_village_name'] ?? null,
            ];
            $announcements[] = [
                'id' => (string)$ann['id'],
                'title' => $ann['title'] ?? '',
                'date' => $ann['date'] ?? '',
                'category' => $ann['category'] ?? 'maklumat',
                'content' => $ann['content'] ?? '',
                'authorName' => $ann['author_name'] ?? '',
                'authorHandle' => $ann['author_handle'] ?? '',
                'authorAvatar' => $ann['author_avatar'] ?? '',
                'authorRole' => $ann['author_role'] ?? 'Pengurus',
                'isImportant' => (bool)($ann['is_important'] ?? 0),
                'images' => $images,
                'targetAudience' => $targetAudience,
                'likesCount' => (int)($ann['likes_count'] ?? 0),
                'commentsCount' => (int)($ann['comments_count'] ?? 0),
            ];
        }
        echo json_encode(['success' => true, 'data' => $announcements], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'save_announcement' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    ensureTablesExist($pdo);
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? ('ann-' . time());
    try {
        $sql = "INSERT INTO announcements (
            id, title, date, category, content, author_name, author_handle, author_avatar,
            author_role, is_important, images, target_gender, target_region_scope,
            target_province_name, target_regency_name, target_district_name, target_village_name,
            likes_count, comments_count, created_at
        ) VALUES (
            :id, :title, :date, :category, :content, :author_name, :author_handle, :author_avatar,
            :author_role, :is_important, :images, :target_gender, :target_region_scope,
            :target_province_name, :target_regency_name, :target_district_name, :target_village_name,
            :likes_count, :comments_count, NOW()
        ) ON DUPLICATE KEY UPDATE
            title = VALUES(title), date = VALUES(date), category = VALUES(category),
            content = VALUES(content), is_important = VALUES(is_important), images = VALUES(images),
            author_name = VALUES(author_name), author_handle = VALUES(author_handle), author_avatar = VALUES(author_avatar),
            target_gender = VALUES(target_gender), target_region_scope = VALUES(target_region_scope),
            target_province_name = VALUES(target_province_name), target_regency_name = VALUES(target_regency_name),
            target_district_name = VALUES(target_district_name), target_village_name = VALUES(target_village_name)";

        $stmt = $pdo->prepare($sql);
        $target = $input['targetAudience'] ?? [];
        $processedImages = [];
        if (!empty($input['images']) && is_array($input['images'])) {
            foreach ($input['images'] as $img) {
                $processedImages[] = processIncomingPhoto($img, 'ann_img');
            }
        }
        $stmt->execute([
            ':id' => $id,
            ':title' => $input['title'] ?? '',
            ':date' => $input['date'] ?? date('d M Y'),
            ':category' => $input['category'] ?? 'maklumat',
            ':content' => $input['content'] ?? '',
            ':author_name' => $input['authorName'] ?? 'Admin Pondok',
            ':author_handle' => $input['authorHandle'] ?? '@admin_pusat',
            ':author_avatar' => $input['authorAvatar'] ?? '',
            ':author_role' => $input['authorRole'] ?? 'Pengurus',
            ':is_important' => !empty($input['isImportant']) ? 1 : 0,
            ':images' => !empty($processedImages) ? json_encode($processedImages) : null,
            ':target_gender' => $target['gender'] ?? 'semua',
            ':target_region_scope' => $target['regionScope'] ?? 'semua',
            ':target_province_name' => $target['provinceName'] ?? null,
            ':target_regency_name' => $target['regencyName'] ?? null,
            ':target_district_name' => $target['districtName'] ?? null,
            ':target_village_name' => $target['villageName'] ?? null,
            ':likes_count' => $input['likesCount'] ?? 0,
            ':comments_count' => $input['commentsCount'] ?? 0,
        ]);

        echo json_encode(['success' => true, 'id' => $id, 'message' => 'Pengumuman berhasil disimpan']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'delete_announcement') {
    ensureTablesExist($pdo);
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = $input['id'] ?? $_POST['id'] ?? $_GET['id'] ?? '';
    try {
        $stmt = $pdo->prepare("DELETE FROM announcements WHERE id = :id");
        $stmt->execute([':id' => $id]);
        echo json_encode(['success' => true, 'message' => 'Pengumuman berhasil dihapus']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

// ==========================================
// 8. ENDPOINTS FITUR ADMIN_USERS (KELOLA AKUN)
// ==========================================
if ($action === 'get_admin_users') {
    try {
        $stmt = $pdo->query("SELECT id, name, username, email, role, jabatan, region_level, avatar, cover_photo_url, bio, phone, province, city, kecamatan, desa, alamat_lengkap, latitude, longitude, created_at FROM admin_users ORDER BY (region_level = 'pusat') DESC, id ASC");
        $admins = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $admins]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'save_admin_user' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? ('adm-' . time());
    try {
        $sql = "INSERT INTO admin_users (
            id, name, username, email, password, role, jabatan, region_level,
            avatar, cover_photo_url, bio, phone, province, city, kecamatan, desa,
            alamat_lengkap, latitude, longitude, created_at
        ) VALUES (
            :id, :name, :username, :email, :password, :role, :jabatan, :region_level,
            :avatar, :cover_photo_url, :bio, :phone, :province, :city, :kecamatan, :desa,
            :alamat_lengkap, :latitude, :longitude, NOW()
        ) ON DUPLICATE KEY UPDATE
            name = VALUES(name), username = VALUES(username), email = VALUES(email),
            role = VALUES(role), jabatan = VALUES(jabatan), region_level = VALUES(region_level),
            avatar = VALUES(avatar), cover_photo_url = VALUES(cover_photo_url), bio = VALUES(bio),
            phone = VALUES(phone), province = VALUES(province), city = VALUES(city),
            kecamatan = VALUES(kecamatan), desa = VALUES(desa), alamat_lengkap = VALUES(alamat_lengkap),
            latitude = VALUES(latitude), longitude = VALUES(longitude)";

        $stmt = $pdo->prepare($sql);
        $coords = $input['coordinates'] ?? null;
        $stmt->execute([
            ':id' => $id,
            ':name' => $input['name'] ?? '',
            ':username' => $input['username'] ?? '',
            ':email' => $input['email'] ?? null,
            ':password' => $input['password'] ?? '1997',
            ':role' => $input['role'] ?? 'pengurus_pondok',
            ':jabatan' => $input['jabatan'] ?? 'Pengurus Ikatan Alumni',
            ':region_level' => $input['regionLevel'] ?? 'provinsi',
            ':avatar' => $input['avatar'] ?? null,
            ':cover_photo_url' => $input['coverPhotoUrl'] ?? null,
            ':bio' => $input['bio'] ?? null,
            ':phone' => $input['phone'] ?? null,
            ':province' => $input['province'] ?? 'Jawa Timur',
            ':city' => $input['city'] ?? null,
            ':kecamatan' => $input['kecamatan'] ?? null,
            ':desa' => $input['desa'] ?? null,
            ':alamat_lengkap' => $input['alamatLengkap'] ?? null,
            ':latitude' => $coords ? $coords['lat'] : null,
            ':longitude' => $coords ? $coords['lng'] : null,
        ]);

        echo json_encode(['success' => true, 'id' => $id, 'message' => 'Akun admin berhasil disimpan']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'delete_admin_user' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? '';
    try {
        $stmt = $pdo->prepare("DELETE FROM admin_users WHERE id = :id AND username != '@admin_pusat'");
        $stmt->execute([':id' => $id]);
        echo json_encode(['success' => true, 'message' => 'Akun admin berhasil dihapus']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

// ==========================================
// 9. ENDPOINTS FITUR PRESENSI & KEHADIRAN (SCANNER)
// ==========================================
if ($action === 'get_attendance_sessions') {
    try {
        $stmt = $pdo->query("SELECT s.*, 
            (SELECT COUNT(*) FROM attendance_attendees a WHERE a.session_id = s.id) AS total_attendees 
            FROM attendance_sessions s ORDER BY s.id DESC");
        $sessions = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $sessions]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'checkin_attendee' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $sessionId = $input['sessionId'] ?? '';
    $alumniId = $input['alumniId'] ?? '';
    if (!$sessionId || !$alumniId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Session ID dan Alumni ID wajib']);
        exit;
    }
    try {
        $id = $input['id'] ?? ('att-' . time() . '-' . rand(100, 999));
        $sql = "INSERT INTO attendance_attendees (
            id, session_id, alumni_id, alumni_name, alumni_nis, gender,
            desa, kecamatan, city, address_text, grad_year, jenjang, photo_url,
            check_in_time, method, created_at
        ) VALUES (
            :id, :session_id, :alumni_id, :alumni_name, :alumni_nis, :gender,
            :desa, :kecamatan, :city, :address_text, :grad_year, :jenjang, :photo_url,
            :check_in_time, :method, NOW()
        ) ON DUPLICATE KEY UPDATE check_in_time = VALUES(check_in_time)";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':id' => $id,
            ':session_id' => $sessionId,
            ':alumni_id' => $alumniId,
            ':alumni_name' => $input['alumniName'] ?? '',
            ':alumni_nis' => $input['alumniNis'] ?? '',
            ':gender' => $input['gender'] ?? 'Putra',
            ':desa' => $input['desa'] ?? '',
            ':kecamatan' => $input['kecamatan'] ?? '',
            ':city' => $input['city'] ?? '',
            ':address_text' => $input['addressText'] ?? '',
            ':grad_year' => $input['gradYear'] ?? '',
            ':jenjang' => $input['jenjang'] ?? '',
            ':photo_url' => $input['photoUrl'] ?? '',
            ':check_in_time' => $input['checkInTime'] ?? date('H:i:s'),
            ':method' => $input['method'] ?? 'qr',
        ]);

        // Update total counter di sesi presensi
        $pdo->prepare("UPDATE attendance_sessions SET total_attendees = (SELECT COUNT(*) FROM attendance_attendees WHERE session_id = :sid) WHERE id = :sid")
            ->execute([':sid' => $sessionId]);

        echo json_encode(['success' => true, 'id' => $id, 'message' => 'Check-in presensi berhasil dicatat']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

// ==========================================
// 10. ENDPOINTS FITUR POST COMMENTS & LIKES
// ==========================================
if ($action === 'get_comments') {
    ensureTablesExist($pdo);
    $postId = $_GET['post_id'] ?? $_GET['eventId'] ?? null;
    try {
        if ($postId) {
            $stmt = $pdo->prepare("SELECT * FROM post_comments WHERE post_id = :pid ORDER BY id ASC");
            $stmt->execute([':pid' => $postId]);
        } else {
            $stmt = $pdo->query("SELECT * FROM post_comments ORDER BY id ASC");
        }
        $rows = $stmt->fetchAll();
        $commentsMap = [];
        $replies = [];
        foreach ($rows as $r) {
            $c = [
                'id' => (string)$r['id'],
                'eventId' => (string)$r['post_id'],
                'postType' => $r['post_type'] ?? 'event',
                'authorName' => $r['author_name'],
                'authorHandle' => $r['author_handle'] ?? '',
                'authorAvatar' => $r['author_avatar'] ?? '',
                'avatarRing' => (bool)($r['avatar_ring'] ?? 0),
                'status' => $r['status'] ?? 'netral',
                'content' => $r['content'],
                'likesCount' => (int)($r['likes_count'] ?? 0),
                'timeAgo' => 'Baru saja',
                'replies' => [],
                'repliesCount' => 0
            ];
            if (!empty($r['parent_comment_id'])) {
                $replies[] = [
                    'id' => (string)$r['id'],
                    'commentId' => (string)$r['parent_comment_id'],
                    'authorName' => $r['author_name'],
                    'authorHandle' => $r['author_handle'] ?? '',
                    'authorAvatar' => $r['author_avatar'] ?? '',
                    'content' => $r['content'],
                    'timeAgo' => 'Baru saja',
                    'likesCount' => (int)($r['likes_count'] ?? 0),
                ];
            } else {
                $commentsMap[$r['id']] = $c;
            }
        }
        foreach ($replies as $rep) {
            if (isset($commentsMap[$rep['commentId']])) {
                $commentsMap[$rep['commentId']]['replies'][] = $rep;
                $commentsMap[$rep['commentId']]['repliesCount']++;
            }
        }
        $result = array_values($commentsMap);
        echo json_encode(['success' => true, 'data' => $result], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'save_comment' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    ensureTablesExist($pdo);
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? ('comm-' . time() . '-' . rand(100, 999));
    $postId = $input['eventId'] ?? $input['post_id'] ?? '';
    $parentCommentId = $input['commentId'] ?? $input['parent_comment_id'] ?? null;
    $postType = $input['postType'] ?? 'event';
    if (!$postId || empty($input['content'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'post_id dan content wajib diisi']);
        exit;
    }
    try {
        $sql = "INSERT INTO post_comments (
            id, post_type, post_id, parent_comment_id, author_id, author_name, author_handle, author_avatar, avatar_ring, status, content, likes_count, created_at
        ) VALUES (
            :id, :ptype, :pid, :pcid, :aid, :aname, :ahandle, :aavatar, :aring, :status, :content, :likes, NOW()
        ) ON DUPLICATE KEY UPDATE content = VALUES(content), status = VALUES(status), likes_count = VALUES(likes_count)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':id' => $id,
            ':ptype' => $postType,
            ':pid' => $postId,
            ':pcid' => $parentCommentId,
            ':aid' => $input['authorId'] ?? null,
            ':aname' => $input['authorName'] ?? 'Alumni',
            ':ahandle' => $input['authorHandle'] ?? null,
            ':aavatar' => $input['authorAvatar'] ?? null,
            ':aring' => !empty($input['avatarRing']) ? 1 : 0,
            ':status' => $input['status'] ?? 'netral',
            ':content' => $input['content'],
            ':likes' => $input['likesCount'] ?? 0,
        ]);
        if ($postType === 'announcement') {
            $pdo->prepare("UPDATE announcements SET comments_count = (SELECT COUNT(*) FROM post_comments WHERE post_id = :pid) WHERE id = :pid")->execute([':pid' => $postId]);
        }
        echo json_encode(['success' => true, 'id' => $id, 'message' => 'Komentar berhasil disimpan']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'like_comment' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    ensureTablesExist($pdo);
    $input = json_decode(file_get_contents('php://input'), true);
    $commentId = $input['commentId'] ?? $input['id'] ?? '';
    $delta = isset($input['delta']) ? (int)$input['delta'] : (isset($input['isLiked']) && $input['isLiked'] ? 1 : -1);
    if ($commentId) {
        try {
            $stmt = $pdo->prepare("UPDATE post_comments SET likes_count = GREATEST(0, likes_count + :delta) WHERE id = :cid");
            $stmt->execute([':delta' => $delta, ':cid' => $commentId]);
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        exit;
    }
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'commentId wajib']);
    exit;
}

if ($action === 'delete_comment' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    ensureTablesExist($pdo);
    $input = json_decode(file_get_contents('php://input'), true);
    $commentId = $input['commentId'] ?? $input['id'] ?? '';
    if ($commentId) {
        try {
            $stmt = $pdo->prepare("DELETE FROM post_comments WHERE id = :cid OR parent_comment_id = :cid");
            $stmt->execute([':cid' => $commentId]);
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        exit;
    }
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'commentId wajib']);
    exit;
}

if ($action === 'like_post' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    ensureTablesExist($pdo);
    $input = json_decode(file_get_contents('php://input'), true);
    $postId = $input['postId'] ?? $input['id'] ?? '';
    $postType = $input['postType'] ?? 'announcement';
    $delta = isset($input['delta']) ? (int)$input['delta'] : (isset($input['isLiked']) && $input['isLiked'] ? 1 : -1);
    if ($postId) {
        try {
            if ($postType === 'announcement') {
                $stmt = $pdo->prepare("UPDATE announcements SET likes_count = GREATEST(0, likes_count + :delta) WHERE id = :pid");
                $stmt->execute([':delta' => $delta, ':pid' => $postId]);
            } else {
                $stmt = $pdo->prepare("UPDATE events SET attendees_count = GREATEST(0, attendees_count) WHERE id = :pid");
                $stmt->execute([':pid' => $postId]);
            }
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        exit;
    }
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'postId wajib']);
    exit;
}

// ==========================================
// 11. ENDPOINTS FITUR BATAS AL-QUR'AN (BOOKMARK)
// ==========================================
if ($action === 'get_quran_bookmark') {
    ensureTablesExist($pdo);
    $userId = $_GET['user_id'] ?? $_GET['userId'] ?? '';
    if ($userId) {
        try {
            $stmt = $pdo->prepare("SELECT * FROM user_quran_bookmarks WHERE user_id = :uid");
            $stmt->execute([':uid' => $userId]);
            $row = $stmt->fetch();
            if ($row) {
                $bm = !empty($row['bookmarks_json']) ? json_decode($row['bookmarks_json'], true) : [];
                echo json_encode([
                    'success' => true,
                    'data' => [
                        'lr' => ['s' => (int)$row['surah_id'], 'v' => (int)$row['verse_number']],
                        'page' => (int)($row['page_number'] ?? 1),
                        'bm' => is_array($bm) ? $bm : []
                    ]
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }
        } catch (Exception $e) {
            // fall through
        }
    }
    echo json_encode(['success' => true, 'data' => null]);
    exit;
}

if ($action === 'save_quran_bookmark' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    ensureTablesExist($pdo);
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = $input['userId'] ?? $input['user_id'] ?? '';
    $lr = $input['lr'] ?? null;
    $bm = $input['bm'] ?? null;
    $page = $input['page'] ?? $input['curPage'] ?? 1;
    if ($userId && $lr && isset($lr['s']) && isset($lr['v'])) {
        try {
            $bmJson = $bm ? json_encode($bm) : null;
            $sql = "INSERT INTO user_quran_bookmarks (user_id, surah_id, verse_number, page_number, bookmarks_json, updated_at)
                    VALUES (:uid, :sid, :vnum, :pnum, :bm, NOW())
                    ON DUPLICATE KEY UPDATE surah_id = VALUES(surah_id), verse_number = VALUES(verse_number), page_number = VALUES(page_number), bookmarks_json = VALUES(bookmarks_json), updated_at = NOW()";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':uid' => $userId,
                ':sid' => (int)$lr['s'],
                ':vnum' => (int)$lr['v'],
                ':pnum' => (int)$page,
                ':bm' => $bmJson,
            ]);
            echo json_encode(['success' => true, 'message' => 'Batas bacaan Al-Qur\'an berhasil disimpan di database']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        exit;
    }
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'userId dan data lr wajib']);
    exit;
}

echo json_encode(['success' => false, 'message' => 'Aksi tidak ditemukan']);


