import { describe, expect, it } from "vitest";

import en from "@/messages/en.json";
import he from "@/messages/he.json";

/**
 * A missing key in one locale is a runtime `next-intl` error on that page, and
 * a missing `meta.*` key silently degrades SEO (empty title / description). So
 * the two catalogs must stay key-for-key identical — value text differs, shape
 * never does.
 */
function flattenKeys(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
    flattenKeys(v, prefix ? `${prefix}.${k}` : k),
  );
}

describe("message catalogs", () => {
  const heKeys = flattenKeys(he).sort();
  const enKeys = flattenKeys(en).sort();

  it("he and en are key-for-key identical", () => {
    expect(heKeys).toEqual(enKeys);
  });

  it("has no empty string values", () => {
    const empties: string[] = [];
    for (const [locale, catalog] of [
      ["he", he],
      ["en", en],
    ] as const) {
      const walk = (v: unknown, path: string) => {
        if (typeof v === "string") {
          if (v.trim() === "") empties.push(`${locale}:${path}`);
          return;
        }
        if (v && typeof v === "object") {
          for (const [k, child] of Object.entries(v)) {
            walk(child, path ? `${path}.${k}` : k);
          }
        }
      };
      walk(catalog, "");
    }
    expect(empties).toEqual([]);
  });

  it("exposes the meta namespace used by generateMetadata", () => {
    for (const key of [
      "meta.siteName",
      "meta.titleDefault",
      "meta.titleTemplate",
      "meta.description",
      "meta.tagline",
      "meta.ogAlt",
      "meta.home.title",
      "meta.home.description",
      "meta.notFound.title",
      "meta.notFound.heading",
      "meta.notFound.body",
      "meta.notFound.cta",
    ]) {
      expect(heKeys).toContain(key);
    }
  });

  it("uses a %s placeholder in the title template", () => {
    expect(he.meta.titleTemplate).toContain("%s");
    expect(en.meta.titleTemplate).toContain("%s");
  });
});
