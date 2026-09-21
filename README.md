# 🌾 SisaKita — Agricultural Waste Marketplace

> **Open Source oleh MZF - 2026**

Marketplace limbah pertanian untuk industri. SisaKita menghubungkan petani,
kolektor, dan koperasi dengan pabrik biomasa, pakan ternak, pupuk organik, serta
energi terbarukan. Dilengkapi escrow, peta sebaran GPS, dan pelacakan pengiriman.

Dibangun dengan **Next.js 16 (App Router)**, **Drizzle ORM**, **PostgreSQL (Neon)**,
dan **Tailwind CSS v4**.

---

## ✨ Fitur Utama

- **Marketplace & pencarian cerdas** — filter kategori, kondisi (kering/bahan/setengah
  kering), harga maksimal, radius jarak (Haversine), dan pengurutan.
- **Peta sebaran** — Leaflet + OpenStreetMap, penanda kustom, popup detail listing.
- **Multi-peran** — Penyedia (PROVIDER), Industri (INDUSTRY), Administrator (ADMIN)
  dengan JWT httpOnly cookie (jose) + bcrypt.
- **Escrow end-to-end** — pesan → setujui → bayar (Midtrans/Xendit/transfer) →
  kirim (data pengemudi + nopol) → konfirmasi → dana dilepas.
- **Modul sengketa** — pengajuan, peninjauan, dan putusan oleh admin.
- **Dashboard admin** — grafik volume per kategori, tren bulanan, komposisi
  transaksi (recharts), verifikasi dokumen NPWP/izin, manajemen kategori.
- **Upload foto** — kompresi di sisi klien, disimpan sebagai base64 aman di DB.
- **Notifikasi real-time** — polling 15 detik, badge belum dibaca.
- **Widget Trakteer** — dukungan kopi untuk server, QR langsung di dalam app.

---

## 🧱 Tech Stack

| Bagian | Teknologi |
| --- | --- |
| Framework | Next.js 16.2 (App Router, Turbopack) |
| Bahasa | TypeScript 5.9 |
| Database | PostgreSQL (Neon) + Drizzle ORM 0.45 |
| Styling | Tailwind CSS v4 |
| Peta | react-leaflet + leaflet |
| Grafik | recharts |
| Form | react-hook-form + zod |
| State | zustand (keranjang) |
| Auth | jose (JWT) + bcryptjs |

---

## 🚀 Menjalankan Secara Lokal

### 1. Prasyarat

- Node.js 20+
- PostgreSQL lokal **atau** akun Neon

### 2. Install dependensi

```bash
npm install
```

### 3. Konfigurasi environment

Buat file `.env` di root proyek:

```env
DATABASE_URL=postgresql://user:password@host:5432/nama_db?sslmode=require
AUTH_SECRET=ubah-dengan-string-acak-yang-panjang
NEXTAUTH_URL=http://localhost:3000
```

> Untuk Neon, salin connection string dari dashboard Neon (aktifkan
> `sslmode=require`). Untuk Vercel, tempelkan nilai yang sama di
> **Settings → Environment Variables**.

### 4. Terapkan schema ke database

```bash
npm run db:push
```

### 5. Isi data contoh (seed)

```bash
npm run db:seed
```

Membuat akun demo (semua bernama sandi `password123`):

| Email | Peran |
| --- | --- |
| `admin@sisakita.id` | Administrator |
| `petani@sisakita.id` | Penyedia limbah |
| `industri@sisakita.id` | Industri pembeli |

Seed juga menambahkan 4 kategori limbah dan beberapa listing contoh.

### 6. Jalankan dev server

```bash
npm run dev
```

Buka <http://localhost:3000>.

---

## 📜 Skrip NPM

| Skrip | Keterangan |
| --- | --- |
| `npm run dev` | Menjalankan dev server |
| `npm run build` | Build produksi |
| `npm run start` | Menjalankan hasil build |
| `npm run lint` | Pemeriksaan ESLint |
| `npm run typecheck` | Pemeriksaan tipe TypeScript |
| `npm run db:push` | Menerapkan schema (drizzle-kit push) |
| `npm run db:seed` | Mengisi data contoh |

---

## 📁 Struktur Proyek

```
src/
├── app/                      # Halaman & API routes (App Router)
│   ├── page.tsx              # Landing page
│   ├── marketplace/          # Marketplace + filter
│   ├── peta/                 # Peta sebaran limbah
│   ├── laporan/              # Form lapor limbah (penyedia)
│   ├── listing/[id]/         # Detail listing + checkout
│   ├── masuk/                # Halaman login
│   ├── daftar/               # Halaman registrasi
│   ├── dashboard/
│   │   ├── penyedia/         # Dashboard penyedia
│   │   └── industri/         # Dashboard industri + keranjang
│   ├── admin/                # Panel administrator
│   ├── bantuan/              # Pusat bantuan & dokumentasi API
│   └── api/                  # REST API
│       ├── auth/[action]/    # login, register, logout, demo
│       ├── listings/         # CRUD listing
│       ├── orders/           # Buat, setujui, kirim, selesaikan
│       ├── payments/         # Escrow & refund
│       ├── disputes/         # Modul sengketa
│       ├── notifications/    # Notifikasi
│       ├── categories/       # CRUD kategori
│       ├── admin/            # Verifikasi & putusan
│       ├── uploads/          # Upload foto (base64)
│       ├── stats/            # Statistik platform
│       ├── health/           # Cek koneksi database
│       └── source/           # Download source code (.zip)
├── components/               # Komponen React
├── db/                       # Skema Drizzle & koneksi pool
├── hooks/                    # Hook kustom (geolokasi)
├── lib/                      # Utilitas, auth, query, validasi
└── store/                    # Zustand store (keranjang)
```

