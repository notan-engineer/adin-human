import { useTranslations } from "next-intl";

import { Parallax } from "@/components/motion/Parallax";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { processSteps } from "@/content/processSteps";
import { cn } from "@/lib/utils";

/**
 * "How it's smoked" (scroll target `#process`) — four numbered steps over the
 * smoker-interior texture.
 *
 * The photo is a decorative background layer: it drifts on a `Parallax` (which
 * is inert under reduced motion) and is over-sized vertically so the drift
 * never exposes an edge. A near-opaque scrim sits between the photo and the
 * copy, so body text keeps well over 4.5:1 regardless of what the texture is
 * doing underneath it.
 */
export function ProcessSmoke({ className }: { className?: string }) {
  const t = useTranslations("process");
  const kicker = t("kicker");

  return (
    <section
      id="process"
      className={cn(
        "relative isolate scroll-mt-24 overflow-hidden bg-char py-20 sm:py-28",
        className,
      )}
    >
      {/* Background texture — decorative, hidden from AT. */}
      <Parallax
        distance={36}
        className="pointer-events-none absolute inset-x-0 -top-16 -bottom-16 -z-10"
      >
        <picture>
          <source srcSet="/smoker/interior.avif" type="image/avif" />
          <source srcSet="/smoker/interior.webp" type="image/webp" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/smoker/interior.jpg"
            alt=""
            aria-hidden
            width={1600}
            height={1600}
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
        </picture>
      </Parallax>

      {/* Contrast scrim: flat darkening + a vertical fade into the neighbouring
          sections, so the band doesn't end on a hard seam. */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-background/[0.88]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-background via-transparent to-background"
        aria-hidden
      />

      <div className="container">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          {kicker && (
            <p className="font-sans text-xs uppercase tracking-[0.35em] text-bronze">
              {kicker}
            </p>
          )}
          <h2 className="mt-3 font-display text-3xl font-black text-gold sm:text-4xl">
            {t("heading")}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {t("intro")}
          </p>
        </Reveal>

        <Stagger
          as="ol"
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
        >
          {processSteps.map(({ id, icon: Icon }, i) => (
            <StaggerItem
              as="li"
              key={id}
              className="relative flex flex-col gap-4 rounded-lg border border-border/80 bg-card/70 p-6 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className="font-display text-4xl font-black leading-none text-gold/35"
                  aria-hidden
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Icon className="size-5 shrink-0 text-bronze" aria-hidden />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground">
                {t(`steps.${id}.title`)}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t(`steps.${id}.body`)}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
