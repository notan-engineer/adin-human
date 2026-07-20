import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["he", "en"],
  defaultLocale: "he",
  // Hebrew is served unprefixed (`/`); English is prefixed (`/en`).
  localePrefix: "as-needed",
  // Hebrew-first brand: `/` always serves Hebrew. Do NOT redirect based on the
  // browser's Accept-Language; users opt into English via the locale switcher.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
