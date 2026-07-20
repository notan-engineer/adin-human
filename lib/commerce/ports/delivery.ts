/**
 * Delivery port — the provider-agnostic contract for shipping/fulfilment
 * carriers (courier, pickup points, lockers, self-pickup). The stub adapter is
 * driven by the Israel zone table in `adapters/delivery/zones.ts`; real carrier
 * adapters (HFD, Israel Post, Wolt Drive, …) slot in behind the same interface.
 */

import type {
  Address,
  DeliveryMethod,
  OrderItem,
  PickupPoint,
  RateQuote,
  TrackingStatus,
} from "../types";

/** Input to price the available delivery options for a destination. */
export interface QuoteRatesInput {
  destination: Address;
  items: OrderItem[];
  /** Restrict to a single method; omit to return every available option. */
  method?: DeliveryMethod;
}

/** Input to book a shipment once an order is paid. */
export interface CreateShipmentInput {
  orderId: string;
  destination: Address;
  method: DeliveryMethod;
  /** Provider service code chosen from a prior `quoteRates` result. */
  serviceCode?: string;
  pickupPointId?: string;
}

/** A single tracking event in a shipment's history. */
export interface TrackingEvent {
  status: TrackingStatus;
  timestampISO: string;
  description?: string;
}

/** Result of a tracking query. */
export interface TrackingResult {
  status: TrackingStatus;
  trackingUrl?: string;
  events?: TrackingEvent[];
}

export interface DeliveryProvider {
  readonly id: string;
  readonly supportedMethods: DeliveryMethod[];

  /** Price every available option (or just `method`) for the destination. */
  quoteRates(i: QuoteRatesInput): Promise<RateQuote[]>;

  /** Pickup points / lockers near a city or coordinate. */
  listPickupPoints(
    near: { city?: string; lat?: number; lng?: number },
    opts?: { type?: PickupPoint["type"] },
  ): Promise<PickupPoint[]>;

  /** Book a shipment; returns a tracking handle. */
  createShipment(
    i: CreateShipmentInput,
  ): Promise<{ providerRef: string; trackingNumber: string; trackingUrl?: string }>;

  /** Current tracking status + history for a booked shipment. */
  getTracking(providerRef: string): Promise<TrackingResult>;
}
