"use client";

import * as React from "react";
import { AlertCircle, Loader2, Store } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { CheckoutSection } from "@/components/checkout/CheckoutSection";
import { DeliveryMethodSelect } from "@/components/checkout/DeliveryMethodSelect";
import type { DeliveryOption } from "@/components/checkout/DeliveryMethodSelect";
import { IsraeliAddressForm } from "@/components/checkout/IsraeliAddressForm";
import type { AddressErrors } from "@/components/checkout/IsraeliAddressForm";
import { PaymentMethods } from "@/components/checkout/PaymentMethods";
import { StepPickup } from "@/components/checkout/StepPickup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getProduct } from "@/lib/catalog";
import type { Product } from "@/lib/catalog";
import type {
  Address,
  DeliveryMethod,
  PaymentMethod,
  RateQuote,
} from "@/lib/commerce/types";
import { bundleDiscountAgorot } from "@/lib/commerce/bundle-pricing";
import { COURIER_FEE_AGOROT } from "@/lib/commerce/shipping";
import { Link } from "@/lib/i18n/navigation";
import { formatAgorot } from "@/lib/money";
import { useCart } from "@/lib/store/cart";
import { cn } from "@/lib/utils";
import { splitGross } from "@/lib/vat";

// ── Validation primitives ──────────────────────────────────────────────────
// Israeli phone: 9–10 digits starting 0 (05x mobile / 0x landline).
const PHONE_RE = /^0\d{8,9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSTAL_RE = /^\d{7}$/;
const normalizePhone = (p: string) => p.replace(/\D/g, "");

/** Address fields that BLOCK submit (postalCode is soft — shown, not gating). */
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

/**
 * Display order of the delivery dropdown; also the auto-fallback preference.
 * The live offer is courier + self-pickup only — the wider DeliveryMethod
 * union survives in types for legacy orders / future re-expansion.
 */
const METHOD_ORDER: DeliveryMethod[] = ["courier", "self_pickup"];

/**
 * Indicative list prices used to populate the dropdown BEFORE a city is known.
 * The moment a city is entered, the live `/api/delivery/quote` response
 * replaces these — and the summary shows `summary.shippingPending` until it
 * does, so no unquoted price is ever charged. Courier is the flat nationwide
 * fee from `lib/commerce/shipping.ts`, so fallback and quote can't drift.
 */
const FALLBACK_PRICES: Record<DeliveryMethod, number> = {
  courier: COURIER_FEE_AGOROT,
  same_day: 4500,
  pickup_point: 2000,
  locker: 1200,
  self_pickup: 0,
};

const QUOTE_DEBOUNCE_MS = 400;

type Contact = { name: string; email: string; phone: string };
type ContactErrors = Partial<Record<keyof Contact, string>>;
type SectionKey = "contact" | "delivery" | "payment";

/**
 * Single-page guest checkout (client island).
 *
 * Everything is visible at once: an anchored order summary (products + totals)
 * on top, then three collapsible sections — contact, delivery & address,
 * payment — and one submit. No steps, no next/back. Delivery method is a native
 * dropdown defaulting to `courier`, and the address / pickup-point inputs live
 * in the same section right below it, swapping on the chosen method.
 *
 * Money shown here is display-only (integer agorot, formatted at render); the
 * server recomputes every figure on `order/create`. RTL-safe via logical
 * utilities.
 */
export function CheckoutForm() {
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
  const [pickupCity, setPickupCity] = React.useState("");
  const [pickupPointId, setPickupPointId] = React.useState("");
  const [paymentMethod, setPaymentMethod] =
    React.useState<PaymentMethod>("card");

  const [contactErrors, setContactErrors] = React.useState<ContactErrors>({});
  const [addrErrors, setAddrErrors] = React.useState<AddressErrors>({});
  const [pickupErrors, setPickupErrors] = React.useState<{
    city?: string;
    point?: string;
  }>({});
  const [banner, setBanner] = React.useState<string | null>(null);

  const [rates, setRates] = React.useState<RateQuote[] | null>(null);
  const [quoting, setQuoting] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const [openSections, setOpenSections] = React.useState<
    Record<SectionKey, boolean>
  >({ contact: true, delivery: true, payment: true });

  const needsAddress = method === "courier" || method === "same_day";
  const needsPickup = method === "pickup_point" || method === "locker";
  const destinationCity = needsPickup ? pickupCity : address.city;

  // ── Live, zone-aware quote ───────────────────────────────────────────────
  // One debounced request per city/cart change, asking for ALL methods (no
  // `method` field) — the response both prices the dropdown and tells us which
  // methods that city supports. Switching the dropdown therefore re-prices the
  // summary instantly from the cached rate list, with no extra round-trip.
  const itemsKey = lines.map((l) => `${l.product.slug}:${l.qty}`).join(",");
  const quoteToken = React.useRef(0);

  React.useEffect(() => {
    const city = destinationCity.trim();
    if (!city || itemsKey === "") {
      quoteToken.current += 1;
      setRates(null);
      setQuoting(false);
      return;
    }

    const token = ++quoteToken.current;
    setQuoting(true);

    const timer = setTimeout(() => {
      fetch("/api/delivery/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: itemsKey.split(",").map((pair) => {
            const [slug, qty] = pair.split(":");
            return { slug, qty: Number(qty) };
          }),
          destination: { city },
        }),
      })
        .then((res) => (res.ok ? res.json() : { rates: [] }))
        .then((data: { rates?: RateQuote[] }) => {
          if (token !== quoteToken.current) return;
          setRates(data.rates ?? []);
          setQuoting(false);
        })
        .catch(() => {
          if (token !== quoteToken.current) return;
          setRates(null);
          setQuoting(false);
        });
    }, QUOTE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [destinationCity, itemsKey]);

  /**
   * Switch method, carrying the destination city with it.
   *
   * Address methods and pickup methods read the city from different inputs, so
   * without this the quote would silently fall back to whatever city the *other*
   * input still held — pricing one city while the UI talks about another.
   */
  const changeMethod = React.useCallback(
    (next: DeliveryMethod) => {
      if (next === method) return;
      const city = destinationCity.trim();
      if (city) {
        if (next === "pickup_point" || next === "locker") setPickupCity(city);
        else setAddress((a) => (a.city === city ? a : { ...a, city }));
      }
      setMethod(next);
    },
    [method, destinationCity],
  );

  // If the chosen method isn't offered for this city, say so and fall back to
  // one that is — never price an unavailable method from stale/default data.
  React.useEffect(() => {
    if (!rates || rates.some((r) => r.method === method)) return;
    const city = destinationCity.trim();
    if (!city) return;
    setBanner(t("validation.notAvailableCity", { city }));
    const fallback = METHOD_ORDER.find((m) => rates.some((r) => r.method === m));
    if (fallback) changeMethod(fallback);
  }, [rates, method, destinationCity, changeMethod, t]);

  // ── Dropdown options ─────────────────────────────────────────────────────
  const options = React.useMemo<DeliveryOption[]>(() => {
    const priced = rates && rates.length > 0;
    return METHOD_ORDER.flatMap((m) => {
      const rate = rates?.find((r) => r.method === m);
      if (priced && !rate) return [];
      return [
        {
          method: m,
          label: t(`methods.${m}.title`),
          priceAgorot: rate?.priceAgorot ?? FALLBACK_PRICES[m],
          etaMinDays: rate?.etaMinDays,
          etaMaxDays: rate?.etaMaxDays,
        },
      ];
    });
  }, [rates, t]);

  // ── Totals (display-only; the server recomputes identically) ─────────────
  const subtotal = lines.reduce(
    (sum, l) => sum + l.product.priceAgorot * l.qty,
    0,
  );
  const bagCount = lines.reduce((sum, l) => sum + l.qty, 0);
  const discount = bundleDiscountAgorot(bagCount);
  const merchandise = subtotal - discount;
  const selectedRate = rates?.find((r) => r.method === method) ?? null;
  const shippingKnown = method === "self_pickup" || selectedRate !== null;
  const shipping = method === "self_pickup" ? 0 : selectedRate?.priceAgorot ?? 0;
  const total = merchandise + (shippingKnown ? shipping : 0);
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
    } else if (needsPickup) {
      const pErrs: { city?: string; point?: string } = {};
      if (!pickupCity.trim()) pErrs.city = t("validation.required");
      if (!pickupPointId) pErrs.point = t("validation.selectPoint");
      setPickupErrors(pErrs);
      if (!target && (pErrs.city || pErrs.point)) {
        // No city → focus the city field; city fine but no point chosen → put
        // focus on the section header so the point list is what comes into view.
        target = {
          section: "delivery",
          fieldId: pErrs.city ? "pickup-city" : "section-delivery-header",
        };
      }
    }

    if (target) {
      revealAndFocus(target.section, target.fieldId);
      return;
    }

    // 2) Never submit a method the destination doesn't support.
    if (rates && !rates.some((r) => r.method === method)) {
      setBanner(
        t("validation.notAvailableCity", { city: destinationCity.trim() }),
      );
      setOpenSections((prev) => ({ ...prev, delivery: true }));
      return;
    }

    // 3) Create the order, then the hosted payment session, then leave.
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
            pickupPointId: needsPickup ? pickupPointId : undefined,
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

      // Leaving the app for the hosted payment page — hold the submitting state.
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
      {/* ── Anchored order summary ───────────────────────────────────────── */}
      <div className="lg:sticky lg:top-20 lg:z-20">
        <div className="rounded-xl border border-border bg-card p-5 shadow-ember sm:p-6">
          <h2 className="font-display text-base font-bold text-foreground">
            {t("summary.heading")}
          </h2>

          <ul
            aria-label={t("summary.itemsHeading")}
            className="mt-3 max-h-44 divide-y divide-border/60 overflow-y-auto"
          >
            {lines.map((l) => (
              <li key={l.product.slug} className="flex items-center gap-3 py-2">
                <PouchThumb product={l.product} />
                <span className="min-w-0 flex-1 text-sm text-foreground">
                  <span className="font-medium">{l.product.name[locale]}</span>
                  <span className="text-muted-foreground"> × {l.qty}</span>
                </span>
                <span className="shrink-0 text-sm tabular-nums text-foreground">
                  {formatAgorot(l.product.priceAgorot * l.qty, locale)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-3 flex flex-col gap-2 border-t border-border/60 pt-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">{t("summary.subtotal")}</dt>
              <dd className="font-medium tabular-nums text-foreground">
                {formatAgorot(subtotal, locale)}
              </dd>
            </div>

            {discount > 0 && (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-gold">{t("summary.bundleDiscount")}</dt>
                <dd className="tabular-nums text-gold">
                  {formatAgorot(-discount, locale)}
                </dd>
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">{t("summary.shipping")}</dt>
              <dd
                aria-live="polite"
                className="text-end tabular-nums text-foreground"
              >
                {!shippingKnown
                  ? t("summary.shippingPending")
                  : shipping === 0
                    ? t("summary.free")
                    : formatAgorot(shipping, locale)}
              </dd>
            </div>

            {selectedRate ? (
              <div className="flex items-center justify-between gap-4 text-muted-foreground">
                <dt>{t("summary.eta")}</dt>
                <dd className="text-end">
                  {t("summary.etaDays", {
                    min: selectedRate.etaMinDays,
                    max: selectedRate.etaMaxDays,
                  })}
                </dd>
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-4 text-muted-foreground">
              <dt>{t("summary.vatIncluded")}</dt>
              <dd className="tabular-nums">{formatAgorot(vat, locale)}</dd>
            </div>

            <div className="mt-1 flex items-center justify-between gap-4 border-t border-border/60 pt-3">
              <dt className="font-display text-base font-bold text-foreground">
                {t("summary.total")}
              </dt>
              <dd className="font-display text-lg font-bold tabular-nums text-gold">
                {formatAgorot(total, locale)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

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
            <DeliveryMethodSelect
              value={method}
              onChange={(m) => {
                setBanner(null);
                changeMethod(m);
              }}
              options={options}
              loading={quoting}
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
            ) : needsPickup ? (
              <StepPickup
                type={method === "locker" ? "locker" : "pickup_point"}
                city={pickupCity}
                onCityChange={(c) => {
                  setPickupCity(c);
                  setPickupPointId("");
                  setPickupErrors({});
                }}
                onCityBlur={() =>
                  setPickupErrors((prev) => ({
                    ...prev,
                    city: pickupCity.trim() ? undefined : t("validation.required"),
                  }))
                }
                value={pickupPointId}
                onChange={(id) => {
                  setPickupPointId(id);
                  setPickupErrors((prev) => ({ ...prev, point: undefined }));
                }}
                cityError={pickupErrors.city}
                pointError={pickupErrors.point}
              />
            ) : (
              // self_pickup — no address inputs, just where to collect.
              // PLACEHOLDER address — confirm the real location before go-live.
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

// Same soft radial mask the cart/cards use: melts the pouch render's flat
// background into the dark thumbnail so it reads as floating on its glow.
const POUCH_MASK =
  "radial-gradient(closest-side at 50% 44%, #000 52%, transparent 86%)";

/** Fixed-size (no CLS) pouch thumbnail for the anchored summary. */
function PouchThumb({ product }: { product: Product }) {
  return (
    <span className="relative flex aspect-[4/5] w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-background/40">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background: `radial-gradient(58% 55% at 50% 52%, ${product.glow}, transparent 72%)`,
        }}
      />
      <picture className="relative">
        <source
          srcSet={`/products/${product.image}/pouch.avif`}
          type="image/avif"
        />
        <source
          srcSet={`/products/${product.image}/pouch.webp`}
          type="image/webp"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/products/${product.image}/pouch.jpg`}
          alt=""
          width={900}
          height={1125}
          loading="lazy"
          className="h-full w-auto object-contain"
          style={{ WebkitMaskImage: POUCH_MASK, maskImage: POUCH_MASK }}
        />
      </picture>
    </span>
  );
}

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
