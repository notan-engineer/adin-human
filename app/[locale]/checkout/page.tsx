import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CheckoutForm } from "@/components/checkout/CheckoutForm";

type Params = { locale: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  return {
    title: t("title"),
    // Per-visitor, stateful checkout — never index it.
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("checkout");

  return (
    <div className="bg-background">
      {/* Top padding clears the sticky header; the form is a client island
          rendered inside this Server Component shell. */}
      <div className="container py-10 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-3xl font-black leading-tight text-foreground sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="mt-8 sm:mt-10">
          <CheckoutForm />
        </div>
      </div>
    </div>
  );
}
