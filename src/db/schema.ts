import {
  boolean,
  doublePrecision,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["PROVIDER", "INDUSTRY", "ADMIN"]);
export const unitEnum = pgEnum("unit", ["KG", "TON"]);
export const conditionEnum = pgEnum("condition", ["DRY", "WET", "SEMI_DRY"]);
export const listingStatusEnum = pgEnum("listing_status", [
  "AVAILABLE",
  "SOLD",
  "OUT_OF_STOCK",
]);
export const orderStatusEnum = pgEnum("order_status", [
  "PENDING",
  "AGREED",
  "SHIPPING",
  "COMPLETED",
  "CANCELLED",
]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "MIDTRANS",
  "XENDIT",
  "BANK_TRANSFER",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "UNPAID",
  "PAID",
  "REFUNDED",
]);
export const escrowStatusEnum = pgEnum("escrow_status", [
  "HOLD",
  "RELEASED",
  "REFUNDED",
]);
export const disputeStatusEnum = pgEnum("dispute_status", [
  "OPEN",
  "RESOLVED",
  "REJECTED",
]);
export const verificationStatusEnum = pgEnum("verification_status", [
  "NONE",
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone"),
  address: text("address"),
  role: roleEnum("role").notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  companyName: text("company_name"),
  npwpUrl: text("npwp_url"),
  permitUrl: text("permit_url"),
  verificationStatus: verificationStatusEnum("verification_status")
    .default("NONE")
    .notNull(),
  rating: numeric("rating", { precision: 3, scale: 2 }).default("4.70").notNull(),
  city: text("city"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  createdAt: timestamp("created_at", { withTimezone: false })
    .defaultNow()
    .notNull(),
});

export const wasteCategories = pgTable("waste_categories", {
  id: serial("id").primaryKey(),
  categoryName: text("category_name").notNull(),
  description: text("description"),
  emoji: text("emoji").default("🌾"),
  createdAt: timestamp("created_at", { withTimezone: false })
    .defaultNow()
    .notNull(),
});

export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  categoryId: integer("category_id").references(() => wasteCategories.id),
  title: text("title").notNull(),
  description: text("description"),
  quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
  unit: unitEnum("unit").notNull(),
  pricePerUnit: numeric("price_per_unit", { precision: 12, scale: 2 }).notNull(),
  condition: conditionEnum("condition").notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  city: text("city"),
  imageUrl: text("image_url"),
  status: listingStatusEnum("status").default("AVAILABLE").notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: false })
    .defaultNow()
    .notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyer_id").references(() => users.id, {
    onDelete: "set null",
  }),
  listingId: integer("listing_id").references(() => listings.id, {
    onDelete: "set null",
  }),
  providerId: integer("provider_id").references(() => users.id, {
    onDelete: "set null",
  }),
  requestedQuantity: numeric("requested_quantity", {
    precision: 12,
    scale: 3,
  }).notNull(),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
  status: orderStatusEnum("status").default("PENDING").notNull(),
  note: text("note"),
  shippingAddress: text("shipping_address"),
  driverName: text("driver_name"),
  driverPhone: text("driver_phone"),
  vehiclePlate: text("vehicle_plate"),
  agreedAt: timestamp("agreed_at", { withTimezone: false }),
  shippedAt: timestamp("shipped_at", { withTimezone: false }),
  completedAt: timestamp("completed_at", { withTimezone: false }),
  cancelledReason: text("cancelled_reason"),
  createdAt: timestamp("created_at", { withTimezone: false })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: false })
    .defaultNow()
    .notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .references(() => orders.id, { onDelete: "cascade" })
    .notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  method: paymentMethodEnum("method").notNull(),
  status: paymentStatusEnum("status").default("UNPAID").notNull(),
  escrowStatus: escrowStatusEnum("escrow_status").default("HOLD").notNull(),
  reference: text("reference"),
  paidAt: timestamp("paid_at", { withTimezone: false }),
  releasedAt: timestamp("released_at", { withTimezone: false }),
  createdAt: timestamp("created_at", { withTimezone: false })
    .defaultNow()
    .notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").default("ORDER").notNull(),
  link: text("link"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: false })
    .defaultNow()
    .notNull(),
});

export const disputes = pgTable("disputes", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id, {
    onDelete: "cascade",
  }),
  raisedById: integer("raised_by_id").references(() => users.id, {
    onDelete: "set null",
  }),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: disputeStatusEnum("status").default("OPEN").notNull(),
  resolution: text("resolution"),
  createdAt: timestamp("created_at", { withTimezone: false })
    .defaultNow()
    .notNull(),
});

export const uploads = pgTable("uploads", {
  id: text("id").primaryKey(),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  data: text("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false })
    .defaultNow()
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type WasteCategory = typeof wasteCategories.$inferSelect;
export type Listing = typeof listings.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Dispute = typeof disputes.$inferSelect;
