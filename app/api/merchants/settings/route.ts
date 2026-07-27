// ============================================================
// NEXAR NETWORK - MERCHANT SETTINGS API
// Phase 5: Core Platform Implementation
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withLogging, isErrorResponse } from '@/lib/auth/middleware';
import { merchantService, loggingService } from '@/lib/database';
import { ValidationService, SanitizationService } from '@/lib/auth';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      business_name,
      business_type,
      business_email,
      business_phone,
    } = body;

    // Update merchant basic info
    const updatedMerchant = await merchantService.updateMerchant(merchant.id, {
      business_name: business_name || undefined,
      business_type: business_type || undefined,
      support_email: business_email || undefined,
      support_phone: business_phone || undefined,
    });

    return NextResponse.json({
      success: true,
      merchant: updatedMerchant,
    });

  } catch (error) {
    await loggingService.createSystemLog({
      level: 'error',
      category: 'merchant',
      message: `Merchant profile update error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const {
      auto_settlement,
      settlement_frequency,
      minimum_settlement_amount,
      require_email_confirmation,
      require_phone_confirmation,
      allow_partial_payments,
      payment_timeout_minutes,
      max_invoice_amount,
      notification_enabled,
      notification_methods,
    } = body;

    // Validate settlement frequency
    if (settlement_frequency && !['daily', 'weekly', 'monthly'].includes(settlement_frequency)) {
      return NextResponse.json(
        { error: 'Invalid settlement frequency' },
        { status: 400 }
      );
    }

    // Validate payment timeout
    if (payment_timeout_minutes && (payment_timeout_minutes < 5 || payment_timeout_minutes > 1440)) {
      return NextResponse.json(
        { error: 'Payment timeout must be between 5 and 1440 minutes' },
        { status: 400 }
      );
    }

    // Validate max invoice amount
    if (max_invoice_amount && (max_invoice_amount < 0 || max_invoice_amount > 10000000)) {
      return NextResponse.json(
        { error: 'Max invoice amount must be between 0 and 10,000,000' },
        { status: 400 }
      );
    }

    // Sanitize and update settings
    const settings = await merchantService.updateMerchantSettings(merchant.id, {
      auto_settlement: auto_settlement !== undefined ? auto_settlement : undefined,
      settlement_frequency: settlement_frequency || undefined,
      minimum_settlement_amount: minimum_settlement_amount || undefined,
      require_email_confirmation: require_email_confirmation !== undefined ? require_email_confirmation : undefined,
      require_phone_confirmation: require_phone_confirmation !== undefined ? require_phone_confirmation : undefined,
      allow_partial_payments: allow_partial_payments !== undefined ? allow_partial_payments : undefined,
      payment_timeout_minutes: payment_timeout_minutes || undefined,
      max_invoice_amount: max_invoice_amount || undefined,
      notification_enabled: notification_enabled !== undefined ? notification_enabled : undefined,
      notification_methods: notification_methods || undefined,
    });

    // Log audit event
    await withLogging(request, 'merchant_settings_updated', 'merchant_settings', settings.id);

    return NextResponse.json({
      success: true,
      settings,
    });

  } catch (error) {
    await loggingService.createSystemLog({
      level: 'error',
      category: 'merchant',
      message: `Merchant settings update error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
