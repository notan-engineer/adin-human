/**
 * Shared plumbing for the `next/og` image routes.
 *
 * `next/og` (satori) cannot use `next/font`: it needs raw font BYTES, and the
 * self-hosted `next/font` output is woff2, which satori does not parse. So the
 * OG routes load TTFs vendored under `assets/fonts/`. Rubik ships Hebrew AND
 * Latin glyphs - the bundled fallback (Noto Sans, Latin-only) would render the
 * Hebrew copy as tofu boxes.
 *
 * Every route that imports this must run on the Node runtime (`fs` access), and
 * `next.config.mjs` traces `assets/fonts/**` into the deployment output.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import en from "@/messages/en.json";
import he from "@/messages/he.json";
import type { Locale } from "@/lib/seo";

/**
 * The `meta` strings the cards render, read straight from the message
 * catalogues.
 *
 * Deliberately NOT `getTranslations()`: `generateImageMetadata` is invoked
 * while resolving the metadata of every *page* under `/[locale]`, where
 * next-intl has no request scope (nothing calls `setRequestLocale` for an image
 * route), and calling it there fails the whole prerender. These are static
 * brand strings with no ICU formatting, so a direct import is both sufficient
 * and immune to that.
 */
const META = { he: he.meta, en: en.meta } as const;

export function ogMeta(locale: Locale) {
  return META[locale];
}

const RTL_CHAR = /[֐-׿יִ-ﭏ]/;
const LTR_CHAR = /[A-Za-z0-9À-ɏ]/;
/** Bidi control characters - meaningless to satori, stripped before layout. */
const BIDI_CONTROLS = /[‎‏‪-‮⁦-⁩]/g;
const MIRRORED: Record<string, string> = {
  "(": ")", ")": "(", "[": "]", "]": "[",
  "{": "}", "}": "{", "<": ">", ">": "<",
};

/**
 * Reorder a right-to-left string into VISUAL order.
 *
 * satori (which powers `next/og`) implements no bidi algorithm whatsoever: it
 * lays glyphs out strictly in the order given, left to right, and the CSS
 * `direction` property does not change that. Passing logical-order Hebrew
 * therefore renders it backwards. Browsers do this reordering for us; for the
 * OG images we have to do it ourselves.
 *
 * This is a deliberately small subset of UAX #9, sufficient for the brand
 * strings on the cards: assume an RTL base direction, keep embedded Latin and
 * numeric runs left-to-right, and mirror paired punctuation. Strings with no
 * RTL characters are returned untouched, so it is safe to call for both locales.
 *
 * NOTE: only ever apply this to text being RENDERED INTO AN IMAGE. Alt text,
 * metadata and page copy must stay in logical order - that is what screen
 * readers and search engines consume.
 */
export function toVisualOrder(input: string): string {
  const text = input.replace(BIDI_CONTROLS, "");
  if (!RTL_CHAR.test(text)) return text;

  const chars = [...text];
  const cls = chars.map((c) =>
    RTL_CHAR.test(c) ? "R" : LTR_CHAR.test(c) ? "L" : "N",
  );

  // Resolve neutrals (spaces, punctuation): they join an LTR run only when
  // flanked by LTR on both sides, otherwise they follow the RTL base.
  for (let i = 0; i < cls.length; i++) {
    if (cls[i] !== "N") continue;
    let a = i - 1;
    while (a >= 0 && cls[a] === "N") a--;
    let b = i + 1;
    while (b < cls.length && cls[b] === "N") b++;
    cls[i] = cls[a] === "L" && cls[b] === "L" ? "L" : "R";
  }

  // Reverse everything for the RTL base, then flip each LTR run back so Latin
  // words and numbers still read left-to-right.
  const out = chars.map((c) => MIRRORED[c] ?? c).reverse();
  const rcls = cls.slice().reverse();
  for (let i = 0; i < out.length; i++) {
    if (rcls[i] !== "L") continue;
    let j = i;
    while (j < out.length && rcls[j] === "L") j++;
    const run = out.slice(i, j).reverse();
    for (let k = 0; k < run.length; k++) out[i + k] = run[k];
    i = j - 1;
  }

  return out.join("");
}

/** Brand palette, mirrored from tailwind.config.ts / globals.css. */
export const OG_COLORS = {
  bg: "#0b0b0d",
  gold: "#ECC595",
  bronze: "#8a6a4a",
  text: "#f5f0ea",
  muted: "#9a9188",
} as const;

/** Standard OG/Twitter large-card dimensions. */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/** Read a repo-relative file as a Buffer at request/build time. */
async function readAsset(relPath: string): Promise<Buffer> {
  return readFile(path.join(process.cwd(), relPath));
}

export type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 800;
  style: "normal";
};

/**
 * Load the Rubik faces satori needs. Cached per process so repeated image
 * builds during `next build` re-read the disk only once.
 */
let fontsPromise: Promise<OgFont[]> | undefined;

export function loadOgFonts(): Promise<OgFont[]> {
  fontsPromise ??= (async () => {
    const [regular, extraBold] = await Promise.all([
      readAsset("assets/fonts/Rubik-Regular.ttf"),
      readAsset("assets/fonts/Rubik-ExtraBold.ttf"),
    ]);
    return [
      { name: "Rubik", data: toArrayBuffer(regular), weight: 400, style: "normal" },
      { name: "Rubik", data: toArrayBuffer(extraBold), weight: 800, style: "normal" },
    ];
  })();
  return fontsPromise;
}

function toArrayBuffer(buf: Buffer): ArrayBuffer {
  return buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength,
  ) as ArrayBuffer;
}

/**
 * Read an image from `/public` and return it as a data URI, which is the only
 * form satori reliably accepts inside `next build` (no server is listening to
 * serve an absolute URL while the image routes are being prerendered).
 */
export async function publicImageDataUri(
  relPath: string,
  mime = "image/png",
): Promise<string> {
  const buf = await readAsset(path.join("public", relPath));
  return `data:${mime};base64,${buf.toString("base64")}`;
}
