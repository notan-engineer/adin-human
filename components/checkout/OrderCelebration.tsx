"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";

import { useCart } from "@/lib/store/cart";

/**
 * Peak-end flourish for the order-confirmation page: a gold check that draws in
 * once (≤2s, transform/opacity only) and — as a side effect of a successful
 * order landing here — clears the persisted cart on mount. Reduced-motion users
 * get the final, static check with no animation. The cart clear still runs.
 */
export function OrderCelebration() {
  const reduced = useReducedMotion();
  const clear = useCart((s) => s.clear);

  React.useEffect(() => {
    // The shopper reached the confirmation page → the order is placed; empty the
    // cart so a back-navigation doesn't re-checkout stale items.
    clear();
  }, [clear]);

  const ring = (
    <span
      aria-hidden
      className="flex size-16 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold shadow-gold-glow"
    >
      <Check className="size-8" strokeWidth={2.5} />
    </span>
  );

  if (reduced) {
    return ring;
  }

  return (
    <motion.span
      aria-hidden
      className="flex size-16 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold shadow-gold-glow"
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.span
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <Check className="size-8" strokeWidth={2.5} />
      </motion.span>
    </motion.span>
  );
}
