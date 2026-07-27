// ============================================================
// NEXAR NETWORK - INVOICE API
// Phase 5: Core Platform Implementation
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateMerchant,
  withLogging,
  withRateLimit,
  isErrorResponse,
} from '@/lib/auth/middleware';
import { loggingService } from '@/lib/database';
import { InvoiceEngine } from '@/lib/services/invoice.service';
import type { CreateInvoiceRequest } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateMerchant(request);
    if (isErrorResponse(auth)) return auth;

    const rateLimitResult = await withRateLimit(request, 'invoice_create', 50);
    if (rateLimitResult) return rateLimitResult;

    const body = await request.json();
    const {
      customer_id,
      customer_email,
      description,
      amount,
      currency,
      items,
      expires_in,
      metadata,
    } = body;

    if (!amount) {
      return NextResponse.json(
        { error: 'Amount is required' },
        { status: 400 }
      );
    }

    const invoiceData: CreateInvoiceRequest = {
      customer_id,
      customer_email,
      description,
      amount: parseFloat(amount),
      currency: currency || 'USD',
      items,
      expires_in,
      metadata,
    };

    const { invoice, qrCodeUrl, paymentUrl } = await InvoiceEngine.createInvoice(
      auth.merchantId,
      invoiceData
    );

    await withLogging(request, 'invoice_created', 'invoice', invoice.id, {
      userId: auth.userId,
      merchantId: auth.merchantId,
    });

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        description: invoice.description,
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status,
        payment_url: paymentUrl,
        qr_code_url: qrCodeUrl,
        expires_at: invoice.expires_at,
        created_at: invoice.created_at,
      },
    }, { status: 201 });

  } catch (error) {
    await loggingService.createSystemLog({
      level: 'error',
      category: 'invoice',
      message: `Invoice creation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateMerchant(request);
    if (isErrorResponse(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const invoices = await InvoiceEngine.getInvoicesByMerchant(
      auth.merchantId,
      status,
      limit,
      offset
    );

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
    await loggingService.createSystemLog({
      level: 'error',
      category: 'invoice',
      message: `Invoices retrieval error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
