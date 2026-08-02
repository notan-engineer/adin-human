import type { Page } from "@playwright/test";

/**
 * Shared fixtures for the E2E suite.
 *
 * Every spec runs against BOTH locales. Hebrew is served unprefixed (`/`),
 * English is prefixed (`/en`) - see `lib/i18n/routing.ts`.
 */

export type LocaleCase = {
  code: "he" | "en";
  /** URL prefix: "" for Hebrew, "/en" for English. */
  prefix: string;
  dir: "rtl" | "ltr";
};

export const LOCALES: LocaleCase[] = [
  { code: "he", prefix: "", dir: "rtl" },
  { code: "en", prefix: "/en", dir: "ltr" },
];

/** Build a locale-aware path: `path("/checkout", "en")` → "/en/checkout". */
export function path(p: string, locale: LocaleCase): string {
  if (p === "/") return locale.prefix === "" ? "/" : locale.prefix;
  return `${locale.prefix}${p}`;
}

/** Product slugs from `content/products.ts`, in catalog order. */
export const PRODUCT_SLUGS = [
  "bbq",
  "maple",
  "honey",
  "garlic",
  "zaatar",
] as const;

/** Catalog prices in integer agorot, mirrored for total assertions. */
export const PRICE_AGOROT: Record<string, number> = {
  bbq: 4000,
  maple: 4000,
  honey: 4000,
  garlic: 4000,
  zaatar: 4000,
};

/** Regular ("courier") delivery, in agorot - flat ₪40 nationwide. */
export const COURIER_AGOROT = 4000;

/**
 * Seed the persisted cart BEFORE any page script runs.
 *
 * The store is zustand `persist` under the "hc-cart" localStorage key, so the
 * shape has to match `{ state: { items }, version }` exactly - writing it via an
 * init script means the very first client render already sees a full cart, with
 * no add-to-cart round trip in tests that aren't about adding to the cart.
 */
export async function seedCart(
  page: Page,
  items: { slug: string; qty: number }[],
): Promise<void> {
  await page.addInitScript((payload) => {
    window.localStorage.setItem(
      "hc-cart",
      JSON.stringify({ state: { items: payload }, version: 0 }),
    );
  }, items);
}

/**
 * Strip Unicode bidi control marks (LRM/RLM/isolates).
 *
 * `Intl.NumberFormat("he-IL")` renders "₪35" with an embedded RLM, so a naive
 * `toContainText("₪35")` fails on Hebrew even though the user sees exactly that.
 */
export function stripBidi(s: string): string {
  return s.replace(/[‎‏⁦-⁩]/g, "").trim();
}

/**
 * Collect console errors and uncaught page errors for the life of the page.
 *
 * Returns a live array - read it after the navigation and interactions you care
 * about. Nothing is filtered: a clean page should produce an empty array.
 */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
  });
  page.on("pageerror", (err) => {
    errors.push(`pageerror: ${err.message}`);
  });
  return errors;
}

/**
 * The smallest computed opacity along an element's ancestor chain.
 *
 * This is the reduced-motion assertion that actually bites: Playwright's
 * `toBeVisible()` treats `opacity: 0` as visible, so a scroll-reveal that never
 * fires would sail past it. Walking up the tree also catches the real failure
 * mode, where the *wrapper* - not the text - is the thing stuck at 0.
 */
export async function effectiveOpacity(
  page: Page,
  selector: string,
): Promise<number> {
  return page.locator(selector).first().evaluate((el) => {
    let node: HTMLElement | null = el as HTMLElement;
    let min = 1;
    while (node && node !== document.documentElement) {
      const o = Number.parseFloat(getComputedStyle(node).opacity || "1");
      if (Number.isFinite(o)) min = Math.min(min, o);
      node = node.parentElement;
    }
    return min;
  });
}

/** True when the document scrolls horizontally (the RTL/overflow smoke test). */
export async function hasHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const el = document.documentElement;
    return el.scrollWidth > el.clientWidth + 1;
  });
}
