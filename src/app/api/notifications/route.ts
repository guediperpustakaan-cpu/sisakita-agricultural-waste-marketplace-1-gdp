import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getUserNotifications } from "@/lib/queries";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ items: [] });
  const items = await getUserNotifications(user.id);
  return NextResponse.json({ items, unread: items.filter((i) => !i.isRead).length });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as
    | { markAll?: boolean; id?: number }
    | null;

  if (body?.markAll) {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));
    return NextResponse.json({ success: true });
  }
  if (body?.id) {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, body.id), eq(notifications.userId, user.id)));
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
}
