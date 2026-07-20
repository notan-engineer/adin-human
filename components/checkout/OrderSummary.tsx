"use client";

import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { formatAgorot } from "@/lib/money";
import { splitGross } from "@/lib/vat";

/**
 * Order totals for the cart. Catalog prices are VAT-inclusive, so the subtotal
 * already contains VAT; we surface the VAT portion (via `splitGross`) as an
 * informational "includes VAT" line rather than adding it on top. Shipping is
 * quoted at checkout, so the total equals the subtotal here.
 *
 * `subtotalAgorot` is integer agorot supplied by the parent; formatting happens
 * only at the render boundary.
 */
export function OrderSummary({
  subtotalAgorot,
}: {
  subtotalAgorot: number;
}) {
  const locale = useLocale() as "he" | "en";
  const t = useTranslations("cart");

  const { vat } = splitGross(subtotalAgorot);
  // No shipping/discount applied yet → total is the VAT-inclusive subtotal.
  const total = subtotalAgorot;

  return (
    <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <dl className="flex flex-col gap-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">{t("subtotal")}</dt>
          <dd className="font-medium tabular-nums text-foreground">
            {formatAgorot(subtotalAgorot, locale)}
          </dd>
        </div>

        <div className="flex items-center justify-between gap-4 text-muted-foreground">
          <dt>{t("vatIncluded")}</dt>
          <dd className="tabular-nums">{formatAgorot(vat, locale)}</dd>
        </div>

        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">{t("shipping")}</dt>
          <dd className="text-end text-muted-foreground">
            {t("shippingAtCheckout")}
          </dd>
        </div>

        {/* TODO(discount): render a coupon/discount row here once promotions
            ship (label + negative amount, subtracted from the total). */}

        <div className="mt-2 flex items-center justify-between gap-4 border-t border-border/60 pt-4">
          <dt className="font-display text-base font-bold text-foreground">
            {t("total")}
          </dt>
          <dd className="font-display text-lg font-bold tabular-nums text-gold">
            {formatAgorot(total, locale)}
          </dd>
        </div>
      </dl>

      <Button asChild variant="gold" size="lg" className="mt-5 w-full">
        <Link href="/checkout">{t("checkout")}</Link>
      </Button>
    </div>
  );
}
