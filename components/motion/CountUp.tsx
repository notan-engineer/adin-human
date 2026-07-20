"use client";

import { animate, useInView, useMotionValue } from "motion/react";
import { usePrefersReducedMotion } from "@/components/motion/use-reduced-motion";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type CountUpProps = {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
};

/**
 * Counts from 0 up to `value` the first time it scrolls into view.
 */
export function CountUp({
  value,
  duration = 1.6,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: CountUpProps) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const count = useMotionValue(0);
  // `display` is what we render; it stays in sync with the animated MotionValue.
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    // Reduced-motion branch: jump straight to the final value, no tween.
    if (reduced) {
      setDisplay(value);
      return;
    }

    // Only start counting once the element has scrolled into view.
    if (!inView) return;

    const unsubscribe = count.on("change", (latest) => setDisplay(latest));
    const controls = animate(count, value, { duration, ease: EASE });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [reduced, inView, value, duration, count]);

  const formatted = `${prefix}${display.toFixed(decimals)}${suffix}`;

  return (
    <span
      ref={ref}
      // tabular-nums keeps each digit a fixed width, so the counting number
      // never reflows its container (no CLS).
      className={cn("tabular-nums", className)}
    >
      {formatted}
    </span>
  );
}
