import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  comparePassword,
  createSession,
  destroySession,
  getCurrentUser,
  hashPassword,
  toSessionUser,
} from "@/lib/auth";
import { loginSchema, registerSchema } from "@/lib/validation";
import { notify } from "@/lib/queries";

type Params = { params: Promise<{ action: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { action } = await params;
  if (action !== "me") {
    return NextResponse.json({ error: "Aksi tidak dikenal" }, { status: 404 });
  }
  const user = await getCurrentUser();
  return NextResponse.json({ user });
}

export async function POST(request: Request, { params }: Params) {
  const { action } = await params;

  if (action === "logout") {
    await destroySession();
    return NextResponse.redirect(new URL("/", request.url), { status: 303 });
  }

  if (action === "register") {
    const body = await request.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 },
      );
    }
    const data = parsed.data;
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, data.email.toLowerCase()))
      .limit(1);
    if (existing[0]) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan masuk." },
        { status: 409 },
      );
    }

    const isIndustry = data.role === "INDUSTRY";
    const [created] = await db
      .insert(users)
      .values({
        name: data.name,
        email: data.email.toLowerCase(),
        password: await hashPassword(data.password),
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        role: data.role,
        companyName: data.companyName || null,
        npwpUrl: data.npwpUrl || null,
        permitUrl: data.permitUrl || null,
        verificationStatus: isIndustry ? "PENDING" : "APPROVED",
        isVerified: !isIndustry,
      })
      .returning();

    await createSession(created);
    await notify({
      userId: created.id,
      title: "Selamat datang di SisaKita 👋",
      message: isIndustry
        ? "Akun industri Anda dibuat. Menunggu verifikasi dokumen oleh admin untuk akses penuh."
        : "Akun penyedia Anda aktif. Yuk laporkan limbah pertanian Anda sekarang.",
      type: "ACCOUNT",
      link: isIndustry ? "/dashboard/industri" : "/laporan",
    });

    return NextResponse.json({ user: toSessionUser(created) }, { status: 201 });
  }

  if (action === "login") {
    const body = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 },
      );
    }
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, parsed.data.email.toLowerCase()))
      .limit(1);
    const user = rows[0];
    if (!user || !(await comparePassword(parsed.data.password, user.password))) {
      return NextResponse.json(
        { error: "Email atau kata sandi salah" },
        { status: 401 },
      );
    }
    await createSession(user);
    return NextResponse.json({ user: toSessionUser(user) });
  }

  return NextResponse.json({ error: "Aksi tidak dikenal" }, { status: 404 });
}

const demoSchema = z.object({ role: z.enum(["PROVIDER", "INDUSTRY", "ADMIN"]) });

export async function PUT(request: Request, { params }: Params) {
  // Masuk cepat dengan akun demo (memudahkan penilaian/demo aplikasi).
  const { action } = await params;
  if (action !== "demo") {
    return NextResponse.json({ error: "Aksi tidak dikenal" }, { status: 404 });
  }
  const body = await request.json().catch(() => null);
  const parsed = demoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Peran tidak valid" }, { status: 400 });
  }
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, demoEmail(parsed.data.role)))
    .limit(1);
  const user = rows[0];
  if (!user) {
    return NextResponse.json(
      { error: "Akun demo belum tersedia" },
      { status: 404 },
    );
  }
  await createSession(user);
  return NextResponse.json({ user: toSessionUser(user) });
}

function demoEmail(role: "PROVIDER" | "INDUSTRY" | "ADMIN") {
  switch (role) {
    case "ADMIN":
      return "admin@sisakita.id";
    case "INDUSTRY":
      return "industri@sisakita.id";
    default:
      return "petani@sisakita.id";
  }
}
