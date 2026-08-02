import { expect, test } from "@playwright/test";

// Relative import on purpose: Playwright's TS loader doesn't get the app's
// `@/*` alias, and this module is dependency-free.
import { bestBundleTotalAgorot } from "../../lib/commerce/bundle-pricing";
import { LOCALES, path, stripBidi } from "./helpers";

const SLUG = "bbq";

/**
 * Product detail page: the commerce facts render, and add-to-cart actually
 * moves the header badge.
 */
for (const locale of LOCALES) {
  test.describe(`pdp (${locale.code})`, () => {
    test("navigates from the grid and renders title, price and nutrition", async ({
      page,
    }) => {
      await page.goto(path("/", locale));

      // Arrive the way a shopper does, rather than deep-linking.
      const card = page.locator("#products article").first();
      const title = card.getByRole("link").first();
      const name = (await title.innerText()).trim();
      await title.click();

      await expect(page).toHaveURL(/\/product\//);

      const h1 = page.getByRole("heading", { level: 1 });
      await expect(h1).toHaveText(name);

      // Price. Hebrew embeds bidi marks AND puts the symbol after the number
      // ("42 ₪") where English puts it before ("₪42"), so accept either order.
      const priceText = await page
        .locator("main")
        .getByText(/₪/)
        .first()
        .innerText();
      expect(stripBidi(priceText)).toMatch(/(₪\s?\d|\d\s?₪)/);

      // Nutrition table: caption + all five per-100g rows.
      const table = page.locator("table");
      await expect(table).toBeVisible();
      await expect(table.locator("tbody tr")).toHaveCount(5);
      await expect(table.locator("th[scope=row]").first()).not.toBeEmpty();
    });

    test("shows the heat meter only for spicy flavors", async ({ page }) => {
      // maple is heatLevel 2 — the meter renders beside the price as one
      // labelled image (a11y contract: "Heat level N of 3").
      await page.goto(path("/product/maple", locale));
      const heat = page.getByTestId("pdp-heat");
      await expect(heat).toBeVisible();
      await expect(heat).toHaveAttribute(
        "aria-label",
        /(רמת חריפות|Heat level)/,
      );

      // bbq is heatLevel 0 — the meter must be absent entirely, not ghosted.
      await page.goto(path("/product/bbq", locale));
      await expect(page.getByTestId("pdp-heat")).toHaveCount(0);
    });

    test("add to cart increments the header cart badge", async ({ page }) => {
      await page.goto(path(`/product/${SLUG}`, locale));

      const badge = page.getByRole("banner").getByTestId("cart-count");
      await expect(badge).toHaveCount(0);

      const addToCart = page
        .locator("main")
        .getByRole("button", { name: /(הוספה לעגלה|Add to cart)/ })
        .first();
      await addToCart.click();

      await expect(badge).toHaveText("1");

      // The confirmation toast announces the add in the global status region.
      await expect(page.getByRole("status")).toContainText(
        /(נוסף לעגלה|added to cart)/,
      );

      // Bump the quantity to 3 and add again → 4 units total.
      await page
        .getByRole("button", { name: /(הוספת יחידה|Increase quantity)/ })
        .click();
      await page
        .getByRole("button", { name: /(הוספת יחידה|Increase quantity)/ })
        .click();
      await page
        .locator("main")
        .getByRole("button", { name: /(הוספה לעגלה|נוסף לעגלה|Add to cart|Added)/ })
        .first()
        .click();

      await expect(badge).toHaveText("4");

      // And the cart page agrees on the money: 4 bags bundle-price as
      // 3-pack + single (₪110 + ₪40 = ₪150), not 4 × list. Target the
      // summary total directly — "last ₪ on the page" would now read the
      // HIDDEN checkout tree (both phase trees stay mounted).
      await page.goto(path("/cart", locale));
      const total = stripBidi(
        await page.getByTestId("cart-total").innerText(),
      );
      expect(total).toContain(String(bestBundleTotalAgorot(4) / 100));
    });
  });
}
