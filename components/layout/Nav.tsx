import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

/**
 * In-page section anchors. Plain `<a>` (not the locale Link) so a hash on the
 * current locale's URL just scrolls — no navigation, no locale re-resolution.
 */
export const navLinks = [
  { key: "flavors", href: "#products" },
  { key: "story", href: "#story" },
  { key: "process", href: "#process" },
  { key: "contact", href: "#contact" },
] as const;

export function Nav({ className }: { className?: string }) {
  const t = useTranslations("nav");

  return (
    <nav
      aria-label="Primary"
      className={cn("items-center gap-8", className)}
    >
      {navLinks.map(({ key, href }) => (
        <a
          key={key}
          href={href}
          className="text-sm font-medium uppercase tracking-widest text-foreground/80 transition-colors hover:text-gold"
        >
          {t(key)}
        </a>
      ))}
    </nav>
  );
}
