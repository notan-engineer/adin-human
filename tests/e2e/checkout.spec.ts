import { expect, test } from "@playwright/test";

import {
  COURIER_AGOROT,
  LOCALES,
  PRICE_AGOROT,
  path,
  seedCart,
  stripBidi,
} from "./helpers";

/**
 * The money path.
 *
 * Seed a cart, open checkout, confirm the anchored summary and the flat ₪40
 * regular delivery default, fill contact + a Tel Aviv address, watch shipping
 * and the total settle from the live quote, pay, and land on a paid order with
 * an invoice number. The stub payment provider completes offline by bouncing
 * the browser through our own `/api/payment/callback`.
 */

const SLUG = "bbq";
const SUBTOTAL = PRICE_AGOROT[SLUG]; // 4000 agorot = ₪40
const TOTAL = SUBTOTAL + COURIER_AGOROT; // 8000 agorot = ₪80

const COPY = {
  he: {
    summaryHeading: "סיכום הזמנה",
    city: "תל אביב",
    street: "דיזנגוף",
    paid: "שולם",
  },
  en: {
    summaryHeading: "Order summary",
    city: "Tel Aviv",
    street: "Dizengoff",
    paid: "Paid",
  },
} as const;

for (const locale of LOCALES) {
  test.describe(`checkout (${locale.code})`, () => {
    const copy = COPY[locale.code];

    test("prices, submits and settles an order end to end", async ({ page }) => {
      await seedCart(page, [{ slug: SLUG, qty: 1 }]);
      await page.goto(path("/checkout", locale));

      // ── Anchored summary ────────────────────────────────────────────────
      const summaryHeading = page.getByRole("heading", {
        name: copy.summaryHeading,
      });
      await expect(summaryHeading).toBeVisible();

      const summary = page.locator("dl").first();
      expect(stripBidi(await summary.innerText())).toContain(
        String(SUBTOTAL / 100),
      );

      // ── Delivery defaults to regular delivery at ₪35 ────────────────────
      const select = page.locator("select#delivery-method");
      await expect(select).toBeVisible();
      await expect(select).toHaveValue("courier");

      const selectedLabel = stripBidi(
        await select.evaluate(
          (el) => (el as HTMLSelectElement).selectedOptions[0]?.textContent ?? "",
        ),
      );
      expect(selectedLabel).toContain(String(COURIER_AGOROT / 100));
      expect(selectedLabel).toContain("₪");

      // ── Contact ─────────────────────────────────────────────────────────
      await page.locator("#contact-name").fill("אדין יומן");
      await page.locator("#contact-email").fill("shopper@example.com");
      await page.locator("#contact-phone").fill("0521234567");

      // ── Tel Aviv address ────────────────────────────────────────────────
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

      // ── Shipping + total update from the live zone quote ────────────────
      const submit = page.locator("form button[type=submit]");
      await expect(async () => {
        expect(stripBidi(await summary.innerText())).toContain(
          String(COURIER_AGOROT / 100),
        );
      }).toPass();
      await expect(async () => {
        expect(stripBidi(await submit.innerText())).toContain(
          String(TOTAL / 100),
        );
      }).toPass();

      // ── Pay ─────────────────────────────────────────────────────────────
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

    test("keeps the English/Hebrew order page on the right locale", async ({
      page,
    }) => {
      await seedCart(page, [{ slug: SLUG, qty: 1 }]);
      await page.goto(path("/checkout", locale));

      await page.locator("#contact-name").fill("Test Shopper");
      await page.locator("#contact-email").fill("shopper@example.com");
      await page.locator("#contact-phone").fill("0521234567");
      await page.locator("#addr-recipientName").fill("Test Shopper");
      await page.locator("#addr-phone").fill("0521234567");
      const city = page.locator("#addr-city");
      await city.fill(copy.city);
      await city.press("Escape");
      const street = page.locator("#addr-street");
      await expect(street).toBeEnabled();
      await street.fill(copy.street);
      await street.press("Escape");
      await page.locator("#addr-houseNumber").fill("12");

      await page.locator("form button[type=submit]").click();
      await page.waitForURL(/\/order\/[^/]+$/, { timeout: 30_000 });

      await expect(page.locator("html")).toHaveAttribute("lang", locale.code);
      await expect(page.locator("html")).toHaveAttribute("dir", locale.dir);
    });
  });
}