---

## 🔌 Referensi API

Semua endpoint memakai JSON. Endpoint yang butuh login memakai sesi
httpOnly cookie.

| Metode | Endpoint | Keterangan |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Daftar akun baru |
| `POST` | `/api/auth/login` | Masuk |
| `POST` | `/api/auth/logout` | Keluar |
| `PUT` | `/api/auth/demo` | Masuk cepat akun demo |
| `GET` | `/api/auth/me` | Data sesi saat ini |
| `GET` | `/api/listings` | Pencarian listing + filter |
| `POST` | `/api/listings` | Buat listing (penyedia) |
| `PATCH` | `/api/listings` | Ubah stok/harga/status |
| `DELETE` | `/api/listings?id=` | Hapus listing |
| `GET/POST` | `/api/orders` | Daftar & buat pesanan (multi-item) |
| `PATCH` | `/api/orders` | Batalkan pesanan |
| `PATCH` | `/api/orders/{id}` | `agree` · `reject` · `pay` · `ship` · `complete` |
| `POST` | `/api/payments` | Buat tagihan escrow |
| `PATCH` | `/api/payments` | Lepas / kembalikan dana (admin) |
| `POST` | `/api/disputes` | Ajukan sengketa |
| `GET/PATCH` | `/api/notifications` | Notifikasi + tandai dibaca |
| `GET/POST/DELETE` | `/api/categories` | Manajemen kategori |
| `GET/PATCH` | `/api/admin` | Statistik, verifikasi, putusan |
| `POST` | `/api/uploads` | Unggah foto (maks 2 MB) |
| `GET` | `/api/uploads/{id}` | Ambil foto |
| `GET` | `/api/stats` | Statistik platform |
| `GET` | `/api/health` | Cek koneksi database |
| `GET` | `/api/source` | Download source code (.zip) |

---

## ☁️ Deploy ke Vercel + Neon

1. **Fork/clone** repositori ini ke GitHub.
2. Buat proyek baru di [Vercel](https://vercel.com) dan import repositori.
3. Tambahkan Environment Variables di Vercel:
   - `DATABASE_URL` — connection string Neon
   - `AUTH_SECRET` — string acak (minimum 32 karakter)
4. Jalankan sekali `npm run db:push` dari lokal untuk menerapkan schema,
   atau tambahkan ke **Build Command** Vercel:
   ```
   npm run db:push && next build
   ```
5. Deploy. Selesai.

> **Catatan:** `drizzle.config.ts` membaca `DATABASE_URL` dari environment,
> jadi tidak ada kredensial yang di-hardcode.

---

## ⬇️ Download Source Code

Klik tautan **⬇ Download Source Code** di footer aplikasi, atau akses langsung
endpoint `/api/source`. Server akan membuat arsip `.zip` berisi seluruh kode
(sudah mengabaikan `node_modules`, `.next`, `.git`, dan `.env`) pada saat itu juga.

---

## ☕ Widget Trakteer

Widget melayang di sudut kanan bawah memungkinkan pengguna memberi dukungan
kecil lewat [Trakteer](https://trakteer.id/perpus_opera/). Saat diklik, pengguna
dapat memilih nominal (mulai Rp6.000) dan memindai QR langsung tanpa
meninggalkan halaman. Ubah `TRAKTEER_URL` pada
`src/components/trakteer-widget.tsx` bila ingin mengarahkan ke halaman Anda sendiri.

---

## 🗄️ Skema Database

Tabel utama: `users`, `waste_categories`, `listings`, `orders`, `payments`,
`notifications`, `disputes`, `uploads`. Definisi lengkap ada di
`src/db/schema.ts`.

**Relasi inti:**

```
users (1) ──── (n) listings
users (1) ──── (n) orders (sebagai buyer / provider)
orders (1) ─── (n) payments
orders (1) ─── (n) disputes
users (1) ──── (n) notifications
waste_categories (1) ── (n) listings
```

---

## 🤝 Berkontribusi

Pull request dan laporan bug diterima dengan senang hati. Pastikan
`npm run lint`, `npm run typecheck`, dan `npm run build` lolos sebelum mengirim.

---

## 📄 Lisensi

Dirilis di bawah Lisensi MIT — lihat berkas [LICENSE](./LICENSE).

**Open Source oleh MZF - 2026** 🌾