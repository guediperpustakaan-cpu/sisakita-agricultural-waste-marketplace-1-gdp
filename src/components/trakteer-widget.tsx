"use client";

import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { formatRupiah } from "@/lib/format";

const TRAKTEER_URL = "https://trakteer.id/perpus_opera/";

const NOMINALS = [
  { value: 6000, label: "Kopi Panas", emoji: "☕" },
  { value: 12000, label: "Kopi Susu", emoji: "🥛" },
  { value: 18000, label: "Cangkir Besar", emoji: "🏺" },
  { value: 30000, label: "Cemilan", emoji: "🍩" },
  { value: 60000, label: "Tanki Server", emoji: "🖥️" },
  { value: 120000, label: "Sponsor Sehari", emoji: "🌟" },
];

export function TrakteerWidget() {
  const [open, setOpen] = useState(false);
  const [nominal, setNominal] = useState(6000);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const link = `${TRAKTEER_URL}?nominal=${nominal}`;

  return (
    <>
      {/* Tombol melayang di sudut kanan bawah */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Traktir kita lewat Trakteer"
        className="group fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full bg-gradient-to-r from-[#F5A623] to-[#e0931a] px-4 py-3 text-sm font-bold text-[#3b2a05] shadow-lg ring-2 ring-white/70 transition hover:scale-105 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
      >
        <span className="text-lg" aria-hidden>
          ☕
        </span>
        <span className="hidden leading-tight sm:inline">
          Web app ini gratis &amp; bebas iklan.
          <br />
          Kopi kecil, server tetap jalan
        </span>
        <span className="leading-tight sm:hidden">Traktir Kopi</span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Pilih nominal traktiran"
          onClick={() => setOpen(false)}
        >
          <div
            className="card w-full max-w-md overflow-hidden p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#F5A623] to-[#e0931a] p-5 text-[#3b2a05]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold">Traktir Kopi ☕</h2>
                  <p className="text-xs font-semibold">
                    Web app ini gratis &amp; bebas iklan. Kopi kecil, server tetap jalan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Tutup"
                  className="grid h-8 w-8 place-items-center rounded-full bg-white/30 text-sm font-bold hover:bg-white/50"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <p className="label">Pilih nominal traktiran</p>
                <div className="grid grid-cols-3 gap-2">
                  {NOMINALS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setNominal(item.value)}
                      aria-pressed={nominal === item.value}
                      className={`rounded-xl border-2 p-2 text-center transition ${
                        nominal === item.value
                          ? "border-[#F5A623] bg-amber-50"
                          : "border-neutral-200 hover:border-amber-300"
                      }`}
                    >
                      <span className="block text-lg" aria-hidden>
                        {item.emoji}
                      </span>
                      <span className="block text-xs font-bold">
                        {formatRupiah(item.value)}
                      </span>
                      <span className="block text-[10px] text-neutral-500">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-center">
                <p className="text-xs font-semibold text-neutral-600">
                  Scan QR untuk traktiran {formatRupiah(nominal)}
                </p>
                <div className="mt-3 inline-block rounded-xl bg-white p-3 shadow-sm">
                  <QRCodeCanvas
                    value={link}
                    size={180}
                    level="M"
                    marginSize={1}
                    aria-label="Kode QR Trakteer"
                  />
                </div>
                <p className="mt-2 text-[11px] text-neutral-500">
                  Aplikasi e-wallet / mobile banking apa pun yang mendukung QRIS
                </p>
              </div>

              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="btn-primary w-full"
              >
                🚀 Buka halaman Trakteer
              </a>
              <p className="text-center text-[11px] text-neutral-400">
                Terima kasih sudah mendukung server &amp; kopi kami 🙏
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}