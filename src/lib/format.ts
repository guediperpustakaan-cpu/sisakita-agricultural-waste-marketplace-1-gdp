export function formatRupiah(value: number | string | null | undefined): string {
  const num = typeof value === "string" ? Number(value) : value ?? 0;
  if (!Number.isFinite(num)) return "Rp0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num as number);
}

export function formatNumber(
  value: number | string | null | undefined,
  digits = 0,
): string {
  const num = typeof value === "string" ? Number(value) : value ?? 0;
  if (!Number.isFinite(num)) return "0";
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(num as number);
}

export function formatQuantity(
  value: number | string | null | undefined,
  unit: string,
): string {
  const num = typeof value === "string" ? Number(value) : value ?? 0;
  return `${formatNumber(num, num % 1 === 0 ? 0 : 2)} ${unit === "TON" ? "ton" : "kg"}`;
}

export function formatTanggal(
  value: Date | string | null | undefined,
  withTime = false,
): string {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

export function formatJarak(km: number | null | undefined): string {
  if (km === null || km === undefined) return "-";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${formatNumber(km, 1)} km`;
}

/** Jarak Haversine (km) — digunakan di klien sebagai fallback perhitungan jarak. */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function relativeTime(value: Date | string | null | undefined): string {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  return formatTanggal(date);
}
