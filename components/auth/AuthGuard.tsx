"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAtlasAuth } from "@/components/atlas/auth/AtlasAuthProvider";

type AuthGuardProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
};

/**
 * AuthGuard - Protects content that requires authentication.
 *
 * If requireAuth is true and user is not authenticated, opens auth modal
 * instead of redirecting. This allows for a better UX where users can
 * explore the platform and only authenticate when they need to perform
 * protected actions.
 *
 * Usage:
 * <AuthGuard requireAuth>
 *   <ProtectedComponent />
 * </AuthGuard>
 */
export function AuthGuard({
  children,
  fallback,
  requireAuth = false,
  redirectTo,
}: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { openAtlasAuth } = useAtlasAuth();

  // Show loading state while checking session
  if (status === "loading") {
    return fallback ?? <div className="animate-pulse" />;
  }

  // If auth is required but user is not authenticated
  if (requireAuth && !session?.user?.id) {
    // Open auth modal instead of redirecting
    openAtlasAuth({
      mode: "signin",
      redirect: redirectTo ?? window.location.pathname,
    });
    return fallback ?? null;
  }

  // If user is authenticated or auth is not required, show children
  return <>{children}</>;
}

/**
 * useAuthGuard - Hook for protecting actions that require authentication.
 *
 * Returns a function that can be called to check auth before performing an action.
 *
 * Usage:
 * const { requireAuth } = useAuthGuard();
 *
 * const handleClick = () => {
 *   requireAuth(() => {
 *     // Perform protected action
 *   });
 * };
 */
export function useAuthGuard() {
  const { data: session, status } = useSession();
  const { openAtlasAuth } = useAtlasAuth();

  const requireAuth = (
    callback: () => void,
    options?: { redirect?: string }
  ) => {
    if (status === "loading") {
      return;
    }

    if (!session?.user?.id) {
      openAtlasAuth({
        mode: "signin",
        redirect: options?.redirect ?? window.location.pathname,
      });
      return;
    }

    callback();
  };

  const isAuthenticated = status === "authenticated" && !!session?.user?.id;
  const isLoading = status === "loading";

  return {
    requireAuth,
    isAuthenticated,
    isLoading,
  };
}
