"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "idle" | "submitting" | "success" | "error";

/**
 * Email capture (client leaf) posting to `/api/newsletter`.
 *
 * The result is rendered into a permanently-mounted `aria-live="polite"` region
 * — mounting the region together with its text is unreliable across screen
 * readers, so the container is always present and only its contents change.
 */
export function Newsletter({ className }: { className?: string }) {
  const t = useTranslations("newsletter");
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<Status>("idle");
  const [message, setMessage] = React.useState("");

  const submitting = status === "submitting";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setStatus("error");
      setMessage(t("errorInvalid"));
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setStatus("success");
      setMessage(t("success"));
      setEmail("");
    } catch {
      setStatus("error");
      setMessage(t("errorGeneric"));
    }
  }

  return (
    <section
      className={cn(
        "relative overflow-hidden bg-char bg-smoke-radial py-20 sm:py-28",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-ember-line" aria-hidden />

      <div className="container">
        <div className="mx-auto max-w-xl text-center">
          <p className="font-sans text-xs uppercase tracking-[0.35em] text-bronze">
            {t("kicker")}
          </p>
          <h2 className="mt-3 font-display text-3xl font-black text-gold sm:text-4xl">
            {t("heading")}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {t("body")}
          </p>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <div className="flex-1 text-start">
              <Label htmlFor="newsletter-email" className="sr-only">
                {t("emailLabel")}
              </Label>
              <Input
                id="newsletter-email"
                name="email"
                type="email"
                autoComplete="email"
                dir="ltr"
                required
                disabled={submitting}
                placeholder={t("placeholder")}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  // Clear a stale result the moment the user starts fixing it.
                  if (status !== "idle") {
                    setStatus("idle");
                    setMessage("");
                  }
                }}
                aria-invalid={status === "error" || undefined}
                aria-describedby="newsletter-status"
                className="text-start"
              />
            </div>
            <Button
              type="submit"
              variant="gold"
              disabled={submitting}
              className="h-11 shrink-0 sm:px-8"
            >
              {submitting && <Loader2 className="animate-spin" aria-hidden />}
              {submitting ? t("submitting") : t("submit")}
            </Button>
          </form>

          <p
            id="newsletter-status"
            role="status"
            aria-live="polite"
            className={cn(
              "mt-3 min-h-5 text-sm",
              // `destructive` is now tuned for text on the dark surfaces
              // (≥4.5:1), so the old text-red-400 workaround is gone and error
              // styling comes from the design token like everywhere else.
              status === "error" ? "text-destructive" : "text-gold",
            )}
          >
            {message}
          </p>
        </div>
      </div>
    </section>
  );
}
