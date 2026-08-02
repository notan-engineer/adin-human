/**
 * Israel delivery-zone table + city→zone resolver.
 *
 * ⚠️ PLACEHOLDER DATA — FOR REVIEW. Every price (agorot) and ETA (business days)
 * below is a provisional placeholder and MUST be confirmed with the carrier(s)
 * and the brand before launch. Prices are integer agorot (₪1 = 100 agorot).
 *
 * Zones:
 *   center    — Gush Dan (תל אביב, רמת גן, גבעתיים, הרצליה, חולון, בת ים,
 *               פתח תקווה, ראשון לציון …). Only zone with locker. Same-day is
 *               now offered nationwide (every zone), pending carrier confirmation.
 *   jerusalem — ירושלים.
 *   north     — חיפה + הצפון.
 *   south     — באר שבע + הדרום.
 *   eilat     — אילת (courier only; remote).
 *   other     — default fallback for anything unmatched.
 *
 * The free-courier-over-threshold rule lives in the stub adapter
 * (`stub.ts` → FREE_COURIER_THRESHOLD_AGOROT), NOT in this table, so the table
 * stays a pure list rate card.
 */

import type { DeliveryMethod, Locale } from "../../types";

export type ZoneId =
  | "center"
  | "jerusalem"
  | "north"
  | "south"
  | "eilat"
  | "other";

/** A single method offered within a zone, with its list price and ETA. */
export interface ZoneMethod {
  method: DeliveryMethod;
  /** List price in integer agorot (before the free-shipping threshold rule). */
  priceAgorot: number;
  etaMinDays: number;
  etaMaxDays: number;
}

export interface Zone {
  id: ZoneId;
  label: Record<Locale, string>;
  methods: ZoneMethod[];
}

/** The rate card. PLACEHOLDER numbers — confirm before go-live. */
export const ZONES: Record<ZoneId, Zone> = {
  center: {
    id: "center",
    label: { he: "גוש דן", en: "Gush Dan (Center)" },
    methods: [
      { method: "self_pickup", priceAgorot: 0, etaMinDays: 0, etaMaxDays: 1 },
      { method: "locker", priceAgorot: 1200, etaMinDays: 1, etaMaxDays: 3 },
      { method: "pickup_point", priceAgorot: 1500, etaMinDays: 1, etaMaxDays: 3 },
      { method: "same_day", priceAgorot: 4500, etaMinDays: 0, etaMaxDays: 1 },
      { method: "courier", priceAgorot: 3500, etaMinDays: 1, etaMaxDays: 2 },
    ],
  },
  jerusalem: {
    id: "jerusalem",
    label: { he: "ירושלים", en: "Jerusalem" },
    methods: [
      { method: "self_pickup", priceAgorot: 0, etaMinDays: 0, etaMaxDays: 1 },
      { method: "pickup_point", priceAgorot: 1800, etaMinDays: 2, etaMaxDays: 4 },
      { method: "same_day", priceAgorot: 4500, etaMinDays: 0, etaMaxDays: 1 },
      { method: "courier", priceAgorot: 3500, etaMinDays: 2, etaMaxDays: 3 },
    ],
  },
  north: {
    id: "north",
    label: { he: "צפון", en: "North" },
    methods: [
      { method: "self_pickup", priceAgorot: 0, etaMinDays: 0, etaMaxDays: 1 },
      { method: "pickup_point", priceAgorot: 2000, etaMinDays: 3, etaMaxDays: 5 },
      { method: "same_day", priceAgorot: 4500, etaMinDays: 0, etaMaxDays: 1 },
      { method: "courier", priceAgorot: 3500, etaMinDays: 2, etaMaxDays: 4 },
    ],
  },
  south: {
    id: "south",
    label: { he: "דרום", en: "South" },
    methods: [
      { method: "pickup_point", priceAgorot: 2200, etaMinDays: 4, etaMaxDays: 6 },
      { method: "same_day", priceAgorot: 4500, etaMinDays: 0, etaMaxDays: 1 },
      { method: "courier", priceAgorot: 3500, etaMinDays: 3, etaMaxDays: 5 },
    ],
  },
  eilat: {
    id: "eilat",
    label: { he: "אילת", en: "Eilat" },
    methods: [
      { method: "same_day", priceAgorot: 4500, etaMinDays: 0, etaMaxDays: 1 },
      { method: "courier", priceAgorot: 3500, etaMinDays: 4, etaMaxDays: 6 },
    ],
  },
  other: {
    id: "other",
    label: { he: "יתר הארץ", en: "Rest of Israel" },
    methods: [
      { method: "self_pickup", priceAgorot: 0, etaMinDays: 0, etaMaxDays: 1 },
      { method: "pickup_point", priceAgorot: 2000, etaMinDays: 4, etaMaxDays: 6 },
      { method: "same_day", priceAgorot: 4500, etaMinDays: 0, etaMaxDays: 1 },
      { method: "courier", priceAgorot: 3500, etaMinDays: 3, etaMaxDays: 5 },
    ],
  },
};

