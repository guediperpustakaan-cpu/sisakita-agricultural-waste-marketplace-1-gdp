"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validation";

const DEMO = [
  { role: "PROVIDER", label: "Masuk sebagai Petani (Demo)", email: "petani@sisakita.id", emoji: "👨‍🌾" },
  { role: "INDUSTRY", label: "Masuk sebagai Industri (Demo)", email: "industri@sisakita.id", emoji: "🏭" },
  { role: "ADMIN", label: "Masuk sebagai Admin (Demo)", email: "admin@sisakita.id", emoji: "🛡️" },
] as const;

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const redirect = search.get("redirect");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = (await res.json()) as { error?: string; user?: { role: string } };
    if (!res.ok || !data.user) {
      setError("root", { message: data.error ?? "Gagal masuk" });
      return;
    }
    const target =
      redirect ??
      (data.user.role === "ADMIN"
        ? "/admin"
        : data.user.role === "PROVIDER"
          ? "/dashboard/penyedia"
          : "/dashboard/industri");
    router.push(target);
    router.refresh();
  }

  async function demo(role: string) {
    await fetch("/api/auth/demo", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    router.push(
      role === "ADMIN" ? "/admin" : role === "PROVIDER" ? "/dashboard/penyedia" : "/dashboard/industri",
    );
    router.refresh();
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 lg:grid-cols-2">
      <div className="card p-6">
        <h1 className="text-2xl font-extrabold">Masuk ke SisaKita</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Kelola limbah, pesanan, dan pembayaran escrow Anda.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="input"
              placeholder="nama@contoh.id"
              {...register("email")}
            />
            {errors.email ? <p className="error-text">{errors.email.message}</p> : null}
          </div>
          <div>
            <label className="label" htmlFor="password">
              Kata sandi
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="input"
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password ? <p className="error-text">{errors.password.message}</p> : null}
          </div>
          {errors.root ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              {errors.root.message}
            </p>
          ) : null}
          <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
            {isSubmitting ? "Memproses…" : "Masuk"}
          </button>
        </form>
        <p className="mt-4 text-sm text-neutral-600">
          Belum punya akun?{" "}
          <Link href="/daftar" className="font-semibold text-[#2F8F2F] hover:underline">
            Daftar gratis
          </Link>
        </p>
      </div>

      <div className="space-y-4">
        <div className="card bg-[#237023] p-6 text-white">
          <h2 className="text-lg font-bold">Coba cepat dengan akun demo</h2>
          <p className="mt-1 text-sm text-white/85">
            Semua akun demo memakai kata sandi <code>password123</code> dan sudah
            diisi data contoh.
          </p>
          <div className="mt-4 grid gap-2">
            {DEMO.map((item) => (
              <button
                key={item.role}
                type="button"
                onClick={() => demo(item.role)}
                className="btn-amber w-full justify-start"
              >
                <span aria-hidden>{item.emoji}</span> {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="card p-6">
          <h3 className="text-sm font-bold">Keamanan akun</h3>
          <ul className="mt-2 space-y-2 text-sm text-neutral-600">
            <li>🔐 Kata sandi di-hash dengan bcrypt (10 putaran)</li>
            <li>🎫 Sesi memakai JWT httpOnly cookie (jose)</li>
            <li>🛡️ Kontrol akses per peran: PROVIDER, INDUSTRY, ADMIN</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function MasukPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-neutral-500">Memuat…</div>}>
      <LoginForm />
    </Suspense>
  );
}
