/**
 * Navigation for the customer, merchant and admin portals.
 *
 * Previously each portal hardcoded its links inside its layout file, which is
 * why the same list had to be repeated for the sidebar, the mobile drawer and
 * the breadcrumb trail. Every link and every URL here is carried over verbatim
 * from those layouts — nothing was added, removed or renamed.
 */

/** Icon names resolved against the registry in `components/dashboard/icons.ts`. */
export type DashboardIconName =
  | "activity"
  | "bell"
  | "boxes"
  | "building"
  | "chart"
  | "clipboard"
  | "coins"
  | "cog"
  | "creditCard"
  | "database"
  | "fileText"
  | "gauge"
  | "heart"
  | "home"
  | "layers"
  | "lifeBuoy"
  | "megaphone"
  | "package"
  | "receipt"
  | "scale"
  | "search"
  | "shield"
  | "shoppingBag"
  | "shoppingCart"
  | "store"
  | "tag"
  | "truck"
  | "user"
  | "users"
  | "wallet"
  | "webhook";

export type DashboardNavItem = {
  label: string;
  href: string;
  icon?: DashboardIconName;
  /** Match the pathname exactly instead of by prefix. Used for portal roots. */
  exact?: boolean;
  /** Optional count rendered as a pill. Supplied by the layout at request time. */
  badge?: number | string | null;
};

export type DashboardNavSection = {
  title?: string;
  items: DashboardNavItem[];
};

// ---------------------------------------------------------------------------
// Customer
// ---------------------------------------------------------------------------

export function customerNav(options?: {
  pendingInvoices?: number | null;
}): DashboardNavSection[] {
  const pendingInvoices = options?.pendingInvoices ?? 0;

  return [
    {
      items: [{ label: "Overview", href: "/customer", icon: "home", exact: true }],
    },
    {
      title: "Purchases",
      items: [
        { label: "Orders", href: "/customer/orders", icon: "shoppingBag" },
        {
          label: "Invoices",
          href: "/customer/invoices",
          icon: "receipt",
          badge: pendingInvoices > 0 ? pendingInvoices : null,
        },
        { label: "History", href: "/customer/purchases", icon: "clipboard" },
        { label: "Disputes", href: "/customer/disputes", icon: "scale" },
      ],
    },
    {
      title: "Shop",
      items: [
        { label: "Marketplace", href: "/marketplace", icon: "store", exact: true },
        { label: "Wishlist", href: "/marketplace/wishlist", icon: "heart" },
        { label: "Cart", href: "/marketplace/cart", icon: "shoppingCart" },
      ],
    },
    {
      title: "Account",
      items: [
        { label: "Wallet", href: "/customer/wallet", icon: "wallet" },
        { label: "Payment methods", href: "/customer/payment-methods", icon: "creditCard" },
        { label: "Addresses", href: "/customer/addresses", icon: "truck" },
        { label: "Notifications", href: "/customer/notifications", icon: "bell" },
        { label: "Profile", href: "/customer/profile", icon: "user" },
      ],
    },
  ];
}

// ---------------------------------------------------------------------------
// Merchant
// ---------------------------------------------------------------------------

