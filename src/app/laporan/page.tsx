"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { listingSchema, type ListingInput } from "@/lib/validation";
import { useLokasi } from "@/hooks/use-lokasi";
import { MapLoader } from "@/components/map-loader";
import { CONDITION_LABEL, UNIT_LABEL } from "@/lib/labels";
import { formatRupiah } from "@/lib/format";

type Kategori = { id: number; categoryName: string; emoji: string | null; description: string | null };

const LANGKAH = ["Foto Limbah", "Kategori", "Detail & Harga", "Lokasi", "Tinjau"];

async function kompresDanUnggah(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1100 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  ctx?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
  const res = await fetch("/api/uploads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName: file.name, mimeType: "image/jpeg", data: dataUrl }),
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? "Gagal mengunggah foto");
  return data.url;
}

export default function LaporanPage() {
  const router = useRouter();
  const { lokasi, simpan, deteksi, memuat } = useLokasi();
  const [kategori, setKategori] = useState<Kategori[]>([]);
  const [step, setStep] = useState(0);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [unggahGalat, setUnggahGalat] = useState<string | null>(null);
  const [serverGalat, setServerGalat] = useState<string | null>(null);
  const [kirim, setKirim] = useState(false);
  const [belumMasuk, setBelumMasuk] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<ListingInput>({
    resolver: zodResolver(listingSchema),
    mode: "onTouched",
    defaultValues: {
      title: "",
      categoryId: 0,
      description: "",
      quantity: 100,
      unit: "KG",
      pricePerUnit: 1500,
      condition: "DRY",
      imageUrl: "",
      city: "",
      latitude: -6.595,
      longitude: 106.816,
    },
  });

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d: { items: Kategori[] }) => setKategori(d.items ?? []))
      .catch(() => setKategori([]));
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: { user?: { role: string } | null }) => {
        if (!d.user) setBelumMasuk(true);
      })
      .catch(() => setBelumMasuk(true));
  }, []);

  useEffect(() => {
    if (lokasi) {
      setValue("latitude", lokasi.lat);
      setValue("longitude", lokasi.lng);
    }
  }, [lokasi, setValue]);

  const nilai = watch();
  const totalEstimasi = Number(nilai.quantity) * Number(nilai.pricePerUnit);

  async function lanjut() {
    const fields: (keyof ListingInput)[][] = [
      ["imageUrl"],
      ["categoryId"],
      ["title", "description", "quantity", "unit", "pricePerUnit", "condition"],
      ["latitude", "longitude"],
      [],
    ];
    const valid = await trigger(fields[step]);
    if (valid) setStep((s) => Math.min(s + 1, LANGKAH.length - 1));
  }

  const onSubmit = handleSubmit(async (values) => {
    setServerGalat(null);
    setKirim(true);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await res.json()) as { error?: string; listing?: { id: number } };
      if (!res.ok || !data.listing) {
        setServerGalat(data.error ?? "Gagal menyimpan laporan");
        return;
      }
      router.push(`/listing/${data.listing.id}`);
      router.refresh();
    } finally {
      setKirim(false);
    }
  });

  if (belumMasuk) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="card p-8">
          <p className="text-4xl" aria-hidden>
            🔐
          </p>
          <h1 className="mt-3 text-xl font-extrabold">Masuk diperlukan</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Hanya akun penyedia limbah yang dapat melaporkan stok limbah baru.
          </p>
          <div className="mt-5 grid gap-2">
            <Link href="/masuk?redirect=/laporan" className="btn-primary">
              Masuk
            </Link>
            <Link href="/daftar" className="btn-ghost">
              Daftar sebagai penyedia
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-extrabold">Laporkan Limbah Pertanian</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Lengkapi 4 langkah singkat. Listing Anda langsung tampil di marketplace industri.
      </p>

      <ol className="mt-6 flex flex-wrap gap-2" aria-label="Progres pengisian">
        {LANGKAH.map((label, index) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => setStep(index)}
              className={`badge ${
                index === step
                  ? "bg-[#2F8F2F] text-white ring-[#2F8F2F]"
                  : index < step
                    ? "bg-emerald-100 text-emerald-800 ring-emerald-200"
                    : "bg-white text-neutral-500 ring-neutral-200"
              }`}
            >
              {index + 1}. {label}
            </button>
          </li>
        ))}
      </ol>

      <form className="mt-5" onSubmit={onSubmit} noValidate>
        <div className="card p-5">
          {step === 0 ? (
            <div>
              <h2 className="text-lg font-bold">1. Unggah Foto Limbah</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Foto jelas meningkatkan peluang terjual hingga 3×. Maksimal 2 MB, otomatis dikompres.
              </p>
              <label
                className="mt-4 grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center hover:border-[#2F8F2F]"
                htmlFor="foto"
              >
                {fotoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fotoPreview} alt="Pratinjau foto limbah" className="max-h-56 rounded-xl object-cover" />
                ) : (
                  <span className="text-sm text-neutral-600">
                    <span className="block text-3xl" aria-hidden>
                      📷
                    </span>
                    Klik untuk pilih foto dari perangkat
                  </span>
                )}
              </label>
              <input
                id="foto"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUnggahGalat(null);
                  try {
                    const url = await kompresDanUnggah(file);
                    setValue("imageUrl", url);
                    setFotoPreview(url);
                  } catch (err) {
                    setUnggahGalat(err instanceof Error ? err.message : "Gagal unggah");
                  }
                }}
              />
              <input type="hidden" {...register("imageUrl")} />
              {unggahGalat ? <p className="error-text">{unggahGalat}</p> : null}
              {errors.imageUrl ? <p className="error-text">Foto limbah wajib diunggah</p> : null}
            </div>
          ) : null}

          {step === 1 ? (
            <div>
              <h2 className="text-lg font-bold">2. Pilih Kategori Limbah</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {kategori.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setValue("categoryId", cat.id, { shouldValidate: true })}
                    aria-pressed={nilai.categoryId === cat.id}
                    className={`rounded-2xl border-2 p-4 text-left transition ${
                      nilai.categoryId === cat.id
                        ? "border-[#2F8F2F] bg-leaf-50"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <span className="text-2xl" aria-hidden>
                      {cat.emoji ?? "🌾"}
                    </span>
                    <p className="mt-1 text-sm font-bold leading-tight">{cat.categoryName}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">{cat.description}</p>
                  </button>
                ))}
              </div>
              {errors.categoryId ? <p className="error-text">{errors.categoryId.message}</p> : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <h2 className="text-lg font-bold sm:col-span-2">3. Detail, Volume &amp; Harga</h2>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="title">
                  Judul listing
                </label>
                <input
                  id="title"
                  className="input"
                  placeholder="Jerami padi kering siap angkut, 3 ton"
                  {...register("title")}
                />
                {errors.title ? <p className="error-text">{errors.title.message}</p> : null}
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="description">
                  Deskripsi &amp; spesifikasi
                </label>
                <textarea
                  id="description"
                  className="input min-h-[110px]"
                  placeholder="Kandungan air, cara pengemasan, jarak dari jalan, ketersediaan alat angkut…"
                  {...register("description")}
                />
                {errors.description ? <p className="error-text">{errors.description.message}</p> : null}
              </div>
              <div>
                <label className="label" htmlFor="quantity">
                  Kuantitas tersedia
                </label>
                <input
                  id="quantity"
                  type="number"
                  min={1}
                  step="0.001"
                  className="input"
                  {...register("quantity", { valueAsNumber: true })}
                />
                {errors.quantity ? <p className="error-text">{errors.quantity.message}</p> : null}
              </div>
              <div>
                <label className="label" htmlFor="unit">
                  Satuan
                </label>
                <select id="unit" className="input" {...register("unit")}>
                  <option value="KG">Kilogram (kg)</option>
                  <option value="TON">Ton</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="price">
                  Harga per {UNIT_LABEL[nilai.unit]}
                </label>
                <input id="price" type="number" min={1} className="input" {...register("pricePerUnit")} />
                {errors.pricePerUnit ? <p className="error-text">{errors.pricePerUnit.message}</p> : null}
              </div>
              <div>
                <span className="label">Kondisi limbah</span>
                <div className="flex flex-wrap gap-2">
                  {(["DRY", "WET", "SEMI_DRY"] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setValue("condition", c)}
                      aria-pressed={nilai.condition === c}
                      className={`badge ${
                        nilai.condition === c
                          ? "bg-[#2F8F2F] text-white ring-[#2F8F2F]"
                          : "bg-neutral-100 text-neutral-700 ring-neutral-200"
                      }`}
                    >
                      {CONDITION_LABEL[c]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="city">
                  Kota / Kabupaten
                </label>
                <input id="city" className="input" placeholder="Bogor" {...register("city")} />
              </div>
              <p className="sm:col-span-2 rounded-xl bg-leaf-50 px-4 py-3 text-sm">
                Estimasi nilai listing:{" "}
                <strong className="text-[#237023]">{formatRupiah(totalEstimasi)}</strong>
              </p>
            </div>
          ) : null}

          {step === 3 ? (
            <div>
              <h2 className="text-lg font-bold">4. Ambil Koordinat Lokasi</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Klik peta untuk menempatkan titik lahan/gudang, atau gunakan GPS perangkat.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="btn-ghost" onClick={deteksi} disabled={memuat}>
                  {memuat ? "Mendeteksi…" : "📍 Gunakan GPS perangkat"}
                </button>
                <span className="badge bg-neutral-100 text-neutral-700 ring-neutral-200">
                  Lat {Number(nilai.latitude).toFixed(5)} · Lng {Number(nilai.longitude).toFixed(5)}
                </span>
              </div>
              <div className="mt-3">
                <MapLoader
                  selectable
                  height={360}
                  zoom={13}
                  center={[Number(nilai.latitude), Number(nilai.longitude)]}
                  points={[]}
                  onPick={(lat, lng) => {
                    setValue("latitude", Number(lat.toFixed(6)));
                    setValue("longitude", Number(lng.toFixed(6)));
                    simpan({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) });
                  }}
                />
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div>
              <h2 className="text-lg font-bold">5. Tinjau &amp; Terbitkan</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="overflow-hidden rounded-xl bg-neutral-100">
                  {fotoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fotoPreview} alt="Foto limbah" className="h-40 w-full object-cover" />
                  ) : (
                    <div className="grid h-40 place-items-center text-3xl" aria-hidden>
                      🌾
                    </div>
                  )}
                </div>
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-neutral-500">Judul</dt>
                    <dd className="text-right font-semibold">{nilai.title}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-neutral-500">Kategori</dt>
                    <dd className="font-semibold">
                      {kategori.find((k) => k.id === Number(nilai.categoryId))?.categoryName ?? "-"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-neutral-500">Volume</dt>
                    <dd className="font-semibold">
                      {nilai.quantity} {UNIT_LABEL[nilai.unit]}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-neutral-500">Harga</dt>
                    <dd className="font-semibold">
                      {formatRupiah(nilai.pricePerUnit)}/{UNIT_LABEL[nilai.unit]}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-neutral-500">Kondisi</dt>
                    <dd className="font-semibold">{CONDITION_LABEL[nilai.condition]}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-neutral-500">Koordinat</dt>
                    <dd className="font-semibold">
                      {Number(nilai.latitude).toFixed(4)}, {Number(nilai.longitude).toFixed(4)}
                    </dd>
                  </div>
                </dl>
              </div>
              {serverGalat ? (
                <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                  {serverGalat}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            ← Kembali
          </button>
          {step < LANGKAH.length - 1 ? (
            <button type="button" className="btn-primary" onClick={lanjut}>
              Lanjut →
            </button>
          ) : (
            <button type="submit" className="btn-primary" disabled={kirim}>
              {kirim ? "Menyimpan…" : "Terbitkan Listing"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
