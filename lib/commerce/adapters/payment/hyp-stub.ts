/**
 * HYP (hyp.co.il / "Hyp Pay", the YaadPay protocol) - STUB adapter. Default.
 *
 * This stub returns deterministic mock results so the whole checkout flow runs
 * with NO real keys. It is written to MIRROR the real HYP integration so that,
 * when real credentials arrive, the shape barely changes:
 *
 *   Real flow (documented here, not executed by the stub):
 *   1. createHostedCheckout → POST to the HYP hosted page:
 *        https://pay.hyp.co.il/p/?action=APISign&What=SIGN&Masof=…&KEY=…&PassP=…
 *        &Amount=<shekels>&Coin=1(ILS)&Order=<orderId>&Info=…&UTF8=1&…
 *      HYP returns a signed query; we redirect the browser to
 *        https://pay.hyp.co.il/p/?<signed query>   (the hosted payment page).
 *   2. Customer pays on pay.hyp.co.il (card / Bit / Apple Pay / Google Pay).
 *   3. HYP redirects the browser back to successUrl (UNTRUSTED) and also calls
 *      callbackUrl. We CONFIRM server-side with a re-query:
 *        https://pay.hyp.co.il/p/?action=APISign&What=VERIFY&Masof=…&…
 *      and read CCode: 0 = paid, 700 = authorized (J5 hold), 800 = pending,
 *      anything else = failed.  (see `mapCCodeToStatus`)
 *   4. refund → action=zikoyAPI (זיכוי) against the original transaction.
 *
 * HYP also issues the tax invoice/receipt (חשבונית מס/קבלה) natively, so
 * `capabilities.issuesTaxDocument` is true and a separate InvoiceProvider is
 * optional in production.
 *
 * Auth creds (real): Masof (terminal), KEY (API key), PassP (API password).
 * Currency: Coin=1 for ILS.
 */

import type {
  CreateHostedCheckoutInput,
  NormalizedPayment,
  PaymentCallbackRequest,
  PaymentProvider,
  PaymentProviderCapabilities,
  RefundInput,
} from "../../ports/payment";
import type { PaymentStatus } from "../../types";

/**
 * Map a HYP `CCode` (returned by the VERIFY re-query) to our normalized status.
 * The stub never calls HYP, but this is the exact mapping the real adapter uses
 * - kept here so real wiring is a drop-in.
 *   0   → paid       (transaction approved & captured)
 *   700 → authorized (J5 authorization hold, not yet captured)
 *   800 → pending    (awaiting async confirmation, e.g. bank transfer/Bit)
 *   *   → failed     (declined / error / any other code)
 */
export function mapCCodeToStatus(ccode: number): PaymentStatus {
  switch (ccode) {
    case 0:
      return "paid";
    case 700:
      return "authorized";
    case 800:
      return "pending";
    default:
      return "failed";
  }
}

export class HypStubPaymentProvider implements PaymentProvider {
  readonly id = "hyp-stub";

  readonly capabilities: PaymentProviderCapabilities = {
    hostedRedirect: true,
    inlineTokenized: false,
    bit: true,
    applePay: true,
    googlePay: true,
    issuesTaxDocument: true, // HYP issues the חשבונית מס/קבלה natively.
    refunds: true,
    recurring: false,
  };

  async createHostedCheckout(
    input: CreateHostedCheckoutInput,
  ): Promise<{ providerRef: string; redirectUrl: string }> {
    // Real life: sign via What=SIGN and redirect to https://pay.hyp.co.il/p/ ; the
    // hosted page then bounces the browser to callbackUrl (which VERIFYs and
    // marks the order paid) before landing the shopper on successUrl.
    //
    // Stub: MIRROR that hop - instead of skipping straight to successUrl (which
    // would never mark the order paid), route the browser through our own
    // callbackUrl carrying a mock-paid ref and the intended successUrl as
    // `return`, so the callback runs markPaid + fulfilment exactly like real HYP.
    const providerRef = `hyp_${input.orderId}`;
    const redirectUrl =
      `${input.callbackUrl}?ref=${providerRef}` +
      `&orderId=${input.orderId}` +
      `&status=mock_paid` +
      `&return=${encodeURIComponent(input.successUrl)}`;
    return { providerRef, redirectUrl };
  }

  async parseAndVerifyCallback(
    req: PaymentCallbackRequest,
  ): Promise<NormalizedPayment> {
    // Real life: extract fields, then re-query What=VERIFY and trust CCode - the
    // browser redirect is UNTRUSTED. Stub: derive the ref from the query if
    // present and report the mock CCode 0 (paid).
    const providerRef =
      req.query?.ref ?? `hyp_${req.query?.Order ?? "unknown"}`;
    const orderId = providerRef.startsWith("hyp_")
      ? providerRef.slice("hyp_".length)
      : undefined;
    const ccode = 0; // stub: VERIFY would return this
    return {
      providerRef,
      orderId,
      status: mapCCodeToStatus(ccode),
      amountAgorot: 0, // real VERIFY echoes the Amount; unknown in the stub
      method: "card",
      raw: { stub: true, CCode: ccode, query: req.query ?? null },
    };
  }

  async getStatus(providerRef: string): Promise<NormalizedPayment> {
    // Real life: What=VERIFY re-query → CCode. Stub: always paid.
    const ccode = 0;
    return {
      providerRef,
      status: mapCCodeToStatus(ccode),
      amountAgorot: 0,
      method: "card",
      raw: { stub: true, CCode: ccode },
    };
  }

  async refund(i: RefundInput): Promise<NormalizedPayment> {
    // Real life: action=zikoyAPI against the original transaction.
    return {
      providerRef: i.providerRef,
      status: "refunded",
      amountAgorot: i.amountAgorot ?? 0,
      amountRefundedAgorot: i.amountAgorot ?? 0,
      raw: { stub: true, reason: i.reason ?? null },
    };
  }
}
