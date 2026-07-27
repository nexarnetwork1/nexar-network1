// ============================================================
// NEXAR NETWORK - API KEYS MANAGEMENT API
// Phase 5: Core Platform Implementation
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withLogging, withRateLimit, isErrorResponse } from '@/lib/auth/middleware';
import { merchantService, apiKeyService, loggingService } from '@/lib/database';
import { ApiKeyGenerator, SanitizationService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await withRateLimit(request, 'api_key_create', 10);
    if (rateLimitResult) return rateLimitResult;

    // Authentication
    const authResult = await withAuth(request);
    if (isErrorResponse(authResult)) return authResult;

    const userId = authResult.userId;

    // Get merchant
    const merchant = await merchantService.getMerchantByUserId(userId);
    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { key_name, permissions, expires_at } = body;

    // Validate key name
    if (!key_name) {
      return NextResponse.json(
        { error: 'Key name is required' },
        { status: 400 }
      );
    }

    // Sanitize key name
    const sanitizedName = SanitizationService.sanitizeString(key_name);

    // Validate permissions
    if (permissions && !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Permissions must be an array' },
        { status: 400 }
      );
    }

    const validPermissions = ['read', 'write', 'admin'];
    if (permissions) {
      for (const perm of permissions) {
        if (!validPermissions.includes(perm)) {
          return NextResponse.json(
            { error: `Invalid permission: ${perm}` },
            { status: 400 }
          );
        }
      }
    }

    // Generate API key
    const { key, prefix, hash } = ApiKeyGenerator.generateApiKey();

    // Create API key record
    const apiKey = await apiKeyService.createApiKey({
      merchant_id: merchant.id,
      key_name: sanitizedName,
      key_hash: hash,
      key_prefix: prefix,
      permissions: permissions || ['read', 'write'],
      expires_at: expires_at || undefined,
    });

    // Log audit event
    await withLogging(request, 'api_key_created', 'api_key', apiKey.id);

    return NextResponse.json({
      success: true,
      api_key: {
        id: apiKey.id,
        key_name: apiKey.key_name,
        key_prefix: apiKey.key_prefix,
        key: key, // Only return the full key on creation
        permissions: apiKey.permissions,
        is_active: apiKey.is_active,
        expires_at: apiKey.expires_at,
        created_at: apiKey.created_at,
      },
    }, { status: 201 });

  } catch (error) {
    await loggingService.createSystemLog({
      level: 'error',
      category: 'api_key',
      message: `API key creation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const authResult = await withAuth(request);
    if (isErrorResponse(authResult)) return authResult;

    const userId = authResult.userId;

    // Get merchant
    const merchant = await merchantService.getMerchantByUserId(userId);
    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Get API keys
    const apiKeys = await apiKeyService.getApiKeysByMerchant(merchant.id);

    // Return without the actual keys (only prefix)
    const safeApiKeys = apiKeys.map(key => ({
      id: key.id,
      key_name: key.key_name,
      key_prefix: key.key_prefix,
      permissions: key.permissions,
      is_active: key.is_active,
      last_used_at: key.last_used_at,
      expires_at: key.expires_at,
      created_at: key.created_at,
    }));

    return NextResponse.json({
      success: true,
      api_keys: safeApiKeys,
    });

  } catch (error) {
    await loggingService.createSystemLog({
      level: 'error',
      category: 'api_key',
      message: `API keys retrieval error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
