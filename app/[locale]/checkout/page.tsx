import { setRequestLocale } from "next-intl/server";

import { redirect } from "@/lib/i18n/navigation";

type Params = { locale: string };

/**
 * Checkout now happens ON the cart page (`/cart?checkout=1` — the cart
 * contracts into a sticky summary bar and the forms appear below, same URL).
 * This route survives only as a redirect for old links and muscle memory.
 * No metadata: it never renders. robots.ts already disallows both paths.
 */
export default async function CheckoutPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect({ href: { pathname: "/cart", query: { checkout: "1" } }, locale });
}
