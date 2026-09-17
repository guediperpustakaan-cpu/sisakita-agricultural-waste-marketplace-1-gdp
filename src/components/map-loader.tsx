"use client";

import dynamic from "next/dynamic";
import type { MapPoint } from "@/components/map-view";

const MapView = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => (
    <div className="grid h-[420px] place-items-center rounded-2xl border border-neutral-200 bg-neutral-100 text-sm text-neutral-500">
      Memuat peta…
    </div>
  ),
});

export function MapLoader(props: {
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
  height?: number;
  onPick?: (lat: number, lng: number) => void;
  selectable?: boolean;
}) {
  return <MapView {...props} />;
}
