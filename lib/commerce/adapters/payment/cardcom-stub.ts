/**
 * Cardcom - STUB adapter. Thin, same-interface stub. Cardcom issues the tax
 * document natively (`issuesTaxDocument: true`, like HYP), so it can satisfy the
 * InvoiceProvider role on its own. Switching to it is a one-line change in
 * `registry.ts`. Fill in the real API when keys arrive.
 */

import type {
  CreateHostedCheckoutInput,
  NormalizedPayment,
  PaymentCallbackRequest,
  PaymentProvider,
  PaymentProviderCapabilities,
  RefundInput,
} from "../../ports/payment";

export class CardcomStubPaymentProvider implements PaymentProvider {
  readonly id = "cardcom-stub";

  readonly capabilities: PaymentProviderCapabilities = {
    hostedRedirect: true,
    inlineTokenized: true,
    bit: true,
    applePay: true,
    googlePay: true,
    issuesTaxDocument: true, // Cardcom issues the חשבונית מס natively
    refunds: true,
    recurring: true,
  };

  async createHostedCheckout(
    i: CreateHostedCheckoutInput,
  ): Promise<{ providerRef: string; redirectUrl: string }> {
    const providerRef = `cc_${i.orderId}`;
    return {
      providerRef,
      redirectUrl: `${i.successUrl}?ref=${providerRef}&status=mock_paid`,
    };
  }

  async parseAndVerifyCallback(
    req: PaymentCallbackRequest,
  ): Promise<NormalizedPayment> {
    const providerRef = req.query?.ref ?? "cc_unknown";
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
