import type { Product } from "@/lib/catalog";

/**
 * ⚠️ PLACEHOLDER DATA — FOR REVIEW.
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

const TRUST_BADGES = ["high-protein", "no-preservatives", "gluten-free"];

export const products: Product[] = [
  {
    slug: "bbq",
    name: { he: "ברביקיו מעושן", en: "Smoked BBQ" },
    tagline: {
      he: "עשן איטי, פחם מתקתק.",
      en: "Low-and-slow smoke, sweet ember char.",
    },
    description: {
      he: "נתחי בקר ישראלי חתוכים ביד, מוברשים ברוטב ברביקיו כהה ועמוק ומעושנים שעות על עצי דובדבן. כל ביס נושא את חום המעשנה — מתוק, מלוח, ועם קצוות חרוכים בדיוק כמו שצריך.",
      en: "Hand-cut Israeli beef basted in a dark, molasses-deep barbecue glaze, then kissed by hours of cherry-wood smoke. Every bite carries the warmth of the pit — sweet, savory, and unmistakably charred at the edges.",
    },
    flavor: "barbecue",
    heatLevel: 1,
    priceAgorot: 4200,
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
      he: "מייפל ענברי פוגש חריפות צ'ילי יציבה על עשן דובדבן עמוק. המתיקות מגיעה קודם, ואז החום עולה ונשאר — טעם נועז וזוהר, לאלה שאוהבים קצת אש בתוך העשן.",
      en: "Amber maple meets a steady chili heat over deep cherry-wood smoke. The sweetness lands first, then the warmth rises and lingers — a bold, glowing flavor built for those who like a little fire in their smoke.",
    },
    flavor: "maple-chili",
    heatLevel: 2,
    priceAgorot: 4400,
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
      he: "דבש זהוב, פלפל שחור גרוס.",
      en: "Golden honey, cracked black pepper.",
    },
    description: {
      he: "דבש פרחי בר מזגג נתחי בקר מעושנים ורכים, ומסתיים בפלפל שחור גרוס גס לביס חמים וארומטי. מתוק וחריף במידה שווה, עטוף בעשן דובדבן איטי.",
      en: "Wildflower honey glazes tender smoked beef, finished with coarsely cracked black peppercorns for a warm, aromatic bite. Sweet and peppery in equal measure, wrapped in slow cherry-wood smoke.",
    },
    flavor: "honey-peppercorn",
    heatLevel: 1,
    priceAgorot: 4400,
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
      he: "שום קלוי עמוק, עשן טהור.",
      en: "Deep roasted garlic, pure smoke.",
    },
    description: {
      he: "שום קלוי לאט משתלב בנתחי בקר חתוכים ביד ומיובש על גחלי דובדבן. עשיר, מלוח וארומטי — עשן של טהרנים עם נשמת שום נועזת שנשארת הרבה אחרי הביס האחרון.",
      en: "Slow-roasted garlic folded into hand-cut beef and cured over cherry-wood embers. Savory, rich, and aromatic — a purist's smoke with a bold garlic soul that lingers long after the last bite.",
    },
    flavor: "garlic",
    heatLevel: 1,
    priceAgorot: 4200,
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
      he: "מחווה למדרונות של ישראל — זעתר ריחני, שומשום קלוי ונגיעה של סומק על בקר מעושן בעדינות. אדמתי, עשבוני ורך, בלי חריפות בכלל: עשן טהור וארומטי.",
      en: "A tribute to the hillsides of Israel — fragrant za'atar, toasted sesame, and a whisper of sumac over gently smoked beef. Earthy, herbal, and mellow, with no heat at all: pure, aromatic smoke.",
    },
    flavor: "zaatar",
    heatLevel: 0,
    priceAgorot: 4200,
    weightGrams: 65,
    image: "zaatar",
    badges: [...TRUST_BADGES],
    proteinGrams: 34,
    nutrition: { per100g: { ...PLACEHOLDER_PER_100G } },
    glow: "#4E5B2E",
    inStock: true,
  },
  {
    slug: "skewers",
    name: { he: "קיסמי בקר מיובש", en: "Beef Jerky Skewers" },
    tagline: {
      he: "בקר מעושן, על מקל.",
      en: "Smoked beef, on a stick.",
    },
    description: {
      he: "הבקר המעושן החתום שלנו, נדחס ומיובש על קיסמים דקים לנשנוש קליל וזקוף. אותו עומק של עשן דובדבן ואותו חלבון גבוה, בפורמט שובב שנוצר לחלוק.",
      en: "Our signature smoked beef, pressed and dried onto slender skewers for an easy, upright snack. The same cherry-wood depth and high protein, in a playful grab-and-go form built for sharing.",
    },
    flavor: "skewers",
    heatLevel: 1,
    priceAgorot: 3400,
    weightGrams: 40,
    image: "skewers",
    badges: [...TRUST_BADGES],
    proteinGrams: 34,
    nutrition: { per100g: { ...PLACEHOLDER_PER_100G } },
    glow: "#8A6D3B",
    inStock: true,
  },
];
