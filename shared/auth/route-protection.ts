// Route protection helpers for Next.js App Router
// These helpers will be used to protect routes based on authentication and authorization

import { redirect } from 'next/navigation';
import { type RouteProtection, UserRole, Permission } from '@/shared/types/auth';
import { roleHasPermission, roleHasAnyPermission, roleHasAllPermissions } from '@/shared/permissions';

/**
 * Configuration for protected routes
 * This will be expanded with actual route configurations in future phases
 */
export const PROTECTED_ROUTES: Record<string, RouteProtection> = {
  // Merchant routes
  '/merchant/overview': {
    requireAuth: true,
    requiredRole: UserRole.MERCHANT,
  },
  '/merchant/integration': {
    requireAuth: true,
    requiredRole: UserRole.MERCHANT,
  },
  '/merchant/pricing': {
    requireAuth: false, // Public pricing page
  },

  // Developer routes
  '/developer/docs': {
    requireAuth: false, // Public documentation
  },
  '/developer/api-reference': {
    requireAuth: true,
    requiredRole: UserRole.DEVELOPER,
  },
  '/developer/sdk': {
    requireAuth: true,
    requiredRole: UserRole.DEVELOPER,
  },

  // Dashboard routes
  '/dashboard/overview': {
    requireAuth: true,
    requiredRole: UserRole.USER,
  },
  '/dashboard/payments': {
    requireAuth: true,
    requiredRole: UserRole.USER,
    requiredPermissions: [Permission.PAYMENT_READ],
  },
  '/dashboard/customers': {
    requireAuth: true,
    requiredRole: UserRole.MERCHANT,
    requiredPermissions: [Permission.CUSTOMER_READ],
  },
  '/dashboard/settings': {
    requireAuth: true,
    requiredRole: UserRole.USER,
  },

  // Payments routes
  '/payments/overview': {
    requireAuth: true,
    requiredRole: UserRole.USER,
  },
  '/payments/methods': {
    requireAuth: true,
    requiredRole: UserRole.USER,
  },
  '/payments/history': {
    requireAuth: true,
    requiredRole: UserRole.USER,
    requiredPermissions: [Permission.PAYMENT_READ],
  },

  // Admin routes
  '/admin/dashboard': {
    requireAuth: true,
    requiredRole: UserRole.ADMIN,
  },
  '/admin/news': {
    requireAuth: true,
    requiredRole: UserRole.ADMIN,
  },
};

/**
 * Check if a route requires authentication
 */
export function requiresAuth(pathname: string): boolean {
  const routeConfig = PROTECTED_ROUTES[pathname];
  return routeConfig?.requireAuth || false;
}

/**
 * Check if a route requires a specific role
 */
export function getRequiredRole(pathname: string): UserRole | undefined {
  const routeConfig = PROTECTED_ROUTES[pathname];
  return routeConfig?.requiredRole;
}

/**
 * Check if a route requires specific permissions
 */
export function getRequiredPermissions(pathname: string): Permission[] | undefined {
  const routeConfig = PROTECTED_ROUTES[pathname];
  return routeConfig?.requiredPermissions;
}

/**
 * Get redirect path for unauthorized access
 */
export function getRedirectPath(pathname: string): string {
  const routeConfig = PROTECTED_ROUTES[pathname];
  return routeConfig?.redirectPath || '/login';
}

/**
 * Validate route access based on user role and permissions
 * This is a placeholder for future implementation
 */
export function validateRouteAccess(
  pathname: string,
  userRole: UserRole,
  userPermissions: Permission[]
): { authorized: boolean; reason?: string } {
  const routeConfig = PROTECTED_ROUTES[pathname];
  
  if (!routeConfig) {
    // Route not configured, allow access by default
    return { authorized: true };
  }

  // Check if authentication is required
  if (routeConfig.requireAuth && userRole === UserRole.GUEST) {
    return { 
      authorized: false, 
      reason: 'Authentication required' 
    };
  }

  // Check if specific role is required
  if (routeConfig.requiredRole) {
    // In future implementation, this would check role hierarchy
    if (userRole !== routeConfig.requiredRole) {
      return { 
        authorized: false, 
        reason: `Role ${routeConfig.requiredRole} required` 
      };
    }
  }

  // Check if specific permissions are required
  if (routeConfig.requiredPermissions && routeConfig.requiredPermissions.length > 0) {
    const hasAllPermissions = routeConfig.requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );
    
    if (!hasAllPermissions) {
      return { 
        authorized: false, 
        reason: 'Required permissions not met' 
      };
    }
  }

  return { authorized: true };
}

/**
 * Server-side route protection helper
 * This would be used in server components and API routes
 */
export function protectRoute(
  pathname: string,
  userRole: UserRole,
  userPermissions: Permission[]
): void {
  const validation = validateRouteAccess(pathname, userRole, userPermissions);
  
  if (!validation.authorized) {
    redirect(getRedirectPath(pathname));
  }
}

/**
 * Client-side route protection hook placeholder
 * This would be used in client components
 */
export function useRouteProtection(pathname: string): {
  authorized: boolean;
  loading: boolean;
  error: string | null;
} {
  // Placeholder implementation
  return {
    authorized: true,
    loading: false,
    error: null,
  };
}

/**
 * Higher-order component for route protection
 * This would wrap page components that need protection
 * Note: This should be moved to a .tsx file when implementing actual JSX
 */
export function withRouteProtection<P extends object>(
  Component: React.ComponentType<P>,
  protection: RouteProtection
): React.ComponentType<P> {
  // Placeholder implementation
  return Component;
}

/**
 * Middleware for route protection
 * This would be used in Next.js middleware.ts
 */
export function middlewareProtection(
  pathname: string,
  session: any
): { authorized: boolean; redirect?: string } {
  // Placeholder implementation
  const routeConfig = PROTECTED_ROUTES[pathname];
  
  if (!routeConfig?.requireAuth) {
    return { authorized: true };
  }

  // In future implementation, this would check the session
  if (!session) {
    return { 
      authorized: false, 
      redirect: getRedirectPath(pathname) 
    };
  }

  return { authorized: true };
}
