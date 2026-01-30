# Panduan Deployment ke Render.com

Panduan ini akan membantu Anda men-deploy aplikasi Financial Planner (Frontend + Backend + Database) ke Render.com.

Karena proyek ini menggunakan **Monorepo** (folder terpisah untuk `frontend` dan `backend`), kita perlu mengatur dua layanan terpisah di Render.

## 1. Persiapan Awal

Pastikan kode Anda sudah di-push ke GitHub/GitLab. Pastikan juga folder `apps/backend/drizzle` (file migrasi database) sudah ada dan ikut ter-commit.

## 2. Membuat Database PostgreSQL

1.  Login ke [Dashboard Render](https://dashboard.render.com/).
2.  Klik tombol **New +** dan pilih **PostgreSQL**.
3.  Isi konfigurasi:
    *   **Name**: `financial-planner-db` (atau nama lain yang Anda suka).
    *   **Region**: Pilih yang terdekat (misal: Singapore).
    *   **PostgreSQL Version**: 15 or 16 (default is fine).
    *   **Tier**: Free (untuk percobaan).
4.  Klik **Create Database**.
5.  Setelah selesai dibuat, cari bagian **Connection Info**.
    *   Salin **Internal Database URL** (biasanya dimulai dengan `postgres://...`). Kita akan memakainya di Backend.

## 3. Men-deploy Backend (Web Service)

1.  Di Dashboard Render, klik **New +** dan pilih **Web Service**.
2.  Hubungkan repositori GitHub/GitLab Anda.
3.  Isi konfigurasi:
    *   **Name**: `financial-planner-api`
    *   **Region**: Sama dengan database (misal: Singapore).
    *   **Runtime**: **Node**
    *   **Root Directory**: `apps/backend` (PENTING: Jangan kosongkan ini).
    *   **Build Command**: `npm install && npm run build`
    *   **Start Command**: `npm run db:migrate && npm run start`
        *   *Catatan: Perintah ini akan menjalankan migrasi database setiap kali server restart untuk memastikan struktur database terbaru.*
4.  Scroll ke bawah ke bagian **Environment Variables** dan tambahkan:
    *   `DATABASE_URL`: Paste **Internal Database URL** yang tadi disalin.
    *   `BETTER_AUTH_SECRET`: Isi dengan string acak yang panjang (besar kecil angka simbol bebas).
    *   `NODE_ENV`: `production`
    *   `PORT`: `3001` (Opsional, tapi praktik yang baik).
5.  Klik **Create Web Service**.
6.  Tunggu hingga deploy selesai. Jika sukses, Anda akan melihat status **Live**.
7.  Salin URL backend Anda (misal: `https://financial-planner-api.onrender.com`).

**Update Environment Variable Backend:**
Setelah URL didapatkan, tambahkan variable berikut di setting Web Service Backend tadi:
*   `BETTER_AUTH_URL`: `https://financial-planner-api.onrender.com` (Ganti dengan URL backend Anda).
*   `FRONTEND_URL`: (Kita akan isi ini nanti setelah Frontend jadi).

## 4. Men-deploy Frontend (Static Site)

1.  Di Dashboard Render, klik **New +** dan pilih **Static Site**.
2.  Hubungkan repositori yang sama.
3.  Isi konfigurasi:
    *   **Name**: `financial-planner-web`
    *   **Root Directory**: `apps/frontend` (PENTING).
    *   **Build Command**: `npm install && npm run build`
    *   **Publish Directory**: `dist`
4.  Masuk ke tab **Environment Variables**, tambahkan:
    *   `VITE_API_URL`: `https://financial-planner-api.onrender.com`  (URL Backend dari langkah 3).
5.  **PENTING: Konfigurasi Redirect/Rewrite (Untuk SPA Router)**
    *   Masuk ke tab **Redirects/Rewrites**.
    *   Klik **Add Rule**.
    *   **Source**: `/*`
    *   **Destination**: `/index.html`
    *   **Action**: `Rewrite`
    *   *Penjelasan: Ini memastikan jika user me-refresh halaman seperti /dashboard, server akan tetap menyajikan index.html agar React Router bisa bekerja.*
6.  Klik **Create Static Site**.
7.  Tunggu deploy selesai. Salin URL Frontend Anda (misal: `https://financial-planner-web.onrender.com`).

## 5. Langkah Terakhir: Menghubungkan Frontend ke Backend

1.  Kembali ke dashboard **Backend Web Service** Anda.
2.  Masuk ke menu **Environment Variables**.
3.  Tambahkan/Update variable:
    *   `FRONTEND_URL`: `https://financial-planner-web.onrender.com` (URL Frontend Anda).
    *   *Ini penting agar konfigurasi CORS di backend mengizinkan request dari frontend Anda.*
4.  Save Changes. Render akan otomatis me-restart backend Anda.

## Selesai!

Aplikasi Anda sekarang seharusnya sudah live.
- Buka URL Frontend.
- Coba Register/Login.
- Cek apakah data tersimpan.
