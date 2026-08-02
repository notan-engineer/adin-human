"use client";

import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";

import { CartLineItem } from "@/components/checkout/CartLineItem";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { Button } from "@/components/ui/button";
import { getProduct } from "@/lib/catalog";
import { Link } from "@/lib/i18n/navigation";
import { useCart } from "@/lib/store/cart";

/**
 * The full cart: the line-item list plus the order summary, or an empty state.
 * Reads the persisted cart store, resolves each slug to a Product (dropping any
 * unknown/discontinued slug still in localStorage), and computes the subtotal in
 * integer agorot.
 *
 * A mount guard renders the empty state on the server and first client paint —
 * the persisted store only rehydrates on the client — so hydration never
 * mismatches, then the real cart swaps in.
 *
 * Layout: two columns on desktop (list at the start, a sticky summary at the
 * end); stacked on mobile. RTL-safe via logical utilities.
 */
export function CartView() {
  const t = useTranslations("cart");
  const items = useCart((s) => s.items);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Resolve lines against the catalog; `flatMap` both drops unknown slugs and
  // narrows `product` to a defined Product for the rest of the render.
  const lines = mounted
    ? items.flatMap((item) => {
        const product = getProduct(item.slug);
        return product ? [{ product, qty: item.qty }] : [];
      })
    : [];

  const subtotal = lines.reduce(
    (sum, l) => sum + l.product.priceAgorot * l.qty,
    0,
  );
  const count = lines.reduce((sum, l) => sum + l.qty, 0);

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center sm:py-24">
        <div
          aria-hidden
          className="flex size-16 items-center justify-center rounded-full border border-border bg-card text-muted-foreground"
        >
          <ShoppingBag className="size-7" />
        </div>
        <p className="text-lg text-muted-foreground">{t("empty")}</p>
        <Button asChild variant="gold" size="lg">
          <Link href="/#products">{t("emptyCta")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:gap-12">
      <section aria-labelledby="cart-items-heading">
        <h2
          id="cart-items-heading"
          className="mb-1 font-display text-lg font-bold text-foreground"
        >
          {t("itemsHeading", { count })}
        </h2>
        <ul className="divide-y divide-border/60 border-t border-border/60">
          {lines.map((l) => (
            <CartLineItem
              key={l.product.slug}
              product={l.product}
              qty={l.qty}
            />
          ))}
        </ul>
      </section>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <OrderSummary subtotalAgorot={subtotal} bagCount={count} />
      </aside>
    </div>
  );
}
