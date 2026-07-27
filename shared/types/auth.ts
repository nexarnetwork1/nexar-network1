// Authentication and authorization types for Nexar Network platform

/**
 * User roles in the system
 * Each role has specific permissions and access levels
 */
export enum UserRole {
  GUEST = 'guest',
  USER = 'user',
  MERCHANT = 'merchant',
  DEVELOPER = 'developer',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

/**
 * User status for account management
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
  DELETED = 'deleted',
}

/**
 * Authentication provider types
 */
export enum AuthProvider {
  PRIVY = 'privy',           // Current Web3 auth
  SUPABASE = 'supabase',     // Current CMS auth
  EMAIL_PASSWORD = 'email_password',
  OAUTH = 'oauth',
  WALLET = 'wallet',
}

/**
 * Permission categories for organizing access control
 */
export enum PermissionCategory {
  PAYMENT_READ = 'payment_read',
  PAYMENT_WRITE = 'payment_write',
  CUSTOMER_READ = 'customer_read',
  CUSTOMER_WRITE = 'customer_write',
  SUBSCRIPTION_READ = 'subscription_read',
  SUBSCRIPTION_WRITE = 'subscription_write',
  MERCHANT_READ = 'merchant_read',
  MERCHANT_WRITE = 'merchant_write',
  ADMIN_READ = 'admin_read',
  ADMIN_WRITE = 'admin_write',
  DEVELOPER_READ = 'developer_read',
  DEVELOPER_WRITE = 'developer_write',
  API_ACCESS = 'api_access',
  WEBHOOK_MANAGE = 'webhook_manage',
}

/**
 * Specific permissions within categories
 */
export enum Permission {
  // Payment permissions
  PAYMENT_CREATE = 'payment:create',
  PAYMENT_READ = 'payment:read',
  PAYMENT_UPDATE = 'payment:update',
  PAYMENT_DELETE = 'payment:delete',
  PAYMENT_REFUND = 'payment:refund',
  
  // Customer permissions
  CUSTOMER_CREATE = 'customer:create',
  CUSTOMER_READ = 'customer:read',
  CUSTOMER_UPDATE = 'customer:update',
  CUSTOMER_DELETE = 'customer:delete',
  
  // Subscription permissions
  SUBSCRIPTION_CREATE = 'subscription:create',
  SUBSCRIPTION_READ = 'subscription:read',
  SUBSCRIPTION_UPDATE = 'subscription:update',
  SUBSCRIPTION_DELETE = 'subscription:delete',
  SUBSCRIPTION_CANCEL = 'subscription:cancel',
  
  // Merchant permissions
  MERCHANT_CREATE = 'merchant:create',
  MERCHANT_READ = 'merchant:read',
  MERCHANT_UPDATE = 'merchant:update',
  MERCHANT_DELETE = 'merchant:delete',
  MERCHANT_VERIFY = 'merchant:verify',
  
  // Admin permissions
  ADMIN_USER_MANAGE = 'admin:user_manage',
  ADMIN_ROLE_MANAGE = 'admin:role_manage',
  ADMIN_SYSTEM_CONFIG = 'admin:system_config',
  ADMIN_AUDIT_LOGS = 'admin:audit_logs',
  ADMIN_ANALYTICS = 'admin:analytics',
  
  // Developer permissions
  DEVELOPER_API_ACCESS = 'developer:api_access',
  DEVELOPER_WEBHOOK_MANAGE = 'developer:webhook_manage',
  DEVELOPER_SDK_ACCESS = 'developer:sdk_access',
  DEVELOPER_TEST_MODE = 'developer:test_mode',
  
  // API permissions
  API_KEY_CREATE = 'api_key:create',
  API_KEY_READ = 'api_key:read',
  API_KEY_UPDATE = 'api_key:update',
  API_KEY_DELETE = 'api_key:delete',
  
  // Webhook permissions
  WEBHOOK_CREATE = 'webhook:create',
  WEBHOOK_READ = 'webhook:read',
  WEBHOOK_UPDATE = 'webhook:update',
  WEBHOOK_DELETE = 'webhook:delete',
  WEBHOOK_RESEND = 'webhook:resend',
}

/**
 * User authentication session information
 */
export interface AuthSession {
  userId: string;
  email?: string;
  walletAddress?: string;
  role: UserRole;
  permissions: Permission[];
  provider: AuthProvider;
  expiresAt: Date;
  createdAt: Date;
  metadata?: Record<string, any>;
}

/**
 * User profile information
 */
export interface UserProfile {
  id: string;
  email?: string;
  walletAddress?: string;
  role: UserRole;
  status: UserStatus;
  provider: AuthProvider;
  merchantId?: string;
  developerId?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Authentication context for the application
 */
export interface AuthContext {
  session: AuthSession | null;
  user: UserProfile | null;
  loading: boolean;
  error: Error | null;
  
  // Authentication methods
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  
  // Authorization methods
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
}

/**
 * Route protection configuration
 */
export interface RouteProtection {
  requiredRole?: UserRole;
  requiredPermissions?: Permission[];
  requireAuth?: boolean;
  redirectPath?: string;
}

/**
 * Authentication error types
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class PermissionError extends Error {
  constructor(
    message: string,
    public requiredPermission: Permission,
    public statusCode: number = 403
  ) {
    super(message);
    this.name = 'PermissionError';
  }
}

/**
 * Session refresh response
 */
export interface SessionRefreshResponse {
  session: AuthSession;
  refreshToken?: string;
  expiresAt: Date;
}

/**
 * Login credentials interface
 */
export interface LoginCredentials {
  provider: AuthProvider;
  email?: string;
  password?: string;
  walletAddress?: string;
  signature?: string;
  message?: string;
}

/**
 * Registration data interface
 */
export interface RegistrationData {
  email: string;
  password?: string;
  walletAddress?: string;
  role?: UserRole;
  metadata?: Record<string, any>;
}

/**
 * API key information
 */
export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  permissions: Permission[];
  lastUsed?: Date;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
}

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  id: string;
  userId: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
