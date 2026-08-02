import { describe, it, expect } from "vitest";
import {
  YeshInvoicePaymentProvider,
  buildCreatePaymentBody,
  parseYeshInvoiceCallback,
  extractPaymentPageGuid,
} from "@/lib/commerce/adapters/payment/yeshinvoice-stub";
import { MemoryOrderRepository } from "@/lib/commerce/adapters/repository/memory";
import { CommerceError } from "@/lib/commerce/errors";
import type { CreateHostedCheckoutInput } from "@/lib/commerce/ports/payment";
import type { NewOrder } from "@/lib/commerce/types";

function checkoutInput(
  over: Partial<CreateHostedCheckoutInput> = {},
): CreateHostedCheckoutInput {
  return {
    orderId: "ord_abc123",
    amountAgorot: 11900,
    currency: "ILS",
    customer: {
      name: "דנה כהן",
      email: "dana@example.com",
      phone: "0501234567",
      taxId: "123456782",
    },
    items: [
      { slug: "bbq", name: "Smoked BBQ", unitPriceAgorot: 9400, qty: 1 },
      { slug: "rub", name: "Dry Rub", unitPriceAgorot: 2500, qty: 1 },
    ],
    successUrl: "https://shop.test/order/ord_abc123",
    cancelUrl: "https://shop.test/cart",
    callbackUrl: "https://shop.test/api/payment/callback",
    idempotencyKey: "ord_abc123",
    ...over,
  };
}

describe("buildCreatePaymentBody", () => {
  it("converts integer agorot to DECIMAL shekels for TotalPrice", () => {
    // ⚠️ The whole point of the adapter boundary: agorot stay integer inside,
    // YeshInvoice wants shekels with decimals.
    expect(buildCreatePaymentBody(checkoutInput()).TotalPrice).toBe(119);
    expect(buildCreatePaymentBody(checkoutInput()).TotalPrice.toFixed(2)).toBe(
      "119.00",
    );

    expect(
      buildCreatePaymentBody(checkoutInput({ amountAgorot: 4250 })).TotalPrice,
    ).toBe(42.5);
    expect(
      buildCreatePaymentBody(checkoutInput({ amountAgorot: 1 })).TotalPrice,
    ).toBe(0.01);
    expect(
      buildCreatePaymentBody(checkoutInput({ amountAgorot: 0 })).TotalPrice,
    ).toBe(0);
  });

  it("sets the tax-document fields (DocumentType 9, invoice created + emailed)", () => {
    const body = buildCreatePaymentBody(checkoutInput());
    expect(body.DocumentType).toBe(9); // חשבונית מס/קבלה
    expect(body.SendInvoiceEmail).toBe(true);
    expect(body.NoCreateInvoice).toBe(false); // false ⇒ DO create the document
  });

  it("maps the order id onto UniqueID/OrderNumber and the three URLs", () => {
    const input = checkoutInput();
    const body = buildCreatePaymentBody(input);

    expect(body.UniqueID).toBe(input.orderId);
    expect(body.OrderNumber).toBe(input.orderId);
    expect(body.SuccessUrl).toBe(input.successUrl);
    expect(body.ErrorUrl).toBe(input.cancelUrl);
    expect(body.NotifyUrl).toBe(input.callbackUrl);
  });

  it("maps the customer onto the invoice fields and defaults to Hebrew", () => {
    const body = buildCreatePaymentBody(checkoutInput());
    expect(body.InvoiceEmailAddress).toBe("dana@example.com");
    expect(body.InvoicePhone).toBe("0501234567");
    expect(body.InvoiceNumberID).toBe("123456782"); // ת.ז / ח.פ
    expect(body.InvoiceLangID).toBe(359); // Hebrew
    expect(buildCreatePaymentBody(checkoutInput(), { locale: "en" })
      .InvoiceLangID).toBe(139); // English
  });

  it("summarizes multi-line carts into InvoiceName", () => {
    expect(buildCreatePaymentBody(checkoutInput()).InvoiceName).toBe(
      "Smoked BBQ +1",
    );
    expect(
      buildCreatePaymentBody(
        checkoutInput({
          items: [
            { slug: "bbq", name: "Smoked BBQ", unitPriceAgorot: 9400, qty: 1 },
          ],
        }),
      ).InvoiceName,
    ).toBe("Smoked BBQ");
  });
});

describe("parseYeshInvoiceCallback", () => {
  it("parses a FORM-URLENCODED body (not JSON) and extracts the ids", () => {
    const raw =
      "UniqueID=ord_abc123&transaction_id=99887766&PelecardStatusCode=000&TotalPrice=119.00";
    const parsed = parseYeshInvoiceCallback(raw);

    expect(parsed.orderId).toBe("ord_abc123");
    expect(parsed.transactionId).toBe("99887766");
    // The status field name is ACQUIRER-specific — we detect it, not assume it.
    expect(parsed.statusField).toBe("PelecardStatusCode");
    expect(parsed.statusCode).toBe("000");
    expect(parsed.fields.TotalPrice).toBe("119.00");
  });

  it("url-decodes values and tolerates an empty/garbage body", () => {
    const parsed = parseYeshInvoiceCallback(
      "UniqueID=ord_1&InvoiceName=%D7%94%D7%96%D7%9E%D7%A0%D7%94",
    );
    expect(parsed.fields.InvoiceName).toBe("הזמנה");

    const empty = parseYeshInvoiceCallback("");
    expect(empty.orderId).toBeUndefined();
    expect(empty.transactionId).toBeUndefined();
    expect(empty.fields).toEqual({});
  });
});

