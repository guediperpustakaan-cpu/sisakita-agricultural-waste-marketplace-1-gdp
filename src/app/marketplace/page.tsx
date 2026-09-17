import { MarketplaceExplorer } from "@/components/marketplace-explorer";
import { getCategories } from "@/lib/queries";

export const metadata = {
  title: "Marketplace Limbah Pertanian — SisaKita",
  description:
    "Cari dan filter limbah pertanian berdasarkan kategori, kondisi, harga, dan radius jarak dari lokasi industri Anda.",
};

export default async function MarketplacePage() {
  const categories = await getCategories();
  return (
    <>
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <h1 className="text-2xl font-extrabold sm:text-3xl">
            Marketplace Limbah Pertanian
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-600">
            Semua listing dilengkapi koordinat GPS. Jarak dihitung dari titik
            referensi Anda memakai formula jarak bola (kompatibel PostGIS
            <code className="mx-1 rounded bg-neutral-100 px-1 py-0.5 text-xs">ST_DWithin</code>
            pada instance Neon yang mendukung ekstensi spasial).
          </p>
        </div>
      </section>
      <MarketplaceExplorer
        categories={categories.map((c) => ({
          id: c.id,
          categoryName: c.categoryName,
          emoji: c.emoji,
        }))}
      />
    </>
  );
}
