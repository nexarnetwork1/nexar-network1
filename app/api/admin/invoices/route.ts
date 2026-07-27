// ============================================================
// NEXAR NETWORK - ADMIN INVOICE MANAGEMENT API
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

    // Get all invoices (admin view)
    let invoices = await merchantService.getAllInvoices(limit, offset);
    
    // Filter by status if provided
    if (status) {
      invoices = invoices.filter(i => i.status === status);
    }

    return NextResponse.json({
      success: true,
      invoices,
      pagination: {
        limit,
        offset,
        total: invoices.length,
      },
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
