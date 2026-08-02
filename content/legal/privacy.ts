import { site } from "@/content/site";

import type { LegalDoc } from "./types";

/**
 * מדיניות פרטיות / Privacy Policy.
 *
 * Written to the amended notice duty of חוק הגנת הפרטיות, התשמ"א-1981 (תיקון
 * 13, in force 14.08.2025, ס' 11): whether providing data is voluntary and the
 * consequence of refusal, the purposes, the recipients, the controller's
 * identity and contact details, and the עיון/תיקון rights (ס' 13–14). The
 * facts below mirror the codebase deliberately: order/contact/newsletter data
 * only, payment fully external, a localStorage cart, and NO analytics — if
 * tracking is ever added, section "cookies" must be updated. Placeholders in
 * [brackets] MUST be filled before go-live.
 */
export const privacyDoc: LegalDoc = {
  lastUpdatedISO: "2026-08-02",
  sections: [
    {
      id: "general",
      title: { he: "כללי", en: "General" },
      body: [
        {
          he: '[שם העסק הרשמי], מס\' עוסק/ח.פ [מספר עוסק/ח.פ] (להלן: "העסק"), הוא בעל השליטה במידע האישי הנאסף באתר The Heuman Chef. העסק מכבד את פרטיות המשתמשים, ומדיניות זו מפרטת איזה מידע נאסף, לאילו מטרות וכיצד ניתן לממש את זכויותיכם.',
          en: '[Business legal name], business no. [Business/company number] (the "Business"), is the controller of the personal information collected on The Heuman Chef website. The Business respects users\' privacy; this policy describes what information is collected, for which purposes, and how you can exercise your rights.',
        },
      ],
    },
    {
      id: "collected",
      title: { he: "המידע הנאסף", en: "Information We Collect" },
      body: [
        {
          he: "בעת ביצוע הזמנה נאספים הפרטים הדרושים לטיפול בה: שם, כתובת דוא\"ל, טלפון וכתובת למשלוח. בנוסף נשמרות פניות שנשלחו בטופס יצירת הקשר, וכתובת דוא\"ל של מי שנרשם מרצונו לרשימת התפוצה.",
          en: "When you place an order we collect the details needed to fulfil it: name, email address, phone number and delivery address. We also keep messages sent through the contact form, and the email address of anyone who voluntarily subscribes to the mailing list.",
        },
        {
          he: "לא חלה עליכם חובה חוקית למסור מידע, ומסירתו תלויה ברצונכם החופשי; עם זאת, בלי הפרטים הדרושים לא ניתן להשלים הזמנה, לספק אותה או להשיב לפנייתכם.",
          en: "You are under no legal obligation to provide information, and doing so depends on your free will; however, without the required details we cannot complete an order, deliver it, or respond to your inquiry.",
        },
      ],
    },
    {
      id: "purposes",
      title: { he: "מטרות השימוש במידע", en: "How We Use the Information" },
      body: [
        {
          he: "המידע משמש לטיפול בהזמנות ולאספקתן, למתן שירות לקוחות ומענה לפניות, להפקת חשבוניות ולעמידה בדרישות הדין, ולשליחת דיוור — למי שנרשם לכך בלבד. העסק אינו מוכר מידע אישי ואינו עושה בו שימוש לפרופיילינג.",
          en: "The information is used to process and deliver orders, provide customer service and respond to inquiries, issue invoices and comply with legal requirements, and send mailings — only to those who subscribed. The Business does not sell personal information and does not use it for profiling.",
        },
      ],
    },
    {
      id: "payments",
      title: { he: "תשלומים", en: "Payments" },
      body: [
        {
          he: "התשלום מתבצע כולו בדפי תשלום מאובטחים של ספק סליקה חיצוני. פרטי כרטיס האשראי אינם מגיעים לאתר ואינם נשמרים אצל העסק; על עיבוד התשלום חלה גם מדיניות הפרטיות של ספק הסליקה.",
          en: "Payments are processed entirely on the secured pages of an external payment provider. Credit-card details never reach the Site and are not stored by the Business; the payment provider's own privacy policy also applies to payment processing.",
        },
      ],
    },
    {
      id: "sharing",
      title: {
        he: "העברת מידע לצדדים שלישיים",
        en: "Sharing with Third Parties",
      },
      body: [
        {
          he: "מידע מועבר לצדדים שלישיים רק ככל הנדרש לתפעול השירות: לחברת השליחויות (שם, טלפון וכתובת למשלוח), לספק הסליקה והחשבוניות, ולספקי אחסון ותשתית של האתר. ייתכן שחלק מהמידע יעובד בשרתים הנמצאים מחוץ לישראל, בכפוף לאמצעי הגנה מקובלים ולהוראות הדין.",
          en: "Information is shared with third parties only as needed to operate the service: the delivery company (name, phone and delivery address), the payment and invoicing provider, and the Site's hosting and infrastructure providers. Some information may be processed on servers located outside Israel, subject to accepted safeguards and applicable law.",
        },
        {
          he: "מעבר לכך, מידע יימסר רק אם קיימת חובה או הרשאה לכך על פי דין.",
          en: "Beyond that, information will be disclosed only where required or permitted by law.",
        },
      ],
    },
    {
      id: "cookies",
      title: { he: "עוגיות ואחסון מקומי", en: "Cookies and Local Storage" },
      body: [
        {
          he: "האתר עושה שימוש באחסון מקומי חיוני בלבד — שמירת תוכן עגלת הקניות בדפדפן שלכם. נכון למועד עדכון מדיניות זו, האתר אינו עושה שימוש בעוגיות פרסום, מעקב או ניתוח סטטיסטי. ככל שהדבר ישתנה, מדיניות זו תעודכן בהתאם.",
          en: "The Site uses essential local storage only — keeping your shopping-cart contents in your browser. As of the date of this policy, the Site does not use advertising, tracking or analytics cookies. Should this change, this policy will be updated accordingly.",
        },
      ],
    },
    {
      id: "mailing",
      title: { he: "דיוור ורשימת תפוצה", en: "Mailings and Newsletter" },
      body: [
        {
          he: "ההרשמה לרשימת התפוצה נעשית מרצון בלבד. כל דיוור כולל אפשרות הסרה מיידית, וניתן לבקש הסרה בכל עת גם בפנייה בדוא\"ל — בהתאם להוראות סעיף 30א לחוק התקשורת (בזק ושידורים), התשמ\"ב-1982, והוראות הדיוור הישיר בחוק הגנת הפרטיות.",
          en: "Subscribing to the mailing list is entirely voluntary. Every mailing includes an immediate unsubscribe option, and you may request removal at any time by email — in accordance with section 30A of the Israeli Communications Law, 5742-1982, and the direct-mailing provisions of the Privacy Protection Law.",
        },
      ],
    },
    {
      id: "security",
      title: { he: "אבטחת מידע", en: "Data Security" },
      body: [
        {
          he: "העסק מיישם אמצעי אבטחה מקובלים, בהתאם לתקנות הגנת הפרטיות (אבטחת מידע), התשע\"ז-2017. עם זאת, אין באפשרותנו להבטיח חסינות מוחלטת מפני חדירות או שימוש בלתי מורשה.",
          en: "The Business applies accepted security measures, in line with the Israeli Privacy Protection (Data Security) Regulations, 5777-2017. That said, absolute immunity from breaches or unauthorized use cannot be guaranteed.",
        },
      ],
    },
    {
      id: "rights",
      title: { he: "זכויותיכם", en: "Your Rights" },
      body: [
        {
          he: "בהתאם לסעיפים 13–14 לחוק הגנת הפרטיות, התשמ\"א-1981, אתם זכאים לעיין במידע האישי המוחזק אודותיכם ולבקש לתקן או למחוק מידע שאינו נכון, שלם או מעודכן, וכן להסיר את עצמכם מרשימת התפוצה. לפניות בנושא ראו סעיף \"עדכונים ויצירת קשר\" להלן.",
          en: "In accordance with sections 13–14 of the Privacy Protection Law, 5741-1981, you are entitled to review the personal information held about you, request correction or deletion of information that is inaccurate, incomplete or outdated, and remove yourself from the mailing list. See \"Updates and Contact\" below for how to reach us.",
        },
      ],
    },
    {
      id: "retention",
      title: { he: "שמירת מידע", en: "Data Retention" },
      body: [
        {
          he: "מידע אישי נשמר כל עוד הוא דרוש למטרות שלשמן נאסף, וכן כנדרש על פי דין — למשל שמירת רשומות חשבונאיות ומס לתקופות הקבועות בדין.",
          en: "Personal information is retained for as long as needed for the purposes for which it was collected, and as required by law — for example, keeping accounting and tax records for the statutory periods.",
        },
      ],
    },
    {
      id: "contact",
      title: { he: "עדכונים ויצירת קשר", en: "Updates and Contact" },
      body: [
        {
          he: "העסק רשאי לעדכן מדיניות זו מעת לעת; הנוסח המפורסם באתר הוא הנוסח המחייב.",
          en: "The Business may update this policy from time to time; the version published on the Site is the binding version.",
        },
        {
          he: `בכל שאלה או בקשה בענייני פרטיות ניתן לפנות אל [שם העסק הרשמי], [כתובת העסק], בדוא"ל ${site.email} או בטלפון \u2066${site.phoneDisplay}\u2069.`,
          en: `For any privacy question or request, contact [Business legal name], [Business address], at ${site.email} or by phone at ${site.phoneDisplay}.`,
        },
      ],
    },
  ],
};
