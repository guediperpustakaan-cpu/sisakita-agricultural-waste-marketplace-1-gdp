import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(3, "Nama minimal 3 karakter"),
    email: z.string().email("Format email tidak valid"),
    password: z.string().min(6, "Kata sandi minimal 6 karakter"),
    confirmPassword: z.string(),
    phone: z
      .string()
      .min(9, "Nomor telepon minimal 9 digit")
      .optional()
      .or(z.literal("")),
    role: z.enum(["PROVIDER", "INDUSTRY"], {
      message: "Pilih jenis akun",
    }),
    companyName: z.string().optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    city: z.string().optional().or(z.literal("")),
    npwpUrl: z.string().optional().or(z.literal("")),
    permitUrl: z.string().optional().or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak sama",
    path: ["confirmPassword"],
  })
  .refine((data) => data.role !== "INDUSTRY" || !!data.npwpUrl, {
    message: "Akun industri wajib melampirkan dokumen NPWP",
    path: ["npwpUrl"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const listingSchema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter"),
  categoryId: z
    .number({ message: "Pilih kategori limbah" })
    .int()
    .positive("Pilih kategori limbah"),
  description: z.string().min(10, "Deskripsi minimal 10 karakter"),
  quantity: z
    .number({ message: "Kuantitas harus berupa angka" })
    .positive("Kuantitas harus lebih dari 0")
    .max(1_000_000, "Kuantitas terlalu besar"),
  unit: z.enum(["KG", "TON"]),
  pricePerUnit: z
    .number({ message: "Harga harus berupa angka" })
    .positive("Harga harus lebih dari 0"),
  condition: z.enum(["DRY", "WET", "SEMI_DRY"]),
  imageUrl: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type ListingInput = z.infer<typeof listingSchema>;

export const orderSchema = z.object({
  listingId: z.coerce.number().int().positive(),
  requestedQuantity: z.coerce.number().positive("Kuantitas harus lebih dari 0"),
  note: z.string().optional().or(z.literal("")),
  shippingAddress: z.string().min(8, "Alamat pengiriman minimal 8 karakter"),
});

export type OrderInput = z.infer<typeof orderSchema>;

export const driverSchema = z.object({
  driverName: z.string().min(3, "Nama pengemudi minimal 3 karakter"),
  driverPhone: z.string().min(9, "Nomor telepon minimal 9 digit"),
  vehiclePlate: z.string().min(4, "Nomor polisi minimal 4 karakter"),
});

export const disputeSchema = z.object({
  orderId: z.coerce.number().int().positive(),
  subject: z.string().min(5, "Subjek minimal 5 karakter"),
  description: z.string().min(15, "Jelaskan masalah minimal 15 karakter"),
});

export const categorySchema = z.object({
  categoryName: z.string().min(3, "Nama kategori minimal 3 karakter"),
  description: z.string().optional().or(z.literal("")),
  emoji: z.string().optional().or(z.literal("")),
});
