/**
 * TanStack Query key factory.
 * Keeps cache keys consistent across features and hooks.
 */
export const queryKeys = {
  auth: {
    session: ["auth", "session"] as const,
    profile: (userId: string) => ["auth", "profile", userId] as const,
  },
  catalog: {
    all: ["catalog"] as const,
    product: (id: string) => ["catalog", "product", id] as const,
    search: (params: Record<string, unknown>) =>
      ["catalog", "search", params] as const,
  },
  marketplace: {
    cart: (customerId: string) => ["marketplace", "cart", customerId] as const,
  },
  orders: {
    all: (role: string, userId: string) => ["orders", role, userId] as const,
    detail: (id: string) => ["orders", "detail", id] as const,
  },
  invoices: {
    all: (role: string, userId: string) => ["invoices", role, userId] as const,
    detail: (id: string) => ["invoices", "detail", id] as const,
  },
  payments: {
    session: (id: string) => ["payments", "session", id] as const,
    options: (invoiceId: string) => ["payments", "options", invoiceId] as const,
  },
  wallet: {
    summary: (userId: string) => ["wallet", "summary", userId] as const,
    transactions: (walletId: string) => ["wallet", "transactions", walletId] as const,
  },
  notifications: {
    all: (userId: string) => ["notifications", userId] as const,
    unread: (userId: string) => ["notifications", "unread", userId] as const,
  },
  admin: {
    stats: ["admin", "stats"] as const,
    revenue: (months: number) => ["admin", "revenue", months] as const,
  },
} as const;
