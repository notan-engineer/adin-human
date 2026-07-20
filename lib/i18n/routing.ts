import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["he", "en"],
  defaultLocale: "he",
  // Hebrew is served unprefixed (`/`); English is prefixed (`/en`).
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
