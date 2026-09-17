"use client";

import { useCallback, useState } from "react";

const KEY = "sisakita_lokasi";

export type Lokasi = { lat: number; lng: number; label?: string };

function readLokasi(): Lokasi | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Lokasi;
  } catch {
    /* abaikan */
  }
  return null;
}

export function useLokasi() {
  const [lokasi, setLokasi] = useState<Lokasi | null>(readLokasi);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  const simpan = useCallback((next: Lokasi) => {
    setLokasi(next);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* abaikan */
      }
    }
  }, []);

  const deteksi = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setGalat("Perangkat tidak mendukung deteksi lokasi.");
      return;
    }
    setMemuat(true);
    setGalat(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        simpan({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          label: "Lokasi saya",
        });
        setMemuat(false);
      },
      () => {
        setGalat("Izin lokasi ditolak. Gunakan pencarian kota sebagai alternatif.");
        setMemuat(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, [simpan]);

  return { lokasi, simpan, deteksi, memuat, galat, setLokasi: simpan };
}