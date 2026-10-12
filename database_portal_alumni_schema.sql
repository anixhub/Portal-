-- ==============================================================================
-- SKEMA STRUKTUR DATABASE LENGKAP & QUERY PEMBUATAN TABEL PORTAL ALUMNI
-- Pondok Pesantren At-Taroqqy (https://attaroqqy.com)
-- Database: u648273511_attaroqqy
-- Engine: InnoDB, Charset: utf8mb4_unicode_ci
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. TABEL UTAMA: santri (Master Data Santri & Alumni Terintegrasi)
-- Catatan: Status Keanggotaan alumni adalah 'Alumni' (dengan A kapital)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `santri` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `nis` VARCHAR(32) DEFAULT NULL,
  `nism` VARCHAR(32) DEFAULT NULL,
  `nisn` VARCHAR(32) DEFAULT NULL,
  `nama` VARCHAR(150) NOT NULL,
  `username` VARCHAR(80) DEFAULT NULL,
  `nik` VARCHAR(32) DEFAULT NULL,
  `no_kk` VARCHAR(32) DEFAULT NULL,
  `gender` ENUM('Putra', 'Putri', 'L', 'P') DEFAULT 'Putra',
  `tempat_lahir` VARCHAR(80) DEFAULT NULL,
  `tanggal_lahir` DATE DEFAULT NULL,
  `anak_ke` INT(11) DEFAULT 1,
  `dari_bersaudara` INT(11) DEFAULT 0,
  `nama_ayah` VARCHAR(150) DEFAULT NULL,
  `nik_ayah` VARCHAR(32) DEFAULT NULL,
  `pekerjaan_ayah` VARCHAR(100) DEFAULT NULL,
  `pendidikan_ayah` VARCHAR(80) DEFAULT NULL,
  `nama_ibu` VARCHAR(150) DEFAULT NULL,
  `nik_ibu` VARCHAR(32) DEFAULT NULL,
  `pekerjaan_ibu` VARCHAR(100) DEFAULT NULL,
  `pendidikan_ibu` VARCHAR(80) DEFAULT NULL,
  `alamat` TEXT DEFAULT NULL,
  `desa` VARCHAR(80) DEFAULT NULL,
  `kecamatan` VARCHAR(80) DEFAULT NULL,
  `kabupaten` VARCHAR(80) DEFAULT NULL,
  `provinsi` VARCHAR(80) DEFAULT NULL,
  `no_hp` VARCHAR(30) DEFAULT NULL,
  `email` VARCHAR(120) DEFAULT NULL,
  `pekerjaan` VARCHAR(100) DEFAULT NULL,
  `instansi` VARCHAR(150) DEFAULT NULL,
  `pendidikan_formal` VARCHAR(100) DEFAULT 'Madrasah Aliyah Keagamaan (MAK)',
  `kamar` VARCHAR(80) DEFAULT NULL,
  `status_keanggotaan` VARCHAR(40) DEFAULT 'Alumni',
  `tahun_lulus` VARCHAR(10) DEFAULT NULL,
  `tanggal_masuk` DATE DEFAULT NULL,
  `tanggal_keluar` DATE DEFAULT NULL,
  `password` VARCHAR(255) DEFAULT '1234',
  `is_password_changed` TINYINT(1) DEFAULT 0,
  `file_pas_foto` TEXT DEFAULT NULL,
  `foto_sampul` TEXT DEFAULT NULL,
  `bio` TEXT DEFAULT NULL,
  `latitude` DECIMAL(10, 8) DEFAULT NULL,
  `longitude` DECIMAL(11, 8) DEFAULT NULL,
  `share_contact` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_status_keanggotaan` (`status_keanggotaan`),
  INDEX `idx_username` (`username`),
  INDEX `idx_nis` (`nis`),
  INDEX `idx_nik` (`nik`),
  INDEX `idx_tahun_lulus` (`tahun_lulus`),
  INDEX `idx_kabupaten` (`kabupaten`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Query pembaruan kolom untuk tabel santri yang sudah ada sebelumnya (jika ada kolom yang belum ada):
ALTER TABLE `santri` 
  ADD COLUMN IF NOT EXISTS `nism` VARCHAR(32) DEFAULT NULL AFTER `nis`,
  ADD COLUMN IF NOT EXISTS `nisn` VARCHAR(32) DEFAULT NULL AFTER `nism`,
  ADD COLUMN IF NOT EXISTS `username` VARCHAR(80) DEFAULT NULL AFTER `nama`,
  ADD COLUMN IF NOT EXISTS `no_kk` VARCHAR(32) DEFAULT NULL AFTER `nik`,
  ADD COLUMN IF NOT EXISTS `anak_ke` INT(11) DEFAULT 1 AFTER `tanggal_lahir`,
  ADD COLUMN IF NOT EXISTS `dari_bersaudara` INT(11) DEFAULT 0 AFTER `anak_ke`,
  ADD COLUMN IF NOT EXISTS `nama_ayah` VARCHAR(150) DEFAULT NULL AFTER `dari_bersaudara`,
  ADD COLUMN IF NOT EXISTS `nik_ayah` VARCHAR(32) DEFAULT NULL AFTER `nama_ayah`,
  ADD COLUMN IF NOT EXISTS `pekerjaan_ayah` VARCHAR(100) DEFAULT NULL AFTER `nik_ayah`,
  ADD COLUMN IF NOT EXISTS `pendidikan_ayah` VARCHAR(80) DEFAULT NULL AFTER `pekerjaan_ayah`,
  ADD COLUMN IF NOT EXISTS `nama_ibu` VARCHAR(150) DEFAULT NULL AFTER `pendidikan_ayah`,
  ADD COLUMN IF NOT EXISTS `nik_ibu` VARCHAR(32) DEFAULT NULL AFTER `nama_ibu`,
  ADD COLUMN IF NOT EXISTS `pekerjaan_ibu` VARCHAR(100) DEFAULT NULL AFTER `nik_ibu`,
  ADD COLUMN IF NOT EXISTS `pendidikan_ibu` VARCHAR(80) DEFAULT NULL AFTER `pekerjaan_ibu`,
  ADD COLUMN IF NOT EXISTS `tanggal_masuk` DATE DEFAULT NULL AFTER `tahun_lulus`,
  ADD COLUMN IF NOT EXISTS `tanggal_keluar` DATE DEFAULT NULL AFTER `tanggal_masuk`,
  ADD COLUMN IF NOT EXISTS `is_password_changed` TINYINT(1) DEFAULT 0 AFTER `password`,
  ADD COLUMN IF NOT EXISTS `foto_sampul` TEXT DEFAULT NULL AFTER `file_pas_foto`,
  ADD COLUMN IF NOT EXISTS `latitude` DECIMAL(10, 8) DEFAULT NULL AFTER `bio`,
  ADD COLUMN IF NOT EXISTS `longitude` DECIMAL(11, 8) DEFAULT NULL AFTER `latitude`,
  ADD COLUMN IF NOT EXISTS `share_contact` TINYINT(1) DEFAULT 1 AFTER `longitude`;

-- ------------------------------------------------------------------------------
-- 2. TABEL: admin_users (Akun Pengurus & Administrator Portal)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `username` VARCHAR(80) NOT NULL UNIQUE,
  `email` VARCHAR(120) DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL DEFAULT '1997',
  `role` ENUM('super_admin', 'pengurus_pondok') NOT NULL DEFAULT 'pengurus_pondok',
  `jabatan` VARCHAR(150) NOT NULL DEFAULT 'Pengurus Ikatan Alumni',
  `region_level` ENUM('pusat', 'provinsi', 'kota', 'kecamatan') NOT NULL DEFAULT 'pusat',
  `avatar` TEXT DEFAULT NULL,
  `cover_photo_url` TEXT DEFAULT NULL,
  `bio` TEXT DEFAULT NULL,
  `phone` VARCHAR(30) DEFAULT NULL,
  `province` VARCHAR(80) DEFAULT 'Jawa Timur',
  `city` VARCHAR(80) DEFAULT NULL,
  `kecamatan` VARCHAR(80) DEFAULT NULL,
  `desa` VARCHAR(80) DEFAULT NULL,
  `alamat_lengkap` TEXT DEFAULT NULL,
  `latitude` DECIMAL(10, 8) DEFAULT NULL,
  `longitude` DECIMAL(11, 8) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_admin_username` (`username`),
  INDEX `idx_admin_level` (`region_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data Awal Administrator Default:
INSERT INTO `admin_users` (`id`, `name`, `username`, `email`, `password`, `role`, `jabatan`, `region_level`, `created_at`) 
VALUES 
('adm-001', 'Ust. H. Abdurrahman, M.Pd.', '@admin_pusat', 'admin_pusat@attaroqqy.com', '1997', 'super_admin', 'Kepala Bidang Kesantrian & Alumni Ponpes At-taroqqy', 'pusat', NOW())
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `role` = VALUES(`role`), `jabatan` = VALUES(`jabatan`);

-- ------------------------------------------------------------------------------
-- 3. TABEL: events (Agenda & Kegiatan Alumni)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `events` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `date` VARCHAR(80) NOT NULL,
  `time` VARCHAR(80) DEFAULT NULL,
  `location` VARCHAR(255) NOT NULL,
  `category` ENUM('reuni', 'haul', 'kajian', 'korda') NOT NULL DEFAULT 'reuni',
  `description` TEXT DEFAULT NULL,
  `poster_url` TEXT DEFAULT NULL,
  `images` LONGTEXT DEFAULT NULL COMMENT 'JSON array of image URLs',
  `author_name` VARCHAR(150) DEFAULT NULL,
  `author_handle` VARCHAR(80) DEFAULT NULL,
  `author_avatar` TEXT DEFAULT NULL,
  `target_gender` ENUM('semua', 'L', 'P') DEFAULT 'semua',
  `target_region_scope` ENUM('semua', 'khusus') DEFAULT 'semua',
  `target_province_name` VARCHAR(80) DEFAULT NULL,
  `target_regency_name` VARCHAR(80) DEFAULT NULL,
  `target_district_name` VARCHAR(80) DEFAULT NULL,
  `target_village_name` VARCHAR(80) DEFAULT NULL,
  `attendees_count` INT(11) DEFAULT 0,
  `absent_count` INT(11) DEFAULT 0,
  `posted_at` VARCHAR(80) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_event_category` (`category`),
  INDEX `idx_event_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. TABEL: event_rsvps (Konfirmasi Kehadiran Alumni pada Event)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `event_rsvps` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `event_id` VARCHAR(64) NOT NULL,
  `alumni_id` VARCHAR(64) NOT NULL,
  `status` ENUM('hadir', 'belum_pasti', 'tidak_hadir') NOT NULL DEFAULT 'hadir',
  `note` TEXT DEFAULT NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_event_alumni` (`event_id`, `alumni_id`),
  INDEX `idx_event_rsvp` (`event_id`, `status`),
  CONSTRAINT `fk_rsvp_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. TABEL: announcements (Kabar & Maklumat Pondok / Alumni)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `date` VARCHAR(80) NOT NULL,
  `category` ENUM('maklumat', 'kegiatan', 'beasiswa', 'umum') NOT NULL DEFAULT 'maklumat',
  `content` LONGTEXT NOT NULL,
  `author_name` VARCHAR(150) NOT NULL,
  `author_handle` VARCHAR(80) DEFAULT NULL,
  `author_avatar` TEXT DEFAULT NULL,
  `author_role` VARCHAR(150) DEFAULT NULL,
  `is_important` TINYINT(1) DEFAULT 0,
  `images` LONGTEXT DEFAULT NULL COMMENT 'JSON array of image URLs',
  `target_gender` ENUM('semua', 'L', 'P') DEFAULT 'semua',
  `target_region_scope` ENUM('semua', 'khusus') DEFAULT 'semua',
  `target_province_name` VARCHAR(80) DEFAULT NULL,
  `target_regency_name` VARCHAR(80) DEFAULT NULL,
  `target_district_name` VARCHAR(80) DEFAULT NULL,
  `target_village_name` VARCHAR(80) DEFAULT NULL,
  `likes_count` INT(11) DEFAULT 0,
  `comments_count` INT(11) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_ann_category` (`category`),
  INDEX `idx_ann_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. TABEL: post_comments (Komentar & Diskusi untuk Event dan Maklumat)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `post_comments` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `post_type` ENUM('event', 'announcement') NOT NULL DEFAULT 'event',
  `post_id` VARCHAR(64) NOT NULL,
  `parent_comment_id` VARCHAR(64) DEFAULT NULL,
  `author_id` VARCHAR(64) DEFAULT NULL,
  `author_name` VARCHAR(150) NOT NULL,
  `author_handle` VARCHAR(80) DEFAULT NULL,
  `author_avatar` TEXT DEFAULT NULL,
  `avatar_ring` TINYINT(1) DEFAULT 0,
  `status` ENUM('hadir', 'tidak_hadir', 'netral') DEFAULT 'netral',
  `content` TEXT NOT NULL,
  `likes_count` INT(11) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_post_ref` (`post_type`, `post_id`),
  INDEX `idx_parent_comment` (`parent_comment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. TABEL: post_likes (Daftar Suka / Like Pengguna pada Postingan & Komentar)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `post_likes` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `target_type` ENUM('announcement', 'event', 'comment') NOT NULL,
  `target_id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_like_user_target` (`target_type`, `target_id`, `user_id`),
  INDEX `idx_target_likes` (`target_type`, `target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. TABEL: attendance_sessions (Sesi Presensi Kehadiran Acara / Scanner QR)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `attendance_sessions` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `date` VARCHAR(80) NOT NULL,
  `source_event_id` VARCHAR(64) DEFAULT NULL,
  `source_type` ENUM('imported', 'manual') NOT NULL DEFAULT 'manual',
  `total_attendees` INT(11) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_session_event` (`source_event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. TABEL: attendance_attendees (Detail Peserta Hadir Presensi per Sesi)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `attendance_attendees` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `session_id` VARCHAR(64) NOT NULL,
  `alumni_id` VARCHAR(64) NOT NULL,
  `alumni_name` VARCHAR(150) NOT NULL,
  `alumni_nis` VARCHAR(32) DEFAULT NULL,
  `gender` ENUM('Putra', 'Putri', 'L', 'P') DEFAULT 'Putra',
  `desa` VARCHAR(80) DEFAULT NULL,
  `kecamatan` VARCHAR(80) DEFAULT NULL,
  `city` VARCHAR(80) DEFAULT NULL,
  `address_text` TEXT DEFAULT NULL,
  `grad_year` VARCHAR(10) DEFAULT NULL,
  `jenjang` VARCHAR(100) DEFAULT NULL,
  `photo_url` TEXT DEFAULT NULL,
  `check_in_time` VARCHAR(40) NOT NULL,
  `method` ENUM('qr', 'manual') NOT NULL DEFAULT 'qr',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_session_alumni` (`session_id`, `alumni_id`),
  INDEX `idx_attendee_session` (`session_id`),
  INDEX `idx_attendee_alumni` (`alumni_id`),
  CONSTRAINT `fk_attendee_session` FOREIGN KEY (`session_id`) REFERENCES `attendance_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. TABEL: alumni_bills (Tagihan Keuangan, Iuran & Syahriyah Alumni)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `alumni_bills` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `alumni_id` VARCHAR(64) DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `category` ENUM('Pondok', 'Alumni', 'Wakaf', 'Lainnya') NOT NULL DEFAULT 'Alumni',
  `is_paid` TINYINT(1) DEFAULT 0,
  `due_date` VARCHAR(80) DEFAULT NULL,
  `paid_at` VARCHAR(80) DEFAULT NULL,
  `payment_method` VARCHAR(80) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_bill_alumni` (`alumni_id`),
  INDEX `idx_bill_status` (`is_paid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. TABEL: notifications (Pemberitahuan Sistem & Notifikasi Akun)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `recipient_id` VARCHAR(64) NOT NULL COMMENT 'ID Alumni atau Admin',
  `type` ENUM('reply', 'system', 'finance', 'like') NOT NULL DEFAULT 'system',
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `time_str` VARCHAR(80) DEFAULT NULL,
  `author_name` VARCHAR(150) DEFAULT NULL,
  `tag` VARCHAR(80) DEFAULT NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_notif_recipient` (`recipient_id`),
  INDEX `idx_notif_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
