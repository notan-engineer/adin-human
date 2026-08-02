/**
 * Order service - shared, provider-agnostic checkout logic that the HTTP route
 * handlers (`app/api/*`) delegate to. Keeping the money math and fulfilment here
 * (instead of inline in each route) means the create flow and the payment
 * callback flow compute totals / fulfil the same way and can never drift.
 *
 * TRUST MODEL: the browser is never trusted for prices. `computeTotals` resolves
 * every line from the catalog server-side and recomputes the subtotal, shipping,
 * VAT and total from scratch - the client only ever supplies `{ slug, qty }`.
 *
 * MONEY: every `*Agorot` value is an INTEGER count of agorot (₪1 = 100 agorot).
 */

import type {
  Address,
  DeliveryMethod,
  Order,
  OrderItem,
  RateQuote,
} from "./types";
import {
  getDeliveryProvider,
  getInvoiceProvider,
  getOrderRepository,
} from "./registry";
import { bundleDiscountAgorot } from "./bundle-pricing";
import { getProduct } from "@/lib/catalog";
import { splitGross } from "@/lib/vat";

// The typed error lives in `./errors` so adapters can throw it without closing
// an import cycle through the registry. Re-exported here for existing callers.
import { CommerceError } from "./errors";
export { CommerceError } from "./errors";
export type { CommerceErrorCode } from "./errors";

/**
 * A placeholder destination used only to price a delivery method when the caller
 * has not (yet) supplied a real address - e.g. an early quote or `self_pickup`.
 * `cityToZone("")` resolves this to the "other" fallback zone in the stub.
 */
const MINIMAL_ADDRESS: Address = {
  recipientName: "",
  phone: "",
  city: "",
  street: "",
  houseNumber: "",
};

/** The site's public base URL, read once from env, trailing slash stripped. */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:4000";
  return raw.replace(/\/+$/, "");
}

/**
 * Resolve untrusted `{ slug, qty }` lines into priced {@link OrderItem}s using
 * the server-side catalog price (VAT-inclusive). Throws {@link CommerceError} on
 * an empty cart or an unknown slug - NEVER trusts a client-supplied price.
 */
export function resolveOrderItems(
  items: { slug: string; qty: number }[],
): OrderItem[] {
  if (!items || items.length === 0) {
    throw new CommerceError("empty_cart", "Cart is empty", 422);
  }
  return items.map(({ slug, qty }) => {
    const product = getProduct(slug);
    if (!product) {
      throw new CommerceError(
        "unknown_slug",
        `Unknown product slug: ${slug}`,
        422,
      );
    }
    return {
      slug: product.slug,
      name: product.name.he,
      unitPriceAgorot: product.priceAgorot,
      qty,
    };
  });
}

/**
 * Price a cart end-to-end, server-side. Resolves each `{ slug, qty }` from the
 * catalog, sums the list subtotal, applies the mix&match bundle discount (see
 * `bundle-pricing.ts`), prices the chosen delivery method (0 for
 * `self_pickup`; the free-shipping threshold inside the delivery provider is
 * judged on the DISCOUNTED subtotal), then derives the VAT contained in the
 * VAT-inclusive total.
 *
 * `total === subtotal - discount + shipping` and `vat === splitGross(total).vat`.
 */
export async function computeTotals(
  items: { slug: string; qty: number }[],
  deliveryMethod: DeliveryMethod,
  address?: Address,
): Promise<{
  orderItems: OrderItem[];
  subtotalAgorot: number;
  discountAgorot: number;
  shippingAgorot: number;
  vatAgorot: number;
  totalAgorot: number;
  rate?: RateQuote;
}> {
  const orderItems = resolveOrderItems(items);

  const subtotalAgorot = orderItems.reduce(
    (sum, item) => sum + item.unitPriceAgorot * item.qty,
    0,
  );
  const bagCount = orderItems.reduce((sum, item) => sum + item.qty, 0);
  const discountAgorot = bundleDiscountAgorot(bagCount);

  let shippingAgorot = 0;
  let rate: RateQuote | undefined;

  if (deliveryMethod !== "self_pickup") {
    const quotes = await getDeliveryProvider().quoteRates({
      destination: address ?? MINIMAL_ADDRESS,
      items: orderItems,
      method: deliveryMethod,
    });
    rate = quotes.find((q) => q.method === deliveryMethod);
    if (!rate) {
      throw new CommerceError(
        "delivery_unavailable",
        `Delivery method not available for this destination: ${deliveryMethod}`,
        422,
      );
    }
    shippingAgorot = rate.priceAgorot;
  }

  const totalAgorot = subtotalAgorot - discountAgorot + shippingAgorot;
  const vatAgorot = splitGross(totalAgorot).vat;

  return {
    orderItems,
    subtotalAgorot,
    discountAgorot,
    shippingAgorot,
    vatAgorot,
    totalAgorot,
    rate,
  };
}

/**
 * Complete a PAID order: issue the tax document and (for shipped methods) book
 * the shipment, persisting the invoice/tracking references onto the order.
 *
 * IDEMPOTENT: guarded by `invoiceNumber`. If the order already carries one (or a
 * concurrent call fulfilled it first), the current order is returned untouched -
 * so a webhook retry, a browser-return VERIFY, and a manual invoice request can
 * all call this without double-issuing an invoice or double-booking a shipment.
 */
export async function fulfillPaidOrder(order: Order): Promise<Order> {
  // Fast path: the in-hand copy already shows it fulfilled.
  if (order.invoiceNumber) return order;

  const repo = getOrderRepository();

  // Re-read in case the passed copy is stale (e.g. fetched before markPaid).
  const current = (await repo.get(order.id)) ?? order;
  if (current.invoiceNumber) return current;

  const invoice = await getInvoiceProvider().issue({
    orderId: current.id,
    type: "invoice_receipt", // חשבונית מס/קבלה - the paid B2C document.
    customer: current.contact,
    lines: current.items,
    discountAgorot: current.discountAgorot,
    shippingAgorot: current.shippingAgorot,
    amountAgorot: current.totalAgorot,
    vatAgorot: current.vatAgorot,
  });

  // Self-pickup ships nothing, so it gets no tracking handle.
  let trackingUrl: string | undefined;
  if (current.deliveryMethod !== "self_pickup") {
    const shipment = await getDeliveryProvider().createShipment({
      orderId: current.id,
      destination: current.address ?? MINIMAL_ADDRESS,
      method: current.deliveryMethod,
      pickupPointId: current.pickupPointId,
    });
    trackingUrl = shipment.trackingUrl;
  }

  return repo.update(current.id, {
    status: "fulfilled",
    invoiceNumber: invoice.number,
    invoiceUrl: invoice.url,
    trackingUrl,
  });
}
