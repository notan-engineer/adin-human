import type { Locale } from "@/lib/catalog";

/**
 * Long-form legal prose lives in typed content files, NOT in messages/*.json:
 * the full message catalog ships to the client on every page (layout passes
 * `getMessages()` into NextIntlClientProvider), while these files are imported
 * only by the three server-rendered legal routes and tree-shaken everywhere
 * else. `Record<Locale, string>` makes a missing translation a COMPILE error —
 * stronger than the runtime messages-parity test — and being TS lets
 * `shipping.ts` import the live fee/threshold constants so the legal page can
 * never drift from what checkout charges.
 *
 * Bracketed placeholders like [שם העסק הרשמי] are facts the owner must supply
 * before go-live — see `lib/__tests__/legal-content.test.ts` for the list.
 */

export type LocalizedText = Record<Locale, string>;

export interface LegalSection {
  /** Stable slug, unique within a document (also the DOM anchor). */
  id: string;
  title: LocalizedText;
  /** One entry per paragraph, in order. */
  body: LocalizedText[];
}

export interface LegalDoc {
  /** ISO date (YYYY-MM-DD) of the last content revision. */
  lastUpdatedISO: string;
  sections: LegalSection[];
}
