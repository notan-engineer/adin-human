import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ContactSection } from "@/components/sections/ContactSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { pageMetadata, toLocale } from "@/lib/seo";

type Params = { locale: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = toLocale(raw);
  const t = await getTranslations({ locale, namespace: "contact" });

  return pageMetadata({
    locale,
    path: "/contact",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale: raw } = await params;
  const locale = toLocale(raw);
  setRequestLocale(locale);

  const t = await getTranslations("contact");
  const tm = await getTranslations("meta");

  // Server shell; ContactSection is the client leaf holding the form. The
  // extra top padding clears the fixed header, since this page has no hero.
  return (
    <div className="pt-20">
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: tm("breadcrumbHome"), path: "/" },
            { name: t("heading"), path: "/contact" },
          ],
          locale,
        )}
      />
      <ContactSection />
    </div>
  );
}
