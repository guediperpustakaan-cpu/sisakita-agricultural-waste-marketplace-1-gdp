import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOrderRows } from "@/lib/queries";
import { IndustryDashboard } from "@/components/industry-dashboard";
import { VERIFICATION_LABEL } from "@/lib/labels";

export const metadata = { title: "Dashboard Industri — SisaKita" };

export default async function DashboardIndustriPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk?redirect=/dashboard/industri");
  if (user.role === "PROVIDER") redirect("/dashboard/penyedia");

  const orders = await getOrderRows({ buyerId: user.id });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Dashboard Industri</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {user.companyName ?? user.name} · status verifikasi{" "}
            <strong>{VERIFICATION_LABEL[user.verificationStatus]}</strong>
          </p>
        </div>
      </div>

      {!user.isVerified ? (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          ⚠️ Dokumen NPWP/izin usaha Anda masih dalam peninjauan administrator. Anda
          dapat menjelajah marketplace, namun pelepasan dana escrow untuk volume besar
          menunggu verifikasi.
        </p>
      ) : null}

      <div className="mt-6">
        <IndustryDashboard
          orders={orders.map((order) => ({
            id: order.id,
            status: order.status,
            requestedQuantity: order.requestedQuantity,
            totalPrice: order.totalPrice,
            listingTitle: order.listingTitle,
            listingUnit: order.listingUnit,
            listingImage: order.listingImage,
            listingLat: order.listingLat,
            listingLng: order.listingLng,
            providerName: order.providerName,
            createdAt: order.createdAt,
            shippingAddress: order.shippingAddress,
            note: order.note,
            driverName: order.driverName,
            driverPhone: order.driverPhone,
            vehiclePlate: order.vehiclePlate,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
            escrowStatus: order.escrowStatus,
          }))}
        />
      </div>
    </div>
  );
}
