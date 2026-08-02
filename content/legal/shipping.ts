import { site } from "@/content/site";
import {
  COURIER_FEE_AGOROT,
  FREE_SHIPPING_THRESHOLD_AGOROT,
} from "@/lib/commerce/shipping";
import { formatAgorot } from "@/lib/money";

import type { LegalDoc, LocalizedText } from "./types";

/**
 * משלוחים והחזרות / Shipping & Returns.
 *
 * The shipping numbers are IMPORTED from `lib/commerce/shipping.ts` and
 * formatted per locale, so this page can never advertise a fee or threshold
 * the checkout doesn't charge. The returns stance is the client's decision:
 * cancellable until shipment (full refund), NO returns on food once supplied
 * (טובין פסידים - ס' 14ג(ד) לחוק הגנת הצרכן), defective goods replaced or
 * refunded per law. Placeholders in [brackets] MUST be confirmed before
 * go-live (delivery ETA, pickup address, defect-report window).
 */

const fee: LocalizedText = {
  he: formatAgorot(COURIER_FEE_AGOROT, "he"),
  en: formatAgorot(COURIER_FEE_AGOROT, "en"),
};
const threshold: LocalizedText = {
  he: formatAgorot(FREE_SHIPPING_THRESHOLD_AGOROT, "he"),
  en: formatAgorot(FREE_SHIPPING_THRESHOLD_AGOROT, "en"),
};

export const shippingDoc: LegalDoc = {
  lastUpdatedISO: "2026-08-02",
  sections: [
    {
      id: "general",
      title: { he: "כללי", en: "General" },
      body: [
        {
          he: "מדיניות זו היא חלק בלתי נפרד מתנאי השימוש באתר, וכפופה להוראות חוק הגנת הצרכן, התשמ\"א-1981 ותקנותיו.",
          en: "This policy forms an integral part of the Site's Terms of Use and is subject to the Israeli Consumer Protection Law, 5741-1981, and its regulations.",
        },
      ],
    },
    {
      id: "methods",
      title: { he: "שיטות משלוח", en: "Delivery Methods" },
      body: [
        {
          he: "משלוח עם שליח עד הבית מוצע לכל חלקי הארץ. בנוסף ניתן לבחור באיסוף עצמי, ללא עלות, מ[כתובת נקודת האיסוף] - בתיאום מראש. ייתכן שיוצעו מעת לעת אפשרויות מסירה נוספות, כפי שיוצג בקופה בעת ההזמנה.",
          en: "Home courier delivery is offered throughout Israel. You may also choose free self-pickup from [pickup address], by prior arrangement. Additional delivery options may be offered from time to time, as shown at checkout when ordering.",
        },
      ],
    },
    {
      id: "cost",
      title: { he: "עלות משלוח", en: "Delivery Cost" },
      body: [
        {
          he: `משלוח עם שליח עולה ${fee.he} לכל הארץ, ובהזמנה בסך ${threshold.he} ומעלה (לאחר הנחות) - המשלוח חינם. איסוף עצמי - ללא עלות.`,
          en: `Courier delivery costs ${fee.en} nationwide, and orders of ${threshold.en} or more (after discounts) ship free. Self-pickup is free of charge.`,
        },
      ],
    },
    {
      id: "times",
      title: { he: "זמני אספקה", en: "Delivery Times" },
      body: [
        {
          he: "זמן האספקה המשוער הוא [1–2 ימי עסקים] ממועד אישור ההזמנה. ליישובים מרוחקים ייתכן זמן אספקה ארוך יותר. זמני האספקה הם הערכה בלבד ואינם מהווים התחייבות; עיכובים אצל חברת השליחויות, בחגים ובמועדים מיוחדים אינם בשליטת העסק.",
          en: "Estimated delivery time is [1–2 business days] from order confirmation. Remote areas may take longer. Delivery times are estimates only and are not a commitment; delays at the courier company or around holidays are beyond the Business's control.",
        },
      ],
    },
    {
      id: "receiving",
      title: { he: "קבלת המשלוח", en: "Receiving Your Order" },
      body: [
        {
          he: "באחריות הלקוח למסור כתובת ומספר טלפון מדויקים וזמינים. השאיר השליח את החבילה לפי הנחיית הנמען (למשל ליד הדלת) - האחריות לחבילה מרגע ההשארה היא על הנמען. עם קבלת המשלוח יש לאחסן את המוצרים בהתאם להנחיות שעל האריזה.",
          en: "It is the customer's responsibility to provide an accurate address and a reachable phone number. If the courier leaves the package per the recipient's instruction (for example, by the door), responsibility for the package passes to the recipient at that point. Upon receipt, store the products according to the on-pack instructions.",
        },
      ],
    },
    {
      id: "cancel-before",
      title: {
        he: "ביטול הזמנה לפני משלוח",
        en: "Cancelling Before Shipment",
      },
      body: [
        {
          he: `ניתן לבטל הזמנה בכל עת כל עוד לא נשלחה, בפנייה בדוא"ל ${site.email} או בטלפון \u2066${site.phoneDisplay}\u2069. במקרה כזה יוחזר מלוא הסכום ששולם לאמצעי התשלום המקורי בתוך 14 ימים.`,
          en: `You may cancel an order at any time before it has shipped by contacting us at ${site.email} or by phone at ${site.phoneDisplay}. In that case the full amount paid will be refunded to the original payment method within 14 days.`,
        },
      ],
    },
    {
      id: "returns",
      title: { he: "החזרת מוצרים", en: "Returns" },
      body: [
        {
          he: "המוצרים הנמכרים באתר הם מוצרי מזון, שהם \"טובין פסידים\" כמשמעותם בחוק הגנת הצרכן. בהתאם לסעיף 14ג(ד) לחוק, זכות הביטול בעסקת מכר מרחוק אינה חלה על טובין פסידים, ולפיכך לא ניתן להחזיר מוצרי מזון לאחר שסופקו.",
          en: 'The products sold on the Site are food products, which are "perishable goods" within the meaning of the Consumer Protection Law. Under section 14C(d) of the law, the distance-selling cancellation right does not apply to perishable goods, and therefore food products cannot be returned once supplied.',
        },
      ],
    },
    {
      id: "defects",
      title: { he: "מוצר פגום או אי-התאמה", en: "Defective or Incorrect Items" },
      body: [
        {
          he: "קיבלתם מוצר פגום, או מוצר שאינו תואם את ההזמנה? פנו אלינו בתוך [48 שעות] מקבלת המשלוח, רצוי בצירוף תמונה. לאחר בדיקה נציע החלפה או החזר כספי מלא, כולל דמי המשלוח, ללא דמי ביטול. אין באמור כדי לגרוע מזכויות הצרכן לפי כל דין.",
          en: "Received a defective item, or one that doesn't match your order? Contact us within [48 hours] of receiving the delivery, preferably with a photo. After review we will offer a replacement or a full refund, including delivery fees, with no cancellation fee. Nothing herein derogates from consumer rights under any applicable law.",
        },
      ],
    },
    {
      id: "contact",
      title: { he: "יצירת קשר", en: "Contact" },
      body: [
        {
          he: `לשאלות בענייני משלוחים והחזרות: דוא"ל ${site.email}, טלפון \u2066${site.phoneDisplay}\u2069.`,
          en: `For shipping and returns questions: email ${site.email}, phone ${site.phoneDisplay}.`,
        },
      ],
    },
  ],
};
