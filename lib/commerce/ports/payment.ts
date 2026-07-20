/**
 * Payment port — the provider-agnostic contract every payment adapter (HYP,
 * PayPlus, Cardcom, …) implements. Swapping providers is a one-line change in
 * `registry.ts`; nothing in the app depends on a provider's SDK directly.
 *
 * Trust model: the browser redirect back from a hosted page is UNTRUSTED. The
 * source of truth is `parseAndVerifyCallback` (a server-to-server VERIFY / webhook
 * re-query), never the query string the customer's browser carried.
 */

import type {
  ContactInfo,
  OrderItem,
  PaymentMethod,
  PaymentStatus,
} from "../types";

/**
 * A payment normalized into our own vocabulary, regardless of provider. Adapters
 * map their native status codes into `status` (e.g. HYP `CCode` → PaymentStatus).
 */
export interface NormalizedPayment {
  providerRef: string;
  orderId?: string;
  status: PaymentStatus;
  amountAgorot: number;
  amountRefundedAgorot?: number;
  method?: PaymentMethod;
  /** URL of a tax document the provider issued natively (HYP issues these). */
  documentUrl?: string;
  /** The raw provider payload, kept for auditing/debugging. */
  raw: unknown;
}

/** What a provider can do — lets the UI/registry reason about capabilities. */
export interface PaymentProviderCapabilities {
  hostedRedirect: boolean;
  inlineTokenized: boolean;
  bit: boolean;
  applePay: boolean;
  googlePay: boolean;
  /** Provider issues the tax invoice/receipt itself (HYP does). */
  issuesTaxDocument: boolean;
  refunds: boolean;
  recurring: boolean;
}

/** Input to open a hosted (redirect) checkout session. */
export interface CreateHostedCheckoutInput {
  orderId: string;
  amountAgorot: number;
  currency: "ILS";
  customer: ContactInfo;
  items: OrderItem[];
  successUrl: string;
  cancelUrl: string;
  callbackUrl: string;
  /** Caller-supplied key so retries do not double-charge. */
  idempotencyKey: string;
  /** Restrict the offered instruments; omit to offer all supported. */
  methods?: PaymentMethod[];
}

/** A raw inbound request (webhook / return) to be parsed and verified. */
export interface PaymentCallbackRequest {
  rawBody: string;
  headers: Record<string, string>;
  query?: Record<string, string>;
}

/** Input to issue a full or partial refund. */
export interface RefundInput {
  providerRef: string;
  /** Omit for a full refund; otherwise the partial amount in agorot. */
  amountAgorot?: number;
  idempotencyKey: string;
  reason?: string;
}

export interface PaymentProvider {
  readonly id: string;
  readonly capabilities: PaymentProviderCapabilities;

  /** Open a hosted checkout; returns the URL to redirect the customer to. */
  createHostedCheckout(
    i: CreateHostedCheckoutInput,
  ): Promise<{ providerRef: string; redirectUrl: string }>;

  /** Verify an inbound callback server-side and normalize it. Source of truth. */
  parseAndVerifyCallback(
    req: PaymentCallbackRequest,
  ): Promise<NormalizedPayment>;

  /** Re-query the provider for the current status of a transaction. */
  getStatus(providerRef: string): Promise<NormalizedPayment>;

  /** Refund (full or partial). */
  refund(i: RefundInput): Promise<NormalizedPayment>;
}
