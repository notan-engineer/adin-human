import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { JsonLd } from "@/components/seo/JsonLd";
import { organizationJsonLd, websiteJsonLd } from "@/lib/jsonld";
import { pageMetadata, toLocale } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";
import { BrandStory } from "@/components/sections/BrandStory";
import { ProductGrid } from "@/components/sections/ProductGrid";
import { Bundles } from "@/components/sections/Bundles";
import { TrustStats } from "@/components/sections/TrustStats";
import { ProcessSmoke } from "@/components/sections/ProcessSmoke";
import { Testimonials } from "@/components/sections/Testimonials";
import { Newsletter } from "@/components/sections/Newsletter";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = toLocale(raw);
  const t = await getTranslations({ locale, namespace: "meta" });

  return pageMetadata({
    locale,
    path: "/",
    title: t("home.title"),
    description: t("home.description"),
    // The home title already carries the brand name, so skip the layout's
    // "%s - The Heuman Chef" template.
    absoluteTitle: true,
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = toLocale(raw);
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "meta" });

  // Narrative order: hook (Hero) → who made it (#story) → what you can buy
  // (#products) → the deal (#bundles) → why trust it (stats) → how it's made
  // (#process) → social proof → capture. #contact lives on /contact and in
  // the footer.
  return (
    <>
      {/* Brand + site identity for the knowledge graph. Both nodes carry stable
          @ids so the PDP's Offer.seller can point back at the Organization. */}
      <JsonLd
        data={[organizationJsonLd(locale), websiteJsonLd(locale, t("siteName"))]}
      />
      <Hero />
      <BrandStory />
      <ProductGrid />
      <Bundles />
      <TrustStats />
      <ProcessSmoke />
      <Testimonials />
      <Newsletter />
    </>
  );
}
