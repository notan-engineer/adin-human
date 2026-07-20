"use client";

import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/lib/i18n/navigation";
import { useCart } from "@/lib/store/cart";
import { cn } from "@/lib/utils";

/**
 * Cart entry point. Reads the live unit count from the persisted cart store and
 * shows a count badge only when there is something in the cart; the badge is
 * anchored with logical utilities so it flips under RTL.
 *
 * A mount guard keeps SSR output (count 0, no badge) identical to the first
 * client render, so hydration never mismatches before the store rehydrates.
 */
export function CartButton({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const tc = useTranslations("cart");
  const count = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0));

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const shown = mounted ? count : 0;
  const hasItems = shown > 0;

  return (
    <Link
      href="/cart"
      aria-label={hasItems ? tc("itemCount", { count: shown }) : t("cart")}
      className={cn(
        "relative inline-flex size-10 items-center justify-center rounded-md text-foreground/80 transition-colors hover:bg-secondary hover:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <ShoppingBag className="size-5" aria-hidden />
      {hasItems && (
        <span
          aria-hidden
          data-testid="cart-count"
          className="absolute -top-0.5 -end-0.5 inline-flex min-w-[1.15rem] items-center justify-center rounded-full bg-gold px-1.5 text-[0.625rem] font-bold leading-tight text-primary-foreground"
        >
          {shown > 99 ? "99+" : shown}
        </span>
      )}
    </Link>
  );
}
