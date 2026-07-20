"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { navLinks } from "@/components/layout/Nav";
import { Link } from "@/lib/i18n/navigation";

/**
 * Below-md navigation. A top Sheet holds the same section anchors, stacked
 * large and centered, plus the locale toggle. Tapping a link closes the sheet.
 */
export function MobileMenu({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("nav");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label={t("openMenu")}
        className={`inline-flex size-10 items-center justify-center rounded-md text-foreground/80 transition-colors hover:bg-secondary hover:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${className ?? ""}`}
      >
        <Menu className="size-5" aria-hidden />
      </SheetTrigger>

      <SheetContent side="top" className="pt-14">
        <SheetHeader className="sr-only">
          <SheetTitle>{t("openMenu")}</SheetTitle>
        </SheetHeader>

        <nav
          aria-label="Primary"
          className="flex flex-col items-center gap-6 py-6"
        >
          {navLinks.map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              onClick={() => setOpen(false)}
              className="font-display text-2xl font-semibold uppercase tracking-wide text-foreground transition-colors hover:text-gold"
            >
              {t(key)}
            </Link>
          ))}

          <span className="my-2 h-px w-24 bg-ember-line" aria-hidden />

          <LocaleSwitcher />
        </nav>
      </SheetContent>
    </Sheet>
  );
}
