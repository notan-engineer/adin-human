"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  /** Stable id root; the header gets `${id}-header`, the region `${id}-content`. */
  id: string;
  title: string;
  /** Optional short recap (e.g. the chosen method) shown on the end side. */
  summary?: React.ReactNode;
  /** Uncontrolled initial state. Ignored when `open` is supplied. */
  defaultOpen?: boolean;
  /** Controlled open state - pass together with `onOpenChange`. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** aria-label for the toggle button (e.g. "Expand/collapse"). */
  toggleLabel?: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * A calm, accessible collapsible panel for the single-page checkout.
 *
 * The header is a single `<button aria-expanded aria-controls>` (title +
 * optional summary + chevron); the body is a labelled `role="region"` that stays
 * mounted and is hidden via the `hidden` attribute when collapsed - so form
 * state is never lost, and collapsed fields are removed from the tab order and
 * the a11y tree. No height animation: checkout should not move under the user
 * (also makes it trivially reduced-motion safe). Only the chevron rotates, and
 * that transition is dropped under `prefers-reduced-motion`.
 *
 * Works controlled (`open` + `onOpenChange`, used so validation can force a
 * section open before focusing an invalid field) or uncontrolled (`defaultOpen`).
 * RTL-safe: logical utilities only.
 */
export function CheckoutSection({
  id,
  title,
  summary,
  defaultOpen = true,
  open,
  onOpenChange,
  toggleLabel,
  className,
  children,
}: Props) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolledOpen;

  const headerId = `${id}-header`;
  const contentId = `${id}-content`;

  const toggle = () => {
    const next = !isOpen;
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card",
        className,
      )}
    >
      <h2>
        <button
          type="button"
          id={headerId}
          aria-expanded={isOpen}
          aria-controls={contentId}
          aria-label={toggleLabel ? `${title} - ${toggleLabel}` : undefined}
          onClick={toggle}
          className="flex w-full items-center gap-3 px-5 py-4 text-start outline-none transition-colors hover:bg-secondary/20 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-6"
        >
          <span className="min-w-0 flex-1 font-display text-base font-bold text-foreground">
            {title}
          </span>
          {summary ? (
            <span className="hidden min-w-0 truncate text-sm text-muted-foreground sm:block">
              {summary}
            </span>
          ) : null}
          <ChevronDown
            aria-hidden
            className={cn(
              "size-5 shrink-0 text-muted-foreground motion-safe:transition-transform motion-safe:duration-200",
              isOpen && "rotate-180",
            )}
          />
        </button>
      </h2>

      <div
        id={contentId}
        role="region"
        aria-labelledby={headerId}
        hidden={!isOpen}
        className="border-t border-border/60 px-5 py-5 sm:px-6"
      >
        {children}
      </div>
    </section>
  );
}
