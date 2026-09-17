import Link from "next/link";
import { formatRupiah } from "@/lib/format";

export const metadata = {
  title: "Pusat Bantuan & Dokumentasi — SisaKita",
  description:
    "Panduan penggunaan SisaKita: alur jual beli limbah, escrow, verifikasi industri, dan referensi API.",
};

const ALUR = [
  {
    judul: "Alur Petani / Kolektor",
    langkah: [
      "Daftar sebagai Penyedia Limbah (langsung aktif).",
      "Buka menu Laporkan Limbah → unggah foto, pilih kategori, isi volume & harga.",
      "Sistem otomatis mengambil koordinat GPS lahan/gudang.",
      "Listing langsung tayang di marketplace dan peta sebaran.",
      "Saat industri mengajukan pembelian, notifikasi masuk dalam ≤ 15 detik.",
      "Setujui / tolak permintaan, lalu input data pengemudi saat barang siap diangkut.",
      "Dana escrow dilepas otomatis setelah pembeli mengonfirmasi penerimaan.",
    ],
    emoji: "👨‍🌾",
  },
  {
    judul: "Alur Industri / Pabrik",
    langkah: [
      "Daftar sebagai Industri dan unggah dokumen NPWP (izin usaha opsional).",
      "Administrator memverifikasi dokumen (target < 1 hari kerja).",
      "Filter marketplace berdasarkan kategori, kondisi, harga, dan radius jarak.",
      "Tambahkan limbah ke keranjang, atur volume per item, lalu checkout.",
      "Setelah penyedia menyetujui, lakukan pembayaran escrow (Midtrans/Xendit/transfer).",
      "Pantau status pengiriman beserta nama pengemudi dan nomor polisi.",
      "Konfirmasi penerimaan agar dana dilepas ke penyedia; ajukan sengketa bila ada masalah.",
    ],
    emoji: "🏭",
  },
  {
    judul: "Alur Administrator",
    langkah: [
      "Pantau grafik volume limbah per kategori dan tren bulanan.",
      "Verifikasi akun industri dengan memeriksa dokumen NPWP/izin.",
      "Kelola kategori limbah (tambah/hapus bila tidak dipakai).",
      "Tangani modul sengketa dan putuskan pelepasan/pengembalian dana escrow.",
    ],
    emoji: "🛡️",
  },
];

const ENDPOINTS = [
  ["GET", "/api/listings?q=&categoryId=&condition=&maxPrice=&lat=&lng=&radiusKm=&sort=", "Pencarian listing + jarak"],
  ["POST", "/api/listings", "Buat listing (penyedia)"],
  ["PATCH/DELETE", "/api/listings?id=", "Ubah stok/harga/status, hapus listing"],
  ["GET/POST", "/api/orders", "Daftar & buat pesanan (mendukung multi-item)"],
  ["PATCH", "/api/orders/{id}", "agree · reject · pay · ship · complete"],
  ["POST", "/api/payments", "Buat tagihan escrow (Midtrans/Xendit/Transfer)"],
  ["PATCH", "/api/payments", "Lepas / kembalikan dana escrow (admin)"],
  ["GET/PATCH", "/api/notifications", "Notifikasi + tandai dibaca"],
  ["GET/POST/DELETE", "/api/categories", "Manajemen kategori limbah"],
  ["GET/PATCH", "/api/admin", "Statistik, verifikasi akun, putusan sengketa"],
  ["POST", "/api/disputes", "Ajukan sengketa pesanan"],
  ["POST", "/api/uploads", "Unggah foto (maks 2 MB, dikompres di klien)"],
];

