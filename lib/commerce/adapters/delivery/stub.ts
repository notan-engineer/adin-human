/**
 * Delivery provider — STUB adapter, driven by the Israel zone table in
 * `zones.ts`. Deterministic (no Math.random): quotes come straight from the
 * rate card, and pickup points / shipments / tracking are fixed fakes derived
 * from the input. Real carrier adapters (HFD, Israel Post, Wolt Drive, …) will
 * implement the same `DeliveryProvider` port.
 */

import type {
  DeliveryProvider,
  QuoteRatesInput,
  CreateShipmentInput,
  TrackingResult,
} from "../../ports/delivery";
import type {
  DeliveryMethod,
  Locale,
  PickupPoint,
  RateQuote,
} from "../../types";
import { ZONES, cityToZone } from "./zones";

/**
 * PLACEHOLDER — free courier shipping when the cart subtotal reaches this
 * threshold (₪199 = 19,900 agorot). Confirm the threshold with the brand before
 * launch. Applies to `courier` (and `same_day`) methods only.
 */
export const FREE_COURIER_THRESHOLD_AGOROT = 19_900;

/** Bilingual display labels per delivery method. */
const METHOD_LABELS: Record<DeliveryMethod, Record<Locale, string>> = {
  self_pickup: { he: "איסוף עצמי", en: "Self pickup" },
  pickup_point: { he: "נקודת איסוף", en: "Pickup point" },
  locker: { he: "לוקר", en: "Locker" },
  courier: { he: "שליח עד הבית", en: "Home courier" },
  same_day: { he: "משלוח באותו יום", en: "Same-day delivery" },
};

/** Methods that qualify for the free-shipping threshold. */
const FREE_ELIGIBLE_METHODS: ReadonlySet<DeliveryMethod> = new Set([
  "courier",
  "same_day",
]);

export class StubDeliveryProvider implements DeliveryProvider {
  readonly id = "delivery-stub";

  readonly supportedMethods: DeliveryMethod[] = [
    "self_pickup",
    "pickup_point",
    "locker",
    "courier",
    "same_day",
  ];

  async quoteRates(i: QuoteRatesInput): Promise<RateQuote[]> {
    const zone = cityToZone(i.destination.city);
    const subtotalAgorot = i.items.reduce(
      (sum, item) => sum + item.unitPriceAgorot * item.qty,
      0,
    );
    const freeShipping = subtotalAgorot >= FREE_COURIER_THRESHOLD_AGOROT;

    return ZONES[zone].methods
      .filter((m) => !i.method || m.method === i.method)
      .map((m) => {
        const qualifiesForFree =
          freeShipping && FREE_ELIGIBLE_METHODS.has(m.method);
        return {
          providerId: this.id,
          method: m.method,
          serviceCode: `${zone}_${m.method}`,
          label: METHOD_LABELS[m.method],
          priceAgorot: qualifiesForFree ? 0 : m.priceAgorot,
          etaMinDays: m.etaMinDays,
          etaMaxDays: m.etaMaxDays,
        };
      });
  }

  async listPickupPoints(
    near: { city?: string; lat?: number; lng?: number },
    opts?: { type?: PickupPoint["type"] },
  ): Promise<PickupPoint[]> {
    const city = near.city?.trim() || "תל אביב";
    // Deterministic fake coordinates: a fixed base per call, offset by index.
    const baseLat = near.lat ?? 32.0853;
    const baseLng = near.lng ?? 34.7818;
    const token = city.replace(/\s+/g, "-");

    const points: PickupPoint[] = [
      {
        id: `pp_${token}_1`,
        name: `נקודת איסוף ${city} - מרכז`,
        type: "pickup_point",
        address: `רחוב הרצל 10, ${city}`,
        lat: baseLat + 0.001,
        lng: baseLng + 0.001,
        distanceMeters: 350,
        openingHours: "א׳–ה׳ 09:00–19:00, ו׳ 09:00–13:00",
      },
      {
        id: `locker_${token}_1`,
        name: `לוקר ${city} - תחנת דלק`,
        type: "locker",
        address: `שדרות בן גוריון 42, ${city}`,
        lat: baseLat - 0.002,
        lng: baseLng + 0.0015,
        distanceMeters: 780,
        openingHours: "24/7",
      },
      {
        id: `pp_${token}_2`,
        name: `נקודת איסוף ${city} - צפון`,
        type: "pickup_point",
        address: `רחוב ויצמן 3, ${city}`,
        lat: baseLat + 0.004,
        lng: baseLng - 0.001,
        distanceMeters: 1250,
        openingHours: "א׳–ה׳ 08:00–20:00",
      },
    ];

    return opts?.type ? points.filter((p) => p.type === opts.type) : points;
  }

  async createShipment(
    i: CreateShipmentInput,
  ): Promise<{ providerRef: string; trackingNumber: string; trackingUrl?: string }> {
    const providerRef = `ship_${i.orderId}`;
    const trackingNumber = `HC${i.orderId.replace(/[^0-9]/g, "") || "0"}IL`;
    return {
      providerRef,
      trackingNumber,
      trackingUrl: `https://track.example.com/${trackingNumber}`,
    };
  }

  async getTracking(providerRef: string): Promise<TrackingResult> {
    const trackingNumber = providerRef.replace(/^ship_/, "");
    return {
      status: "in_transit",
      trackingUrl: `https://track.example.com/${trackingNumber}`,
      events: [
        {
          status: "label_created",
          timestampISO: "2026-01-01T08:00:00.000Z",
          description: "נוצרה תווית משלוח",
        },
        {
          status: "in_transit",
          timestampISO: "2026-01-01T12:00:00.000Z",
          description: "החבילה בדרך",
        },
      ],
    };
  }
}
