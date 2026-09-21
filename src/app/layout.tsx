import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { TrakteerWidget } from "@/components/trakteer-widget";
import { APP_NAME } from "@/lib/labels";

export const metadata: Metadata = {
  title: `${APP_NAME} — Marketplace Limbah Pertanian untuk Industri`,
  description:
    "SisaKita menghubungkan petani dan kolektor limbah pertanian dengan pabrik serta pengolah industri. Jual beli limbah, escrow aman, dan pelacakan pengiriman.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="id">
      <body className="flex min-h-screen flex-col bg-[#F4F4F4] text-neutral-900 antialiased">
        <SiteHeader user={user} />
        <main className="flex-1">{children}</main>
        <TrakteerWidget />
        <footer className="mt-16 border-t border-neutral-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="flex items-center gap-2 text-lg font-extrabold text-[#237023]">
                <span aria-hidden>🌾</span> SisaKita
              </p>
              <p className="mt-3 text-sm text-neutral-600">
                Marketplace limbah pertanian untuk industri. Ubah sisa panen
                menjadi nilai ekonomi, kurangi pembakaran, dan dukung ekonomi
                sirkular.
              </p>
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900">Jelajahi</p>
              <ul className="mt-3 space-y-2 text-sm text-neutral-600">
                <li>
                  <Link className="hover:text-[#2F8F2F]" href="/marketplace">
                    Marketplace Limbah
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-[#2F8F2F]" href="/peta">
                    Peta Sebaran Limbah
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-[#2F8F2F]" href="/laporan">
                    Laporkan Limbah
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900">Untuk Industri</p>
              <ul className="mt-3 space-y-2 text-sm text-neutral-600">
                <li>
                  <Link className="hover:text-[#2F8F2F]" href="/dashboard/industri">
                    Dashboard Industri
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-[#2F8F2F]" href="/daftar">
                    Verifikasi NPWP &amp; Izin
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-[#2F8F2F]" href="/bantuan">
                    Pusat Bantuan
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900">Kontak</p>
              <ul className="mt-3 space-y-2 text-sm text-neutral-600">
                <li>📧 halo@sisakita.id</li>
                <li>📞 0800-1234-567</li>
                <li>📍 Jl. Agro Industri No. 8, Bogor</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-200 px-4 py-5 text-center text-xs text-neutral-500">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <span>© {new Date().getFullYear()} SisaKita.</span>
              <a
                href="/api/source"
                className="font-semibold text-[#2F8F2F] hover:underline"
              >
                ⬇ Download Source Code
              </a>
            </div>
            <p className="mt-1">Open Source oleh MZF - 2026 · Dibangun untuk ekonomi sirkular Indonesia.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
