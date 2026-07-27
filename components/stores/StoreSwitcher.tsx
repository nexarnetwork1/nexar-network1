"use client";

import { useRouter } from "next/navigation";
import type { Store } from "@/types";

type StoreSwitcherProps = {
  stores: Store[];
  activeStoreId?: string;
};

export function StoreSwitcher({ stores, activeStoreId }: StoreSwitcherProps) {
  const router = useRouter();

  if (stores.length <= 1) return null;

  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      Store
      <select
        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-white"
        value={activeStoreId ?? stores[0]?.id}
        onChange={(e) => router.push(`/merchant?store=${e.target.value}`)}
      >
        {stores.map((store) => (
          <option key={store.id} value={store.id}>
            {store.name}
          </option>
        ))}
      </select>
    </label>
  );
}
