"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber, formatRupiah, formatTanggal } from "@/lib/format";
import { DISPUTE_STATUS_LABEL, ROLE_LABEL, VERIFICATION_LABEL, statusTone } from "@/lib/labels";

export type AdminData = {
  stats: {
    totalWeight: number;
    totalOrders: number;
    completedOrders: number;
    transactionValue: number;
    activeListings: number;
    providers: number;
    industries: number;
    pendingVerification: number;
    escrowHeld: number;
    escrowReleased: number;
  };
  volume: { name: string; emoji: string | null; volume: string; nilai: string; jumlah: number }[];
  trend: { bulan: string; volume: string; nilai: string }[];
  users: {
    id: number;
    name: string;
    email: string;
    role: string;
    companyName: string | null;
    isVerified: boolean;
    verificationStatus: string;
    npwpUrl: string | null;
    permitUrl: string | null;
    city: string | null;
    createdAt: string | Date;
  }[];
  disputes: {
    id: number;
    orderId: number | null;
    subject: string;
    description: string;
    status: string;
    resolution: string | null;
    createdAt: string | Date;
    raisedByName: string | null;
    listingTitle: string | null;
  }[];
  categories: { id: number; categoryName: string; emoji: string | null; jumlahListing: number }[];
};

const WARNA = ["#2F8F2F", "#F5A623", "#4F9EE3", "#9C6ADE", "#E36A6A", "#22B8A6"];

type Tab = "overview" | "verifikasi" | "kategori" | "sengketa";

