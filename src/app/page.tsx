import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getCategories, getPlatformStats, searchListings } from "@/lib/queries";
import { formatNumber, formatRupiah } from "@/lib/format";
import { ListingCard } from "@/components/listing-card";

const TESTIMONI = [
  {
    nama: "Rina Andriani",
    peran: "Procurement Manager, PT Bio Energi Nusantara",
    isi: "SisaKita memangkas waktu sourcing biomasa kami dari 3 minggu jadi 4 hari. Escrow membuat transaksi besar terasa aman.",
    emoji: "🏭",
  },
  {
    nama: "Pak Suryadi",
    peran: "Petani, Kabupaten Bogor",
    isi: "Dulu jerami dibakar di sawah. Sekarang tiap musim panen ada pemasukan tambahan Rp3,4 juta dari limbah.",
    emoji: "👩‍🌾",
  },
  {
    nama: "Ir. Bambang Wijaya",
    peran: "Direktur Operasi, Koperasi Kolektor Sejahtera",
    isi: "Fitur peta dan radius sangat membantu kolektor mengelola logistik antar desa. Laporan keuangan rapi.",
    emoji: "🚜",
  },
];

const LANGKAH = [
  {
    judul: "Laporkan limbah",
    isi: "Petani & kolektor mengunggah foto, kategori, volume, dan koordinat lahan.",
    emoji: "📸",
  },
  {
    judul: "Industri mengajukan",
    isi: "Pabrik memfilter berdasarkan kategori, harga, kondisi, dan radius jarak.",
    emoji: "🔍",
  },
  {
    judul: "Setujui & bayar escrow",
    isi: "Penyedia menyetujui, industri membayar. Dana ditahan rekening escrow.",
    emoji: "🔒",
  },
  {
    judul: "Kirim & lepas dana",
    isi: "Data pengemudi diinput, pembeli konfirmasi terima, dana dilepas ke penyedia.",
    emoji: "🚚",
  },
];

