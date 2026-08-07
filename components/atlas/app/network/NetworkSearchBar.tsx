"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type NetworkSearchBarProps = {
  className?: string;
  defaultQuery?: string;
  query?: string;
  onQueryChange?: (value: string) => void;
  compact?: boolean;
  onSubmit?: (query: string) => void;
};

export function NetworkSearchBar({
  className,
  defaultQuery = "",
  query: controlledQuery,
  onQueryChange,
  compact,
  onSubmit,
}: NetworkSearchBarProps) {
  const router = useRouter();
  const [internalQuery, setInternalQuery] = useState(defaultQuery);
  const query = controlledQuery ?? internalQuery;

  const setQuery = (value: string) => {
    if (onQueryChange) onQueryChange(value);
    else setInternalQuery(value);
  };

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    if (onSubmit) {
      onSubmit(q);
      return;
    }
    router.push(`/atlas/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={handleSubmit} className={cn("relative w-full", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search people, companies, posts..."
        aria-label="Search ATLAS Network"
        className={cn(
          "w-full pl-9 pr-4 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-muted focus:outline-none focus:border-gold/40 transition-colors",
          compact ? "h-9 text-sm" : "h-10 text-sm",
        )}
      />
    </form>
  );
}
