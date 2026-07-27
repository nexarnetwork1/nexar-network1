// ============================================================
// NEXAR NETWORK - CUSTOMERS API
// Phase 5: Core Platform Implementation
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateMerchant,
  withLogging,
  withRateLimit,
  isErrorResponse,
} from '@/lib/auth/middleware';
import { customerService } from '@/lib/database';
import { SanitizationService, ValidationService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateMerchant(request);
    if (isErrorResponse(auth)) return auth;

    const rateLimitResult = await withRateLimit(request, 'customer_create', 50);
    if (rateLimitResult) return rateLimitResult;

    const body = await request.json();
    const { email, phone, full_name, metadata } = body;

    if (email && !ValidationService.validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const sanitizedData = {
      email: email ? SanitizationService.sanitizeEmail(email) : undefined,
      phone: phone ? SanitizationService.sanitizeString(phone) : undefined,
      full_name: full_name ? SanitizationService.sanitizeString(full_name) : undefined,
      metadata: metadata || undefined,
    };

    const customer = await customerService.createCustomer({
      merchant_id: auth.merchantId,
      ...sanitizedData,
    });

    await withLogging(request, 'customer_created', 'customer', customer.id, {
      userId: auth.userId,
      merchantId: auth.merchantId,
    });

    return NextResponse.json({
      success: true,
      customer,
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
    const auth = await authenticateMerchant(request);
    if (isErrorResponse(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const customers = await customerService.getCustomersByMerchant(
      auth.merchantId,
      limit,
      offset
    );

    return NextResponse.json({
      success: true,
      customers,
      pagination: {
        limit,
        offset,
        total: customers.length,
      },
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
