"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

type ParallaxProps = {
  children: React.ReactNode;
  className?: string;
  /** Total travel in px; the child moves from -distance to +distance. */
  distance?: number;
};

/**
 * Subtly translates its child on the Y axis as the element scrolls through the
 * viewport. Only `transform` is animated — no layout shift.
 */
export function Parallax({
  children,
  className,
  distance = 40,
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // Hooks run unconditionally to satisfy the rules of hooks; the resulting
  // MotionValue is simply left unused in the reduced-motion branch below.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-distance, distance]);

  // Reduced-motion branch: a plain static div, no transform ever applied.
  if (reduced) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div ref={ref} className={className} style={{ y }}>
      {children}
    </motion.div>
  );
}
