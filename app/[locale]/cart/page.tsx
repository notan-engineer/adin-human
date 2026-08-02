import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CartView } from "@/components/checkout/CartView";

type Params = { locale: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cart" });
  return {
    title: t("title"),
    // The cart is a per-visitor, stateful page - keep it out of search indexes.
    robots: { index: false, follow: false },
  };
}

export default async function CartPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="bg-background">
      {/* Top padding clears the sticky header; the cart itself is a client
          island rendered inside this Server Component shell. The h1 lives in
          CartView because it swaps between "cart" and "checkout" with the
          same-page ?checkout=1 phase. The Suspense boundary is REQUIRED:
          CartView reads useSearchParams, which bails static prerendering
          without one. */}
      <div className="container py-10 sm:py-16">
        <Suspense fallback={null}>
          <CartView />
        </Suspense>
      </div>
    </div>
  );
}
