// Role-based permission definitions for Nexar Network platform

import { UserRole, Permission } from '@/shared/types/auth';

/**
 * Role permission matrix
 * Defines which permissions each role has access to
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.GUEST]: [
    // Guests have no permissions by default
  ],

  [UserRole.USER]: [
    // Basic user permissions
    Permission.PAYMENT_READ,
    Permission.CUSTOMER_READ,
    Permission.SUBSCRIPTION_READ,
  ],

  [UserRole.MERCHANT]: [
    // All user permissions plus merchant-specific permissions
    Permission.PAYMENT_READ,
    Permission.PAYMENT_CREATE,
    Permission.PAYMENT_UPDATE,
    Permission.PAYMENT_REFUND,
    Permission.CUSTOMER_READ,
    Permission.CUSTOMER_CREATE,
    Permission.CUSTOMER_UPDATE,
    Permission.SUBSCRIPTION_READ,
    Permission.SUBSCRIPTION_CREATE,
    Permission.SUBSCRIPTION_UPDATE,
    Permission.SUBSCRIPTION_CANCEL,
    Permission.MERCHANT_READ,
    Permission.MERCHANT_UPDATE,
    Permission.API_KEY_CREATE,
    Permission.API_KEY_READ,
    Permission.API_KEY_UPDATE,
    Permission.API_KEY_DELETE,
    Permission.WEBHOOK_CREATE,
    Permission.WEBHOOK_READ,
    Permission.WEBHOOK_UPDATE,
    Permission.WEBHOOK_DELETE,
    Permission.WEBHOOK_RESEND,
    Permission.DEVELOPER_API_ACCESS,
    Permission.DEVELOPER_WEBHOOK_MANAGE,
  ],

  [UserRole.DEVELOPER]: [
    // Developer-specific permissions
    Permission.PAYMENT_READ,
    Permission.CUSTOMER_READ,
    Permission.SUBSCRIPTION_READ,
    Permission.DEVELOPER_API_ACCESS,
    Permission.DEVELOPER_SDK_ACCESS,
    Permission.DEVELOPER_TEST_MODE,
    Permission.API_KEY_CREATE,
    Permission.API_KEY_READ,
    Permission.API_KEY_UPDATE,
    Permission.API_KEY_DELETE,
    Permission.WEBHOOK_CREATE,
    Permission.WEBHOOK_READ,
    Permission.WEBHOOK_UPDATE,
    Permission.WEBHOOK_DELETE,
  ],

  [UserRole.ADMIN]: [
    // All merchant permissions plus admin capabilities
    Permission.PAYMENT_READ,
    Permission.PAYMENT_CREATE,
    Permission.PAYMENT_UPDATE,
    Permission.PAYMENT_DELETE,
    Permission.PAYMENT_REFUND,
    Permission.CUSTOMER_READ,
    Permission.CUSTOMER_CREATE,
    Permission.CUSTOMER_UPDATE,
    Permission.CUSTOMER_DELETE,
    Permission.SUBSCRIPTION_READ,
    Permission.SUBSCRIPTION_CREATE,
    Permission.SUBSCRIPTION_UPDATE,
    Permission.SUBSCRIPTION_DELETE,
    Permission.SUBSCRIPTION_CANCEL,
    Permission.MERCHANT_READ,
    Permission.MERCHANT_CREATE,
    Permission.MERCHANT_UPDATE,
    Permission.MERCHANT_VERIFY,
    Permission.ADMIN_USER_MANAGE,
    Permission.ADMIN_ROLE_MANAGE,
    Permission.ADMIN_SYSTEM_CONFIG,
    Permission.ADMIN_AUDIT_LOGS,
    Permission.ADMIN_ANALYTICS,
    Permission.API_KEY_CREATE,
    Permission.API_KEY_READ,
    Permission.API_KEY_UPDATE,
    Permission.API_KEY_DELETE,
    Permission.WEBHOOK_CREATE,
    Permission.WEBHOOK_READ,
    Permission.WEBHOOK_UPDATE,
    Permission.WEBHOOK_DELETE,
    Permission.WEBHOOK_RESEND,
    Permission.DEVELOPER_API_ACCESS,
    Permission.DEVELOPER_WEBHOOK_MANAGE,
    Permission.DEVELOPER_TEST_MODE,
  ],

  [UserRole.SUPER_ADMIN]: [
    // All permissions including full system control
    ...Object.values(Permission),
  ],
};

/**
 * Permission categories for organizing and grouping permissions
 */
export const PERMISSION_CATEGORIES: Record<string, Permission[]> = {
  payments: [
    Permission.PAYMENT_CREATE,
    Permission.PAYMENT_READ,
    Permission.PAYMENT_UPDATE,
    Permission.PAYMENT_DELETE,
    Permission.PAYMENT_REFUND,
  ],
  customers: [
    Permission.CUSTOMER_CREATE,
    Permission.CUSTOMER_READ,
    Permission.CUSTOMER_UPDATE,
    Permission.CUSTOMER_DELETE,
  ],
  subscriptions: [
    Permission.SUBSCRIPTION_CREATE,
    Permission.SUBSCRIPTION_READ,
    Permission.SUBSCRIPTION_UPDATE,
    Permission.SUBSCRIPTION_DELETE,
    Permission.SUBSCRIPTION_CANCEL,
  ],
  merchants: [
    Permission.MERCHANT_CREATE,
    Permission.MERCHANT_READ,
    Permission.MERCHANT_UPDATE,
    Permission.MERCHANT_DELETE,
    Permission.MERCHANT_VERIFY,
  ],
  admin: [
    Permission.ADMIN_USER_MANAGE,
    Permission.ADMIN_ROLE_MANAGE,
    Permission.ADMIN_SYSTEM_CONFIG,
    Permission.ADMIN_AUDIT_LOGS,
    Permission.ADMIN_ANALYTICS,
  ],
  developer: [
    Permission.DEVELOPER_API_ACCESS,
    Permission.DEVELOPER_WEBHOOK_MANAGE,
    Permission.DEVELOPER_SDK_ACCESS,
    Permission.DEVELOPER_TEST_MODE,
  ],
  api: [
    Permission.API_KEY_CREATE,
    Permission.API_KEY_READ,
    Permission.API_KEY_UPDATE,
    Permission.API_KEY_DELETE,
  ],
  webhooks: [
    Permission.WEBHOOK_CREATE,
    Permission.WEBHOOK_READ,
    Permission.WEBHOOK_UPDATE,
    Permission.WEBHOOK_DELETE,
    Permission.WEBHOOK_RESEND,
  ],
};

/**
 * Role hierarchy for inheritance and escalation
 * Higher roles inherit all permissions from lower roles
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.GUEST]: 0,
  [UserRole.USER]: 1,
  [UserRole.MERCHANT]: 2,
  [UserRole.DEVELOPER]: 2,
  [UserRole.ADMIN]: 3,
  [UserRole.SUPER_ADMIN]: 4,
};

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export function roleHasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => roleHasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function roleHasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => roleHasPermission(role, permission));
}

/**
 * Check if one role has higher or equal hierarchy level than another
 */
export function isRoleHigherOrEqual(currentRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY[targetRole];
}

/**
 * Get all permissions for a role including inherited permissions
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * Check if a role can manage another role
 */
export function canManageRole(managerRole: UserRole, targetRole: UserRole): boolean {
  return isRoleHigherOrEqual(managerRole, targetRole) && managerRole !== targetRole;
}
