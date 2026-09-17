import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { IndustryDashboard } from "@/components/industry-dashboard";
import { getOrderRows } from "@/lib/queries";

export const metadata = { title: "Keranjang Pesanan — SisaKita" };

export default async function KeranjangPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk?redirect=/dashboard/industri/keranjang");

  const orders = await getOrderRows({ buyerId: user.id });
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
      <h1 className="text-2xl font-extrabold">Keranjang &amp; Pesanan</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Atur volume, alamat pengiriman, lalu checkout untuk membuat tagihan escrow.
      </p>
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
