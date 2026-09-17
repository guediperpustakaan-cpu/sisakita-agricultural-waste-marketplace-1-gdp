"use client";

import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatJarak, formatQuantity, formatRupiah } from "@/lib/format";

export type MapPoint = {
  id: number;
  title: string;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  quantity: string;
  unit: "KG" | "TON";
  pricePerUnit: string;
  distanceKm: number | null;
  imageUrl: string | null;
};

function makeIcon(emoji: string) {
  return L.divIcon({
    className: "",
    html: `<div class="sisa-marker"><span>${emoji}</span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 30],
    popupAnchor: [0, -28],
  });
}

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom() ?? 10);
  }, [center, map]);
  return null;
}

function ClickCapture({ onPick }: { onPick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick?.(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

export default function MapView({
  points,
  center = [-6.595, 106.816],
  zoom = 10,
  height = 420,
  onPick,
  selectable = false,
}: {
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
  height?: number;
  onPick?: (lat: number, lng: number) => void;
  selectable?: boolean;
}) {
  const valid = points.filter(
    (p) => typeof p.latitude === "number" && typeof p.longitude === "number",
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200" style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter center={center} />
        {selectable && onPick ? <ClickCapture onPick={onPick} /> : null}
        {valid.map((point) => (
          <Marker
            key={point.id}
            position={[point.latitude as number, point.longitude as number]}
            icon={makeIcon("🌾")}
          >
            <Popup>
              <div style={{ minWidth: 190 }}>
                <p style={{ fontWeight: 700, margin: 0 }}>{point.title}</p>
                <p style={{ margin: "2px 0", fontSize: 12, color: "#555" }}>
                  {point.city ?? "Lokasi tidak diketahui"}
                </p>
                <p style={{ margin: 0, fontSize: 13 }}>
                  {formatQuantity(point.quantity, point.unit)} ·{" "}
                  {formatRupiah(point.pricePerUnit)}/unit
                </p>
                {point.distanceKm !== null && (
                  <p style={{ margin: "2px 0", fontSize: 12, color: "#2F8F2F" }}>
                    📍 {formatJarak(point.distanceKm)} dari Anda
                  </p>
                )}
                <a
                  href={`/listing/${point.id}`}
                  style={{
                    display: "inline-block",
                    marginTop: 8,
                    background: "#2F8F2F",
                    color: "white",
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Lihat Detail
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