export default function BantuanPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-extrabold sm:text-3xl">Pusat Bantuan SisaKita</h1>
      <p className="mt-2 max-w-3xl text-sm text-neutral-600">
        Panduan lengkap penggunaan platform, kebijakan escrow, dan referensi teknis
        API. Seluruh transaksi menggunakan akun demo dengan kata sandi{" "}
        <code className="rounded bg-neutral-100 px-1 py-0.5">password123</code>.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {ALUR.map((alur) => (
          <section key={alur.judul} className="card p-5">
            <p className="text-2xl" aria-hidden>
              {alur.emoji}
            </p>
            <h2 className="mt-2 text-base font-bold">{alur.judul}</h2>
            <ol className="mt-3 space-y-2 text-sm text-neutral-600">
              {alur.langkah.map((langkah, index) => (
                <li key={langkah} className="flex gap-2">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-leaf-50 text-[11px] font-bold text-[#237023]">
                    {index + 1}
                  </span>
                  <span>{langkah}</span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <section className="card mt-6 p-5">
        <h2 className="text-lg font-bold">Kebijakan Escrow</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            { judul: "1. Dana ditahan", isi: "Pembeli membayar; SisaKita menahan dana di rekening escrow.", emoji: "🔒" },
            { judul: "2. Barang dikirim", isi: "Penyedia mengirim dengan data pengemudi & nomor polisi tercatat.", emoji: "🚚" },
            { judul: "3. Dana dilepas", isi: `Konfirmasi penerimaan melepas dana; batas komisi platform 2,5% (${formatRupiah(0)} untuk demo).`, emoji: "💸" },
          ].map((step) => (
            <div key={step.judul} className="rounded-xl bg-neutral-50 p-4">
              <p className="text-xl" aria-hidden>
                {step.emoji}
              </p>
              <p className="mt-1 text-sm font-bold">{step.judul}</p>
              <p className="text-xs text-neutral-600">{step.isi}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card mt-6 p-5">
        <h2 className="text-lg font-bold">Referensi API (REST)</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Semua endpoint memakai JSON dan autentikasi sesi httpOnly cookie.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-3 py-2">Metode</th>
                <th className="px-3 py-2">Endpoint</th>
                <th className="px-3 py-2">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {ENDPOINTS.map(([metode, endpoint, ket]) => (
                <tr key={endpoint}>
                  <td className="px-3 py-2 font-mono text-xs font-bold text-[#2F8F2F]">{metode}</td>
                  <td className="px-3 py-2 font-mono text-xs">{endpoint}</td>
                  <td className="px-3 py-2 text-neutral-600">{ket}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card mt-6 p-5">
        <h2 className="text-lg font-bold">Pertanyaan Umum</h2>
        <dl className="mt-3 space-y-4 text-sm">
          <div>
            <dt className="font-bold">Bagaimana jarak dihitung?</dt>
            <dd className="mt-1 text-neutral-600">
              Server menghitung jarak lingkaran besar (Haversine) antara koordinat
              listing dan titik referensi Anda. Pada instance PostgreSQL yang
              mengaktifkan ekstensi PostGIS, query dapat diganti langsung ke
              <code className="mx-1 rounded bg-neutral-100 px-1 py-0.5">ST_DWithin(geography, geography, meter)</code>
              tanpa mengubah antarmuka.
            </dd>
          </div>
          <div>
            <dt className="font-bold">Apakah akun industri bisa langsung membeli?</dt>
            <dd className="mt-1 text-neutral-600">
              Bisa. Pembayaran escrow tetap berjalan, namun pelepasan dana volume
              besar direkomendasikan setelah verifikasi dokumen selesai.
            </dd>
          </div>
          <div>
            <dt className="font-bold">Bagaimana bila barang tidak sesuai?</dt>
            <dd className="mt-1 text-neutral-600">
              Ajukan sengketa dari tab Pesanan Aktif pada dashboard industri. Admin
              akan meninjau bukti lalu memutuskan pelepasan atau pengembalian dana.
            </dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/marketplace" className="btn-primary">
            Mulai Cari Limbah
          </Link>
          <Link href="/daftar" className="btn-ghost">
            Daftar Akun
          </Link>
        </div>
      </section>
    </div>
  );
}
