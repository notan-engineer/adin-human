"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Accessible combobox (ARIA 1.2 pattern): a text input backed by an async
 * suggestion list. Free text is allowed - the field is NOT restricted to the
 * list, so an unlisted city/street can still be entered. Suggestions are fetched
 * on a ~200ms debounce; stale responses are dropped via a request token.
 *
 * Keyboard: ArrowDown opens/moves, ArrowUp moves, Enter accepts the active
 * option, Escape closes. Options use `onMouseDown` preventDefault so a click
 * selects without stealing focus from the input first. RTL-safe (logical
 * utilities only); the list is a sibling of the input, never nested inside it.
 */
export type AutocompleteProps = {
  value: string;
  onValueChange: (value: string) => void;
  fetchSuggestions: (query: string) => Promise<string[]>;
  label: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  /** Stable id so the wizard can scroll/focus this field on validation. */
  id?: string;
  name?: string;
  inputMode?: React.ComponentProps<typeof Input>["inputMode"];
  autoComplete?: string;
  /** Fired when focus genuinely leaves the field (for validate-on-blur). */
  onBlur?: () => void;
};

const DEBOUNCE_MS = 200;

export function Autocomplete({
  value,
  onValueChange,
  fetchSuggestions,
  label,
  placeholder,
  required,
  error,
  disabled,
  id,
  name,
  inputMode,
  autoComplete = "off",
  onBlur,
}: AutocompleteProps) {
  const reactId = React.useId();
  const baseId = id ?? `ac-${reactId}`;
  const listId = `${baseId}-list`;
  const errorId = `${baseId}-error`;

  const [open, setOpen] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [activeIndex, setActiveIndex] = React.useState(-1);

  const reqToken = React.useRef(0);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const runFetch = React.useCallback(
    (query: string) => {
      const token = ++reqToken.current;
      fetchSuggestions(query)
        .then((res) => {
          if (token !== reqToken.current) return; // a newer request won
          setSuggestions(res);
          setActiveIndex(-1);
          setOpen(res.length > 0);
        })
        .catch(() => {
          if (token !== reqToken.current) return;
          setSuggestions([]);
          setOpen(false);
        });
    },
    [fetchSuggestions],
  );

  const scheduleFetch = React.useCallback(
    (query: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => runFetch(query), DEBOUNCE_MS);
    },
    [runFetch],
  );

  React.useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  function select(next: string) {
    onValueChange(next);
    setOpen(false);
    setActiveIndex(-1);
    setSuggestions([]);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onValueChange(e.target.value);
    scheduleFetch(e.target.value);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) {
          runFetch(value);
          return;
        }
        setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
        break;
      case "ArrowUp":
        if (!open) return;
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        if (open && activeIndex >= 0 && activeIndex < suggestions.length) {
          e.preventDefault();
          select(suggestions[activeIndex]);
        }
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          setOpen(false);
          setActiveIndex(-1);
        }
        break;
    }
  }

  function handleBlur() {
    // Option clicks preventDefault on mousedown, so focus never leaves for them;
    // reaching here means focus really left - close and report for validation.
    setOpen(false);
    setActiveIndex(-1);
    onBlur?.();
  }

  const showList = open && suggestions.length > 0;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={baseId}>
        {label}
        {required ? (
          <span aria-hidden className="text-gold">
            {" "}
            *
          </span>
        ) : null}
      </Label>

      <div className="relative">
        <Input
          id={baseId}
          name={name}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            showList && activeIndex >= 0
              ? `${baseId}-opt-${activeIndex}`
              : undefined
          }
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          aria-required={required || undefined}
          autoComplete={autoComplete}
          inputMode={inputMode}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className={cn(
            error && "border-destructive focus-visible:ring-destructive",
          )}
        />

        {showList ? (
          <ul
            role="listbox"
            id={listId}
            className="absolute inset-x-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-md border border-border bg-popover p-1 text-sm shadow-ember"
          >
            {suggestions.map((s, i) => (
              <li
                key={`${s}-${i}`}
                id={`${baseId}-opt-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => select(s)}
                className={cn(
                  "cursor-pointer rounded-sm px-3 py-2 text-start",
                  i === activeIndex
                    ? "bg-secondary text-secondary-foreground"
                    : "text-popover-foreground",
                )}
              >
                {s}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {error ? (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
