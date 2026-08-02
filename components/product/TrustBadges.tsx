import { BadgeCheck, Dumbbell, ShieldCheck, WheatOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

/**
 * Small tinted pill badges for the brand's product claims. Driven by the
 * product's `badges` array — only the known trust claims are rendered here
 * (other tags like "bestseller" are surfaced elsewhere), preserving this fixed
 * display order. "kosher" leads (generic Kosher claim; certifying body/teudah
 * still TBD).
 *
 * Server-safe (uses next-intl `useTranslations`).
 */
const TRUST: { badge: string; icon: LucideIcon; labelKey: string }[] = [
  { badge: "kosher", icon: BadgeCheck, labelKey: "kosher" },
  { badge: "high-protein", icon: Dumbbell, labelKey: "highProtein" },
  { badge: "no-preservatives", icon: ShieldCheck, labelKey: "noPreservatives" },
  { badge: "gluten-free", icon: WheatOff, labelKey: "glutenFree" },
];

export function TrustBadges({
  badges,
  className,
}: {
  badges: string[];
  className?: string;
}) {
  const t = useTranslations("product");
  const shown = TRUST.filter((b) => badges.includes(b.badge));

  if (shown.length === 0) return null;

  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {shown.map(({ badge, icon: Icon, labelKey }) => (
        <li
          key={badge}
          className="inline-flex items-center gap-1.5 rounded-full border border-bronze/25 bg-bronze/10 px-3 py-1 text-xs font-medium text-foreground/90"
        >
          <Icon aria-hidden className="size-3.5 text-gold" />
          {t(labelKey)}
        </li>
      ))}
    </ul>
  );
}
