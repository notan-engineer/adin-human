import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Result } from "axe-core";

import { LOCALES, path, seedCart } from "./helpers";

/**
 * Automated accessibility sweep over every meaningful page, in both locales.
 *
 * Policy: `serious` and `critical` violations FAIL the build. `moderate` and
 * `minor` are printed to the console as a standing to-do — they're real, but
 * axe's severity model puts a lot of judgement calls in those buckets and we
 * don't want them blocking a deploy.
 */

type PageCase = {
  name: string;
  url: (locale: (typeof LOCALES)[number]) => string;
  /** Pages that need a cart to render anything worth auditing. */
  needsCart?: boolean;
};

const PAGES: PageCase[] = [
  { name: "home", url: (l) => path("/", l) },
  { name: "pdp", url: (l) => path("/product/bbq", l) },
  { name: "cart", url: (l) => path("/cart", l), needsCart: true },
  // The real checkout URL — /cart in its ?checkout=1 phase (the /checkout
  // route is now just a redirect here).
  { name: "checkout", url: (l) => path("/cart?checkout=1", l), needsCart: true },
  { name: "contact", url: (l) => path("/contact", l) },
];

function summarize(violations: Result[]): string {
  return violations
    .map((v) => {
      const targets = v.nodes
        .slice(0, 4)
        .map((n) => `      ${n.target.join(" ")}`)
        .join("\n");
      return `  [${v.impact}] ${v.id}: ${v.help}\n    ${v.helpUrl}\n${targets}`;
    })
    .join("\n");
}

for (const locale of LOCALES) {
  for (const pageCase of PAGES) {
    test(`a11y: ${pageCase.name} (${locale.code}) has no serious or critical violations`, async ({
      page,
    }) => {
      if (pageCase.needsCart) {
        await seedCart(page, [
          { slug: "bbq", qty: 2 },
          { slug: "zaatar", qty: 1 },
        ]);
      }

      await page.goto(pageCase.url(locale));
      await page.waitForLoadState("networkidle");

      // Every page owns exactly one top-level heading. axe only rates a missing
      // h1 as `moderate`, so assert it separately rather than let it slip
      // through the advisory bucket.
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

      const results = await new AxeBuilder({ page }).analyze();

      const blocking = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      const advisory = results.violations.filter(
        (v) => v.impact === "moderate" || v.impact === "minor",
      );

      if (advisory.length > 0) {
        console.log(
          `\nℹ️  ${pageCase.name} (${locale.code}) — ${advisory.length} moderate/minor violation(s), not failing:\n${summarize(advisory)}\n`,
        );
      }

      expect(
        blocking,
        `serious/critical a11y violations on ${pageCase.name} (${locale.code}):\n${summarize(blocking)}`,
      ).toEqual([]);
    });
  }
}
