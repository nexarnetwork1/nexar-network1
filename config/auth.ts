export const authConfig = {
  providers: ["email", "google", "wallet"] as const,
  sessionCookieName: "authjs.session-token",
  // All roles land at /dashboard. getDashboardPath() is the canonical source of
  // truth; this map is kept for reference and any legacy consumers.
  redirectAfterLogin: {
    customer: "/atlas",
    merchant: "/atlas",
    business: "/atlas",
    admin: "/atlas",
    super_admin: "/atlas",
  },
  profileCompletionRoute: "/auth/complete-profile",
  authRoutes: [
    "/login",
    "/register",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    // Legacy aliases — all redirect to /login
    "/customer/login",
    "/merchant/login",
  ],
  publicAuthRoutes: [
    "/auth/callback",
    "/auth/verify",
    "/auth/complete-profile",
    "/auth/verify-email-change",
    "/auth/change-password",
    "/auth/enable-2fa",
    "/api/auth",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ],
  emailVerificationRoute: "/verify-email",
  publicRoutes: [
    "/pay",
    "/api/qr",
    "/api/pay",
    "/api/health",
    "/api/csrf",
    "/marketplace",
    "/market",
    "/api/commerce",
  ],
} as const;

export type AuthProvider = (typeof authConfig.providers)[number];
