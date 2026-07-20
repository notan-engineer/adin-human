"use client";

import * as React from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { useLocale } from "next-intl";

import { Label } from "@/components/ui/label";
import type { DeliveryMethod } from "@/lib/commerce/types";
import { formatAgorot } from "@/lib/money";
import { cn } from "@/lib/utils";

export type DeliveryOption = {
  method: DeliveryMethod;
  /** Already-localized method name, e.g. "משלוח רגיל". */
  label: string;
  /** Integer agorot. 0 renders as the free label. */
  priceAgorot: number;
  etaMinDays?: number;
  etaMaxDays?: number;
};

type Props = {
  value: DeliveryMethod;
  onChange: (method: DeliveryMethod) => void;
  options: DeliveryOption[];
  /** A quote is in flight — swaps the chevron for a spinner (no layout shift). */
  loading?: boolean;
  label: string;
  /** Localized word for a zero price, e.g. "חינם" / "Free". */
  freeLabel: string;
  error?: string;
  id?: string;
  className?: string;
};

/**
 * Delivery-method picker as a **native** `<select>`.
 *
 * Native is deliberate: it gets the platform's own wheel/sheet on mobile, full
 * keyboard + screen-reader support for free, and zero popup layering bugs — all
 * of which matter more at checkout than a bespoke listbox. The chrome is styled
 * (dark surface, gold focus ring, custom chevron on the end side via
 * `appearance-none`); the options themselves are left to the platform, with
 * `color-scheme: dark` so the native menu renders dark too.
 *
 * Option text is `${label} — ${price}`, so the price is spoken and searchable
 * from inside the closed control. RTL-safe: logical utilities only.
 */
export function DeliveryMethodSelect({
  value,
  onChange,
  options,
  loading,
  label,
  freeLabel,
  error,
  id = "delivery-method",
  className,
}: Props) {
  const locale = useLocale() as "he" | "en";
  const errorId = `${id}-error`;

  const optionText = (o: DeliveryOption) =>
    `${o.label} — ${o.priceAgorot === 0 ? freeLabel : formatAgorot(o.priceAgorot, locale)}`;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        <span aria-hidden className="text-gold">
          {" "}
          *
        </span>
      </Label>

      <div className="relative">
        <select
          id={id}
          name="deliveryMethod"
          value={value}
          onChange={(e) => onChange(e.target.value as DeliveryMethod)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          aria-busy={loading || undefined}
          style={{ colorScheme: "dark" }}
          className={cn(
            "h-11 w-full appearance-none rounded-md border border-input bg-background/40 ps-3 pe-10 text-sm text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            error && "border-destructive focus-visible:ring-destructive",
          )}
        >
          {options.map((o) => (
            <option key={o.method} value={o.method} className="bg-card text-foreground">
              {optionText(o)}
            </option>
          ))}
        </select>

        {/* Decorative affordance; the native control stays fully interactive. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-muted-foreground"
        >
          {loading ? (
            <Loader2 className="size-4 motion-safe:animate-spin" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </span>
      </div>

      {error ? (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
