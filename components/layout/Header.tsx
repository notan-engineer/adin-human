"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/Logo";
import { Nav } from "@/components/layout/Nav";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { CartButton } from "@/components/layout/CartButton";
import { MobileMenu } from "@/components/layout/MobileMenu";

/**
 * Sticky header that floats weightless over the hero and firms up on scroll.
 * The bottom border is always present but transparent at the top, so toggling
 * it never shifts layout. Only colors transition.
 */
export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors duration-300",
        scrolled
          ? "border-border bg-background/80 backdrop-blur"
          : "border-transparent bg-transparent",
      )}
    >
      <div className="container flex h-16 items-center gap-4 md:h-20">
        <div className="flex flex-1 items-center">
          <Logo />
        </div>

        <Nav className="hidden md:flex" />

        <div className="flex flex-1 items-center justify-end gap-1">
          <LocaleSwitcher />
          <CartButton />
          <MobileMenu className="md:hidden" />
        </div>
      </div>
    </header>
  );
}
