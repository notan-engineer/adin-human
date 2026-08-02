import { create } from "zustand";

/**
 * Single-slot add-to-cart toast state.
 *
 * Deliberately one slot, not a queue: the only producer is AddToCartButton, and
 * a rapid second add should REPLACE the visible toast (fresh product name,
 * restarted timer) rather than stack. `id` increments on every show so the
 * renderer can key a remount — that's what re-triggers both the enter animation
 * and the live-region announcement on repeat adds.
 */
type ToastState = {
  toast: { id: number; name: string } | null;
  show: (name: string) => void;
  dismiss: () => void;
};

let nextId = 0;

export const useCartToast = create<ToastState>()((set) => ({
  toast: null,
  show: (name) => set({ toast: { id: ++nextId, name } }),
  dismiss: () => set({ toast: null }),
}));
