/**
 * Mix & match bundle pricing.
 *
 * Every bag lists at ₪40; any 3 bags price at ₪110 and any 5 at ₪185, across
 * flavors. The cart's bag COUNT is the only input — the model assumes a flat
 * per-bag list price, which a test in `__tests__/bundle-pricing.test.ts`
 * asserts against the live catalog so a differently-priced future SKU fails
 * loudly instead of silently over-discounting.
 *
 * ⚠️ Greedy largest-pack-first is WRONG here: per bag, the 3-pack (₪36.67)
 * is cheaper than the 5-pack (₪37). For 6 bags, 2×3-pack (₪220) beats
 * 5-pack + single (₪225); for 15 bags, 5×3-pack (₪550) beats 3×5-pack
 * (₪555). `bestBundleTotalAgorot` therefore runs a small DP over the tiers.
 *
 * All amounts are INTEGER AGOROT (see `lib/money.ts`).
 */

export const BAG_LIST_PRICE_AGOROT = 4_000;

/** Advertised tiers, in display order. */
export const BUNDLE_TIERS = [
  { bags: 1, priceAgorot: 4_000 },
  { bags: 3, priceAgorot: 11_000 },
  { bags: 5, priceAgorot: 18_500 },
] as const;

/**
 * The cheapest achievable total for `bagCount` bags using any combination of
 * tiers. Non-positive or non-integer counts price at 0.
 */
export function bestBundleTotalAgorot(bagCount: number): number {
  if (!Number.isInteger(bagCount) || bagCount <= 0) return 0;

  // minCost[n] = cheapest price for exactly n bags.
  const minCost = new Array<number>(bagCount + 1).fill(Number.POSITIVE_INFINITY);
  minCost[0] = 0;
  for (let n = 1; n <= bagCount; n++) {
    for (const tier of BUNDLE_TIERS) {
      if (tier.bags <= n) {
        minCost[n] = Math.min(minCost[n], minCost[n - tier.bags] + tier.priceAgorot);
      }
    }
  }
  return minCost[bagCount];
}

/**
 * How much the bundle tiers save versus per-bag list pricing. Always ≥ 0;
 * this is the "הנחת מארזים" row in cart/checkout/order summaries.
 */
export function bundleDiscountAgorot(bagCount: number): number {
  if (!Number.isInteger(bagCount) || bagCount <= 0) return 0;
  return bagCount * BAG_LIST_PRICE_AGOROT - bestBundleTotalAgorot(bagCount);
}
