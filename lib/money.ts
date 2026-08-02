/**
 * Money utilities.
 *
 * Money is stored EVERYWHERE as INTEGER AGOROT (₪1 = 100 agorot) - never as a
 * float shekel value. This avoids binary-float rounding drift through the cart,
 * checkout, and payment provider. Batch 8 extends this module with VAT helpers;
 * keep it small until then.
 */

/** An amount of money, as an integer count of agorot (1/100 of a shekel). */
export type Money = number;

/** Convert integer agorot to a shekel number (e.g. 4200 → 42, 4250 → 42.5). */
export function agorotToShekels(agorot: number): number {
  return agorot / 100;
}

/**
 * Format integer agorot as a localized ILS currency string.
 * `formatAgorot(4200, "he")` → "‏42 ₪", `formatAgorot(4200, "en")` → "₪42".
 * No fractional part is shown for whole-shekel prices (minimumFractionDigits: 0).
 */
export function formatAgorot(agorot: number, locale: "he" | "en"): string {
  return new Intl.NumberFormat(locale === "he" ? "he-IL" : "en-IL", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: 0,
  }).format(agorotToShekels(agorot));
}
