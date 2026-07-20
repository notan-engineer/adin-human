import { useLocale, useTranslations } from "next-intl";

import type { Nutrition } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/**
 * Per-100g nutrition table. Row labels are logical-start aligned and values
 * logical-end aligned, so the table mirrors correctly under RTL. Units are
 * localized (kcal / g).
 *
 * ⚠️ The numbers passed in are PLACEHOLDERS pending brand confirmation.
 * Server-safe (next-intl `useTranslations` / `useLocale`).
 */
export function NutritionTable({
  per100g,
  className,
}: {
  per100g: Nutrition;
  className?: string;
}) {
  const t = useTranslations("product");
  const locale = useLocale();

  const kcal = `${per100g.energyKcal} ${t("kcal")}`;
  const g = (v: number) =>
    // Keep the number and its unit together, direction-agnostic.
    `${v} ${t("g")}`;

  const rows: { label: string; value: string }[] = [
    { label: t("energy"), value: kcal },
    { label: t("protein"), value: g(per100g.proteinG) },
    { label: t("fat"), value: g(per100g.fatG) },
    { label: t("carbs"), value: g(per100g.carbsG) },
    { label: t("salt"), value: g(per100g.saltG) },
  ];

  return (
    <table
      lang={locale}
      className={cn("w-full border-collapse text-sm", className)}
    >
      <caption className="pb-2 text-start text-xs uppercase tracking-widest text-muted-foreground">
        {t("nutrition")} · {t("per100g")}
      </caption>
      <tbody>
        {rows.map((row, i) => (
          <tr
            key={row.label}
            className={cn(i < rows.length - 1 && "border-b border-border/60")}
          >
            <th
              scope="row"
              className="py-2.5 text-start font-medium text-muted-foreground"
            >
              {row.label}
            </th>
            <td className="py-2.5 text-end font-medium tabular-nums text-foreground">
              {row.value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
