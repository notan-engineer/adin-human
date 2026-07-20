/**
 * GET /api/delivery/pickup-points — staffed collection points / lockers near a
 * city (`?city=`) or a coordinate (`?lat=&lng=`), optionally filtered by
 * `?type=pickup_point|locker`. Returns `{ points }`.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getDeliveryProvider } from "@/lib/commerce/registry";
import type { PickupPoint } from "@/lib/commerce/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const p = request.nextUrl.searchParams;
    const city = p.get("city")?.trim() || undefined;
    const latStr = p.get("lat");
    const lngStr = p.get("lng");
    const typeParam = p.get("type");

    const lat = latStr !== null ? Number(latStr) : undefined;
    const lng = lngStr !== null ? Number(lngStr) : undefined;

    if (
      (lat !== undefined && Number.isNaN(lat)) ||
      (lng !== undefined && Number.isNaN(lng))
    ) {
      return NextResponse.json(
        {
          error: "validation_error",
          issues: [{ message: "lat and lng must be numbers" }],
        },
        { status: 400 },
      );
    }

    if (!city && (lat === undefined || lng === undefined)) {
      return NextResponse.json(
        {
          error: "validation_error",
          issues: [{ message: "provide ?city= or both ?lat= and ?lng=" }],
        },
        { status: 400 },
      );
    }

    // Only the two known values filter; anything else is ignored (no filter).
    const type: PickupPoint["type"] | undefined =
      typeParam === "pickup_point" || typeParam === "locker"
        ? typeParam
        : undefined;

    const points = await getDeliveryProvider().listPickupPoints(
      { city, lat, lng },
      type ? { type } : undefined,
    );

    return NextResponse.json({ points });
  } catch (err) {
    console.error("[api/delivery/pickup-points] internal_error", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
