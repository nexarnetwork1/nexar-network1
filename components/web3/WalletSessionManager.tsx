"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useDisconnect } from "wagmi";
import { isWeb3Configured } from "@/components/providers/Web3Provider";
import {
  clearWalletSession,
  isExternalNavigationUrl,
  isWalletSessionActive,
} from "@/lib/web3/wallet-session";

/**
 * Keeps wallet connections scoped to the current browser tab session.
 * - Persists across client-side routing within Nexar Network
 * - Clears on tab close (sessionStorage) or external navigation
 * - Blocks Privy auto-reconnect when the site is opened in a new tab later
 */
export function WalletSessionManager() {
  const { ready, authenticated, logout } = usePrivy();
  const { disconnect } = useDisconnect();
  const clearingRef = useRef(false);

  const endWalletSession = useCallback(async () => {
    if (clearingRef.current) return;
    clearingRef.current = true;
    clearWalletSession();
    try {
      disconnect();
    } catch {
      // ignore
    }
    try {
      await logout();
    } catch {
      // ignore
    } finally {
      clearingRef.current = false;
    }
  }, [disconnect, logout]);

  useEffect(() => {
    if (!isWeb3Configured() || !ready) return;
    if (authenticated && !isWalletSessionActive()) {
      void endWalletSession();
    }
  }, [ready, authenticated, endWalletSession]);

  useEffect(() => {
    if (!isWeb3Configured()) return;

    function handleDocumentClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || !anchor.href) return;
      if (anchor.target === "_blank") return;
      if (!isExternalNavigationUrl(anchor.href)) return;
      void endWalletSession();
    }

    function handlePageHide() {
      const nav = performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined;
      if (nav?.type === "reload") return;
      void endWalletSession();
    }

    document.addEventListener("click", handleDocumentClick, true);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [endWalletSession]);

  return null;
}
