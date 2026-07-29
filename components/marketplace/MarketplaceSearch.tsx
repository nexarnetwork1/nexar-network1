"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { MarketplaceSearchSuggestion } from "@/modules/marketplace/search";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";

type MarketplaceSearchProps = {
  action?: string;
  defaultValue?: string;
  placeholder?: string;
  inputClassName?: string;
  className?: string;
  showSubmit?: boolean;
  submitLabel?: string;
  variant?: "hero" | "compact";
  asField?: boolean;
};

const TYPE_LABELS: Record<MarketplaceSearchSuggestion["type"], string> = {
  product: "Product",
  category: "Category",
  store: "Store",
};

export function MarketplaceSearch({
  action = "/marketplace/browse",
  defaultValue = "",
  placeholder = "Search products, brands, categories…",
  inputClassName,
  className,
  showSubmit = true,
  submitLabel = "Search",
  variant = "hero",
  asField = false,
}: MarketplaceSearchProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<MarketplaceSearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function fetchSuggestions(value: string) {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    startTransition(async () => {
      const res = await fetch(`/api/marketplace/search?q=${encodeURIComponent(trimmed)}`);
      if (!res.ok) {
        setSuggestions([]);
        return;
      }

      const data = (await res.json()) as { suggestions?: MarketplaceSearchSuggestion[] };
      setSuggestions(data.suggestions ?? []);
      setOpen(true);
    });
  }

  function handleChange(value: string) {
    setQuery(value);
    fetchSuggestions(value);
  }

  const inputClasses =
    inputClassName ??
    (variant === "hero"
      ? "w-full rounded-2xl border border-border/80 bg-card/70 py-4 pl-11 pr-4 text-sm shadow-lg shadow-black/10 backdrop-blur-xl outline-none transition focus:border-gold/40 focus:ring-2 focus:ring-gold/15"
      : "w-full rounded-xl border border-border bg-surface/80 px-4 py-3 pl-11 text-sm outline-none focus:border-gold/40");

  const field = (
    <div ref={containerRef} className={variant === "hero" ? "relative flex-1" : "relative"}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        name="q"
        type="search"
        value={query}
        onChange={(event) => handleChange(event.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        placeholder={placeholder}
        className={inputClasses}
        aria-label="Search marketplace products"
        aria-autocomplete="list"
        aria-controls={open ? listboxId : undefined}
        aria-expanded={open}
        autoComplete="off"
      />

      {open && (suggestions.length > 0 || pending) && query.trim().length >= 2 && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-border/80 bg-background/95 shadow-2xl backdrop-blur-xl"
        >
          {pending && <p className="px-4 py-3 text-sm text-muted">Searching…</p>}
          {suggestions.map((suggestion) => (
            <Link
              key={`${suggestion.type}-${suggestion.id}`}
              href={suggestion.href}
              role="option"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 border-b border-border/40 px-4 py-3 text-left transition last:border-b-0 hover:bg-card/60"
            >
              {suggestion.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={suggestion.imageUrl}
                  alt=""
                  className="h-10 w-10 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-xs text-muted">
                  {TYPE_LABELS[suggestion.type][0]}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{suggestion.title}</p>
                <p className="truncate text-xs text-muted">
                  {suggestion.subtitle ?? TYPE_LABELS[suggestion.type]}
                </p>
              </div>
              <span className="shrink-0 text-[10px] uppercase tracking-wide text-gold">
                {TYPE_LABELS[suggestion.type]}
              </span>
            </Link>
          ))}
          {!pending && suggestions.length > 0 && !asField && (
            <button
              type="submit"
              className="block w-full px-4 py-3 text-left text-sm text-gold hover:bg-card/60"
            >
              View all results for “{query.trim()}”
            </button>
          )}
          {!pending && suggestions.length > 0 && asField && (
            <Link
              href={`/marketplace/browse?q=${encodeURIComponent(query.trim())}`}
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm text-gold hover:bg-card/60"
            >
              View all results for “{query.trim()}”
            </Link>
          )}
        </div>
      )}
    </div>
  );

  if (asField) {
    return (
      <div className={cn("relative w-full", className)}>
        {field}
      </div>
    );
  }

  return (
    <form
      action={action}
      method="get"
      className={cn(
        variant === "hero"
          ? "mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row"
          : "relative w-full",
        className
      )}
      onSubmit={() => setOpen(false)}
    >
      {field}

      {showSubmit && variant === "hero" && (
        <Button type="submit" size="lg" className="shrink-0 px-8">
          {submitLabel}
        </Button>
      )}
    </form>
  );
}
