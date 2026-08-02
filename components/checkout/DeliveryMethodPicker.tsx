"use client";

import { Store, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { DeliveryMethod } from "@/lib/commerce/types";
import { FREE_SHIPPING_THRESHOLD_AGOROT } from "@/lib/commerce/shipping";
import { formatAgorot } from "@/lib/money";

/**
 * Two-option delivery choice, as radio cards (modeled on PaymentMethods).
 * With exactly two flat-priced options there is nothing to quote: the descs -
 * which carry the free-over-threshold promise - stay always visible, and it's
 * one less tap than a dropdown on mobile. `courierFeeAgorot` is the fee for
 * THIS cart (0 once the discounted subtotal clears the threshold).
 */
const OPTIONS: { method: DeliveryMethod; Icon: LucideIcon }[] = [
  { method: "courier", Icon: Truck },
  { method: "self_pickup", Icon: Store },
];

export function DeliveryMethodPicker({
  value,
  onChange,
  courierFeeAgorot,
  label,
  freeLabel,
}: {
  value: DeliveryMethod;
  onChange: (method: DeliveryMethod) => void;
  courierFeeAgorot: number;
  label: string;
  freeLabel: string;
}) {
  const t = useTranslations("checkout");
  const locale = useLocale() as "he" | "en";

  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => onChange(v as DeliveryMethod)}
      className="grid gap-3"
      aria-label={label}
    >
      {OPTIONS.map(({ method, Icon }) => {
        const id = `dm-${method}`;
        const price = method === "self_pickup" ? 0 : courierFeeAgorot;
        return (
          <Label
            key={method}
            htmlFor={id}
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-gold/50 has-[:checked]:border-gold has-[:checked]:bg-secondary/30"
          >
            <RadioGroupItem value={method} id={id} className="mt-0.5" />
            <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-gold" />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="font-medium text-foreground">
                {t(`methods.${method}.title`)}
              </span>
              <span className="text-sm text-muted-foreground">
                {t(`methods.${method}.desc`, {
                  threshold: formatAgorot(FREE_SHIPPING_THRESHOLD_AGOROT, locale),
                })}
              </span>
            </span>
            <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">
              {price === 0 ? freeLabel : formatAgorot(price, locale)}
            </span>
          </Label>
        );
      })}
    </RadioGroup>
  );
}
