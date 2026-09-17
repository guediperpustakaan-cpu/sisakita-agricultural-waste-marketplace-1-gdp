import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getListing, searchListings } from "@/lib/queries";
import {
  formatJarak,
  formatNumber,
  formatQuantity,
  formatRupiah,
  formatTanggal,
} from "@/lib/format";
import { CONDITION_LABEL, LISTING_STATUS_LABEL, UNIT_LABEL, statusTone } from "@/lib/labels";
import { ListingActions } from "@/components/listing-actions";
import { ListingCard } from "@/components/listing-card";
import { MapLoader } from "@/components/map-loader";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listingId = Number(id);
  if (!Number.isFinite(listingId)) notFound();

  const [listing, user] = await Promise.all([getListing(listingId), getCurrentUser()]);
  if (!listing) notFound();

  const terkait = (await searchListings({ limit: 12 })).filter(
    (item) => item.id !== listing.id,
  );

  const foto = [listing.imageUrl, ...terkait.slice(0, 3).map((t) => t.imageUrl)].filter(
    (f): f is string => Boolean(f),
  );

  const spesifikasi = [
    { label: "Kategori", value: `${listing.categoryEmoji ?? "🌾"} ${listing.categoryName ?? "-"}` },
    { label: "Kondisi", value: CONDITION_LABEL[listing.condition] },
    { label: "Berat tersedia", value: formatQuantity(listing.quantity, listing.unit) },
    {
      label: "Harga",
      value: `${formatRupiah(listing.pricePerUnit)} / ${UNIT_LABEL[listing.unit]}`,
    },
    { label: "Lokasi (GPS)", value: `${listing.latitude?.toFixed(5) ?? "-"}, ${listing.longitude?.toFixed(5) ?? "-"}` },
    { label: "Kota / Kabupaten", value: listing.city ?? "-" },
    { label: "Jarak dari Anda", value: listing.distanceKm !== null ? formatJarak(listing.distanceKm) : "Atur lokasi" },
    { label: "Status", value: LISTING_STATUS_LABEL[listing.status] },
    { label: "Terbit sejak", value: formatTanggal(listing.createdAt) },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
      <nav className="text-xs text-neutral-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-[#2F8F2F]">
          Beranda
        </Link>{" "}
        /{" "}
        <Link href="/marketplace" className="hover:text-[#2F8F2F]">
          Marketplace
        </Link>{" "}
        / <span className="text-neutral-700">{listing.title}</span>
      </nav>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-3">
              <div className="relative h-64 sm:col-span-2 sm:h-80">
                {foto[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={foto[0]}
                    alt={`Foto utama ${listing.title}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center bg-neutral-100 text-5xl" aria-hidden>
                    🌾
                  </div>
                )}
                <span className={`badge absolute left-3 top-3 ${statusTone(listing.status)} bg-white/95`}>
                  {LISTING_STATUS_LABEL[listing.status]}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 p-1 sm:grid-cols-1">
                {foto.slice(0, 3).map((src, index) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`${src}-${index}`}
                    src={src}
                    alt={`Foto ${index + 2} ${listing.title}`}
                    className="h-20 w-full rounded-lg object-cover sm:h-[6.4rem]"
                  />
                ))}
              </div>
            </div>
            <div className="p-5">
              <h1 className="text-xl font-extrabold sm:text-2xl">{listing.title}</h1>
              <p className="mt-1 text-sm text-neutral-500">
                {listing.city ?? "Indonesia"} · terdaftar {formatTanggal(listing.createdAt)}
              </p>
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
                {listing.description}
              </p>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-lg font-bold">Spesifikasi Teknis</h2>
            <div className="mt-3 overflow-hidden rounded-xl border border-neutral-200">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-neutral-100">
                  {spesifikasi.map((row) => (
                    <tr key={row.label} className="odd:bg-neutral-50">
                      <th scope="row" className="w-1/2 px-4 py-2.5 text-left font-semibold text-neutral-600">
                        {row.label}
                      </th>
                      <td className="px-4 py-2.5 font-medium">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-lg font-bold">Lokasi Limbah</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Titik koordinat digunakan untuk menghitung ongkos angkut dan radius pengiriman.
            </p>
            <div className="mt-3">
              <MapLoader
                points={[
                  {
                    id: listing.id,
                    title: listing.title,
                    latitude: listing.latitude,
                    longitude: listing.longitude,
                    city: listing.city,
                    quantity: listing.quantity,
                    unit: listing.unit,
                    pricePerUnit: listing.pricePerUnit,
                    distanceKm: listing.distanceKm,
                    imageUrl: listing.imageUrl,
                  },
                ]}
                height={320}
                zoom={12}
                center={[
                  listing.latitude ?? -6.595,
                  listing.longitude ?? 106.816,
                ]}
              />
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-lg font-bold">Profil Penyedia</h2>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-leaf-50 text-2xl" aria-hidden>
                👨‍🌾
              </span>
              <div className="flex-1">
                <p className="font-bold">{listing.providerName}</p>
                <p className="text-sm text-neutral-600">
                  ⭐ {Number(listing.providerRating).toFixed(1)} / 5.0 · Penyedia limbah terdaftar
                </p>
              </div>
              <span
                className={`badge ${
                  listing.providerVerified
                    ? "bg-emerald-100 text-emerald-800 ring-emerald-200"
                    : "bg-amber-100 text-amber-800 ring-amber-200"
                }`}
              >
                {listing.providerVerified ? "✔ Terverifikasi" : "Menunggu verifikasi"}
              </span>
            </div>
            <p className="mt-3 text-sm text-neutral-600">
              Penyedia aktif merespons permintaan pembelian pada jam kerja (08.00–17.00 WIB).
            </p>
          </div>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <ListingActions listing={listing} isLogin={Boolean(user)} role={user?.role} />
          <div className="card p-5">
            <h3 className="text-sm font-bold">Kenapa aman di SisaKita?</h3>
            <ul className="mt-2 space-y-2 text-sm text-neutral-600">
              <li>🔒 Dana ditahan escrow hingga barang diterima</li>
              <li>📄 Digitalisasi surat jalan &amp; data pengemudi</li>
              <li>⚖️ Modul sengketa dengan peninjauan admin</li>
              <li>🧾 Riwayat transaksi untuk audit keberlanjutan</li>
            </ul>
          </div>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-extrabold">Limbah Serupa</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {terkait.slice(0, 3).map((item) => (
            <ListingCard key={item.id} listing={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
