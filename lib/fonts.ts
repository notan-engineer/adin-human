import { Rubik, Heebo } from "next/font/google";

// One family per role, each carrying BOTH Hebrew + Latin so brand names and
// product copy render consistently across locales. next/font self-hosts these
// at build time (no runtime external requests, no CLS).

export const fontDisplay = Rubik({
  subsets: ["latin", "hebrew"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});

export const fontBody = Heebo({
  subsets: ["latin", "hebrew"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const fontVariables = `${fontDisplay.variable} ${fontBody.variable}`;
