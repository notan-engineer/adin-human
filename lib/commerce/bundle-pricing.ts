/**
 * Mix & match bundle pricing.
 *
 * Every bag lists at ₪40; any 3 bags price at ₪110 and any 5 at ₪185, across
 * flavors. The cart's bag COUNT is the only input - the model assumes a flat
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
 * DP ceiling. The array the DP allocates is sized by bagCount, which
 * ultimately comes from CLIENT-supplied quantities - unbounded, that's a
 * one-request OOM on the order/quote APIs (a fatal V8 abort no try/catch can
 * intercept). The API schemas cap qty/lines as the first line of defense;
 * this bound makes the function itself safe for ANY input. Counts above it
 * are priced exactly via periodic extension (see below), in O(MAX) time and
 * memory regardless of input size.
 */
const MAX_DP_BAGS = 10_000;

/** The tier with the best per-bag rate - the tail of any large optimum. */
const CHEAPEST_PER_BAG = BUNDLE_TIERS.reduce((best, t) =>
  t.priceAgorot * best.bags < best.priceAgorot * t.bags ? t : best,
);

/**
 * The cheapest achievable total for `bagCount` bags using any combination of
 * tiers. Non-positive or non-integer counts price at 0.
 *
 * Above MAX_DP_BAGS the optimum is periodic: past a small threshold, adding
 * one more copy of the cheapest-per-bag tier (the 3-pack here) is always
 * optimal, so best(n) = best(n − k·3) + k·11000. The unit tests assert this
 * periodicity against the DP, so a future tier change that breaks the
 * assumption fails loudly.
 */
export function bestBundleTotalAgorot(bagCount: number): number {
  if (!Number.isInteger(bagCount) || bagCount <= 0) return 0;

  let tailCopies = 0;
  if (bagCount > MAX_DP_BAGS) {
    tailCopies = Math.ceil((bagCount - MAX_DP_BAGS) / CHEAPEST_PER_BAG.bags);
    bagCount -= tailCopies * CHEAPEST_PER_BAG.bags;
  }

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
  return minCost[bagCount] + tailCopies * CHEAPEST_PER_BAG.priceAgorot;
}

/**
 * How much the bundle tiers save versus per-bag list pricing. Always ≥ 0;
 * this is the "הנחת מארזים" row in cart/checkout/order summaries.
 */
export function bundleDiscountAgorot(bagCount: number): number {
  if (!Number.isInteger(bagCount) || bagCount <= 0) return 0;
  return bagCount * BAG_LIST_PRICE_AGOROT - bestBundleTotalAgorot(bagCount);
}
