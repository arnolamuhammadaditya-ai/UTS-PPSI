# SiLapor Kota 🏙️

> **Portal Pengaduan Warga untuk Smart City**  
> Dikembangkan untuk Ujian Tengah Semester — Mata Kuliah Proyek Pengembangan Sistem Informasi  
> **Oleh:** Arnol Muhammad Aditya & Dr. Erliyan Redy Susanto, M.Kom  
> Universitas Teknokrat Indonesia | 2026

---

## 📋 Deskripsi

**SiLapor Kota** adalah aplikasi web yang memungkinkan warga melaporkan masalah fasilitas publik (jalan rusak, lampu jalan mati, sampah menumpuk, drainase tersumbat) lengkap dengan foto dan lokasi GPS. Laporan diverifikasi admin Pemda, didisposisikan ke dinas terkait, ditindaklanjuti petugas, dan statusnya dapat dipantau warga secara transparan.

---

## 🛠️ Tech Stack

| Komponen | Teknologi |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS + font Inter |
| ORM & Database | Prisma + PostgreSQL |
| Validasi | Zod |
| Autentikasi | JWT di cookie httpOnly (jose) |
| Hash Password | bcryptjs |
| Penyimpanan Foto | Vercel Blob |
| Deployment | Vercel |

---

## 🚀 Cara Menjalankan Lokal

### 1. Clone & Install

```bash
git clone <repo-url>
cd silapor-kota
npm install
```

### 2. Setup Environment Variables

```bash
cp .env.example .env
```

Isi `.env` dengan nilai yang sesuai:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
JWT_SECRET="random-string-minimal-32-karakter"
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxx"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_STUDENT_NAME="Nama Mahasiswa"
```

### 3. Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Jalankan migrasi (development)
npm run db:migrate:dev

# Seed data awal (kategori, dinas, akun demo)
npm run db:seed
```

### 4. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## 🗄️ Migrasi Database

```bash
# Development (auto-generate migration)
npx prisma migrate dev --name nama_migrasi

# Production (apply existing migrations)
npm run db:migrate

# Reset database (hati-hati: menghapus semua data!)
npx prisma migrate reset
```

---

## 🌱 Seed Database

```bash
npm run db:seed
```

Seed akan membuat:
- 4 dinas (PUPR, Lingkungan Hidup, Perhubungan, Kebersihan)
- 6 kategori laporan
- 3 akun demo

---

## 👥 Akun Demo

| Peran | Email | Password |
|---|---|---|
| Admin | `admin@silaporkota.go.id` | `admin123` |
| Petugas | `petugas@silaporkota.go.id` | `petugas123` |
| Warga | `warga@example.com` | `warga123` |

> ⚠️ **Ganti password demo sebelum deploy ke produksi!**

---

## 🔐 Environment Variables

| Variable | Keterangan | Wajib |
|---|---|---|
| `DATABASE_URL` | Connection string PostgreSQL | ✅ |
| `JWT_SECRET` | Secret key JWT (min. 32 karakter) | ✅ |
| `BLOB_READ_WRITE_TOKEN` | Token Vercel Blob Storage | ✅ |
| `NEXT_PUBLIC_APP_URL` | URL aplikasi (untuk produksi) | ✅ |
| `NEXT_PUBLIC_STUDENT_NAME` | Nama mahasiswa di footer | Opsional |

---

## 📁 Struktur Proyek

```
silapor-kota/
├── prisma/
│   ├── schema.prisma       # Skema database
│   └── seed.ts             # Data awal
├── src/
│   ├── app/
│   │   ├── (auth)/         # Login & Register
│   │   ├── (public)/       # Halaman publik
│   │   ├── admin/          # Dashboard admin
│   │   ├── warga/          # Portal warga
│   │   ├── petugas/        # Panel petugas
│   │   └── api/            # API Routes
│   ├── components/
│   │   ├── layout/         # Header, Footer
│   │   └── ui/             # StatusChip, StarRating
│   └── lib/
│       ├── auth.ts          # JWT helpers
│       ├── prisma.ts        # Prisma singleton
│       ├── upload.ts        # Vercel Blob upload
│       ├── utils.ts         # Utilities
│       ├── validations.ts   # Zod schemas
│       └── api-response.ts  # Response helpers
├── .env.example
├── .gitignore
└── README.md
```

