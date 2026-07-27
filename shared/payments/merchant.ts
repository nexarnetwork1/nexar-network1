// Merchant branding and information architecture
// This file defines merchant-related types without implementing business logic

import { generateUUID } from '../utils/uuid';

/**
 * Merchant verification status
 */
export enum MerchantVerificationStatus {
  UNVERIFIED = 'unverified',
  PENDING = 'pending',
  VERIFIED = 'verified',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected',
}

/**
 * Merchant tier
 */
export enum MerchantTier {
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

/**
 * Merchant branding configuration
 */
export interface MerchantBranding {
  merchantId: string;
  merchantName: string;
  merchantLogo?: string;
  merchantWebsite?: string;
  merchantSupportEmail?: string;
  merchantDescription?: string;
  merchantPhone?: string;
  businessAddress?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    facebook?: string;
  };
  customColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  customDomain?: string;
  favicon?: string;
}

/**
 * Merchant information
 */
export interface Merchant {
  id: string;
  userId: string;
  branding: MerchantBranding;
  verificationStatus: MerchantVerificationStatus;
  tier: MerchantTier;
  createdAt: Date;
  updatedAt: Date;
  verifiedAt?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Public merchant information (safe to expose)
 */
export interface PublicMerchantInfo {
  merchantId: string;
  merchantName: string;
  merchantLogo?: string;
  merchantWebsite?: string;
  isVerified: boolean;
  tier: MerchantTier;
  supportEmail?: string;
}

/**
 * Merchant wallet configuration
 */
export interface MerchantWallet {
  merchantId: string;
  walletAddress: string;
  network: string;
  label?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Merchant payment configuration
 */
export interface MerchantPaymentConfig {
  merchantId: string;
  acceptedCurrencies: string[];
  acceptedNetworks: string[];
  defaultCurrency: string;
  defaultNetwork: string;
  sessionTimeout: number; // in minutes
  webhookUrl?: string;
  webhookSecret?: string;
  returnUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Merchant statistics
 */
export interface MerchantStats {
  merchantId: string;
  totalTransactions: number;
  totalVolume: number;
  successfulTransactions: number;
  failedTransactions: number;
  averageTransactionValue: number;
  firstTransactionDate?: Date;
  lastTransactionDate?: Date;
  monthlyVolume?: Record<string, number>;
  currencyBreakdown?: Record<string, number>;
}

/**
 * Merchant branding service interface
 */
export interface IMerchantBrandingService {
  getMerchantBranding(merchantId: string): Promise<MerchantBranding | null>;
  updateMerchantBranding(merchantId: string, branding: Partial<MerchantBranding>): Promise<MerchantBranding>;
  getPublicMerchantInfo(merchantId: string): Promise<PublicMerchantInfo | null>;
  verifyMerchant(merchantId: string): Promise<Merchant>;
  updateMerchantTier(merchantId: string, tier: MerchantTier): Promise<Merchant>;
}

/**
 * Merchant wallet service interface
 */
export interface IMerchantWalletService {
  addMerchantWallet(wallet: Omit<MerchantWallet, 'merchantId' | 'createdAt' | 'updatedAt'>): Promise<MerchantWallet>;
  getMerchantWallets(merchantId: string): Promise<MerchantWallet[]>;
  getDefaultWallet(merchantId: string, network: string): Promise<MerchantWallet | null>;
  removeMerchantWallet(walletId: string): Promise<void>;
}

/**
 * Convert merchant to public info
 */
export function toPublicMerchantInfo(merchant: Merchant): PublicMerchantInfo {
  return {
    merchantId: merchant.id,
    merchantName: merchant.branding.merchantName,
    merchantLogo: merchant.branding.merchantLogo,
    merchantWebsite: merchant.branding.merchantWebsite,
    isVerified: merchant.verificationStatus === MerchantVerificationStatus.VERIFIED,
    tier: merchant.tier,
    supportEmail: merchant.branding.merchantSupportEmail,
  };
}

/**
 * Generate merchant ID
 */
export function generateMerchantId(): string {
  return `merchant_${generateUUID()}`;
}

/**
 * Validate merchant branding
 */
export function validateMerchantBranding(branding: Partial<MerchantBranding>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!branding.merchantName || branding.merchantName.trim().length === 0) {
    errors.push('Merchant name is required');
  }
  
  if (branding.merchantWebsite && !isValidUrl(branding.merchantWebsite)) {
    errors.push('Invalid merchant website URL');
  }
  
  if (branding.merchantSupportEmail && !isValidEmail(branding.merchantSupportEmail)) {
    errors.push('Invalid support email address');
  }
  
  if (branding.customColors) {
    if (branding.customColors.primary && !isValidHexColor(branding.customColors.primary)) {
      errors.push('Invalid primary color format');
    }
    if (branding.customColors.secondary && !isValidHexColor(branding.customColors.secondary)) {
      errors.push('Invalid secondary color format');
    }
    if (branding.customColors.accent && !isValidHexColor(branding.customColors.accent)) {
      errors.push('Invalid accent color format');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * URL validation helper
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Email validation helper
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Hex color validation helper
 */
function isValidHexColor(color: string): boolean {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
}
