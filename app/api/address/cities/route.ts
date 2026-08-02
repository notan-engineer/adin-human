/**
 * GET /api/address/cities?q= - Israeli city typeahead for the checkout address
 * form. Filters the sample city list (`data/il-cities.sample.json`) by a
 * case-insensitive substring match on either the Hebrew or English name and
 * returns up to ~8 `{ he, en }` pairs.
 *
 * PLACEHOLDER data - swap the sample file for a real data.gov.il cities feed
 * before go-live. `nodejs` runtime so we can read the bundled JSON.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import cities from "@/data/il-cities.sample.json";

export const runtime = "nodejs";

type City = { he: string; en: string };

const ALL = cities as City[];
const MAX = 8;

export function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";

  const matches = q
    ? ALL.filter(
        (c) =>
          c.he.toLowerCase().includes(q) || c.en.toLowerCase().includes(q),
      )
    : ALL;

  return NextResponse.json({ cities: matches.slice(0, MAX) });
}
