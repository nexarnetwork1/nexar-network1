export const authConfig = {
  providers: ["email", "google", "apple"] as const,
  sessionCookieName: "sb-access-token",
  redirectAfterLogin: {
    customer: "/customer",
    merchant: "/merchant",
    admin: "/admin/dashboard",
  },
  profileCompletionRoute: "/auth/complete-profile",
  authRoutes: ["/login", "/register", "/signup"],
  publicAuthRoutes: ["/auth/callback", "/auth/complete-profile"],
} as const;

export type AuthProvider = (typeof authConfig.providers)[number];
