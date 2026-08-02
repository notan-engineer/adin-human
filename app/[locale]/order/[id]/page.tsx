import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { OrderCelebration } from "@/components/checkout/OrderCelebration";
import { Button } from "@/components/ui/button";
import { getProduct } from "@/lib/catalog";
import { getOrderRepository } from "@/lib/commerce/registry";
import type { DeliveryMethod } from "@/lib/commerce/types";
import { Link } from "@/lib/i18n/navigation";
import { formatAgorot } from "@/lib/money";

// Orders live in the runtime repository, so this page can never be prerendered.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Same soft mask used across the site so each pouch's baked-in flat colour
// background melts into the dark surface instead of showing as a bright panel.
const POUCH_MASK =
  "radial-gradient(closest-side at 50% 44%, #000 52%, transparent 86%)";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "order" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("order");
  const tc = await getTranslations("checkout");
  const loc: "he" | "en" = locale === "en" ? "en" : "he";

  const order = await getOrderRepository().get(id);

  // Graceful state rather than a hard 404: the shopper may have paid even if we
  // can't resolve the order right now (e.g. the in-memory store was restarted).
  if (!order) {
    return (
      <div className="container max-w-2xl py-20 text-center sm:py-28">
        <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
          {t("processing.title")}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          {t("processing.body")}
        </p>
        <Button variant="gold" size="lg" asChild className="mt-8">
          <Link href="/#products">{t("continueShopping")}</Link>
        </Button>
      </div>
    );
  }

  const statusKey = (
    ["paid", "pending", "fulfilled", "failed"] as const
  ).includes(order.status as "paid")
    ? (order.status as "paid" | "pending" | "fulfilled" | "failed")
    : "pending";

  // `OrderStatus` is a single lifecycle enum, so a settled order immediately
  // moves paid → fulfilled and the status chip starts reading "In progress".
  // On the one screen whose entire job is to confirm a payment, that left the
  // shopper with no confirmation the money went through. Payment is therefore
  // surfaced as its own fact: fulfilment implies payment, so both states count.
  const isPaid = order.status === "paid" || order.status === "fulfilled";

  return (
    <div className="container max-w-3xl py-14 sm:py-20">
      {/* Peak-end: gold check + clears the cart on mount */}
      <div className="flex flex-col items-center gap-5 text-center">
        <OrderCelebration />
        <h1 className="font-display text-3xl font-bold text-gold sm:text-4xl">
          {t("thankYou", { name: order.contact.name })}
        </h1>
        <p className="max-w-md text-muted-foreground">{t("subtitle")}</p>

        <dl className="mt-2 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <dt className="text-muted-foreground">{t("orderNumber")}</dt>
            <dd className="font-display font-bold tracking-wide text-foreground">
              {order.id}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="text-muted-foreground">{t("paymentHeading")}</dt>
            <dd>
              <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-0.5 text-xs font-semibold text-gold">
                {t(isPaid ? "status.paid" : "status.pending")}
              </span>
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="text-muted-foreground">{t("statusHeading")}</dt>
            <dd>
              <span className="rounded-full border border-border bg-secondary/40 px-3 py-0.5 text-xs font-semibold text-foreground">
                {t(`status.${statusKey}`)}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-10 h-px w-full bg-ember-line" aria-hidden />

      {/* Items */}
      <section className="mt-10">
        <h2 className="font-display text-lg font-bold text-foreground">
          {t("itemsHeading")}
        </h2>
        <ul className="mt-4 flex flex-col gap-3">
          {order.items.map((item) => {
            const product = getProduct(item.slug);
            const name = product ? product.name[loc] : item.name;
            return (
              <li
                key={item.slug}
                className="flex items-center gap-4 rounded-lg border border-border bg-card p-3"
              >
                <div
                  className="relative size-16 shrink-0 overflow-hidden rounded-md"
                  style={
                    product
                      ? {
                          background: `radial-gradient(60% 55% at 50% 52%, ${product.glow}, transparent 72%)`,
                        }
                      : undefined
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/products/${item.slug}/pouch.jpg`}
                    alt=""
                    width={900}
                    height={1125}
                    className="size-full object-contain"
                    style={{
                      WebkitMaskImage: POUCH_MASK,
                      maskImage: POUCH_MASK,
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{name}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("qty")}: {item.qty} · {formatAgorot(item.unitPriceAgorot, loc)}
                  </p>
                </div>
                <p className="font-display font-bold tabular-nums text-foreground">
                  {formatAgorot(item.unitPriceAgorot * item.qty, loc)}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Totals */}
      <section className="mt-8 rounded-lg border border-border bg-card p-5">
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">{t("subtotal")}</dt>
            <dd className="tabular-nums">
              {formatAgorot(order.subtotalAgorot, loc)}
            </dd>
          </div>
          {order.discountAgorot > 0 && (
            <div className="flex items-center justify-between gap-4">
              <dt className="text-gold">{t("bundleDiscount")}</dt>
              <dd className="tabular-nums text-gold">
                {formatAgorot(-order.discountAgorot, loc)}
              </dd>
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">{t("shipping")}</dt>
            <dd className="tabular-nums">
              {order.shippingAgorot === 0
                ? t("free")
                : formatAgorot(order.shippingAgorot, loc)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 text-muted-foreground">
            <dt>{t("vatIncluded")}</dt>
            <dd className="tabular-nums">{formatAgorot(order.vatAgorot, loc)}</dd>
          </div>
          <div className="mt-2 flex items-center justify-between gap-4 border-t border-border pt-3">
            <dt className="font-display text-base font-bold text-foreground">
              {t("total")}
            </dt>
            <dd className="font-display text-xl font-bold tabular-nums text-gold">
              {formatAgorot(order.totalAgorot, loc)}
            </dd>
          </div>
        </dl>
      </section>

      {/* Delivery + documents */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-display text-base font-bold text-foreground">
            {t("deliveryHeading")}
          </h2>
          <p className="mt-2 text-sm text-foreground/90">
            {tc(`methods.${order.deliveryMethod as DeliveryMethod}.title`)}
          </p>
          {order.address ? (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              <span className="block">{t("deliverTo")}</span>
              {order.address.recipientName} · {order.address.street}{" "}
              {order.address.houseNumber}
              {order.address.apartment ? `/${order.address.apartment}` : ""},{" "}
              {order.address.city}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              {tc("selfPickup.storeName")} - {tc("selfPickup.storeAddress")}
            </p>
          )}
          {order.trackingUrl ? (
            <a
              href={order.trackingUrl}
              className="mt-3 inline-block text-sm text-gold underline-offset-4 hover:underline"
            >
              {t("trackingLink")}
            </a>
          ) : null}
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-display text-base font-bold text-foreground">
            {t("invoiceHeading")}
          </h2>
          {order.invoiceNumber ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {order.invoiceNumber}
            </p>
          ) : null}
          {order.invoiceUrl ? (
            <a
              href={order.invoiceUrl}
              className="mt-3 inline-block text-sm text-gold underline-offset-4 hover:underline"
            >
              {t("invoiceLink")}
            </a>
          ) : null}
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {t("emailNote")}
          </p>
        </div>
      </section>

      <div className="mt-10 flex justify-center">
        <Button variant="gold" size="lg" asChild>
          <Link href="/#products">{t("continueShopping")}</Link>
        </Button>
      </div>
    </div>
  );
}
