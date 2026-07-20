import { describe, it, expect } from "vitest";
import { MemoryOrderRepository } from "@/lib/commerce/adapters/repository/memory";
import type { NewOrder } from "@/lib/commerce/types";

function sampleNewOrder(): NewOrder {
  return {
    items: [
      { slug: "bbq", name: "Smoked BBQ", unitPriceAgorot: 4200, qty: 2 },
    ],
    contact: { name: "דנה כהן", email: "dana@example.com", phone: "0501234567" },
    address: {
      recipientName: "דנה כהן",
      phone: "0501234567",
      city: "תל אביב",
      street: "דיזנגוף",
      houseNumber: "100",
    },
    deliveryMethod: "courier",
    subtotalAgorot: 8400,
    vatAgorot: 1281,
    shippingAgorot: 2500,
    totalAgorot: 10900,
  };
}

describe("MemoryOrderRepository", () => {
  it("create then get returns the persisted order with a pending status", async () => {
    const repo = new MemoryOrderRepository();
    const created = await repo.create(sampleNewOrder());

    expect(created.id).toMatch(/^ord_/);
    expect(created.status).toBe("pending");
    expect(created.createdAtISO).toBeTruthy();

    const fetched = await repo.get(created.id);
    expect(fetched).toEqual(created);
    expect(await repo.get("ord_missing")).toBeNull();
  });

  it("markPaid is idempotent: second call returns the same order unchanged", async () => {
    const repo = new MemoryOrderRepository();
    const created = await repo.create(sampleNewOrder());

    const paidOnce = await repo.markPaid(created.id, "hyp_ord_1");
    const paidTwice = await repo.markPaid(created.id, "hyp_ord_1");

    expect(paidOnce.status).toBe("paid");
    expect(paidOnce.providerRef).toBe("hyp_ord_1");
    expect(paidTwice.status).toBe("paid");
    // Idempotent: identical order object contents, no re-mutation.
    expect(paidTwice).toEqual(paidOnce);
  });

  it("findByProviderRef resolves after markPaid", async () => {
    const repo = new MemoryOrderRepository();
    const created = await repo.create(sampleNewOrder());
    await repo.markPaid(created.id, "hyp_ref_xyz");

    const found = await repo.findByProviderRef("hyp_ref_xyz");
    expect(found?.id).toBe(created.id);
    expect(await repo.findByProviderRef("no_such_ref")).toBeNull();
  });
});
