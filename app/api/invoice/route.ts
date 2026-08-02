/**
 * POST /api/invoice - ensure the tax document exists for a PAID order and return
 * its `{ number, url }`. Delegates to `fulfillPaidOrder`, which is idempotent, so
 * calling this repeatedly never issues a second invoice. A not-yet-paid order is
 * rejected with 409.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { getOrderRepository } from "@/lib/commerce/registry";
import { fulfillPaidOrder } from "@/lib/commerce/order-service";

export const runtime = "nodejs";

const bodySchema = z.object({
  orderId: z.string().min(1),
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

    const order = await getOrderRepository().get(parsed.data.orderId);
    if (!order) {
      return NextResponse.json({ error: "order_not_found" }, { status: 404 });
    }

    if (order.status !== "paid" && order.status !== "fulfilled") {
      return NextResponse.json({ error: "order_not_paid" }, { status: 409 });
    }

    const fulfilled = await fulfillPaidOrder(order);
    if (!fulfilled.invoiceNumber || !fulfilled.invoiceUrl) {
      // Fulfilment ran but produced no document - treat as a server fault.
      return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }

    return NextResponse.json({
      number: fulfilled.invoiceNumber,
      url: fulfilled.invoiceUrl,
    });
  } catch (err) {
    console.error("[api/invoice] internal_error", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
