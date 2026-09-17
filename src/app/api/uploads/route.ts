import { NextResponse } from "next/server";
import { db } from "@/db";
import { uploads } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

const MAX_BYTES = 2_500_000; // ~2.5 MB

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as
    | { fileName?: string; mimeType?: string; data?: string }
    | null;

  if (!body?.data) {
    return NextResponse.json({ error: "Berkas tidak ditemukan" }, { status: 400 });
  }
  const base64 = body.data.includes(",") ? body.data.split(",")[1] : body.data;
  const size = Math.floor((base64.length * 3) / 4);
  if (size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Ukuran berkas maksimal 2 MB. Kompres foto terlebih dahulu." },
      { status: 413 },
    );
  }

  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  await db.insert(uploads).values({
    id,
    fileName: body.fileName ?? "foto.jpg",
    mimeType: body.mimeType ?? "image/jpeg",
    data: base64,
  });

  return NextResponse.json({ url: `/api/uploads/${id}`, id }, { status: 201 });
}
