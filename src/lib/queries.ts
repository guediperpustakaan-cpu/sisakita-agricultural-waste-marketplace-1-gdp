import "server-only";
import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import {
  disputes,
  listings,
  notifications,
  orders,
  payments,
  users,
  wasteCategories,
} from "@/db/schema";

const buyerUser = alias(users, "buyer_user");
const providerUser = alias(users, "provider_user");
const disputeUser = alias(users, "dispute_user");

/**
 * Ekspresi SQL jarak Haversine (km). Pada database produksi (Neon) disarankan
 * mengaktifkan ekstensi PostGIS dan mengganti dengan `ST_DWithin`; formula
 * ini dipakai agar tetap berjalan di semua instance PostgreSQL.
 */
export function distanceExpr(lat: number, lng: number) {
  return sql<number>`6371 * acos(least(1, greatest(-1,
    sin(radians(${lat})) * sin(radians(coalesce(${listings.latitude}, 0))) +
    cos(radians(${lat})) * cos(radians(coalesce(${listings.latitude}, 0))) *
    cos(radians(coalesce(${listings.longitude}, 0)) - radians(${lng}))
  )))`;
}

export type ListingRow = {
  id: number;
  title: string;
  description: string | null;
  quantity: string;
  unit: "KG" | "TON";
  pricePerUnit: string;
  condition: "DRY" | "WET" | "SEMI_DRY";
  imageUrl: string | null;
  status: "AVAILABLE" | "SOLD" | "OUT_OF_STOCK";
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: Date;
  categoryId: number | null;
  categoryName: string | null;
  categoryEmoji: string | null;
  providerId: number;
  providerName: string;
  providerRating: string;
  providerPhone: string | null;
  providerVerified: boolean;
  distanceKm: number | null;
};

export type SearchParams = {
  q?: string;
  categoryId?: number;
  condition?: "DRY" | "WET" | "SEMI_DRY";
  maxPrice?: number;
  radiusKm?: number;
  lat?: number;
  lng?: number;
  sort?: "terbaru" | "termurah" | "terdekat" | "volume";
  providerId?: number;
  limit?: number;
};

