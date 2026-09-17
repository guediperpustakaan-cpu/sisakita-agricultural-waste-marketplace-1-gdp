import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  getOrderRows,
  getProviderFinance,
  getProviderListingsWithStats,
} from "@/lib/queries";
import { ProviderDashboard } from "@/components/provider-dashboard";
import { formatNumber, formatRupiah } from "@/lib/format";

export const metadata = { title: "Dashboard Penyedia — SisaKita" };

export default async function DashboardPenyediaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk?redirect=/dashboard/penyedia");
  if (user.role === "INDUSTRY") redirect("/dashboard/industri");

  const [listings, orders, ringkasan] = await Promise.all([
    getProviderListingsWithStats(user.id),
    getOrderRows({ providerId: user.id }),
    getProviderFinance(user.id),
  ]);

  const stokTotal = listings.reduce((acc, item) => acc + Number(item.quantity), 0);
  const nilaiStok = listings.reduce(
    (acc, item) => acc + Number(item.quantity) * Number(item.pricePerUnit),
    0,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Dashboard Penyedia</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Selamat datang, {user.name}. Kelola inventaris limbah dan pesanan industri.
          </p>
        </div>
        <Link href="/laporan" className="btn-primary">
          📸 Laporkan Limbah Baru
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Listing aktif", value: formatNumber(listings.length), emoji: "📦" },
          { label: "Total stok (kg)", value: formatNumber(stokTotal), emoji: "⚖️" },
          { label: "Nilai stok", value: formatRupiah(nilaiStok), emoji: "🏷️" },
          { label: "Dana masuk", value: formatRupiah(ringkasan.masuk), emoji: "💰" },
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
        <ProviderDashboard
          listings={listings}
          orders={orders.map((order) => ({
            id: order.id,
            status: order.status,
            requestedQuantity: order.requestedQuantity,
            totalPrice: order.totalPrice,
            listingTitle: order.listingTitle,
            listingUnit: order.listingUnit,
            buyerName: order.buyerName,
            createdAt: order.createdAt,
            shippingAddress: order.shippingAddress,
            note: order.note,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
            escrowStatus: order.escrowStatus,
          }))}
          ringkasan={ringkasan}
        />
      </div>
    </div>
  );
}
