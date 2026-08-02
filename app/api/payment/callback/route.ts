/**
 * /api/payment/callback - the two ways a hosted payment reports back.
 *
 * GET  = the customer's browser returning from the hosted page. The query string
 *        is UNTRUSTED, so we re-query the provider (`getStatus`) as the source of
 *        truth, mark paid + fulfil on success, then REDIRECT the browser to the
 *        order page (or back to the cart with `?payment=failed`).
 *
 * POST = the server-to-server webhook / IPN. We read the RAW body first (as TEXT,
 *        never `request.json()` - YeshInvoice's notify is
 *        `application/x-www-form-urlencoded`, not JSON), hand it to
 *        `parseAndVerifyCallback`, mark paid + fulfil, and ALWAYS answer 200
 *        `{received:true}` so the gateway stops retrying - even for an
 *        already-processed event. We never throw back at the gateway.
 *
 * ⚠️ NEVER FULFIL ON THE SuccessUrl REDIRECT ALONE.
 * The GET here is the shopper's browser coming back from the hosted page. It is
 * user-controllable (anyone can type that URL with any params) and it RACES the
 * server-to-server notify - the browser frequently arrives first. Both branches
 * below therefore re-confirm with the provider before touching order state, and
 * neither derives "paid" from the query string. YeshInvoice compounds this: its
 * notify carries NO signature either, so the webhook is only a wake-up hint and
 * `parseAndVerifyCallback` deliberately never reports a trusted amount.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  getOrderRepository,
  getPaymentProvider,
} from "@/lib/commerce/registry";
import { fulfillPaidOrder, getSiteUrl } from "@/lib/commerce/order-service";
import type { Order } from "@/lib/commerce/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Build the customer-facing URL for a locale (Hebrew is unprefixed). */
function localePath(path: string, locale: "he" | "en"): string {
  const prefix = locale === "en" ? "/en" : "";
  return `${getSiteUrl()}${prefix}${path}`;
}

/**
 * Browser return from the hosted page. The query string is not trusted; the
 * provider re-query decides paid/not-paid.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  // Accept both vocabularies: our generic `ref`/`orderId` and YeshInvoice's
  // `transaction_id`/`UniqueID` (the hosted page bounces those back verbatim).
  const ref = params.get("ref") ?? params.get("transaction_id") ?? undefined;
  const orderIdParam =
    params.get("orderId") ?? params.get("UniqueID") ?? undefined;
  // Optional landing URL the hosted page wants us to return the shopper to after
  // a successful VERIFY (mirrors real HYP's successUrl hop). UNTRUSTED - guarded
  // below so it can only ever point back at our own site (no open redirect).
  const returnParam = params.get("return") ?? undefined;
  // Order has no persisted locale; honor an explicit hint, else default Hebrew.
  const locale: "he" | "en" = params.get("locale") === "en" ? "en" : "he";

  try {
    const repo = getOrderRepository();
    let order: Order | null = null;
    if (ref) order = await repo.findByProviderRef(ref);
    if (!order && orderIdParam) order = await repo.get(orderIdParam);

    if (!order) {
      // Can't resolve the order - send the shopper back to the cart.
      return NextResponse.redirect(localePath("/cart?payment=failed", locale));
    }

    const providerRef = order.providerRef ?? ref;
    if (providerRef) {
      // Source of truth: verify with the provider, not the browser's query.
      const status = await getPaymentProvider().getStatus(providerRef);
      if (status.status === "paid" || status.status === "authorized") {
        const paid = await repo.markPaid(order.id, providerRef);
        await fulfillPaidOrder(paid);

        // Honor the requested `return` URL ONLY if it points back at this site
        // (open-redirect guard); otherwise fall back to the order page.
        const fallback = localePath(`/order/${order.id}`, locale);
        const target =
          returnParam && returnParam.startsWith(getSiteUrl())
            ? returnParam
            : fallback;
        return NextResponse.redirect(target);
      }
    }

    return NextResponse.redirect(localePath("/cart?payment=failed", locale));
  } catch (err) {
    console.error("[api/payment/callback GET] error", err);
    return NextResponse.redirect(localePath("/cart?payment=failed", locale));
  }
}

/**
 * Server-to-server webhook / IPN. Always 200 so the gateway stops retrying;
 * fulfilment is idempotent, so re-delivered events are safe.
 */
export async function POST(request: NextRequest) {
  try {
    // RAW TEXT, deliberately. YeshInvoice's NotifyUrl POST is
    // `application/x-www-form-urlencoded`, so `request.json()` would throw on
    // every real notify. Adapters own the decoding (the YeshInvoice one feeds
    // this straight into `new URLSearchParams`); the route stays format-agnostic.
    const rawBody = await request.text();
    const headers = Object.fromEntries(request.headers);
    const query = Object.fromEntries(request.nextUrl.searchParams);

    const normalized = await getPaymentProvider().parseAndVerifyCallback({
      rawBody,
      headers,
      query,
    });

    if (
      normalized.status === "paid" ||
      normalized.status === "authorized"
    ) {
      const repo = getOrderRepository();
      let order = await repo.findByProviderRef(normalized.providerRef);
      if (!order && normalized.orderId) {
        order = await repo.get(normalized.orderId);
      }
      if (order) {
        const paid = await repo.markPaid(order.id, normalized.providerRef);
        await fulfillPaidOrder(paid);
      }
    }
  } catch (err) {
    // Log, but still acknowledge - a 5xx would make the gateway retry forever.
    console.error("[api/payment/callback POST] error", err);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
