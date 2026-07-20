"use client";

import { CreditCard, Smartphone, Apple, Wallet, Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { PaymentMethod } from "@/lib/commerce/types";

/**
 * Selectable payment instruments. Purely presentational: the HYP stub ignores
 * the choice and offers every instrument on its own hosted page — this is the UI
 * affordance plus the "you'll be redirected to HYP" reassurance. RTL-safe.
 */
const OPTIONS: { method: PaymentMethod; Icon: LucideIcon; labelKey: string }[] = [
  { method: "card", Icon: CreditCard, labelKey: "card" },
  { method: "bit", Icon: Smartphone, labelKey: "bit" },
  { method: "apple_pay", Icon: Apple, labelKey: "applePay" },
  { method: "google_pay", Icon: Wallet, labelKey: "googlePay" },
];

export function PaymentMethods({
  value,
  onChange,
}: {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}) {
  const t = useTranslations("checkout");

  return (
    <div className="flex flex-col gap-3">
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as PaymentMethod)}
        className="grid gap-3 sm:grid-cols-2"
        aria-label={t("payment.heading")}
      >
        {OPTIONS.map(({ method, Icon, labelKey }) => {
          const id = `pm-${method}`;
          return (
            <Label
              key={method}
              htmlFor={id}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-gold/50 has-[:checked]:border-gold has-[:checked]:bg-secondary/30"
            >
              <RadioGroupItem value={method} id={id} />
              <Icon aria-hidden className="size-5 shrink-0 text-gold" />
              <span className="font-medium text-foreground">
                {t(`payment.${labelKey}`)}
              </span>
            </Label>
          );
        })}
      </RadioGroup>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lock aria-hidden className="size-3.5 shrink-0" />
        {t("payment.redirectNote")}
      </p>
    </div>
  );
}
