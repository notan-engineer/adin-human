"use client";

import Lenis from "lenis";
import { createContext, useContext, useEffect, useState } from "react";

const LenisContext = createContext<Lenis | null>(null);

/**
 * Access the active Lenis instance, or `null` when smooth scroll is disabled
 * (reduced-motion users, SSR, or before initialization). A later batch can use
 * this to drive GSAP ScrollTrigger from the same scroll source.
 */
export function useLenis(): Lenis | null {
  return useContext(LenisContext);
}

/**
 * Enables site-wide Lenis smooth scrolling. Renders children unchanged so it is
 * hydration-safe and can wrap the whole app inside a server layout.
 */
export function LenisProvider({ children }: { children: React.ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    // Reduced-motion branch: never initialize Lenis. Leaving native scroll in
    // place is the correct "no animation" behavior for these users, and keeps
    // useLenis() returning null so downstream effects also stay inert.
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const instance = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
    });
    setLenis(instance);

    // Single requestAnimationFrame loop driving Lenis. Storing the instance in
    // context (rather than autoRaf) lets a future batch tie ScrollTrigger's
    // update into this same loop for perfectly synced scroll animations.
    let rafId = 0;
    const raf = (time: number) => {
      instance.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
