"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCartStore } from "@/store/cart";
import { formatQuantity, formatRupiah } from "@/lib/format";
import type { ListingRow } from "@/lib/queries";

export function ListingActions({
  listing,
  isLogin,
  role,
}: {
  listing: ListingRow;
  isLogin: boolean;
  role?: string;
}) {
  const router = useRouter();
  const add = useCartStore((s) => s.add);
  const [kuantitas, setKuantitas] = useState<number>(() =>
    Math.min(100, Math.max(1, Number(listing.quantity))),
  );
  const [alamat, setAlamat] = useState("");
  const [catatan, setCatatan] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [proses, setProses] = useState(false);

  const max = Number(listing.quantity);
  const satuan = listing.unit === "TON" ? "ton" : "kg";
  const total = kuantitas * Number(listing.pricePerUnit);
  const tidakTersedia = listing.status !== "AVAILABLE";
  const blocked = role === "PROVIDER";

  function itemCart() {
    return {
      listingId: listing.id,
      title: listing.title,
      unit: listing.unit,
      pricePerUnit: Number(listing.pricePerUnit),
      maxQuantity: max,
      imageUrl: listing.imageUrl,
      categoryName: listing.categoryName,
      providerName: listing.providerName,
      quantity: kuantitas,
      shippingAddress: alamat,
      note: catatan,
    };
  }

  async function kirim(mode: "BELI" | "PENAWARAN") {
    setGalat(null);
    setStatus(null);
    if (!isLogin) {
      router.push("/masuk?redirect=/listing/" + listing.id);
      return;
    }
    if (alamat.trim().length < 8) {
      setGalat("Alamat pengiriman minimal 8 karakter.");
      return;
    }
    setProses(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              listingId: listing.id,
              requestedQuantity: kuantitas,
              note:
                mode === "PENAWARAN"
                  ? `[PENAWARAN] ${catatan || "Mohon konfirmasi harga & jadwal angkut."}`
                  : catatan,
              shippingAddress: alamat,
            },
          ],
        }),
      });
      const data = (await res.json()) as { error?: string; orderIds?: number[] };
      if (!res.ok) {
        setGalat(data.error ?? "Gagal mengirim permintaan.");
        return;
      }
      setStatus(
        mode === "PENAWARAN"
          ? "Ajukan penawaran terkirim. Menunggu persetujuan penyedia."
          : "Permintaan pembelian terkirim. Lanjutkan ke dashboard untuk pembayaran escrow.",
      );
      if (mode === "BELI") router.push("/dashboard/industri/pesanan");
    } finally {
      setProses(false);
    }
  }

  if (tidakTersedia) {
    return (
      <div className="card p-5">
        <p className="font-bold">Listing tidak tersedia</p>
        <p className="mt-1 text-sm text-neutral-600">
          Limbah ini sudah terjual atau stoknya habis. Lihat listing serupa di bawah.
        </p>
        <Link href="/marketplace" className="btn-primary mt-4 w-full">
          Cari Limbah Lain
        </Link>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-2xl font-extrabold text-[#237023]">
          {formatRupiah(listing.pricePerUnit)}
          <span className="text-sm font-medium text-neutral-500">/{satuan}</span>
        </p>
        <span className="badge bg-leaf-50 text-[#237023] ring-emerald-200">
          Stok {formatQuantity(max, listing.unit)}
        </span>
      </div>

      <div className="mt-4">
        <label className="label" htmlFor="kuantitas">
          Kuantitas ({satuan})
        </label>
        <div className="flex gap-2">
          <input
            id="kuantitas"
            type="number"
            min={1}
            max={max}
            value={kuantitas}
            onChange={(e) => setKuantitas(Math.max(1, Math.min(max, Number(e.target.value))))}
            className="input"
            aria-label={`Kuantitas dalam ${satuan}`}
          />
          <button
            type="button"
            className="btn-ghost px-3"
            onClick={() => setKuantitas(max)}
            aria-label="Ambil seluruh stok"
          >
            Maks
          </button>
        </div>
        <input
          type="range"
          min={1}
          max={max}
          value={kuantitas}
          onChange={(e) => setKuantitas(Number(e.target.value))}
          className="mt-2 w-full accent-[#2F8F2F]"
          aria-label="Penggeser kuantitas"
        />
      </div>

      <div className="mt-3">
        <label className="label" htmlFor="alamat">
          Alamat pengiriman
        </label>
        <textarea
          id="alamat"
          className="input min-h-[80px]"
          placeholder="Nama pabrik, jalan, kota, kode pos"
          value={alamat}
          onChange={(e) => setAlamat(e.target.value)}
        />
      </div>

      <div className="mt-3">
        <label className="label" htmlFor="catatan">
          Catatan untuk penyedia
        </label>
        <textarea
          id="catatan"
          className="input min-h-[70px]"
          placeholder="Contoh: butuh pengemasan bal 50 kg, pengambilan minggu depan"
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
        />
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
        <span className="text-sm text-neutral-600">Estimasi total</span>
        <span className="text-lg font-extrabold">{formatRupiah(total)}</span>
      </div>

      {galat ? <p className="error-text">{galat}</p> : null}
      {status ? (
        <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
          {status}
        </p>
      ) : null}

      {blocked ? (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Anda masuk sebagai penyedia limbah. Gunakan akun industri untuk membeli.
        </p>
      ) : (
        <div className="mt-4 grid gap-2">
          <button
            type="button"
            className="btn-primary"
            disabled={proses}
            onClick={() => kirim("BELI")}
          >
            🛒 Beli Sekarang
          </button>
          <button
            type="button"
            className="btn-amber"
            disabled={proses}
            onClick={() => kirim("PENAWARAN")}
          >
            🤝 Ajukan Penawaran
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              add(itemCart());
              setStatus("Ditambahkan ke keranjang.");
            }}
          >
            ➕ Tambah ke Keranjang
          </button>
        </div>
      )}

      <p className="mt-3 text-xs text-neutral-500">
        Pembayaran diproses melalui escrow (Midtrans/Xendit). Dana baru dilepas
        setelah Anda mengonfirmasi penerimaan barang.
      </p>
    </div>
  );
}
