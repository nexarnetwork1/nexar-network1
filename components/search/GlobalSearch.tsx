"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { SearchResult } from "@/types";

export function GlobalSearch({ apiPath = "/api/search" }: { apiPath?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [pending, startTransition] = useTransition();

  function handleSearch(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    startTransition(async () => {
      const res = await fetch(`${apiPath}?q=${encodeURIComponent(value.trim())}`);
      const data = await res.json();
      setResults(data.results ?? []);
    });
  }

  return (
    <div className="relative w-full max-w-md">
      <input
        type="search"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search products, orders, invoices…"
        className="w-full rounded-xl border border-border bg-surface px-4 py-2 text-sm text-white"
      />
      {(results.length > 0 || pending) && query.length >= 2 && (
        <div className="absolute z-20 mt-2 w-full rounded-xl border border-border bg-black/95 p-2 shadow-xl">
          {pending && <p className="px-3 py-2 text-sm text-muted">Searching…</p>}
          {results.map((r) => (
            <Link
              key={`${r.type}-${r.id}`}
              href={`/admin/${r.type}s/${r.id}`}
              className="block rounded-lg px-3 py-2 text-sm hover:bg-surface"
            >
              <span className="text-xs uppercase text-gold">{r.type}</span>
              <p className="text-white">{r.title}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