export function merchantNav(options?: {
  paymentsOnly?: boolean;
}): DashboardNavSection[] {
  const paymentsOnly = options?.paymentsOnly ?? false;

  const catalog: DashboardNavItem[] = paymentsOnly
    ? []
    : [
        { label: "Products", href: "/merchant/products", icon: "package" },
        { label: "Categories", href: "/merchant/categories", icon: "layers" },
        { label: "Store Builder", href: "/merchant/store/builder", icon: "boxes" },
      ];

  const sales: DashboardNavItem[] = [
    { label: "Orders", href: "/merchant/orders", icon: "shoppingBag" },
    { label: "Invoices", href: "/merchant/invoices", icon: "receipt", exact: true },
    ...(paymentsOnly
      ? [
          {
            label: "New payment",
            href: "/merchant/invoices/new",
            icon: "creditCard" as const,
          },
        ]
      : []),
    { label: "Customers", href: "/merchant/customers", icon: "users" },
    { label: "Disputes", href: "/merchant/disputes", icon: "scale" },
    { label: "Coupons", href: "/merchant/coupons", icon: "tag" },
  ];

  return [
    {
      items: [{ label: "Overview", href: "/merchant", icon: "home", exact: true }],
    },
    ...(catalog.length > 0 ? [{ title: "Catalog", items: catalog }] : []),
    { title: "Sales", items: sales },
    {
      title: "Finance",
      items: [
        { label: "Revenue", href: "/merchant/revenue", icon: "chart" },
        { label: "Wallet", href: "/merchant/wallet", icon: "wallet" },
        { label: "Withdrawals", href: "/merchant/withdrawals", icon: "coins" },
        { label: "Analytics", href: "/merchant/analytics", icon: "gauge" },
      ],
    },
    {
      title: "Store",
      items: [
        {
          label: paymentsOnly ? "QR & Settings" : "Store",
          href: "/merchant/store",
          icon: "store",
          exact: true,
        },
        { label: "Stores", href: "/merchant/stores", icon: "building" },
        { label: "Webhooks", href: "/merchant/webhooks", icon: "webhook" },
      ],
    },
    {
      title: "Account",
      items: [
        { label: "Notifications", href: "/merchant/notifications", icon: "bell" },
        { label: "Profile", href: "/merchant/profile", icon: "user" },
      ],
    },
  ];
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export const ADMIN_NAV: DashboardNavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Overview", href: "/admin/dashboard", icon: "home" },
      { label: "Revenue", href: "/admin/revenue", icon: "chart" },
      { label: "Analytics", href: "/admin/analytics", icon: "gauge" },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Merchants", href: "/admin/merchants", icon: "store" },
      { label: "Customers", href: "/admin/customers", icon: "users" },
      { label: "Users", href: "/admin/users", icon: "user" },
      { label: "Orders", href: "/admin/orders", icon: "shoppingBag" },
      { label: "Invoices", href: "/admin/invoices", icon: "receipt" },
      { label: "Payments", href: "/admin/payments", icon: "creditCard" },
      { label: "Products", href: "/admin/products", icon: "package" },
      { label: "Reviews", href: "/admin/reviews", icon: "clipboard" },
      { label: "Reports", href: "/admin/reports", icon: "fileText" },
      { label: "Marketplace", href: "/admin/marketplace", icon: "shoppingCart" },
    ],
  },
  {
    title: "Platform",
    items: [
      { label: "Treasury", href: "/admin/treasury", icon: "wallet" },
      { label: "Coupons", href: "/admin/coupons", icon: "tag" },
      { label: "Platform Fees", href: "/admin/platform-fees", icon: "coins" },
      { label: "Exchange Rates", href: "/admin/exchange-rates", icon: "activity" },
      { label: "Currencies", href: "/admin/currencies", icon: "database" },
      { label: "Promotions", href: "/admin/promotions", icon: "megaphone" },
      { label: "Settings", href: "/admin/settings", icon: "cog" },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Escrow", href: "/admin/escrow", icon: "shield" },
      { label: "Disputes", href: "/admin/disputes", icon: "scale" },
      { label: "Verification", href: "/admin/verification", icon: "lifeBuoy" },
      { label: "Withdrawals", href: "/admin/withdrawals", icon: "coins" },
      { label: "Settlement Reports", href: "/admin/settlement-reports", icon: "fileText" },
    ],
  },
  {
    title: "Security",
    items: [
      { label: "Audit Logs", href: "/admin/audit-logs", icon: "clipboard" },
      { label: "Security", href: "/admin/security", icon: "shield" },
      { label: "System Health", href: "/admin/system-health", icon: "activity" },
      { label: "Contact", href: "/admin/contact", icon: "bell" },
    ],
  },
  {
    title: "CMS",
    items: [{ label: "News Ticker", href: "/admin/news-ticker", icon: "megaphone" }],
  },
];

/** Flattened lookup used by the breadcrumb to label the current route. */
export function flattenNav(sections: DashboardNavSection[]): DashboardNavItem[] {
  return sections.flatMap((section) => section.items);
}
