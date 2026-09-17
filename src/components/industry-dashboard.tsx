"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { OrderProgress } from "@/components/order-progress";
import { useCartStore } from "@/store/cart";
import { formatQuantity, formatRupiah, formatTanggal, relativeTime } from "@/lib/format";
import {
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  statusTone,
} from "@/lib/labels";

export type BuyerOrder = {
  id: number;
  status: string;
  requestedQuantity: string;
  totalPrice: string;
  listingTitle: string | null;
  listingUnit: "KG" | "TON" | null;
  listingImage: string | null;
  listingLat: number | null;
  listingLng: number | null;
  providerName: string | null;
  createdAt: string | Date;
  shippingAddress: string | null;
  note: string | null;
  driverName: string | null;
  driverPhone: string | null;
  vehiclePlate: string | null;
  paymentStatus: string | null;
  paymentMethod: string | null;
  escrowStatus: string | null;
};

type Tab = "cari" | "keranjang" | "pesanan" | "riwayat" | "pengiriman";

function KeranjangTab() {
  const router = useRouter();
  const { items, setQuantity, setAddress, setNote, remove, clear } = useCartStore();
  const [metode, setMetode] = useState<"MIDTRANS" | "XENDIT" | "BANK_TRANSFER">("MIDTRANS");
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [sukses, setSukses] = useState<string | null>(null);

  const total = items.reduce((acc, i) => acc + i.quantity * i.pricePerUnit, 0);

  async function checkout() {
    setGalat(null);
    setSukses(null);
    setProses(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            listingId: i.listingId,
            requestedQuantity: i.quantity,
            note: i.note,
            shippingAddress: i.shippingAddress,
          })),
        }),
      });
      const data = (await res.json()) as { error?: string; orderIds?: number[]; peringatan?: string[] };
      if (!res.ok || !data.orderIds) {
        setGalat(data.error ?? "Checkout gagal");
        return;
      }
      await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: data.orderIds[0], method: metode }),
      });
      clear();
      setSukses(
        `${data.orderIds.length} pesanan dibuat & tagihan escrow ${PAYMENT_METHOD_LABEL[metode]} dibuat.`,
      );
      router.refresh();
    } finally {
      setProses(false);
    }
  }

  if (!items.length) {
    return (
      <div className="card p-8 text-center">
        <p className="text-3xl" aria-hidden>
          🛒
        </p>
        <p className="mt-2 font-bold">Keranjang kosong</p>
        <p className="mt-1 text-sm text-neutral-600">
          Tambahkan limbah dari marketplace untuk mengajukan pembelian massal.
        </p>
        <Link href="/marketplace" className="btn-primary mt-4">
          Cari Limbah
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {galat ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{galat}</p>
      ) : null}
      {sukses ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">{sukses}</p>
      ) : null}

      {items.map((item) => (
        <div key={item.listingId} className="card p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="h-20 w-full shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:w-28">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-2xl" aria-hidden>
                  🌾
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold">{item.title}</p>
                  <p className="text-xs text-neutral-500">
                    {item.providerName} · {formatRupiah(item.pricePerUnit)}/
                    {item.unit === "TON" ? "ton" : "kg"} · maks {formatQuantity(item.maxQuantity, item.unit)}
                  </p>
                </div>
                <p className="font-bold text-[#237023]">
                  {formatRupiah(item.quantity * item.pricePerUnit)}
                </p>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <label className="text-xs font-semibold text-neutral-600">
                  Kuantitas
                  <input
                    type="number"
                    min={1}
                    max={item.maxQuantity}
                    value={item.quantity}
                    className="input mt-1"
                    aria-label={`Kuantitas ${item.title}`}
                    onChange={(e) => setQuantity(item.listingId, Number(e.target.value))}
                  />
                </label>
                <label className="text-xs font-semibold text-neutral-600 sm:col-span-2">
                  Alamat pengiriman
                  <input
                    className="input mt-1"
                    value={item.shippingAddress}
                    placeholder="Alamat pabrik"
                    aria-label={`Alamat pengiriman ${item.title}`}
                    onChange={(e) => setAddress(item.listingId, e.target.value)}
                  />
                </label>
                <label className="text-xs font-semibold text-neutral-600 sm:col-span-3">
                  Catatan
                  <input
                    className="input mt-1"
                    value={item.note}
                    placeholder="Spesifikasi khusus / jadwal angkut"
                    aria-label={`Catatan ${item.title}`}
                    onChange={(e) => setNote(item.listingId, e.target.value)}
                  />
                </label>
              </div>
              <button
                type="button"
                className="mt-2 text-xs font-semibold text-rose-600 hover:underline"
                onClick={() => remove(item.listingId)}
              >
                Hapus dari keranjang
              </button>
            </div>
          </div>
        </div>
      ))}

      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-neutral-500">Total pembayaran escrow</p>
            <p className="text-2xl font-extrabold text-[#237023]">{formatRupiah(total)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="input w-auto"
              value={metode}
              onChange={(e) => setMetode(e.target.value as typeof metode)}
              aria-label="Metode pembayaran"
            >
              <option value="MIDTRANS">Midtrans (VA / e-wallet)</option>
              <option value="XENDIT">Xendit Invoice</option>
              <option value="BANK_TRANSFER">Transfer Bank Manual</option>
            </select>
            <button type="button" className="btn-primary" onClick={checkout} disabled={proses}>
              {proses ? "Memproses…" : "🔒 Checkout & Buat Escrow"}
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          Dana ditahan rekening escrow SisaKita dan dilepas ke penyedia setelah Anda
          mengonfirmasi penerimaan barang.
        </p>
      </div>
    </div>
  );
}

