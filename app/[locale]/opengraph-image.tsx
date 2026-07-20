import { ImageResponse } from "next/og";

import {
  OG_COLORS,
  OG_CONTENT_TYPE,
  OG_SIZE,
  loadOgFonts,
  ogMeta,
  toVisualOrder,
  publicImageDataUri,
} from "@/lib/og";
import { routing } from "@/lib/i18n/routing";
import { toLocale } from "@/lib/seo";

// `fs` access for the vendored fonts + emblem.
export const runtime = "nodejs";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** Prerender the card for both locales instead of rendering it on demand. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** Localized alt text for the generated card. */
export function generateImageMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const meta = ogMeta(toLocale(params.locale));
  return [{ id: "default", size, contentType, alt: meta.ogAlt }];
}

/**
 * The site-wide social card: emblem, wordmark and the localized tagline on
 * brand charcoal. Inherited by every route under `/[locale]` that does not
 * define its own `opengraph-image`.
 */
export default async function OpengraphImage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = toLocale(params.locale);
  const meta = ogMeta(locale);

  const [fonts, emblem] = await Promise.all([
    loadOgFonts(),
    publicImageDataUri("brand/emblem.png"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: OG_COLORS.bg,
          fontFamily: "Rubik",
          position: "relative",
        }}
      >
        {/* Warm ember glow behind the mark — the site's smoke-radial motif. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background:
              "radial-gradient(60% 55% at 50% 38%, rgba(236,197,149,0.16), rgba(11,11,13,0) 70%)",
          }}
        />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={emblem} width={300} height={230} alt="" />

        <div
          style={{
            marginTop: 34,
            fontSize: 74,
            fontWeight: 800,
            letterSpacing: -1.5,
            color: OG_COLORS.gold,
          }}
        >
          {meta.siteName}
        </div>

        <div
          style={{
            marginTop: 18,
            fontSize: 34,
            fontWeight: 400,
            color: OG_COLORS.muted,
            // The tagline is pre-reordered by toVisualOrder(); CSS `direction`
            // is a no-op in satori, so alignment is all that is set here.
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          {toVisualOrder(meta.tagline)}
        </div>

        {/* Gold rule, echoing the site's section dividers. */}
        <div
          style={{
            marginTop: 42,
            width: 190,
            height: 3,
            background: OG_COLORS.gold,
            opacity: 0.75,
          }}
        />
      </div>
    ),
    { ...size, fonts },
  );
}
