import { expect, test } from "@playwright/test";

// Relative import on purpose: Playwright's TS loader doesn't get the app's
// `@/*` alias, and this module is dependency-free.
import { bestBundleTotalAgorot } from "../../lib/commerce/bundle-pricing";
import {
  COURIER_AGOROT,
  LOCALES,
  PRICE_AGOROT,
  path,
  seedCart,
  stripBidi,
} from "./helpers";

/**
 * The money path — now a same-page morph.
 *
 * Seed a cart, click "מעבר לתשלום" on /cart and stay there (?checkout=1 via
 * pushState): the cart contracts into the sticky summary bar and the forms
 * appear below. Shipping is a flat ₪40 (free over ₪400 on the bundle-priced
 * subtotal), knowable instantly — no quote round-trip. Fill contact + a
 * Tel Aviv address, pay, and land on a paid order with an invoice number.
 * The stub payment provider completes offline by bouncing the browser
 * through our own `/api/payment/callback`.
 */

const SLUG = "bbq";
const SUBTOTAL = PRICE_AGOROT[SLUG]; // 4000 agorot = ₪40 (1 bag → no discount)
const TOTAL = SUBTOTAL + COURIER_AGOROT; // 8000 agorot = ₪80

const COPY = {
  he: {
    checkout: "מעבר לתשלום",
    city: "תל אביב",
    street: "דיזנגוף",
    paid: "שולם",
  },
  en: {
    checkout: "Proceed to checkout",
    city: "Tel Aviv",
    street: "Dizengoff",
    paid: "Paid",
  },
} as const;

/** Fill the contact + Tel Aviv address forms (ids are stable). */
async function fillForms(
  page: import("@playwright/test").Page,
  copy: (typeof COPY)[keyof typeof COPY],
) {
  await page.locator("#contact-name").fill("אדין יומן");
  await page.locator("#contact-email").fill("shopper@example.com");
  await page.locator("#contact-phone").fill("0521234567");

  await page.locator("#addr-recipientName").fill("אדין יומן");
  await page.locator("#addr-phone").fill("0521234567");

  // City/street are comboboxes; type, then dismiss the suggestion list so it
  // can't intercept the next click.
  const city = page.locator("#addr-city");
  await city.fill(copy.city);
  await city.press("Escape");

  const street = page.locator("#addr-street");
  await expect(street).toBeEnabled();
  await street.fill(copy.street);
  await street.press("Escape");

  await page.locator("#addr-houseNumber").fill("12");
}

for (const locale of LOCALES) {
  test.describe(`checkout (${locale.code})`, () => {
    const copy = COPY[locale.code];

    test("morphs the cart in place, prices and settles an order end to end", async ({
      page,
    }) => {
      await seedCart(page, [{ slug: SLUG, qty: 1 }]);
      await page.goto(path("/cart", locale));

      // ── Enter checkout WITHOUT navigating ───────────────────────────────
      await page.getByRole("button", { name: copy.checkout }).click();
      await expect(page).toHaveURL(/\/cart\?checkout=1$/);

      // The cart contracted into the sticky bar, priced instantly (no quote):
      // flat courier fee + total, before any address is typed.
      const bar = page.getByTestId("checkout-summary-bar");
      await expect(bar).toBeVisible();
      const barText = stripBidi(await bar.innerText());
      expect(barText).toContain(String(COURIER_AGOROT / 100));
      expect(barText).toContain(String(TOTAL / 100));

      // ── Delivery defaults to regular delivery at the flat ₪40 fee ───────
      const courierRadio = page.locator("#dm-courier");
      await expect(courierRadio).toBeVisible();
      await expect(courierRadio).toBeChecked();

      const courierCard = page.locator('label[for="dm-courier"]');
      const cardText = stripBidi(await courierCard.innerText());
      expect(cardText).toContain(String(COURIER_AGOROT / 100));
      expect(cardText).toContain("₪");

      // ── Fill and pay ────────────────────────────────────────────────────
      await fillForms(page, copy);

      const submit = page.locator("form button[type=submit]");
      expect(stripBidi(await submit.innerText())).toContain(String(TOTAL / 100));
      await submit.click();

      // The stub hops through /api/payment/callback, which verifies with the
      // provider, marks the order paid, and redirects to the order page.
      await page.waitForURL(/\/order\/[^/]+$/, { timeout: 30_000 });

      const main = page.locator("main");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(main).toContainText(copy.paid);
      // Stub invoice numbers are INV-00001, INV-00002, …
      await expect(main).toContainText(/INV-\d{5}/);

      // The order page must show the same money the shopper agreed to pay.
      expect(stripBidi(await main.innerText())).toContain(String(TOTAL / 100));
    });

    test("browser Back pops the checkout phase back to the cart view", async ({
      page,
    }) => {
      await seedCart(page, [{ slug: SLUG, qty: 1 }]);
      await page.goto(path("/cart", locale));

      await page.getByRole("button", { name: copy.checkout }).click();
      await expect(page).toHaveURL(/\/cart\?checkout=1$/);
      await expect(page.getByTestId("checkout-summary-bar")).toBeVisible();

      await page.goBack();
      await expect(page).not.toHaveURL(/checkout=1/);
      // The full cart view is back: the line-item list and the checkout CTA.
      await expect(
        page.getByRole("button", { name: copy.checkout }),
      ).toBeVisible();
      await expect(page.getByTestId("checkout-summary-bar")).toHaveCount(0);
    });

    test("bundle discount + free shipping flow end to end (11 bags)", async ({
      page,
    }) => {
      // 11 × ₪40 lists at ₪440, bundle-prices to ₪405 (5+3+3) — over the ₪400
      // threshold, so courier ships free and the total IS the bundle price.
      const bundleTotal = bestBundleTotalAgorot(11); // 40_500
      await seedCart(page, [{ slug: SLUG, qty: 11 }]);
      await page.goto(path("/cart", locale));

      await page.getByRole("button", { name: copy.checkout }).click();

      const bar = page.getByTestId("checkout-summary-bar");
      await expect(bar).toBeVisible();
      const barText = stripBidi(await bar.innerText());
      // Discount line: list − bundle = ₪35.
      expect(barText).toContain(String((PRICE_AGOROT[SLUG] * 11 - bundleTotal) / 100));
      // Total = bundle price, shipping free.
      expect(barText).toContain(String(bundleTotal / 100));

      await fillForms(page, copy);
      const submit = page.locator("form button[type=submit]");
      expect(stripBidi(await submit.innerText())).toContain(
        String(bundleTotal / 100),
      );
      await submit.click();

      await page.waitForURL(/\/order\/[^/]+$/, { timeout: 30_000 });
      const main = page.locator("main");
      await expect(main).toContainText(copy.paid);
      expect(stripBidi(await main.innerText())).toContain(
        String(bundleTotal / 100),
      );
    });

    test("keeps the English/Hebrew order page on the right locale (via the /checkout redirect)", async ({
      page,
    }) => {
      await seedCart(page, [{ slug: SLUG, qty: 1 }]);
      // Old links must still work: /checkout redirects into the cart's
      // checkout phase, locale intact.
      await page.goto(path("/checkout", locale));
      await expect(page).toHaveURL(/\/cart\?checkout=1$/);

      await fillForms(page, copy);
      await page.locator("form button[type=submit]").click();
      await page.waitForURL(/\/order\/[^/]+$/, { timeout: 30_000 });

      await expect(page.locator("html")).toHaveAttribute("lang", locale.code);
      await expect(page.locator("html")).toHaveAttribute("dir", locale.dir);
    });
  });
}
