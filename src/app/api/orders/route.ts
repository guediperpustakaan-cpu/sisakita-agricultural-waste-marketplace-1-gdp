import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { listings, orders } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { orderSchema } from "@/lib/validation";
import { getOrderRows, notify } from "@/lib/queries";

const bulkSchema = z.object({
  items: z.array(orderSchema).min(1, "Keranjang masih kosong"),
});

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk" }, { status: 401 });
  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") ?? "auto";
  const rows =
    scope === "provider" || (scope === "auto" && user.role === "PROVIDER")
      ? await getOrderRows({ providerId: user.id })
      : await getOrderRows({ buyerId: user.id });
  return NextResponse.json({ items: rows });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Silakan masuk sebagai industri untuk memesan" },
      { status: 401 },
    );
  }
  if (user.role === "PROVIDER") {
    return NextResponse.json(
      { error: "Akun penyedia tidak dapat melakukan pembelian" },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as unknown;
  const candidate = (body as { items?: unknown } | null)?.items ?? body;
  const parsed = bulkSchema.safeParse(
    Array.isArray(candidate) ? { items: candidate } : { items: [candidate] },
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data pesanan tidak valid" },
      { status: 400 },
    );
  }

  const created: number[] = [];
  const errors: string[] = [];

  for (const item of parsed.data.items) {
    const rows = await db
      .select()
      .from(listings)
      .where(and(eq(listings.id, item.listingId), eq(listings.status, "AVAILABLE")))
      .limit(1);
    const listing = rows[0];
    if (!listing) {
      errors.push(`Listing #${item.listingId} tidak tersedia.`);
      continue;
    }
    if (item.requestedQuantity > Number(listing.quantity)) {
      errors.push(
        `Stok ${listing.title} hanya ${Number(listing.quantity)} ${listing.unit === "TON" ? "ton" : "kg"}.`,
      );
      continue;
    }

    const total = item.requestedQuantity * Number(listing.pricePerUnit);
    const [order] = await db
      .insert(orders)
      .values({
        buyerId: user.id,
        listingId: listing.id,
        providerId: listing.providerId,
        requestedQuantity: String(item.requestedQuantity),
        totalPrice: total.toFixed(2),
        note: item.note || null,
        shippingAddress: item.shippingAddress,
      })
      .returning();
    created.push(order.id);

    const sisa = Number(listing.quantity) - item.requestedQuantity;
    await db
      .update(listings)
      .set({
        quantity: sisa.toFixed(3),
        status: sisa <= 0 ? "SOLD" : "AVAILABLE",
      })
      .where(eq(listings.id, listing.id));

    await notify({
      userId: listing.providerId,
      title: "Permintaan pembelian baru",
      message: `${user.companyName ?? user.name} mengajukan ${item.requestedQuantity} ${
        listing.unit === "TON" ? "ton" : "kg"
      } ${listing.title}.`,
      type: "ORDER",
      link: "/dashboard/penyedia",
    });
  }

  if (!created.length) {
    return NextResponse.json(
      { error: errors[0] ?? "Pesanan gagal dibuat" },
      { status: 400 },
    );
  }

  await notify({
    userId: user.id,
    title: "Pesanan dikirim ke penyedia",
    message: `${created.length} permintaan pembelian dibuat dan menunggu persetujuan penyedia.`,
    type: "ORDER",
    link: "/dashboard/industri",
  });

  return NextResponse.json({ orderIds: created, peringatan: errors }, { status: 201 });
}

export async function PATCH(request: Request) {
  // Pembeli mengajukan sengketa cepat / membatalkan pesanan sendiri
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as
    | { id?: number; action?: string }
    | null;
  if (!body?.id) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

  if (body.action === "cancel") {
    const rows = await db
      .select()
      .from(orders)
      .where(user.role === "ADMIN" ? eq(orders.id, body.id) : and(eq(orders.id, body.id), eq(orders.buyerId, user.id)))
      .limit(1);
    const order = rows[0];
    if (!order || order.status !== "PENDING") {
      return NextResponse.json(
        { error: "Pesanan hanya dapat dibatalkan sebelum disetujui" },
        { status: 400 },
      );
    }
    await db
      .update(orders)
      .set({ status: "CANCELLED", cancelledReason: "Dibatalkan pembeli", updatedAt: new Date() })
      .where(eq(orders.id, body.id));
    if (order.listingId) {
      await db
        .update(listings)
        .set({
          quantity: sql`${listings.quantity} + ${order.requestedQuantity}`,
          status: "AVAILABLE",
        })
        .where(eq(listings.id, order.listingId));
    }
    await notify({
      userId: order.providerId,
      title: "Pesanan dibatalkan pembeli",
      message: `Pesanan #${order.id} dibatalkan oleh pembeli sebelum persetujuan.`,
      type: "ORDER",
      link: "/dashboard/penyedia",
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Aksi tidak dikenal" }, { status: 400 });
}
