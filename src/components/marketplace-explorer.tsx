"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ListingCard } from "@/components/listing-card";
import { MapLoader } from "@/components/map-loader";
import { useLokasi } from "@/hooks/use-lokasi";
import { formatJarak, formatRupiah } from "@/lib/format";
import { CONDITION_LABEL } from "@/lib/labels";
import type { ListingRow } from "@/lib/queries";

type Kategori = { id: number; categoryName: string; emoji: string | null };

const KOTA_REF = [
  { label: "Bogor", lat: -6.595, lng: 106.816 },
  { label: "Bandung", lat: -6.917, lng: 107.619 },
  { label: "Semarang", lat: -6.966, lng: 110.417 },
  { label: "Yogyakarta", lat: -7.795, lng: 110.369 },
  { label: "Surabaya", lat: -7.257, lng: 112.752 },
  { label: "Medan", lat: 3.595, lng: 98.672 },
  { label: "Makassar", lat: -5.148, lng: 119.432 },
  { label: "Palembang", lat: -2.976, lng: 104.775 },
];

const SORT_LABEL: Record<string, string> = {
  terbaru: "Terbaru",
  termurah: "Harga terendah",
  terdekat: "Jarak terdekat",
  volume: "Volume terbesar",
};

export function MarketplaceExplorer({
  categories,
  variant = "grid",
}: {
  categories: Kategori[];
  variant?: "grid" | "map";
}) {
  const { lokasi, simpan, deteksi, memuat: deteksiLokasi } = useLokasi();
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [condition, setCondition] = useState<"" | "DRY" | "WET" | "SEMI_DRY">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [radiusKm, setRadiusKm] = useState<number>(100);
  const [sort, setSort] = useState<keyof typeof SORT_LABEL>("terbaru");
  const [items, setItems] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tampilkanPeta, setTampilkanPeta] = useState(variant === "map");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (categoryId) params.set("categoryId", String(categoryId));
    if (condition) params.set("condition", condition);
    if (maxPrice) params.set("maxPrice", String(maxPrice));
    if (lokasi) {
      params.set("lat", String(lokasi.lat));
      params.set("lng", String(lokasi.lng));
      params.set("radiusKm", String(radiusKm));
    }
    params.set("sort", sort);
    return params.toString();
  }, [q, categoryId, condition, maxPrice, lokasi, radiusKm, sort]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/listings?${query}`, { cache: "no-store" });
      const data = (await res.json()) as { items: ListingRow[] };
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const poinPeta = items.map((item) => ({
    id: item.id,
    title: item.title,
    latitude: item.latitude,
    longitude: item.longitude,
    city: item.city,
    quantity: item.quantity,
    unit: item.unit,
    pricePerUnit: item.pricePerUnit,
    distanceKm: item.distanceKm,
    imageUrl: item.imageUrl,
  }));

  function resetFilter() {
    setQ("");
    setCategoryId("");
    setCondition("");
    setMaxPrice("");
    setRadiusKm(100);
    setSort("terbaru");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
      <div className="card p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg"
              aria-hidden
            >
              🔎
            </span>
            <input
              className="input pl-10"
              placeholder="Cari limbah: jerami padi, tongkol jagung, sekam…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Cari limbah pertanian"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="input w-auto"
              value={sort}
              onChange={(e) => setSort(e.target.value as keyof typeof SORT_LABEL)}
              aria-label="Urutkan hasil"
            >
              {Object.entries(SORT_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  Urutkan: {label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setTampilkanPeta((v) => !v)}
              aria-pressed={tampilkanPeta}
            >
              {tampilkanPeta ? "🧾 Tampilan katalog" : "🗺️ Tampilan peta"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">Filter</h2>
              <button
                type="button"
                onClick={resetFilter}
                className="text-xs font-semibold text-[#2F8F2F] hover:underline"
              >
                Reset
              </button>
            </div>

            <div className="mt-4">
              <label className="label" htmlFor="filter-kategori">
                Kategori limbah
              </label>
              <select
                id="filter-kategori"
                className="input"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">Semua kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.categoryName}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <span className="label">Kondisi limbah</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCondition("")}
                  className={`badge ${condition === "" ? "bg-[#2F8F2F] text-white ring-[#2F8F2F]" : "bg-neutral-100 text-neutral-700 ring-neutral-200"}`}
                >
                  Semua
                </button>
                {(["DRY", "WET", "SEMI_DRY"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCondition(c)}
                    aria-pressed={condition === c}
                    className={`badge ${condition === c ? "bg-[#2F8F2F] text-white ring-[#2F8F2F]" : "bg-neutral-100 text-neutral-700 ring-neutral-200"}`}
                  >
                    {CONDITION_LABEL[c]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className="label" htmlFor="filter-harga">
                Harga maksimal: {maxPrice ? formatRupiah(maxPrice) : "tanpa batas"}
              </label>
              <input
                id="filter-harga"
                type="range"
                min={0}
                max={500000}
                step={5000}
                value={maxPrice || 500000}
                onChange={(e) =>
                  setMaxPrice(Number(e.target.value) >= 500000 ? "" : Number(e.target.value))
                }
                className="w-full accent-[#2F8F2F]"
                aria-label="Harga maksimal per unit"
              />
            </div>

            <div className="mt-4 rounded-xl bg-leaf-50 p-3">
              <span className="label">Lokasi &amp; jarak</span>
              <p className="text-xs text-neutral-600">
                {lokasi
                  ? `Titik referensi: ${lokasi.lat.toFixed(3)}, ${lokasi.lng.toFixed(3)}`
                  : "Deteksi lokasi untuk menghitung jarak & radius pengiriman."}
              </p>
              <button
                type="button"
                className="btn-ghost mt-2 w-full"
                onClick={deteksi}
                disabled={deteksiLokasi}
              >
                {deteksiLokasi ? "Mendeteksi…" : "📍 Gunakan lokasi saya"}
              </button>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {KOTA_REF.map((kota) => (
                  <button
                    key={kota.label}
                    type="button"
                    onClick={() => simpan({ lat: kota.lat, lng: kota.lng, label: kota.label })}
                    className="badge bg-white text-neutral-700 ring-neutral-200 hover:ring-[#2F8F2F]"
                  >
                    {kota.label}
                  </button>
                ))}
              </div>
              {lokasi ? (
                <div className="mt-3">
                  <label className="label" htmlFor="radius">
                    Radius pencarian: {formatJarak(radiusKm)}
                  </label>
                  <input
                    id="radius"
                    type="range"
                    min={5}
                    max={500}
                    step={5}
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="w-full accent-[#F5A623]"
                    aria-label="Radius pencarian dalam kilometer"
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="card bg-[#237023] p-4 text-white">
            <p className="text-sm font-bold">Butuh volume besar?</p>
            <p className="mt-1 text-xs text-white/80">
              Tim kurasi SisaKita membantu kontrak pasokan bulanan untuk pabrik.
            </p>
            <a href="mailto:korporat@sisakita.id" className="btn-amber mt-3 w-full">
              Hubungi Tim Korporat
            </a>
          </div>
        </aside>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-neutral-600">
              Menampilkan <strong>{items.length}</strong> listing limbah
              {lokasi ? ` dalam radius ${formatJarak(radiusKm)}` : ""}
            </p>
          </div>

          {tampilkanPeta ? (
            <div className="space-y-4">
              <MapLoader points={poinPeta} height={460} zoom={lokasi ? 9 : 5} center={lokasi ? [lokasi.lat, lokasi.lng] : [-2.5, 118]} />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.slice(0, 6).map((item) => (
                  <ListingCard key={item.id} listing={item} />
                ))}
              </div>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="card h-80 animate-pulse bg-neutral-100" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="card grid place-items-center p-10 text-center">
              <p className="text-4xl" aria-hidden>
                🧺
              </p>
              <p className="mt-3 font-bold">Belum ada limbah yang cocok</p>
              <p className="mt-1 max-w-sm text-sm text-neutral-600">
                Coba perluas radius pencarian, ubah kategori, atau atur ulang filter harga.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <ListingCard key={item.id} listing={item} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
