"use client";

import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/components/motion/use-reduced-motion";

import { Button } from "@/components/ui/button";

// Flavor lineup shown in the hero. Each pouch render sits on a flat brand-color
// background; a soft radial mask melts that flat color into a glow pool behind
// the black pouch, so the flavors read as a warm, lit shelf on the dark stage.
const FLAVORS = ["zaatar", "garlic", "honey", "bbq", "maple"] as const;

const POUCH_MASK =
  "radial-gradient(closest-side at 50% 44%, #000 52%, transparent 86%)";

export function Hero() {
  const t = useTranslations("hero");
  const reduce = usePrefersReducedMotion();

  return (
    <section
      id="hero"
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-char"
    >
      {/* Real smoke drifting up both sides (see .smoke-col in globals.css).
          Hidden for reduced-motion via CSS; not rendered there to save the fetch. */}
      {!reduce && (
        <>
          <video
            className="smoke-col smoke-col--left"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/smoke/smoke-poster.jpg"
            aria-hidden
          >
            <source src="/smoke/smoke-column.mp4" type="video/mp4" />
          </video>
          <video
            className="smoke-col smoke-col--right"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/smoke/smoke-poster.jpg"
            aria-hidden
          >
            <source src="/smoke/smoke-column.mp4" type="video/mp4" />
          </video>
        </>
      )}

      {/* warm ambient bloom */}
      <div
        className="pointer-events-none absolute inset-0 bg-smoke-radial opacity-70"
        aria-hidden
      />

      {/* Brand copy — visible immediately on load */}
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-5 px-6 pt-28 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <motion.img
          src="/brand/emblem.png"
          alt=""
          width={512}
          height={392}
          className="h-20 w-auto opacity-90 sm:h-24"
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={reduce ? undefined : { opacity: 0.9, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
        <p className="font-sans text-xs uppercase tracking-[0.35em] text-bronze">
          Adin Human
        </p>
        <h1 className="font-display text-5xl font-black leading-[0.95] text-gold sm:text-7xl">
          {t("title")}
        </h1>
        <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
          {t("tagline")}
        </p>
        <Button variant="gold" size="lg" asChild className="mt-2">
          <a href="#products">{t("cta")}</a>
        </Button>
      </div>

      {/* Flavor shelf — the products, lit and glowing, on the smoky floor */}
      <div className="relative z-10 mx-auto flex w-full max-w-5xl items-end justify-center gap-1 px-4 pb-8 sm:gap-3">
        {FLAVORS.map((slug, i) => (
          <motion.div
            key={slug}
            className="relative flex-1"
            initial={reduce ? false : { opacity: 0, y: 44 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              delay: reduce ? 0 : 0.15 + i * 0.09,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <picture>
              <source srcSet={`/products/${slug}/pouch.avif`} type="image/avif" />
              <source srcSet={`/products/${slug}/pouch.webp`} type="image/webp" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/products/${slug}/pouch.jpg`}
                alt=""
                width={900}
                height={1125}
                loading="eager"
                className="mx-auto w-full max-w-[190px] drop-shadow-[0_16px_30px_rgba(0,0,0,0.55)]"
                style={{ WebkitMaskImage: POUCH_MASK, maskImage: POUCH_MASK }}
              />
            </picture>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