export default async function LandingPage() {
  const [stats, kategori, unggulan, user] = await Promise.all([
    getPlatformStats(),
    getCategories(),
    searchListings({ limit: 6, sort: "terbaru" }),
    getCurrentUser(),
  ]);

  const tonTerjual = stats.totalWeight / 1000;

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#237023] text-white">
        <div
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage: "url('/images/hero-limbah.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <span className="badge bg-white/15 text-white ring-white/30">
              🌱 Ekonomi sirkular pertanian Indonesia
            </span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
              Ubah Limbah Pertanian Menjadi{" "}
              <span className="text-[#F5A623]">Peluang Industri</span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/90">
              SisaKita menghubungkan petani dan kolektor dengan pabrik biomasa,
              pakan ternak, pupuk organik, dan energi terbarukan. Transparan,
              terukur, dan aman dengan sistem escrow.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {user?.role === "PROVIDER" ? (
                <Link href="/laporan" className="btn-amber">
                  📸 Lapor Limbah Baru
                </Link>
              ) : (
                <Link href="/daftar" className="btn-amber">
                  Jual Limbahmu Sekarang
                </Link>
              )}
              <Link
                href="/marketplace"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-white/70 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Jelajahi Marketplace
              </Link>
            </div>
            <dl className="mt-9 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Ton limbah bergerak", value: formatNumber(tonTerjual, 1) },
                { label: "Listing aktif", value: formatNumber(stats.activeListings) },
                { label: "Penyedia terdaftar", value: formatNumber(stats.providers) },
                { label: "Industri pembeli", value: formatNumber(stats.industries) },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-white/10 p-3 backdrop-blur">
                  <dt className="text-[11px] text-white/80">{item.label}</dt>
                  <dd className="text-xl font-extrabold">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="rounded-3xl bg-white p-5 text-neutral-900 shadow-2xl">
              <p className="text-sm font-bold">Transaksi terbaru di platform</p>
              <p className="text-xs text-neutral-500">
                Data langsung dari database SisaKita
              </p>
              <ul className="mt-4 space-y-3">
                {unggulan.slice(0, 4).map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-leaf-50 text-xl" aria-hidden>
                      {item.categoryEmoji ?? "🌾"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{item.title}</p>
                      <p className="text-xs text-neutral-500">
                        {item.city ?? "Indonesia"} · {formatNumber(item.quantity)}{" "}
                        {item.unit === "TON" ? "ton" : "kg"}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-[#237023]">
                      {formatRupiah(item.pricePerUnit)}
                    </span>
                  </li>
                ))}
                {unggulan.length === 0 ? (
                  <li className="text-sm text-neutral-500">
                    Belum ada listing. Jadilah pelapor pertama!
                  </li>
                ) : null}
              </ul>
              <div className="mt-4 rounded-xl bg-leaf-50 p-3 text-xs text-neutral-700">
                💰 Total nilai transaksi selesai:{" "}
                <strong>{formatRupiah(stats.transactionValue)}</strong> ·{" "}
                {stats.completedOrders} order selesai
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KATEGORI */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="text-2xl font-extrabold">Kategori Limbah Populer</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Bahan baku yang paling banyak dicari industri pengolah di SisaKita.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {kategori.slice(0, 12).map((cat) => (
            <Link
              key={cat.id}
              href={`/marketplace`}
              className="card flex flex-col items-center gap-1 p-4 text-center transition hover:border-[#2F8F2F] hover:shadow-md"
            >
              <span className="text-2xl" aria-hidden>
                {cat.emoji ?? "🌾"}
              </span>
              <span className="text-sm font-semibold leading-tight">{cat.categoryName}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* LISTING UNGGULAN */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold">Limbah Terbaru Ditawarkan</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Harga sudah termasuk daftar per kecil/ton, siap dijemput dari lokasi.
              </p>
            </div>
            <Link href="/marketplace" className="btn-ghost">
              Lihat semua →
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {unggulan.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </div>
      </section>

      {/* ALUR */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="text-2xl font-extrabold">Bagaimana SisaKita Bekerja</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {LANGKAH.map((langkah, index) => (
            <div key={langkah.judul} className="card p-5">
              <div className="flex items-center gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F5A623]/20 text-xl" aria-hidden>
                  {langkah.emoji}
                </span>
                <span className="text-xs font-bold text-neutral-400">
                  LANGKAH {index + 1}
                </span>
              </div>
              <h3 className="mt-3 text-base font-bold">{langkah.judul}</h3>
              <p className="mt-1 text-sm text-neutral-600">{langkah.isi}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONI */}
      <section className="bg-neutral-900 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-2xl font-extrabold">Dipercaya Industri &amp; Petani</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {TESTIMONI.map((t) => (
              <figure key={t.nama} className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                <span className="text-2xl" aria-hidden>
                  {t.emoji}
                </span>
                <blockquote className="mt-3 text-sm text-white/90">“{t.isi}”</blockquote>
                <figcaption className="mt-4 text-xs">
                  <span className="block font-bold">{t.nama}</span>
                  <span className="text-white/60">{t.peran}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="card flex flex-col items-center gap-4 bg-gradient-to-r from-[#2F8F2F] to-[#237023] p-8 text-center text-white md:flex-row md:justify-between md:text-left">
          <div>
            <h2 className="text-2xl font-extrabold">Siap menjual limbah pertanianmu?</h2>
            <p className="mt-1 text-sm text-white/90">
              Gratis untuk petani & kolektor. Verifikasi industri memakan waktu &lt; 1 hari kerja.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/daftar" className="btn-amber">
              Daftar Sekarang
            </Link>
            <Link
              href="/masuk"
              className="inline-flex min-h-[44px] items-center rounded-xl border-2 border-white/70 px-5 text-sm font-semibold"
            >
              Masuk
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
