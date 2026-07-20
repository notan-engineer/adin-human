"use client";

import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/components/motion/use-reduced-motion";
import type { Variants } from "motion/react";
import type { ElementType } from "react";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type CommonProps = {
  children: React.ReactNode;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
};

/**
 * Container that reveals its <StaggerItem> children one after another as it
 * enters the viewport. Pair with StaggerItem for the per-child animation.
 */
export function Stagger({
  children,
  className,
  as = "div",
  stagger = 0.08,
}: CommonProps & { stagger?: number }) {
  const reduced = usePrefersReducedMotion();

  // Reduced-motion branch: plain wrapper, children render fully visible with no
  // stagger and no delay.
  if (reduced) {
    const Tag = as as ElementType;
    return <Tag className={className}>{children}</Tag>;
  }

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: stagger } },
  };

  // See Reveal.tsx: resolve the dynamic tag through a typed record because
  // motion's v12 proxy isn't indexable by a JSX-tag union in TS.
  const MotionTag = (motion as unknown as Record<string, typeof motion.div>)[as];

  return (
    <MotionTag
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </MotionTag>
  );
}

/**
 * A single fade + rise child of <Stagger>. Its timing is orchestrated by the
 * parent's staggerChildren, so it takes no delay prop of its own.
 */
export function StaggerItem({
  children,
  className,
  as = "div",
  y = 20,
}: CommonProps & { y?: number }) {
  const reduced = usePrefersReducedMotion();

  // Reduced-motion branch: plain wrapper, fully visible, no transform.
  if (reduced) {
    const Tag = as as ElementType;
    return <Tag className={className}>{children}</Tag>;
  }

  const item: Variants = {
    hidden: { opacity: 0, y },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: EASE },
    },
  };

  const MotionTag = (motion as unknown as Record<string, typeof motion.div>)[as];

  return (
    // `reveal-item` cooperates with the layout <noscript> rule so no-JS users
    // see these fully revealed.
    <MotionTag className={cn("reveal-item", className)} variants={item}>
      {children}
    </MotionTag>
  );
}
