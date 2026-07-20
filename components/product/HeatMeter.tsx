import { Flame } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

/**
 * 0–3 flame icons showing a product's heat. Filled flames = heat; empty ones are
 * dim outlines. The whole meter is a single labelled image for screen readers
 * ("Heat level N of 3"); level 0 additionally shows a visible "Mild" tag.
 *
 * Server-safe: uses next-intl's `useTranslations`, which resolves in both
 * Server and Client Components.
 */
export function HeatMeter({
  level,
  className,
}: {
  level: 0 | 1 | 2 | 3;
  className?: string;
}) {
  const t = useTranslations("product");

  return (
    <div
      role="img"
      aria-label={t("heatLevel", { level })}
      className={cn("inline-flex items-center gap-1", className)}
    >
      {[1, 2, 3].map((i) => (
        <Flame
          key={i}
          aria-hidden
          className={cn(
            "size-4",
            i <= level
              ? "fill-bronze text-bronze"
              : "text-muted-foreground/35",
          )}
        />
      ))}
      {level === 0 && (
        <span className="ms-1 text-xs font-medium text-muted-foreground">
          {t("mild")}
        </span>
      )}
    </div>
  );
}
