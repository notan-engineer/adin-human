import { describe, it, expect } from "vitest";

import { termsDoc } from "@/content/legal/terms";
import { privacyDoc } from "@/content/legal/privacy";
import { shippingDoc } from "@/content/legal/shipping";
import type { LegalDoc } from "@/content/legal/types";

/**
 * Structural validation for the legal documents — the content-file analog of
 * the messages-parity test. Locale coverage itself is a COMPILE-time guarantee
 * (LocalizedText = Record<Locale, string>); this guards the runtime facts:
 * nothing empty, ids unique/anchor-safe, dates valid.
 *
 * TODO(go-live): once the owner supplies the real business facts, add an
 * assertion that no "[" placeholder remains in any paragraph — publishing
 * bracketed placeholders in the identity sections would itself violate the
 * distance-selling disclosure duty (ס' 14ג(א) לחוק הגנת הצרכן).
 */
const DOCS: [string, LegalDoc][] = [
  ["terms", termsDoc],
  ["privacy", privacyDoc],
  ["shipping", shippingDoc],
];

describe.each(DOCS)("legal doc: %s", (_name, doc) => {
  it("has a valid ISO last-updated date", () => {
    expect(doc.lastUpdatedISO).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isNaN(Date.parse(doc.lastUpdatedISO))).toBe(false);
  });

  it("has unique, anchor-safe section ids", () => {
    const ids = doc.sections.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z][a-z0-9-]*$/);
  });

  it("has non-empty Hebrew and English text everywhere", () => {
    expect(doc.sections.length).toBeGreaterThan(0);
    for (const section of doc.sections) {
      expect(section.title.he.trim(), `${section.id} title.he`).not.toBe("");
      expect(section.title.en.trim(), `${section.id} title.en`).not.toBe("");
      expect(
        section.body.length,
        `${section.id} has at least one paragraph`,
      ).toBeGreaterThan(0);
      for (const [i, p] of section.body.entries()) {
        expect(p.he.trim(), `${section.id} body[${i}].he`).not.toBe("");
        expect(p.en.trim(), `${section.id} body[${i}].en`).not.toBe("");
      }
    }
  });
});

describe("shipping doc money facts", () => {
  it("quotes the live fee and threshold (imported, not hard-coded)", () => {
    const cost = shippingDoc.sections.find((s) => s.id === "cost");
    // ₪40 / ₪400 as digits — formatted per locale upstream, so just assert
    // the digits made it into the prose.
    expect(cost?.body[0].he).toContain("40");
    expect(cost?.body[0].he).toContain("400");
    expect(cost?.body[0].en).toContain("40");
    expect(cost?.body[0].en).toContain("400");
  });
});
