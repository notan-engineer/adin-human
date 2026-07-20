import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/sections/Hero";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      {/* CTA scroll target + room below the pinned hero (filled in a later batch). */}
      <section id="products" className="min-h-[40vh]" />
    </>
  );
}
