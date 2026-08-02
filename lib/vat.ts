/**
 * Israel VAT (מע״מ) helpers.
 *
 * Catalog prices are treated as VAT-INCLUSIVE (the Israeli B2C convention: the
 * shelf price a consumer pays already contains VAT). These helpers therefore
 * decompose a gross, VAT-inclusive amount into its net and VAT parts - they do
 * NOT add VAT on top.
 *
 * All amounts are INTEGER AGOROT (see `lib/money.ts`). VAT is computed with
 * `Math.round`, and `net` is derived as `gross - vat` so that `net + vat`
 * always reconciles exactly to `gross` (no off-by-one agora drift).
 *
 * ⚠️ VERIFY BEFORE GO-LIVE: the statutory Israeli VAT rate changes by law
 * (it was raised to 18% on 2025-01-01). Confirm the current rate - and whether
 * prices should be shown VAT-inclusive - with the brand/accountant before
 * launch.
 */

/** Statutory Israeli VAT rate, as a fraction (18%). */
export const VAT_RATE = 0.18;

/**
 * The VAT portion contained in a VAT-inclusive (gross) amount, in integer
 * agorot. Derived as `gross − gross / (1 + rate)`, rounded to the nearest agora.
 */
export function vatFromGross(grossAgorot: number): number {
  return Math.round(grossAgorot - grossAgorot / (1 + VAT_RATE));
}

/**
 * The net (pre-VAT) portion of a VAT-inclusive amount, in integer agorot.
 * Defined as `gross − vat` so `net + vat === gross` exactly.
 */
export function netFromGross(grossAgorot: number): number {
  return grossAgorot - vatFromGross(grossAgorot);
}

/**
 * Split a VAT-inclusive amount into `{ net, vat, gross }` (integer agorot).
 * Guaranteed to reconcile: `net + vat === gross`.
 */
export function splitGross(grossAgorot: number): {
  net: number;
  vat: number;
  gross: number;
} {
  const vat = vatFromGross(grossAgorot);
  return { net: grossAgorot - vat, vat, gross: grossAgorot };
}
