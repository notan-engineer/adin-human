"use client";

import * as React from "react";
import { Clock, MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Autocomplete } from "@/components/checkout/Autocomplete";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { PickupPoint } from "@/lib/commerce/types";

type Props = {
  type: "pickup_point" | "locker";
  city: string;
  onCityChange: (city: string) => void;
  onCityBlur?: () => void;
  value: string; // selected pickupPointId
  onChange: (id: string) => void;
  cityError?: string;
  pointError?: string;
};

/**
 * Step 2 (pickup / locker variants) — pick a city, then choose one of the
 * collection points the delivery provider returns for it. Points are fetched
 * (debounced) whenever the city changes and rendered as selectable radio cards
 * showing name, address and opening hours. Selecting one sets `pickupPointId`.
 * RTL-safe via logical utilities.
 */
export function StepPickup({
  type,
  city,
  onCityChange,
  onCityBlur,
  value,
  onChange,
  cityError,
  pointError,
}: Props) {
  const t = useTranslations("checkout");
  const locale = useLocale() as "he" | "en";

  const [points, setPoints] = React.useState<PickupPoint[]>([]);
  const [loading, setLoading] = React.useState(false);

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

  React.useEffect(() => {
    if (!city.trim()) {
      setPoints([]);
      return;
    }
    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      fetch(
        `/api/delivery/pickup-points?city=${encodeURIComponent(
          city,
        )}&type=${type}`,
      )
        .then((r) => (r.ok ? r.json() : { points: [] }))
        .then((d: { points?: PickupPoint[] }) => {
          if (!active) return;
          setPoints(d.points ?? []);
          setLoading(false);
        })
        .catch(() => {
          if (!active) return;
          setPoints([]);
          setLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [city, type]);

  return (
    <div className="flex flex-col gap-5">
      <Autocomplete
        id="pickup-city"
        label={t("pickup.cityLabel")}
        placeholder={t("pickup.cityPlaceholder")}
        value={city}
        onValueChange={onCityChange}
        onBlur={onCityBlur}
        fetchSuggestions={fetchCities}
        error={cityError}
        required
      />

      {city.trim() ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground">
            {t("pickup.selectPoint")}
          </p>

          {loading ? (
            <p className="text-sm text-muted-foreground">{t("pickup.loading")}</p>
          ) : points.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("pickup.noPoints")}</p>
          ) : (
            <>
              <RadioGroup
                value={value}
                onValueChange={onChange}
                className="gap-3"
                aria-label={t("pickup.selectPoint")}
              >
                {points.map((p) => {
                  const id = `pp-${p.id}`;
                  return (
                    <Label
                      key={p.id}
                      htmlFor={id}
                      className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-gold/50 has-[:checked]:border-gold has-[:checked]:bg-secondary/30"
                    >
                      <RadioGroupItem value={p.id} id={id} className="mt-1" />
                      <span className="flex min-w-0 flex-col gap-1">
                        <span className="font-display font-bold text-foreground">
                          {p.name}
                        </span>
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin aria-hidden className="size-3.5 shrink-0" />
                          {p.address}
                        </span>
                        {p.openingHours ? (
                          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock aria-hidden className="size-3.5 shrink-0" />
                            {p.openingHours}
                          </span>
                        ) : null}
                      </span>
                    </Label>
                  );
                })}
              </RadioGroup>
              {pointError ? (
                <p className="text-xs text-destructive">{pointError}</p>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
