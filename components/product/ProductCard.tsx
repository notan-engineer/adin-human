import { useLocale, useTranslations } from "next-intl";

import { AddToCartButton } from "@/components/product/AddToCartButton";
import { HeatMeter } from "@/components/product/HeatMeter";
import type { Product } from "@/lib/catalog";
import { Link } from "@/lib/i18n/navigation";
import { formatAgorot } from "@/lib/money";
import { cn } from "@/lib/utils";

// Soft radial mask that fades each pouch render's flat color background into the
// dark card, so the black pouch reads as floating on the flavor-glow.
const POUCH_MASK =
  "radial-gradient(closest-side at 50% 44%, #000 52%, transparent 86%)";

/**
 * A single product card: the pouch floating on a soft radial flavor-glow, the
 * localized name, heat meter, price, and a quick "Add".
 *
 * Interaction model (no nested interactive elements): the whole card is made
 * clickable by a "stretched link" — the title's <Link> owns a full-card ::after
 * overlay — while the Add button sits on its own raised layer above it. The
 * pouch has explicit width/height, so the card reserves its space (no CLS).
 *
 * Server-safe (next-intl `useTranslations` / `useLocale`).
 */
export function ProductCard({ product }: { product: Product }) {
  const locale = useLocale() as "he" | "en";
  const t = useTranslations("product");
  const { slug, image, glow, name, heatLevel, priceAgorot, badges } = product;
  const isBestseller = badges.includes("bestseller");

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card",
        "transition-[transform,box-shadow] duration-300 will-change-transform",
        "hover:-translate-y-1 hover:shadow-ember focus-within:-translate-y-1 focus-within:shadow-ember",
      )}
    >
      {/* Pouch on flavor-glow */}
      <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden p-4">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60 transition-opacity duration-300 group-hover:opacity-80"
          style={{
            background: `radial-gradient(58% 55% at 50% 52%, ${glow}, transparent 72%)`,
          }}
        />
        {isBestseller && (
          <span className="absolute start-3 top-3 z-10 rounded-full bg-gold/90 px-2.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider text-primary-foreground">
            {t("bestseller")}
          </span>
        )}
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
            className="mx-auto h-full w-auto object-contain drop-shadow-[0_14px_28px_rgba(0,0,0,0.55)] transition-transform duration-300 group-hover:scale-[1.03]"
            // Melt the pouch's baked-in flat color background into the dark card,
            // leaving the black pouch floating over the radial flavor-glow.
            style={{
              WebkitMaskImage: POUCH_MASK,
              maskImage: POUCH_MASK,
            }}
          />
        </picture>
      </div>

      {/* Copy + actions */}
      <div className="flex flex-1 flex-col gap-3 border-t border-border/60 p-4">
        <div className="flex flex-col gap-2">
          <h3 className="font-display text-lg font-bold leading-tight text-foreground">
            {/* Stretched link: the ::after overlay makes the whole card
                navigable without wrapping the Add button. */}
            <Link
              href={`/product/${slug}`}
              className="rounded-sm outline-none after:absolute after:inset-0 after:content-[''] focus-visible:ring-2 focus-visible:ring-ring"
            >
              {name[locale]}
            </Link>
          </h3>
          <HeatMeter level={heatLevel} />
        </div>

        {/* Price + Add. STACKED below sm: a two-column grid card at 390px
            leaves ~135px of content width — price beside the button clipped
            the button at the card edge. Stacking also yields a full-width,
            taller (h-10) tap target on touch screens. */}
        <div className="mt-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display text-xl font-bold text-gold">
            {formatAgorot(priceAgorot, locale)}
          </span>
          {/* Raised above the stretched-link overlay so it stays independently
              clickable. */}
          <AddToCartButton
            slug={slug}
            size="sm"
            className="relative z-10 h-10 w-full sm:h-9 sm:w-auto"
          />
        </div>
      </div>
    </article>
  );
}
