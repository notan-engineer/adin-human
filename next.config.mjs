import path from "node:path";
import { fileURLToPath } from "node:url";
import createNextIntlPlugin from "next-intl/plugin";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Node SSR (NOT static export) — checkout + HYP callback route handlers need a server runtime.
  outputFileTracingRoot: __dirname,
  // The next/og routes read their fonts and source images from disk via a
  // computed `path.join(process.cwd(), …)`, which the tracer cannot follow
  // statically. Name the assets explicitly so they land in the server bundle.
  outputFileTracingIncludes: {
    "/[locale]/opengraph-image": [
      "./assets/fonts/**",
      "./public/brand/emblem.png",
    ],
    "/[locale]/product/[slug]/opengraph-image": [
      "./assets/fonts/**",
      "./public/products/**/pouch.jpg",
    ],
  },
  eslint: { ignoreDuringBuilds: false },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default withNextIntl(nextConfig);
