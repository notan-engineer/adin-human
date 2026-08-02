"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button, type ButtonProps } from "@/components/ui/button";
import { getProduct } from "@/lib/catalog";
import { useCart } from "@/lib/store/cart";
import { useCartToast } from "@/lib/store/toast";
import { cn } from "@/lib/utils";

/**
 * Gold "Add to cart" button. Adds `qty` of `slug` to the cart, flashes an
 * "Added" confirmation for ~1.6s at the pointer, and raises the global cart
 * toast. The screen-reader announcement lives on the toast's live region (it
 * carries the product name) - deliberately NOT also on this button, which
 * would double-announce.
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
  const locale = useLocale() as "he" | "en";
  const add = useCart((s) => s.add);
  const showToast = useCartToast((s) => s.show);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any pending reset if the button unmounts mid-flash.
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const onClick = () => {
    add(slug, qty);
    const name = getProduct(slug)?.name[locale];
    if (name) showToast(name);
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
