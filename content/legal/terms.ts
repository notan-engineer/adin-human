import { site } from "@/content/site";

import type { LegalDoc } from "./types";

/**
 * תנאי שימוש / Terms of Use.
 *
 * Drafted to standard Israeli small-shop practice: the mandatory
 * distance-selling disclosures (חוק הגנת הצרכן, התשמ"א-1981, ס' 14ג) plus the
 * customary hedges (התמונות להמחשה, ט.ל.ח, עדכון מעת לעת), kept deliberately
 * general. Consumer-law rights are cogent (ס' 36) - nothing here waives them,
 * and the text says so explicitly. NOT reviewed by a lawyer; placeholders in
 * [brackets] MUST be filled before go-live.
 */
export const termsDoc: LegalDoc = {
  lastUpdatedISO: "2026-08-02",
  sections: [
    {
      id: "general",
      title: { he: "כללי", en: "General" },
      body: [
        {
          he: 'אתר The Heuman Chef (להלן: "האתר") מופעל על ידי [שם העסק הרשמי], מס\' עוסק/ח.פ [מספר עוסק/ח.פ], שכתובתו [כתובת העסק] (להלן: "העסק"). השימוש באתר - לרבות גלישה, יצירת קשר וביצוע הזמנות - מהווה הסכמה מלאה לתנאי שימוש אלה ולמדיניות הפרטיות של האתר. אם אינכם מסכימים לתנאים, אנא הימנעו משימוש באתר.',
          en: 'The Heuman Chef website (the "Site") is operated by [Business legal name], business no. [Business/company number], of [Business address] (the "Business"). Using the Site - including browsing, contacting us and placing orders - constitutes full acceptance of these Terms of Use and of the Site\'s Privacy Policy. If you do not agree to these terms, please refrain from using the Site.',
        },
        {
          he: "התנאים מנוסחים בלשון רבים מטעמי נוחות בלבד ופונים לכל המגדרים.",
          en: "These terms are phrased in the plural for convenience only and address all genders equally.",
        },
      ],
    },
    {
      id: "eligibility",
      title: { he: "כשירות ושימוש באתר", en: "Eligibility and Use of the Site" },
      body: [
        {
          he: "הרכישה באתר מיועדת לבני 18 ומעלה, לשימוש אישי וביתי שאינו מסחרי. אין לעשות באתר כל שימוש שאינו כדין, הפוגע בצדדים שלישיים או המשבש את פעילות האתר. העסק רשאי, לפי שיקול דעתו הסביר, להגביל או לחסום גישה לאתר במקרה של שימוש לרעה.",
          en: "Purchases on the Site are intended for persons aged 18 or older, for personal, non-commercial use. The Site may not be used unlawfully, in a way that harms third parties, or in a way that disrupts its operation. The Business may, at its reasonable discretion, restrict or block access to the Site in cases of misuse.",
        },
      ],
    },
    {
      id: "products",
      title: { he: "המוצרים", en: "The Products" },
      body: [
        {
          he: "האתר מציע מוצרי מזון בעבודת יד. התמונות באתר נועדו להמחשה בלבד; ייתכנו הבדלים קלים במראה, בגוון ובמרקם בין אצווה לאצווה - כמקובל במוצרים המיוצרים בעבודת יד.",
          en: "The Site offers handcrafted food products. Product images are for illustration only; slight variations in appearance, shade and texture may occur between batches - as is customary for handmade products.",
        },
        {
          he: "מידע על רכיבים, אלרגנים, ערכים תזונתיים והוראות אחסון מופיע על גבי אריזת המוצר. יש לעיין במידע שעל האריזה לפני הצריכה ולאחסן את המוצרים בהתאם להנחיות.",
          en: "Information about ingredients, allergens, nutritional values and storage instructions appears on the product packaging. Please review the on-pack information before consumption and store the products according to the instructions.",
        },
      ],
    },
    {
      id: "prices",
      title: { he: "מחירים", en: "Prices" },
      body: [
        {
          he: "כל המחירים באתר נקובים בשקלים חדשים וכוללים מע\"מ כדין. העסק רשאי לעדכן מחירים, מבצעים והנחות (לרבות הנחת מארזים) בכל עת; המחיר המחייב הוא המחיר שהוצג באתר במועד השלמת ההזמנה. ט.ל.ח.",
          en: 'All prices on the Site are stated in New Israeli Shekels and include VAT as required by law. The Business may update prices, promotions and discounts (including the bundle discount) at any time; the binding price is the price displayed on the Site when the order is completed. E&OE (errors and omissions excepted).',
        },
      ],
    },
    {
      id: "ordering",
      title: { he: "ביצוע הזמנה", en: "Placing an Order" },
      body: [
        {
          he: "הזמנה נחשבת שהושלמה עם אישור התשלום ושליחת אישור הזמנה לכתובת הדוא\"ל שנמסרה. ביצוע ההזמנות כפוף לזמינות המוצרים במלאי.",
          en: "An order is considered complete upon payment approval and the sending of an order confirmation to the email address provided. Orders are subject to product availability.",
        },
        {
          he: "העסק רשאי שלא לאשר הזמנה או לבטלה - בין היתר בשל חוסר במלאי, טעות סופר במחיר או בתיאור, או חשש סביר לשימוש לרעה - ובמקרה כזה יוחזר ללקוח מלוא הסכום ששולם, וזה יהיה הסעד היחיד בגין אי-אישור ההזמנה.",
          en: "The Business may decline or cancel an order - including due to stock shortage, a clerical error in price or description, or a reasonable suspicion of misuse - in which case the customer will receive a full refund of the amount paid, which shall be the sole remedy for such non-acceptance.",
        },
      ],
    },
    {
      id: "payment",
      title: { he: "תשלום", en: "Payment" },
      body: [
        {
          he: "התשלום באתר מתבצע באמצעות דף תשלום מאובטח של ספק סליקה חיצוני. פרטי כרטיס האשראי נמסרים ישירות לספק הסליקה, אינם עוברים דרך האתר ואינם נשמרים אצל העסק. עם השלמת התשלום תישלח חשבונית מס/קבלה דיגיטלית לכתובת הדוא\"ל שנמסרה.",
          en: "Payment is processed through a secure hosted payment page of an external payment provider. Credit-card details are provided directly to the payment provider, do not pass through the Site and are not stored by the Business. Upon completion of payment, a digital tax invoice/receipt is sent to the email address provided.",
        },
      ],
    },
    {
      id: "delivery",
      title: { he: "אספקה", en: "Delivery" },
      body: [
        {
          he: "אספקת המוצרים מתבצעת בהתאם למדיניות המשלוחים וההחזרות המפורסמת באתר, המתעדכנת מעת לעת ומהווה חלק בלתי נפרד מתנאים אלה.",
          en: "Products are supplied in accordance with the Shipping & Returns policy published on the Site, which is updated from time to time and forms an integral part of these terms.",
        },
      ],
    },
    {
      id: "cancellation",
      title: { he: "ביטול עסקה והחזרות", en: "Cancellation and Returns" },
      body: [
        {
          he: "ביטול עסקה ייעשה בהתאם להוראות חוק הגנת הצרכן, התשמ\"א-1981 ותקנותיו. מוצרי מזון הם \"טובין פסידים\" כמשמעותם בחוק, ולכן זכות הביטול בעסקת מכר מרחוק אינה חלה עליהם לאחר אספקתם (סעיף 14ג(ד) לחוק).",
          en: 'Cancellations are governed by the Israeli Consumer Protection Law, 5741-1981, and its regulations. Food products are "perishable goods" within the meaning of the law, and therefore the distance-selling cancellation right does not apply to them once supplied (section 14C(d) of the law).',
        },
        {
          he: "ניתן לבטל הזמנה כל עוד לא נשלחה, בהחזר מלא. הטיפול במוצר פגום או באי-התאמה מפורט בעמוד משלוחים והחזרות. אין באמור בתנאים אלה כדי לגרוע מזכויות הצרכן לפי כל דין.",
          en: "An order may be cancelled at any time before it has shipped, for a full refund. Handling of defective or non-conforming products is detailed on the Shipping & Returns page. Nothing in these terms derogates from consumer rights under any applicable law.",
        },
      ],
    },
    {
      id: "liability",
      title: { he: "אחריות והגבלת אחריות", en: "Liability" },
      body: [
        {
          he: "האתר ותכניו מוצעים כמות שהם (AS-IS). העסק פועל לכך שהאתר יהיה זמין ותקין, אך אינו מתחייב לזמינות רציפה או להיעדר תקלות. העסק לא יישא באחריות לנזק עקיף או תוצאתי הנובע מהשימוש באתר, וכן לא לעיכוב או כשל שמקורם בכוח עליון או בגורמים שאינם בשליטתו הסבירה.",
          en: "The Site and its content are provided as-is. The Business works to keep the Site available and functioning but does not warrant uninterrupted availability or freedom from faults. The Business shall not be liable for indirect or consequential damage arising from use of the Site, nor for delays or failures caused by force majeure or factors beyond its reasonable control.",
        },
        {
          he: "אין באמור כדי לגרוע מזכויות שאינן ניתנות להתניה על פי דין.",
          en: "Nothing herein derogates from rights that cannot be waived under applicable law.",
        },
      ],
    },
    {
      id: "ip",
      title: { he: "קניין רוחני", en: "Intellectual Property" },
      body: [
        {
          he: "כל זכויות הקניין הרוחני באתר - לרבות השם המסחרי, הלוגו, הצילומים, העיצוב והטקסטים - שייכות לעסק או לבעלי הזכויות מטעמו. אין להעתיק, לפרסם או לעשות שימוש מסחרי בתכני האתר ללא הסכמת העסק מראש ובכתב.",
          en: "All intellectual-property rights in the Site - including the trade name, logo, photographs, design and texts - belong to the Business or its licensors. Site content may not be copied, published or used commercially without the Business's prior written consent.",
        },
      ],
    },
    {
      id: "privacy",
      title: { he: "פרטיות", en: "Privacy" },
      body: [
        {
          he: "השימוש במידע אישי הנמסר באתר מוסדר במדיניות הפרטיות של האתר, המהווה חלק בלתי נפרד מתנאים אלה.",
          en: "The use of personal information provided on the Site is governed by the Site's Privacy Policy, which forms an integral part of these terms.",
        },
      ],
    },
    {
      id: "changes",
      title: { he: "שינוי התנאים", en: "Changes to These Terms" },
      body: [
        {
          he: "העסק רשאי לעדכן תנאי שימוש אלה מעת לעת, לפי שיקול דעתו. הנוסח המפורסם באתר במועד השימוש הוא הנוסח המחייב.",
          en: "The Business may update these Terms of Use from time to time at its discretion. The version published on the Site at the time of use is the binding version.",
        },
      ],
    },
    {
      id: "law",
      title: {
        he: "דין, סמכות שיפוט ויצירת קשר",
        en: "Governing Law, Jurisdiction and Contact",
      },
      body: [
        {
          he: "על תנאים אלה ועל השימוש באתר יחול דין מדינת ישראל בלבד, וסמכות השיפוט הייחודית נתונה לבתי המשפט המוסמכים ב[עיר].",
          en: "These terms and the use of the Site are governed exclusively by the laws of the State of Israel, and exclusive jurisdiction is vested in the competent courts of [City].",
        },
        {
          he: `לשאלות בנוגע לתנאים אלה ניתן לפנות אלינו בדוא"ל ${site.email} או בטלפון \u2066${site.phoneDisplay}\u2069.`,
          en: `For questions about these terms, contact us at ${site.email} or by phone at ${site.phoneDisplay}.`,
        },
      ],
    },
  ],
};
