"use client";

import { useLocale, useTranslations } from "next-intl";

import { formatAgorot } from "@/lib/money";

/**
 * The contracted order summary shown while the /cart page is in its checkout
 * phase: 2–3 short lines instead of the itemized box, so the forms below stay
 * the focus. Sticky on EVERY viewport (the only mobile-sticky element in the
 * app — that's the point: the total follows the shopper through the forms),
 * offset below the sticky header (h-16 / md:h-20, z-50) with breathing room,
 * and z-40 so the header always wins.
 *
 * Purely presentational; all amounts arrive as integer agorot.
 */
export function CheckoutSummaryBar({
  count,
  merchandiseAgorot,
  discountAgorot,
  shippingAgorot,
  totalAgorot,
  vatAgorot,
  onEdit,
}: {
  count: number;
  merchandiseAgorot: number;
  discountAgorot: number;
  shippingAgorot: number;
  totalAgorot: number;
  vatAgorot: number;
  onEdit: () => void;
}) {
  const t = useTranslations("checkout");
  const locale = useLocale() as "he" | "en";

  return (
    <div
      data-testid="checkout-summary-bar"
      className="sticky top-[4.5rem] z-40 rounded-xl border border-border bg-card/95 p-4 shadow-ember backdrop-blur md:top-[5.5rem]"
    >
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-muted-foreground">
          {t("bar.items", { count })} ·{" "}
          <span className="tabular-nums text-foreground">
            {formatAgorot(merchandiseAgorot, locale)}
          </span>
        </span>
        <button
          type="button"
          onClick={onEdit}
          className="shrink-0 font-medium text-gold transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t("bar.edit")}
        </button>
      </div>

      {/* Shipping + total react to the delivery-method radios below — polite
          live region so the change is announced without stealing focus. */}
      <div
        aria-live="polite"
        className="mt-1 flex items-center justify-between gap-4"
      >
        <span className="text-sm text-muted-foreground">
          {t("summary.shipping")}:{" "}
          <span className="tabular-nums">
            {shippingAgorot === 0
              ? t("summary.free")
              : formatAgorot(shippingAgorot, locale)}
          </span>
        </span>
        <span className="font-display text-lg font-bold tabular-nums text-gold">
          {formatAgorot(totalAgorot, locale)}
        </span>
      </div>

      <div className="mt-0.5 text-xs text-muted-foreground">
        {t("summary.vatIncluded")}{" "}
        <span className="tabular-nums">{formatAgorot(vatAgorot, locale)}</span>
        {discountAgorot > 0 && (
          <>
            {" · "}
            {t("summary.bundleDiscount")}{" "}
            <span className="tabular-nums">
              {formatAgorot(-discountAgorot, locale)}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
