import Link from "next/link";
import { formatJarak, formatQuantity, formatRupiah, relativeTime } from "@/lib/format";
import { CONDITION_LABEL, LISTING_STATUS_LABEL, statusTone } from "@/lib/labels";
import type { ListingRow } from "@/lib/queries";

export function ListingCard({ listing }: { listing: ListingRow }) {
  const status = listing.status;
  return (
    <article className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-44 w-full overflow-hidden bg-neutral-100">
        {listing.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.imageUrl}
            alt={`Foto ${listing.title}`}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full place-items-center text-4xl" aria-hidden>
            🌾
          </div>
        )}
        <span className="absolute left-3 top-3 badge bg-white/95 text-neutral-800 ring-neutral-200">
          <span aria-hidden>{listing.categoryEmoji ?? "🌾"}</span>
          {listing.categoryName ?? "Umum"}
        </span>
        <span className={`absolute right-3 top-3 badge ${statusTone(status)} bg-white/95`}>
          {LISTING_STATUS_LABEL[status]}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-base font-bold leading-snug">
          <Link href={`/listing/${listing.id}`} className="hover:text-[#237023]">
            {listing.title}
          </Link>
        </h3>
        <p className="mt-1 text-xs text-neutral-500">
          {listing.city ?? "Lokasi tidak dicantumkan"} · {relativeTime(listing.createdAt)}
        </p>

        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-neutral-50 px-2.5 py-2">
            <dt className="text-[11px] font-medium text-neutral-500">Ketersediaan</dt>
            <dd className="font-semibold">
              {formatQuantity(listing.quantity, listing.unit)}
            </dd>
          </div>
          <div className="rounded-lg bg-neutral-50 px-2.5 py-2">
            <dt className="text-[11px] font-medium text-neutral-500">Kondisi</dt>
            <dd className="font-semibold">{CONDITION_LABEL[listing.condition]}</dd>
          </div>
        </dl>

        <p className="mt-3 text-lg font-extrabold text-[#237023]">
          {formatRupiah(listing.pricePerUnit)}
          <span className="text-xs font-medium text-neutral-500">
            {" "}
            /{listing.unit === "TON" ? "ton" : "kg"}
          </span>
        </p>

        <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3 text-xs">
          <span className="truncate text-neutral-600">
            ⭐ {Number(listing.providerRating).toFixed(1)} · {listing.providerName}
          </span>
          <span className="font-semibold text-[#F5A623]">
            {listing.distanceKm !== null ? `📍 ${formatJarak(listing.distanceKm)}` : ""}
          </span>
        </div>

        <Link
          href={`/listing/${listing.id}`}
          className="btn-primary mt-4 w-full"
          aria-label={`Lihat detail ${listing.title}`}
        >
          Lihat Detail
        </Link>
      </div>
    </article>
  );
}
