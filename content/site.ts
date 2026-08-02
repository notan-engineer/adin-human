/**
 * Single source of truth for brand contact details and social handles.
 *
 * ⚠️ PLACEHOLDER - the email, phone and social handles below are provisional
 * and MUST be confirmed by the brand before launch. The brand name and founder
 * are accurate.
 */

export const site = {
  name: "The Heuman Chef",
  founder: "Adin Human",
  email: "theheumanchef@gmail.com",
  /** Display form - always render inside dir="ltr" so RTL pages don't flip it. */
  phoneDisplay: "054-541-9191",
  /** tel: href form - digits and leading + only. */
  phoneHref: "+972545419191",
  social: {
    instagram: "https://instagram.com/theheumanchef",
    facebook: "https://facebook.com/theheumanchef",
  },
} as const;
