/**
 * POST /api/delivery/quote - price the available shipping options for a cart +
 * destination. Items are resolved to server-side prices so the free-shipping
 * threshold is computed from the true subtotal, never a client figure.
 *
 * Only `city` is required on the destination (that's all the rate table needs);
 * the remaining address fields are optional at quote time.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { getDeliveryProvider } from "@/lib/commerce/registry";
import { resolveOrderItems, CommerceError } from "@/lib/commerce/order-service";
import type { Address } from "@/lib/commerce/types";

export const runtime = "nodejs";

// Mirrors the live offer (see order/create): courier + self-pickup only.
const deliveryMethodSchema = z.enum(["self_pickup", "courier"]);

const bodySchema = z.object({
  // Same DoS caps as order/create - the quote path reaches the same DP.
  items: z
    .array(
      z.object({
        slug: z.string().min(1),
        qty: z.number().int().min(1).max(200),
      }),
    )
    .min(1)
    .max(50),
  destination: z.object({
    // City is the only field the zone table needs; the rest are optional here.
    city: z.string().min(1),
    recipientName: z.string().optional(),
    phone: z.string().optional(),
    street: z.string().optional(),
    houseNumber: z.string().optional(),
    apartment: z.string().optional(),
    entrance: z.string().optional(),
    floor: z.string().optional(),
    postalCode: z.string().optional(),
    notes: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }),
  method: deliveryMethodSchema.optional(),
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
    const { items, destination: d, method } = parsed.data;

    let orderItems;
    try {
      orderItems = resolveOrderItems(items);
    } catch (err) {
      if (err instanceof CommerceError) {
        return NextResponse.json({ error: err.code }, { status: err.status });
      }
      throw err;
    }

    // Fill the required Address shape; unspecified fields default to empty.
    const destination: Address = {
      recipientName: d.recipientName ?? "",
      phone: d.phone ?? "",
      city: d.city,
      street: d.street ?? "",
      houseNumber: d.houseNumber ?? "",
      apartment: d.apartment,
      entrance: d.entrance,
      floor: d.floor,
      postalCode: d.postalCode,
      notes: d.notes,
      lat: d.lat,
      lng: d.lng,
    };

    const rates = await getDeliveryProvider().quoteRates({
      destination,
      items: orderItems,
      method,
    });

    return NextResponse.json({ rates });
  } catch (err) {
    console.error("[api/delivery/quote] internal_error", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
