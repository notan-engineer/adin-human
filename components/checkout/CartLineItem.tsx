"use client";

import { Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { QuantityStepper } from "@/components/product/QuantityStepper";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/catalog";
import { Link } from "@/lib/i18n/navigation";
import { formatAgorot } from "@/lib/money";
import { useCart } from "@/lib/store/cart";

// Same soft radial mask the cards use: melt the pouch render's baked-in flat
// background into the dark thumbnail so the pouch reads as floating on its glow.
const POUCH_MASK =
  "radial-gradient(closest-side at 50% 44%, #000 52%, transparent 86%)";

/**
 * One cart line: masked pouch thumbnail, localized name (links to the PDP),
 * unit price, a quantity stepper bound to `setQty(slug, n)`, the line total
 * (`unit × qty`), and a remove button. All money is integer agorot, formatted
 * only at the render boundary. RTL-safe via logical utilities; the fixed-size
 * thumbnail reserves its box so nothing shifts (no CLS).
 */
export function CartLineItem({
  product,
  qty,
}: {
  product: Product;
  qty: number;
}) {
  const locale = useLocale() as "he" | "en";
  const t = useTranslations("cart");
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);

  const { slug, image, glow, name, priceAgorot } = product;
  const lineTotal = priceAgorot * qty;

  return (
    <li className="flex gap-4 py-5">
      {/* Thumbnail → PDP */}
      <Link
        href={`/product/${slug}`}
        aria-label={name[locale]}
        className="relative flex aspect-[4/5] w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-card outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background: `radial-gradient(58% 55% at 50% 52%, ${glow}, transparent 72%)`,
          }}
        />
        <picture className="relative">
          <source srcSet={`/products/${image}/pouch.avif`} type="image/avif" />
          <source srcSet={`/products/${image}/pouch.webp`} type="image/webp" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/products/${image}/pouch.jpg`}
            alt=""
            width={900}
            height={1125}
            loading="lazy"
            className="h-full w-auto object-contain"
            style={{ WebkitMaskImage: POUCH_MASK, maskImage: POUCH_MASK }}
          />
        </picture>
      </Link>

      {/* Details */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 font-display text-base font-bold leading-tight text-foreground">
            <Link
              href={`/product/${slug}`}
              className="rounded-sm outline-none transition-colors hover:text-gold focus-visible:ring-2 focus-visible:ring-ring"
            >
              {name[locale]}
            </Link>
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(slug)}
            aria-label={t("remove")}
            className="-me-2 -mt-2 size-10 shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 aria-hidden />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          {formatAgorot(priceAgorot, locale)} {t("each")}
        </p>

        <div className="mt-1 flex items-center justify-between gap-3">
          <QuantityStepper
            value={qty}
            onChange={(n) => setQty(slug, n)}
            min={1}
          />
          <span className="font-display text-base font-bold tabular-nums text-foreground">
            {formatAgorot(lineTotal, locale)}
          </span>
        </div>
      </div>
    </li>
  );
}
