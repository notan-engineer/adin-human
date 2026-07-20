import { describe, expect, it } from "vitest";

import {
  SITE_URL,
  absoluteUrl,
  localePath,
  localizedAlternates,
  normalizePath,
  toLocale,
} from "@/lib/seo";

describe("normalizePath", () => {
  it("normalizes empty, bare and trailing-slash forms", () => {
    expect(normalizePath("")).toBe("/");
    expect(normalizePath("/")).toBe("/");
    expect(normalizePath("about")).toBe("/about");
    expect(normalizePath("/about/")).toBe("/about");
    expect(normalizePath("/product/bbq")).toBe("/product/bbq");
  });
});

describe("localePath", () => {
  it("serves the default locale (he) unprefixed", () => {
    expect(localePath("/", "he")).toBe("/");
    expect(localePath("/about", "he")).toBe("/about");
    expect(localePath("/product/bbq", "he")).toBe("/product/bbq");
  });

  it("prefixes English with /en", () => {
    expect(localePath("/", "en")).toBe("/en");
    expect(localePath("/about", "en")).toBe("/en/about");
    expect(localePath("/product/bbq", "en")).toBe("/en/product/bbq");
  });
});

describe("absoluteUrl", () => {
  it("prepends the configured origin with no double slash", () => {
    expect(absoluteUrl("/about", "he")).toBe(`${SITE_URL}/about`);
    expect(absoluteUrl("/about", "en")).toBe(`${SITE_URL}/en/about`);
    expect(absoluteUrl("/", "he")).toBe(`${SITE_URL}/`);
  });

  it("never emits a trailing slash on the origin itself", () => {
    expect(SITE_URL.endsWith("/")).toBe(false);
  });
});

describe("localizedAlternates", () => {
  it("emits a complete hreflang cluster with x-default on Hebrew", () => {
    const alts = localizedAlternates("/about", "en");

    expect(alts.canonical).toBe(`${SITE_URL}/en/about`);
    expect(alts.languages).toEqual({
      "he-IL": `${SITE_URL}/about`,
      en: `${SITE_URL}/en/about`,
      "x-default": `${SITE_URL}/about`,
    });
  });

  it("points canonical at the current locale", () => {
    expect(localizedAlternates("/", "he").canonical).toBe(`${SITE_URL}/`);
    expect(localizedAlternates("/", "en").canonical).toBe(`${SITE_URL}/en`);
  });

  it("is reciprocal — each alternate lists the same cluster", () => {
    const he = localizedAlternates("/product/bbq", "he");
    const en = localizedAlternates("/product/bbq", "en");
    expect(he.languages).toEqual(en.languages);
  });
});

describe("toLocale", () => {
  it("passes through supported locales and falls back to he", () => {
    expect(toLocale("he")).toBe("he");
    expect(toLocale("en")).toBe("en");
    expect(toLocale("fr")).toBe("he");
  });
});
