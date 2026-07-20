/**
 * Single source of truth for brand contact details and social handles.
 *
 * ⚠️ PLACEHOLDER — the email, phone and social handles below are provisional
 * and MUST be confirmed by the brand before launch. The brand name and founder
 * are accurate.
 */

export const site = {
  name: "The Heuman Chef",
  founder: "Adin Human",
  email: "hello@heumanchef.com",
  /** Display form — always render inside dir="ltr" so RTL pages don't flip it. */
  phoneDisplay: "+972 50-000-0000",
  /** tel: href form — digits and leading + only. */
  phoneHref: "+97250000000",
  social: {
    instagram: "https://instagram.com/theheumanchef",
    facebook: "https://facebook.com/theheumanchef",
    tiktok: "https://tiktok.com/@theheumanchef",
  },
} as const;
