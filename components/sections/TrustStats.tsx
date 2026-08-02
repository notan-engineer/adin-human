import { BadgeCheck, ShieldCheck, WheatOff, Dumbbell } from "lucide-react";
import { useTranslations } from "next-intl";

import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { trustStats } from "@/content/trustStats";
import { cn } from "@/lib/utils";

/**
 * Kosher claim plus the three pack claims printed on the real packaging.
 * Kosher leads and stays a bare claim - certifying body/teudah still TBD,
 * matching the PDP's TrustBadges.
 */
const BADGES = [
  { key: "kosher", Icon: BadgeCheck },
  { key: "highProtein", Icon: Dumbbell },
  { key: "noPreservatives", Icon: ShieldCheck },
  { key: "glutenFree", Icon: WheatOff },
] as const;

/**
 * A band of animated headline numbers plus the kosher + pack claims.
 *
 * Server component; `CountUp` and `Stagger` are the client leaves. Both are
 * reduced-motion safe - CountUp jumps straight to its final value and Stagger
 * degrades to a plain wrapper, so every figure is readable without animation.
 */
export function TrustStats({ className }: { className?: string }) {
  const t = useTranslations("stats");
  const kicker = t("kicker");

  return (
    <section
      className={cn(
        "relative overflow-hidden bg-char bg-smoke-radial py-20 sm:py-28",
        className,
      )}
    >
      {/* Gold hairlines top and bottom frame the band against the neighbouring sections. */}
      <div className="absolute inset-x-0 top-0 h-px bg-ember-line" aria-hidden />

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
        </Reveal>

        <Stagger className="grid grid-cols-2 gap-8 sm:gap-10 lg:grid-cols-4">
          {trustStats.map(({ id, value, suffix, icon: Icon }) => (
            <StaggerItem
              key={id}
              className="flex flex-col items-center gap-3 text-center"
            >
              <Icon className="size-5 text-bronze" aria-hidden />
              <p className="font-display text-4xl font-black leading-none text-gold sm:text-5xl">
                <CountUp value={value} suffix={suffix} />
              </p>
              <p className="text-sm leading-snug text-muted-foreground">
                {t(`items.${id}`)}
              </p>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Pack claims */}
        <Reveal
          delay={0.1}
          className="mt-16 flex flex-wrap items-center justify-center gap-3"
        >
          {BADGES.map(({ key, Icon }) => (
            <span
              key={key}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-xs font-medium uppercase tracking-widest text-foreground/90"
            >
              <Icon className="size-4 text-gold" aria-hidden />
              {t(`badges.${key}`)}
            </span>
          ))}
        </Reveal>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 h-px bg-ember-line"
        aria-hidden
      />
    </section>
  );
}