export function AdminPanel({ data }: { data: AdminData }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [pesan, setPesan] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [kategoriBaru, setKategoriBaru] = useState({ categoryName: "", emoji: "🌾", description: "" });
  const [resolusi, setResolusi] = useState<Record<number, string>>({});

  const tonData = data.volume
    .map((row) => ({
      name: row.name,
      ton: Number((Number(row.volume) / 1000).toFixed(2)),
      nilai: Number(row.nilai),
      jumlah: row.jumlah,
    }))
    .filter((row) => row.ton > 0 || row.jumlah > 0);

  const trendData = data.trend.map((row) => ({
    bulan: row.bulan,
    ton: Number((Number(row.volume) / 1000).toFixed(2)),
    nilai: Number(row.nilai),
  }));

  async function patch(body: Record<string, unknown>, label: string) {
    setBusy(true);
    try {
      const res = await fetch(body.target === "kategori" ? "/api/categories" : "/api/admin", {
        method: body.target === "kategori" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await res.json()) as { error?: string };
      setPesan(res.ok ? `${label} berhasil.` : (payload.error ?? "Gagal"));
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function hapusKategori(id: number) {
    setBusy(true);
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
      const payload = (await res.json()) as { error?: string };
      setPesan(res.ok ? "Kategori dihapus." : (payload.error ?? "Gagal menghapus"));
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const tabs: { key: Tab; label: string; emoji: string }[] = [
    { key: "overview", label: "Overview", emoji: "📊" },
    { key: "verifikasi", label: "Verifikasi Industri", emoji: "🛡️", },
    { key: "kategori", label: "Kategori Limbah", emoji: "🗂️" },
    { key: "sengketa", label: "Modul Sengketa", emoji: "⚖️" },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Tab admin">
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
          </button>
        ))}
      </div>

      {pesan ? (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
          {pesan}
        </p>
      ) : null}

      <div className="mt-5">
        {tab === "overview" ? (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Volume limbah bergerak", value: `${formatNumber(data.stats.totalWeight / 1000, 2)} ton`, emoji: "⚖️" },
                { label: "Nilai transaksi selesai", value: formatRupiah(data.stats.transactionValue), emoji: "💰" },
                { label: "Escrow ditahan", value: formatRupiah(data.stats.escrowHeld), emoji: "🔒" },
                { label: "Menunggu verifikasi", value: String(data.stats.pendingVerification), emoji: "🛡️" },
              ].map((card) => (
                <div key={card.label} className="card p-4">
                  <p className="text-xs text-neutral-500">
                    <span aria-hidden>{card.emoji}</span> {card.label}
                  </p>
                  <p className="mt-1 text-xl font-extrabold">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="card p-5">
              <h2 className="text-lg font-bold">Volume Limbah per Kategori (ton)</h2>
              <p className="text-xs text-neutral-500">Agregasi order per kategori limbah</p>
              <div className="mt-4 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => `${String(value)} ton`} />
                    <Bar dataKey="ton" fill="#2F8F2F" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="card p-5">
                <h2 className="text-lg font-bold">Tren Bulanan</h2>
                <div className="mt-4 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="ton" name="Volume (ton)" stroke="#2F8F2F" strokeWidth={2} />
                      <Line type="monotone" dataKey="nilai" name="Nilai (Rp)" stroke="#F5A623" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card p-5">
                <h2 className="text-lg font-bold">Komposisi Transaksi</h2>
                <div className="mt-4 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tonData}
                        dataKey="jumlah"
                        nameKey="name"
                        innerRadius={45}
                        outerRadius={90}
                        paddingAngle={2}
                      >
                        {tonData.map((entry, index) => (
                          <Cell key={entry.name} fill={WARNA[index % WARNA.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {tab === "verifikasi" ? (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <caption className="sr-only">Daftar pengguna untuk verifikasi akun industri</caption>
              <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Akun</th>
                  <th className="px-4 py-3">Peran</th>
                  <th className="px-4 py-3">Dokumen</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{u.companyName ?? u.name}</p>
                      <p className="text-xs text-neutral-500">
                        {u.email} · {u.city ?? "-"} · sejak {formatTanggal(u.createdAt)}
                      </p>
                    </td>
                    <td className="px-4 py-3">{ROLE_LABEL[u.role]}</td>
                    <td className="px-4 py-3 text-xs">
                      {u.npwpUrl ? (
                        <a className="text-[#2F8F2F] hover:underline" href={u.npwpUrl} target="_blank" rel="noreferrer">
                          NPWP
                        </a>
                      ) : (
                        <span className="text-neutral-400">NPWP -</span>
                      )}
                      {" · "}
                      {u.permitUrl ? (
                        <a className="text-[#2F8F2F] hover:underline" href={u.permitUrl} target="_blank" rel="noreferrer">
                          Izin
                        </a>
                      ) : (
                        <span className="text-neutral-400">Izin -</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${statusTone(u.verificationStatus)}`}>
                        {VERIFICATION_LABEL[u.verificationStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn-primary min-h-[40px] px-3 text-xs"
                          disabled={busy}
                          onClick={() => patch({ target: "verify", userId: u.id }, "Verifikasi")}
                        >
                          Setujui
                        </button>
                        <button
                          type="button"
                          className="btn-danger min-h-[40px] px-3 text-xs"
                          disabled={busy}
                          onClick={() => patch({ target: "reject", userId: u.id }, "Penolakan")}
                        >
                          Tolak
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {tab === "kategori" ? (
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <caption className="sr-only">Daftar kategori limbah</caption>
                <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Listing</th>
                    <th className="px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {data.categories.map((cat) => (
                    <tr key={cat.id}>
                      <td className="px-4 py-3">
                        <p className="font-semibold">
                          <span aria-hidden>{cat.emoji}</span> {cat.categoryName}
                        </p>
                      </td>
                      <td className="px-4 py-3">{cat.jumlahListing}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="btn-danger min-h-[40px] px-3 text-xs"
                          disabled={busy}
                          onClick={() => hapusKategori(cat.id)}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card p-5">
              <h2 className="text-base font-bold">Tambah Kategori</h2>
              <label className="label mt-3" htmlFor="nama-kategori">
                Nama kategori
              </label>
              <input
                id="nama-kategori"
                className="input"
                value={kategoriBaru.categoryName}
                onChange={(e) => setKategoriBaru({ ...kategoriBaru, categoryName: e.target.value })}
                placeholder="Sisa Gula Kelapa"
              />
              <label className="label mt-3" htmlFor="emoji-kategori">
                Ikon (emoji)
              </label>
              <input
                id="emoji-kategori"
                className="input"
                value={kategoriBaru.emoji}
                onChange={(e) => setKategoriBaru({ ...kategoriBaru, emoji: e.target.value })}
              />
              <label className="label mt-3" htmlFor="desc-kategori">
                Deskripsi
              </label>
              <textarea
                id="desc-kategori"
                className="input min-h-[80px]"
                value={kategoriBaru.description}
                onChange={(e) => setKategoriBaru({ ...kategoriBaru, description: e.target.value })}
                placeholder="Industri yang memanfaatkan limbah ini…"
              />
              <button
                type="button"
                className="btn-primary mt-4 w-full"
                disabled={busy || kategoriBaru.categoryName.length < 3}
                onClick={() =>
                  patch({ target: "kategori", ...kategoriBaru }, "Kategori ditambahkan")
                }
              >
                Simpan Kategori
              </button>
            </div>
          </div>
        ) : null}

        {tab === "sengketa" ? (
          <div className="space-y-3">
            {data.disputes.length === 0 ? (
              <div className="card p-8 text-center text-sm text-neutral-600">
                Tidak ada sengketa aktif. 🎉
              </div>
            ) : (
              data.disputes.map((d) => (
                <div key={d.id} className="card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-bold">
                        #{d.id} · {d.subject}
                      </p>
                      <p className="text-xs text-neutral-500">
                        Oleh {d.raisedByName ?? "-"} pada pesanan #{d.orderId ?? "-"} ·{" "}
                        {formatTanggal(d.createdAt, true)}
                      </p>
                    </div>
                    <span className={`badge ${statusTone(d.status)}`}>
                      {DISPUTE_STATUS_LABEL[d.status]}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-neutral-700">{d.description}</p>
                  {d.resolution ? (
                    <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                      Putusan: {d.resolution}
                    </p>
                  ) : (
                    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                      <input
                        className="input"
                        placeholder="Tuliskan putusan / tindak lanjut"
                        aria-label={`Putusan sengketa ${d.id}`}
                        value={resolusi[d.id] ?? ""}
                        onChange={(e) => setResolusi((prev) => ({ ...prev, [d.id]: e.target.value }))}
                      />
                      <button
                        type="button"
                        className="btn-primary min-h-[44px] px-4 text-xs"
                        disabled={busy}
                        onClick={() =>
                          patch(
                            { target: "dispute", disputeId: d.id, resolution: resolusi[d.id] || "Sengketa diselesaikan" },
                            "Putusan disimpan",
                          )
                        }
                      >
                        Selesaikan
                      </button>
                      <button
                        type="button"
                        className="btn-danger min-h-[44px] px-4 text-xs"
                        disabled={busy}
                        onClick={() =>
                          patch({ target: "dispute", disputeId: d.id, resolution: undefined }, "Sengketa ditolak")
                        }
                      >
                        Tolak
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
