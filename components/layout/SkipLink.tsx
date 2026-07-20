import { getTranslations } from "next-intl/server";

/**
 * Keyboard-first "skip to content" link. Visually hidden until focused, then it
 * surfaces at the top-start of the viewport above all chrome.
 */
export async function SkipLink() {
  const t = await getTranslations("a11y");

  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-secondary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-secondary-foreground focus:shadow-ember"
    >
      {t("skipToContent")}
    </a>
  );
}
