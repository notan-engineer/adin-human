"use client";

import { useEffect, useRef } from "react";
import { Check, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";

import { usePrefersReducedMotion } from "@/components/motion/use-reduced-motion";
import { Link } from "@/lib/i18n/navigation";
import { useCartToast } from "@/lib/store/toast";

const AUTO_DISMISS_MS = 4000;
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Add-to-cart confirmation toast. Mounted once in the locale layout.
 *
 * The viewport is a permanently-mounted polite live region - a live region has
 * to exist BEFORE content is injected for screen readers to announce it
 * reliably (same reason Newsletter keeps its status node mounted). Bottom
 * center on mobile, bottom-start on desktop (logical start: right in RTL
 * Hebrew, left in English). Deliberately no ₪ amounts here - money renders in
 * the cart, not in a transient card.
 *
 * The countdown pauses while the pointer is over the card or focus is inside
 * it, so a keyboard user tabbing to the cart link isn't cut off mid-action.
 */
export function CartToaster() {
  const t = useTranslations("cart");
  const toast = useCartToast((s) => s.toast);
  const dismiss = useCartToast((s) => s.dismiss);
  const reduced = usePrefersReducedMotion();

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deadline = useRef(0);
  const remaining = useRef(AUTO_DISMISS_MS);

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const pause = () => {
    if (!timer.current) return;
    remaining.current = Math.max(0, deadline.current - Date.now());
    clear();
  };

  const resume = () => {
    if (!toast || timer.current) return;
    deadline.current = Date.now() + remaining.current;
    timer.current = setTimeout(dismiss, remaining.current);
  };

  // (Re)start the countdown for every shown toast; `show()` creates a fresh
  // object, so a repeat add restarts the timer even while a toast is visible.
  useEffect(() => {
    if (!toast) return;
    remaining.current = AUTO_DISMISS_MS;
    deadline.current = Date.now() + AUTO_DISMISS_MS;
    timer.current = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    };
  }, [toast, dismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      // A GRID with every card in the same cell: during a keyed remount
      // (repeat add) the exiting and entering cards OVERLAP instead of
      // rendering side-by-side at half width for the exit's 350ms.
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 grid sm:inset-x-auto sm:bottom-6 sm:start-6 sm:w-96"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            // Keyed by id: a repeat add remounts the card, which re-pulses the
            // animation AND re-announces the fresh live-region content.
            key={toast.id}
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: reduced ? 0 : 0.35, ease: EASE }}
            onPointerEnter={pause}
            onPointerLeave={resume}
            onFocusCapture={pause}
            onBlurCapture={resume}
            className="pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-border border-s-2 border-s-gold bg-card p-4 shadow-ember [grid-area:1/1]"
          >
            <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-gold" />
            <div className="flex-1 text-sm">
              <p className="text-foreground/90">
                {t("toastAdded", { name: toast.name })}
              </p>
              <Link
                href="/cart"
                onClick={dismiss}
                className="mt-1 inline-block font-medium text-gold hover:underline"
              >
                {t("viewCart")}
              </Link>
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label={t("toastDismiss")}
              className="-me-1 -mt-1 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X aria-hidden className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
