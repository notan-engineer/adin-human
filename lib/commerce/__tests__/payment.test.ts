import { describe, it, expect } from "vitest";
import {
  HypStubPaymentProvider,
  mapCCodeToStatus,
} from "@/lib/commerce/adapters/payment/hyp-stub";
import type { CreateHostedCheckoutInput } from "@/lib/commerce/ports/payment";

function checkoutInput(): CreateHostedCheckoutInput {
  return {
    orderId: "ord_1",
    amountAgorot: 4200,
    currency: "ILS",
    customer: { name: "דנה כהן", email: "dana@example.com", phone: "0501234567" },
    items: [{ slug: "bbq", name: "Smoked BBQ", unitPriceAgorot: 4200, qty: 1 }],
    successUrl: "https://shop.test/checkout/success",
    cancelUrl: "https://shop.test/checkout/cancel",
    callbackUrl: "https://shop.test/api/hyp/callback",
    idempotencyKey: "idem_1",
  };
}

describe("HypStubPaymentProvider", () => {
  const provider = new HypStubPaymentProvider();

  it("createHostedCheckout returns a providerRef and a redirectUrl", async () => {
    const result = await provider.createHostedCheckout(checkoutInput());
    expect(result.providerRef).toBe("hyp_ord_1");
    expect(result.redirectUrl).toContain("ref=hyp_ord_1");
    expect(result.redirectUrl).toContain("status=mock_paid");
  });

  it("getStatus reports paid", async () => {
    const status = await provider.getStatus("hyp_ord_1");
    expect(status.status).toBe("paid");
    expect(status.providerRef).toBe("hyp_ord_1");
  });

  it("refund reports refunded", async () => {
    const refund = await provider.refund({
      providerRef: "hyp_ord_1",
      amountAgorot: 4200,
      idempotencyKey: "idem_refund_1",
    });
    expect(refund.status).toBe("refunded");
    expect(refund.amountRefundedAgorot).toBe(4200);
  });
});

describe("mapCCodeToStatus", () => {
  it("maps HYP CCodes to normalized statuses", () => {
    expect(mapCCodeToStatus(0)).toBe("paid");
    expect(mapCCodeToStatus(700)).toBe("authorized");
    expect(mapCCodeToStatus(800)).toBe("pending");
    expect(mapCCodeToStatus(99)).toBe("failed");
  });
});
