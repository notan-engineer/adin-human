import { Scissors, Droplets, Flame, Package } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * ⚠️ PLACEHOLDER DATA - FOR REVIEW.
 * The four-step narrative below is a plausible reconstruction written for the
 * marketing page; the real timings, cuts and cure details MUST be confirmed by
 * the brand before launch. The cherry-wood smoking step is accurate (it is
 * printed on the packaging).
 *
 * Only structure lives here - titles and body copy are localized in
 * `messages/{he,en}.json` under the `process` namespace, keyed by `id`.
 */

export type ProcessStepId = "select" | "cure" | "smoke" | "pack";

export type ProcessStep = {
  id: ProcessStepId;
  icon: LucideIcon;
};

export const processSteps: ProcessStep[] = [
  { id: "select", icon: Scissors },
  { id: "cure", icon: Droplets },
  { id: "smoke", icon: Flame },
  { id: "pack", icon: Package },
];
