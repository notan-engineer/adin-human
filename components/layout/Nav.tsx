import { useTranslations } from "next-intl";

import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Primary navigation targets.
 *
 * These are locale-aware routes rather than bare hashes: the header renders on
 * every page, so `#story` alone would be a dead link anywhere except the home
 * page. `/#story` scrolls when you're already home and navigates-then-scrolls
 * when you aren't. Contact is a real route (`/contact`), since the contact form
 * doesn't live on the home page.
 */
export const navLinks = [
  { key: "flavors", href: "/#products" },
  { key: "story", href: "/#story" },
  { key: "process", href: "/#process" },
  { key: "contact", href: "/contact" },
] as const;

export function Nav({ className }: { className?: string }) {
  const t = useTranslations("nav");

  return (
    <nav aria-label="Primary" className={cn("items-center gap-8", className)}>
      {navLinks.map(({ key, href }) => (
        <Link
          key={key}
          href={href}
          className="text-sm font-medium uppercase tracking-widest text-foreground/80 transition-colors hover:text-gold"
        >
          {t(key)}
        </Link>
      ))}
    </nav>
  );
}
