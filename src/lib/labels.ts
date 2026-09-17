export const APP_NAME = "SisaKita";

export const ROLE_LABEL: Record<string, string> = {
  PROVIDER: "Penyedia Limbah",
  INDUSTRY: "Industri",
  ADMIN: "Administrator",
};

export const CONDITION_LABEL: Record<string, string> = {
  DRY: "Kering",
  WET: "Basah",
  SEMI_DRY: "Setengah Kering",
};

export const UNIT_LABEL: Record<string, string> = {
  KG: "kg",
  TON: "ton",
};

export const LISTING_STATUS_LABEL: Record<string, string> = {
  AVAILABLE: "Tersedia",
  SOLD: "Terjual",
  OUT_OF_STOCK: "Stok Habis",
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: "Menunggu Persetujuan",
  AGREED: "Disetujui / Menunggu Pengiriman",
  SHIPPING: "Dalam Pengiriman",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

export const ORDER_FLOW = ["PENDING", "AGREED", "SHIPPING", "COMPLETED"] as const;

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  MIDTRANS: "Midtrans",
  XENDIT: "Xendit",
  BANK_TRANSFER: "Transfer Bank",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  UNPAID: "Belum Dibayar",
  PAID: "Dibayar (Escrow)",
  REFUNDED: "Dana Dikembalikan",
};

export const ESCROW_LABEL: Record<string, string> = {
  HOLD: "Dana Ditahan",
  RELEASED: "Dana Dilepas",
  REFUNDED: "Dana Dikembalikan",
};

export const VERIFICATION_LABEL: Record<string, string> = {
  NONE: "Belum Mengajukan",
  PENDING: "Menunggu Verifikasi",
  APPROVED: "Terverifikasi",
  REJECTED: "Ditolak",
};

export const DISPUTE_STATUS_LABEL: Record<string, string> = {
  OPEN: "Terbuka",
  RESOLVED: "Selesai",
  REJECTED: "Ditolak",
};

export const BRAND = {
  leaf: "#2F8F2F",
  leafDark: "#237023",
  amber: "#F5A623",
  neutral: "#F4F4F4",
};

export function statusTone(status: string): string {
  switch (status) {
    case "AVAILABLE":
    case "COMPLETED":
    case "PAID":
    case "APPROVED":
    case "RELEASED":
    case "RESOLVED":
      return "bg-emerald-100 text-emerald-800 ring-emerald-200";
    case "PENDING":
    case "HOLD":
    case "SEMI_DRY":
      return "bg-amber-100 text-amber-800 ring-amber-200";
    case "AGREED":
    case "SHIPPING":
      return "bg-sky-100 text-sky-800 ring-sky-200";
    case "CANCELLED":
    case "REJECTED":
    case "REFUNDED":
      return "bg-rose-100 text-rose-700 ring-rose-200";
    default:
      return "bg-neutral-200 text-neutral-700 ring-neutral-300";
  }
}
