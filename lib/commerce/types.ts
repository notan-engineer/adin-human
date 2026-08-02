/**
 * Shared domain types for the provider-agnostic commerce layer.
 *
 * Pure TypeScript - no React, no UI, no i18n message files. Everything here is
 * consumed by the ports (`ports/*`), the stub adapters (`adapters/*`), and the
 * registry (`registry.ts`).
 *
 * MONEY: every monetary field is an INTEGER count of AGOROT (₪1 = 100 agorot).
 * We reuse the canonical `Money` alias and helpers from `@/lib/money` and the
 * VAT split from `@/lib/vat` - those are NOT reimplemented here.
 */

// Re-export the canonical Money alias so commerce code can import it from a
// single place without duplicating the definition (see `@/lib/money`).
export type { Money } from "@/lib/money";

/** The two supported locales, mirrored from the catalog/i18n config. */
export type Locale = "he" | "en";

/**
 * A shipping / billing address for Israel. Free-text fields are stored as the
 * customer typed them; `lat`/`lng` are optional geocoded coordinates used for
 * pickup-point proximity and courier routing.
 */
export interface Address {
  recipientName: string;
  phone: string;
  city: string;
  street: string;
  houseNumber: string;
  apartment?: string;
  entrance?: string;
  floor?: string;
  postalCode?: string;
  notes?: string;
  lat?: number;
  lng?: number;
}

/**
 * Who is paying / receiving the tax document. `taxId` is the Israeli ח.פ /
 * ע.מ / ת.ז used on a tax invoice; `isBusiness` toggles invoice type.
 */
export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  taxId?: string;
  isBusiness?: boolean;
}

/**
 * How the order reaches the customer.
 * - `self_pickup`   - customer collects from the kitchen/store.
 * - `pickup_point`  - staffed collection point (e.g. חברת שליחויות סניף).
 * - `locker`        - automated parcel locker.
 * - `courier`       - home delivery, standard.
 * - `same_day`      - home delivery, same/next day (Gush Dan only).
 */
export type DeliveryMethod =
  | "self_pickup"
  | "pickup_point"
  | "locker"
  | "courier"
  | "same_day";

/** A single line in an order. `unitPriceAgorot` is VAT-inclusive per unit. */
export interface OrderItem {
  slug: string;
  name: string;
  unitPriceAgorot: number;
  qty: number;
}

/** Lifecycle of an order (distinct from the payment's own status). */
export type OrderStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "fulfilled"
  | "canceled";

/**
 * A persisted order. All `*Agorot` fields are integer agorot and reconcile as
 * `subtotalAgorot - discountAgorot + shippingAgorot === totalAgorot`, with
 * `vatAgorot` being the VAT portion already contained in `totalAgorot`
 * (prices are VAT-inclusive).
 */
export interface Order {
  id: string;
  items: OrderItem[];
  contact: ContactInfo;
  address?: Address;
  deliveryMethod: DeliveryMethod;
  pickupPointId?: string;
  subtotalAgorot: number;
  /** Mix&match bundle discount (see `bundle-pricing.ts`). ≥ 0; 0 = none. */
  discountAgorot: number;
  vatAgorot: number;
  shippingAgorot: number;
  totalAgorot: number;
  status: OrderStatus;
  /** Opaque reference from the payment provider (e.g. HYP transaction id). */
  providerRef?: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
  trackingUrl?: string;
  createdAtISO: string;
}

/**
 * Input to `OrderRepository.create`. The repository assigns `id`, `status`
 * (`"pending"`) and `createdAtISO`; provider/invoice/tracking fields are filled
 * in later as the order progresses, so they are omitted here.
 */
export type NewOrder = Omit<
  Order,
  | "id"
  | "status"
  | "createdAtISO"
  | "providerRef"
  | "invoiceNumber"
  | "invoiceUrl"
  | "trackingUrl"
>;

/**
 * Normalized payment lifecycle, mapped from each provider's native codes (see
 * HYP `CCode` mapping in `adapters/payment/hyp-stub.ts`).
 * - `requires_action` - customer must be redirected / complete 3-D Secure.
 * - `authorized`      - funds held but not captured (HYP CCode 700).
 */
export type PaymentStatus =
  | "pending"
  | "requires_action"
  | "authorized"
  | "paid"
  | "failed"
  | "refunded"
  | "canceled";

/** Payment instruments a provider may support at checkout. */
export type PaymentMethod = "card" | "bit" | "apple_pay" | "google_pay";

/**
 * A single selectable shipping option returned by a delivery provider.
 * `label` is bilingual so the UI never has to map method → text itself.
 */
export interface RateQuote {
  providerId: string;
  method: DeliveryMethod;
  serviceCode: string;
  label: Record<Locale, string>;
  priceAgorot: number;
  etaMinDays: number;
  etaMaxDays: number;
}

/** A staffed collection point or an automated locker. */
export interface PickupPoint {
  id: string;
  name: string;
  type: "pickup_point" | "locker";
  /** Human-readable address line (display only). */
  address: string;
  lat: number;
  lng: number;
  distanceMeters?: number;
  /** Free-text opening hours, e.g. "א׳–ה׳ 09:00–19:00". */
  openingHours?: string;
}

/** Normalized shipment tracking state, mapped from each carrier's codes. */
export type TrackingStatus =
  | "pending"
  | "label_created"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "exception"
  | "returned";
