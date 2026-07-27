// ============================================================
// NEXAR NETWORK - ADMIN MERCHANT MANAGEMENT API
// Phase 5: Core Platform Implementation
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { merchantService, loggingService } from '@/lib/database';
import { withAdminAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = await withAdminAuth(request);
    if (authResult) return authResult;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get all merchants (admin view)
    let merchants = await merchantService.getAllMerchants(limit, offset);
    
    // Filter by status if provided
    if (status) {
      merchants = merchants.filter(m => m.status === status);
    }

    return NextResponse.json({
      success: true,
      merchants,
      pagination: {
        limit,
        offset,
        total: merchants.length,
      },
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await withAdminAuth(request);
    if (authResult) return authResult;

    const body = await request.json();
    const { merchant_id, status, is_verified } = body;

    if (!merchant_id) {
      return NextResponse.json(
        { error: 'Merchant ID is required' },
        { status: 400 }
      );
    }

    // Update merchant status
    const merchant = await merchantService.updateMerchant(merchant_id, {
      status: status || undefined,
      is_verified: is_verified !== undefined ? is_verified : undefined,
    });

    // Log admin action
    await loggingService.createAuditLog({
      action: 'admin_merchant_updated',
      entity_type: 'merchant',
      entity_id: merchant_id,
      changes: { status, is_verified },
    });

    return NextResponse.json({
      success: true,
      merchant,
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