describe("extractPaymentPageGuid", () => {
  it("pulls the GUID out of the hosted-page URL", () => {
    expect(
      extractPaymentPageGuid(
        "https://user.yeshinvoice.co.il/paymentPage/3f2a1b4c-dead-4beef-a000-112233445566",
      ),
    ).toBe("3f2a1b4c-dead-4beef-a000-112233445566");
  });
});

describe("YeshInvoicePaymentProvider (stub mode)", () => {
  const provider = new YeshInvoicePaymentProvider();

  it("declares no refunds and native tax documents", () => {
    expect(provider.id).toBe("yeshinvoice");
    expect(provider.capabilities.refunds).toBe(false);
    expect(provider.capabilities.issuesTaxDocument).toBe(true);
    expect(provider.capabilities.hostedRedirect).toBe(true);
    expect(provider.capabilities.bit).toBe(true);
    expect(provider.capabilities.inlineTokenized).toBe(false);
  });

  it("routes the redirect through our callback with YeshInvoice-shaped params", async () => {
    const input = checkoutInput();
    const { providerRef, redirectUrl } =
      await provider.createHostedCheckout(input);

    expect(redirectUrl.startsWith(input.callbackUrl)).toBe(true);
    expect(redirectUrl).toContain(`UniqueID=${input.orderId}`);
    expect(redirectUrl).toContain(`transaction_id=${providerRef}`);
    expect(redirectUrl).toContain(
      `return=${encodeURIComponent(input.successUrl)}`,
    );

    // Deterministic: their API has no idempotency key, so a retry for the same
    // order must yield the same handle.
    const again = await provider.createHostedCheckout(input);
    expect(again.providerRef).toBe(providerRef);
  });

  it("parseAndVerifyCallback reads the form-urlencoded body, never trusting an amount", async () => {
    const result = await provider.parseAndVerifyCallback({
      rawBody: "UniqueID=ord_abc123&transaction_id=99887766&status=approved",
      headers: {},
    });

    expect(result.orderId).toBe("ord_abc123");
    expect(result.providerRef).toBe("99887766");
    // 🔴 Unsigned payload ⇒ we never let it assert a total.
    expect(result.amountAgorot).toBe(0);
  });

  it("getStatus reports paid in stub mode", async () => {
    const status = await provider.getStatus("some-guid");
    expect(status.status).toBe("paid");
    expect(status.providerRef).toBe("some-guid");
  });

  it("refund rejects as unsupported — YeshInvoice has no refund API", async () => {
    await expect(
      provider.refund({
        providerRef: "some-guid",
        amountAgorot: 11900,
        idempotencyKey: "refund_1",
      }),
    ).rejects.toBeInstanceOf(CommerceError);

    await expect(
      provider.refund({ providerRef: "some-guid", idempotencyKey: "refund_1" }),
    ).rejects.toMatchObject({ code: "refund_unsupported", status: 501 });
  });
});

describe("order ids are unguessable", () => {
  function sampleNewOrder(): NewOrder {
    return {
      items: [{ slug: "bbq", name: "Smoked BBQ", unitPriceAgorot: 4200, qty: 1 }],
      contact: {
        name: "דנה כהן",
        email: "dana@example.com",
        phone: "0501234567",
      },
      deliveryMethod: "self_pickup",
      subtotalAgorot: 4200,
      discountAgorot: 0,
      vatAgorot: 641,
      shippingAgorot: 0,
      totalAgorot: 4200,
    };
  }

  it("is not sequential and never repeats", async () => {
    const repo = new MemoryOrderRepository();
    const a = await repo.create(sampleNewOrder());
    const b = await repo.create(sampleNewOrder());

    // 🔒 YeshInvoice's webhook is unsigned, so a guessable `ord_1` would let
    // anyone POST "order N is paid". Ids must be unguessable capabilities.
    expect(a.id).not.toBe(b.id);
    expect(a.id).not.toBe("ord_1");
    expect(b.id).not.toBe("ord_2");
    expect(a.id).toMatch(
      /^ord_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );

    const ids = new Set<string>();
    for (let i = 0; i < 50; i += 1) {
      ids.add((await repo.create(sampleNewOrder())).id);
    }
    expect(ids.size).toBe(50);
  });
});

describe("YeshInvoicePaymentProvider (configured/real mode) fails closed", () => {
  it("never returns a fulfillable status from an unsigned notify", async () => {
    const prev = {
      secret: process.env.YESHINVOICE_SECRET,
      userkey: process.env.YESHINVOICE_USERKEY,
    };
    process.env.YESHINVOICE_SECRET = "test-secret";
    process.env.YESHINVOICE_USERKEY = "test-userkey";
    try {
      const provider = new YeshInvoicePaymentProvider();
      const result = await provider.parseAndVerifyCallback({
        rawBody:
          "UniqueID=ord_abc123&transaction_id=tx_1&PelecardStatusCode=000",
        headers: { "content-type": "application/x-www-form-urlencoded" },
      });

      // YeshInvoice signs nothing, so this body is forgeable by anyone who can
      // reach NotifyUrl. The callback route fulfills only on "paid"/"authorized"
      // — an unsigned notify must never reach either, or we reproduce the
      // unverified payment_complete() bug in YeshInvoice's own WooCommerce plugin.
      expect(["paid", "authorized"]).not.toContain(result.status);
      expect(result.status).toBe("pending");
      // The notify carries no trustworthy amount; we must not invent one.
      expect(result.amountAgorot).toBe(0);
    } finally {
      if (prev.secret === undefined) delete process.env.YESHINVOICE_SECRET;
      else process.env.YESHINVOICE_SECRET = prev.secret;
      if (prev.userkey === undefined) delete process.env.YESHINVOICE_USERKEY;
      else process.env.YESHINVOICE_USERKEY = prev.userkey;
    }
  });
});
