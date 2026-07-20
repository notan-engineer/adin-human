import { describe, it, expect } from "vitest";

import {
  computeTotals,
  fulfillPaidOrder,
  CommerceError,
} from "@/lib/commerce/order-service";
import { getOrderRepository } from "@/lib/commerce/registry";
import { getProduct } from "@/lib/catalog";
import { splitGross } from "@/lib/vat";
import type { Address } from "@/lib/commerce/types";

const bbqPrice = getProduct("bbq")?.priceAgorot ?? 0;
const maplePrice = getProduct("maple")?.priceAgorot ?? 0;

const centerAddress: Address = {
  recipientName: "דנה כהן",
  phone: "0501234567",
  city: "תל אביב",
  street: "דיזנגוף",
  houseNumber: "100",
};

describe("computeTotals", () => {
  it("subtotal = Σ unitPrice*qty, self_pickup ships free, total & vat reconcile", async () => {
    const r = await computeTotals(
      [
        { slug: "bbq", qty: 2 },
        { slug: "maple", qty: 1 },
      ],
      "self_pickup",
    );

    const expectedSubtotal = bbqPrice * 2 + maplePrice * 1;
    expect(r.subtotalAgorot).toBe(expectedSubtotal);
    // self_pickup → no shipping charge, no rate.
    expect(r.shippingAgorot).toBe(0);
    expect(r.rate).toBeUndefined();
    // total = subtotal + shipping; vat is the portion contained in the total.
    expect(r.totalAgorot).toBe(r.subtotalAgorot + r.shippingAgorot);
    expect(r.vatAgorot).toBe(splitGross(r.totalAgorot).vat);
    // Prices come from the catalog, never the client.
    expect(r.orderItems[0].unitPriceAgorot).toBe(bbqPrice);
  });

  it("adds the chosen delivery rate to shipping and keeps total = subtotal + shipping", async () => {
    const r = await computeTotals(
      [{ slug: "bbq", qty: 1 }],
      "courier",
      centerAddress,
    );

    expect(r.rate?.method).toBe("courier");
    expect(r.shippingAgorot).toBe(r.rate?.priceAgorot);
    expect(r.shippingAgorot).toBeGreaterThan(0);
    expect(r.totalAgorot).toBe(r.subtotalAgorot + r.shippingAgorot);
    expect(r.vatAgorot).toBe(splitGross(r.totalAgorot).vat);
  });

  it("throws a typed CommerceError for an unknown slug", async () => {
    await expect(
      computeTotals([{ slug: "does-not-exist", qty: 1 }], "self_pickup"),
    ).rejects.toBeInstanceOf(CommerceError);
    await expect(
      computeTotals([{ slug: "does-not-exist", qty: 1 }], "self_pickup"),
    ).rejects.toMatchObject({ code: "unknown_slug", status: 422 });
  });
});

describe("fulfillPaidOrder", () => {
  it("is idempotent: a second call does not change the invoiceNumber", async () => {
    const repo = getOrderRepository();
    const totals = await computeTotals([{ slug: "bbq", qty: 1 }], "self_pickup");

    const created = await repo.create({
      items: totals.orderItems,
      contact: {
        name: "דנה כהן",
        email: "dana@example.com",
        phone: "0501234567",
      },
      deliveryMethod: "self_pickup",
      subtotalAgorot: totals.subtotalAgorot,
      vatAgorot: totals.vatAgorot,
      shippingAgorot: totals.shippingAgorot,
      totalAgorot: totals.totalAgorot,
    });
    const paid = await repo.markPaid(created.id, `hyp_${created.id}`);

    const once = await fulfillPaidOrder(paid);
    expect(once.invoiceNumber).toBeTruthy();
    expect(once.status).toBe("fulfilled");
    const firstInvoice = once.invoiceNumber;

    // Second call (with the now-fulfilled copy) must be a no-op on the invoice.
    const twice = await fulfillPaidOrder(once);
    expect(twice.invoiceNumber).toBe(firstInvoice);

    // Re-reading the store confirms the invoice was issued exactly once.
    const reread = await repo.get(created.id);
    expect(reread?.invoiceNumber).toBe(firstInvoice);
  });
});
