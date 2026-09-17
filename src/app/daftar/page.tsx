"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validation";

async function unggahBerkas(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Gagal membaca berkas"));
    reader.readAsDataURL(file);
  });
  const res = await fetch("/api/uploads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName: file.name, mimeType: file.type, data: dataUrl }),
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? "Gagal mengunggah berkas");
  return data.url;
}

export default function DaftarPage() {
  const router = useRouter();
  const [npwpName, setNpwpName] = useState<string>("");
  const [permitName, setPermitName] = useState<string>("");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      role: "PROVIDER",
      companyName: "",
      address: "",
      city: "",
      npwpUrl: "",
      permitUrl: "",
    },
  });

  const role = watch("role");
  const npwpUrl = watch("npwpUrl");

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = (await res.json()) as { error?: string; user?: { role: string } };
    if (!res.ok || !data.user) {
      setServerError(data.error ?? "Pendaftaran gagal");
      return;
    }
    router.push(
      data.user.role === "PROVIDER" ? "/laporan" : "/dashboard/industri",
    );
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="card p-6">
        <h1 className="text-2xl font-extrabold">Daftar Akun SisaKita</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Pilih jenis akun sesuai peran Anda dalam rantai pasok limbah pertanian.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            {
              value: "PROVIDER",
              judul: "Penyedia Limbah",
              isi: "Petani, kelompok tani, kolektor, atau UMKM pengolah sisa panen.",
              emoji: "👨‍🌾",
            },
            {
              value: "INDUSTRY",
              judul: "Industri Pembeli",
              isi: "Pabrik biomasa, pakan ternak, pupuk organik, energi terbarukan.",
              emoji: "🏭",
            },
          ].map((opsi) => (
            <button
              key={opsi.value}
              type="button"
              onClick={() => setValue("role", opsi.value as RegisterInput["role"])}
              aria-pressed={role === opsi.value}
              className={`rounded-2xl border-2 p-4 text-left transition ${
                role === opsi.value
                  ? "border-[#2F8F2F] bg-leaf-50"
                  : "border-neutral-200 bg-white hover:border-neutral-300"
              }`}
            >
              <span className="text-2xl" aria-hidden>
                {opsi.emoji}
              </span>
              <p className="mt-2 font-bold">{opsi.judul}</p>
              <p className="text-xs text-neutral-600">{opsi.isi}</p>
            </button>
          ))}
        </div>

        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="name">
              Nama lengkap
            </label>
            <input id="name" className="input" placeholder="Nama Anda" {...register("name")} />
            {errors.name ? <p className="error-text">{errors.name.message}</p> : null}
          </div>

          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input id="email" type="email" className="input" placeholder="nama@contoh.id" {...register("email")} />
            {errors.email ? <p className="error-text">{errors.email.message}</p> : null}
          </div>

          <div>
            <label className="label" htmlFor="phone">
              Nomor WhatsApp
            </label>
            <input id="phone" className="input" placeholder="08xxxxxxxxxx" {...register("phone")} />
            {errors.phone ? <p className="error-text">{errors.phone.message}</p> : null}
          </div>

          {role === "INDUSTRY" ? (
            <div className="sm:col-span-2">
              <label className="label" htmlFor="companyName">
                Nama perusahaan / badan usaha
              </label>
              <input id="companyName" className="input" placeholder="PT Bio Energi Nusantara" {...register("companyName")} />
            </div>
          ) : null}

          <div>
            <label className="label" htmlFor="city">
              Kota / Kabupaten
            </label>
            <input id="city" className="input" placeholder="Bogor" {...register("city")} />
          </div>

          <div>
            <label className="label" htmlFor="address">
              Alamat
            </label>
            <input id="address" className="input" placeholder="Jl. Desa Sukamaju No. 3" {...register("address")} />
          </div>

          <div>
            <label className="label" htmlFor="password">
              Kata sandi
            </label>
            <input id="password" type="password" className="input" {...register("password")} />
            {errors.password ? <p className="error-text">{errors.password.message}</p> : null}
          </div>

          <div>
            <label className="label" htmlFor="confirmPassword">
              Ulangi kata sandi
            </label>
            <input id="confirmPassword" type="password" className="input" {...register("confirmPassword")} />
            {errors.confirmPassword ? (
              <p className="error-text">{errors.confirmPassword.message}</p>
            ) : null}
          </div>

          {role === "INDUSTRY" ? (
            <>
              <div>
                <label className="label" htmlFor="npwp">
                  Dokumen NPWP (wajib)
                </label>
                <input
                  id="npwp"
                  type="file"
                  accept="image/*,application/pdf"
                  className="input"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setNpwpName(file.name);
                    try {
                      const url = await unggahBerkas(file);
                      setValue("npwpUrl", url);
                    } catch (err) {
                      setServerError(err instanceof Error ? err.message : "Gagal unggah NPWP");
                    }
                  }}
                />
                {npwpName ? (
                  <p className="mt-1 text-xs text-emerald-700">✔ {npwpName} terunggah</p>
                ) : null}
                {errors.npwpUrl ? <p className="error-text">{errors.npwpUrl.message}</p> : null}
              </div>
              <div>
                <label className="label" htmlFor="permit">
                  Izin usaha / NIB (opsional)
                </label>
                <input
                  id="permit"
                  type="file"
                  accept="image/*,application/pdf"
                  className="input"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setPermitName(file.name);
                    try {
                      const url = await unggahBerkas(file);
                      setValue("permitUrl", url);
                    } catch (err) {
                      setServerError(err instanceof Error ? err.message : "Gagal unggah izin");
                    }
                  }}
                />
                {permitName ? (
                  <p className="mt-1 text-xs text-emerald-700">✔ {permitName} terunggah</p>
                ) : null}
              </div>
              <p className="sm:col-span-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Akun industri dapat langsung menjelajah marketplace. Akses pembelian
                penuh diaktifkan setelah administrator memverifikasi dokumen NPWP.
              </p>
            </>
          ) : null}

          <input type="hidden" {...register("npwpUrl")} />
          <input type="hidden" {...register("permitUrl")} />

          {serverError ? (
            <p className="sm:col-span-2 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              {serverError}
            </p>
          ) : null}

          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? "Mendaftarkan…" : "Buat Akun"}
            </button>
            <p className="mt-3 text-center text-sm text-neutral-600">
              Sudah punya akun?{" "}
              <Link href="/masuk" className="font-semibold text-[#2F8F2F] hover:underline">
                Masuk di sini
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