function OrderCard({
  order,
  showBuyerActions,
  onAction,
  busy,
}: {
  order: BuyerOrder;
  showBuyerActions: boolean;
  onAction: (id: number, body: Record<string, unknown>) => void;
  busy: boolean;
}) {
  const [metode, setMetode] = useState<"MIDTRANS" | "XENDIT" | "BANK_TRANSFER">("MIDTRANS");
  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex gap-3">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
            {order.listingImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={order.listingImage} alt={order.listingTitle ?? ""} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center" aria-hidden>
                🌾
              </div>
            )}
          </div>
          <div>
            <p className="font-bold">
              #{order.id} · {order.listingTitle ?? "Listing dihapus"}
            </p>
            <p className="text-xs text-neutral-500">
              Penyedia: {order.providerName ?? "-"} · {relativeTime(order.createdAt)}
            </p>
          </div>
        </div>
        <span className={`badge ${statusTone(order.status)}`}>{ORDER_STATUS_LABEL[order.status]}</span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <div className="rounded-lg bg-neutral-50 px-2.5 py-2">
          <dt className="text-[11px] text-neutral-500">Volume</dt>
          <dd className="font-semibold">
            {formatQuantity(order.requestedQuantity, order.listingUnit ?? "KG")}
          </dd>
        </div>
        <div className="rounded-lg bg-neutral-50 px-2.5 py-2">
          <dt className="text-[11px] text-neutral-500">Total</dt>
          <dd className="font-semibold">{formatRupiah(order.totalPrice)}</dd>
        </div>
        <div className="rounded-lg bg-neutral-50 px-2.5 py-2">
          <dt className="text-[11px] text-neutral-500">Escrow</dt>
          <dd className="font-semibold">
            {order.escrowStatus === "RELEASED"
              ? "Dilepas"
              : order.escrowStatus === "REFUNDED"
                ? "Dikembalikan"
                : order.paymentStatus === "PAID"
                  ? "Ditahan"
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

      <div className="mt-3">
        <OrderProgress status={order.status} />
      </div>

      {order.driverName ? (
        <p className="mt-3 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-900">
          🚚 {order.driverName} · {order.driverPhone} · {order.vehiclePlate}
        </p>
      ) : null}

      {showBuyerActions ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {order.status === "PENDING" ? (
            <>
              <button
                type="button"
                className="btn-ghost min-h-[44px] px-4 text-sm"
                disabled={busy}
                onClick={() => onAction(order.id, { action: "cancel" })}
              >
                Batalkan
              </button>
              <span className="text-xs text-neutral-500">Menunggu persetujuan penyedia</span>
            </>
          ) : null}

          {order.status === "AGREED" && order.paymentStatus !== "PAID" ? (
            <>
              <select
                className="input w-auto"
                value={metode}
                onChange={(e) => setMetode(e.target.value as typeof metode)}
                aria-label="Metode pembayaran"
              >
                <option value="MIDTRANS">Midtrans</option>
                <option value="XENDIT">Xendit</option>
                <option value="BANK_TRANSFER">Transfer Bank</option>
              </select>
              <button
                type="button"
                className="btn-primary min-h-[44px] px-4 text-sm"
                disabled={busy}
                onClick={() => onAction(order.id, { action: "pay", method: metode })}
              >
                🔒 Bayar Escrow
              </button>
            </>
          ) : null}

          {order.status === "AGREED" && order.paymentStatus === "PAID" ? (
            <span className="text-xs font-semibold text-amber-700">
              Pembayaran diterima, menunggu penyedia mengirim barang.
            </span>
          ) : null}

          {order.status === "SHIPPING" ? (
            <button
              type="button"
              className="btn-primary min-h-[44px] px-4 text-sm"
              disabled={busy}
              onClick={() => onAction(order.id, { action: "complete" })}
            >
              ✅ Konfirmasi Barang Diterima
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function IndustryDashboard({ orders }: { orders: BuyerOrder[] }) {
  const router = useRouter();
  const cartCount = useCartStore((s) => s.items.length);
  const [tab, setTab] = useState<Tab>("cari");
  const [busy, setBusy] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [dispute, setDispute] = useState<{ orderId: number; subject: string; description: string } | null>(null);

  const aktif = orders.filter((o) => ["PENDING", "AGREED", "SHIPPING"].includes(o.status));
  const pengiriman = orders.filter((o) => o.status === "SHIPPING");
  const riwayat = orders.filter((o) => ["COMPLETED", "CANCELLED"].includes(o.status));
  const totalBelanja = riwayat
    .filter((o) => o.status === "COMPLETED")
    .reduce((acc, o) => acc + Number(o.totalPrice), 0);

  async function aksi(id: number, body: Record<string, unknown>) {
    setBusy(true);
    setGalat(null);
    try {
      const res = await fetch(body.action === "cancel" ? "/api/orders" : `/api/orders/${id}`, {
        method: body.action === "cancel" ? "PATCH" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body.action === "cancel" ? { id, ...body } : { ...body }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setGalat(data.error ?? "Aksi gagal");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function kirimDispute() {
    if (!dispute) return;
    setBusy(true);
    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dispute),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setGalat(data.error ?? "Gagal mengajukan sengketa");
        return;
      }
      setDispute(null);
      setGalat(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const tabs: { key: Tab; label: string; emoji: string; count: number | null }[] = [
    { key: "cari", label: "Cari Limbah", emoji: "🔍", count: null },
    { key: "keranjang", label: "Keranjang", emoji: "🛒", count: cartCount },
    { key: "pesanan", label: "Pesanan Aktif", emoji: "🧾", count: aktif.length },
    { key: "pengiriman", label: "Pengiriman", emoji: "🚚", count: pengiriman.length },
    { key: "riwayat", label: "Riwayat", emoji: "📚", count: riwayat.length },
  ];

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Pesanan aktif", value: String(aktif.length), emoji: "🧾" },
          { label: "Total belanja selesai", value: formatRupiah(totalBelanja), emoji: "💰" },
          { label: "Dalam pengiriman", value: String(pengiriman.length), emoji: "🚚" },
        ].map((card) => (
          <div key={card.label} className="card p-4">
            <p className="text-xs text-neutral-500">
              <span aria-hidden>{card.emoji}</span> {card.label}
            </p>
            <p className="mt-1 text-xl font-extrabold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Tab dashboard industri">
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
            {item.count ? <span className="ml-1 rounded-full bg-black/10 px-1.5 text-xs">{item.count}</span> : null}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {galat ? (
          <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{galat}</p>
        ) : null}

        {tab === "cari" ? (
          <div className="card p-6">
            <h2 className="text-lg font-bold">Temukan limbah sesuai spesifikasi pabrik</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Gunakan filter kategori, kondisi, harga, dan radius jarak untuk memastikan
              biaya angkut tetap efisien.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/marketplace" className="btn-primary">
                Buka Marketplace
              </Link>
              <Link href="/peta" className="btn-ghost">
                Lihat Peta Sebaran
              </Link>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {orders.slice(0, 3).map((order) => (
                <div key={order.id} className="rounded-xl bg-neutral-50 p-3 text-xs">
                  <p className="font-semibold">{order.listingTitle}</p>
                  <p className="text-neutral-500">
                    {formatQuantity(order.requestedQuantity, order.listingUnit ?? "KG")} ·{" "}
                    {ORDER_STATUS_LABEL[order.status]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {tab === "keranjang" ? <KeranjangTab /> : null}

        {tab === "pesanan" ? (
          <div className="space-y-3">
            {aktif.length === 0 ? (
              <div className="card p-8 text-center text-sm text-neutral-600">
                Tidak ada pesanan aktif.
              </div>
            ) : (
              aktif.map((order) => (
                <div key={order.id}>
                  <OrderCard order={order} showBuyerActions onAction={aksi} busy={busy} />
                  <button
                    type="button"
                    className="mt-1 text-xs font-semibold text-rose-600 hover:underline"
                    onClick={() =>
                      setDispute({ orderId: order.id, subject: "", description: "" })
                    }
                  >
                    ⚖️ Ajukan sengketa untuk pesanan #{order.id}
                  </button>
                </div>
              ))
            )}
          </div>
        ) : null}

        {tab === "pengiriman" ? (
          <div className="space-y-3">
            {pengiriman.length === 0 ? (
              <div className="card p-8 text-center text-sm text-neutral-600">
                Tidak ada barang dalam pengiriman.
              </div>
            ) : (
              pengiriman.map((order) => (
                <div key={order.id} className="card p-4">
                  <p className="font-bold">#{order.id} · {order.listingTitle}</p>
                  <p className="mt-1 text-sm text-neutral-600">
                    Pengemudi {order.driverName} ({order.driverPhone}) · nopol {order.vehiclePlate}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Dikirim {formatTanggal(order.createdAt, true)} menuju {order.shippingAddress}
                  </p>
                  {order.listingLat && order.listingLng ? (
                    <a
                      className="mt-2 inline-block text-xs font-semibold text-[#2F8F2F] hover:underline"
                      href={`https://www.openstreetmap.org/?mlat=${order.listingLat}&mlon=${order.listingLng}#map=13/${order.listingLat}/${order.listingLng}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Lihat titik ambil di peta →
                    </a>
                  ) : null}
                  <div className="mt-3">
                    <OrderProgress status={order.status} />
                  </div>
                  <button
                    type="button"
                    className="btn-primary mt-3"
                    disabled={busy}
                    onClick={() => aksi(order.id, { action: "complete" })}
                  >
                    ✅ Konfirmasi Penerimaan &amp; Lepas Dana
                  </button>
                </div>
              ))
            )}
          </div>
        ) : null}

        {tab === "riwayat" ? (
          <div className="space-y-3">
            {riwayat.length === 0 ? (
              <div className="card p-8 text-center text-sm text-neutral-600">Belum ada riwayat.</div>
            ) : (
              riwayat.map((order) => (
                <OrderCard key={order.id} order={order} showBuyerActions={false} onAction={aksi} busy={busy} />
              ))
            )}
          </div>
        ) : null}
      </div>

      {dispute ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="card w-full max-w-lg p-5" role="dialog" aria-modal="true" aria-label="Formulir sengketa">
            <h2 className="text-lg font-bold">Ajukan Sengketa #{dispute.orderId}</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Admin SisaKita akan meninjau dan memutuskan pelepasan atau pengembalian dana escrow.
            </p>
            <label className="label mt-4" htmlFor="subjek">
              Subjek
            </label>
            <input
              id="subjek"
              className="input"
              value={dispute.subject}
              onChange={(e) => setDispute({ ...dispute, subject: e.target.value })}
              placeholder="Kuantitas tidak sesuai surat jalan"
            />
            <label className="label mt-3" htmlFor="isi">
              Uraian masalah
            </label>
            <textarea
              id="isi"
              className="input min-h-[110px]"
              value={dispute.description}
              onChange={(e) => setDispute({ ...dispute, description: e.target.value })}
              placeholder="Jelaskan kronologi, bukti foto, dan harapan penyelesaian…"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setDispute(null)}>
                Batal
              </button>
              <button type="button" className="btn-danger" onClick={kirimDispute} disabled={busy}>
                Kirim Sengketa
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