---

## 🌐 Deploy ke Vercel

### Persiapan

1. **Database PostgreSQL** — Gunakan [Neon](https://neon.tech) atau [Supabase](https://supabase.com) (free tier tersedia)
2. **Vercel Blob** — Aktifkan dari Vercel Dashboard → Storage → Blob
3. Push ke GitHub

### Langkah Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Tambahkan environment variables di Vercel Dashboard:
- `DATABASE_URL`
- `JWT_SECRET`  
- `BLOB_READ_WRITE_TOKEN`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_STUDENT_NAME`

### Post-Deploy

```bash
# Jalankan migrasi di production
vercel env pull .env.production
npx prisma migrate deploy
npm run db:seed
```

---

## 📊 Alur Laporan

```
Warga Buat Laporan (Baru)
         ↓
Admin Verifikasi → Terverifikasi / Ditolak
         ↓
Admin Disposisi ke Dinas & Petugas
         ↓
Petugas Update → Diproses
         ↓
Petugas Upload Bukti → Selesai
         ↓
Warga Beri Rating ⭐
```

---

## 🔒 Fitur Keamanan

- Password di-hash dengan **bcryptjs** (salt rounds: 12)
- Autentikasi via **JWT** tersimpan di cookie **httpOnly**
- Otorisasi **RBAC** di setiap route (middleware + server-side)
- Validasi semua input dengan **Zod**
- Query database via **Prisma** (mencegah SQL injection)
- Validasi tipe dan ukuran file foto di server
- Data pribadi (email, HP) tidak tampil di halaman publik
- Semua rahasia disimpan di environment variable

---

## 🗺️ API Endpoints

| Method | Endpoint | Akses | Fungsi |
|---|---|---|---|
| POST | `/api/auth/register` | Publik | Registrasi warga |
| POST | `/api/auth/login` | Publik | Login |
| POST | `/api/auth/logout` | - | Logout |
| GET | `/api/auth/me` | Auth | Info user login |
| GET | `/api/reports` | Publik | Daftar laporan publik (filter, paginasi) |
| GET | `/api/reports/:id` | Publik | Detail laporan publik |
| POST | `/api/reports` | Warga | Buat laporan (multipart/form-data) |
| POST | `/api/reports/:id/rating` | Warga | Beri rating |
| GET | `/api/me/reports` | Warga | Laporan milik sendiri |
| GET | `/api/me/reports/:id` | Warga | Detail laporan sendiri |
| GET | `/api/admin/reports` | Admin | Semua laporan |
| GET | `/api/admin/reports/:id` | Admin | Detail laporan (admin view) |
| PATCH | `/api/admin/reports/:id/verify` | Admin | Verifikasi/tolak laporan |
| PATCH | `/api/admin/reports/:id/assign` | Admin | Disposisi ke dinas/petugas |
| GET | `/api/admin/stats` | Admin | Statistik dashboard |
| CRUD | `/api/admin/categories` | Admin | Kelola kategori |
| CRUD | `/api/admin/departments` | Admin | Kelola dinas |
| GET/PATCH/DELETE | `/api/admin/users` | Admin | Kelola pengguna |
| GET | `/api/officer/reports` | Petugas | Laporan yang ditugaskan |
| GET | `/api/officer/reports/:id` | Petugas | Detail laporan |
| PATCH | `/api/officer/reports/:id/status` | Petugas | Update status + bukti foto |

---

## 👨‍💻 Dikembangkan Oleh

**[Nama Mahasiswa]**  
Program Studi Informatika  
Universitas Teknokrat Indonesia

Dosen Pembimbing: **Dr. Erliyan Redy Susanto, M.Kom**

---

> Copyright © 2026 by [Nama Mahasiswa] dan Dr. Erliyan Redy Susanto, M.Kom

