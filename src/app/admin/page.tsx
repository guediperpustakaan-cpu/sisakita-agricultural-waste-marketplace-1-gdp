import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  getCategories,
  getCategoryCounts,
  getDisputes,
  getMonthlyTrend,
  getPlatformStats,
  getVolumeByCategory,
  getUsersForAdmin,
} from "@/lib/queries";
import { AdminPanel } from "@/components/admin-panel";
import { formatNumber, formatRupiah } from "@/lib/format";

export const metadata = { title: "Panel Administrator — SisaKita" };

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk?redirect=/admin");
  if (user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="card p-8">
          <p className="text-4xl" aria-hidden>
            🚫
          </p>
          <h1 className="mt-3 text-xl font-extrabold">Akses ditolak</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Panel administrator hanya dapat diakses oleh akun dengan peran ADMIN.
          </p>
        </div>
      </div>
    );
  }

  const [stats, volume, trend, users, disputes, categories, counts] = await Promise.all([
    getPlatformStats(),
    getVolumeByCategory(),
    getMonthlyTrend(),
    getUsersForAdmin(),
    getDisputes(),
    getCategories(),
    getCategoryCounts(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
      <h1 className="text-2xl font-extrabold">Panel Administrator</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Pantau performa marketplace, verifikasi akun industri, kelola kategori, dan
        putuskan sengketa transaksi.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Penyedia terdaftar", value: formatNumber(stats.providers), emoji: "👨‍🌾" },
          { label: "Industri terdaftar", value: formatNumber(stats.industries), emoji: "🏭" },
          { label: "Listing aktif", value: formatNumber(stats.activeListings), emoji: "📦" },
          { label: "Order selesai", value: formatNumber(stats.completedOrders), emoji: "✅" },
        ].map((card) => (
          <div key={card.label} className="card p-4">
            <p className="text-xs text-neutral-500">
              <span aria-hidden>{card.emoji}</span> {card.label}
            </p>
            <p className="mt-1 text-xl font-extrabold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <AdminPanel
          data={{
            stats,
            volume,
            trend,
            users,
            disputes,
            categories: categories.map((c) => ({
              id: c.id,
              categoryName: c.categoryName,
              emoji: c.emoji,
              jumlahListing: counts.get(c.id) ?? 0,
            })),
          }}
        />
      </div>

      <div className="card mt-6 p-5">
        <h2 className="text-lg font-bold">Ringkasan Escrow</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-amber-50 p-4">
            <p className="text-xs font-semibold text-amber-900">Dana ditahan (escrow)</p>
            <p className="text-2xl font-extrabold text-amber-900">
              {formatRupiah(stats.escrowHeld)}
            </p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-xs font-semibold text-emerald-900">Dana sudah dilepas</p>
            <p className="text-2xl font-extrabold text-emerald-900">
              {formatRupiah(stats.escrowReleased)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
