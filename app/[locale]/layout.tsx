import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/lib/i18n/routing";
import {
  OG_LOCALE,
  SITE_URL,
  absoluteUrl,
  localizedAlternates,
  toLocale,
} from "@/lib/seo";
import { fontVariables } from "@/lib/fonts";
import { DirectionProvider } from "@/components/providers/direction-provider";
import { LenisProvider } from "@/components/motion/LenisProvider";
import { SkipLink } from "@/components/layout/SkipLink";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartToaster } from "@/components/product/CartToaster";
import "../globals.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = toLocale(raw);
  const t = await getTranslations({ locale, namespace: "meta" });

  const title = t("titleDefault");
  const description = t("description");

  return {
    // Resolves every relative URL in this file and in each page's metadata
    // (OG images, canonicals). Without it Next warns on every build.
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      // Pages set a bare `title`; Next fills it into this template.
      template: t("titleTemplate"),
    },
    description,
    applicationName: t("siteName"),
    // Root-level alternates for `/` and `/en`; each page overrides with its own.
    alternates: localizedAlternates("/", locale),
    openGraph: {
      type: "website",
      siteName: t("siteName"),
      title,
      description,
      locale: OG_LOCALE[locale],
      // Declare the other locale so crawlers can discover the pair from OG too.
      alternateLocale: routing.locales
        .filter((l) => l !== locale)
        .map((l) => OG_LOCALE[l]),
      url: absoluteUrl("/", locale),
      // The opengraph-image.tsx route convention appends the generated image.
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: { index: true, follow: true },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "32x32" },
        { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
        { url: "/favicon-48x48.png", type: "image/png", sizes: "48x48" },
        { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
        { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
  };
}

/**
 * Brand charcoal, so mobile browser chrome matches the dark site. This lives in
 * the `viewport` export (not `metadata`) - Next 15 warns if `themeColor` is set
 * on `metadata`.
 */
export const viewport: Viewport = {
  themeColor: "#0b0b0d",
  colorScheme: "dark",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();
  const dir = locale === "he" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={fontVariables}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <noscript>
          <style>{`.reveal-item{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <DirectionProvider dir={dir}>
            {/* LenisProvider is the client leaf; it renders children unchanged
                and no-ops under reduced motion, so the layout stays a server
                component and the sticky Header keeps working. */}
            <LenisProvider>
              <SkipLink />
              <Header />
              <main id="main">{children}</main>
              <Footer />
              <CartToaster />
            </LenisProvider>
          </DirectionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
