import { useTranslations } from "next-intl";

import { ProductCard } from "@/components/product/ProductCard";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { getAllProducts } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/**
 * The flavor lineup section (scroll target `#products`). A localized kicker +
 * heading over a responsive grid of product cards, revealed with the shared
 * Stagger primitives (reduced-motion safe - Stagger degrades to a plain wrapper).
 *
 * Server-safe (next-intl `useTranslations`); the ProductCards render on the
 * server and are handed to the client Stagger as children.
 */
export function ProductGrid({ className }: { className?: string }) {
  const t = useTranslations("grid");
  const products = getAllProducts();

  return (
    <section
      id="products"
      className={cn(
        "relative scroll-mt-24 bg-background bg-smoke-radial py-20 sm:py-28",
        className,
      )}
    >
      <div className="container">
        <header className="mx-auto mb-12 max-w-2xl text-center">
          <p className="font-sans text-xs uppercase tracking-[0.35em] text-bronze">
            {t("kicker")}
          </p>
          <h2 className="mt-3 font-display text-3xl font-black text-gold sm:text-4xl">
            {t("heading")}
          </h2>
        </header>

        <Stagger className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
          {products.map((product) => (
            <StaggerItem key={product.slug} className="h-full">
              <ProductCard product={product} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