export async function searchListings(params: SearchParams): Promise<ListingRow[]> {
  const { lat, lng } = params;
  const hasOrigin = typeof lat === "number" && typeof lng === "number";
  const dist = hasOrigin ? distanceExpr(lat as number, lng as number) : sql<number>`NULL::double precision`;

  const filters = [];
  if (params.q) {
    filters.push(
      or(
        ilike(listings.title, `%${params.q}%`),
        ilike(listings.description, `%${params.q}%`),
        ilike(wasteCategories.categoryName, `%${params.q}%`),
        ilike(listings.city, `%${params.q}%`),
      ),
    );
  }
  if (params.categoryId) filters.push(eq(listings.categoryId, params.categoryId));
  if (params.condition) filters.push(eq(listings.condition, params.condition));
  if (params.maxPrice) filters.push(lte(listings.pricePerUnit, String(params.maxPrice)));
  if (params.providerId) filters.push(eq(listings.providerId, params.providerId));

  const orderBy = (() => {
    switch (params.sort) {
      case "termurah":
        return asc(listings.pricePerUnit);
      case "volume":
        return desc(listings.quantity);
      case "terdekat":
        return hasOrigin ? asc(dist) : desc(listings.createdAt);
      default:
        return desc(listings.createdAt);
    }
  })();

  const query = db
    .select({
      id: listings.id,
      title: listings.title,
      description: listings.description,
      quantity: listings.quantity,
      unit: listings.unit,
      pricePerUnit: listings.pricePerUnit,
      condition: listings.condition,
      imageUrl: listings.imageUrl,
      status: listings.status,
      city: listings.city,
      latitude: listings.latitude,
      longitude: listings.longitude,
      createdAt: listings.createdAt,
      categoryId: listings.categoryId,
      categoryName: wasteCategories.categoryName,
      categoryEmoji: wasteCategories.emoji,
      providerId: users.id,
      providerName: users.name,
      providerRating: users.rating,
      providerPhone: users.phone,
      providerVerified: users.isVerified,
      distanceKm: dist,
    })
    .from(listings)
    .leftJoin(users, eq(listings.providerId, users.id))
    .leftJoin(wasteCategories, eq(listings.categoryId, wasteCategories.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(orderBy)
    .limit(params.limit ?? 60);

  let rows = (await query) as ListingRow[];

  if (hasOrigin && params.radiusKm) {
    rows = rows.filter((row) => (row.distanceKm ?? Infinity) <= params.radiusKm!);
  }
  return rows;
}

export async function getListing(id: number): Promise<ListingRow | null> {
  const rows = await searchListings({ limit: 500 });
  return rows.find((row) => row.id === id) ?? null;
}

export async function getCategories() {
  return db.select().from(wasteCategories).orderBy(asc(wasteCategories.categoryName));
}

export async function getCategoryCounts(): Promise<Map<number, number>> {
  const rows = await db
    .select({ categoryId: listings.categoryId, jumlah: sql<number>`count(*)::int` })
    .from(listings)
    .groupBy(listings.categoryId);
  const map = new Map<number, number>();
  for (const row of rows) {
    if (row.categoryId !== null) map.set(row.categoryId, row.jumlah);
  }
  return map;
}

export async function getPlatformStats() {
  const [volume] = await db
    .select({
      totalWeight: sql<string>`coalesce(sum(case when ${orders.status} in ('SHIPPING','COMPLETED') then ${orders.requestedQuantity} else 0 end), 0)`,
      totalOrders: sql<number>`count(*)::int`,
      completedOrders: sql<number>`count(*) filter (where ${orders.status} = 'COMPLETED')::int`,
      transactionValue: sql<string>`coalesce(sum(case when ${orders.status} = 'COMPLETED' then ${orders.totalPrice} else 0 end), 0)`,
    })
    .from(orders);

  const [listingStats] = await db
    .select({
      active: sql<number>`count(*) filter (where ${listings.status} = 'AVAILABLE')::int`,
      total: sql<number>`count(*)::int`,
    })
    .from(listings);

  const [userStats] = await db
    .select({
      providers: sql<number>`count(*) filter (where ${users.role} = 'PROVIDER')::int`,
      industries: sql<number>`count(*) filter (where ${users.role} = 'INDUSTRY')::int`,
      pendingVerification: sql<number>`count(*) filter (where ${users.verificationStatus} = 'PENDING')::int`,
    })
    .from(users);

  const [escrow] = await db
    .select({
      held: sql<string>`coalesce(sum(case when ${payments.escrowStatus} = 'HOLD' and ${payments.status} = 'PAID' then ${payments.amount} else 0 end), 0)`,
      released: sql<string>`coalesce(sum(case when ${payments.escrowStatus} = 'RELEASED' then ${payments.amount} else 0 end), 0)`,
    })
    .from(payments);

  return {
    totalWeight: Number(volume?.totalWeight ?? 0),
    totalOrders: volume?.totalOrders ?? 0,
    completedOrders: volume?.completedOrders ?? 0,
    transactionValue: Number(volume?.transactionValue ?? 0),
    activeListings: listingStats?.active ?? 0,
    totalListings: listingStats?.total ?? 0,
    providers: userStats?.providers ?? 0,
    industries: userStats?.industries ?? 0,
    pendingVerification: userStats?.pendingVerification ?? 0,
    escrowHeld: Number(escrow?.held ?? 0),
    escrowReleased: Number(escrow?.released ?? 0),
  };
}

/** Volume limbah per kategori untuk grafik admin. */
export async function getVolumeByCategory() {
  const rows = await db
    .select({
      name: wasteCategories.categoryName,
      emoji: wasteCategories.emoji,
      volume: sql<string>`coalesce(sum(${orders.requestedQuantity}), 0)`,
      nilai: sql<string>`coalesce(sum(${orders.totalPrice}), 0)`,
      jumlah: sql<number>`count(${orders.id})::int`,
    })
    .from(wasteCategories)
    .leftJoin(listings, eq(listings.categoryId, wasteCategories.id))
    .leftJoin(orders, eq(orders.listingId, listings.id))
    .groupBy(wasteCategories.id, wasteCategories.categoryName, wasteCategories.emoji)
    .orderBy(desc(sql`coalesce(sum(${orders.requestedQuantity}), 0)`));
  return rows;
}

export async function getMonthlyTrend() {
  const rows = await db
    .select({
      bulan: sql<string>`to_char(date_trunc('month', ${orders.createdAt}), 'YYYY-MM')`,
      volume: sql<string>`coalesce(sum(${orders.requestedQuantity}), 0)`,
      nilai: sql<string>`coalesce(sum(${orders.totalPrice}), 0)`,
    })
    .from(orders)
    .groupBy(sql`date_trunc('month', ${orders.createdAt})`)
    .orderBy(asc(sql`date_trunc('month', ${orders.createdAt})`));
  return rows;
}

export async function notify(input: {
  userId: number | null;
  title: string;
  message: string;
  type?: string;
  link?: string;
}) {
  if (!input.userId) return;
  await db.insert(notifications).values({
    userId: input.userId,
    title: input.title,
    message: input.message,
    type: input.type ?? "ORDER",
    link: input.link,
  });
}

export async function getUserNotifications(userId: number) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(25);
}

export async function getOrderRows(options: {
  buyerId?: number;
  providerId?: number;
}) {
  const filters = [];
  if (options.buyerId) filters.push(eq(orders.buyerId, options.buyerId));
  if (options.providerId) filters.push(eq(orders.providerId, options.providerId));

  return db
    .select({
      id: orders.id,
      status: orders.status,
      requestedQuantity: orders.requestedQuantity,
      totalPrice: orders.totalPrice,
      note: orders.note,
      shippingAddress: orders.shippingAddress,
      driverName: orders.driverName,
      driverPhone: orders.driverPhone,
      vehiclePlate: orders.vehiclePlate,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      agreedAt: orders.agreedAt,
      shippedAt: orders.shippedAt,
      completedAt: orders.completedAt,
      cancelledReason: orders.cancelledReason,
      listingId: orders.listingId,
      listingTitle: listings.title,
      listingUnit: listings.unit,
      listingImage: listings.imageUrl,
      listingLat: listings.latitude,
      listingLng: listings.longitude,
      buyerId: orders.buyerId,
      buyerName: sql<string>`buyer.name`,
      providerId: orders.providerId,
      providerName: sql<string>`provider.name`,
      paymentId: payments.id,
      paymentStatus: payments.status,
      paymentMethod: payments.method,
      escrowStatus: payments.escrowStatus,
      paidAt: payments.paidAt,
      releasedAt: payments.releasedAt,
    })
    .from(orders)
    .leftJoin(listings, eq(orders.listingId, listings.id))
    .leftJoin(buyerUser, eq(buyerUser.id, orders.buyerId))
    .leftJoin(providerUser, eq(providerUser.id, orders.providerId))
    .leftJoin(payments, eq(payments.orderId, orders.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(120);
}

export type OrderRow = Awaited<ReturnType<typeof getOrderRows>>[number];

export async function getProviderFinance(providerId: number) {
  const rows = await db
    .select({
      status: orders.status,
      total: orders.totalPrice,
      escrow: payments.escrowStatus,
      paymentStatus: payments.status,
    })
    .from(orders)
    .leftJoin(payments, eq(payments.orderId, orders.id))
    .where(eq(orders.providerId, providerId));

  const masuk = rows
    .filter((r) => r.status === "COMPLETED")
    .reduce((acc, r) => acc + Number(r.total), 0);
  const ditahan = rows
    .filter((r) => r.escrow === "HOLD" && r.paymentStatus === "PAID")
    .reduce((acc, r) => acc + Number(r.total), 0);
  const berjalan = rows
    .filter((r) => r.status === "SHIPPING" || r.status === "AGREED")
    .reduce((acc, r) => acc + Number(r.total), 0);

  return { masuk, ditahan, berjalan };
}

export async function getDisputes() {
  return db
    .select({
      id: disputes.id,
      orderId: disputes.orderId,
      subject: disputes.subject,
      description: disputes.description,
      status: disputes.status,
      resolution: disputes.resolution,
      createdAt: disputes.createdAt,
      raisedByName: disputeUser.name,
      listingTitle: listings.title,
    })
    .from(disputes)
    .leftJoin(disputeUser, eq(disputeUser.id, disputes.raisedById))
    .leftJoin(orders, eq(orders.id, disputes.orderId))
    .leftJoin(listings, eq(listings.id, orders.listingId))
    .orderBy(desc(disputes.createdAt))
    .limit(50);
}

export async function getUsersForAdmin() {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      phone: users.phone,
      companyName: users.companyName,
      isVerified: users.isVerified,
      verificationStatus: users.verificationStatus,
      npwpUrl: users.npwpUrl,
      permitUrl: users.permitUrl,
      city: users.city,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(100);
}

export async function getRecentNotificationsForUsers(userIds: number[]) {
  if (!userIds.length) return [];
  return db
    .select()
    .from(notifications)
    .where(inArray(notifications.userId, userIds))
    .orderBy(desc(notifications.createdAt))
    .limit(10);
}

export async function getProviderListingsWithStats(providerId: number) {
  const rows = await searchListings({ providerId, limit: 100 });
  const counts = await db
    .select({
      listingId: orders.listingId,
      total: sql<number>`count(*)::int`,
      volume: sql<string>`coalesce(sum(${orders.requestedQuantity}), 0)`,
      pending: sql<number>`count(*) filter (where ${orders.status} = 'PENDING')::int`,
    })
    .from(orders)
    .where(eq(orders.providerId, providerId))
    .groupBy(orders.listingId);

  return rows.map((row) => {
    const stat = counts.find((c) => c.listingId === row.id);
    return {
      ...row,
      orderCount: stat?.total ?? 0,
      orderVolume: Number(stat?.volume ?? 0),
      pendingCount: stat?.pending ?? 0,
    };
  });
}

export async function getBuyerOrdersWithSpend(buyerId: number) {
  const rows = await getOrderRows({ buyerId });
  const spend = rows
    .filter((r) => r.status === "COMPLETED")
    .reduce((acc, r) => acc + Number(r.totalPrice), 0);
  const aktif = rows.filter((r) =>
    ["PENDING", "AGREED", "SHIPPING"].includes(r.status),
  ).length;
  return { rows, spend, aktif };
}

export async function getHighValueListings(minPrice = 0) {
  return db
    .select({ id: listings.id, title: listings.title })
    .from(listings)
    .where(gte(listings.pricePerUnit, String(minPrice)))
    .limit(1);
}
