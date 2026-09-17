import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { disputes, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getPlatformStats, getVolumeByCategory, notify } from "@/lib/queries";

const patchSchema = z.object({
  target: z.enum(["verify", "reject", "dispute"]),
  userId: z.coerce.number().int().positive().optional(),
  disputeId: z.coerce.number().int().positive().optional(),
  resolution: z.string().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Hanya administrator" }, { status: 403 });
  }
  const [stats, volume, semuaUser, sengketa] = await Promise.all([
    getPlatformStats(),
    getVolumeByCategory(),
    db.select().from(users).limit(200),
    db.select().from(disputes),
  ]);
  return NextResponse.json({
    stats,
    volume,
    users: semuaUser.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isVerified: u.isVerified,
      verificationStatus: u.verificationStatus,
      companyName: u.companyName,
      npwpUrl: u.npwpUrl,
      permitUrl: u.permitUrl,
      city: u.city,
      createdAt: u.createdAt,
    })),
    disputes: sengketa,
  });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Hanya administrator" }, { status: 403 });
  }
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }
  const { target, userId, disputeId, resolution } = parsed.data;

  if (target === "verify" || target === "reject") {
    if (!userId) return NextResponse.json({ error: "User wajib dipilih" }, { status: 400 });
    const approved = target === "verify";
    const [updated] = await db
      .update(users)
      .set({
        isVerified: approved,
        verificationStatus: approved ? "APPROVED" : "REJECTED",
      })
      .where(eq(users.id, userId))
      .returning();
    if (!updated) return NextResponse.json({ error: "User tidak ada" }, { status: 404 });
    await notify({
      userId,
      title: approved ? "Akun industri terverifikasi ✅" : "Verifikasi ditolak",
      message: approved
        ? "Dokumen perusahaan Anda disetujui. Akses penuh marketplace telah aktif."
        : "Dokumen perusahaan belum lengkap. Silakan unggah ulang NPWP/izin usaha.",
      type: "ACCOUNT",
      link: "/dashboard/industri",
    });
    return NextResponse.json({ success: true, isVerified: updated.isVerified });
  }

  if (!disputeId) {
    return NextResponse.json({ error: "Sengketa wajib dipilih" }, { status: 400 });
  }
  const [updated] = await db
    .update(disputes)
    .set({
      status: resolution ? "RESOLVED" : "REJECTED",
      resolution: resolution ?? "Ditolak oleh administrator",
    })
    .where(eq(disputes.id, disputeId))
    .returning();
  return NextResponse.json({ dispute: updated });
}
