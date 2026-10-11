import * as ftp from 'basic-ftp';
import path from 'node:path';
import fs from 'node:fs';

async function deploy() {
  const rawHost = process.env.FTP_SERVER || '';
  const user = process.env.FTP_USERNAME || '';
  const password = process.env.FTP_PASSWORD || '';
  const port = Number(process.env.FTP_PORT) || 21;
  const customDir = process.env.FTP_SERVER_DIR;

  if (!rawHost || !user) {
    console.log('⚠️ FTP_SERVER atau FTP_USERNAME belum dikonfigurasi di GitHub Secrets.');
    console.log('ℹ️ Melewati proses deploy otomatis.');
    return;
  }

  const host = rawHost.replace(/^[a-zA-Z]+:\/\//, '').replace(/\/.*$/, '').trim();
  const distPath = path.resolve('dist');

  if (!fs.existsSync(distPath)) {
    console.error('❌ Folder dist/ tidak ditemukan. Pastikan npm run build sudah selesai.');
    process.exit(1);
  }

  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    console.log(`🔌 Menghubungkan ke FTP Hostinger: ${host}:${port} dengan user: ${user}...`);
    
    // Coba koneksi standar FTP
    await client.access({
      host,
      user,
      password,
      port,
      secure: false,
    });

    console.log('✅ Berhasil terhubung dan login ke FTP Hostinger!');

    // Cek daftar file di direktori saat ini
    const currentList = await client.list();
    const hasPublicHtml = currentList.some(item => item.name === 'public_html');

    let targetDir = '.';
    if (customDir && customDir.trim() !== '') {
      targetDir = customDir.trim();
    } else if (hasPublicHtml) {
      targetDir = 'public_html';
    } else {
      targetDir = '.';
    }

    console.log(`📂 Direktori target di Hostinger: "${targetDir}"`);
    if (targetDir !== '.') {
      await client.ensureDir(targetDir);
    }

    console.log(`🚀 Mengunggah semua file aplikasi (dist/) ke server...`);
    await client.uploadFromDir(distPath, targetDir);

    console.log('🎉 SELAMAT! Seluruh file berhasil diunggah ke Hostinger!');
    console.log('🌐 Website Anda kini aktif di: https://alumni.attaroqqy.com');
  } catch (err) {
    console.error('❌ Gagal saat melakukan deploy FTP:');
    console.error(err.message || err);

    if (String(err).includes('530') || String(err).toLowerCase().includes('login') || String(err).toLowerCase().includes('user')) {
      console.error('\n👉 Tips: Error 530 menunjukkan Username atau Password FTP salah.');
      console.error('   Silakan cek kembali password FTP di hPanel Hostinger atau reset password baru lalu perbarui secret FTP_PASSWORD di GitHub.');
    } else if (String(err).includes('ETIMEDOUT') || String(err).includes('ENOTFOUND')) {
      console.error('\n👉 Tips: Server FTP tidak dapat dihubungi. Pastikan IP FTP_SERVER benar (misal: 145.79.30.113).');
    }
    process.exit(1);
  } finally {
    client.close();
  }
}

deploy();
