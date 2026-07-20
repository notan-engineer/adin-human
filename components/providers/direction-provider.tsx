"use client";

import { DirectionProvider as RadixDirectionProvider } from "@radix-ui/react-direction";

/**
 * Feeds the document direction to Radix primitives (Dialog, Select, Popover…)
 * so they mirror correctly under RTL. `dir` comes from the active locale.
 */
export function DirectionProvider({
  dir,
  children,
}: {
  dir: "ltr" | "rtl";
  children: React.ReactNode;
}) {
  return <RadixDirectionProvider dir={dir}>{children}</RadixDirectionProvider>;
}
