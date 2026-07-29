/** Session-scoped wallet connection marker — cleared when the browser tab closes. */
export const WALLET_SESSION_KEY = "nxr_wallet_session";

export function isWalletSessionActive(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(WALLET_SESSION_KEY) === "active";
}

export function markWalletSessionActive(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(WALLET_SESSION_KEY, "active");
}

export function clearWalletSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(WALLET_SESSION_KEY);
}

/** True when the user is navigating away from this origin (external link). */
export function isExternalNavigationUrl(url: string): boolean {
  try {
    const target = new URL(url, window.location.origin);
    return target.origin !== window.location.origin;
  } catch {
    return false;
  }
}
