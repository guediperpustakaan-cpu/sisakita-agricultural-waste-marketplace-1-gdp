import "server-only";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type User } from "@/db/schema";

const COOKIE_NAME = "sisakita_session";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "sisakita-dev-secret-key-2026-marketplace-limbah",
);

export type Role = "PROVIDER" | "INDUSTRY" | "ADMIN";

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  address: string | null;
  companyName: string | null;
  isVerified: boolean;
  verificationStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: string;
};

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function comparePassword(
  plain: string,
  hashed: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

export async function createSession(user: User): Promise<void> {
  const token = await new SignJWT({
    sub: String(user.id),
    role: user.role,
    email: user.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    address: user.address,
    companyName: user.companyName,
    isVerified: user.isVerified,
    verificationStatus: user.verificationStatus,
    city: user.city,
    latitude: user.latitude,
    longitude: user.longitude,
    rating: user.rating,
  };
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    const id = Number(payload.sub);
    if (!Number.isFinite(id)) return null;
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!rows[0]) return null;
    return toSessionUser(rows[0]);
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}
