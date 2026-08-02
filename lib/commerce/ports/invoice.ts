/**
 * Invoice port — issues the Israeli tax document for an order.
 *
 * In production this can be satisfied by HYP itself: HYP (Hyp Pay / YaadPay)
 * natively issues the חשבונית מס/קבלה as part of the payment, so the payment
 * adapter's `capabilities.issuesTaxDocument` is `true` and the app can skip a
 * separate invoice provider. This port exists so that providers WITHOUT native
 * invoicing (e.g. PayPlus in some configs) can be paired with a dedicated
 * document provider (Green Invoice, iCount, EZcount, …).
 */

import type { ContactInfo, OrderItem } from "../types";

/** Input to issue a tax document for an order. */
export interface IssueInvoiceInput {
  orderId: string;
  /**
   * - `invoice_receipt` — חשבונית מס/קבלה (paid, most common for B2C).
   * - `receipt`         — קבלה only.
   * - `tax_invoice`     — חשבונית מס (unpaid, for business terms).
   */
  type: "invoice_receipt" | "receipt" | "tax_invoice";
  customer: ContactInfo;
  lines: OrderItem[];
  /**
   * Mix&match bundle discount, integer agorot (0/omitted = none). A real
   * adapter MUST render this as a negative document line ("הנחת מארזים") —
   * the stub ignores it.
   */
  discountAgorot?: number;
  /**
   * Shipping charged, integer agorot (0/omitted = none). A real adapter MUST
   * render this as a shipping line, so the document reconciles:
   * Σ(lines) − discountAgorot + shippingAgorot === amountAgorot.
   */
  shippingAgorot?: number;
  /** Gross (VAT-inclusive) total, integer agorot. */
  amountAgorot: number;
  /** VAT portion contained in `amountAgorot`, integer agorot. */
  vatAgorot: number;
}

export interface InvoiceProvider {
  readonly id: string;
  /** Issue the document; returns its number and a URL to the PDF. */
  issue(i: IssueInvoiceInput): Promise<{ number: string; url: string }>;
}
