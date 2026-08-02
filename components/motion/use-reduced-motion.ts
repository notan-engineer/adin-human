"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Whether the user has asked for reduced motion.
 *
 * ⚠️ Deliberately NOT `useReducedMotion` from `motion/react`. That hook is
 * implemented as:
 *
 *     const [shouldReduceMotion] = useState(prefersReducedMotion.current)
 *
 * where `prefersReducedMotion.current` is a module-level ref that is `null`
 * until `initPrefersReducedMotion()` has run. Because a `useState` initial value
 * is read exactly once and that hook never updates it (their source carries a
 * standing TODO about this), any component that renders before the ref is
 * populated captures `null` - falsy - and is stuck on the ANIMATED branch for
 * the rest of the page's life. For a `whileInView` reveal that means content
 * pinned at `opacity: 0` until the user scrolls it into view, which is precisely
 * the thing reduced motion is supposed to protect them from. Which components
 * lose that race depends on render order, so the bug moves around per page.
 *
 * `useSyncExternalStore` fixes it properly: React renders the server snapshot
 * (`false`) during hydration, then immediately re-renders with the real client
 * value, and re-renders again whenever the OS setting changes.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(QUERY).matches;
}

/**
 * The server can't know the user's preference, so it renders the animated
 * markup and the client corrects on hydration. The `@media (prefers-reduced-
 * motion: reduce)` rule in `globals.css` covers that first paint, so a
 * reduced-motion user never actually sees the hidden state.
 */
function getServerSnapshot(): boolean {
  return false;
}
