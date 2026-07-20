/**
 * Invoice provider — STUB adapter.
 *
 * In PRODUCTION with HYP, this is usually unnecessary: HYP issues the Israeli
 * tax document (חשבונית מס/קבלה) natively as part of the payment, so the payment
 * adapter's `capabilities.issuesTaxDocument` is true and the order picks up the
 * document URL from the payment VERIFY result. This stub exists for local dev
 * and for providers that do NOT issue documents themselves.
 *
 * Determinism: the invoice number uses a module-level counter (NOT Date.now), so
 * behaviour is reproducible across a process run.
 */

import type { InvoiceProvider, IssueInvoiceInput } from "../../ports/invoice";

/** Module-level counter — deterministic per process (resets on restart). */
let invoiceCounter = 0;

export class StubInvoiceProvider implements InvoiceProvider {
  readonly id = "invoice-stub";

  async issue(
    i: IssueInvoiceInput,
  ): Promise<{ number: string; url: string }> {
    invoiceCounter += 1;
    const number = `INV-${String(invoiceCounter).padStart(5, "0")}`;
    return { number, url: `/api/invoice/${i.orderId}.pdf` };
  }
}

/**
 * HYP native invoicing — passthrough stub. Selected when INVOICE_PROVIDER=hyp.
 * In production HYP returns the real document number/URL from the payment; here
 * we mirror the shape so the order can carry an invoice reference. Its number is
 * derived from the orderId (deterministic) rather than a counter.
 */
export class HypInvoiceProvider implements InvoiceProvider {
  readonly id = "hyp-invoice";

  async issue(
    i: IssueInvoiceInput,
  ): Promise<{ number: string; url: string }> {
    return {
      number: `HYP-${i.orderId}`,
      url: `/api/invoice/${i.orderId}.pdf`,
    };
  }
}
