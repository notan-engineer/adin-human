/**
 * Re-exports the site-wide card for /contact.
 *
 * Next only auto-attaches an `opengraph-image` convention to the segment that
 * declares it. A NESTED page that sets its own `openGraph` object (as every
 * page routed through `pageMetadata()` does) therefore ends up with no
 * `og:image` at all — the parent's card is not merged in. `/cart` and
 * `/checkout` keep the inherited card only because they never set `openGraph`.
 *
 * `/about` sidesteps this by supplying its own image; `/contact` wants the
 * branded emblem card, so it re-declares the same route here.
 */
export {
  default,
  size,
  contentType,
  runtime,
  generateStaticParams,
  generateImageMetadata,
} from "../opengraph-image";
