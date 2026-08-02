"use client";

import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Controlled -/value/+ stepper. `value` is clamped to `min` on decrement; the
 * live value is announced via `aria-live` so keyboard/AT users hear each change.
 */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  className?: string;
}) {
  const t = useTranslations("product");

  return (
    <div
      role="group"
      aria-label={t("quantity")}
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-card",
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-10 rounded-e-none"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={t("decrease")}
      >
        <Minus aria-hidden />
      </Button>
      <span
        aria-live="polite"
        aria-atomic="true"
        className="w-10 select-none text-center text-sm font-semibold tabular-nums"
      >
        {value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-10 rounded-s-none"
        onClick={() => onChange(value + 1)}
        aria-label={t("increase")}
      >
        <Plus aria-hidden />
      </Button>
    </div>
  );
}
