import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Truck } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { HeatMeter } from "@/components/product/HeatMeter";
import { NutritionTable } from "@/components/product/NutritionTable";
import { ProductCard } from "@/components/product/ProductCard";
import { PurchasePanel } from "@/components/product/PurchasePanel";
import { TrustBadges } from "@/components/product/TrustBadges";
import { Reveal } from "@/components/motion/Reveal";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAllProducts, getProduct, getRelated } from "@/lib/catalog";
import { FREE_SHIPPING_THRESHOLD_AGOROT } from "@/lib/commerce/shipping";
import { Link } from "@/lib/i18n/navigation";
import { productJsonLd } from "@/lib/jsonld";
import { formatAgorot } from "@/lib/money";
import { pageMetadata, toLocale } from "@/lib/seo";

type Params = { locale: string; slug: string };

/** Pre-render a PDP for every product (all locales come from the parent layout). */
export function generateStaticParams() {
  return getAllProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = toLocale(raw);
  const product = getProduct(slug);
  if (!product) return {};

  // Bare title — the layout template appends " — The Heuman Chef".
  // No `images` override: the sibling opengraph-image.tsx renders a proper
  // 1200x630 card (pouch + name + price), which beats the portrait 900x1125
  // pouch render that social platforms would letterbox.
  //
  // `openGraph.type` stays "website" (set by pageMetadata) rather than
  // "product" — the OG product vertical needs og:product:* namespace fields to
  // validate, and the commerce facts live in the Product JSON-LD below instead.
  return pageMetadata({
    locale,
    path: `/product/${slug}`,
    title: product.name[locale],
    description: product.description[locale],
  });
}

export default async function ProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale: raw, slug } = await params;
  const locale = toLocale(raw);
  setRequestLocale(locale);

  const product = getProduct(slug);
  if (!product) notFound();

  const loc = locale;
  const t = await getTranslations("product");
  const related = getRelated(slug, 3);
  const isBestseller = product.badges.includes("bestseller");

  return (
    <div className="bg-background">
      {/* Offer price/availability come straight from the catalog, so the
          structured data can never drift from what the page renders. No
          rating/review nodes — the on-site testimonials are placeholder copy. */}
      <JsonLd data={productJsonLd(product, locale)} />
      <div className="container py-10 sm:py-16">
        {/* Back to shop */}
        <Link
          href="/#products"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-gold"
        >
          <ArrowLeft aria-hidden className="size-4 rtl:rotate-180" />
          {t("backToShop")}
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Gallery — priority pouch on flavor-glow */}
          <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-2xl border border-border bg-card p-8 sm:p-12">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                background: `radial-gradient(55% 55% at 50% 48%, ${product.glow}, transparent 70%)`,
              }}
            />
            {isBestseller && (
              <span className="absolute start-5 top-5 z-10 rounded-full bg-gold/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground">
                {t("bestseller")}
              </span>
            )}
            <picture className="relative">
              <source
                srcSet={`/products/${product.image}/pouch.avif`}
                type="image/avif"
              />
              <source
                srcSet={`/products/${product.image}/pouch.webp`}
                type="image/webp"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/products/${product.image}/pouch.jpg`}
                alt={product.name[loc]}
                width={900}
                height={1125}
                loading="eager"
                fetchPriority="high"
                className="mx-auto h-full max-h-[70vh] w-auto object-contain drop-shadow-[0_24px_48px_rgba(0,0,0,0.6)]"
                // Fade the pouch's baked-in flat color background into the dark
                // gallery, leaving the pouch over the radial flavor-glow.
                style={{
                  WebkitMaskImage:
                    "radial-gradient(closest-side at 50% 46%, #000 55%, transparent 88%)",
                  maskImage:
                    "radial-gradient(closest-side at 50% 46%, #000 55%, transparent 88%)",
                }}
              />
            </picture>
          </div>

          {/* Info column */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h1 className="font-display text-3xl font-black leading-tight text-foreground sm:text-4xl">
                {product.name[loc]}
              </h1>
              <p className="text-lg text-muted-foreground">
                {product.tagline[loc]}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <span className="font-display text-3xl font-bold text-gold">
                {formatAgorot(product.priceAgorot, loc)}
              </span>
              <HeatMeter level={product.heatLevel} data-testid="pdp-heat" />
            </div>

            <TrustBadges badges={product.badges} />

            <p className="max-w-prose leading-relaxed text-foreground/85">
              {product.description[loc]}
            </p>

            <PurchasePanel slug={product.slug} className="mt-1" />

            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Truck aria-hidden className="size-4 shrink-0 text-gold" />
              {t("freeShippingOver", {
                threshold: formatAgorot(FREE_SHIPPING_THRESHOLD_AGOROT, loc),
              })}
            </p>

            {/* Key facts */}
            <dl className="flex flex-wrap gap-x-8 gap-y-2 border-t border-border/60 pt-5 text-sm">
              <div className="flex items-center gap-2">
                <dt className="text-muted-foreground">{t("weight")}:</dt>
                <dd className="font-medium text-foreground">
                  {product.weightGrams} {t("g")}
                </dd>
              </div>
              <div className="flex items-center gap-2">
                <dt className="text-muted-foreground">{t("cherryWood")}</dt>
              </div>
            </dl>

            {/* Nutrition */}
            <div className="rounded-xl border border-border bg-card p-5">
              <NutritionTable per100g={product.nutrition.per100g} />
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-20 sm:mt-28">
            <Reveal>
              <h2 className="mb-8 text-center font-display text-2xl font-black text-gold sm:text-3xl">
                {t("relatedHeading")}
              </h2>
            </Reveal>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
              {related.map((rel) => (
                <ProductCard key={rel.slug} product={rel} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
