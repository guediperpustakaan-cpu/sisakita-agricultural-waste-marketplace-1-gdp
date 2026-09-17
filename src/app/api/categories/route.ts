import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { listings, wasteCategories } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { categorySchema } from "@/lib/validation";
import { getCategories } from "@/lib/queries";

export async function GET() {
  const items = await getCategories();
  const counts = await db
    .select({
      categoryId: listings.categoryId,
      jumlah: sql<number>`count(*)::int`,
    })
    .from(listings)
    .groupBy(listings.categoryId);
  return NextResponse.json({
    items: items.map((item) => ({
      ...item,
      jumlahListing: counts.find((c) => c.categoryId === item.id)?.jumlah ?? 0,
    })),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Hanya administrator" }, { status: 403 });
  }
  const parsed = categorySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data kategori tidak valid" },
      { status: 400 },
    );
  }
  const [created] = await db
    .insert(wasteCategories)
    .values({
      categoryName: parsed.data.categoryName,
      description: parsed.data.description || null,
      emoji: parsed.data.emoji || "🌾",
    })
    .returning();
  return NextResponse.json({ category: created }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Hanya administrator" }, { status: 403 });
  }
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  const dipakai = await db
    .select({ id: listings.id })
    .from(listings)
    .where(eq(listings.categoryId, id))
    .limit(1);
  if (dipakai[0]) {
    return NextResponse.json(
      { error: "Kategori masih dipakai listing dan tidak dapat dihapus" },
      { status: 400 },
    );
  }
  await db.delete(wasteCategories).where(eq(wasteCategories.id, id));
  return NextResponse.json({ success: true });
}
