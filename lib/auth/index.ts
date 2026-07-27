// ============================================================
// NEXAR NETWORK - AUTHENTICATION & SECURITY SERVICE
// Phase 5: Core Platform Implementation
// ============================================================

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { userService, sessionService, apiKeyService, loggingService } from '@/lib/database';
import type { User, Session, ApiKey } from '@/types/database';

// ============================================================
// PASSWORD HASHING
// ============================================================

export class PasswordService {
  private static SALT_ROUNDS = 12;

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateSecureToken(length = 32): string {
    if (typeof crypto !== 'undefined' && crypto.randomBytes) {
      return crypto.randomBytes(length).toString('hex');
    } else if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(length);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    } else {
      // Fallback for environments without crypto
      return Array.from({ length }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
    }
  }
}

// ============================================================
// JWT TOKEN SERVICE
// ============================================================

export class TokenService {
  private static SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  private static ALGORITHM = 'HS256';

  static async generateToken(payload: {
    userId: string;
    merchantId?: string;
    type: 'access' | 'refresh' | 'email_verification' | 'password_reset';
  }): Promise<string> {
    const header = {
      alg: this.ALGORITHM,
      typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const exp = payload.type === 'access' ? now + 3600 : // 1 hour
               payload.type === 'refresh' ? now + 86400 * 7 : // 7 days
               payload.type === 'email_verification' ? now + 86400 : // 24 hours
               now + 3600; // password reset: 1 hour

    const tokenPayload = {
      ...payload,
      iat: now,
      exp,
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(tokenPayload));
    const signature = crypto
      .createHmac('sha256', this.SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  static async verifyToken(token: string): Promise<any> {
    try {
      const [encodedHeader, encodedPayload, signature] = token.split('.');
      
      if (!encodedHeader || !encodedPayload || !signature) {
        throw new Error('Invalid token format');
      }

      const expectedSignature = crypto
        .createHmac('sha256', this.SECRET)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64url');

      if (signature !== expectedSignature) {
        throw new Error('Invalid signature');
      }

      const payload = JSON.parse(this.base64UrlDecode(encodedPayload));

      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired');
      }

      return payload;
    } catch (error) {
      throw new Error('Token verification failed');
    }
  }

  private static base64UrlEncode(str: string): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private static base64UrlDecode(str: string): string {
    return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString();
  }
}

// ============================================================
// API KEY SERVICE
// ============================================================

export class ApiKeyGenerator {
  private static PREFIX_LENGTH = 8;
  private static KEY_LENGTH = 32;

  static generateApiKey(): { key: string; prefix: string; hash: string } {
    const prefix = crypto.randomBytes(this.PREFIX_LENGTH).toString('hex').substring(0, this.PREFIX_LENGTH);
    const keyPart = crypto.randomBytes(this.KEY_LENGTH).toString('hex');
    const key = `nxr_${prefix}_${keyPart}`;
    const hash = crypto.createHash('sha256').update(key).digest('hex');

    return { key, prefix, hash };
  }

  static hashApiKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }
}

// ============================================================
// AUTHENTICATION SERVICE
// ============================================================

export class AuthService {
  static async registerUser(data: {
    email: string;
    password: string;
    full_name?: string;
  }): Promise<{ user: User; session: Session }> {
    // Check if user already exists
    const existingUser = await userService.getUserByEmail(data.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const password_hash = await PasswordService.hashPassword(data.password);

    // Create user
    const user = await userService.createUser({
      email: data.email,
      password_hash,
      full_name: data.full_name,
    });

    // Create session
    const token = PasswordService.generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const session = await sessionService.createSession({
      user_id: user.id,
      token,
      expires_at: expiresAt.toISOString(),
    });

    // Log audit
    await loggingService.createAuditLog({
      user_id: user.id,
      action: 'user_registered',
      entity_type: 'user',
      entity_id: user.id,
    });

    return { user, session };
  }

  static async loginUser(data: {
    email: string;
    password: string;
    ip_address?: string;
    user_agent?: string;
  }): Promise<{ user: User; session: Session }> {
    // Get user
    const user = await userService.getUserByEmail(data.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await PasswordService.verifyPassword(data.password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new Error('Account is disabled');
    }

    // Create session
    const token = PasswordService.generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const session = await sessionService.createSession({
      user_id: user.id,
      token,
      expires_at: expiresAt.toISOString(),
      ip_address: data.ip_address,
      user_agent: data.user_agent,
    });

    // Update last login
    await userService.updateLastLogin(user.id);

    // Log audit
    await loggingService.createAuditLog({
      user_id: user.id,
      action: 'user_logged_in',
      entity_type: 'user',
      entity_id: user.id,
      ip_address: data.ip_address,
      user_agent: data.user_agent,
    });

    return { user, session };
  }

  static async logoutUser(sessionId: string): Promise<void> {
    await sessionService.deleteSession(sessionId);
  }

  static async validateSession(token: string): Promise<{ user: User; session: Session } | null> {
    const session = await sessionService.getSessionByToken(token);
    if (!session) return null;

    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      await sessionService.deleteSession(session.id);
      return null;
    }

    const user = await userService.getUserById(session.user_id);
    if (!user || !user.is_active) return null;

    return { user, session };
  }

  static async refreshSession(refreshToken: string): Promise<Session | null> {
    // Verify refresh token
    const payload = await TokenService.verifyToken(refreshToken);
    if (payload.type !== 'refresh') {
      throw new Error('Invalid refresh token');
    }

    // Get user
    const user = await userService.getUserById(payload.userId);
    if (!user || !user.is_active) return null;

    // Create new session
    const token = PasswordService.generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const session = await sessionService.createSession({
      user_id: user.id,
      token,
      expires_at: expiresAt.toISOString(),
    });

    return session;
  }
}

// ============================================================
// MIDDLEWARE & VALIDATION
// ============================================================

export class ValidationService {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static validateMerchantName(name: string): boolean {
    return name.length >= 2 && name.length <= 255;
  }

