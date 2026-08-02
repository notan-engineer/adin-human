import { ImageResponse } from "next/og";

import { getAllProducts, getProduct } from "@/lib/catalog";
import { formatAgorot } from "@/lib/money";
import {
  OG_COLORS,
  OG_CONTENT_TYPE,
  OG_SIZE,
  loadOgFonts,
  toVisualOrder,
  publicImageDataUri,
} from "@/lib/og";
import { toLocale } from "@/lib/seo";

// `fs` access for the vendored fonts + pouch render.
export const runtime = "nodejs";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

type Params = { locale: string; slug: string };

/** Prerender a card for every product, alongside the PDPs themselves. */
export function generateStaticParams() {
  return getAllProducts().map((p) => ({ slug: p.slug }));
}

export async function generateImageMetadata({ params }: { params: Params }) {
  const locale = toLocale(params.locale);
  const product = getProduct(params.slug);
  return [
    {
      id: "default",
      size,
      contentType,
      alt: product ? `${toVisualOrder(product.name[locale])} - The Heuman Chef` : "The Heuman Chef",
    },
  ];
}

/**
 * Per-product social card: the pouch render on the left, name / tagline / price
 * on the right, over the product's own flavor glow.
 */
export default async function ProductOpengraphImage({
  params,
}: {
  params: Params;
}) {
  const locale = toLocale(params.locale);
  const product = getProduct(params.slug);
  const isRtl = locale === "he";

  const fonts = await loadOgFonts();

  // Unknown slug still has to return an image (the route can be requested for
  // any path); fall back to a plain branded card rather than throwing.
  if (!product) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: OG_COLORS.bg,
            color: OG_COLORS.gold,
            fontFamily: "Rubik",
            fontSize: 72,
            fontWeight: 800,
          }}
        >
          The Heuman Chef
        </div>
      ),
      { ...size, fonts },
    );
  }

  const pouch = await publicImageDataUri(
    `products/${product.image}/pouch.jpg`,
    "image/jpeg",
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          // Mirror the split for Hebrew so the copy reads from the correct edge.
          flexDirection: isRtl ? "row-reverse" : "row",
          alignItems: "center",
          background: OG_COLORS.bg,
          fontFamily: "Rubik",
          position: "relative",
        }}
      >
        {/* The product's own flavor glow, same accent used on the PDP. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: `radial-gradient(45% 60% at ${isRtl ? 75 : 25}% 50%, ${product.glow}, rgba(11,11,13,0) 70%)`,
          }}
        />

        {/* Pouch */}
        <div
          style={{
            display: "flex",
            width: 470,
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* The pouch JPGs carry a baked-in flat colour background. On the
              site a CSS radial mask melts it into the page, but satori
              supports neither mask-image nor filters - so instead of a hard
              rectangle floating on black, present it as a deliberate rounded
              product tile. */}
          <div
            style={{
              display: "flex",
              padding: 10,
              borderRadius: 28,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(236,197,149,0.18)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pouch}
              width={360}
              height={450}
              alt=""
              style={{ borderRadius: 20 }}
            />
          </div>
        </div>

        {/* Copy */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            paddingRight: isRtl ? 0 : 70,
            paddingLeft: isRtl ? 70 : 0,
            direction: isRtl ? "rtl" : "ltr",
            alignItems: isRtl ? "flex-end" : "flex-start",
            textAlign: isRtl ? "right" : "left",
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 400,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: OG_COLORS.bronze,
            }}
          >
            The Heuman Chef
          </div>

          <div
            style={{
              marginTop: 16,
              fontSize: 62,
              fontWeight: 800,
              lineHeight: 1.1,
              color: OG_COLORS.gold,
            }}
          >
            {toVisualOrder(product.name[locale])}
          </div>

          <div
            style={{
              marginTop: 18,
              fontSize: 28,
              fontWeight: 400,
              lineHeight: 1.35,
              color: OG_COLORS.muted,
              maxWidth: 560,
            }}
          >
            {toVisualOrder(product.tagline[locale])}
          </div>

          <div
            style={{
              marginTop: 34,
              display: "flex",
              alignItems: "center",
              gap: 18,
              fontSize: 40,
              fontWeight: 800,
              color: OG_COLORS.text,
            }}
          >
            {/* Always the LTR "₪42" form: a currency glyph next to digits is
                unambiguous in both locales and sidesteps bidi in the image. */}
            {formatAgorot(product.priceAgorot, "en")}
            <span style={{ fontSize: 24, fontWeight: 400, color: OG_COLORS.muted }}>
              {product.weightGrams}g
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
