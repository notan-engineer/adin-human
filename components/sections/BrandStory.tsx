import { useTranslations } from "next-intl";

import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

/**
 * The founder/origin section (scroll target `#story`). Two columns on desktop
 * - the full flavor lineup on one side, the Adin Human story on the other -
 * stacked on mobile with the image first.
 *
 * Server component: `useTranslations` renders on the server and the copy is
 * handed to the client `Reveal` wrappers as already-rendered children, so the
 * text is in the HTML even before JS (and with reduced motion, Reveal degrades
 * to a plain element).
 */
export function BrandStory({ className }: { className?: string }) {
  const t = useTranslations("story");
  const quoteAttribution = t("quoteAttribution");

  return (
    <section
      id="story"
      className={cn(
        "relative scroll-mt-24 overflow-hidden bg-background py-20 sm:py-28",
        className,
      )}
    >
      <div className="container">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Visual - the full lineup on its color panels. */}
          <Reveal y={28} className="order-1">
            <div className="relative">
              {/* Warm bloom behind the pouches so they sit in light, not on a flat slab. */}
              <div
                className="pointer-events-none absolute -inset-8 bg-smoke-radial opacity-80"
                aria-hidden
              />
              <picture>
                <source srcSet="/products/group.avif" type="image/avif" />
                <source srcSet="/products/group.webp" type="image/webp" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/products/group.png"
                  alt={t("imageAlt")}
                  width={1600}
                  height={832}
                  loading="lazy"
                  decoding="async"
                  // Intrinsic width/height above reserve the box, so no CLS.
                  className="relative h-auto w-full rounded-lg shadow-ember"
                />
              </picture>
            </div>
          </Reveal>

          {/* Copy */}
          <div className="order-2 flex flex-col gap-6">
            <Reveal y={20}>
              <p className="font-sans text-xs uppercase tracking-[0.35em] text-bronze">
                {t("kicker")}
              </p>
              <h2 className="mt-3 font-display text-3xl font-black text-gold sm:text-4xl">
                {t("heading")}
              </h2>
              {/* Gold hairline accent - logical inset so it hugs the start edge in RTL too. */}
              <div className="mt-5 h-px w-24 bg-ember-line" aria-hidden />
            </Reveal>

            <Reveal y={20} delay={0.08}>
              <div className="flex flex-col gap-4 text-base leading-relaxed text-muted-foreground">
                <p>{t("p1")}</p>
                <p>{t("p2")}</p>
                <p>{t("p3")}</p>
              </div>
            </Reveal>

            <Reveal y={20} delay={0.16}>
              <figure className="border-s-2 border-gold/60 ps-5">
                <blockquote className="font-display text-xl leading-snug text-foreground sm:text-2xl">
                  {t("quote")}
                </blockquote>
                {quoteAttribution && (
                  <figcaption className="mt-3 text-xs uppercase tracking-[0.25em] text-bronze">
                    {quoteAttribution}
                  </figcaption>
                )}
              </figure>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
