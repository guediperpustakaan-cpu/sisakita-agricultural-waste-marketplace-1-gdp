import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { orders, payments } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { notify } from "@/lib/queries";

const paySchema = z.object({
  orderId: z.coerce.number().int().positive(),
  method: z.enum(["MIDTRANS", "XENDIT", "BANK_TRANSFER"]).default("MIDTRANS"),
});

const actionSchema = z.object({
  orderId: z.coerce.number().int().positive(),
  action: z.enum(["release", "refund"]),
});

/** Membuat transaksi pembayaran (simulasi Snap Midtrans / Invoice Xendit). */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk" }, { status: 401 });

  const parsed = paySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Data pembayaran tidak valid" }, { status: 400 });
  }
  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, parsed.data.orderId), eq(orders.buyerId, user.id)))
    .limit(1);
  const order = rows[0];
  if (!order) return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });

  const existing = await db
    .select()
    .from(payments)
    .where(eq(payments.orderId, order.id))
    .limit(1);
  const reference = `SK-${order.id}-${Date.now().toString(36).toUpperCase()}`;

  const values = {
    orderId: order.id,
    amount: order.totalPrice,
    method: parsed.data.method,
    status: "UNPAID" as const,
    escrowStatus: "HOLD" as const,
    reference,
  };

  let payment;
  if (existing[0]) {
    [payment] = await db
      .update(payments)
      .set(values)
      .where(eq(payments.id, existing[0].id))
      .returning();
  } else {
    [payment] = await db.insert(payments).values(values).returning();
  }

  return NextResponse.json(
    {
      payment,
      redirectUrl: `https://sandbox.midtrans.com/pay/${reference}`,
      instruksi:
        "Simulasi pembayaran: dana akan ditahan dalam rekening escrow SisaKita hingga pembeli mengonfirmasi penerimaan barang.",
    },
    { status: 201 },
  );
}

/** Melepas atau mengembalikan dana escrow (dipakai admin saat sengketa). */
export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Hanya administrator" }, { status: 403 });
  }
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }
  const rows = await db
    .select()
    .from(payments)
    .where(eq(payments.orderId, parsed.data.orderId))
    .limit(1);
  const payment = rows[0];
  if (!payment) return NextResponse.json({ error: "Pembayaran tidak ada" }, { status: 404 });

  const refund = parsed.data.action === "refund";
  await db
    .update(payments)
    .set({
      status: refund ? "REFUNDED" : "PAID",
      escrowStatus: refund ? "REFUNDED" : "RELEASED",
      releasedAt: refund ? null : new Date(),
    })
    .where(eq(payments.id, payment.id));

  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.id, payment.orderId))
    .limit(1);
  await notify({
    userId: refund ? orderRows[0]?.buyerId ?? null : orderRows[0]?.providerId ?? null,
    title: refund ? "Dana dikembalikan" : "Dana escrow dilepas",
    message: refund
      ? `Dana pesanan #${payment.orderId} dikembalikan ke pembeli oleh admin.`
      : `Dana pesanan #${payment.orderId} dilepas ke penyedia oleh admin.`,
    type: "PAYMENT",
    link: refund ? "/dashboard/industri" : "/dashboard/penyedia",
  });

  return NextResponse.json({ success: true });
}
