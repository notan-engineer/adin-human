import { useLocale, useTranslations } from "next-intl";

import { Reveal } from "@/components/motion/Reveal";
import type { LegalDoc } from "@/content/legal/types";

/**
 * Shared layout for the three legal pages: a char header band (kicker + the
 * page's single h1 + last-updated line), then numbered prose sections.
 *
 * Server component. Only the header is wrapped in `Reveal` - 30+ animated
 * prose sections would be motion noise, and legal text should simply be
 * there. RTL-safe: logical utilities only, `text-start` prose (the section
 * header is centered, the body reads as a document).
 */
export function LegalPage({
  doc,
  kicker,
  heading,
}: {
  doc: LegalDoc;
  kicker: string;
  heading: string;
}) {
  const t = useTranslations("legal");
  const locale = useLocale() as "he" | "en";

  const lastUpdated = new Intl.DateTimeFormat(
    locale === "he" ? "he-IL" : "en-GB",
    { dateStyle: "long" },
  ).format(new Date(doc.lastUpdatedISO));

  return (
    <div className="bg-background">
      <section className="relative bg-char bg-smoke-radial pb-14 pt-32 sm:pb-16 sm:pt-40">
        <div className="container">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="font-sans text-xs uppercase tracking-[0.35em] text-bronze">
              {kicker}
            </p>
            <h1 className="mt-3 font-display text-4xl font-black text-gold sm:text-5xl">
              {heading}
            </h1>
            <p className="mt-4 text-sm text-muted-foreground">
              {t("lastUpdatedLabel", { date: lastUpdated })}
            </p>
          </Reveal>
        </div>
        <div
          className="absolute inset-x-0 bottom-0 h-px bg-ember-line"
          aria-hidden
        />
      </section>

      <div className="container py-12 sm:py-16">
        <div className="mx-auto flex max-w-2xl flex-col gap-10 text-start">
          {doc.sections.map((section, i) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="font-display text-xl font-bold text-foreground">
                {i + 1}. {section.title[locale]}
              </h2>
              <div className="mt-3 flex flex-col gap-3">
                {section.body.map((paragraph, j) => (
                  <p
                    key={j}
                    className="text-base leading-relaxed text-muted-foreground"
                  >
                    {paragraph[locale]}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
