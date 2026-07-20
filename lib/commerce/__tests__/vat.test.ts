import { describe, it, expect } from "vitest";
import { splitGross } from "@/lib/vat";

/**
 * The VAT split of a gross (VAT-inclusive) amount must reconcile exactly:
 * net + vat === gross, with no off-by-one agora drift.
 */
describe("splitGross reconciliation", () => {
  const grossAmounts = [4200, 12599, 17000, 1, 99];

  for (const gross of grossAmounts) {
    it(`net + vat === gross for ${gross} agorot`, () => {
      const { net, vat, gross: echoed } = splitGross(gross);
      expect(net + vat).toBe(gross);
      expect(echoed).toBe(gross);
      expect(Number.isInteger(net)).toBe(true);
      expect(Number.isInteger(vat)).toBe(true);
    });
  }
});
