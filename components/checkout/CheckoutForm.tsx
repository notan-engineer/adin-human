"use client";

import * as React from "react";
import { AlertCircle, Loader2, Store } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { CheckoutSection } from "@/components/checkout/CheckoutSection";
import { CheckoutSummaryBar } from "@/components/checkout/CheckoutSummaryBar";
import { DeliveryMethodPicker } from "@/components/checkout/DeliveryMethodPicker";
import { IsraeliAddressForm } from "@/components/checkout/IsraeliAddressForm";
import type { AddressErrors } from "@/components/checkout/IsraeliAddressForm";
import { PaymentMethods } from "@/components/checkout/PaymentMethods";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getProduct } from "@/lib/catalog";
import type { Product } from "@/lib/catalog";
import type {
  Address,
  DeliveryMethod,
  PaymentMethod,
} from "@/lib/commerce/types";
import { bundleDiscountAgorot } from "@/lib/commerce/bundle-pricing";
import { courierFeeAgorot } from "@/lib/commerce/shipping";
import { Link } from "@/lib/i18n/navigation";
import { formatAgorot } from "@/lib/money";
import { useCart } from "@/lib/store/cart";
import { cn } from "@/lib/utils";
import { splitGross } from "@/lib/vat";

// ── Validation primitives ──────────────────────────────────────────────────
// Israeli phone: 9-10 digits starting 0 (05x mobile / 0x landline).
const PHONE_RE = /^0\d{8,9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSTAL_RE = /^\d{7}$/;
const normalizePhone = (p: string) => p.replace(/\D/g, "");

/** Address fields that BLOCK submit (postalCode is soft - shown, not gating). */
const ADDRESS_REQUIRED: (keyof Address)[] = [
  "recipientName",
  "phone",
  "city",
  "street",
  "houseNumber",
];

const EMPTY_ADDRESS: Address = {
  recipientName: "",
  phone: "",
  city: "",
  street: "",
  houseNumber: "",
  apartment: "",
  entrance: "",
  floor: "",
  postalCode: "",
  notes: "",
};

type Contact = { name: string; email: string; phone: string };
type ContactErrors = Partial<Record<keyof Contact, string>>;
type SectionKey = "contact" | "delivery" | "payment";

/**
 * Single-page guest checkout (client island), rendered by CartView in its
 * `?checkout=1` phase.
 *
 * Everything is visible at once: the contracted sticky summary bar on top
 * (2-3 lines - the forms are the focus), then three collapsible sections -
 * contact, delivery & address, payment - and one submit. No steps, no
 * next/back. Delivery is two flat-fee radio cards (courier, default, or free
 * self-pickup); shipping is knowable INSTANTLY from the shared constants - no
 * quote round-trip - with the server quote at order-create remaining the
 * authority. `onEditCart` expands the cart back (pops the ?checkout phase).
 *
 * Money shown here is display-only (integer agorot, formatted at render); the
 * server recomputes every figure on `order/create`. RTL-safe via logical
 * utilities.
 */
export function CheckoutForm({ onEditCart }: { onEditCart: () => void }) {
  const t = useTranslations("checkout");
  const locale = useLocale() as "he" | "en";

  const cartItems = useCart((s) => s.items);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Resolve cart lines against the catalog (drops unknown/discontinued slugs).
  const lines = React.useMemo(
    () =>
      mounted
        ? cartItems.flatMap((item) => {
            const product = getProduct(item.slug);
            return product ? [{ product, qty: item.qty }] : [];
          })
        : ([] as { product: Product; qty: number }[]),
    [mounted, cartItems],
  );

  // ── Form state ───────────────────────────────────────────────────────────
  const [contact, setContact] = React.useState<Contact>({
    name: "",
    email: "",
    phone: "",
  });
  const [method, setMethod] = React.useState<DeliveryMethod>("courier");
  const [address, setAddress] = React.useState<Address>(EMPTY_ADDRESS);
  const [paymentMethod, setPaymentMethod] =
    React.useState<PaymentMethod>("card");

  const [contactErrors, setContactErrors] = React.useState<ContactErrors>({});
  const [addrErrors, setAddrErrors] = React.useState<AddressErrors>({});
  const [banner, setBanner] = React.useState<string | null>(null);

  const [submitting, setSubmitting] = React.useState(false);

  const [openSections, setOpenSections] = React.useState<
    Record<SectionKey, boolean>
  >({ contact: true, delivery: true, payment: true });

  const needsAddress = method === "courier";

  // ── Totals (display-only; the server recomputes identically) ─────────────
  // Shipping is a flat nationwide fee (free over the threshold, judged on the
  // discounted subtotal), so everything is knowable synchronously - no quote.
  const subtotal = lines.reduce(
    (sum, l) => sum + l.product.priceAgorot * l.qty,
    0,
  );
  const bagCount = lines.reduce((sum, l) => sum + l.qty, 0);
  const discount = bundleDiscountAgorot(bagCount);
  const merchandise = subtotal - discount;
  const shipping =
    method === "self_pickup" ? 0 : courierFeeAgorot(merchandise);
  const total = merchandise + shipping;
  const { vat } = splitGross(total);

  // ── Validation ───────────────────────────────────────────────────────────
  const validateContact = React.useCallback(
    (c: Contact): ContactErrors => {
      const e: ContactErrors = {};
      if (!c.name.trim()) e.name = t("validation.required");
      if (!c.email.trim()) e.email = t("validation.required");
      else if (!EMAIL_RE.test(c.email.trim()))
        e.email = t("validation.invalidEmail");
      if (!c.phone.trim()) e.phone = t("validation.required");
      else if (!PHONE_RE.test(normalizePhone(c.phone)))
        e.phone = t("validation.invalidPhone");
      return e;
    },
    [t],
  );

  const validateAddress = React.useCallback(
    (a: Address): AddressErrors => {
      const e: AddressErrors = {};
      const empty = (v?: string) => !v || !v.trim();
      if (empty(a.recipientName)) e.recipientName = t("validation.required");
      if (empty(a.phone)) e.phone = t("validation.required");
      else if (!PHONE_RE.test(normalizePhone(a.phone)))
        e.phone = t("validation.invalidPhone");
      if (empty(a.city)) e.city = t("validation.required");
      if (empty(a.street)) e.street = t("validation.required");
      if (empty(a.houseNumber)) e.houseNumber = t("validation.required");
      if (
        a.postalCode &&
        a.postalCode.trim() &&
        !POSTAL_RE.test(a.postalCode.trim())
      )
        e.postalCode = t("validation.invalidPostal");
      return e;
    },
    [t],
  );

  const handleAddressBlur = (field: keyof Address) => {
    const full = validateAddress(address);
    setAddrErrors((prev) => ({ ...prev, [field]: full[field] }));
  };

  /** Open the owning section, then scroll to + focus the offending field. */
  const revealAndFocus = React.useCallback(
    (section: SectionKey, fieldId: string) => {
      setOpenSections((prev) =>
        prev[section] ? prev : { ...prev, [section]: true },
      );
      // Wait a frame so a just-revealed field is focusable.
      requestAnimationFrame(() => {
        const el = document.getElementById(fieldId);
        if (!el) return;
        const reduced = window.matchMedia?.(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        el.scrollIntoView({
          behavior: reduced ? "auto" : "smooth",
          block: "center",
        });
        (el as HTMLElement).focus({ preventScroll: true });
      });
    },
    [],
  );

  const cleanAddress = (a: Address): Address => {
    const opt = (v?: string) => {
      const trimmed = v?.trim();
      return trimmed ? trimmed : undefined;
    };
    return {
      recipientName: a.recipientName.trim(),
      phone: a.phone.trim(),
      city: a.city.trim(),
      street: a.street.trim(),
      houseNumber: a.houseNumber.trim(),
      apartment: opt(a.apartment),
      entrance: opt(a.entrance),
      floor: opt(a.floor),
      postalCode: opt(a.postalCode),
      notes: opt(a.notes),
    };
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setBanner(null);

    // 1) Validate everything in one pass; keep all input, focus the first miss.
    const cErrs = validateContact(contact);
    setContactErrors(cErrs);
    let target: { section: SectionKey; fieldId: string } | null = null;
    for (const f of ["name", "email", "phone"] as (keyof Contact)[]) {
      if (cErrs[f]) {
        target = { section: "contact", fieldId: `contact-${f}` };
        break;
      }
    }

    if (needsAddress) {
      const aErrs = validateAddress(address);
      setAddrErrors(aErrs);
      const firstBad = ADDRESS_REQUIRED.find((f) => aErrs[f]);
      if (!target && firstBad) {
        target = { section: "delivery", fieldId: `addr-${firstBad}` };
      }
    }

    if (target) {
      revealAndFocus(target.section, target.fieldId);
      return;
    }

    // 2) Create the order, then the hosted payment session, then leave.
    setSubmitting(true);
    try {
      const orderRes = await fetch("/api/order/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({ slug: l.product.slug, qty: l.qty })),
          contact: {
            name: contact.name.trim(),
            email: contact.email.trim(),
            phone: contact.phone.trim(),
          },
          delivery: {
            method,
            address: needsAddress ? cleanAddress(address) : undefined,
          },
        }),
      });
      if (!orderRes.ok) {
        setBanner(t("validation.orderFailed"));
        setSubmitting(false);
        return;
      }
      const { orderId } = (await orderRes.json()) as { orderId: string };

      const payRes = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, locale }),
      });
      if (!payRes.ok) {
        setBanner(t("validation.orderFailed"));
        setSubmitting(false);
        return;
      }
      const { redirectUrl } = (await payRes.json()) as { redirectUrl: string };

      // Leaving the app for the hosted payment page - hold the submitting state.
      window.location.href = redirectUrl;
    } catch {
      setBanner(t("validation.networkError"));
      setSubmitting(false);
    }
  }

  // ── Empty / pre-hydration ────────────────────────────────────────────────
  if (!mounted) {
    return <div className="min-h-[40vh]" aria-hidden />;
  }
  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center sm:py-24">
        <p className="text-lg text-muted-foreground">{t("empty.title")}</p>
        <Button asChild variant="gold" size="lg">
          <Link href="/#products">{t("empty.cta")}</Link>
        </Button>
      </div>
    );
  }

  const methodLabel = t(`methods.${method}.title`);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      {/* ── Contracted, sticky order summary (2-3 lines) ─────────────────── */}
      <CheckoutSummaryBar
        count={bagCount}
        merchandiseAgorot={merchandise}
        discountAgorot={discount}
        shippingAgorot={shipping}
        totalAgorot={total}
        vatAgorot={vat}
        onEdit={onEditCart}
      />

      {banner ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>{banner}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {/* ── Contact ────────────────────────────────────────────────────── */}
        <CheckoutSection
          id="section-contact"
          title={t("contact.heading")}
          summary={contact.name.trim() || undefined}
          toggleLabel={t("sections.toggle")}
          open={openSections.contact}
          onOpenChange={(o) =>
            setOpenSections((prev) => ({ ...prev, contact: o }))
          }
        >
          <div className="flex flex-col gap-4">
            <ContactField
              id="contact-name"
              label={t("contact.name")}
              value={contact.name}
              onChange={(v) => setContact((c) => ({ ...c, name: v }))}
              onBlur={() =>
                setContactErrors((p) => ({
                  ...p,
                  name: validateContact(contact).name,
                }))
              }
              error={contactErrors.name}
              required
              autoComplete="name"
            />
            <ContactField
              id="contact-email"
              label={t("contact.email")}
              type="email"
              inputMode="email"
              value={contact.email}
              onChange={(v) => setContact((c) => ({ ...c, email: v }))}
              onBlur={() =>
                setContactErrors((p) => ({
                  ...p,
                  email: validateContact(contact).email,
                }))
              }
              error={contactErrors.email}
              required
              autoComplete="email"
            />
            <ContactField
              id="contact-phone"
              label={t("contact.phone")}
              type="tel"
              inputMode="numeric"
              value={contact.phone}
              onChange={(v) => setContact((c) => ({ ...c, phone: v }))}
              onBlur={() =>
                setContactErrors((p) => ({
                  ...p,
                  phone: validateContact(contact).phone,
                }))
              }
              error={contactErrors.phone}
              required
              autoComplete="tel"
            />
          </div>
        </CheckoutSection>

        {/* ── Delivery & address ─────────────────────────────────────────── */}
        <CheckoutSection
          id="section-delivery"
          title={t("delivery.heading")}
          summary={methodLabel}
          toggleLabel={t("sections.toggle")}
          open={openSections.delivery}
          onOpenChange={(o) =>
            setOpenSections((prev) => ({ ...prev, delivery: o }))
          }
        >
          <div className="flex flex-col gap-5">
            <DeliveryMethodPicker
              value={method}
              onChange={(m) => {
                setBanner(null);
                setMethod(m);
              }}
              courierFeeAgorot={courierFeeAgorot(merchandise)}
              label={t("delivery.methodLabel")}
              freeLabel={t("summary.free")}
            />

            {needsAddress ? (
              <IsraeliAddressForm
                value={address}
                onChange={setAddress}
                errors={addrErrors}
                onBlurField={handleAddressBlur}
              />
            ) : (
              // self_pickup - no address inputs, just where to collect.
              // PLACEHOLDER address - confirm the real location before go-live.
              <div className="flex items-start gap-3 rounded-xl border border-border bg-background/30 p-4">
                <Store aria-hidden className="mt-0.5 size-5 shrink-0 text-gold" />
                <div className="flex flex-col gap-1">
                  <p className="font-display font-bold text-foreground">
                    {t("selfPickup.storeName")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("selfPickup.storeAddress")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("selfPickup.note")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CheckoutSection>

        {/* ── Payment ────────────────────────────────────────────────────── */}
        <CheckoutSection
          id="section-payment"
          title={t("payment.heading")}
          toggleLabel={t("sections.toggle")}
          open={openSections.payment}
          onOpenChange={(o) =>
            setOpenSections((prev) => ({ ...prev, payment: o }))
          }
        >
          <div className="flex flex-col gap-5">
            <PaymentMethods value={paymentMethod} onChange={setPaymentMethod} />

            <Button
              type="submit"
              variant="gold"
              size="lg"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? (
                <>
                  <Loader2 aria-hidden className="motion-safe:animate-spin" />
                  {t("actions.submitting")}
                </>
              ) : (
                t("actions.pay", { amount: formatAgorot(total, locale) })
              )}
            </Button>
          </div>
        </CheckoutSection>
      </form>
    </div>
  );
}

// ── Local pieces ─────────────────────────────────────────────────────────────

function ContactField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  required,
  type = "text",
  inputMode,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  type?: string;
  inputMode?: React.ComponentProps<typeof Input>["inputMode"];
  autoComplete?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span aria-hidden className="text-gold">
            {" "}
            *
          </span>
        ) : null}
      </Label>
      <Input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-required={required || undefined}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={cn(
          error && "border-destructive focus-visible:ring-destructive",
        )}
      />
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
