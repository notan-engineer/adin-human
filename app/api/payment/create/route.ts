/**
 * POST /api/payment/create - open a hosted checkout session for an order.
 *
 * Loads the (server-priced) order, opens a hosted redirect with the payment
 * provider keyed by `orderId` (so a retry never double-charges), records the
 * `providerRef`, and returns the URL the browser should navigate to.
 *
 * IDEMPOTENT: an already-paid order short-circuits to its success page instead
 * of opening a second checkout.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import {
  getOrderRepository,
  getPaymentProvider,
} from "@/lib/commerce/registry";
import { getSiteUrl } from "@/lib/commerce/order-service";

export const runtime = "nodejs";

const bodySchema = z.object({
  orderId: z.string().min(1),
  locale: z.enum(["he", "en"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation_error", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    const { orderId, locale } = parsed.data;

    const repo = getOrderRepository();
    const order = await repo.get(orderId);
    if (!order) {
      return NextResponse.json({ error: "order_not_found" }, { status: 404 });
    }

    // Hebrew is served unprefixed; English is prefixed with `/en`.
    const siteUrl = getSiteUrl();
    const prefix = locale === "en" ? "/en" : "";
    const successUrl = `${siteUrl}${prefix}/order/${orderId}`;
    const cancelUrl = `${siteUrl}${prefix}/cart`;
    const callbackUrl = `${siteUrl}/api/payment/callback`;

    // Idempotent: already settled → return the success page, don't re-open pay.
    if (order.status === "paid" || order.status === "fulfilled") {
      return NextResponse.json({
        redirectUrl: successUrl,
        providerRef: order.providerRef,
      });
    }

    const { redirectUrl, providerRef } = await getPaymentProvider()
      .createHostedCheckout({
        orderId: order.id,
        amountAgorot: order.totalAgorot,
        currency: "ILS",
        customer: order.contact,
        items: order.items,
        successUrl,
        cancelUrl,
        callbackUrl,
        idempotencyKey: order.id,
      });

    await repo.update(order.id, { providerRef });

    return NextResponse.json({ redirectUrl, providerRef });
  } catch (err) {
    console.error("[api/payment/create] internal_error", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
