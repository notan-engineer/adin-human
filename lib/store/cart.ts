import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { Product } from "@/lib/catalog";

/** One line in the cart: a product slug and how many of it. */
export type CartItem = { slug: string; qty: number };

type CartState = {
  items: CartItem[];
  /** Add `qty` of `slug` (merges into the existing line if present). */
  add: (slug: string, qty?: number) => void;
  /** Remove a line entirely. */
  remove: (slug: string) => void;
  /** Set an exact quantity; `qty <= 0` removes the line. */
  setQty: (slug: string, qty: number) => void;
  clear: () => void;
  /** Total number of units across all lines. */
  count: () => number;
};

/**
 * Cart store, persisted to localStorage under "hc-cart".
 *
 * SSR-safe: `createJSONStorage(() => localStorage)` swallows the server-side
 * `localStorage is not defined` throw and hydration no-ops until the client
 * mounts (zustand guards `hydrate()` on a missing storage). Only `items` is
 * persisted — action functions are recreated on each load.
 */
export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      add: (slug, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.slug === slug);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.slug === slug ? { ...i, qty: i.qty + qty } : i,
              ),
            };
          }
          return { items: [...state.items, { slug, qty }] };
        }),

      remove: (slug) =>
        set((state) => ({
          items: state.items.filter((i) => i.slug !== slug),
        })),

      setQty: (slug, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => i.slug !== slug)
              : state.items.map((i) => (i.slug === slug ? { ...i, qty } : i)),
        })),

      clear: () => set({ items: [] }),

      count: () => get().items.reduce((n, i) => n + i.qty, 0),
    }),
    {
      name: "hc-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

/**
 * Sum a cart's line items against the catalog, in integer agorot. Lines whose
 * slug is unknown (e.g. a discontinued SKU still in localStorage) are ignored.
 */
export function subtotalAgorot(items: CartItem[], products: Product[]): number {
  return items.reduce((sum, item) => {
    const product = products.find((p) => p.slug === item.slug);
    return product ? sum + product.priceAgorot * item.qty : sum;
  }, 0);
}
