import { Beef, Flame, Leaf, Layers } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * ⚠️ PLACEHOLDER DATA — FOR REVIEW.
 * The protein figure (34 g) and flavor count (6) match the current lineup, but
 * the "12 hours smoked" and "100% natural" figures are marketing placeholders
 * and MUST be confirmed by the brand before launch.
 *
 * Only the structural/numeric data lives here — every label is localized in
 * `messages/{he,en}.json` under the `stats` namespace, keyed by `id`.
 */

export type TrustStatId = "protein" | "hours" | "natural" | "flavors";

export type TrustStat = {
  id: TrustStatId;
  /** Target number the CountUp primitive animates to. */
  value: number;
  /** Rendered immediately after the number (unit or symbol). */
  suffix?: string;
  icon: LucideIcon;
};

export const trustStats: TrustStat[] = [
  { id: "protein", value: 34, suffix: "g", icon: Beef },
  { id: "hours", value: 12, suffix: "h", icon: Flame },
  { id: "natural", value: 100, suffix: "%", icon: Leaf },
  { id: "flavors", value: 6, icon: Layers },
];
