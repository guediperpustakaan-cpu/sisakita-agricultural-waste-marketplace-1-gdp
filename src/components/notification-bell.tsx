"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { relativeTime } from "@/lib/format";

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [lastCount, setLastCount] = useState(0);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return null;
      const data = (await res.json()) as { items: NotificationItem[] };
      return data.items;
    } catch {
      /* diamkan bila jaringan gagal */
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;
    const tick = async () => {
      const data = await load();
      if (!active || !data) return;
      setItems(data);
      setLastCount(data.filter((i) => !i.isRead).length);
    };
    void tick();
    const timer = setInterval(() => {
      void tick();
    }, 15000); // pembaruan otomatis setiap 15 detik
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [load]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function markAllRead() {
    setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
    setLastCount(0);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
  }

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-11 w-11 place-items-center rounded-xl border border-neutral-200 text-xl hover:border-[#2F8F2F]"
        aria-label={`Notifikasi, ${lastCount} belum dibaca`}
      >
        🔔
        {lastCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white">
            {lastCount}
          </span>
        )}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <p className="text-sm font-bold">Notifikasi</p>
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs font-semibold text-[#2F8F2F] hover:underline"
            >
              Tandai dibaca
            </button>
          </div>
          <ul className="max-h-80 divide-y divide-neutral-100 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-neutral-500">
                Belum ada notifikasi.
              </li>
            ) : (
              items.map((item) => (
                <li
                  key={item.id}
                  className={`px-4 py-3 ${item.isRead ? "" : "bg-leaf-50/70"}`}
                >
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-0.5 text-xs text-neutral-600">{item.message}</p>
                  <p className="mt-1 text-[11px] text-neutral-400">
                    {relativeTime(item.createdAt)}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}