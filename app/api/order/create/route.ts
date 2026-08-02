/**
 * POST /api/order/create - create a `pending` order from an untrusted cart.
 *
 * The body carries only `{ slug, qty }` per line plus contact/delivery choices;
 * ALL money is recomputed server-side in `computeTotals` (the client price is
 * never trusted). Returns the new `orderId` and the authoritative totals for the
 * checkout UI to display before it opens payment.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { computeTotals, CommerceError } from "@/lib/commerce/order-service";
import { getOrderRepository } from "@/lib/commerce/registry";

export const runtime = "nodejs";

// The live offer is regular courier + self-pickup only. The wider
// DeliveryMethod union still exists in types (legacy orders / future
// re-expansion), but the API refuses the retired methods outright.
const deliveryMethodSchema = z.enum(["self_pickup", "courier"]);

const addressSchema = z.object({
  recipientName: z.string().min(1),
  phone: z.string().min(1),
  city: z.string().min(1),
  street: z.string().min(1),
  houseNumber: z.string().min(1),
  apartment: z.string().optional(),
  entrance: z.string().optional(),
  floor: z.string().optional(),
  postalCode: z.string().optional(),
  notes: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

const bodySchema = z.object({
  // qty/line caps are a DoS guard, not commerce policy: unbounded quantities
  // feed an O(n) pricing DP (see lib/commerce/bundle-pricing.ts) and integer
  // money math. 50 lines × 200 bags is far beyond any legitimate order.
  items: z
    .array(
      z.object({
        slug: z.string().min(1),
        qty: z.number().int().min(1).max(200),
      }),
    )
    .min(1)
    .max(50),
  contact: z.object({
    name: z.string().min(1),
    email: z.email(),
    phone: z.string().min(1),
    taxId: z.string().optional(),
    isBusiness: z.boolean().optional(),
  }),
  delivery: z.object({
    method: deliveryMethodSchema,
    address: addressSchema.optional(),
    pickupPointId: z.string().optional(),
  }),
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
    const { items, contact, delivery } = parsed.data;

    let totals;
    try {
      totals = await computeTotals(items, delivery.method, delivery.address);
    } catch (err) {
      if (err instanceof CommerceError) {
        return NextResponse.json({ error: err.code }, { status: err.status });
      }
      throw err;
    }

    const order = await getOrderRepository().create({
      items: totals.orderItems,
      contact,
      address: delivery.address,
      deliveryMethod: delivery.method,
      pickupPointId: delivery.pickupPointId,
      subtotalAgorot: totals.subtotalAgorot,
      discountAgorot: totals.discountAgorot,
      vatAgorot: totals.vatAgorot,
      shippingAgorot: totals.shippingAgorot,
      totalAgorot: totals.totalAgorot,
    });

    return NextResponse.json(
      {
        orderId: order.id,
        subtotalAgorot: order.subtotalAgorot,
        discountAgorot: order.discountAgorot,
        shippingAgorot: order.shippingAgorot,
        vatAgorot: order.vatAgorot,
        totalAgorot: order.totalAgorot,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[api/order/create] internal_error", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
