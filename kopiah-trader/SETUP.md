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

**Komputer (file `.env`)**: `VITE_TWELVE_DATA_API_KEY`, `VITE_FMP_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

**Vercel (Settings → Environment Variables)**: keempat di atas, ditambah:

| Name | Fungsi |
|---|---|
| `GEMINI_API_KEY` | Menyalakan AI umum (tanpa awalan `VITE_`). Key dari aistudio.google.com/apikey |
| `GEMINI_MODEL` | Opsional. Default `gemini-2.5-flash` |

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
| AI bilang "sedang bermasalah" | Lihat Vercel → Logs, cari `chat error` |
| Deploy Error | Buka deployment → Build Logs, baca baris merah paling atas |
| News kosong | Cek `VITE_FMP_API_KEY` |
