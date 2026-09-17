import "dotenv/config";
import { db } from "@/db";
import { users, wasteCategories, listings } from "@/db/schema";
import bcrypt from "bcryptjs";

async function main() {
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing[0]) {
    console.log("Data sudah ada, seed dilewati.");
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash("password123", 10);

  const [admin] = await db
    .insert(users)
    .values({
      name: "Administrator SisaKita",
      email: "admin@sisakita.id",
      password: passwordHash,
      role: "ADMIN",
      isVerified: true,
      verificationStatus: "APPROVED",
      city: "Bogor",
      rating: "5.00",
    })
    .returning();

  const [petani] = await db
    .insert(users)
    .values({
      name: "Budi Santoso",
      email: "petani@sisakita.id",
      password: passwordHash,
      phone: "081234567890",
      address: "Jl. Desa Sukamaju No. 3",
      city: "Bogor",
      role: "PROVIDER",
      isVerified: true,
      verificationStatus: "APPROVED",
      companyName: "Koperasi Tani Sejahtera",
      rating: "4.80",
      latitude: -6.595,
      longitude: 106.816,
    })
    .returning();

  const [industri] = await db
    .insert(users)
    .values({
      name: "PT Bio Energi Nusantara",
      email: "industri@sisakita.id",
      password: passwordHash,
      phone: "085212345678",
      address: "Jl. Industri Raya No. 88",
      city: "Bogor",
      role: "INDUSTRY",
      isVerified: true,
      verificationStatus: "APPROVED",
      companyName: "PT Bio Energi Nusantara",
      npwpUrl: "https://example.com/npwp-bioenergi.pdf",
      permitUrl: "https://example.com/nib-bioenergi.pdf",
      rating: "4.90",
      latitude: -6.605,
      longitude: 106.826,
    })
    .returning();

  const cats = await db
    .insert(wasteCategories)
    .values([
      { categoryName: "Jerami Padi", description: "Sisa jerami dari panen padi, kering dan bersih.", emoji: "🌾" },
      { categoryName: "Tongkol Jagung", description: "Tongkol jagung siap proses, cocok pakan ternak.", emoji: "🌽" },
      { categoryName: "Sekam", description: "Sekam padi, bahan bakar bio atau media tanam.", emoji: "🌾" },
      { categoryName: "Limbah Sayuran", description: "Sisa sayuran dari proses sortir dan bersih.", emoji: "🥬" },
    ])
    .returning();

  await db.insert(listings).values([
    {
      providerId: petani.id,
      categoryId: cats[0].id,
      title: "Jerami Padi Kering Siap Angkut, 3 ton",
      description: "Jerami padi kering dari panen musim kemarin, kandungan air rendah, siap diangkut dari sawah.",
      quantity: "3.000",
      unit: "TON",
      pricePerUnit: "350000",
      condition: "DRY",
      city: "Bogor",
      latitude: -6.595,
      longitude: 106.816,
      status: "AVAILABLE",
    },
    {
      providerId: petani.id,
      categoryId: cats[1].id,
      title: "Tongkol Jagung Segar 500 kg",
      description: "Tongkol jagung baru dipanen, bersih dan siap diolah menjadi pakan ternak.",
      quantity: "500.000",
      unit: "KG",
      pricePerUnit: "4500",
      condition: "WET",
      city: "Bogor",
      latitude: -6.597,
      longitude: 106.819,
      status: "AVAILABLE",
    },
    {
      providerId: petani.id,
      categoryId: cats[2].id,
      title: "Sekam Padi Berkualitas 2 ton",
      description: "Sekam padi bersih, cocok untuk media tanam dan bahan bakar biomasa.",
      quantity: "2.000",
      unit: "TON",
      pricePerUnit: "280000",
      condition: "DRY",
      city: "Bandung",
      latitude: -6.917,
      longitude: 107.619,
      status: "AVAILABLE",
    },
  ]);

  console.log("Seed selesai: akun demo & listing contoh dibuat.");
  console.log("  admin@sisakita.id  / password123");
  console.log("  petani@sisakita.id  / password123");
  console.log("  industri@sisakita.id / password123");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});