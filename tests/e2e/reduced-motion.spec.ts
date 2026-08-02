import { expect, test } from "@playwright/test";

import { LOCALES, effectiveOpacity, path } from "./helpers";

/**
 * Reduced motion must never cost you content.
 *
 * The failure this guards against is subtle: a `whileInView` reveal that only
 * animates to `opacity: 1` on scroll leaves everything below the fold at
 * `opacity: 0` forever for users who never scroll - and Playwright's
 * `toBeVisible()` happily passes on a fully transparent element. So we assert
 * the *computed* opacity of the element and every ancestor, WITHOUT scrolling.
 */

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

for (const locale of LOCALES) {
  test(`home: revealed content is visible without scrolling (${locale.code})`, async ({
    page,
  }) => {
    await page.goto(path("/", locale));
    await page.waitForLoadState("networkidle");

    // Deliberately no scrolling anywhere in this test.

    // Product grid lives inside <Stagger>/<StaggerItem>, well below the fold.
    const cards = page.locator("#products article");
    await expect(cards).toHaveCount(5);
    expect(
      await effectiveOpacity(page, "#products article:last-of-type"),
      "last product card is trapped behind a scroll reveal",
    ).toBe(1);

    // Brand story copy lives inside <Reveal>.
    expect(
      await effectiveOpacity(page, "#story blockquote"),
      "brand story quote is trapped behind a scroll reveal",
    ).toBe(1);

    // Process steps are <Stagger as="ol"> + <StaggerItem as="li">, the deepest
    // section on the page.
    expect(
      await effectiveOpacity(page, "#process ol li:last-of-type"),
      "last process step is trapped behind a scroll reveal",
    ).toBe(1);

    // No element should still be carrying a reveal transform either.
    const transforms = await page
      .locator("#products article:last-of-type, #process ol li:last-of-type")
      .evaluateAll((els) =>
        els.map((el) => getComputedStyle(el as HTMLElement).transform),
      );
    for (const t of transforms) {
      expect(t === "none" || t === "matrix(1, 0, 0, 1, 0, 0)").toBe(true);
    }
  });

}
