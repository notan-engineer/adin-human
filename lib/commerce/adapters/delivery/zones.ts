/**
 * Israel delivery-zone table + city→zone resolver.
 *
 * The offer is deliberately simple: regular courier at a FLAT nationwide fee
 * (`COURIER_FEE_AGOROT`, ₪40) plus free self-pickup - every zone carries
 * exactly those two methods. Zones still exist because ETAs genuinely differ
 * by region (⚠️ ETA days are PLACEHOLDERS - confirm with the carrier), and so
 * a future re-expansion (same-day, pickup points, lockers - see git history)
 * has its structure waiting.
 *
 * The free-courier-over-threshold rule lives in the stub adapter (`stub.ts`),
 * NOT in this table, so the table stays a pure list rate card.
 */

import type { DeliveryMethod, Locale } from "../../types";
import { COURIER_FEE_AGOROT } from "../../shipping";

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

/** The rate card: flat courier + free self-pickup everywhere; ETAs vary. */
export const ZONES: Record<ZoneId, Zone> = {
  center: {
    id: "center",
    label: { he: "גוש דן", en: "Gush Dan (Center)" },
    methods: [
      { method: "self_pickup", priceAgorot: 0, etaMinDays: 0, etaMaxDays: 1 },
      { method: "courier", priceAgorot: COURIER_FEE_AGOROT, etaMinDays: 1, etaMaxDays: 2 },
    ],
  },
  jerusalem: {
    id: "jerusalem",
    label: { he: "ירושלים", en: "Jerusalem" },
    methods: [
      { method: "self_pickup", priceAgorot: 0, etaMinDays: 0, etaMaxDays: 1 },
      { method: "courier", priceAgorot: COURIER_FEE_AGOROT, etaMinDays: 2, etaMaxDays: 3 },
    ],
  },
  north: {
    id: "north",
    label: { he: "צפון", en: "North" },
    methods: [
      { method: "self_pickup", priceAgorot: 0, etaMinDays: 0, etaMaxDays: 1 },
      { method: "courier", priceAgorot: COURIER_FEE_AGOROT, etaMinDays: 2, etaMaxDays: 4 },
    ],
  },
  south: {
    id: "south",
    label: { he: "דרום", en: "South" },
    methods: [
      { method: "self_pickup", priceAgorot: 0, etaMinDays: 0, etaMaxDays: 1 },
      { method: "courier", priceAgorot: COURIER_FEE_AGOROT, etaMinDays: 3, etaMaxDays: 5 },
    ],
  },
  eilat: {
    id: "eilat",
    label: { he: "אילת", en: "Eilat" },
    methods: [
      { method: "self_pickup", priceAgorot: 0, etaMinDays: 0, etaMaxDays: 1 },
      { method: "courier", priceAgorot: COURIER_FEE_AGOROT, etaMinDays: 4, etaMaxDays: 6 },
    ],
  },
  other: {
    id: "other",
    label: { he: "יתר הארץ", en: "Rest of Israel" },
    methods: [
      { method: "self_pickup", priceAgorot: 0, etaMinDays: 0, etaMaxDays: 1 },
      { method: "courier", priceAgorot: COURIER_FEE_AGOROT, etaMinDays: 3, etaMaxDays: 5 },
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
 * via `cityToZone`. PLACEHOLDER coverage - extend as needed.
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
