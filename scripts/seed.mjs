// Script seeding data demo SisaKita.
// Jalankan: node scripts/seed.mjs
import { readFileSync } from "node:fs";
import { Client } from "pg";
import bcrypt from "bcryptjs";

function loadEnv() {
  try {
    const raw = readFileSync(new URL("../.env", import.meta.url), "utf8");
    for (const line of raw.split("\n")) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    /* abaikan bila .env tidak ada */
  }
}
loadEnv();

const IMG = {
  jerami: "https://images.pexels.com/photos/14021013/pexels-photo-14021013.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  jerami2: "https://images.pexels.com/photos/36544748/pexels-photo-36544748.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  jerami3: "https://images.pexels.com/photos/14345969/pexels-photo-14345969.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  sawah: "https://images.pexels.com/photos/32385952/pexels-photo-32385952.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  hay: "https://images.pexels.com/photos/9198225/pexels-photo-9198225.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  hay2: "https://images.pexels.com/photos/37446464/pexels-photo-37446464.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  jagung: "https://images.pexels.com/photos/7543105/pexels-photo-7543105.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  kayu: "https://images.pexels.com/photos/9035374/pexels-photo-9035374.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  jagung2: "https://images.pexels.com/photos/11266657/pexels-photo-11266657.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  jagung3: "https://images.pexels.com/photos/38108929/pexels-photo-38108929.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  kulit: "https://images.pexels.com/photos/31499836/pexels-photo-31499836.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  gudang: "https://images.pexels.com/photos/33148976/pexels-photo-33148976.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
};

const CATEGORIES = [
  ["Jerami Padi", "Sisa batang dan daun padi pasca panen, bahan baku biomassa dan pakan.", "🌾"],
  ["Sekam Padi", "Sekam giling untuk media tanam, briket, dan bahan bangunan.", "🍚"],
  ["Tongkol Jagung", "Tongkol jagung kering untuk arang aktif, pakan, dan cendawan.", "🌽"],
  ["Sabut Kelapa", "Sabut kelapa untuk cocopeat, keset, dan bahan komposit.", "🥥"],
  ["Kulit Kakao", "Kulit buah kakao untuk pupuk organik dan pakan sumber serat.", "🍫"],
  ["Ampas Tebu", "Ampas tebu (bagasse) untuk energi boiler dan kertas.", "🎋"],
  ["Pelepah Sawit", "Pelepah dan tandan kosong kelapa sawit untuk kompos dan biomass.", "🌴"],
  ["Kotoran Ternak", "Feses sapi/kambing untuk biogas dan pupuk organik.", "🐄"],
];

const USERS = [
  ["Administrator SisaKita", "admin@sisakita.id", "ADMIN", "6281000000001", "Kantor Pusat SisaKita, Bogor", "Bogor", true, "APPROVED", null, null, "PT SisaKita Indonesia", -6.595, 106.816],
  ["Suryadi Kusuma", "petani@sisakita.id", "PROVIDER", "6281234567890", "Desa Sukamaju, Kec. Cibinong", "Bogor", true, "APPROVED", null, null, "Kelompok Tani Maju Jaya", -6.482, 106.854],
  ["Rahmat Hidayat", "kolektor@sisakita.id", "PROVIDER", "6281234567891", "Jl. Raya Ciracas No. 12", "Bandung", true, "APPROVED", null, null, "Koperasi Kolektor Sejahtera", -6.917, 107.619],
  ["Wati Lestari", "petani2@sisakita.id", "PROVIDER", "6281234567892", "Desa Nganjuk Wetan", "Nganjuk", true, "APPROVED", null, null, "Gapoktan Sumber Rejeki", -7.795, 110.369],
  ["PT Bio Energi Nusantara", "industri@sisakita.id", "INDUSTRY", "6287654321090", "Kawasan Industri MM2100 Blok C-9", "Bekasi", true, "APPROVED", "/api/uploads/demo-npwp", "/api/uploads/demo-izin", "PT Bio Energi Nusantara", -6.301, 107.005],
  ["CV Pupuk Organik Subur", "pabrik@sisakita.id", "INDUSTRY", "6287654321091", "Jl. Industri Kecil No. 5", "Semarang", false, "PENDING", "/api/uploads/demo-npwp2", null, "CV Pupuk Organik Subur", -6.966, 110.417],
];

