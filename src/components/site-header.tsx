"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCartStore } from "@/store/cart";
import { ROLE_LABEL } from "@/lib/labels";
import type { SessionUser } from "@/lib/auth";
import { NotificationBell } from "@/components/notification-bell";

const links = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/peta", label: "Peta Limbah" },
  { href: "/laporan", label: "Laporkan Limbah" },
];

export function SiteHeader({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = useCartStore((s) => s.items);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setOpen(false);
  }, [pathname]);

  const dashboardHref =
    user?.role === "ADMIN"
      ? "/admin"
      : user?.role === "PROVIDER"
        ? "/dashboard/penyedia"
        : "/dashboard/industri";

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold">
          <span
            className="grid h-9 w-9 place-items-center rounded-xl bg-[#2F8F2F] text-lg text-white"
            aria-hidden
          >
            🌾
          </span>
          <span className="text-[#237023]">Sisa</span>
          <span className="-ml-2 text-[#F5A623]">Kita</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Navigasi utama">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                pathname === link.href
                  ? "bg-leaf-50 text-[#237023]"
                  : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/dashboard/industri/keranjang"
            className="relative grid h-11 w-11 place-items-center rounded-xl border border-neutral-200 text-xl hover:border-[#2F8F2F]"
            aria-label="Keranjang pesanan"
          >
            🛒
            {mounted && items.length > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#F5A623] px-1 text-[11px] font-bold text-[#3b2a05]">
                {items.length}
              </span>
            )}
          </Link>

          {user ? <NotificationBell /> : null}

          {user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href={dashboardHref} className="btn-ghost">
                <span aria-hidden>📊</span> Dashboard
              </Link>
              <div className="hidden text-right md:block">
                <p className="text-xs font-bold leading-tight">{user.name}</p>
                <p className="text-[11px] leading-tight text-neutral-500">
                  {ROLE_LABEL[user.role]}
                </p>
              </div>
              <form action="/api/auth/logout" method="post">
                <button className="min-h-[44px] rounded-xl px-3 text-sm font-semibold text-neutral-500 hover:text-rose-600" type="submit">
                  Keluar
                </button>
              </form>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/masuk" className="btn-ghost">
                Masuk
              </Link>
              <Link href="/daftar" className="btn-primary">
                Daftar Gratis
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="grid h-11 w-11 place-items-center rounded-xl border border-neutral-200 lg:hidden"
            aria-label="Buka menu navigasi"
            aria-expanded={open}
          >
            <span aria-hidden>{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-neutral-200 bg-white px-4 pb-4 lg:hidden">
          <nav className="flex flex-col gap-1 py-2" aria-label="Navigasi seluler">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  href={dashboardHref}
                  className="rounded-lg px-3 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
                >
                  Dashboard Saya
                </Link>
                <form action="/api/auth/logout" method="post">
                  <button
                    type="submit"
                    className="w-full rounded-lg px-3 py-3 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    Keluar
                  </button>
                </form>
              </>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link href="/masuk" className="btn-ghost">
                  Masuk
                </Link>
                <Link href="/daftar" className="btn-primary">
                  Daftar
                </Link>
              </div>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}