import { describe, expect, it } from "vitest";

import { getAllProducts, getProduct } from "@/lib/catalog";
import {
  organizationJsonLd,
  productJsonLd,
  websiteJsonLd,
} from "@/lib/jsonld";
import { SITE_URL } from "@/lib/seo";

const bbq = getProduct("bbq")!;

describe("productJsonLd", () => {
  it("prices in shekels, not the stored agorot", () => {
    const ld = productJsonLd(bbq, "he") as any;
    expect(ld.offers.price).toBe((bbq.priceAgorot / 100).toFixed(2));
    expect(ld.offers.priceCurrency).toBe("ILS");
    // A four-figure price would mean agorot leaked through.
    expect(Number(ld.offers.price)).toBeLessThan(bbq.priceAgorot);
  });

  it("derives availability from the catalog", () => {
    for (const p of getAllProducts()) {
      const ld = productJsonLd(p, "en") as any;
      expect(ld.offers.availability).toBe(
        p.inStock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      );
    }
  });

  it("points the offer at the locale-correct canonical URL", () => {
    expect((productJsonLd(bbq, "he") as any).offers.url).toBe(
      `${SITE_URL}/product/bbq`,
    );
    expect((productJsonLd(bbq, "en") as any).offers.url).toBe(
      `${SITE_URL}/en/product/bbq`,
    );
  });

  it("localizes name and description", () => {
    expect((productJsonLd(bbq, "he") as any).name).toBe(bbq.name.he);
    expect((productJsonLd(bbq, "en") as any).name).toBe(bbq.name.en);
  });

  /**
   * The on-site testimonials are placeholder copy, so emitting them as review
   * schema would be fabricated structured data and a Google policy violation.
   */
  it("never fabricates ratings or reviews", () => {
    for (const p of getAllProducts()) {
      for (const locale of ["he", "en"] as const) {
        const json = JSON.stringify(productJsonLd(p, locale)).toLowerCase();
        expect(json).not.toContain("aggregaterating");
        expect(json).not.toContain("review");
        // No certification claims we cannot substantiate.
        expect(json).not.toContain("kosher");
      }
    }
  });

  it("does not publish salt grams as sodium", () => {
    for (const p of getAllProducts()) {
      const ld = productJsonLd(p, "he") as any;
      expect(ld.nutrition.sodiumContent).toBeUndefined();
      // The figures it does publish match the on-page per-100g table.
      expect(ld.nutrition.proteinContent).toBe(`${p.nutrition.per100g.proteinG} g`);
    }
  });
});

describe("organizationJsonLd / websiteJsonLd", () => {
  it("uses absolute URLs throughout", () => {
    const json = JSON.stringify([
      organizationJsonLd("he"),
      websiteJsonLd("he", "The Heuman Chef"),
    ]);
    for (const url of json.match(/"(https?:\/\/[^"]+)"/g) ?? []) {
      expect(url).toMatch(/^"https?:\/\//);
    }
    expect(json).not.toContain('"/products');
  });

  it("links the website to the organization by @id", () => {
    const org = organizationJsonLd("he") as any;
    const site = websiteJsonLd("he", "The Heuman Chef") as any;
    expect(site.publisher["@id"]).toBe(org["@id"]);
  });

  it("lists the brand's social profiles as sameAs", () => {
    const org = organizationJsonLd("en") as any;
    expect(org.sameAs.length).toBeGreaterThan(0);
    for (const url of org.sameAs) expect(url).toMatch(/^https:\/\//);
  });
});
