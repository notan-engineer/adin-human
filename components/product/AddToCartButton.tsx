"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useCart } from "@/lib/store/cart";
import { cn } from "@/lib/utils";

/**
 * Gold "Add to cart" button. Adds `qty` of `slug` to the cart and flashes an
 * "Added" confirmation for ~1.6s. The label change is announced politely.
 */
export function AddToCartButton({
  slug,
  qty = 1,
  size = "default",
  className,
}: {
  slug: string;
  qty?: number;
  size?: ButtonProps["size"];
  className?: string;
}) {
  const t = useTranslations("product");
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any pending reset if the button unmounts mid-flash.
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const onClick = () => {
    add(slug, qty);
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1600);
  };

  return (
    <Button
      type="button"
      variant="gold"
      size={size}
      onClick={onClick}
      aria-live="polite"
      className={cn(className)}
    >
      {added ? (
        <>
          <Check aria-hidden />
          {t("added")}
        </>
      ) : (
        <>
          <Plus aria-hidden />
          {t("addToCart")}
        </>
      )}
    </Button>
  );
}
