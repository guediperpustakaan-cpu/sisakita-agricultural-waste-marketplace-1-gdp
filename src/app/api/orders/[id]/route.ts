import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, payments } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { driverSchema } from "@/lib/validation";
import { notify } from "@/lib/queries";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk" }, { status: 401 });

  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isFinite(orderId)) {
    return NextResponse.json({ error: "ID pesanan tidak valid" }, { status: 400 });
  }

  const rows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const order = rows[0];
  if (!order) return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });

  const body = (await request.json().catch(() => null)) as
    | { action?: string; driverName?: string; driverPhone?: string; vehiclePlate?: string; reason?: string }
    | null;
  const action = body?.action;
  const isProvider = order.providerId === user.id;
  const isBuyer = order.buyerId === user.id;

  if (action === "agree" || action === "reject") {
    if (!isProvider && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya penyedia yang dapat menindaklanjuti" }, { status: 403 });
    }
    if (order.status !== "PENDING") {
      return NextResponse.json({ error: "Pesanan sudah diproses" }, { status: 400 });
    }
    if (action === "agree") {
      await db
        .update(orders)
        .set({ status: "AGREED", agreedAt: new Date(), updatedAt: new Date() })
        .where(eq(orders.id, orderId));
      await notify({
        userId: order.buyerId,
        title: "Penawaran disetujui ✅",
        message: `Pesanan #${orderId} disetujui penyedia. Silakan lakukan pembayaran escrow.`,
        type: "ORDER",
        link: "/dashboard/industri",
      });
      return NextResponse.json({ success: true, status: "AGREED" });
    }
    const reason = body?.reason || "Tidak sesuai spesifikasi";
    await db
      .update(orders)
      .set({ status: "CANCELLED", cancelledReason: reason, updatedAt: new Date() })
      .where(eq(orders.id, orderId));
    await notify({
      userId: order.buyerId,
      title: "Penawaran ditolak",
      message: `Pesanan #${orderId} ditolak penyedia. Alasan: ${reason}`,
      type: "ORDER",
      link: "/dashboard/industri",
    });
    return NextResponse.json({ success: true, status: "CANCELLED" });
  }

  if (action === "pay") {
    if (!isBuyer) return NextResponse.json({ error: "Bukan pesanan Anda" }, { status: 403 });
    if (order.status !== "AGREED") {
      return NextResponse.json(
        { error: "Pembayaran hanya bisa dilakukan setelah pesanan disetujui" },
        { status: 400 },
      );
    }
    const method =
      body?.driverName === "XENDIT"
        ? "XENDIT"
        : body?.driverName === "BANK_TRANSFER"
          ? "BANK_TRANSFER"
          : "MIDTRANS";
    const existing = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .limit(1);
    if (existing[0]) {
      await db
        .update(payments)
        .set({ status: "PAID", method, paidAt: new Date(), escrowStatus: "HOLD" })
        .where(eq(payments.id, existing[0].id));
    } else {
      await db.insert(payments).values({
        orderId,
        amount: order.totalPrice,
        method,
        status: "PAID",
        escrowStatus: "HOLD",
        reference: `SK-${Date.now()}-${orderId}`,
        paidAt: new Date(),
      });
    }
    await notify({
      userId: order.providerId,
      title: "Pembayaran escrow diterima",
      message: `Dana untuk pesanan #${orderId} ditahan SisaKita dan akan dilepas setelah barang diterima.`,
      type: "PAYMENT",
      link: "/dashboard/penyedia",
    });
    return NextResponse.json({ success: true });
  }

  if (action === "ship") {
    if (!isProvider && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya penyedia yang dapat mengirim" }, { status: 403 });
    }
    if (order.status !== "AGREED") {
      return NextResponse.json(
        { error: "Lengkapi persetujuan & pembayaran terlebih dahulu" },
        { status: 400 },
      );
    }
    const driver = driverSchema.safeParse({
      driverName: body?.driverName,
      driverPhone: body?.driverPhone,
      vehiclePlate: body?.vehiclePlate,
    });
    if (!driver.success) {
      return NextResponse.json(
        { error: driver.error.issues[0]?.message ?? "Data pengemudi tidak lengkap" },
        { status: 400 },
      );
    }
    await db
      .update(orders)
      .set({
        status: "SHIPPING",
        driverName: driver.data.driverName,
        driverPhone: driver.data.driverPhone,
        vehiclePlate: driver.data.vehiclePlate,
        shippedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
    await notify({
      userId: order.buyerId,
      title: "Pesanan dalam pengiriman 🚚",
      message: `Pengemudi ${driver.data.driverName} (${driver.data.driverPhone}) dengan nopol ${driver.data.vehiclePlate} sedang mengirim pesanan #${orderId}.`,
      type: "SHIPPING",
      link: "/dashboard/industri",
    });
    return NextResponse.json({ success: true, status: "SHIPPING" });
  }

  if (action === "complete") {
    if (!isBuyer && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya pembeli yang dapat mengonfirmasi" }, { status: 403 });
    }
    if (order.status !== "SHIPPING") {
      return NextResponse.json({ error: "Pesanan belum dikirim" }, { status: 400 });
    }
    await db
      .update(orders)
      .set({ status: "COMPLETED", completedAt: new Date(), updatedAt: new Date() })
      .where(eq(orders.id, orderId));
    await db
      .update(payments)
      .set({ escrowStatus: "RELEASED", releasedAt: new Date() })
      .where(and(eq(payments.orderId, orderId), eq(payments.status, "PAID")));
    await notify({
      userId: order.providerId,
      title: "Dana escrow dilepas 💸",
      message: `Pesanan #${orderId} selesai. Dana telah dilepas ke saldo Anda.`,
      type: "PAYMENT",
      link: "/dashboard/penyedia",
    });
    return NextResponse.json({ success: true, status: "COMPLETED" });
  }

  return NextResponse.json({ error: "Aksi tidak dikenal" }, { status: 400 });
}

export async function GET(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk" }, { status: 401 });
  const { id } = await params;
  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, Number(id)))).limit(1);
  const order = rows[0];
  if (!order) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ order });
}
