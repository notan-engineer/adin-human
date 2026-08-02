import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { LegalPage } from "@/components/legal/LegalPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { privacyDoc } from "@/content/legal/privacy";
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
  const t = await getTranslations({ locale, namespace: "legal" });

  return pageMetadata({
    locale,
    path: "/privacy",
    title: t("privacy.metaTitle"),
    description: t("privacy.metaDescription"),
  });
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale: raw } = await params;
  const locale = toLocale(raw);
  setRequestLocale(locale);

  const t = await getTranslations("legal");
  const tm = await getTranslations("meta");

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: tm("breadcrumbHome"), path: "/" },
            { name: t("privacy.heading"), path: "/privacy" },
          ],
          locale,
        )}
      />
      <LegalPage
        doc={privacyDoc}
        kicker={t("privacy.kicker")}
        heading={t("privacy.heading")}
      />
    </>
  );
}
