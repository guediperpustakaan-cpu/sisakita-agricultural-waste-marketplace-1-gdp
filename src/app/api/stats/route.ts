import { NextResponse } from "next/server";
import { getPlatformStats } from "@/lib/queries";

export async function GET() {
  const stats = await getPlatformStats();
  return NextResponse.json({
    totalTon: Number((stats.totalWeight / 1000).toFixed(2)),
    ...stats,
  });
}
