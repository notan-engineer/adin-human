import { describe, it, expect } from "vitest";
import { cityToZone } from "@/lib/commerce/adapters/delivery/zones";
import {
  StubDeliveryProvider,
  FREE_COURIER_THRESHOLD_AGOROT,
} from "@/lib/commerce/adapters/delivery/stub";
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

  it("returns courier and pickup options for a center address", async () => {
    const items: OrderItem[] = [
      { slug: "bbq", name: "Smoked BBQ", unitPriceAgorot: 4200, qty: 1 },
    ];
    const rates = await provider.quoteRates({ destination: centerAddress, items });
    const methods = rates.map((r) => r.method);

    expect(methods).toContain("courier");
    expect(methods).toContain("pickup_point");
    // Bilingual label is provided so the UI never maps method → text itself.
    const courier = rates.find((r) => r.method === "courier");
    expect(courier?.label.he).toBeTruthy();
    expect(courier?.label.en).toBeTruthy();
  });

  it("zeroes the courier price when subtotal reaches the free-shipping threshold", async () => {
    // Below threshold → charged.
    const belowItems: OrderItem[] = [
      { slug: "bbq", name: "Smoked BBQ", unitPriceAgorot: 4200, qty: 1 },
    ];
    const belowRates = await provider.quoteRates({
      destination: centerAddress,
      items: belowItems,
    });
    expect(belowRates.find((r) => r.method === "courier")?.priceAgorot).toBeGreaterThan(0);

    // At/over threshold (₪199) → free courier.
    const overItems: OrderItem[] = [
      { slug: "bbq", name: "Smoked BBQ", unitPriceAgorot: FREE_COURIER_THRESHOLD_AGOROT, qty: 1 },
    ];
    const overRates = await provider.quoteRates({
      destination: centerAddress,
      items: overItems,
    });
    expect(overRates.find((r) => r.method === "courier")?.priceAgorot).toBe(0);
  });
});
