// ============================================================
// NEXAR NETWORK - ENVIRONMENT CONFIGURATION
// Environment variable validation and configuration
// ============================================================

export interface EnvConfig {
  // Supabase
  supabaseUrl: string;
  supabasePublishableKey: string;
  supabaseServiceRoleKey?: string;
  
  // Privy
  privyAppId: string;
  
  // JWT
  jwtSecret: string;
  
  // App
  appUrl: string;
  appName: string;
  
  // Environment
  nodeEnv: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

class EnvValidationError extends Error {
  constructor(message: string, public missingVars: string[]) {
    super(message);
    this.name = 'EnvValidationError';
  }
}

export function validateEnv(): EnvConfig {
  const requiredVars: Record<string, string> = {
    NEXT_PUBLIC_SUPABASE_URL: 'Supabase URL',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'Supabase Publishable Key',
    NEXT_PUBLIC_PRIVY_APP_ID: 'Privy App ID',
  };
  
  const optionalVars: Record<string, string> = {
    JWT_SECRET: 'JWT Secret',
    SUPABASE_SERVICE_ROLE_KEY: 'Supabase Service Role Key',
  };
  
  const missing: string[] = [];
  const config: Record<string, string> = {};
  
  // Check required variables
  for (const [envVar, name] of Object.entries(requiredVars)) {
    const value = process.env[envVar];
    if (!value) {
      missing.push(name);
    } else {
      config[envVar] = value;
    }
  }
  
  // Check optional variables
  for (const [envVar, name] of Object.entries(optionalVars)) {
    const value = process.env[envVar];
    if (value) {
      config[envVar] = value;
    }
  }
  
  if (missing.length > 0) {
    throw new EnvValidationError(
      `Missing required environment variables: ${missing.join(', ')}`,
      missing
    );
  }
  
  // Validate URL format
  try {
    new URL(config.NEXT_PUBLIC_SUPABASE_URL);
  } catch (error) {
    throw new EnvValidationError(
      'NEXT_PUBLIC_SUPABASE_URL must be a valid URL',
      ['NEXT_PUBLIC_SUPABASE_URL']
    );
  }
  
  return {
    supabaseUrl: config.NEXT_PUBLIC_SUPABASE_URL,
    supabasePublishableKey: config.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    supabaseServiceRoleKey: config.SUPABASE_SERVICE_ROLE_KEY,
    privyAppId: config.NEXT_PUBLIC_PRIVY_APP_ID,
    jwtSecret: config.JWT_SECRET,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'Nexar Network',
    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
    isProduction: process.env.NODE_ENV === 'production',
  };
}

// Singleton instance
let envConfig: EnvConfig | null = null;

export function getEnv(): EnvConfig {
  if (!envConfig) {
    envConfig = validateEnv();
  }
  return envConfig;
}

export function hasRequiredEnvVars(): boolean {
  try {
    validateEnv();
    return true;
  } catch (error) {
    if (error instanceof EnvValidationError) {
      console.error('Environment validation failed:', error.message);
    }
    return false;
  }
}

// Lazy initialization that doesn't fail during build time
export function getEnvOptional(): Partial<EnvConfig> {
  try {
    return getEnv();
  } catch (error) {
    // Return partial config during build time
    return {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
      supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
      jwtSecret: process.env.JWT_SECRET,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      appName: process.env.NEXT_PUBLIC_APP_NAME || 'Nexar Network',
      nodeEnv: process.env.NODE_ENV || 'development',
      isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
      isProduction: process.env.NODE_ENV === 'production',
    };
  }
}