import { describe, it, expect } from "vitest";
import { cityToZone } from "@/lib/commerce/adapters/delivery/zones";
import { StubDeliveryProvider } from "@/lib/commerce/adapters/delivery/stub";
import {
  COURIER_FEE_AGOROT,
  FREE_SHIPPING_THRESHOLD_AGOROT,
} from "@/lib/commerce/shipping";
import type { Address, OrderItem } from "@/lib/commerce/types";

const centerAddress: Address = {
  recipientName: "דנה כהן",
  phone: "0501234567",
  city: "תל אביב",
  street: "דיזנגוף",
  houseNumber: "100",
};

describe("cityToZone", () => {
  it("maps תל אביב to the center zone", () => {
    expect(cityToZone("תל אביב")).toBe("center");
  });

  it("maps an English city name (case/hyphen-insensitive) to its zone", () => {
    expect(cityToZone("Tel Aviv-Yafo")).toBe("center");
    expect(cityToZone("Jerusalem")).toBe("jerusalem");
  });

  it("falls back to 'other' for an unknown city", () => {
    expect(cityToZone("Nowheresville")).toBe("other");
  });
});

describe("StubDeliveryProvider.quoteRates", () => {
  const provider = new StubDeliveryProvider();

  it("offers exactly flat-fee courier + free self-pickup for a center address", async () => {
    const items: OrderItem[] = [
      { slug: "bbq", name: "Smoked BBQ", unitPriceAgorot: 4000, qty: 1 },
    ];
    const rates = await provider.quoteRates({ destination: centerAddress, items });
    const methods = rates.map((r) => r.method).sort();

    expect(methods).toEqual(["courier", "self_pickup"]);
    const courier = rates.find((r) => r.method === "courier");
    expect(courier?.priceAgorot).toBe(COURIER_FEE_AGOROT);
    expect(rates.find((r) => r.method === "self_pickup")?.priceAgorot).toBe(0);
    // Bilingual label is provided so the UI never maps method → text itself.
    expect(courier?.label.he).toBeTruthy();
    expect(courier?.label.en).toBeTruthy();
  });

  it("zeroes the courier price when the subtotal reaches the free-shipping threshold", async () => {
    // Below threshold → charged.
    const belowItems: OrderItem[] = [
      { slug: "bbq", name: "Smoked BBQ", unitPriceAgorot: 4000, qty: 1 },
    ];
    const belowRates = await provider.quoteRates({
      destination: centerAddress,
      items: belowItems,
    });
    expect(belowRates.find((r) => r.method === "courier")?.priceAgorot).toBe(
      COURIER_FEE_AGOROT,
    );

    // At/over the threshold (₪400) → free courier, self-pickup untouched.
    const overItems: OrderItem[] = [
      {
        slug: "bbq",
        name: "Smoked BBQ",
        unitPriceAgorot: FREE_SHIPPING_THRESHOLD_AGOROT,
        qty: 1,
      },
    ];
    const overRates = await provider.quoteRates({
      destination: centerAddress,
      items: overItems,
    });
    expect(overRates.find((r) => r.method === "courier")?.priceAgorot).toBe(0);
  });

  it("judges the threshold on the DISCOUNTED subtotal (bundle pricing)", async () => {
    // 11 × ₪40 bags list at ₪440, but bundle-price to ₪405 (5+3+3) — still
    // over ₪400, so courier is free.
    const elevenBags: OrderItem[] = [
      { slug: "bbq", name: "Smoked BBQ", unitPriceAgorot: 4000, qty: 11 },
    ];
    const freeRates = await provider.quoteRates({
      destination: centerAddress,
      items: elevenBags,
    });
    expect(freeRates.find((r) => r.method === "courier")?.priceAgorot).toBe(0);

    // 10 bags list at ₪400 — naively at the threshold — but bundle-price to
    // ₪370 (5+5), UNDER ₪400, so courier is still charged. This is the case
    // that catches a list-subtotal implementation.
    const tenBags: OrderItem[] = [
      { slug: "bbq", name: "Smoked BBQ", unitPriceAgorot: 4000, qty: 10 },
    ];
    const chargedRates = await provider.quoteRates({
      destination: centerAddress,
      items: tenBags,
    });
    expect(chargedRates.find((r) => r.method === "courier")?.priceAgorot).toBe(
      COURIER_FEE_AGOROT,
    );
  });
});
