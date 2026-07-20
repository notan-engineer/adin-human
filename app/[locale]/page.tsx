import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden bg-smoke-radial p-8 text-center">
      <p className="font-sans text-xs uppercase tracking-[0.3em] text-bronze">
        Adin Human
      </p>
      <h1 className="font-display text-5xl font-black text-gold sm:text-7xl">
        {t("title")}
      </h1>
      <p className="max-w-md text-lg text-muted-foreground">{t("tagline")}</p>
      <div className="h-px w-40 bg-ember-line" aria-hidden />
      <Button variant="gold" size="lg">
        {t("cta")}
      </Button>
    </main>
  );
}