  static validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static validateCurrency(currency: string): boolean {
    const supportedCurrencies = ['NXR', 'BNB', 'USDT', 'USDC', 'BTC', 'ETH', 'USD'];
    return supportedCurrencies.includes(currency.toUpperCase());
  }

  static validateAmount(amount: number): boolean {
    return amount > 0 && amount <= 1000000;
  }
}

// ============================================================
// RATE LIMITING
// ============================================================

export class RateLimiter {
  private static requests = new Map<string, { count: number; resetTime: number }>();
  private static DEFAULT_LIMIT = 100; // requests per window
  private static WINDOW_MS = 60000; // 1 minute

  static checkLimit(
    identifier: string,
    limit: number = this.DEFAULT_LIMIT,
    windowMs: number = this.WINDOW_MS
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const data = this.requests.get(identifier);

    if (!data || now > data.resetTime) {
      // Create new window
      const resetTime = now + windowMs;
      this.requests.set(identifier, { count: 1, resetTime });
      return { allowed: true, remaining: limit - 1, resetTime };
    }

    if (data.count >= limit) {
      return { allowed: false, remaining: 0, resetTime: data.resetTime };
    }

    data.count++;
    return { allowed: true, remaining: limit - data.count, resetTime: data.resetTime };
  }

  static cleanup(): void {
    const now = Date.now();
    for (const [key, data] of this.requests.entries()) {
      if (now > data.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// ============================================================
// PERMISSION SYSTEM
// ============================================================

export class PermissionService {
  private static PERMISSIONS = {
    read: ['read'],
    write: ['read', 'write'],
    admin: ['read', 'write', 'admin'],
  };

  static hasPermission(apiKey: ApiKey, requiredPermission: string): boolean {
    if (!apiKey.is_active) return false;
    if (!apiKey.permissions) return false;

    const userPermissions = apiKey.permissions;
    return userPermissions.includes(requiredPermission) || userPermissions.includes('admin');
  }

  static canRead(apiKey: ApiKey): boolean {
    return this.hasPermission(apiKey, 'read');
  }

  static canWrite(apiKey: ApiKey): boolean {
    return this.hasPermission(apiKey, 'write');
  }

  static canAdmin(apiKey: ApiKey): boolean {
    return this.hasPermission(apiKey, 'admin');
  }
}

// ============================================================
// INPUT SANITIZATION
// ============================================================

export class SanitizationService {
  static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '')
      .substring(0, 1000);
  }

  static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  static sanitizeNumber(input: any): number {
    const num = parseFloat(input);
    return isNaN(num) ? 0 : num;
  }

  static sanitizeCurrency(currency: string): string {
    return currency.toUpperCase().trim().substring(0, 10);
  }
}

// ============================================================
// IP ADDRESS UTILITIES
// ============================================================

export class IpService {
  static getClientIp(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIp) {
      return realIp;
    }

    return 'unknown';
  }

  static isValidIp(ip: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }
}

// ============================================================
// EXPORTS
// ============================================================

