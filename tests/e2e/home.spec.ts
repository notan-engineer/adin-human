import { expect, test } from "@playwright/test";

import { LOCALES, collectConsoleErrors, path } from "./helpers";

/**
 * Home page: it loads, it's in the right language and direction, the hero and
 * the six-flavor grid render, and the console is clean.
 */
for (const locale of LOCALES) {
  test.describe(`home (${locale.code})`, () => {
    test("responds 200 with the correct lang/dir and a clean console", async ({
      page,
    }) => {
      const errors = collectConsoleErrors(page);

      const response = await page.goto(path("/", locale));
      expect(response?.status()).toBe(200);

      const html = page.locator("html");
      await expect(html).toHaveAttribute("lang", locale.code);
      await expect(html).toHaveAttribute("dir", locale.dir);

      // Let hydration and any deferred client work settle before judging.
      await page.waitForLoadState("networkidle");
      expect(errors, `console errors on ${path("/", locale)}`).toEqual([]);
    });

    test("renders the hero heading", async ({ page }) => {
      await page.goto(path("/", locale));

      const h1 = page.getByRole("heading", { level: 1 });
      await expect(h1).toHaveCount(1);
      await expect(h1).toBeVisible();
      await expect(h1).not.toBeEmpty();
    });

    test("renders six product cards in the flavor grid", async ({ page }) => {
      await page.goto(path("/", locale));

      const cards = page.locator("#products article");
      await expect(cards).toHaveCount(6);

      // Each card must carry a real, navigable product link — an empty grid of
      // six skeletons would otherwise satisfy the count above.
      for (let i = 0; i < 6; i += 1) {
        const link = cards.nth(i).getByRole("link").first();
        await expect(link).toHaveAttribute("href", /\/product\//);
        await expect(link).not.toBeEmpty();
      }
    });

    test("renders the header nav and the footer", async ({ page }, testInfo) => {
      await page.goto(path("/", locale));

      const header = page.getByRole("banner");
      await expect(header).toBeVisible();

      const isNarrow = (testInfo.project.use.viewport?.width ?? 1280) < 768;
      if (isNarrow) {
        // Below md the desktop nav is display:none and the Sheet trigger owns
        // navigation, so assert the trigger rather than the hidden <nav>.
        await expect(
          header.getByRole("button", { name: /תפריט|menu/i }),
        ).toBeVisible();
      } else {
        const nav = header.getByRole("navigation", { name: "Primary" });
        await expect(nav).toBeVisible();
        await expect(nav.getByRole("link")).toHaveCount(4);
      }

      const footer = page.getByRole("contentinfo");
      await expect(footer).toBeVisible();
      await expect(footer.getByRole("link").first()).toBeVisible();
    });
  });
}
