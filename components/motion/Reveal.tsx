"use client";

import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/components/motion/use-reduced-motion";
import type { ElementType } from "react";
import { cn } from "@/lib/utils";

// Shared "ease out expo"-style curve, typed as a cubic-bezier tuple.
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Distance in px the element rises from as it reveals. */
  y?: number;
  delay?: number;
  once?: boolean;
  /** Fraction of the element that must be visible to trigger. */
  amount?: number;
  as?: keyof React.JSX.IntrinsicElements;
};

/**
 * Fade + rise as the element scrolls into view.
 */
export function Reveal({
  children,
  className,
  y = 24,
  delay = 0,
  once = true,
  amount = 0.2,
  as = "div",
}: RevealProps) {
  const reduced = usePrefersReducedMotion();

  // Reduced-motion branch: render the final, fully-visible element with no
  // motion wrapper. Content is never offset or hidden, so nothing is trapped.
  if (reduced) {
    const Tag = as as ElementType;
    return <Tag className={className}>{children}</Tag>;
  }

  // motion's v12 proxy can't be dynamically indexed by a JSX-tag union in TS,
  // so we resolve the tag through a typed record. All motion DOM components
  // share the div's prop shape for the props we use here.
  const MotionTag = (motion as unknown as Record<string, typeof motion.div>)[as];

  return (
    <MotionTag
      // `reveal-item` lets the layout's <noscript> rule force this visible for
      // no-JS users, who never receive the whileInView animation.
      className={cn("reveal-item", className)}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </MotionTag>
  );
}
