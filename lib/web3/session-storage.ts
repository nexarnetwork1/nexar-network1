/** Wagmi-compatible storage adapter backed by sessionStorage. */
export function createSessionStorageAdapter() {
  return {
    getItem(key: string) {
      if (typeof window === "undefined") return null;
      return sessionStorage.getItem(key);
    },
    setItem(key: string, value: string) {
      if (typeof window === "undefined") return;
      sessionStorage.setItem(key, value);
    },
    removeItem(key: string) {
      if (typeof window === "undefined") return;
      sessionStorage.removeItem(key);
    },
  };
}