/**
 * Normalize a city string for lookup: trim, lowercase, turn hyphens/maqaf into
 * spaces, drop quotes/geresh/gershayim, collapse whitespace. So "Tel Aviv-Yafo"
 * and "תל אביב-יפו" resolve the same as their spaced forms.
 */
function normalizeCity(city: string): string {
  return city
    .trim()
    .toLowerCase()
    .replace(/[-־]/g, " ")
    .replace(/["'׳״]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Lookup table of normalized city name → zone. Hebrew and English (transliterated)
 * spellings both map to the same zone. Anything not listed falls back to "other"
 * via `cityToZone`. PLACEHOLDER coverage — extend as needed.
 */
const CITY_TO_ZONE: Record<string, ZoneId> = {
  // ── center (Gush Dan) ──
  "תל אביב": "center",
  "תל אביב יפו": "center",
  "רמת גן": "center",
  "גבעתיים": "center",
  "הרצליה": "center",
  "חולון": "center",
  "בת ים": "center",
  "פתח תקווה": "center",
  "ראשון לציון": "center",
  "רמת השרון": "center",
  "בני ברק": "center",
  "tel aviv": "center",
  "tel aviv yafo": "center",
  "ramat gan": "center",
  "givatayim": "center",
  "herzliya": "center",
  "herzliyya": "center",
  "holon": "center",
  "bat yam": "center",
  "petah tikva": "center",
  "petach tikva": "center",
  "rishon lezion": "center",
  "rishon letzion": "center",
  "rishon le zion": "center",
  "ramat hasharon": "center",
  "bnei brak": "center",

  // ── jerusalem ──
  "ירושלים": "jerusalem",
  "jerusalem": "jerusalem",

  // ── north ──
  "חיפה": "north",
  "קריית ביאליק": "north",
  "קריית מוצקין": "north",
  "קריית ים": "north",
  "קריית אתא": "north",
  "נהריה": "north",
  "עכו": "north",
  "טבריה": "north",
  "צפת": "north",
  "כרמיאל": "north",
  "נצרת": "north",
  "עפולה": "north",
  "haifa": "north",
  "nahariya": "north",
  "acre": "north",
  "akko": "north",
  "tiberias": "north",
  "safed": "north",
  "tzfat": "north",
  "karmiel": "north",
  "nazareth": "north",
  "afula": "north",

  // ── south ──
  "באר שבע": "south",
  "אשקלון": "south",
  "אשדוד": "south",
  "קריית גת": "south",
  "דימונה": "south",
  "אופקים": "south",
  "שדרות": "south",
  "נתיבות": "south",
  "ערד": "south",
  "beer sheva": "south",
  "beersheba": "south",
  "ashkelon": "south",
  "ashdod": "south",
  "kiryat gat": "south",
  "dimona": "south",
  "ofakim": "south",
  "sderot": "south",
  "netivot": "south",
  "arad": "south",

  // ── eilat ──
  "אילת": "eilat",
  "eilat": "eilat",
};

/** Resolve a city name to its delivery zone; unknown cities → "other". */
export function cityToZone(city: string): ZoneId {
  if (!city) return "other";
  return CITY_TO_ZONE[normalizeCity(city)] ?? "other";
}
