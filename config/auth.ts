export const authConfig = {
  providers: ["email", "google", "apple"] as const,
  sessionCookieName: "sb-access-token",
  redirectAfterLogin: {
    customer: "/marketplace",
    merchant: "/merchant",
    admin: "/admin/dashboard",
  },
  profileCompletionRoute: "/auth/complete-profile",
  authRoutes: ["/login", "/register", "/signup", "/forgot-password", "/reset-password", "/verify-email", "/customer/login", "/merchant/login"],
  publicAuthRoutes: ["/auth/callback", "/auth/complete-profile", "/forgot-password", "/reset-password", "/verify-email"],
  emailVerificationRoute: "/verify-email",
  publicRoutes: ["/pay", "/api/qr", "/api/pay", "/api/health", "/api/csrf", "/marketplace", "/market", "/api/commerce"],
} as const;

export type AuthProvider = (typeof authConfig.providers)[number];
