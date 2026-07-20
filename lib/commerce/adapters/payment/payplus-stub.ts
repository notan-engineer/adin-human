/**
 * PayPlus — STUB adapter. Thin, same-interface stub so switching the payment
 * provider is a one-line change in `registry.ts`. PayPlus offers a hosted
 * payment page + Bit; in the configuration modelled here it does NOT issue the
 * tax document itself (`issuesTaxDocument: false`), so it would be paired with a
 * dedicated InvoiceProvider. Fill in the real API when keys arrive.
 */

import type {
  CreateHostedCheckoutInput,
  NormalizedPayment,
  PaymentCallbackRequest,
  PaymentProvider,
  PaymentProviderCapabilities,
  RefundInput,
} from "../../ports/payment";

export class PayplusStubPaymentProvider implements PaymentProvider {
  readonly id = "payplus-stub";

  readonly capabilities: PaymentProviderCapabilities = {
    hostedRedirect: true,
    inlineTokenized: true,
    bit: true,
    applePay: true,
    googlePay: true,
    issuesTaxDocument: false, // needs a separate InvoiceProvider
    refunds: true,
    recurring: true,
  };

  async createHostedCheckout(
    i: CreateHostedCheckoutInput,
  ): Promise<{ providerRef: string; redirectUrl: string }> {
    const providerRef = `pp_${i.orderId}`;
    return {
      providerRef,
      redirectUrl: `${i.successUrl}?ref=${providerRef}&status=mock_paid`,
    };
  }

  async parseAndVerifyCallback(
    req: PaymentCallbackRequest,
  ): Promise<NormalizedPayment> {
    const providerRef = req.query?.ref ?? "pp_unknown";
    return {
      providerRef,
      status: "paid",
      amountAgorot: 0,
      method: "card",
      raw: { stub: true, query: req.query ?? null },
    };
  }

  async getStatus(providerRef: string): Promise<NormalizedPayment> {
    return { providerRef, status: "paid", amountAgorot: 0, raw: { stub: true } };
  }

  async refund(i: RefundInput): Promise<NormalizedPayment> {
    return {
      providerRef: i.providerRef,
      status: "refunded",
      amountAgorot: i.amountAgorot ?? 0,
      amountRefundedAgorot: i.amountAgorot ?? 0,
      raw: { stub: true },
    };
  }
}
