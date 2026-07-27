// ============================================================
// NEXAR NETWORK - ADMIN PAYMENT MANAGEMENT API
// Phase 5: Core Platform Implementation
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { merchantService } from '@/lib/database';
import { withAdminAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = await withAdminAuth(request);
    if (authResult) return authResult;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get all payments (admin view)
    let payments = await merchantService.getAllPayments(limit, offset);
    
    // Filter by status if provided
    if (status) {
      payments = payments.filter(p => p.status === status);
    }

    return NextResponse.json({
      success: true,
      payments,
      pagination: {
        limit,
        offset,
        total: payments.length,
      },
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
