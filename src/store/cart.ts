"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  listingId: number;
  title: string;
  unit: "KG" | "TON";
  pricePerUnit: number;
  maxQuantity: number;
  imageUrl: string | null;
  categoryName: string | null;
  providerName: string;
  quantity: number;
  shippingAddress: string;
  note: string;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  remove: (listingId: number) => void;
  setQuantity: (listingId: number, quantity: number) => void;
  setAddress: (listingId: number, address: string) => void;
  setNote: (listingId: number, note: string) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.listingId === item.listingId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.listingId === item.listingId
                  ? { ...i, ...item, quantity: i.quantity + (item.quantity ?? 1) }
                  : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { ...item, quantity: item.quantity ?? Math.min(100, item.maxQuantity) },
            ],
          };
        }),
      remove: (listingId) =>
        set((state) => ({
          items: state.items.filter((i) => i.listingId !== listingId),
        })),
      setQuantity: (listingId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.listingId === listingId
              ? { ...i, quantity: Math.min(quantity, i.maxQuantity) }
              : i,
          ),
        })),
      setAddress: (listingId, address) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.listingId === listingId ? { ...i, shippingAddress: address } : i,
          ),
        })),
      setNote: (listingId, note) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.listingId === listingId ? { ...i, note } : i,
          ),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "sisakita-cart" },
  ),
);
