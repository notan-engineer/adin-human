import { products } from "@/content/products";

/** The two supported locales, mirrored from the i18n routing config. */
export type Locale = "he" | "en";

/** Nutrition values for a fixed reference amount (here: per 100g). */
export type Nutrition = {
  energyKcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  saltG: number;
};

/**
 * A single jerky SKU. All prices are INTEGER AGOROT (see `lib/money.ts`).
 * `image` is the folder base under `/public/products/<image>/pouch.{avif,webp,jpg}`.
 */
export type Product = {
  slug: string;
  name: Record<Locale, string>;
  tagline: Record<Locale, string>;
  description: Record<Locale, string>;
  /** Internal flavor identifier (not user-facing). */
  flavor: string;
  /** 0 = mild … 3 = hottest. */
  heatLevel: 0 | 1 | 2 | 3;
  priceAgorot: number;
  weightGrams: number;
  /** Image slug base → `/products/<image>/pouch.{avif,webp,jpg}`. */
  image: string;
  /** Freeform tags: "high-protein", "no-preservatives", "gluten-free", "bestseller". */
  badges: string[];
  /** Protein grams per pouch (marketing figure). */
  proteinGrams: number;
  nutrition: { per100g: Nutrition };
  /** Flavor-glow accent hex, used for the radial halo behind the pouch. */
  glow: string;
  inStock: boolean;
};

/** All products, in curated display order. */
export function getAllProducts(): Product[] {
  return products;
}

/** Look up one product by slug, or `undefined` if there is no such slug. */
export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

/**
 * Up to `n` other products to suggest alongside `slug`, in display order.
 * Excludes the product itself.
 */
export function getRelated(slug: string, n = 3): Product[] {
  return products.filter((p) => p.slug !== slug).slice(0, n);
}
