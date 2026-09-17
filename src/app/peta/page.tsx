import { MarketplaceExplorer } from "@/components/marketplace-explorer";
import { getCategories } from "@/lib/queries";

export const metadata = {
  title: "Peta Sebaran Limbah — SisaKita",
};

export default async function PetaPage() {
  const categories = await getCategories();
  return (
    <>
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <h1 className="text-2xl font-extrabold sm:text-3xl">Peta Sebaran Limbah</h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-600">
            Klik penanda hijau untuk melihat ringkasan limbah, jarak dari lokasi
            Anda, dan tombol <strong>Lihat Detail</strong> menuju halaman listing.
          </p>
        </div>
      </section>
      <MarketplaceExplorer
        variant="map"
        categories={categories.map((c) => ({
          id: c.id,
          categoryName: c.categoryName,
          emoji: c.emoji,
        }))}
      />
    </>
  );
}
