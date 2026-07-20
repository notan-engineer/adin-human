"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";

import { Autocomplete } from "@/components/checkout/Autocomplete";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Address } from "@/lib/commerce/types";
import { cn } from "@/lib/utils";

export type AddressErrors = Partial<Record<keyof Address, string>>;

type Props = {
  value: Address;
  onChange: (next: Address) => void;
  errors?: AddressErrors;
  /** Fired on blur of a single field so the parent can validate just that one. */
  onBlurField?: (field: keyof Address) => void;
  /** Prefix for field ids so the wizard can scroll/focus on validation. */
  idPrefix?: string;
};

/** A single labelled text input with inline error, top-aligned label. */
function TextField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  required,
  type = "text",
  inputMode,
  placeholder,
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
  placeholder?: string;
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
        placeholder={placeholder}
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

/**
 * Israeli shipping-address form, fully controlled via `value`/`onChange`. City
 * and street use the accessible {@link Autocomplete} (city → /api/address/cities,
 * street → /api/address/streets?city=, disabled until a city is set). Validation
 * is owned by the parent wizard; this form only surfaces `errors` and reports
 * per-field blurs via `onBlurField`. RTL-safe (logical utilities only).
 */
export function IsraeliAddressForm({
  value,
  onChange,
  errors = {},
  onBlurField,
  idPrefix = "addr",
}: Props) {
  const t = useTranslations("checkout");
  const locale = useLocale() as "he" | "en";

  const set =
    (field: keyof Address) =>
    (v: string): void =>
      onChange({ ...value, [field]: v });

  const blur = (field: keyof Address) => () => onBlurField?.(field);

  const fetchCities = React.useCallback(
    async (q: string): Promise<string[]> => {
      const res = await fetch(`/api/address/cities?q=${encodeURIComponent(q)}`);
      if (!res.ok) return [];
      const data = (await res.json()) as {
        cities: { he: string; en: string }[];
      };
      return data.cities.map((c) => (locale === "he" ? c.he : c.en));
    },
    [locale],
  );

  const city = value.city;
  const fetchStreets = React.useCallback(
    async (q: string): Promise<string[]> => {
      if (!city.trim()) return [];
      const res = await fetch(
        `/api/address/streets?city=${encodeURIComponent(
          city,
        )}&q=${encodeURIComponent(q)}`,
      );
      if (!res.ok) return [];
      const data = (await res.json()) as { streets: string[] };
      return data.streets;
    },
    [city],
  );

  const notesId = `${idPrefix}-notes`;

  return (
    <div className="flex flex-col gap-4">
      <TextField
        id={`${idPrefix}-recipientName`}
        label={t("address.recipientName")}
        value={value.recipientName}
        onChange={set("recipientName")}
        onBlur={blur("recipientName")}
        error={errors.recipientName}
        required
        autoComplete="name"
      />

      <TextField
        id={`${idPrefix}-phone`}
        label={t("address.phone")}
        value={value.phone}
        onChange={set("phone")}
        onBlur={blur("phone")}
        error={errors.phone}
        required
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder="05X-XXXXXXX"
      />

      <Autocomplete
        id={`${idPrefix}-city`}
        label={t("address.city")}
        placeholder={t("address.cityPlaceholder")}
        value={value.city}
        onValueChange={set("city")}
        onBlur={blur("city")}
        fetchSuggestions={fetchCities}
        error={errors.city}
        required
      />

      <Autocomplete
        id={`${idPrefix}-street`}
        label={t("address.street")}
        placeholder={
          value.city.trim()
            ? t("address.streetPlaceholder")
            : t("address.streetDisabled")
        }
        value={value.street}
        onValueChange={set("street")}
        onBlur={blur("street")}
        fetchSuggestions={fetchStreets}
        error={errors.street}
        required
        disabled={!value.city.trim()}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id={`${idPrefix}-houseNumber`}
          label={t("address.houseNumber")}
          value={value.houseNumber}
          onChange={set("houseNumber")}
          onBlur={blur("houseNumber")}
          error={errors.houseNumber}
          required
          inputMode="numeric"
        />
        <TextField
          id={`${idPrefix}-apartment`}
          label={t("address.apartment")}
          value={value.apartment ?? ""}
          onChange={set("apartment")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          id={`${idPrefix}-entrance`}
          label={t("address.entrance")}
          value={value.entrance ?? ""}
          onChange={set("entrance")}
        />
        <TextField
          id={`${idPrefix}-floor`}
          label={t("address.floor")}
          value={value.floor ?? ""}
          onChange={set("floor")}
          inputMode="numeric"
        />
        <TextField
          id={`${idPrefix}-postalCode`}
          label={t("address.postalCode")}
          value={value.postalCode ?? ""}
          onChange={set("postalCode")}
          onBlur={blur("postalCode")}
          error={errors.postalCode}
          inputMode="numeric"
          autoComplete="postal-code"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={notesId}>{t("address.notes")}</Label>
        <textarea
          id={notesId}
          rows={3}
          value={value.notes ?? ""}
          placeholder={t("address.notesPlaceholder")}
          onChange={(e) => set("notes")(e.target.value)}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background/40 px-3 py-2 text-sm ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
    </div>
  );
}
