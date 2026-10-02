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
            $rawGender = trim($row['gender'] ?? '');
            $isPutri = (stripos($rawGender, 'putri') !== false || stripos($rawGender, 'p') === 0 || stripos($rawGender, 'perempuan') !== false);

            $alumni[] = [
                'id' => (string)($row['id'] ?? ''),
                'nik' => $row['nik'] ?? '',
                'noKk' => $row['no_kk'] ?? '',
                'nis' => $row['nis'] ?? '',
                'nism' => $row['nism'] ?? '',
                'nisn' => $row['nisn'] ?? '',
                'name' => $row['nama'] ?? '',
                'username' => !empty($row['username']) ? $row['username'] : (strtolower(str_replace(' ', '_', $row['nama'] ?? '')) ?: 'santri_' . $row['id']),
                'gender' => $isPutri ? 'P' : 'L',
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
                'avatarUrl' => $row['file_pas_foto'] ?? '',
                'coverPhotoUrl' => $row['foto_sampul'] ?? '',
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
        if (isset($input['name'])) { $fields[] = "nama = :name"; $params[':name'] = $input['name']; }
        if (isset($input['username'])) { $fields[] = "username = :username"; $params[':username'] = $input['username']; }
        if (isset($input['gender'])) { $fields[] = "gender = :gender"; $params[':gender'] = ($input['gender'] === 'P') ? 'Putri' : 'Putra'; }
        if (isset($input['tempatLahir'])) { $fields[] = "tempat_lahir = :tempatLahir"; $params[':tempatLahir'] = $input['tempatLahir']; }
        if (isset($input['tanggalLahir'])) { $fields[] = "tanggal_lahir = :tanggalLahir"; $params[':tanggalLahir'] = $input['tanggalLahir']; }
        if (isset($input['urutanAnak'])) { $fields[] = "anak_ke = :anakKe"; $params[':anakKe'] = $input['urutanAnak']; }
        if (isset($input['jumlahSaudara'])) { $fields[] = "dari_bersaudara = :saudara"; $params[':saudara'] = $input['jumlahSaudara']; }

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
            $fields[] = "file_pas_foto = :avatarUrl"; 
            $params[':avatarUrl'] = $input['avatarUrl'] ?? $input['photoUrl']; 
        }
        if (isset($input['coverPhotoUrl'])) { $fields[] = "foto_sampul = :coverPhotoUrl"; $params[':coverPhotoUrl'] = $input['coverPhotoUrl']; }
        if (isset($input['password'])) { $fields[] = "password = :password"; $params[':password'] = $input['password']; }
        if (isset($input['isPasswordChanged'])) { $fields[] = "is_password_changed = :is_pwd"; $params[':is_pwd'] = $input['isPasswordChanged'] ? 1 : 0; }
        if (isset($input['shareContact'])) { $fields[] = "share_contact = :share_contact"; $params[':share_contact'] = $input['shareContact'] ? 1 : 0; }

        // Riwayat Keluar / Tahun Lulus
        if (isset($input['gradYear'])) { $fields[] = "tahun_lulus = :gradYear"; $params[':gradYear'] = $input['gradYear']; }
        if (isset($input['gradDate'])) { $fields[] = "tanggal_keluar = :gradDate"; $params[':gradDate'] = $input['gradDate']; }

        if (isset($input['coordinates'])) {
            $coords = $input['coordinates'];
            $fields[] = "latitude = :lat";
            $fields[] = "longitude = :lng";
            $params[':lat'] = $coords ? $coords['lat'] : null;
            $params[':lng'] = $coords ? $coords['lng'] : null;
        }

        if (!empty($fields)) {
            $sql = "UPDATE santri SET " . implode(", ", $fields) . " WHERE id = :id";
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
            id, nis, nama, nik, no_kk, gender, tempat_lahir, tanggal_lahir, 
            alamat, desa, kecamatan, kabupaten, provinsi, no_hp, email,
            pekerjaan, instansi, status_keanggotaan, tahun_lulus, kamar,
            password, is_password_changed, latitude, longitude,
            nama_ayah, nik_ayah, pekerjaan_ayah, pendidikan_ayah,
            nama_ibu, nik_ibu, pekerjaan_ibu, pendidikan_ibu,
            anak_ke, dari_bersaudara, created_at
        ) VALUES (
            :id, :nis, :nama, :nik, :no_kk, :gender, :tempat_lahir, :tanggal_lahir,
            :alamat, :desa, :kecamatan, :kabupaten, :provinsi, :no_hp, :email,
            :pekerjaan, :instansi, 'Alumni', :tahun_lulus, :kamar,
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

echo json_encode(['success' => false, 'message' => 'Aksi tidak ditemukan']);
