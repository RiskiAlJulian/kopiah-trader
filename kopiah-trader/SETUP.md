# KOPIAH TRADER — Panduan Setup & Update

## 1. Cara memperbarui project (cukup sekali jalan)

Setiap ada pembaruan, kamu menerima **satu zip lengkap** bernama `kopiah-trader-lengkap.zip`.

1. Ekstrak zip. Hasilnya langsung berisi `package.json`, `src`, `api`, `public`, dst. (tidak ada folder tambahan).
2. Buka folder project kamu yang berisi `package.json`.
3. Di folder hasil ekstrak: **Ctrl+A** lalu **Ctrl+C**. Di folder project: **Ctrl+V**, pilih **Replace the files in the destination**.
4. Di terminal VS Code (dari folder project):
   ```
   git add .
   git commit -m "Update"
   git push
   ```
5. Tunggu deployment Vercel berstatus **Ready**, lalu buka lewat tab Incognito.

Cek cepat sebelum commit: `git status` hanya boleh menampilkan file yang memang berubah.
Kalau muncul folder `src/src` atau `index.html` di dalam `src`, berarti paste-nya salah tempat.

## 2. File isi konten (ikut di zip)

| File | Isinya |
|---|---|
| `src/data/live.ts` | Link TikTok/YouTube/Instagram dan jadwal live |
| `src/data/videos.ts` | Daftar video edukasi (kosong = bagian Video tersembunyi) |

Dua file ini ikut di zip dengan isi terakhir yang saya ketahui. **Kalau kamu mengubahnya sendiri**, kirim isi barunya ke saya
supaya ikut di zip berikutnya. Kalau tidak, update berikutnya akan menimpanya dengan isi lama.

`.env` (kunci API) **tidak** ikut di zip karena rahasia. Buat sendiri dari `.env.example`.

## 3. Environment variables

**Komputer (file `.env`)**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `TWELVE_DATA_API_KEY`

**Vercel (Settings → Environment Variables)**: keempat di atas, ditambah di tabel ini. Key rahasia **tanpa** awalan `VITE_`
supaya tidak ikut ke browser. Variabel lama `VITE_TWELVE_DATA_API_KEY` dan `VITE_FMP_API_KEY` **hapus**; `FMP_API_KEY` juga tidak dipakai lagi dari Vercel dan `.env`.

| Name | Fungsi |
|---|---|
| `TWELVE_DATA_API_KEY` | Data panel Analysis (lewat `api/market.js`) |
| `GEMINI_API_KEY` | Menyalakan AI umum (tanpa awalan `VITE_`). Key dari aistudio.google.com/apikey |
| `GEMINI_MODEL` | Opsional. Kosong = otomatis mencoba `gemini-3.8-flash`, lalu model cadangan bila gagal/dipensiunkan |

Setelah menambah/mengubah environment variable, lakukan **Redeploy** (Deployments → titik tiga → Redeploy).

## 4. Setup sekali saja

- [ ] Supabase: SQL Editor → paste isi `supabase/schema.sql` → Run
- [ ] Supabase: Authentication → Sign In / Providers → pastikan Email aktif
- [ ] Vercel: Root Directory = folder yang berisi `package.json`
- [ ] Vercel: semua environment variable di atas sudah diisi

## 5. Kalau ada masalah

| Gejala | Penyebab umum |
|---|---|
| 404 saat refresh halaman | `vercel.json` tidak berada sejajar `package.json` |
| AI bilang "belum tersambung" | `GEMINI_API_KEY` belum ada, atau belum Redeploy |
| AI bilang "sedang bermasalah" | Lihat Vercel → Logs, cari `gemini ... gagal`. Pesan error Google menyebut penyebabnya (model dipensiunkan, kuota habis, dll) |
| Deploy Error | Buka deployment → Build Logs, baca baris merah paling atas |
| News kosong | Feed gratis Forex Factory sedang tidak bisa diakses; buka `/api/calendar` untuk melihat pesan errornya |

## Lupa password (Supabase)
Di Supabase: Authentication > URL Configuration, isi **Site URL** dengan alamat situs kamu
dan tambahkan `https://DOMAIN-KAMU/reset-password` (serta `http://localhost:5173/reset-password`
untuk tes lokal) ke **Redirect URLs**. Tanpa ini, tautan di email tidak akan mengarah ke halaman reset.


## Sinyal otomatis dan Jurnal Analis
1. **Database**: Supabase > SQL Editor > New query > tempel isi `supabase/analyst-signals.sql` > Run. Skrip ini membuat ulang tabel dan menolak berjalan jika jurnal sudah berisi sinyal.
2. **Vercel > Environment Variables** (Production), tanpa awalan `VITE_`:
   - `SUPABASE_SERVICE_ROLE_KEY`: dari Supabase > Settings > API > `service_role` (RAHASIA, aktifkan Sensitive).
   - `CRON_SECRET`: kata sandi acak panjang buatanmu sendiri.
   Lalu **Redeploy**.
3. **Penjadwal**: Vercel Hobby hanya mengizinkan cron 1x sehari, jadi pakai layanan luar seperti cron-job.org:
   URL `https://DOMAIN-KAMU/api/analyst-run`, metode GET, tiap 5 menit, header
   `Authorization: Bearer ISI_CRON_SECRET`.
4. **Cek**: dari Git Bash, `curl -H "Authorization: Bearer ISI_CRON_SECRET" https://DOMAIN-KAMU/api/analyst-run`
   harus menjawab `{"ok":true,...}`.

Aturan strategi ada di bagian `CONFIG` dan komentar kepala file `api/_lib/zoneSignals.js`.
Sinyal berjalan di 5 timeframe (5M, 15M, 1H, 4H, 1D). Penjadwal tetap tiap 5 menit; server sendiri yang mengatur
seberapa sering tiap timeframe diambil (5M tiap 5 menit, 15M tiap 15, 1H tiap 30, 4H tiap 60, 1D tiap 240 menit),
sehingga total sekitar 460 request Twelve Data per hari dari kuota gratis 800. Tes manual semua timeframe sekaligus:
tambahkan `?force=1` di akhir URL, atau satu timeframe saja dengan `?tf=1H`.
