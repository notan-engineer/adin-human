import { describe, it, expect } from "vitest";

import {
  BAG_LIST_PRICE_AGOROT,
  BUNDLE_TIERS,
  bestBundleTotalAgorot,
  bundleDiscountAgorot,
} from "@/lib/commerce/bundle-pricing";
import {
  COURIER_FEE_AGOROT,
  FREE_SHIPPING_THRESHOLD_AGOROT,
  courierFeeAgorot,
} from "@/lib/commerce/shipping";
import { getAllProducts } from "@/lib/catalog";

describe("bestBundleTotalAgorot", () => {
  it("prices every count at the cheapest tier combination", () => {
    // Hand-checked table. The greedy-killers are 6 (2×3-pack ₪220 beats
    // 5-pack+single ₪225) and 15 (5×3-pack ₪550 beats 3×5-pack ₪555) —
    // the 3-pack is cheaper PER BAG than the 5-pack.
    const expected: Record<number, number> = {
      1: 4_000,
      2: 8_000,
      3: 11_000,
      4: 15_000, // 3-pack + single
      5: 18_500,
      6: 22_000, // 2×3-pack, NOT 5+1 (22_500)
      8: 29_500, // 5-pack + 3-pack
      10: 37_000, // 2×5-pack (ties 3+3+3+1 at 37_000)
      15: 55_000, // 5×3-pack, NOT 3×5-pack (55_500)
    };
    for (const [count, price] of Object.entries(expected)) {
      expect(bestBundleTotalAgorot(Number(count)), `count ${count}`).toBe(price);
    }
  });

  it("never beats the exhaustive optimum for small counts", () => {
    // Brute-force cross-check: enumerate all (singles, triples, fives)
    // decompositions up to 20 bags and compare.
    for (let n = 1; n <= 20; n++) {
      let best = Number.POSITIVE_INFINITY;
      for (let fives = 0; fives * 5 <= n; fives++) {
        for (let triples = 0; fives * 5 + triples * 3 <= n; triples++) {
          const singles = n - fives * 5 - triples * 3;
          best = Math.min(best, fives * 18_500 + triples * 11_000 + singles * 4_000);
        }
      }
      expect(bestBundleTotalAgorot(n), `count ${n}`).toBe(best);
    }
  });

  it("returns 0 for non-positive or non-integer counts", () => {
    expect(bestBundleTotalAgorot(0)).toBe(0);
    expect(bestBundleTotalAgorot(-3)).toBe(0);
    expect(bestBundleTotalAgorot(2.5)).toBe(0);
    expect(bestBundleTotalAgorot(Number.NaN)).toBe(0);
  });

  it("is periodic in the cheapest-per-bag tier (the huge-count fast path's assumption)", () => {
    // Above the DP ceiling, counts are priced as best(n − k·3) + k·₪110.
    // That's exact only if adding a 3-pack is always optimal past a small
    // threshold — assert it directly so a future tier change that breaks the
    // assumption fails here, not in production pricing.
    for (let n = 6; n <= 60; n++) {
      expect(
        bestBundleTotalAgorot(n + 3) - bestBundleTotalAgorot(n),
        `best(${n + 3}) - best(${n})`,
      ).toBe(11_000);
    }
  });

  it("prices absurd client-supplied counts in bounded time and memory", () => {
    // One anonymous POST used to be able to OOM the process via the DP array.
    // The fast path must return the exact periodic value instantly.
    // 600M bags: 599_999_999 ≡ 2 (mod 3) → (n−5)/3 × 11000 + 18500... assert
    // via the periodicity identity against a small equivalent instead of a
    // hand-computed literal.
    const n = 600_000_000;
    const k = (n - 30) / 3; // peel down to 30 bags, a DP-range count
    expect(bestBundleTotalAgorot(n)).toBe(
      bestBundleTotalAgorot(30) + k * 11_000,
    );
  });
});

describe("bundleDiscountAgorot", () => {
  it("is list price minus best price, never negative", () => {
    expect(bundleDiscountAgorot(1)).toBe(0);
    expect(bundleDiscountAgorot(2)).toBe(0);
    expect(bundleDiscountAgorot(3)).toBe(1_000);
    expect(bundleDiscountAgorot(5)).toBe(1_500);
    expect(bundleDiscountAgorot(6)).toBe(2_000);
    for (let n = 0; n <= 20; n++) {
      expect(bundleDiscountAgorot(n)).toBeGreaterThanOrEqual(0);
    }
  });

  it("guards degenerate counts", () => {
    expect(bundleDiscountAgorot(0)).toBe(0);
    expect(bundleDiscountAgorot(-1)).toBe(0);
    expect(bundleDiscountAgorot(1.5)).toBe(0);
  });
});

describe("catalog coupling", () => {
  it("every product lists at BAG_LIST_PRICE_AGOROT (the bundle model's core assumption)", () => {
    // Bundle pricing works off bag COUNT alone. If a future SKU ships at a
    // different price, this model silently mis-discounts — fail loudly here
    // instead.
    for (const product of getAllProducts()) {
      expect(product.priceAgorot, product.slug).toBe(BAG_LIST_PRICE_AGOROT);
    }
  });

  it("the single-bag tier matches the list price", () => {
    expect(BUNDLE_TIERS[0]).toEqual({ bags: 1, priceAgorot: BAG_LIST_PRICE_AGOROT });
  });
});

describe("courierFeeAgorot", () => {
  it("charges the flat fee below the threshold and nothing at/above it", () => {
    expect(courierFeeAgorot(0)).toBe(COURIER_FEE_AGOROT);
    expect(courierFeeAgorot(FREE_SHIPPING_THRESHOLD_AGOROT - 100)).toBe(
      COURIER_FEE_AGOROT,
    );
    expect(courierFeeAgorot(FREE_SHIPPING_THRESHOLD_AGOROT)).toBe(0);
    expect(courierFeeAgorot(FREE_SHIPPING_THRESHOLD_AGOROT + 100)).toBe(0);
  });
});
