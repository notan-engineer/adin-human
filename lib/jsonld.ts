/**
 * JSON-LD structured data builders.
 *
 * GROUND RULE: every value emitted here must be independently true of the real
 * business. We deliberately do NOT emit `aggregateRating` or `review` — the
 * testimonials rendered on the site are placeholder copy, so publishing them as
 * review schema would be fabricated structured data (and a Google structured-
 * data policy violation). Same for kosher/certification claims: unverified, so
 * unpublished.
 */
import { site } from "@/content/site";
import type { Product } from "@/lib/catalog";
import { agorotToShekels } from "@/lib/money";
import { SITE_URL, absoluteUrl, assetUrl, type Locale } from "@/lib/seo";

/** Stable @id anchors so the graph nodes can reference one another. */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

type JsonLd = Record<string, unknown>;

/** The brand as an Organization. Contact details come from `content/site.ts`. */
export function organizationJsonLd(locale: Locale): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: site.name,
    url: absoluteUrl("/", locale),
    logo: {
      "@type": "ImageObject",
      url: assetUrl("/icon-512.png"),
      width: 512,
      height: 512,
    },
    image: assetUrl("/products/group.png"),
    founder: {
      "@type": "Person",
      name: site.founder,
    },
    sameAs: Object.values(site.social),
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: site.email,
        telephone: site.phoneHref,
        // The storefront ships within Israel and the site is bilingual.
        areaServed: "IL",
        availableLanguage: ["he", "en"],
      },
    ],
  };
}

/** The site itself, linked to the publishing Organization. */
export function websiteJsonLd(locale: Locale, name: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name,
    url: absoluteUrl("/", locale),
    inLanguage: locale === "he" ? "he-IL" : "en",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/**
 * A single SKU. Price is emitted in SHEKELS as a decimal string (schema.org
 * expects a major-unit number), converted from the integer agorot we store.
 */
export function productJsonLd(product: Product, locale: Locale): JsonLd {
  const url = absoluteUrl(`/product/${product.slug}`, locale);
  const per100g = product.nutrition.per100g;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name[locale],
    description: product.description[locale],
    image: [assetUrl(`/products/${product.image}/pouch.jpg`)],
    sku: product.slug,
    brand: {
      "@type": "Brand",
      name: site.name,
    },
    weight: {
      "@type": "QuantitativeValue",
      value: product.weightGrams,
      unitCode: "GRM",
    },
    nutrition: {
      "@type": "NutritionInformation",
      // Every figure below is per 100g, which is exactly what the catalog
      // stores and what the on-page nutrition table renders.
      //
      // `saltG` is deliberately NOT mapped to schema.org's `sodiumContent`:
      // salt is ~2.5x sodium by mass, so that would publish a materially wrong
      // number, and the converted figure appears nowhere on the page. There is
      // no `saltContent` property, so the value is simply omitted.
      servingSize: "100 g",
      calories: `${per100g.energyKcal} kcal`,
      proteinContent: `${per100g.proteinG} g`,
      fatContent: `${per100g.fatG} g`,
      carbohydrateContent: `${per100g.carbsG} g`,
    },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "ILS",
      price: agorotToShekels(product.priceAgorot).toFixed(2),
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": ORGANIZATION_ID },
    },
  };
}

/** A breadcrumb trail. `items` are ordered root → current page. */
export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
  locale: Locale,
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path, locale),
    })),
  };
}
