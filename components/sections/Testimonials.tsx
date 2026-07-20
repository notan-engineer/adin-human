import { Star } from "lucide-react";
import { useTranslations } from "next-intl";

import { Reveal } from "@/components/motion/Reveal";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { testimonials } from "@/content/testimonials";
import { cn } from "@/lib/utils";

/**
 * Customer quotes.
 *
 * ⚠️ The quotes rendered here are PLACEHOLDER copy (see `content/testimonials.ts`)
 * and must be swapped for real, attributable reviews before launch.
 *
 * Deliberately plain: names and words only, no publication names or logos, so
 * nothing here implies an endorsement the brand hasn't actually received.
 */
export function Testimonials({ className }: { className?: string }) {
  const t = useTranslations("testimonials");

  return (
    <section
      className={cn("relative bg-background py-20 sm:py-28", className)}
    >
      <div className="container">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <p className="font-sans text-xs uppercase tracking-[0.35em] text-bronze">
            {t("kicker")}
          </p>
          <h2 className="mt-3 font-display text-3xl font-black text-gold sm:text-4xl">
            {t("heading")}
          </h2>
        </Reveal>

        <Stagger as="ul" className="grid gap-6 md:grid-cols-3">
          {testimonials.map(({ id, rating }) => (
            <StaggerItem as="li" key={id} className="h-full">
              <figure className="flex h-full flex-col gap-5 rounded-lg border border-border bg-card p-7 shadow-ember">
                {/* Stars are decorative; the rating is announced once, as text. */}
                <div className="flex items-center gap-1" aria-hidden>
                  {Array.from({ length: rating }, (_, i) => (
                    <Star key={i} className="size-4 fill-gold text-gold" />
                  ))}
                </div>
                <span className="sr-only">{t("ratingLabel", { rating })}</span>

                <blockquote className="flex-1 text-base leading-relaxed text-foreground/90">
                  {t(`items.${id}.quote`)}
                </blockquote>

                <figcaption className="text-sm font-medium text-bronze">
                  {t(`items.${id}.name`)}
                </figcaption>
              </figure>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
