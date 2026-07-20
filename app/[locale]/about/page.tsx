import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BrandStory } from "@/components/sections/BrandStory";
import { ProcessSmoke } from "@/components/sections/ProcessSmoke";
import { TrustStats } from "@/components/sections/TrustStats";
import { Reveal } from "@/components/motion/Reveal";

type Params = { locale: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      images: [
        { url: "/products/group.png", width: 1600, height: 832, alt: t("heading") },
      ],
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("about");

  return (
    <>
      {/* Page header — the sections below carry their own headings. */}
      <section className="relative bg-char bg-smoke-radial pb-16 pt-32 sm:pb-20 sm:pt-40">
        <div className="container">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="font-sans text-xs uppercase tracking-[0.35em] text-bronze">
              {t("kicker")}
            </p>
            <h1 className="mt-4 font-display text-4xl font-black text-gold sm:text-6xl">
              {t("heading")}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("intro")}
            </p>
          </Reveal>
        </div>
      </section>

      <BrandStory />
      <TrustStats />
      <ProcessSmoke />
    </>
  );
}
