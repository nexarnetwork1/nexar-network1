import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

type UIState = {
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
};

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        sidebarOpen: true,
        mobileMenuOpen: false,
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
        toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
        toggleMobileMenu: () => set((s) => ({ mobileMenuOpen: !s.mobileMenuOpen })),
      }),
      { name: "nxr-ui" }
    ),
    { name: "UIStore" }
  )
);
