import type { Metadata } from "next";
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
    // The cart is a per-visitor, stateful page — keep it out of search indexes.
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
  const t = await getTranslations("cart");

  return (
    <div className="bg-background">
      {/* Top padding clears the sticky header; the cart itself is a client
          island rendered inside this Server Component shell. */}
      <div className="container py-10 sm:py-16">
        <h1 className="font-display text-3xl font-black leading-tight text-foreground sm:text-4xl">
          {t("title")}
        </h1>
        <div className="mt-8 sm:mt-10">
          <CartView />
        </div>
      </div>
    </div>
  );
}