const LISTINGS = [
  [2, 1, "Jerami padi kering siap angkut (bal 50 kg)", "Jerami padi varietas Ciherang, dipres bal 50 kg, kadar air 14%. Lokasi 200 m dari jalan kabupaten, truk bisa masuk.", 3000, "KG", 1200, "DRY", -6.482, 106.854, "Bogor", IMG.jerami],
  [2, 2, "Sekam padi giling bersih 5 ton", "Sekam padi hasil penggilingan, bebas kotoran, cocok untuk media tanam dan briket.", 5000, "KG", 900, "DRY", -6.501, 106.881, "Bogor", IMG.jagung2],
  [3, 4, "Sabut kelapa kering 8 ton / bulan", "Pasokan rutin sabut kelapa dari sentra kelapa Cirebon. Bisa kontrak bulanan.", 8000, "KG", 750, "SEMI_DRY", -6.917, 107.619, "Bandung", IMG.kulit],
  [3, 6, "Ampas tebu (bagasse) segar dari pabrik gula", "Ampas tebu langsung dari pabrik gula, kadar air 48%, cocok untuk boiler biomassa.", 20, "TON", 480000, "WET", -6.941, 107.66, "Bandung", IMG.kayu],
  [4, 1, "Jerami padi organik 12 ton (Nganjuk)", "Jerami dari lahan organik, tanpa pestisida kimia. Dokumen uji laboratorium tersedia.", 12, "TON", 1450000, "DRY", -7.795, 110.369, "Nganjuk", IMG.jerami2],
  [4, 3, "Tongkol jagung kering 4 ton", "Tongkol jagung kering angin, disimpan di gudang beratap, kadar air 12%.", 4000, "KG", 850, "DRY", -7.821, 110.386, "Yogyakarta", IMG.jagung3],
  [4, 8, "Kotoran sapi fermentasi 10 ton", "Feses sapi fermentasi EM4 siap pakai untuk pupuk organik dan biogas.", 10000, "KG", 400, "WET", -7.752, 110.492, "Yogyakarta", IMG.sawah],
  [2, 5, "Kulit kakao kering 2,5 ton", "Kulit kakao dari kebun rakyat, dikeringkan 3 hari, bebas jamur.", 2500, "KG", 1100, "DRY", -6.595, 106.816, "Bogor", IMG.hay],
  [3, 7, "Pelepah sawit 25 ton (Riau)", "Pelepah dan tandan kosong sawit, kumpul di titik kumpul desa.", 25, "TON", 320000, "SEMI_DRY", 0.507, 101.447, "Pekanbaru", IMG.hay2],
  [4, 2, "Sekam padi hitam (arang) 3 ton", "Arang sekam kualitas ekspor, Kadar karbon tinggi untuk media hidroponik.", 3000, "KG", 2100, "DRY", -7.668, 110.438, "Sleman", IMG.gudang],
];

const ORDERS = [
  { buyer: 5, listing: 1, provider: 2, qty: 2000, total: 2400000, status: "COMPLETED", address: "Gudang MM2100 Blok C-9, Bekasi", driver: "Anton Saputra", phone: "6281298765432", plate: "B 9182 KYZ", note: "Butuh pengemasan bal rapat.", method: "MIDTRANS", paymentStatus: "PAID", escrow: "RELEASED" },
  { buyer: 5, listing: 5, provider: 4, qty: 6, total: 8700000, status: "SHIPPING", address: "Kawasan Industri MM2100 Blok C-9, Bekasi", driver: "Slamet Riyadi", phone: "6281298765433", plate: "B 9456 TRU", note: "Kirim bertahap 3 truk.", method: "XENDIT", paymentStatus: "PAID", escrow: "HOLD" },
  { buyer: 5, listing: 2, provider: 2, qty: 1000, total: 900000, status: "AGREED", address: "Gudang Pergudangan 12, Cikarang", driver: null, phone: null, plate: null, note: "Untuk media tanam hidroponik.", method: "MIDTRANS", paymentStatus: "UNPAID", escrow: "HOLD" },
  { buyer: 6, listing: 8, provider: 2, qty: 1500, total: 1650000, status: "PENDING", address: "Jl. Industri Kecil No. 5, Semarang", driver: null, phone: null, plate: null, note: "Mohon kirim sampel 5 kg dahulu.", method: "MIDTRANS", paymentStatus: "UNPAID", escrow: "HOLD" },
  { buyer: 5, listing: 4, provider: 3, qty: 10, total: 4800000, status: "COMPLETED", address: "Boiler Plant 2, Bekasi", driver: "Joko Pramono", phone: "6281298765434", plate: "B 9771 ABC", note: "Pengambilan tiap Senin pagi.", method: "BANK_TRANSFER", paymentStatus: "PAID", escrow: "RELEASED" },
  { buyer: 6, listing: 6, provider: 4, qty: 500, total: 425000, status: "PENDING", address: "Jl. Industri Kecil No. 5, Semarang", driver: null, phone: null, plate: null, note: "Butuh uji coba arang sekam.", method: "XENDIT", paymentStatus: "UNPAID", escrow: "HOLD" },
];

