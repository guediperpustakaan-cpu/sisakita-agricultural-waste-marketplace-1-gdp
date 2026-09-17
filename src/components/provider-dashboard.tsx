"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { OrderProgress } from "@/components/order-progress";
import { formatQuantity, formatRupiah, formatTanggal, relativeTime } from "@/lib/format";
import {
  CONDITION_LABEL,
  LISTING_STATUS_LABEL,
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  statusTone,
} from "@/lib/labels";
import type { ListingRow } from "@/lib/queries";

export type ProviderOrder = {
  id: number;
  status: string;
  requestedQuantity: string;
  totalPrice: string;
  listingTitle: string | null;
  listingUnit: "KG" | "TON" | null;
  buyerName: string | null;
  createdAt: string | Date;
  shippingAddress: string | null;
  note: string | null;
  paymentStatus: string | null;
  paymentMethod: string | null;
  escrowStatus: string | null;
};

export type ProviderListing = ListingRow & {
  orderCount: number;
  orderVolume: number;
  pendingCount: number;
};

function InventarisTab({ items }: { items: ProviderListing[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<number | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);

  async function update(id: number, patch: Record<string, unknown>) {
    setBusy(id);
    try {
      await fetch("/api/listings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      setPesan("Perubahan tersimpan.");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function hapus(id: number) {
    setBusy(id);
    try {
      await fetch(`/api/listings?id=${id}`, { method: "DELETE" });
      setPesan("Listing dihapus.");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (!items.length) {
    return (
      <div className="card p-8 text-center">
        <p className="text-3xl" aria-hidden>
          🌾
        </p>
        <p className="mt-2 font-bold">Belum ada inventaris limbah</p>
        <Link href="/laporan" className="btn-primary mt-4">
          Laporkan Limbah Pertama
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pesan ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
          {pesan}
        </p>
      ) : null}
      {items.map((item) => (
        <div key={item.id} className="card p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="h-24 w-full shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:w-32">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-2xl" aria-hidden>
                  🌾
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/listing/${item.id}`} className="font-bold hover:text-[#237023]">
                  {item.title}
                </Link>
                <span className={`badge ${statusTone(item.status)}`}>
                  {LISTING_STATUS_LABEL[item.status]}
                </span>
                {item.pendingCount > 0 ? (
                  <span className="badge bg-amber-100 text-amber-800 ring-amber-200">
                    {item.pendingCount} permintaan baru
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                {item.categoryName} · {CONDITION_LABEL[item.condition]} ·{" "}
                {item.city ?? "tanpa kota"} · {item.orderCount} transaksi ·{" "}
                {formatQuantity(item.orderVolume, item.unit)} terjual
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <label className="text-xs font-semibold text-neutral-600">
                  Stok ({item.unit === "TON" ? "ton" : "kg"})
                  <input
                    type="number"
                    min={0}
                    step="0.001"
                    defaultValue={Number(item.quantity)}
                    className="input mt-1"
                    aria-label={`Ubah stok ${item.title}`}
                    onBlur={(e) =>
                      update(item.id, {
                        quantity: Number(e.target.value),
                        status: Number(e.target.value) <= 0 ? "OUT_OF_STOCK" : "AVAILABLE",
                      })
                    }
                  />
                </label>
                <label className="text-xs font-semibold text-neutral-600">
                  Harga / unit
                  <input
                    type="number"
                    min={0}
                    defaultValue={Number(item.pricePerUnit)}
                    className="input mt-1"
                    aria-label={`Ubah harga ${item.title}`}
                    onBlur={(e) => update(item.id, { pricePerUnit: Number(e.target.value) })}
                  />
                </label>
                <div className="text-xs font-semibold text-neutral-600">
                  Aksi cepat
                  <div className="mt-1 flex gap-2">
                    <button
                      type="button"
                      className="btn-ghost min-h-[44px] flex-1 px-2 text-xs"
                      disabled={busy === item.id}
                      onClick={() =>
                        update(item.id, { status: item.status === "AVAILABLE" ? "OUT_OF_STOCK" : "AVAILABLE" })
                      }
                    >
                      {item.status === "AVAILABLE" ? "Jeda" : "Aktifkan"}
                    </button>
                    <button
                      type="button"
                      className="btn-danger min-h-[44px] px-3 text-xs"
                      disabled={busy === item.id}
                      onClick={() => hapus(item.id)}
                      aria-label={`Hapus ${item.title}`}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PesananTab({ orders }: { orders: ProviderOrder[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<number | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [driver, setDriver] = useState<Record<number, { driverName: string; driverPhone: string; vehiclePlate: string }>>({});

  async function aksi(id: number, body: Record<string, unknown>) {
    setBusy(id);
    setGalat(null);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setGalat(data.error ?? "Aksi gagal");
        return;
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (!orders.length) {
    return (
      <div className="card p-8 text-center">
        <p className="text-3xl" aria-hidden>
          📭
        </p>
        <p className="mt-2 font-bold">Belum ada pesanan masuk</p>
        <p className="mt-1 text-sm text-neutral-600">
          Permintaan dari industri akan muncul di sini lengkap dengan notifikasi.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {galat ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{galat}</p>
      ) : null}
      {orders.map((order) => {
        const d = driver[order.id];
        return (
          <div key={order.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-bold">
                  #{order.id} · {order.listingTitle ?? "Listing dihapus"}
                </p>
                <p className="text-xs text-neutral-500">
                  Pembeli: {order.buyerName ?? "-"} · {relativeTime(order.createdAt)}
                </p>
              </div>
              <span className={`badge ${statusTone(order.status)}`}>
                {ORDER_STATUS_LABEL[order.status]}
              </span>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <div className="rounded-lg bg-neutral-50 px-2.5 py-2">
                <dt className="text-[11px] text-neutral-500">Volume</dt>
                <dd className="font-semibold">
                  {formatQuantity(order.requestedQuantity, order.listingUnit ?? "KG")}
                </dd>
              </div>
              <div className="rounded-lg bg-neutral-50 px-2.5 py-2">
                <dt className="text-[11px] text-neutral-500">Nilai</dt>
                <dd className="font-semibold">{formatRupiah(order.totalPrice)}</dd>
              </div>
              <div className="rounded-lg bg-neutral-50 px-2.5 py-2">
                <dt className="text-[11px] text-neutral-500">Pembayaran</dt>
                <dd className="font-semibold">
                  {order.paymentStatus === "PAID"
                    ? `Escrow ${order.escrowStatus === "RELEASED" ? "dilepas" : "ditahan"}`
                    : "Belum dibayar"}
                </dd>
              </div>
              <div className="rounded-lg bg-neutral-50 px-2.5 py-2">
                <dt className="text-[11px] text-neutral-500">Metode</dt>
                <dd className="font-semibold">
                  {order.paymentMethod ? PAYMENT_METHOD_LABEL[order.paymentMethod] : "-"}
                </dd>
              </div>
            </dl>

            {order.note ? (
              <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Catatan pembeli: {order.note}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-neutral-600">
              📍 Kirim ke: {order.shippingAddress ?? "-"}
            </p>

            <div className="mt-3">
              <OrderProgress status={order.status} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {order.status === "PENDING" ? (
                <>
                  <button
                    type="button"
                    className="btn-primary min-h-[44px] px-4 text-sm"
                    disabled={busy === order.id}
                    onClick={() => aksi(order.id, { action: "agree" })}
                  >
                    ✅ Setujui
                  </button>
                  <button
                    type="button"
                    className="btn-danger min-h-[44px] px-4 text-sm"
                    disabled={busy === order.id}
                    onClick={() => aksi(order.id, { action: "reject", reason: "Stok tidak tersedia" })}
                  >
                    ✕ Tolak
                  </button>
                </>
              ) : null}

              {order.status === "AGREED" ? (
                order.paymentStatus === "PAID" ? (
                  <div className="w-full rounded-xl bg-sky-50 p-3">
                    <p className="text-xs font-semibold text-sky-900">
                      Input data pengemudi untuk memulai pengiriman
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      <input
                        className="input"
                        placeholder="Nama pengemudi"
                        aria-label="Nama pengemudi"
                        value={d?.driverName ?? ""}
                        onChange={(e) =>
                          setDriver((prev) => ({
                            ...prev,
                            [order.id]: {
                              driverName: e.target.value,
                              driverPhone: prev[order.id]?.driverPhone ?? "",
                              vehiclePlate: prev[order.id]?.vehiclePlate ?? "",
                            },
                          }))
                        }
                      />
                      <input
                        className="input"
                        placeholder="No. HP pengemudi"
                        aria-label="Nomor telepon pengemudi"
                        value={d?.driverPhone ?? ""}
                        onChange={(e) =>
                          setDriver((prev) => ({
                            ...prev,
                            [order.id]: {
                              driverName: prev[order.id]?.driverName ?? "",
                              driverPhone: e.target.value,
                              vehiclePlate: prev[order.id]?.vehiclePlate ?? "",
                            },
                          }))
                        }
                      />
                      <input
                        className="input"
                        placeholder="Nomor polisi"
                        aria-label="Nomor polisi kendaraan"
                        value={d?.vehiclePlate ?? ""}
                        onChange={(e) =>
                          setDriver((prev) => ({
                            ...prev,
                            [order.id]: {
                              driverName: prev[order.id]?.driverName ?? "",
                              driverPhone: prev[order.id]?.driverPhone ?? "",
                              vehiclePlate: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                    <button
                      type="button"
                      className="btn-primary mt-2 w-full sm:w-auto"
                      disabled={busy === order.id}
                      onClick={() => d && aksi(order.id, { action: "ship", ...d })}
                    >
                      🚚 Mulai Pengiriman
                    </button>
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-amber-700">
                    Menunggu pembayaran escrow dari industri…
                  </p>
                )
              ) : null}

              {order.status === "SHIPPING" ? (
                <p className="text-xs font-semibold text-sky-700">
                  Barang dalam perjalanan. Dana dilepas otomatis setelah pembeli konfirmasi.
                </p>
              ) : null}

              {order.status === "COMPLETED" ? (
                <p className="text-xs font-semibold text-emerald-700">
                  Selesai pada {formatTanggal(new Date(), true)} · dana masuk ke keuangan.
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KeuanganTab({
  orders,
  ringkasan,
}: {
  orders: ProviderOrder[];
  ringkasan: { masuk: number; ditahan: number; berjalan: number };
}) {
  const cards = [
    { label: "Dana masuk (selesai)", value: ringkasan.masuk, tone: "text-emerald-700", emoji: "💰" },
    { label: "Ditahan escrow", value: ringkasan.ditahan, tone: "text-amber-700", emoji: "🔒" },
    { label: "Nilai pesanan berjalan", value: ringkasan.berjalan, tone: "text-sky-700", emoji: "🚚" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="card p-4">
            <p className="text-xs text-neutral-500">
              <span aria-hidden>{card.emoji}</span> {card.label}
            </p>
            <p className={`mt-1 text-xl font-extrabold ${card.tone}`}>
              {formatRupiah(card.value)}
            </p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <caption className="sr-only">Riwayat pembayaran pesanan</caption>
          <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Nilai</th>
              <th className="px-4 py-3">Metode</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Escrow</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-3">
                  <span className="font-semibold">#{order.id}</span>
                  <span className="block text-xs text-neutral-500">{order.listingTitle}</span>
                </td>
                <td className="px-4 py-3 font-semibold">{formatRupiah(order.totalPrice)}</td>
                <td className="px-4 py-3">
                  {order.paymentMethod ? PAYMENT_METHOD_LABEL[order.paymentMethod] : "-"}
                </td>
                <td className="px-4 py-3">
                  {order.paymentStatus === "PAID"
                    ? "Dibayar"
                    : order.paymentStatus === "REFUNDED"
                      ? "Dikembalikan"
                      : "Belum dibayar"}
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${statusTone(order.escrowStatus ?? "")}`}>
                    {order.escrowStatus === "RELEASED"
                      ? "Dilepas"
                      : order.escrowStatus === "REFUNDED"
                        ? "Dikembalikan"
                        : "Ditahan"}
                  </span>
                </td>
              </tr>
            ))}
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                  Belum ada data pembayaran.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ProviderDashboard({
  listings,
  orders,
  ringkasan,
}: {
  listings: ProviderListing[];
  orders: ProviderOrder[];
  ringkasan: { masuk: number; ditahan: number; berjalan: number };
}) {
  const [tab, setTab] = useState<"inventaris" | "pesanan" | "keuangan">("inventaris");
  const tabs = [
    { key: "inventaris", label: "Inventaris", emoji: "📦", count: listings.length },
    { key: "pesanan", label: "Pesanan", emoji: "🧾", count: orders.length },
    { key: "keuangan", label: "Keuangan", emoji: "💰", count: null },
  ] as const;

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Tab dashboard penyedia">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
            className={`min-h-[44px] rounded-xl px-4 text-sm font-semibold transition ${
              tab === item.key
                ? "bg-[#2F8F2F] text-white"
                : "border border-neutral-200 bg-white text-neutral-700 hover:border-[#2F8F2F]"
            }`}
          >
            <span aria-hidden>{item.emoji}</span> {item.label}
            {item.count !== null ? (
              <span className="ml-1 rounded-full bg-black/10 px-1.5 text-xs">{item.count}</span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "inventaris" ? <InventarisTab items={listings} /> : null}
        {tab === "pesanan" ? <PesananTab orders={orders} /> : null}
        {tab === "keuangan" ? <KeuanganTab orders={orders} ringkasan={ringkasan} /> : null}
      </div>
    </div>
  );
}
