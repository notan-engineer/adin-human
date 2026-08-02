import type { Product } from "@/lib/catalog";

/**
 * ⚠️ PLACEHOLDER DATA - FOR REVIEW.
 * Prices (agorot), nutrition numbers, and marketing copy below are provisional
 * and MUST be confirmed by the brand before launch. Product facts drawn from
 * the real packaging (65g cherry-wood-smoked pouches, no preservatives,
 * gluten-free, high protein) are accurate; the numeric nutrition values and the
 * evocative tagline/description prose are placeholders.
 */

// Shared placeholder nutrition profile (per 100g). Same for every SKU until the
// brand supplies per-flavor lab values.
const PLACEHOLDER_PER_100G = {
  energyKcal: 410,
  proteinG: 52,
  fatG: 9,
  carbsG: 24,
  saltG: 3.1,
} as const;

const TRUST_BADGES = ["kosher", "high-protein", "no-preservatives", "gluten-free"];

export const products: Product[] = [
  {
    slug: "bbq",
    name: { he: "ברביקיו מעושן", en: "Smoked BBQ" },
    tagline: {
      he: "תיבול ברביקיו בסגנון טקסני",
      en: "Texas-style BBQ",
    },
    description: {
      he: "נתחי סינטה חתוכים ומנוקים ביד, מתובלים בתערובת תבלינים בסגנון ברביקיו טקסני, מעושנים ומיובשים במשך שעות בשבבי עץ דובדבן. כל ביס נושא את טעם המעשנה ואיזון תערובת התבלינים הביתית - מלוח, מתקתק ועשיר בתבלינים וטעמים.",
      en: "Hand-trimmed sirloin, seasoned with our signature Texas-style BBQ spice blend, then slowly smoked and dried for hours over cherry wood. Every bite delivers rich, smoky flavor balanced by our handcrafted seasoning - savory, subtly sweet, and packed with bold, authentic taste.",
    },
    flavor: "barbecue",
    heatLevel: 0,
    priceAgorot: 4000,
    weightGrams: 65,
    image: "bbq",
    badges: [...TRUST_BADGES, "bestseller"],
    proteinGrams: 34,
    nutrition: { per100g: { ...PLACEHOLDER_PER_100G } },
    glow: "#7E2A21",
    inStock: true,
  },
  {
    slug: "maple",
    name: { he: "מייפל צ'ילי מעושן", en: "Smoked Maple Chili" },
    tagline: {
      he: "מתיקות מייפל עם אש שמתגברת לאט.",
      en: "Maple sweetness with a slow-building fire.",
    },
    description: {
      he: "מייפל טהור פוגש תערובת פלפלים חריפים ועשן שבבי עץ דובדבן. המתיקות מגיעה קודם, ואז החום עולה ונשאר - טעם חם וממכר, לאוהבים קצת אש בתוך העשן.",
      en: "Pure maple meets a bold blend of hot peppers and the delicate smoke of cherry wood. The sweetness comes first, then a slow-building heat rises and lingers - warm, addictive, and crafted for those who like a little fire in their smoke.",
    },
    flavor: "maple-chili",
    heatLevel: 2,
    priceAgorot: 4000,
    weightGrams: 65,
    image: "maple",
    badges: [...TRUST_BADGES],
    proteinGrams: 34,
    nutrition: { per100g: { ...PLACEHOLDER_PER_100G } },
    glow: "#A8432B",
    inStock: true,
  },
  {
    slug: "honey",
    name: { he: "דבש ופלפל מעושן", en: "Smoked Honey Peppercorn" },
    tagline: {
      he: "דבש פרחי בר, פלפל שחור, לבן, ירוק, אדום וסצ'ואן גרוסים יחד.",
      en: "Wildflower honey, cracked black, white, red, green and Sichuan peppercorns",
    },
    description: {
      he: "דבש פרחי בר ישראלי ותערובת פלפלים גרוסים גס לביס מתקתק, עוקצני וארומטי. מתוק וחריף במידה שווה, עטוף בעשן עץ דובדבן.",
      en: "Israeli wildflower honey and a coarse blend of cracked peppers make a sweet, spicy, aromatic bite. Balanced equally between sweetness and heat, finished with the delicate smoke of cherry wood.",
    },
    flavor: "honey-peppercorn",
    heatLevel: 2,
    priceAgorot: 4000,
    weightGrams: 65,
    image: "honey",
    badges: [...TRUST_BADGES],
    proteinGrams: 34,
    nutrition: { per100g: { ...PLACEHOLDER_PER_100G } },
    glow: "#C67A2A",
    inStock: true,
  },
  {
    slug: "garlic",
    name: { he: "שום מעושן", en: "Smoked Garlic" },
    tagline: {
      he: "שום קלוי, שום שחור, עשבים ועשן שבבי עץ דובדבן.",
      en: "Roasted garlic, black garlic, herbs and cherry-wood smoke",
    },
    description: {
      he: "תערובת שומים ועשבי תיבול משתלבת בנתחי בקר חתוכים ביד ומיובשים בעשן שבבי עץ דובדבן. עשיר, מלוח וארומטי, מעט פיקנטי - ומשאיר טעם של עוד ועוד.",
      en: "A bold blend of garlic and herbs coats hand-cut beef, slowly smoked and dried over cherry wood. Rich, savory, and aromatic with a gentle kick of heat - every bite leaves you craving more.",
    },
    flavor: "garlic",
    heatLevel: 1,
    priceAgorot: 4000,
    weightGrams: 65,
    image: "garlic",
    badges: [...TRUST_BADGES, "bestseller"],
    proteinGrams: 34,
    nutrition: { per100g: { ...PLACEHOLDER_PER_100G } },
    glow: "#C9A24B",
    inStock: true,
  },
  {
    slug: "zaatar",
    name: { he: "זעתר מעושן", en: "Za'atar Smoked" },
    tagline: {
      he: "זעתר בר, עשבוני ומעושן.",
      en: "Wild za'atar, herbaceous and smoky.",
    },
    description: {
      he: "מחווה למדרונות של ישראל - זעתר ריחני, טימין, רוזמרין ועוד עשבים מקומיים על בקר מעושן בעדינות. אדמתי, עשבוני ורך, בלי חריפות בכלל: עשן טהור וארומטי.",
      en: "A tribute to the hills of Israel - fragrant za'atar, thyme, rosemary, and other local herbs over gently smoked beef. Earthy, herbaceous, and perfectly smooth with no heat at all, finished with pure, aromatic cherry-wood smoke.",
    },
    flavor: "zaatar",
    heatLevel: 0,
    priceAgorot: 4000,
    weightGrams: 65,
    image: "zaatar",
    badges: [...TRUST_BADGES],
    proteinGrams: 34,
    nutrition: { per100g: { ...PLACEHOLDER_PER_100G } },
    glow: "#4E5B2E",
    inStock: true,
  },
  // "skewers" launching later - re-enable when ready.
];
