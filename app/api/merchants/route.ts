// ============================================================
// NEXAR NETWORK - MERCHANT API
// Phase 5: Core Platform Implementation
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withLogging, withRateLimit, isErrorResponse } from '@/lib/auth/middleware';
import { merchantService, loggingService } from '@/lib/database';
import { ValidationService, SanitizationService } from '@/lib/auth';
import type { CreateMerchantRequest } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await withRateLimit(request, 'merchant_create', 5);
    if (rateLimitResult) return rateLimitResult;

    // Authentication
    const authResult = await withAuth(request);
    if (isErrorResponse(authResult)) return authResult;

    const userId = authResult.userId;

    // Check if merchant already exists
    const existingMerchant = await merchantService.getMerchantByUserId(userId);
    if (existingMerchant) {
      return NextResponse.json(
        { error: 'Merchant already exists for this user' },
        { status: 409 }
      );
    }

    const body = await request.json();
    const {
      business_name,
      business_type,
      tax_id,
      website_url,
      description,
      support_email,
      support_phone,
    } = body;

    // Validate required fields
    if (!business_name) {
      return NextResponse.json(
        { error: 'Business name is required' },
        { status: 400 }
      );
    }

    // Validate business name
    if (!ValidationService.validateMerchantName(business_name)) {
      return NextResponse.json(
        { error: 'Business name must be between 2 and 255 characters' },
        { status: 400 }
      );
    }

    // Validate website URL if provided
    if (website_url && !ValidationService.validateUrl(website_url)) {
      return NextResponse.json(
        { error: 'Invalid website URL' },
        { status: 400 }
      );
    }

    // Validate email if provided
    if (support_email && !ValidationService.validateEmail(support_email)) {
      return NextResponse.json(
        { error: 'Invalid support email' },
        { status: 400 }
      );
    }

    // Sanitize input
    const merchantData: CreateMerchantRequest = {
      business_name: SanitizationService.sanitizeString(business_name),
      business_type: business_type ? SanitizationService.sanitizeString(business_type) : undefined,
      tax_id: tax_id ? SanitizationService.sanitizeString(tax_id) : undefined,
      website_url: website_url ? SanitizationService.sanitizeString(website_url) : undefined,
      description: description ? SanitizationService.sanitizeString(description) : undefined,
      support_email: support_email ? SanitizationService.sanitizeEmail(support_email) : undefined,
      support_phone: support_phone ? SanitizationService.sanitizeString(support_phone) : undefined,
    };

    // Create merchant
    const merchant = await merchantService.createMerchant(userId, merchantData);

    // Log audit event
    await withLogging(request, 'merchant_created', 'merchant', merchant.id);

    return NextResponse.json({
      success: true,
      merchant: {
        id: merchant.id,
        business_name: merchant.business_name,
        business_type: merchant.business_type,
        status: merchant.status,
        is_verified: merchant.is_verified,
        created_at: merchant.created_at,
      },
    }, { status: 201 });

  } catch (error) {
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

    // Get merchant settings
    const settings = await merchantService.getMerchantSettings(merchant.id);

    return NextResponse.json({
      success: true,
      merchant: {
        id: merchant.id,
        business_name: merchant.business_name,
        business_type: merchant.business_type,
        tax_id: merchant.tax_id,
        website_url: merchant.website_url,
        logo_url: merchant.logo_url,
        description: merchant.description,
        status: merchant.status,
        is_verified: merchant.is_verified,
        settlement_currency: merchant.settlement_currency,
        webhook_url: merchant.webhook_url,
        support_email: merchant.support_email,
        support_phone: merchant.support_phone,
        created_at: merchant.created_at,
        updated_at: merchant.updated_at,
        settings,
      },
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
