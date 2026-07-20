import { expect, test } from "@playwright/test";

import { LOCALES, hasHorizontalOverflow, path, seedCart } from "./helpers";

/**
 * Direction and layout integrity.
 *
 * Horizontal overflow is the classic RTL regression — a physical `left`/`ml-*`
 * that mirrors wrong pushes the page sideways — so it's asserted on the three
 * densest pages, in both locales, at both viewports (the project supplies the
 * viewport). The skip link is checked here too because it's the one control
 * whose whole job is keyboard-only.
 */

const PAGES = [
  { name: "home", url: (l: (typeof LOCALES)[number]) => path("/", l) },
  {
    name: "pdp",
    url: (l: (typeof LOCALES)[number]) => path("/product/bbq", l),
  },
  {
    name: "checkout",
    url: (l: (typeof LOCALES)[number]) => path("/checkout", l),
    needsCart: true,
  },
];

for (const locale of LOCALES) {
  for (const pageCase of PAGES) {
    test(`no horizontal overflow: ${pageCase.name} (${locale.code})`, async ({
      page,
    }) => {
      if (pageCase.needsCart) {
        await seedCart(page, [{ slug: "bbq", qty: 2 }]);
      }

      await page.goto(pageCase.url(locale));
      await page.waitForLoadState("networkidle");

      expect(
        await hasHorizontalOverflow(page),
        `${pageCase.name} (${locale.code}) scrolls horizontally`,
      ).toBe(false);

      // Also check after a full scroll — lazy content and sticky chrome can
      // introduce overflow that isn't present at the top of the page.
      await page.evaluate(() =>
        window.scrollTo(0, document.body.scrollHeight),
      );
      await page.waitForTimeout(300);

      expect(
        await hasHorizontalOverflow(page),
        `${pageCase.name} (${locale.code}) scrolls horizontally after scrolling to the bottom`,
      ).toBe(false);
    });
  }

  test(`skip link focuses, shows and jumps to #main (${locale.code})`, async ({
    page,
  }) => {
    await page.goto(path("/", locale));

    // First Tab from the top of the document must land on the skip link.
    await page.keyboard.press("Tab");

    const skip = page.locator('a[href="#main"]');
    await expect(skip).toBeFocused();

    // sr-only until focused — once focused it must be a real, sized, on-screen box.
    const box = await skip.boundingBox();
    expect(box, "skip link has no layout box while focused").not.toBeNull();
    expect(box!.width).toBeGreaterThan(20);
    expect(box!.height).toBeGreaterThan(10);
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);

    await expect(page.locator("#main")).toBeAttached();

    await skip.press("Enter");
    await expect(page).toHaveURL(/#main$/);
  });
}
