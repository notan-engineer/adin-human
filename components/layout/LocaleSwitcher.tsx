"use client";

import { useLocale, useTranslations } from "next-intl";

import { usePathname, useRouter } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { Button } from "@/components/ui/button";

/**
 * Toggles he↔en while preserving the current path AND query. Shows the TARGET
 * language's own endonym ("EN" / "עברית") so it reads correctly in either
 * direction.
 *
 * The query matters: the checkout phase lives at /cart?checkout=1, so a
 * pathname-only replace would silently kick a mid-checkout shopper back to
 * the cart view. next-intl's usePathname excludes the search string, so the
 * query is read from window.location at CLICK time — an event handler, not
 * render, which also avoids the useSearchParams/Suspense requirement in a
 * header that renders on every page.
 */
export function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("locale");

  const other: Locale = locale === "he" ? "en" : "he";
  const label = other === "en" ? "EN" : "עברית";
  const ariaLabel = other === "en" ? t("switchToEnglish") : t("switchToHebrew");

  const switchLocale = () => {
    const query = Object.fromEntries(
      new URLSearchParams(window.location.search),
    );
    router.replace({ pathname, query }, { locale: other });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={ariaLabel}
      onClick={switchLocale}
      className={className}
    >
      <span className="text-xs font-semibold uppercase tracking-widest">
        {label}
      </span>
    </Button>
  );
}
