import { Link } from "@/lib/i18n/navigation";

/**
 * Brand wordmark linking home. The SVG is gold/bronze on transparent, tuned to
 * read against the dark chrome. Height-locked so the header never shifts.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="The Heuman Chef"
      className={className}
    >
      {/* Brand SVG: next/image doesn't optimize SVGs, so a plain <img> is correct. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logotype.svg"
        alt="The Heuman Chef"
        className="h-7 w-auto sm:h-8"
        width={493}
        height={145}
      />
    </Link>
  );
}
