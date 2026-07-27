// ============================================================
// NEXAR NETWORK - INDIVIDUAL INVOICE API
// Phase 5: Core Platform Implementation
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateMerchant,
  withAuth,
  withLogging,
  isErrorResponse,
} from '@/lib/auth/middleware';
import { merchantService } from '@/lib/database';
import { InvoiceEngine } from '@/lib/services/invoice.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const auth = await authenticateMerchant(request);
    if (isErrorResponse(auth)) return auth;

    const invoice = await InvoiceEngine.getInvoice(id);
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    if (invoice.merchant_id !== auth.merchantId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      invoice,
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const authResult = await withAuth(request);
    if (isErrorResponse(authResult)) return authResult;

    const merchant = await merchantService.getMerchantByUserId(authResult.userId);
    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    const invoice = await InvoiceEngine.getInvoice(id);
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    if (invoice.merchant_id !== merchant.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, reason } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'paid', 'expired', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    let updatedInvoice;
    if (status === 'cancelled') {
      updatedInvoice = await InvoiceEngine.cancelInvoice(id, reason);
    } else if (status === 'refunded') {
      updatedInvoice = await InvoiceEngine.refundInvoice(id);
    } else {
      updatedInvoice = await InvoiceEngine.updateInvoiceStatus(
        id,
        status as 'pending' | 'paid' | 'expired' | 'cancelled' | 'refunded'
      );
    }

    await withLogging(request, 'invoice_status_updated', 'invoice', id, {
      userId: authResult.userId,
      merchantId: merchant.id,
    });

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
