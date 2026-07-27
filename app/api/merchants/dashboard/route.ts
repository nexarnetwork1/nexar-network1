// ============================================================
// NEXAR NETWORK - MERCHANT DASHBOARD API
// Phase 5: Core Platform Implementation
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, isErrorResponse } from '@/lib/auth/middleware';
import { merchantService, loggingService } from '@/lib/database';

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

    // Get dashboard stats
    const stats = await merchantService.getDashboardStats(merchant.id);

    return NextResponse.json({
      success: true,
      stats,
    });

  } catch (error) {
    await loggingService.createSystemLog({
      level: 'error',
      category: 'merchant',
      message: `Dashboard stats error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
