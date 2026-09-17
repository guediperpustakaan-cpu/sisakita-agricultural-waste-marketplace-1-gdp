import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { listingSchema } from "@/lib/validation";
import { notify, searchListings } from "@/lib/queries";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lat = url.searchParams.get("lat");
  const lng = url.searchParams.get("lng");
  const categoryId = url.searchParams.get("categoryId");
  const maxPrice = url.searchParams.get("maxPrice");
  const radiusKm = url.searchParams.get("radiusKm");
  const condition = url.searchParams.get("condition");
  const sort = url.searchParams.get("sort");
  const providerId = url.searchParams.get("providerId");

  const rows = await searchListings({
    q: url.searchParams.get("q") ?? undefined,
    categoryId: categoryId ? Number(categoryId) : undefined,
    condition: condition === "DRY" || condition === "WET" || condition === "SEMI_DRY" ? condition : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    radiusKm: radiusKm ? Number(radiusKm) : undefined,
    lat: lat ? Number(lat) : undefined,
    lng: lng ? Number(lng) : undefined,
    sort:
      sort === "termurah" || sort === "terdekat" || sort === "volume" || sort === "terbaru"
        ? sort
        : "terbaru",
    providerId: providerId ? Number(providerId) : undefined,
  });

  return NextResponse.json({ items: rows, total: rows.length });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });
  }
  if (user.role !== "PROVIDER" && user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Hanya penyedia limbah yang dapat membuat listing" },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = listingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
      { status: 400 },
    );
  }
  const data = parsed.data;

  const [created] = await db
    .insert(listings)
    .values({
      providerId: user.id,
      categoryId: data.categoryId,
      title: data.title,
      description: data.description,
      quantity: String(data.quantity),
      unit: data.unit,
      pricePerUnit: String(data.pricePerUnit),
      condition: data.condition,
      latitude: data.latitude,
      longitude: data.longitude,
      city: data.city || null,
      imageUrl: data.imageUrl || null,
    })
    .returning();

  await notify({
    userId: user.id,
    title: "Listing berhasil diterbitkan",
    message: `${created.title} kini tampil di marketplace SisaKita.`,
    type: "LISTING",
    link: `/listing/${created.id}`,
  });

  return NextResponse.json({ listing: created }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as
    | { id?: number; quantity?: number; pricePerUnit?: number; status?: string }
    | null;
  if (!body?.id) {
    return NextResponse.json({ error: "ID listing wajib diisi" }, { status: 400 });
  }
  const where =
    user.role === "ADMIN"
      ? eq(listings.id, body.id)
      : and(eq(listings.id, body.id), eq(listings.providerId, user.id));

  const patch: Record<string, unknown> = {};
  if (typeof body.quantity === "number") patch.quantity = String(body.quantity);
  if (typeof body.pricePerUnit === "number")
    patch.pricePerUnit = String(body.pricePerUnit);
  if (body.status === "AVAILABLE" || body.status === "SOLD" || body.status === "OUT_OF_STOCK") {
    patch.status = body.status;
  }
  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "Tidak ada perubahan" }, { status: 400 });
  }

  const [updated] = await db
    .update(listings)
    .set(patch)
    .where(where)
    .returning();
  if (!updated) {
    return NextResponse.json({ error: "Listing tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ listing: updated });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

  const where =
    user.role === "ADMIN"
      ? eq(listings.id, id)
      : and(eq(listings.id, id), eq(listings.providerId, user.id));
  const deleted = await db.delete(listings).where(where).returning({ id: listings.id });
  if (!deleted[0]) {
    return NextResponse.json({ error: "Listing tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
