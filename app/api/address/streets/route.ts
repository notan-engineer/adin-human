/**
 * GET /api/address/streets?city=&q= — street typeahead scoped to a city. Looks
 * up the street list for the given Hebrew city name in
 * `data/il-streets.sample.json`, falling back to `_default` for any city without
 * an explicit list, then filters by a case-insensitive substring on `q` and caps
 * the result at ~8.
 *
 * PLACEHOLDER data — swap the sample file for a real data.gov.il streets lookup
 * before go-live. `nodejs` runtime so we can read the bundled JSON.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import streetsData from "@/data/il-streets.sample.json";

export const runtime = "nodejs";

const DATA = streetsData as Record<string, unknown>;
const MAX = 8;

function listForCity(city: string): string[] {
  const forCity = DATA[city];
  const fallback = DATA["_default"];
  const chosen = Array.isArray(forCity) ? forCity : fallback;
  return Array.isArray(chosen) ? (chosen as string[]) : [];
}

export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const city = params.get("city")?.trim() ?? "";
  const q = params.get("q")?.trim().toLowerCase() ?? "";

  const list = listForCity(city);
  const matches = q
    ? list.filter((s) => s.toLowerCase().includes(q))
    : list;

  return NextResponse.json({ streets: matches.slice(0, MAX) });
}
