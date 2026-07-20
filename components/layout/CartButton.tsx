"use client";

import { ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Cart entry point. Renders a count badge only when there is something in the
 * cart; the badge is anchored with logical utilities so it flips under RTL.
 */
export function CartButton({
  count = 0,
  className,
}: {
  count?: number;
  className?: string;
}) {
  const t = useTranslations("nav");
  const hasItems = count > 0;

  return (
    <Link
      href="/cart"
      aria-label={t("cart")}
      className={cn(
        "relative inline-flex size-10 items-center justify-center rounded-md text-foreground/80 transition-colors hover:bg-secondary hover:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <ShoppingBag className="size-5" aria-hidden />
      {hasItems && (
        <span
          aria-hidden
          className="absolute -top-0.5 -end-0.5 inline-flex min-w-[1.15rem] items-center justify-center rounded-full bg-gold px-1.5 text-[0.625rem] font-bold leading-tight text-primary-foreground"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
