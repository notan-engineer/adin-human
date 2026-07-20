import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Per-visitor, stateful or non-HTML routes. These also carry
        // `robots: noindex` in their page metadata — the disallow just saves
        // crawl budget. Both locale shapes are covered: Hebrew is unprefixed
        // (`/cart`) and English is prefixed (`/en/cart`).
        disallow: [
          "/api/",
          "/cart",
          "/checkout",
          "/order/",
          "/en/cart",
          "/en/checkout",
          "/en/order/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
