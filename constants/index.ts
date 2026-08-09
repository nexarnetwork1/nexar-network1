export * from "@/lib/constants/design";
export * from "@/lib/constants/navigation";
export * from "@/lib/constants/seo";

export const APP_NAME = "Nexar Network";
export const APP_VERSION = "0.1.0";

export const ROUTES = {
  public: {
    home: "/",
    about: "/about",
    whitepaper: "/whitepaper",
    marketplace: "/marketplace",
    contact: "/contact",
    login: "/login",
    signup: "/login?mode=register",
  },
  private: {
    dashboard: "/dashboard",
    profile: "/profile",
    wallet: "/wallet",
    orders: "/orders",
    invoices: "/invoices",
    merchant: "/merchant",
    admin: "/admin",
  },
} as const;
