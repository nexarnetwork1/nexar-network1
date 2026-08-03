"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Sidebar collapse preference, stored per portal.
 *
 * Read through `useSyncExternalStore` rather than an effect so the value comes
 * from localStorage on the first client render instead of triggering a second
 * one, and so other tabs stay in sync.
 */

const listeners = new Set<() => void>();
const memory = new Map<string, boolean>();
let storageUsable = true;

function emit() {
  for (const listener of listeners) listener();
}

function read(key: string): boolean {
  if (storageUsable) {
    try {
      return window.localStorage.getItem(key) === "1";
    } catch {
      // Blocked storage (private mode, hardened settings) — fall back to memory.
      storageUsable = false;
    }
  }
  return memory.get(key) ?? false;
}

function write(key: string, value: boolean) {
  memory.set(key, value);
  if (!storageUsable) return;
  try {
    window.localStorage.setItem(key, value ? "1" : "0");
  } catch {
    storageUsable = false;
  }
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function useSidebarCollapsed(key: string): [boolean, () => void] {
  const collapsed = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => false,
  );

  const toggle = useCallback(() => {
    write(key, !read(key));
    emit();
  }, [key]);

  return [collapsed, toggle];
}
