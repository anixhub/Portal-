# PANDUAN INTEGRASI DATABASE & KONTEKS SISTEM
## Portal Alumni Pondok Pesantren At-Taroqqy (attaroqqy.com)

Dokumen ini dibuat sebagai referensi lengkap untuk pengembang atau AI lain yang melanjutkan pengembangan aplikasi Portal Alumni Ponpes At-Taroqqy.

---

### 1. Informasi Server & Database Hostinger
* **Domain Website:** `https://attaroqqy.com`
* **File Endpoint API:** `https://attaroqqy.com/api_alumni.php` (berada di folder `public_html/api_alumni.php`)
* **Host Database:** `localhost`
* **Nama Database MySQL:** `u648273511_attaroqqy`
* **Username MySQL:** `u648273511_attaroqqy`
* **Password MySQL:** `199722Attar@`
* **Tabel Utama:** `santri`

---

### 2. Aturan Status Keanggotaan Santri vs Alumni
* Di tabel `santri`, kolom **`status_keanggotaan`** membedakan santri aktif dan alumni.
* Untuk santri yang sudah menjadi alumni, nilai status adalah: **`Alumni`** (menggunakan huruf **A kapital**).
* Query pengambilan data hanya memuat santri dengan:
  ```sql
  WHERE status_keanggotaan = 'Alumni' 
     OR LOWER(status_keanggotaan) = 'alumni'
     OR status_keanggotaan LIKE '%Alumni%'
  ```
* Setiap kali ada penambahan atau pengubahan profil dari portal alumni, sistem memastikan `status_keanggotaan = 'Alumni'`.

---

### 3. Struktur Kolom Tabel `santri`
Kolom-kolom di tabel `santri` MySQL:
1. `id` (VARCHAR / Primary Key)
2. `nis` (Nomor Induk Santri Pesantren)
3. `nism` (Nomor Induk Santri Madrasah - jika kosong bernilai empty string/null)
4. `nisn` (Nomor Induk Siswa Nasional - jika kosong bernilai empty string/null)
5. `nama` (Nama Lengkap Santri)
6. `username` (Username login alumni)
7. `nik` (Nomor Induk Kependudukan KTP)
8. `no_kk` (Nomor Kartu Keluarga)
9. `gender` (Tersimpan sebagai 'Putra' atau 'Putri')
10. `tempat_lahir`
11. `tanggal_lahir` (Format DATE YYYY-MM-DD)
12. `anak_ke` (Urutan anak dalam keluarga, INT)
13. `dari_bersaudara` (Jumlah bersaudara, INT)
14. `nama_ayah` (Nama asli ayah kandung)
15. `nik_ayah` (NIK KTP Ayah)
16. `pekerjaan_ayah`
17. `pendidikan_ayah`
18. `nama_ibu` (Nama asli ibu kandung)
19. `nik_ibu` (NIK KTP Ibu)
20. `pekerjaan_ibu`
21. `pendidikan_ibu`
22. `alamat` (Alamat jalan / RT / RW)
23. `desa`
24. `kecamatan`
25. `kabupaten` (Kota / Kabupaten)
26. `provinsi`
27. `no_hp` (Nomor WhatsApp / Telepon)
28. `email`
29. `pekerjaan` (Pekerjaan alumni saat ini)
30. `instansi` (Tempat kerja / kampus alumni saat ini)
31. `status_keanggotaan` ('Alumni' / 'santri aktif')
32. `tahun_lulus` (Tahun lulus alumni)
33. `tanggal_masuk` (Tanggal masuk pesantren)
34. `tanggal_keluar` (Tanggal keluar / boyong pesantren)
35. `kamar` (Asrama / komplek kamar saat di pondok)
36. `password` (Kata sandi login akun, default '1234')
37. `is_password_changed` (TINYYINT 1/0, apakah sudah pernah ganti sandi awal)
38. `file_pas_foto` (URL foto profil atau data image)
39. `foto_sampul` (URL foto banner/sampul)
40. `bio` (Biografi singkat alumni)
41. `latitude` (Koordinat GPS rumah/domisili)
42. `longitude` (Koordinat GPS rumah/domisili)
43. `share_contact` (TINYINT 1/0, izin nomor HP tampil ke sesama alumni)

---

### 4. Struktur Tabel Database Fitur Lengkap (`database_portal_alumni_schema.sql`)
Seluruh query pembuatan dan pembaruan tabel telah dirangkum dalam file `database_portal_alumni_schema.sql`:

1. **`santri`** (Master data santri & alumni Ponpes At-Taroqqy)
2. **`admin_users`** (Akun administrator & pengurus alumni se-Indonesia)
3. **`events`** (Agenda reuni, haul masyayikh, kajian, dan korda)
4. **`event_rsvps`** (Data konfirmasi kehadiran alumni pada event: hadir, belum pasti, tidak hadir)
5. **`announcements`** (Maklumat resmi pengasuh, kabar santri asuh, beasiswa, dan agenda)
6. **`post_comments`** (Diskusi & tanggapan komentar postingan maklumat dan event)
7. **`post_likes`** (Sistem like/suka postingan)
8. **`attendance_sessions`** (Sesi presensi kehadiran acara / pertemuan)
9. **`attendance_attendees`** (Peserta yang telah check-in presensi via QR Scanner atau manual)
10. **`alumni_bills`** (Iuran alumni, syahriyah, dan wakaf pembangunan)
11. **`notifications`** (Pemberitahuan sistem & notifikasi balasan akun)

---

### 5. API Endpoints Sinkronisasi Lengkap (`api_alumni.php`)
Sistem menyediakan endpoint lengkap:
* **Migrasi Database Otomatis Satu Klik:**
  `GET https://attaroqqy.com/api_alumni.php?action=migrate_db` -> Otomatis membuat seluruh tabel di atas jika belum ada di database Hostinger.
* **Alumni:** `?action=get_alumni`, `?action=update_alumni`, `?action=add_alumni`, `?action=delete_alumni`
* **Agenda / Events:** `?action=get_events`, `?action=save_event`, `?action=delete_event`
* **Maklumat / Announcements:** `?action=get_announcements`, `?action=save_announcement`, `?action=delete_announcement`
* **Kelola Akun Admin:** `?action=get_admin_users`, `?action=save_admin_user`, `?action=delete_admin_user`
* **Presensi QR Scanner:** `?action=get_attendance_sessions`, `?action=checkin_attendee`

---

### 6. File Terkait di Codebase
* `/database_portal_alumni_schema.sql`: Berkas query SQL murni lengkap yang siap diimpor ke phpMyAdmin.
* `/api_alumni.php` & `/public/api_alumni.php`: Salinan script PHP backend dengan auto-migrator siap pakai.
* `src/services/apiService.ts`: Modul pemanggil API Hostinger & Express.
* `server.ts`: Server backend lokal dan proxy API.
