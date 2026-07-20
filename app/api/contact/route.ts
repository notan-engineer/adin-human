/**
 * POST /api/contact — inbound message from the site contact form.
 *
 * ⚠️ STUB: this handler validates the payload and logs it server-side, then
 * returns success. Nothing is persisted and no mail is sent. A real
 * CRM/helpdesk/transactional-mail integration (e.g. an ESP send, a ticket
 * create, or a row insert) wires in at the marked point below — the validated
 * `parsed.data` is the payload to hand it.
 *
 * Note the deliberate lack of an anti-abuse layer: before this goes live it
 * needs rate limiting (per-IP) and a bot check, since it is an unauthenticated
 * public endpoint.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const MESSAGE_MAX = 2000;

const bodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().trim().max(320),
  // Capped so a single request can't be used to push an unbounded body through
  // to whatever service gets wired in here later.
  message: z.string().trim().min(1).max(MESSAGE_MAX),
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
    // Replace this log with the real delivery (ESP / CRM / ticket create).
    console.info("[api/contact] message received", {
      name: parsed.data.name,
      email: parsed.data.email,
      messageLength: parsed.data.message.length,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/contact] internal_error", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
