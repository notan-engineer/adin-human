import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: t("notFound.title"),
    // A 404 is a soft signal already, but be explicit so a mis-linked URL
    // never lands in the index.
    robots: { index: false, follow: false },
  };
}

/**
 * Branded 404. Uses logical properties throughout (no left/right), so it
 * mirrors correctly under the Hebrew RTL layout.
 */
export default async function NotFound() {
  const t = await getTranslations("meta");

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center bg-char bg-smoke-radial px-6 py-24">
      <div className="mx-auto max-w-lg text-center">
        <p
          className="font-display text-7xl font-black leading-none text-gold/25 sm:text-8xl"
          aria-hidden
        >
          404
        </p>

        <h1 className="mt-6 font-display text-3xl font-black text-gold sm:text-4xl">
          {t("notFound.heading")}
        </h1>

        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {t("notFound.body")}
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Button variant="gold" size="lg" asChild>
            <Link href="/">{t("notFound.cta")}</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/#products">{t("notFound.shopCta")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
