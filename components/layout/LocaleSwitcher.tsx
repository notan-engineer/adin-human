"use client";

import { useLocale, useTranslations } from "next-intl";

import { usePathname, useRouter } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { Button } from "@/components/ui/button";

/**
 * Toggles he↔en while preserving the current path. Shows the TARGET language's
 * own endonym ("EN" / "עברית") so it reads correctly in either direction.
 */
export function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("locale");

  const other: Locale = locale === "he" ? "en" : "he";
  const label = other === "en" ? "EN" : "עברית";
  const ariaLabel = other === "en" ? t("switchToEnglish") : t("switchToHebrew");

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={ariaLabel}
      onClick={() => router.replace(pathname, { locale: other })}
      className={className}
    >
      <span className="text-xs font-semibold uppercase tracking-widest">
        {label}
      </span>
    </Button>
  );
}
