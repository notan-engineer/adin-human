/**
 * /api/payment/callback — the two ways a hosted payment reports back.
 *
 * GET  = the customer's browser returning from the hosted page. The query string
 *        is UNTRUSTED, so we re-query the provider (`getStatus`) as the source of
 *        truth, mark paid + fulfil on success, then REDIRECT the browser to the
 *        order page (or back to the cart with `?payment=failed`).
 *
 * POST = the server-to-server webhook / IPN (e.g. HYP, SNS). We read the RAW body
 *        first, verify it via `parseAndVerifyCallback`, mark paid + fulfil, and
 *        ALWAYS answer 200 `{received:true}` so the gateway stops retrying — even
 *        for an already-processed event. We never throw back at the gateway.
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
  const ref = params.get("ref") ?? undefined;
  const orderIdParam = params.get("orderId") ?? undefined;
  // Order has no persisted locale; honor an explicit hint, else default Hebrew.
  const locale: "he" | "en" = params.get("locale") === "en" ? "en" : "he";

  try {
    const repo = getOrderRepository();
    let order: Order | null = null;
    if (ref) order = await repo.findByProviderRef(ref);
    if (!order && orderIdParam) order = await repo.get(orderIdParam);

    if (!order) {
      // Can't resolve the order — send the shopper back to the cart.
      return NextResponse.redirect(localePath("/cart?payment=failed", locale));
    }

    const providerRef = order.providerRef ?? ref;
    if (providerRef) {
      // Source of truth: verify with the provider, not the browser's query.
      const status = await getPaymentProvider().getStatus(providerRef);
      if (status.status === "paid" || status.status === "authorized") {
        const paid = await repo.markPaid(order.id, providerRef);
        await fulfillPaidOrder(paid);
        return NextResponse.redirect(localePath(`/order/${order.id}`, locale));
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
    // Log, but still acknowledge — a 5xx would make the gateway retry forever.
    console.error("[api/payment/callback POST] error", err);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
