/**
 * Typed commerce errors.
 *
 * Lives in its own module (rather than inside `order-service.ts`) so that ADAPTERS
 * can throw them without an import cycle: `order-service` → `registry` → adapter
 * → `order-service` would otherwise close a loop. `order-service` re-exports both
 * symbols, so existing `from "@/lib/commerce/order-service"` imports keep working.
 */

/** Error codes surfaced to the HTTP layer, each with a matching status. */
export type CommerceErrorCode =
  | "empty_cart"
  | "unknown_slug"
  | "delivery_unavailable"
  /** The payment provider's API returned a failure envelope. */
  | "payment_provider_error"
  /** The provider has no status-by-reference endpoint (YeshInvoice). */
  | "payment_status_unsupported"
  /** The provider exposes no refund API (YeshInvoice). */
  | "refund_unsupported";

/**
 * A typed, catchable error carrying the HTTP `status` a route should map it to.
 * Routes do `if (err instanceof CommerceError) return NextResponse.json({ error:
 * err.code }, { status: err.status })`; anything else bubbles to a 500.
 */
export class CommerceError extends Error {
  readonly code: CommerceErrorCode;
  readonly status: number;

  constructor(code: CommerceErrorCode, message: string, status: number) {
    super(message);
    this.name = "CommerceError";
    this.code = code;
    this.status = status;
  }
}
