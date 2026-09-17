import { eq } from "drizzle-orm";
import { db } from "@/db";
import { uploads } from "@/db/schema";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const rows = await db.select().from(uploads).where(eq(uploads.id, id)).limit(1);
  const file = rows[0];
  if (!file) return new Response("Not found", { status: 404 });
  const buffer = Buffer.from(file.data, "base64");
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": file.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
