import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { disputes, orders } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { disputeSchema } from "@/lib/validation";
import { notify } from "@/lib/queries";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk" }, { status: 401 });
  const parsed = disputeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data sengketa tidak valid" },
      { status: 400 },
    );
  }

  const rows = await db
    .select()
    .from(orders)
    .where(
      user.role === "ADMIN"
        ? eq(orders.id, parsed.data.orderId)
        : and(
            eq(orders.id, parsed.data.orderId),
            user.role === "PROVIDER"
              ? eq(orders.providerId, user.id)
              : eq(orders.buyerId, user.id),
          ),
    )
    .limit(1);
  if (!rows[0]) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
  }

  const [created] = await db
    .insert(disputes)
    .values({
      orderId: parsed.data.orderId,
      raisedById: user.id,
      subject: parsed.data.subject,
      description: parsed.data.description,
    })
    .returning();

  await notify({
    userId: rows[0].buyerId === user.id ? rows[0].providerId : rows[0].buyerId,
    title: "Sengketa diajukan",
    message: `Sengketa "${parsed.data.subject}" diajukan untuk pesanan #${parsed.data.orderId}. Admin akan meninjau.`,
    type: "DISPUTE",
    link: "/admin",
  });

  return NextResponse.json({ dispute: created }, { status: 201 });
}


