import { Truck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Reveal } from "@/components/motion/Reveal";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { Button } from "@/components/ui/button";
import {
  BAG_LIST_PRICE_AGOROT,
  BUNDLE_TIERS,
} from "@/lib/commerce/bundle-pricing";
import {
  COURIER_FEE_AGOROT,
  FREE_SHIPPING_THRESHOLD_AGOROT,
} from "@/lib/commerce/shipping";
import { Link } from "@/lib/i18n/navigation";
import { formatAgorot } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * The מארזים (bundles) section (scroll target `#bundles`): the three mix &
 * match tiers, driven by BUNDLE_TIERS so the section can never advertise a
 * price the cart doesn't honor - prices and savings are computed, never
 * hard-coded in copy. The 5-pack is ringed gold as "הכי משתלם" (client
 * decision - biggest absolute saving, ₪15). Dark char band between the
 * flavor grid and TrustStats; both bands are hairline-framed so the
 * adjacency reads intentional.
 *
 * Server component; Reveal/Stagger are the client leaves (reduced-motion safe).
 */
export function Bundles({ className }: { className?: string }) {
  const t = useTranslations("bundles");
  const locale = useLocale() as "he" | "en";

  return (
    <section
      id="bundles"
      className={cn(
        "relative overflow-hidden scroll-mt-24 bg-char bg-smoke-radial py-20 sm:py-28",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-ember-line" aria-hidden />

      <div className="container">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <p className="font-sans text-xs uppercase tracking-[0.35em] text-bronze">
            {t("kicker")}
          </p>
          <h2 className="mt-3 font-display text-3xl font-black text-gold sm:text-4xl">
            {t("heading")}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("intro")}
          </p>
        </Reveal>

        <Stagger className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-3 sm:gap-6">
          {BUNDLE_TIERS.map(({ bags, priceAgorot }) => {
            const saving = bags * BAG_LIST_PRICE_AGOROT - priceAgorot;
            const highlighted = bags === 5;
            return (
              <StaggerItem key={bags} className="h-full">
                <div
                  className={cn(
                    "relative flex h-full flex-col items-center gap-2 rounded-xl border bg-card/60 p-6 text-center",
                    highlighted
                      ? "border-gold shadow-gold-glow"
                      : "border-border",
                  )}
                >
                  {highlighted && (
                    <span className="absolute -top-3 rounded-full bg-gold/90 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-primary-foreground">
                      {t("bestValue")}
                    </span>
                  )}
                  <p className="text-sm font-medium uppercase tracking-widest text-foreground/90">
                    {t("bags", { count: bags })}
                  </p>
                  <p className="font-display text-4xl font-black leading-none text-gold">
                    {formatAgorot(priceAgorot, locale)}
                  </p>
                  {saving > 0 && (
                    <span className="mt-1 inline-flex items-center rounded-full border border-bronze/25 bg-bronze/10 px-3 py-1 text-xs font-medium text-foreground/90">
                      {t("save", { amount: formatAgorot(saving, locale) })}
                    </span>
                  )}
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>

        <Reveal delay={0.1} className="mt-10 flex flex-col items-center gap-4 text-center">
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            {t("mixNote")}
          </p>
          <p className="flex items-center gap-2 text-sm text-foreground/90">
            <Truck aria-hidden className="size-4 shrink-0 text-gold" />
            {t("shippingNote", {
              fee: formatAgorot(COURIER_FEE_AGOROT, locale),
              threshold: formatAgorot(FREE_SHIPPING_THRESHOLD_AGOROT, locale),
            })}
          </p>
          <Button asChild variant="gold" size="lg" className="mt-2">
            <Link href="/#products">{t("cta")}</Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
