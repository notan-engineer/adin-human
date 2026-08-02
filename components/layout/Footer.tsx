import { getTranslations } from "next-intl/server";

import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { site } from "@/content/site";
import { Link } from "@/lib/i18n/navigation";

// Brand glyphs aren't shipped in this lucide build, so they're inlined in the
// same 24px lucide line style (currentColor stroke, 2px, round caps).
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export async function Footer() {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();

  // Absolute targets, not bare hashes: the footer renders on every page, and
  // these sections live on the home page (same targets as the header Nav).
  const columns = [
    {
      heading: t("shopHeading"),
      links: [
        { label: t("flavors"), href: "/#products" },
        { label: t("bundles"), href: "/#bundles" },
      ],
    },
    {
      heading: t("companyHeading"),
      links: [
        { label: t("story"), href: "/#story" },
        { label: t("process"), href: "/#process" },
        { label: t("contact"), href: "/contact" },
      ],
    },
    {
      heading: t("legalHeading"),
      links: [
        { label: t("terms"), href: "/terms" },
        { label: t("privacy"), href: "/privacy" },
        { label: t("shipping"), href: "/shipping" },
      ],
    },
  ];

  const socials = [
    { label: "Instagram", href: site.social.instagram, Icon: InstagramIcon },
    { label: "Facebook", href: site.social.facebook, Icon: FacebookIcon },
  ];

  return (
    <footer className="mt-24 bg-background text-foreground">
      <div className="h-px w-full bg-ember-line" aria-hidden />

      <div className="container py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand + tagline + contact + socials */}
          <div className="flex flex-col gap-6 sm:col-span-2 lg:col-span-2">
            {/* Brand SVG: next/image doesn't optimize SVGs, so a plain <img> is correct. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logotype.svg"
              alt="The Heuman Chef"
              className="h-8 w-auto"
              width={493}
              height={145}
            />
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              {t("tagline")}
            </p>

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  {t("emailLabel")}
                </span>
                <a
                  href={`mailto:${site.email}`}
                  className="text-foreground/90 transition-colors hover:text-gold"
                >
                  {site.email}
                </a>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  {t("phoneLabel")}
                </span>
                <a
                  href={`tel:${site.phoneHref}`}
                  dir="ltr"
                  className="text-start text-foreground/90 transition-colors hover:text-gold"
                >
                  {site.phoneDisplay}
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t("followUs")}
              </span>
              <div className="flex items-center gap-2">
                {socials.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="inline-flex size-10 items-center justify-center rounded-md border border-border text-foreground/80 transition-colors hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <Icon className="size-[18px]" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <nav key={col.heading} aria-label={col.heading} className="flex flex-col gap-4">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground">
                {col.heading}
              </h2>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => {
                  const className =
                    "text-sm text-muted-foreground transition-colors hover:text-gold";
                  return (
                    <li key={link.label}>
                      {link.href.startsWith("/") ? (
                        // Locale-aware Link: a plain <a href="/…"> would drop
                        // the /en prefix and silently switch the visitor to
                        // Hebrew (localePrefix "as-needed").
                        <Link href={link.href} className={className}>
                          {link.label}
                        </Link>
                      ) : (
                        // "#" placeholders stay plain anchors until their
                        // routes exist — next-intl's Link has nothing useful
                        // to do with a bare hash.
                        <a href={link.href} className={className}>
                          {link.label}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col gap-4 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} The Heuman Chef · {t("rights")}
          </p>
          <div className="flex items-center gap-4">
            <LocaleSwitcher className="text-muted-foreground" />
            <span className="h-4 w-px bg-border" aria-hidden />
            <span>{t("madeInIsrael")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
