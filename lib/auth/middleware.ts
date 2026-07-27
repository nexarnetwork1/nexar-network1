// ============================================================
// NEXAR NETWORK - AUTHENTICATION MIDDLEWARE
// Phase 5: Core Platform Implementation
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { AuthService, RateLimiter, IpService } from '@/lib/auth';
import { apiKeyService, loggingService, merchantService } from '@/lib/database';
import {
  addSecurityHeaders,
  createErrorResponse,
} from '@/lib/middleware';
import { AuthenticationError } from '@/lib/errors';

export interface AuthContext {
  userId: string;
  sessionId: string;
}

export interface ApiKeyContext {
  merchantId: string;
}

export interface MerchantAuthContext {
  merchantId: string;
  userId?: string;
  sessionId?: string;
  authMethod: 'api_key' | 'session';
}

export function isErrorResponse(result: unknown): result is NextResponse {
  return result instanceof NextResponse;
}

export async function withAuth(
  request: NextRequest
): Promise<NextResponse | AuthContext> {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Authorization header required');
    }

    const token = authHeader.substring(7);
    const sessionData = await AuthService.validateSession(token);

    if (!sessionData) {
      throw new AuthenticationError('Invalid or expired session');
    }

    return {
      userId: sessionData.user.id,
      sessionId: sessionData.session.id,
    };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return createErrorResponse(error.message, error.statusCode, error.code);
    }
    return createErrorResponse('Authentication failed', 401, 'AUTH_ERROR');
  }
}

export async function withApiKey(
  request: NextRequest
): Promise<NextResponse | ApiKeyContext | null> {
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey) {
    return null;
  }

  try {
    const crypto = require('crypto');
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const validKey = await apiKeyService.validateApiKey(keyHash);

    if (!validKey) {
      throw new AuthenticationError('Invalid or expired API key');
    }

    await apiKeyService.updateApiKeyLastUsed(validKey.id);

    return { merchantId: validKey.merchant_id };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return createErrorResponse(error.message, error.statusCode, error.code);
    }
    return createErrorResponse('API key validation failed', 401, 'API_KEY_ERROR');
  }
}

export async function authenticateMerchant(
  request: NextRequest
): Promise<NextResponse | MerchantAuthContext> {
  const apiKeyResult = await withApiKey(request);
  if (isErrorResponse(apiKeyResult)) {
    return apiKeyResult;
  }

  if (apiKeyResult) {
    return {
      authMethod: 'api_key',
      merchantId: apiKeyResult.merchantId,
    };
  }

  const authResult = await withAuth(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const merchant = await merchantService.getMerchantByUserId(authResult.userId);
  if (!merchant) {
    return createErrorResponse('Merchant not found', 404, 'MERCHANT_NOT_FOUND');
  }

  return {
    authMethod: 'session',
    merchantId: merchant.id,
    userId: authResult.userId,
    sessionId: authResult.sessionId,
  };
}

export async function withRateLimit(
  request: NextRequest,
  identifier: string,
  limit: number = 100
): Promise<NextResponse | null> {
  const ip = IpService.getClientIp(request);
  const rateLimitKey = `${identifier}:${ip}`;

  const result = RateLimiter.checkLimit(rateLimitKey, limit);

  if (!result.allowed) {
    const response = NextResponse.json(
      {
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retry_after: new Date(result.resetTime).toISOString(),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString(),
        },
      }
    );
    return addSecurityHeaders(response);
  }

  return null;
}

export async function withLogging(
  request: NextRequest,
  action: string,
  entityType?: string,
  entityId?: string,
  context?: { userId?: string; merchantId?: string }
): Promise<void> {
  try {
    const userId = context?.userId ?? request.headers.get('x-user-id');
    const merchantId = context?.merchantId ?? request.headers.get('x-merchant-id');
    const ip = IpService.getClientIp(request);
    const userAgent = request.headers.get('user-agent');

    await loggingService.createAuditLog({
      user_id: userId || undefined,
      merchant_id: merchantId || undefined,
      action,
      entity_type: entityType,
      entity_id: entityId,
      ip_address: ip,
      user_agent: userAgent || undefined,
    });
  } catch {
    // Logging should not break the request
  }
}

export async function withAdminAuth(request: NextRequest): Promise<NextResponse | null> {
  const adminKey = request.headers.get('x-admin-key');

  if (!adminKey) {
    return createErrorResponse('Admin key required', 401, 'ADMIN_KEY_REQUIRED');
  }

  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return createErrorResponse('Invalid admin key', 403, 'INVALID_ADMIN_KEY');
  }

  return null;
}
