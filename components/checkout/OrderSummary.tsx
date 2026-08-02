"use client";

import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { bundleDiscountAgorot } from "@/lib/commerce/bundle-pricing";
import {
  COURIER_FEE_AGOROT,
  FREE_SHIPPING_THRESHOLD_AGOROT,
  courierFeeAgorot,
} from "@/lib/commerce/shipping";
import { formatAgorot } from "@/lib/money";
import { splitGross } from "@/lib/vat";

/**
 * Order totals for the cart. Catalog prices are VAT-inclusive, so the
 * (discounted) subtotal already contains VAT; we surface the VAT portion (via
 * `splitGross`) as an informational "includes VAT" line rather than adding it
 * on top. Shipping is a flat nationwide courier fee (free over the threshold,
 * free for self-pickup — chosen at checkout), so the row shows the real fee
 * but the total here stays merchandise-only.
 *
 * `subtotalAgorot` / `bagCount` are supplied by the parent in integer agorot /
 * units; formatting happens only at the render boundary.
 */
export function OrderSummary({
  subtotalAgorot,
  bagCount,
  onCheckout,
}: {
  subtotalAgorot: number;
  bagCount: number;
  /** Enters the same-page checkout phase (no navigation — see CartView). */
  onCheckout: () => void;
}) {
  const locale = useLocale() as "he" | "en";
  const t = useTranslations("cart");

  const discount = bundleDiscountAgorot(bagCount);
  const merchandise = subtotalAgorot - discount;
  const { vat } = splitGross(merchandise);
  const shippingFree = courierFeeAgorot(merchandise) === 0;
  const total = merchandise;

  return (
    <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <dl className="flex flex-col gap-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">{t("subtotal")}</dt>
          <dd className="font-medium tabular-nums text-foreground">
            {formatAgorot(subtotalAgorot, locale)}
          </dd>
        </div>

        {discount > 0 && (
          <div className="flex items-center justify-between gap-4">
            <dt className="text-gold">{t("bundleDiscount")}</dt>
            <dd className="tabular-nums text-gold">
              {formatAgorot(-discount, locale)}
            </dd>
          </div>
        )}

        <div className="flex items-center justify-between gap-4 text-muted-foreground">
          <dt>{t("vatIncluded")}</dt>
          <dd className="tabular-nums">{formatAgorot(vat, locale)}</dd>
        </div>

        <div className="flex items-start justify-between gap-4">
          <dt className="text-muted-foreground">{t("shipping")}</dt>
          {/* The progress nudge nests INSIDE the dd: axe's definition-list
              rule rejects loose text nodes between dt/dd groups, and keeping
              it above the total row keeps the total the last ₪ figure on the
              page (pdp.spec's cart assertion reads the last one). */}
          <dd className="text-end text-muted-foreground">
            {shippingFree ? (
              t("free")
            ) : (
              <>
                {t("shippingFlat", {
                  fee: formatAgorot(COURIER_FEE_AGOROT, locale),
                  threshold: formatAgorot(
                    FREE_SHIPPING_THRESHOLD_AGOROT,
                    locale,
                  ),
                })}
                <span className="mt-0.5 block text-xs">
                  {t("freeShippingProgress", {
                    amount: formatAgorot(
                      FREE_SHIPPING_THRESHOLD_AGOROT - merchandise,
                      locale,
                    ),
                  })}
                </span>
              </>
            )}
          </dd>
        </div>

        <div className="mt-2 flex items-center justify-between gap-4 border-t border-border/60 pt-4">
          <dt className="font-display text-base font-bold text-foreground">
            {t("total")}
          </dt>
          <dd
            data-testid="cart-total"
            className="font-display text-lg font-bold tabular-nums text-gold"
          >
            {formatAgorot(total, locale)}
          </dd>
        </div>
      </dl>

      <Button
        type="button"
        variant="gold"
        size="lg"
        className="mt-5 w-full"
        onClick={onCheckout}
      >
        {t("checkout")}
      </Button>
    </div>
  );
}
