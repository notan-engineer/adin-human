"use client";

import { useEffect, useRef, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { CartLineItem } from "@/components/checkout/CartLineItem";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { Button } from "@/components/ui/button";
import { getProduct } from "@/lib/catalog";
import { Link } from "@/lib/i18n/navigation";
import { useCart } from "@/lib/store/cart";

const H1_CLASS =
  "font-display text-3xl font-black leading-tight text-foreground sm:text-4xl";

/**
 * The /cart page's client island, in two phases on the SAME url:
 *
 * - "cart"     — the line-item list + order summary (or the empty state).
 * - "checkout" — clicking "מעבר לתשלום" pushes `?checkout=1` via NATIVE
 *   `history.pushState` (Next syncs it into `useSearchParams`), so the page
 *   never navigates: the cart contracts into the sticky CheckoutSummaryBar
 *   (rendered by CheckoutForm) and the checkout forms appear below. The
 *   browser Back button pops the query and lands back on the cart view;
 *   `/cart?checkout=1` deep-links straight into the forms.
 *
 * The h1 lives here (not the server shell) because it swaps with the phase —
 * and receives focus on the transition so screen readers hear the change.
 *
 * A mount guard renders the empty state on the server and first client paint —
 * the persisted store only rehydrates on the client — so hydration never
 * mismatches, then the real cart swaps in. An empty cart always falls through
 * to the empty state, whatever the query says.
 */
export function CartView() {
  const t = useTranslations("cart");
  const tCheckout = useTranslations("checkout");
  const items = useCart((s) => s.items);
  const searchParams = useSearchParams();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const pendingFocus = useRef(false);

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

  const phase =
    lines.length > 0 && searchParams.has("checkout") ? "checkout" : "cart";

  const enterCheckout = () => {
    window.history.pushState(null, "", "?checkout=1");
    pendingFocus.current = true;
    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };

  const exitCheckout = () => {
    window.history.pushState(null, "", window.location.pathname);
  };

  // Focus the swapped-in checkout heading, but only after a user-initiated
  // transition — not on a direct ?checkout=1 load.
  useEffect(() => {
    if (phase === "checkout" && pendingFocus.current) {
      pendingFocus.current = false;
      headingRef.current?.focus({ preventScroll: true });
    }
  }, [phase]);

  if (lines.length === 0) {
    return (
      <>
        <h1 className={H1_CLASS}>{t("title")}</h1>
        <div className="mt-8 flex flex-col items-center gap-6 py-16 text-center sm:mt-10 sm:py-24">
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
      </>
    );
  }

  if (phase === "checkout") {
    return (
      <>
        <div className="mx-auto max-w-3xl">
          <h1 ref={headingRef} tabIndex={-1} className={H1_CLASS}>
            {tCheckout("title")}
          </h1>
          <p className="mt-2 text-muted-foreground">{tCheckout("subtitle")}</p>
        </div>
        <div className="mt-8 sm:mt-10">
          <CheckoutForm onEditCart={exitCheckout} />
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className={H1_CLASS}>{t("title")}</h1>
      <div className="mt-8 grid gap-8 sm:mt-10 lg:grid-cols-[1fr_22rem] lg:gap-12">
        <section aria-labelledby="cart-items-heading">
          <h2
            id="cart-items-heading"
            className="mb-1 font-display text-lg font-bold text-foreground"
          >
            {t("itemsHeading", { count })}
          </h2>
          <ul className="divide-y divide-border/60 border-t border-border/60">
            {lines.map((l) => (
              <CartLineItem key={l.product.slug} product={l.product} qty={l.qty} />
            ))}
          </ul>
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <OrderSummary
            subtotalAgorot={subtotal}
            bagCount={count}
            onCheckout={enterCheckout}
          />
        </aside>
      </div>
    </>
  );
}
