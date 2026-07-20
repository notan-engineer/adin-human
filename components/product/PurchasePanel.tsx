"use client";

import { useState } from "react";

import { AddToCartButton } from "@/components/product/AddToCartButton";
import { QuantityStepper } from "@/components/product/QuantityStepper";
import { cn } from "@/lib/utils";

/**
 * Client wrapper that owns the PDP quantity state and wires the stepper to the
 * add-to-cart button. Exists so the PDP itself can stay a Server Component while
 * the two interactive leaves share a single `qty`.
 */
export function PurchasePanel({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const [qty, setQty] = useState(1);

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <QuantityStepper value={qty} onChange={setQty} min={1} />
      <AddToCartButton slug={slug} qty={qty} size="lg" className="flex-1" />
    </div>
  );
}
