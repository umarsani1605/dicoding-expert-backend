# Forum API

Back-End API aplikasi forum diskusi: registrasi pengguna, autentikasi, thread,
komentar, balasan komentar, dan menyukai komentar. Dibangun dengan Express dan
PostgreSQL, menerapkan Clean Architecture dan automation testing dengan 100%
test coverage, serta dilengkapi CI/CD melalui GitHub Actions.

## Arsitektur

Kode terbagi menjadi empat layer sesuai Clean Architecture:

| Layer | Lokasi | Isi |
| --- | --- | --- |
| Entities | `src/Domains` | Entitas bisnis dan kontrak repository (abstract class) |
| Use Case | `src/Applications/use_case` | Alur logika bisnis |
| Interface Adapter | `src/Interfaces`, `src/Infrastructures/repository` | Handler HTTP, middleware, implementasi repository |
| Frameworks | `src/Infrastructures` | Express server, koneksi PostgreSQL, container |

Autentikasi dilakukan di level interface (`src/Interfaces/http/middlewares/authentication.js`)
sehingga use case tetap bisa dipakai ulang di luar konteks HTTP.

## Menjalankan proyek

1. Pasang dependensi:

   ```
   npm install
   ```

2. Siapkan dua database PostgreSQL, satu untuk aplikasi dan satu untuk pengujian.

3. Salin konfigurasi environment ke `.env` (aplikasi) dan `.test.env` (pengujian):

   ```
   HOST=localhost
   PORT=5000

   PGHOST=localhost
   PGUSER=developer
   PGDATABASE=forumapi
   PGPASSWORD=supersecretpassword
   PGPORT=5432

   ACCESS_TOKEN_KEY=<rahasia>
   REFRESH_TOKEN_KEY=<rahasia>
   ACCESS_TOKEN_AGE=3000
   ```

4. Jalankan migrasi pada kedua database:

   ```
   npm run migrate up
   npm run migrate:test up
   ```

5. Jalankan server:

   ```
   npm run start:dev
   ```

## Pengujian

```
npm test              # seluruh unit, integration, dan functional test
npm run test:coverage # beserta laporan coverage
npm run lint          # pemeriksaan style guide
```

Pengujian integration dan functional membutuhkan database pengujian yang sudah
dimigrasi. Berkas `.test.env` dimuat otomatis oleh Vitest.

## Daftar endpoint

| Method | Path | Auth | Keterangan |
| --- | --- | --- | --- |
| POST | `/users` | - | Registrasi pengguna |
| POST | `/authentications` | - | Login |
| PUT | `/authentications` | - | Perbarui access token |
| DELETE | `/authentications` | - | Logout |
| POST | `/threads` | Bearer | Menambahkan thread |
| GET | `/threads/{threadId}` | - | Melihat detail thread beserta komentar dan balasan |
| POST | `/threads/{threadId}/comments` | Bearer | Menambahkan komentar |
| DELETE | `/threads/{threadId}/comments/{commentId}` | Bearer | Menghapus komentar (soft delete) |
| POST | `/threads/{threadId}/comments/{commentId}/replies` | Bearer | Menambahkan balasan |
| DELETE | `/threads/{threadId}/comments/{commentId}/replies/{replyId}` | Bearer | Menghapus balasan (soft delete) |
| PUT | `/threads/{threadId}/comments/{commentId}/likes` | Bearer | Menyukai atau batal menyukai komentar |

## Continuous Integration dan Deployment

Dua workflow GitHub Actions tersedia di `.github/workflows`:

- `ci.yml` berjalan pada setiap pull request ke `main`. Workflow ini memasang
  Node.js 22, menyalakan PostgreSQL sebagai service container, lalu menjalankan
  lint, migrasi database pengujian, dan seluruh test.
- `cd.yml` berjalan pada setiap push ke `main`. Workflow ini terhubung ke server
  melalui SSH dan menjalankan skrip deploy yang menarik kode terbaru, memasang
  dependensi, menjalankan migrasi, lalu me-restart aplikasi.

Kredensial server disimpan sebagai repository secret: `SSH_HOST`, `SSH_USER`,
dan `SSH_PRIVATE_KEY`.

## Limit access

Berkas `nginx.conf` pada root proyek adalah konfigurasi reverse proxy yang
dipakai di server. Resource `/threads` beserta seluruh path di dalamnya dibatasi
90 permintaan per menit per alamat IP, sebagai perlindungan terhadap serangan
DDoS. Aplikasi Node.js sendiri hanya mendengar pada `localhost`, sehingga satu-
satunya jalur masuk adalah melalui nginx yang melayani HTTPS.
