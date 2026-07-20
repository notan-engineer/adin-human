import { setRequestLocale } from "next-intl/server";

import { Hero } from "@/components/sections/Hero";
import { BrandStory } from "@/components/sections/BrandStory";
import { ProductGrid } from "@/components/sections/ProductGrid";
import { TrustStats } from "@/components/sections/TrustStats";
import { ProcessSmoke } from "@/components/sections/ProcessSmoke";
import { Testimonials } from "@/components/sections/Testimonials";
import { Newsletter } from "@/components/sections/Newsletter";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Narrative order: hook (Hero) → who made it (#story) → what you can buy
  // (#products) → why trust it (stats) → how it's made (#process) → social
  // proof → capture. #contact lives on /contact and in the footer.
  return (
    <>
      <Hero />
      <BrandStory />
      <ProductGrid />
      <TrustStats />
      <ProcessSmoke />
      <Testimonials />
      <Newsletter />
    </>
  );
}