const DISPUTES = [
  [1, 5, "Kadar air jerami di atas 18%", "Pengiriman kedua kadar air terukur 21% padahal kontrak maksimal 18%. Kami minta koreksi harga 7%.", "OPEN", null],
];

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
  });
  await client.connect();

  const existing = await client.query("select count(*)::int as total from users");
  if (existing.rows[0].total > 0 && !process.argv.includes("--force")) {
    console.log("⏭️  Data sudah ada, seeding dilewati (gunakan --force untuk mengulang).");
    await client.end();
    return;
  }

  if (process.argv.includes("--force")) {
    await client.query(
      "truncate disputes, payments, orders, listings, notifications, uploads, waste_categories, users restart identity cascade",
    );
  }

  const hash = await bcrypt.hash("password123", 10);

  const kategoriIds = new Map();
  for (const [nama, deskripsi, emoji] of CATEGORIES) {
    const res = await client.query(
      "insert into waste_categories (category_name, description, emoji) values ($1,$2,$3) returning id",
      [nama, deskripsi, emoji],
    );
    kategoriIds.set(nama, res.rows[0].id);
  }

  const userIds = [];
  for (const u of USERS) {
    const res = await client.query(
      `insert into users (name, email, password, phone, address, role, is_verified, verification_status, npwp_url, permit_url, company_name, city, latitude, longitude, rating)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) returning id`,
      [u[0], u[1], hash, u[3], u[4], u[2], u[6], u[7], u[8], u[9], u[10], u[5], u[11], u[12], (4 + Math.random()).toFixed(2)],
    );
    userIds.push(res.rows[0].id);
  }

  const listingIds = [];
  for (const l of LISTINGS) {
    const res = await client.query(
      `insert into listings (provider_id, category_id, title, description, quantity, unit, price_per_unit, condition, latitude, longitude, city, image_url, status, view_count, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'AVAILABLE',$13, now() - ($14 || ' days')::interval) returning id`,
      [l[0], kategoriIds.get(CATEGORIES[l[1] - 1][0]), l[2], l[3], l[4], l[5], l[6], l[7], l[8], l[9], l[10], l[11], Math.floor(Math.random() * 400) + 40, String(Math.floor(Math.random() * 20) + 1)],
    );
    listingIds.push(res.rows[0].id);
  }

  for (const o of ORDERS) {
    const listing = LISTINGS[o.listing - 1];
    const res = await client.query(
      `insert into orders (buyer_id, listing_id, provider_id, requested_quantity, total_price, status, shipping_address, driver_name, driver_phone, vehicle_plate, note, created_at, updated_at, agreed_at, shipped_at, completed_at)
       values ($1,$2,$3,$4,$5,$6::order_status,$7,$8,$9,$10,$11, now() - ($12 || ' days')::interval, now(), 
         case when $6::text in ('AGREED','SHIPPING','COMPLETED') then now() - ($12 || ' days')::interval else null end,
         case when $6::text in ('SHIPPING','COMPLETED') then now() - interval '2 days' else null end,
         case when $6::text = 'COMPLETED' then now() - interval '1 day' else null end) returning id`,
      [
        o.buyer,
        listingIds[o.listing - 1],
        o.provider,
        o.qty,
        o.total,
        o.status,
        o.address,
        o.driver,
        o.phone,
        o.plate,
        o.note,
        String(Math.floor(Math.random() * 10) + 1),
      ],
    );
    const orderId = res.rows[0].id;
    await client.query(
      `insert into payments (order_id, amount, method, status, escrow_status, reference, paid_at, released_at)
       values ($1,$2,$3::payment_method,$4::payment_status,$5::escrow_status,$6,
         case when $4::text = 'UNPAID' then null else now() - interval '3 days' end,
         case when $5::text = 'RELEASED' then now() - interval '1 day' else null end)`,
      [orderId, o.total, o.method, o.paymentStatus, o.escrow, `SK-${orderId}-DEMO`],
    );

    await client.query(
      `insert into notifications (user_id, title, message, type, link, is_read, created_at)
       values ($1,$2,$3,'ORDER',$4,false, now() - interval '2 hours')`,
      [o.provider, "Pembaruan pesanan", `Pesanan #${orderId} berstatus ${o.status}.`, "/dashboard/penyedia"],
    );
    await client.query(
      `insert into notifications (user_id, title, message, type, link, is_read, created_at)
       values ($1,$2,$3,'ORDER',$4,false, now() - interval '1 hour')`,
      [o.buyer, "Pembaruan pesanan", `Pesanan #${orderId} berstatus ${o.status}.`, "/dashboard/industri"],
    );
  }

  for (const d of DISPUTES) {
    await client.query(
      `insert into disputes (order_id, raised_by_id, subject, description, status, resolution)
       values ($1,$2,$3,$4,$5,$6)`,
      [d[0], d[1], d[2], d[3], d[4], d[5]],
    );
  }

  console.log("✅ Seeding selesai: kategori, pengguna, listing, order, pembayaran, sengketa.");
  console.log("   Akun demo (kata sandi: password123):");
  console.log("   • admin@sisakita.id (ADMIN)");
  console.log("   • petani@sisakita.id (PROVIDER)");
  console.log("   • industri@sisakita.id (INDUSTRY)");
  await client.end();
}

main().catch((error) => {
  console.error("❌ Seeding gagal:", error);
  process.exit(1);
});
