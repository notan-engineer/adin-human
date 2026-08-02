import type { MetadataRoute } from "next";

import { getAllProducts } from "@/lib/catalog";
import { routing } from "@/lib/i18n/routing";
import { absoluteUrl } from "@/lib/seo";

/**
 * Indexable routes only. `/cart`, `/checkout` and `/order/[id]` are per-visitor
 * and marked `noindex`, so they are deliberately absent — listing a noindex URL
 * in a sitemap is a contradictory signal.
 */
type Entry = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

const STATIC_ROUTES: Entry[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.5 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  // The catalog is compiled into the bundle, so "last modified" is really
  // "last deployed". A stable per-build timestamp is honest and avoids
  // churning the file on every request.
  const lastModified = new Date();

  const productRoutes: Entry[] = getAllProducts().map((product) => ({
    path: `/product/${product.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const all = [...STATIC_ROUTES, ...productRoutes];

  // One <url> entry per locale, each carrying the full hreflang cluster — this
  // is what Google expects for a bilingual site.
  return all.flatMap((entry) =>
    routing.locales.map((locale) => ({
      url: absoluteUrl(entry.path, locale),
      lastModified,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
      alternates: {
        languages: {
          "he-IL": absoluteUrl(entry.path, "he"),
          en: absoluteUrl(entry.path, "en"),
          "x-default": absoluteUrl(entry.path, routing.defaultLocale),
        },
      },
    })),
  );
}
