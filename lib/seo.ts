/**
 * Canonical URL + hreflang plumbing.
 *
 * The he/en URL shape is decided in EXACTLY one place: `localePath()`. Hebrew is
 * the default locale and is served unprefixed (`/about`); English is prefixed
 * (`/en/about`). This mirrors `routing.localePrefix: "as-needed"` in
 * `lib/i18n/routing.ts` — if that ever changes, change `localePath()` and every
 * canonical, alternate, sitemap entry and JSON-LD `url` follows automatically.
 */
import type { Metadata } from "next";

import { site } from "@/content/site";
import { routing, type Locale } from "@/lib/i18n/routing";

export type { Locale };

/**
 * Absolute site origin, no trailing slash. Derived from the environment so
 * nothing in the app ever hardcodes a host.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

/** hreflang tag per locale. Hebrew is region-qualified; English is generic. */
const HREFLANG: Record<Locale, string> = { he: "he-IL", en: "en" };

/** OpenGraph `locale` value per locale. */
export const OG_LOCALE: Record<Locale, string> = {
  he: "he_IL",
  en: "en_US",
};

/** Coerce an unknown route param to a supported locale (falls back to `he`). */
export function toLocale(value: string): Locale {
  return routing.locales.includes(value as Locale) ? (value as Locale) : "he";
}

/**
 * Normalize a locale-less path to a leading-slash form with no trailing slash:
 * `""` / `"/"` → `"/"`, `"about"` → `"/about"`, `"/about/"` → `"/about"`.
 */
export function normalizePath(path: string): string {
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  const trimmed = withSlash.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

/**
 * The locale-prefixed pathname for a locale-less path.
 * `localePath("/about", "he")` → `"/about"`; `(…, "en")` → `"/en/about"`.
 */
export function localePath(path: string, locale: Locale): string {
  const p = normalizePath(path);
  if (locale === routing.defaultLocale) return p;
  return p === "/" ? `/${locale}` : `/${locale}${p}`;
}

/** Absolute URL for a locale-less path in a given locale. */
export function absoluteUrl(path: string, locale: Locale = "he"): string {
  return `${SITE_URL}${localePath(path, locale)}`;
}

/** Absolute URL for an asset under `/public` (locale-independent). */
export function assetUrl(path: string): string {
  return `${SITE_URL}${normalizePath(path)}`;
}

/**
 * Narrower than `Metadata["alternates"]` (which permits `null` and URL objects)
 * so callers can pass `canonical` straight into `openGraph.url`, which only
 * accepts `string | URL`.
 */
export type LocalizedAlternates = {
  canonical: string;
  languages: Record<string, string>;
};

/**
 * Compile-time guard: if a future Next version changes the `alternates` shape,
 * this assignment fails here rather than silently in every `generateMetadata`.
 */
const _alternatesShapeCheck: NonNullable<Metadata["alternates"]> =
  {} as LocalizedAlternates;
void _alternatesShapeCheck;

/**
 * `alternates` block for an indexable page: the canonical for the current
 * locale plus a complete hreflang cluster (both locales + `x-default`, which
 * points at Hebrew because `/` serves Hebrew).
 */
export function localizedAlternates(
  path: string,
  locale: Locale,
): LocalizedAlternates {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[HREFLANG[l]] = absoluteUrl(path, l);
  }
  languages["x-default"] = absoluteUrl(path, routing.defaultLocale);

  return { canonical: absoluteUrl(path, locale), languages };
}

type OpenGraphImages = NonNullable<
  NonNullable<Metadata["openGraph"]>["images"]
>;

/**
 * Build a complete, indexable page's metadata.
 *
 * Next does NOT deep-merge `openGraph` / `twitter` between a layout and its
 * pages — a page that sets either one REPLACES the layout's object wholesale.
 * Setting them ad-hoc per page therefore silently drops `og:type`,
 * `og:site_name`, `og:locale` and downgrades the Twitter card to `summary`.
 * Every indexable page goes through this helper so those can't be lost again.
 */
export function pageMetadata(opts: {
  locale: Locale;
  /** Locale-less path, e.g. "/about". */
  path: string;
  title: string;
  description: string;
  /**
   * Use the title verbatim instead of feeding it through the layout's
   * "%s — The Heuman Chef" template (for titles that already carry the brand).
   */
  absoluteTitle?: boolean;
  /**
   * Override the route's generated `opengraph-image`. Omit to let the
   * `opengraph-image.tsx` file convention supply the 1200x630 card.
   */
  images?: OpenGraphImages;
}): Metadata {
  const { locale, path, title, description, absoluteTitle, images } = opts;
  const alternates = localizedAlternates(path, locale);

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates,
    openGraph: {
      type: "website",
      siteName: site.name,
      title,
      description,
      url: alternates.canonical,
      locale: OG_LOCALE[locale],
      alternateLocale: routing.locales
        .filter((l) => l !== locale)
        .map((l) => OG_LOCALE[l]),
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(images ? { images } : {}),
    },
  };
}
