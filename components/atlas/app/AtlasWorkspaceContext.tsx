"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "atlas-sidebar-collapsed";

type AtlasWorkspaceContextValue = {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
};

const AtlasWorkspaceContext = createContext<AtlasWorkspaceContextValue | null>(null);

export function AtlasWorkspaceProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(false);

  useEffect(() => {
    try {
      setSidebarCollapsedState(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ sidebarCollapsed, toggleSidebar, setSidebarCollapsed }),
    [sidebarCollapsed, toggleSidebar, setSidebarCollapsed],
  );

  return (
    <AtlasWorkspaceContext.Provider value={value}>{children}</AtlasWorkspaceContext.Provider>
  );
}

export function useAtlasWorkspace(): AtlasWorkspaceContextValue {
  const ctx = useContext(AtlasWorkspaceContext);
  if (!ctx) {
    throw new Error("useAtlasWorkspace must be used within AtlasWorkspaceProvider");
  }
  return ctx;
}

/** Opens the global Nexar Assistant panel (UI event only). */
export function openAtlasAssistant() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("nxr:assistant-open"));
  }
}
