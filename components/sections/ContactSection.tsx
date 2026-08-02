"use client";

import * as React from "react";
import { Loader2, Mail, Phone } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { site } from "@/content/site";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Mirrors the server-side cap in app/api/contact/route.ts. */
const MESSAGE_MAX = 2000;

type Status = "idle" | "submitting" | "success" | "error";
type FieldErrors = Partial<Record<"name" | "email" | "message", string>>;

/**
 * Contact form + contact details (scroll target `#contact`).
 *
 * Client leaf. Validation runs on submit only (never while typing), so the
 * user isn't scolded mid-word; per-field errors are wired with
 * `aria-describedby` and the overall result goes to a persistent live region.
 */
export function ContactSection({
  className,
  /**
   * Heading level for this section's title. Defaults to `h2` so the component
   * can sit inside a page that already owns an `h1`; `/contact` renders it
   * standalone and passes `h1`, which is what gives that page its top-level
   * heading (axe `page-has-heading-one`).
   */
  as: Heading = "h2",
}: {
  className?: string;
  as?: "h1" | "h2";
}) {
  // Sub-headings track the section title so levels never skip (axe
  // `heading-order`): h1 → h2 on /contact, h2 → h3 when nested in a page.
  const SubHeading = Heading === "h1" ? "h2" : "h3";
  const t = useTranslations("contact");

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [status, setStatus] = React.useState<Status>("idle");
  const [result, setResult] = React.useState("");

  const submitting = status === "submitting";

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = t("errors.nameRequired");
    if (!EMAIL_RE.test(email.trim())) next.email = t("errors.emailInvalid");

    const body = message.trim();
    if (!body) next.message = t("errors.messageRequired");
    else if (body.length > MESSAGE_MAX) next.message = t("errors.messageTooLong");

    return next;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setStatus("error");
      setResult(t("errors.checkFields"));
      return;
    }

    setStatus("submitting");
    setResult("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setStatus("success");
      setResult(t("success"));
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setStatus("error");
      setResult(t("errors.generic"));
    }
  }

  /** Clears a field's error (and any stale banner) as soon as it's edited. */
  function clearError(field: keyof FieldErrors) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    if (status !== "idle") {
      setStatus("idle");
      setResult("");
    }
  }

  return (
    <section
      id="contact"
      className={cn(
        "relative scroll-mt-24 bg-background bg-smoke-radial py-20 sm:py-28",
        className,
      )}
    >
      <div className="container">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="font-sans text-xs uppercase tracking-[0.35em] text-bronze">
            {t("kicker")}
          </p>
          <Heading className="mt-3 font-display text-3xl font-black text-gold sm:text-4xl">
            {t("heading")}
          </Heading>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {t("body")}
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-name">{t("nameLabel")}</Label>
              <Input
                id="contact-name"
                name="name"
                autoComplete="name"
                required
                disabled={submitting}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearError("name");
                }}
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? "contact-name-error" : undefined}
              />
              {errors.name && (
                <p id="contact-name-error" className="text-sm text-destructive">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-email">{t("emailLabel")}</Label>
              <Input
                id="contact-email"
                name="email"
                type="email"
                autoComplete="email"
                dir="ltr"
                required
                disabled={submitting}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError("email");
                }}
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={
                  errors.email ? "contact-email-error" : undefined
                }
                className="text-start"
              />
              {errors.email && (
                <p id="contact-email-error" className="text-sm text-destructive">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-message">{t("messageLabel")}</Label>
              <textarea
                id="contact-message"
                name="message"
                rows={5}
                required
                maxLength={MESSAGE_MAX}
                disabled={submitting}
                placeholder={t("messagePlaceholder")}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  clearError("message");
                }}
                aria-invalid={errors.message ? true : undefined}
                aria-describedby={
                  errors.message ? "contact-message-error" : undefined
                }
                className="flex w-full resize-y rounded-md border border-input bg-background/40 px-3 py-2 text-sm ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.message && (
                <p id="contact-message-error" className="text-sm text-destructive">
                  {errors.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                type="submit"
                variant="gold"
                size="lg"
                disabled={submitting}
                className="sm:w-auto"
              >
                {submitting && <Loader2 className="animate-spin" aria-hidden />}
                {submitting ? t("submitting") : t("submit")}
              </Button>
            </div>

            {/* Persistent live region - only its contents change. */}
            <p
              role="status"
              aria-live="polite"
              className={cn(
                "min-h-5 text-sm",
                status === "error" ? "text-destructive" : "text-gold",
              )}
            >
              {result}
            </p>
          </form>

          {/* Direct contact details - must match the footer (both read content/site.ts). */}
          <aside className="flex flex-col gap-6">
            <SubHeading className="font-display text-lg font-bold text-foreground">
              {t("detailsHeading")}
            </SubHeading>

            <div className="flex flex-col gap-4 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-bronze" aria-hidden />
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
              </div>

              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-bronze" aria-hidden />
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
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("responseNote")}
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
