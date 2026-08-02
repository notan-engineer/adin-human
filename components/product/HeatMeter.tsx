import { Flame } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

/**
 * 1–3 flame icons showing a product's heat. Filled flames = heat; empty ones
 * are dim outlines. The whole meter is a single labelled image for screen
 * readers ("Heat level N of 3"). Renders nothing at level 0 - absence of the
 * meter is the "not spicy" signal.
 *
 * Server-safe: uses next-intl's `useTranslations`, which resolves in both
 * Server and Client Components.
 */
export function HeatMeter({
  level,
  className,
  "data-testid": testId,
}: {
  level: 0 | 1 | 2 | 3;
  className?: string;
  "data-testid"?: string;
}) {
  const t = useTranslations("product");

  if (level === 0) return null;

  return (
    <div
      role="img"
      aria-label={t("heatLevel", { level })}
      data-testid={testId}
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
    </div>
  );
}
