import { describe, expect, it } from "vitest";

import { ogMeta, toVisualOrder } from "@/lib/og";

/**
 * satori renders glyphs in the order it is given, so Hebrew has to be flipped
 * to visual order before it reaches an ImageResponse. These tests pin that
 * behaviour — a regression here silently ships backwards Hebrew on every social
 * card, which no build step would catch.
 */
describe("toVisualOrder", () => {
  it("leaves pure-Latin strings untouched", () => {
    expect(toVisualOrder("The Heuman Chef")).toBe("The Heuman Chef");
    expect(toVisualOrder("Smoked BBQ")).toBe("Smoked BBQ");
    expect(toVisualOrder("")).toBe("");
  });

  it("reverses a pure Hebrew string", () => {
    expect(toVisualOrder("שלום")).toBe("םולש");
  });

  it("puts a trailing Hebrew full stop on the visual left", () => {
    const out = toVisualOrder("עשן איטי.");
    expect(out.startsWith(".")).toBe(true);
  });

  it("keeps embedded Latin runs readable left-to-right", () => {
    const out = toVisualOrder("מותג The Heuman Chef טוב");
    expect(out).toContain("The Heuman Chef");
  });

  it("keeps numbers left-to-right", () => {
    const out = toVisualOrder("משקל 100 גרם");
    expect(out).toContain("100");
    expect(out).not.toContain("001");
  });

  it("mirrors paired punctuation", () => {
    expect(toVisualOrder("(שלום)")).toBe("(םולש)");
  });

  it("strips bidi control characters", () => {
    // U+200F RIGHT-TO-LEFT MARK would otherwise render as a stray glyph box.
    expect(toVisualOrder("‏שלום‏")).toBe("םולש");
  });

  it("round-trips back to logical order", () => {
    const original = "נולדים באש";
    expect(toVisualOrder(toVisualOrder(original))).toBe(original);
  });
});

describe("ogMeta", () => {
  it("exposes the strings both cards render, per locale", () => {
    for (const locale of ["he", "en"] as const) {
      const meta = ogMeta(locale);
      expect(meta.siteName).toBeTruthy();
      expect(meta.tagline).toBeTruthy();
      expect(meta.ogAlt).toBeTruthy();
    }
  });

  it("keeps alt text in logical order (not visually reordered)", () => {
    // Alt text is consumed by screen readers and crawlers, never by satori.
    expect(ogMeta("he").ogAlt).toContain("The Heuman Chef");
  });
});
