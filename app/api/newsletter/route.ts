/**
 * POST /api/newsletter - newsletter signup.
 *
 * ⚠️ STUB: validates the address and logs it server-side, then returns success.
 * No list subscription happens. A real ESP integration (Klaviyo / Mailchimp /
 * Resend audience …) wires in at the marked point below.
 *
 * Before launch this also needs: per-IP rate limiting, and a double opt-in
 * confirmation step rather than a silent add, which most consent regimes
 * require for marketing email.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.email().trim().max(320),
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

    // ── Integration point ──────────────────────────────────────────────────
    // Replace this log with the real ESP subscribe call (double opt-in).
    console.info("[api/newsletter] signup", { email: parsed.data.email });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/newsletter] internal_error", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
